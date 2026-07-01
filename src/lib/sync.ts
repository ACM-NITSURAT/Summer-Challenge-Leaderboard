import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { getFlagsStore } from './data-utils';

const CONTEST_SLUG = 'acm-summer-challenge-2026';
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'leaderboard.json');
const EXCEL_FILE = path.join(process.cwd(), 'public', 'ACM Summer Challenge 2026 (Responses) (1).xlsx');
const LIMIT = 100;

export async function fetchLeaderboard() {
  const cookie = process.env.HACKERRANK_COOKIE;
  const csrfToken = process.env.HACKERRANK_CSRF_TOKEN;

  if (!cookie) {
    throw new Error('HACKERRANK_COOKIE is missing in .env');
  }

  let offset = 0;
  let allModels: any[] = [];
  let total = -1;

  console.log(`Starting leaderboard sync for ${CONTEST_SLUG}...`);

  while (true) {
    const url = `https://www.hackerrank.com/rest/contests/${CONTEST_SLUG}/leaderboard?offset=${offset}&limit=${LIMIT}&include_practice=true`;
    console.log(`Fetching offset ${offset}...`);

    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'cookie': cookie,
        'x-csrf-token': csrfToken || '',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'referer': `https://www.hackerrank.com/contests/${CONTEST_SLUG}/leaderboard`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Request failed with status: ${response.status} ${response.statusText}`);
      throw new Error(`HackerRank API Error: ${response.status} - ${text.slice(0, 500)}`);
    }

    const data = await response.json();
    const models = data.models || [];
    total = data.total;

    if (models.length === 0) {
      break;
    }

    allModels = allModels.concat(models);
    offset += LIMIT;

    // Optional delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    if (allModels.length >= total) {
      break;
    }
  }

  console.log(`Success! Fetched ${allModels.length} HackerRank participants.`);

  const flagsStore = await getFlagsStore();
  const hiddenHr = flagsStore.hidden_hr || [];
  const hiddenCf = flagsStore.hidden_cf || [];
  const extraCf = flagsStore.extra_cf || [];

  if (hiddenHr.length > 0) {
    allModels = allModels.filter(m => !hiddenHr.includes(m.hacker));
    console.log(`Filtered out hidden HackerRank users.`);
  }

  // --- CODEFORCES SYNC ---
  let cfModels: any[] = [];
  try {
    console.log("Parsing Excel file for Codeforces IDs...");
    let cfHandles: string[] = [];
    if (fs.existsSync(EXCEL_FILE)) {
      const fileBuffer = fs.readFileSync(EXCEL_FILE);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet) as any[];
      
      cfHandles = data
        .map(row => row['Codeforces ID\nStrict Rule: Your Codeforces ID must be the exact same as your HackerRank ID name.  '])
        .filter(handle => handle && typeof handle === 'string' && handle.trim() !== '')
        .map(handle => handle.trim());
    } else {
      console.warn("Excel file not found.");
    }
      
    // Add extra CF handles
    cfHandles = cfHandles.concat(extraCf);

    // Distinct handles and filter out hidden ones
    const uniqueHandles = [...new Set(cfHandles)].filter(h => !hiddenCf.includes(h));
      
    if (uniqueHandles.length > 0) {
        console.log(`Fetching Codeforces data for ${uniqueHandles.length} handles...`);
        // Batch them 300 at a time
        const fetchBatch = async (batch: string[]) => {
          const cfUrl = `https://codeforces.com/api/user.info?handles=${batch.join(';')}`;
          const cfRes = await fetch(cfUrl);
          if (cfRes.ok) {
            const cfData = await cfRes.json();
            if (cfData.status === 'OK') {
              cfModels = cfModels.concat(cfData.result);
            }
          } else {
            console.warn(`Batch failed with status: ${cfRes.status}. Some handles might be invalid.`);
            if (batch.length > 1) {
              console.log("Retrying individually to filter out invalid handles...");
              for (const h of batch) {
                await new Promise(r => setTimeout(r, 300));
                await fetchBatch([h]);
              }
            } else {
              console.warn(`Handle ${batch[0]} is invalid on Codeforces or rate limited.`);
            }
          }
        };

        for (let i = 0; i < uniqueHandles.length; i += 30) {
          const batch = uniqueHandles.slice(i, i + 30);
          await fetchBatch(batch);
          await new Promise(r => setTimeout(r, 500)); // sleep between large batches
        }

        if (cfModels.length > 0) {
          console.log(`Fetching contest history for ${cfModels.length} Codeforces handles...`);
          for (let i = 0; i < cfModels.length; i++) {
            const model = cfModels[i];
            try {
              const ratingUrl = `https://codeforces.com/api/user.rating?handle=${model.handle}`;
              const ratingRes = await fetch(ratingUrl);
              if (ratingRes.ok) {
                const ratingData = await ratingRes.json();
                if (ratingData.status === 'OK' && Array.isArray(ratingData.result)) {
                  model.contestCount = ratingData.result.length;
                  if (model.contestCount > 0) {
                    model.lastContestName = ratingData.result[ratingData.result.length - 1].contestName;
                  }
                }
              } else {
                console.warn(`Failed to fetch rating for ${model.handle}`);
              }
            } catch (e) {
              console.warn(`Error fetching rating for ${model.handle}`, e);
            }
            // Sleep to respect Codeforces rate limits
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
  } catch (err) {
    console.error("Error fetching Codeforces data:", err);
  }

  const finalData = {
    models: allModels,
    cf_models: cfModels,
    total: allModels.length
  };

  if (process.env.VERCEL === '1' && process.env.JSONBIN_API_KEY && process.env.JSONBIN_LEADERBOARD_BIN_ID) {
    console.log(`Saving to JSONBin...`);
    const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_LEADERBOARD_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.JSONBIN_API_KEY
      },
      body: JSON.stringify(finalData)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error saving to JSONBin: ${text}`);
    } else {
      console.log(`Successfully saved to JSONBin.`);
    }
  } else {
    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`Saved to ${OUTPUT_FILE}`);
  }
}
