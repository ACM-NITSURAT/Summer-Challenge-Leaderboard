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
    <main className="min-h-screen bg-slate-900 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-white hover:text-emerald-400 transition-colors">
              Leaderboard
            </Link>
            {isAdmin && (
              <Link href="/flagged" className="text-slate-400 hover:text-white transition-colors">
                Flagged Participants
              </Link>
            )}
          </div>
          <div>
            {isAdmin ? (
              <LogoutButton />
            ) : (
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Admin Login
              </Link>
            )}
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
