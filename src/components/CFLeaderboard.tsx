"use client";

import React, { useState } from 'react';
import { ProcessedCFLeaderboardEntry } from '@/lib/data-utils';
import ActionModal from './ActionModal';

export default function CFLeaderboard({ initialData, isAdmin = false }: { initialData: ProcessedCFLeaderboardEntry[], isAdmin?: boolean }) {
  const [data] = useState(initialData);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'rating' | 'maxRating' | 'rank'>('rating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loadingFlag, setLoadingFlag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'flag' | 'unflag' | 'alert' | 'reason';
    hacker: string;
    title?: string;
    message?: string;
  }>({ isOpen: false, type: 'alert', hacker: '' });
  const pageSize = 15;

  // Filter
  const filtered = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    const handleMatch = item.handle?.toLowerCase().includes(s);
    const orgMatch = item.organization?.toLowerCase().includes(s);
    const nameMatch = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase().includes(s);
    return handleMatch || orgMatch || nameMatch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortField === 'rating') {
      diff = (a.rating || 0) - (b.rating || 0);
    } else if (sortField === 'maxRating') {
      diff = (a.maxRating || 0) - (b.maxRating || 0);
    } else if (sortField === 'rank') {
      diff = a.official_rank - b.official_rank; // lower is better
      // but wait, if sortDir is desc for rating, maybe rank should be asc for better?
      // actually official_rank is 1,2,3. So a diff of a-b means 1 is before 2.
      // to make it consistent:
      if (sortDir === 'desc') {
        return a.official_rank - b.official_rank; // lower rank (1) is better, so it should be at the top when sorting "descending" (best first)
      } else {
        return b.official_rank - a.official_rank;
      }
    }
    return sortDir === 'asc' ? diff : -diff;
  });

  const handleFlag = async (hacker: string, isCurrentlyFlagged: boolean) => {
    if (!isAdmin) return;
    setModalConfig({
      isOpen: true,
      type: isCurrentlyFlagged ? 'unflag' : 'flag',
      hacker
    });
  };

  const executeFlagAction = async (notes?: string) => {
    const hacker = modalConfig.hacker;
    const isFlagged = modalConfig.type === 'flag';
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    setLoadingFlag(hacker);

    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hacker, isFlagged, notes: notes || '', platform: 'cf' })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setModalConfig({ isOpen: true, type: 'alert', hacker: '', title: 'Error', message: 'Failed to update flag.' });
      }
    } catch (e) {
      setModalConfig({ isOpen: true, type: 'alert', hacker: '', title: 'Error', message: 'An error occurred while updating the flag.' });
    } finally {
      setLoadingFlag(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRatingColor = (rating: number) => {
    if (!rating) return "text-slate-500";
    if (rating >= 2400) return "text-red-500 font-bold";
    if (rating >= 2100) return "text-orange-500 font-bold";
    if (rating >= 1900) return "text-purple-500 font-bold";
    if (rating >= 1600) return "text-blue-500 font-bold";
    if (rating >= 1400) return "text-cyan-500 font-bold";
    if (rating >= 1200) return "text-green-500 font-bold";
    return "text-slate-300 font-bold";
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-4 text-slate-100 relative z-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Codeforces Standings
          </h1>
          <p className="text-slate-400 font-medium text-sm">Official participant ratings on Codeforces</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto relative group">
          <input 
            type="text" 
            placeholder="Search handle or name..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="relative px-5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500/50 w-full md:w-72 shadow-xl backdrop-blur-md transition-all text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900/40 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-widest bg-black/20">
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('rank'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                CF Rank {sortField === 'rank' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-5">Hacker</th>
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('rating'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                Current Rating {sortField === 'rating' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-5 cursor-pointer hover:text-white transition-colors" onClick={() => { setSortField('maxRating'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}>
                Max Rating {sortField === 'maxRating' && (sortDir === 'asc' ? '↑' : '↓')}
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

              const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(" ");

              return (
              <tr key={entry.handle} className={`transition-all duration-200 ${entry.is_flagged ? 'bg-red-950/40 hover:bg-red-900/40' : 'hover:bg-white/5'}`}>
                <td className="p-5 font-bold text-lg whitespace-nowrap">
                  {entry.is_flagged ? <span className="text-red-400 text-xs font-semibold tracking-wider uppercase bg-red-500/10 px-2.5 py-1 border border-red-500/20 rounded-full">Flagged</span> : <span className={rankStyle}>{rankDisplay}</span>}
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={entry.avatar || 'https://userpic.codeforces.org/no-avatar.jpg'} alt="avatar" className="relative w-10 h-10 rounded-full bg-slate-800 border border-white/10 shadow-lg object-cover" />
                    </div>
                    <div>
                      <a href={`https://codeforces.com/profile/${entry.handle}`} target="_blank" rel="noreferrer" className={`font-bold text-base hover:underline ${getRatingColor(entry.rating || 0)}`}>{entry.handle}</a>
                      {fullName && <div className="text-xs font-medium text-slate-400 truncate max-w-[200px]" title={fullName}>{fullName}</div>}
                      {entry.rank && <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{entry.rank}</div>}
                      {entry.is_flagged && entry.notes && (
                        <div 
                          onClick={() => setModalConfig({ isOpen: true, type: 'reason', hacker: entry.handle, title: `Flag Reason: ${entry.handle}`, message: entry.notes || '' })}
                          className="text-xs font-semibold text-red-400 mt-1.5 flex items-center gap-1.5 cursor-pointer hover:text-red-300 transition-colors w-max"
                        >
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="truncate max-w-[300px]" title="Click to view details">Reason: {entry.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`p-5 font-mono text-lg ${getRatingColor(entry.rating || 0)}`}>{entry.rating || 0}</td>
                <td className="p-5 font-mono text-slate-400">{entry.maxRating || 0}</td>
                {isAdmin && (
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleFlag(entry.handle, entry.is_flagged || false)}
                      disabled={loadingFlag === entry.handle}
                      className={`px-4 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${entry.is_flagged ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}
                    >
                      {loadingFlag === entry.handle ? '...' : (entry.is_flagged ? 'Unflag' : 'Flag')}
                    </button>
                  </td>
                )}
              </tr>
            )})}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-400">No matching participants found.</td>
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

      <ActionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        targetHacker={modalConfig.hacker}
        onConfirm={(notes) => (modalConfig.type === 'alert' || modalConfig.type === 'reason') ? setModalConfig(p => ({...p, isOpen: false})) : executeFlagAction(notes)}
        onCancel={() => setModalConfig(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
