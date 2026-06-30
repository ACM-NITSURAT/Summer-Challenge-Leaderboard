"use client";

import React, { useState } from 'react';
import { ProcessedLeaderboardEntry } from '@/lib/data-utils';
import ActionModal from '@/components/ActionModal';

export default function FlaggedClient({ initialData }: { initialData: ProcessedLeaderboardEntry[] }) {
  const flagged = initialData.filter(d => d.is_flagged);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'flag' | 'unflag' | 'alert';
    hacker: string;
    title?: string;
    message?: string;
  }>({ isOpen: false, type: 'alert', hacker: '' });
  const pageSize = 15;

  const handleUnflag = (hacker: string) => {
    setModalConfig({
      isOpen: true,
      type: 'unflag',
      hacker
    });
  };

  const executeUnflag = async () => {
    const hacker = modalConfig.hacker;
    setModalConfig(p => ({ ...p, isOpen: false }));
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
        setModalConfig({ isOpen: true, type: 'alert', hacker: '', title: 'Error', message: 'Failed to unflag.' });
      }
    } catch (e) {
      setModalConfig({ isOpen: true, type: 'alert', hacker: '', title: 'Error', message: 'An error occurred while unflagging.' });
    } finally {
      setLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(flagged.length / pageSize));
  const paginatedData = flagged.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 text-slate-100 relative z-10">

      <h1 className="text-4xl font-extrabold text-white mb-10 tracking-tight">
        Flagged Participants
      </h1>

      <div className="overflow-x-auto bg-slate-900/40 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-widest bg-black/20">
              <th className="p-5">Hacker</th>
              <th className="p-5">Original Rank</th>
              <th className="p-5">Notes</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedData.map(entry => (
              <tr key={entry.hacker} className="hover:bg-white/5 transition-all duration-200">
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={entry.avatar} alt="avatar" className="relative w-10 h-10 rounded-full bg-slate-800 border border-white/10 shadow-lg object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-base">{entry.hacker}</div>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-slate-500 font-mono text-lg">#{entry.rank}</td>
                <td className="p-5">
                  <span className="text-slate-300 italic">{entry.notes || 'No notes provided'}</span>
                </td>
                <td className="p-5 text-right">
                  <button 
                    onClick={() => handleUnflag(entry.hacker)}
                    disabled={loading === entry.hacker}
                    className="px-4 py-2 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {loading === entry.hacker ? 'Unflagging...' : 'Unflag'}
                  </button>
                </td>
              </tr>
            ))}
            {flagged.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400 text-lg">No participants are currently flagged.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {flagged.length > pageSize && (
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
        onConfirm={() => modalConfig.type === 'alert' ? setModalConfig(p => ({...p, isOpen: false})) : executeUnflag()}
        onCancel={() => setModalConfig(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
