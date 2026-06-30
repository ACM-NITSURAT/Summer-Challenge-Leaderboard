"use client";

import React, { useState } from 'react';
import { ProcessedLeaderboardEntry } from '@/lib/data-utils';

export default function LeaderboardClient({ initialData }: { initialData: ProcessedLeaderboardEntry[] }) {
  const [data] = useState(initialData);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'score' | 'rank' | 'time'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [loadingFlag, setLoadingFlag] = useState<string | null>(null);

  // Filter
  const filtered = data.filter(item => {
    if (item.is_flagged) return false;
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

  const handleFlag = async (hacker: string) => {
    const notes = prompt(`Enter notes for flagging ${hacker} (e.g. Manual code review):`);
    if (notes === null) return; // cancelled

    setLoadingFlag(hacker);
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hacker, isFlagged: true, notes })
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

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          ACM SVNIT Official Leaderboard
        </h1>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search username or school..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-800/50 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField('rank'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>
                Official Rank {sortField === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4">Original Rank</th>
              <th className="p-4">Hacker</th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField('score'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>
                Score {sortField === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortField('time'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>
                Time {sortField === 'time' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sorted.map(entry => (
              <tr key={entry.hacker} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4 font-bold text-lg text-emerald-400">
                  #{entry.official_rank}
                </td>
                <td className="p-4 text-slate-500">#{entry.rank}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={entry.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-slate-700" />
                    <div>
                      <div className="font-semibold">{entry.hacker}</div>
                      {entry.school && <div className="text-xs text-slate-400 truncate max-w-[200px]" title={entry.school}>{entry.school}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono">{entry.score}</td>
                <td className="p-4 font-mono text-slate-400">{entry.time_taken}s</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleFlag(entry.hacker)}
                    disabled={loadingFlag === entry.hacker}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {loadingFlag === entry.hacker ? 'Flagging...' : 'Flag'}
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No matching participants found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
