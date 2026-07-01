import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { setFlag } from '@/lib/data-utils';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hacker, isFlagged, notes, platform = 'hr' } = body;

    if (!hacker || typeof isFlagged !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await setFlag(hacker, isFlagged, notes || '', platform);
    revalidateTag('flags');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
