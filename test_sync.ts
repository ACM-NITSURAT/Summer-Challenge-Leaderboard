import * as dotenv from 'dotenv';
dotenv.config();
import { fetchLeaderboard } from './src/lib/sync';

async function run() {
  try {
    await fetchLeaderboard();
    console.log("Done");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
