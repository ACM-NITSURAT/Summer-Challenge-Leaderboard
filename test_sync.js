require('dotenv').config();
const { fetchLeaderboard } = require('./src/lib/sync.ts');

async function run() {
  try {
    await fetchLeaderboard();
    console.log("Done");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
