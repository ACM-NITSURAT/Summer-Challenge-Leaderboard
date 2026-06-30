import { getProcessedLeaderboard } from '@/lib/data-utils';
import LeaderboardClient from '@/components/LeaderboardClient';
import Link from 'next/link';
import { cookies } from 'next/headers';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = getProcessedLeaderboard();
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';

  return (
    <main className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/acm-logo.png" alt="ACM Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-white tracking-wide">
                ACM NIT SURAT
              </span>
            </Link>
            {isAdmin && (
              <Link href="/flagged" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Flagged Participants
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && <LogoutButton />}
          </div>
        </div>
      </nav>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh] text-slate-400">
          <p>No leaderboard data found. Please add data to <code className="bg-slate-800 p-1 rounded text-emerald-400">data/leaderboard.json</code></p>
        </div>
      ) : (
        <LeaderboardClient initialData={data} isAdmin={isAdmin} />
      )}
    </main>
  );
}
