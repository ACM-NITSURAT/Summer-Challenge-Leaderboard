import { getProcessedLeaderboard, getProcessedCFLeaderboard } from '@/lib/data-utils';
import LeaderboardTabs from '@/components/LeaderboardTabs';
import Link from 'next/link';
import { cookies } from 'next/headers';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const hrData = await getProcessedLeaderboard();
  const cfData = await getProcessedCFLeaderboard();
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';

  return (
    <main className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <img src="/acm-logo.png" alt="ACM Logo" className="h-6 md:h-8 w-auto object-contain" />
              <span className="font-bold text-white tracking-wide text-sm md:text-base">
                ACM NIT SURAT
              </span>
            </Link>
            {isAdmin && (
              <Link href="/flagged" className="text-xs md:text-sm font-medium text-slate-400 hover:text-white transition-colors">
                <span className="hidden sm:inline">Flagged Participants</span>
                <span className="sm:hidden">Flagged</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && <LogoutButton />}
          </div>
        </div>
      </nav>
      
      <LeaderboardTabs hrData={hrData} cfData={cfData} isAdmin={isAdmin} />
    </main>
  );
}
