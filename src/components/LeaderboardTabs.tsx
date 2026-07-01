"use client";

import React, { useState } from 'react';
import LeaderboardClient from './LeaderboardClient';
import CFLeaderboard from './CFLeaderboard';
import { ProcessedLeaderboardEntry, ProcessedCFLeaderboardEntry } from '@/lib/data-utils';

export default function LeaderboardTabs({ 
  hrData, 
  cfData, 
  isAdmin 
}: { 
  hrData: ProcessedLeaderboardEntry[], 
  cfData: ProcessedCFLeaderboardEntry[], 
  isAdmin: boolean 
}) {
  const [activeTab, setActiveTab] = useState<'hr' | 'cf'>('hr');

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6 px-4 relative z-20">
        <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md flex gap-2 w-full max-w-sm">
          <button
            onClick={() => setActiveTab('hr')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'hr'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            HackerRank
          </button>
          <button
            onClick={() => setActiveTab('cf')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'cf'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Codeforces
          </button>
        </div>
      </div>

      {activeTab === 'hr' ? (
        <LeaderboardClient initialData={hrData} isAdmin={isAdmin} />
      ) : (
        <CFLeaderboard initialData={cfData} isAdmin={isAdmin} />
      )}
    </div>
  );
}
