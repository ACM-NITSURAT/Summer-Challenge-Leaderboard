"use client";

import React, { useState } from 'react';
import { ProcessedLeaderboardEntry } from '@/lib/data-utils';

export default function LeaderboardClient({ initialData, isAdmin = false }: { initialData: ProcessedLeaderboardEntry[], isAdmin?: boolean }) {
  const [data] = useState(initialData);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'score' | 'rank' | 'time'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loadingFlag, setLoadingFlag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter
  const filtered = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return item.hacker.toLowerCase().includes(s) || (item.school && item.school.toLowerCase().includes(s));
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'score') {
      diff = a.score - b.score;
    } else if (sortField === 'rank') {
      diff = a.official_rank - b.official_rank; // lower is better
    } else if (sortField === 'time') {
      diff = a.time_taken - b.time_taken; // lower is better
    }
    return sortDir === 'asc' ? diff : -diff;
  });

  const handleFlag = async (hacker: string, isCurrentlyFlagged: boolean) => {
    if (!isAdmin) return;
    let notes = '';
    if (!isCurrentlyFlagged) {
      const input = prompt(`Enter notes for flagging ${hacker} (e.g. Manual code review):`);
      if (input === null) return; // cancelled
      notes = input;
    } else {
      if (!confirm(`Are you sure you want to unflag ${hacker}?`)) return;
    }

    setLoadingFlag(hacker);
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hacker, isFlagged: !isCurrentlyFlagged, notes })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to update flag");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setLoadingFlag(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 text-slate-100 relative z-10">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Summer Challenge Leaderboard
          </h1>
          <p className="text-slate-400 font-medium">Rankings and submissions for the ACM SVNIT Contest</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative group">
          <input 
            type="text" 
            placeholder="Search hacker or school..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="relative px-5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 w-full md:w-72 shadow-xl backdrop-blur-md transition-all text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900/40 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-widest bg-black/20">
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('rank'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                Rank {sortField === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-5">Hacker</th>
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('score'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                Score {sortField === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('time'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                Time {sortField === 'time' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              {isAdmin && <th className="p-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.map(entry => {
              // Medal logic
              let rankDisplay = `#${entry.official_rank}`;
              let rankStyle = "text-slate-300";
              if (entry.official_rank === 1) { rankDisplay = "🥇 1st"; rankStyle = "text-yellow-400 font-bold"; }
              else if (entry.official_rank === 2) { rankDisplay = "🥈 2nd"; rankStyle = "text-slate-300 font-bold"; }
              else if (entry.official_rank === 3) { rankDisplay = "🥉 3rd"; rankStyle = "text-amber-600 font-bold"; }

              return (
              <tr key={entry.hacker} className={`transition-all duration-200 ${entry.is_flagged ? 'bg-red-950/40 hover:bg-red-900/40' : 'hover:bg-white/5'}`}>
                <td className="p-5 font-bold text-lg whitespace-nowrap">
                  {entry.is_flagged ? <span className="text-red-400 text-xs font-semibold tracking-wider uppercase bg-red-500/10 px-2.5 py-1 border border-red-500/20 rounded-full">Flagged</span> : <span className={rankStyle}>{rankDisplay}</span>}
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={entry.avatar} alt="avatar" className="relative w-10 h-10 rounded-full bg-slate-800 border border-white/10 shadow-lg object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-base">{entry.hacker}</div>
                      {entry.school && <div className="text-xs font-medium text-slate-400 truncate max-w-[200px]" title={entry.school}>{entry.school}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-5 font-mono text-emerald-400 font-semibold text-lg">{entry.score}</td>
                <td className="p-5 font-mono text-slate-400">{entry.time_taken}s</td>
                {isAdmin && (
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleFlag(entry.hacker, entry.is_flagged || false)}
                      disabled={loadingFlag === entry.hacker}
                      className={`px-4 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${entry.is_flagged ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}
                    >
                      {loadingFlag === entry.hacker ? '...' : (entry.is_flagged ? 'Unflag' : 'Flag')}
                    </button>
                  </td>
                )}
              </tr>
            )})}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-400">No matching participants found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex justify-between items-center mt-8 px-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-5 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:hover:bg-slate-900/50 backdrop-blur-md"
          >
            Previous
          </button>
          <span className="px-4 py-1.5 bg-slate-900/50 border border-white/5 rounded-lg text-slate-400 text-sm font-medium backdrop-blur-md shadow-inner">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30 disabled:hover:bg-slate-900/50 backdrop-blur-md"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
