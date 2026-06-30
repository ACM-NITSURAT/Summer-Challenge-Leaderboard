import { NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/sync';
import { revalidateTag } from 'next/cache';

let lastSyncTime = 0;

export async function POST() {
  const now = Date.now();
  // 3 minute cooldown
  if (now - lastSyncTime < 3 * 60 * 1000) {
    const remainingSeconds = Math.ceil((3 * 60 * 1000 - (now - lastSyncTime)) / 1000);
    return NextResponse.json({ error: `Please wait ${remainingSeconds} seconds before refreshing again.` }, { status: 429 });
  }

  try {
    lastSyncTime = now;
    await fetchLeaderboard();
    revalidateTag('leaderboard');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync error:", error);
    // Reset timer on failure so they can try again
    lastSyncTime = 0;
    return NextResponse.json({ error: error.message || "Failed to sync leaderboard" }, { status: 500 });
  }
}
