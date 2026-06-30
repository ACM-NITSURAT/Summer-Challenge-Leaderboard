import { NextResponse } from 'next/server';
import { setFlag } from '@/lib/data-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hacker, isFlagged, notes } = body;

    if (!hacker) {
      return NextResponse.json({ error: 'Hacker username is required' }, { status: 400 });
    }

    setFlag(hacker, isFlagged, notes || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
