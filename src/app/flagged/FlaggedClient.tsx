"use client";

import React, { useState } from 'react';
import { ProcessedLeaderboardEntry } from '@/lib/data-utils';

export default function FlaggedClient({ initialData }: { initialData: ProcessedLeaderboardEntry[] }) {
  const flagged = initialData.filter(d => d.is_flagged);
  const [loading, setLoading] = useState<string | null>(null);

  const handleUnflag = async (hacker: string) => {
    if (!confirm(`Are you sure you want to unflag ${hacker}?`)) return;

    setLoading(hacker);
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hacker, isFlagged: false })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to unflag");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 text-slate-100">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 mb-8">
        Flagged Participants
      </h1>

      <div className="overflow-x-auto bg-slate-800/50 border border-slate-700 rounded-xl shadow-xl backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
              <th className="p-4">Hacker</th>
              <th className="p-4">Original Rank</th>
              <th className="p-4">Notes</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {flagged.map(entry => (
              <tr key={entry.hacker} className="hover:bg-slate-700/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={entry.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-slate-700" />
                    <div>
                      <div className="font-semibold text-red-400">{entry.hacker}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-500">#{entry.rank}</td>
                <td className="p-4">
                  <span className="text-slate-300 italic">{entry.notes || 'No notes provided'}</span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleUnflag(entry.hacker)}
                    disabled={loading === entry.hacker}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {loading === entry.hacker ? 'Unflagging...' : 'Unflag'}
                  </button>
                </td>
              </tr>
            ))}
            {flagged.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">No participants are currently flagged.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
