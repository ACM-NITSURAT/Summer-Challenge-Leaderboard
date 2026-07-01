import { getProcessedLeaderboard, getProcessedCFLeaderboard } from '@/lib/data-utils';
import Link from 'next/link';
import FlaggedClient from './FlaggedClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function FlaggedPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('admin_session')?.value === 'true';
  if (!isAdmin) {
    redirect('/spiderman');
  }

  const hrData = await getProcessedLeaderboard();
  const cfData = await getProcessedCFLeaderboard();

  const flaggedHR = hrData.filter(d => d.is_flagged).map(d => ({
    hacker: d.hacker,
    rank: d.rank.toString(),
    notes: d.notes,
    avatar: d.avatar,
    platform: 'hr' as const
  }));

  const flaggedCF = cfData.filter(d => d.is_flagged).map(d => ({
    hacker: d.handle,
    rank: (d.rating || 0).toString(),
    notes: d.notes,
    avatar: d.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
    platform: 'cf' as const
  }));

  const allFlagged = [...flaggedHR, ...flaggedCF];

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
            <Link href="/flagged" className="text-sm font-medium text-white">
              Flagged Participants
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </nav>
      
      <FlaggedClient initialData={allFlagged} />
    </main>
  );
}
