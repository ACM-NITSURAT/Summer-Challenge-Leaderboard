import { fetchLeaderboard } from './src/lib/sync';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const handles = ['26Krishna_Mehta', 'invalid_handle_999911', '_niyatiag17_'];
  
  let cfModels: any[] = [];
  
  async function fetchBatch(batch: string[]) {
    const url = `https://codeforces.com/api/user.info?handles=${batch.join(';')}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK') {
        cfModels = cfModels.concat(data.result);
      }
    } else {
      const data = await res.json();
      console.log("Failed batch:", data.comment);
      if (batch.length > 1) {
        console.log("Retrying individually...");
        for (const h of batch) {
          await new Promise(r => setTimeout(r, 500));
          await fetchBatch([h]);
        }
      }
    }
  }

  await fetchBatch(handles);
  console.log("Final models:", cfModels.map(m => m.handle));
}

run();
