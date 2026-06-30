import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

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
    // On Vercel or restricted environments, npm might not be perfectly in path, so we run node directly on the script.
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-leaderboard.js');
    await execPromise(`node "${scriptPath}"`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    // Reset timer on failure so they can try again
    lastSyncTime = 0;
    return NextResponse.json({ error: "Failed to sync leaderboard" }, { status: 500 });
  }
}
