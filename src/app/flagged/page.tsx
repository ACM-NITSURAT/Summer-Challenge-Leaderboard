import { getProcessedLeaderboard } from '@/lib/data-utils';
import Link from 'next/link';
import FlaggedClient from './FlaggedClient';

export const dynamic = 'force-dynamic';

export default function FlaggedPage() {
  const data = getProcessedLeaderboard();
  
  return (
    <main className="min-h-screen bg-slate-900 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/flagged" className="font-bold text-white hover:text-emerald-400 transition-colors">
              Flagged Participants
            </Link>
          </div>
        </div>
      </nav>
      
      <FlaggedClient initialData={data} />
    </main>
  );
}
