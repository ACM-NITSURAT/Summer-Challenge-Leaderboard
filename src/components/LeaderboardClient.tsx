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
  const [isSyncing, setIsSyncing] = useState(false);
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

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to sync leaderboard");
      } else {
        window.location.reload();
      }
    } catch (e) {
      alert("Error syncing leaderboard");
    } finally {
      setIsSyncing(false);
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
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSyncing ? "Syncing..." : "Refresh"}
          </button>
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

              // Time formatting
              const h = Math.floor(entry.time_taken / 3600);
              const m = Math.floor((entry.time_taken % 3600) / 60);
              const s = entry.time_taken % 60;
              const pad = (num: number) => num.toString().padStart(2, '0');
              const timeDisplay = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

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
                      {entry.is_flagged && entry.notes && (
                        <div className="text-xs font-semibold text-red-400 mt-1.5 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="truncate max-w-[300px]" title={entry.notes}>Reason: {entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-5 font-mono text-emerald-400 font-semibold text-lg">{entry.score}</td>
                <td className="p-5 font-mono text-slate-400">{timeDisplay}</td>
                {isAdmin && (
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleFlag(entry.hacker, entry.is_flagged || false)}
                      disabled={loadingFlag === entry.hacker}
                      className={`px-4 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${entry.is_flagged ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}
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
            className="px-5 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900/50 disabled:cursor-not-allowed backdrop-blur-md"
          >
            Previous
          </button>
          <span className="px-4 py-1.5 bg-slate-900/50 border border-white/5 rounded-lg text-slate-400 text-sm font-medium backdrop-blur-md shadow-inner">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-5 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-900/50 disabled:cursor-not-allowed backdrop-blur-md"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
