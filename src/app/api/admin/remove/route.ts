import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { manageAdminList } from '@/lib/data-utils';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('admin_session')?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hacker, platform } = await request.json();
    if (!hacker || !platform) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await manageAdminList(platform === 'hr' ? 'hidden_hr' : 'hidden_cf', 'add', hacker);
    revalidateTag('leaderboard', 'max');
    revalidateTag('flags', 'max');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
