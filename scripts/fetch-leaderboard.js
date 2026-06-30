const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONTEST_SLUG = 'acm-summer-challenge-2026';
const OUTPUT_FILE = path.join(__dirname, '../data/leaderboard.json');
const LIMIT = 100;

async function fetchLeaderboard() {
  const cookie = process.env.HACKERRANK_COOKIE;
  const csrfToken = process.env.HACKERRANK_CSRF_TOKEN;

  if (!cookie) {
    console.error('Error: HACKERRANK_COOKIE is missing in .env');
    process.exit(1);
  }

  let offset = 0;
  let allModels = [];
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
      console.error(`\nRequest failed with status: ${response.status} ${response.statusText}`);
      console.error(`Response: ${text.slice(0, 500)}`);
      process.exit(1);
    }

    const data = await response.json();
    const models = data.models || [];
    total = data.total;

    if (models.length === 0) {
      break; // No more records
    }

    allModels = allModels.concat(models);
    offset += LIMIT;

    // Optional delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    if (allModels.length >= total) {
      break; // Fetched everything
    }
  }

  console.log(`\nSuccess! Fetched ${allModels.length} participants.`);

  // Write to file or JSONBin
  const finalData = {
    models: allModels,
    total: allModels.length
  };

  if (process.env.VERCEL === '1' && process.env.JSONBIN_API_KEY && process.env.JSONBIN_LEADERBOARD_BIN_ID) {
    console.log(`Saving to JSONBin...`);
    const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_LEADERBOARD_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': process.env.JSONBIN_API_KEY
      },
      body: JSON.stringify(finalData)
    });
    if (!res.ok) {
      console.error(`Error saving to JSONBin: ${await res.text()}`);
    } else {
      console.log(`Successfully saved to JSONBin.`);
    }
  } else {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`Saved to ${OUTPUT_FILE}`);
  }
}

fetchLeaderboard().catch(err => {
  console.error("An error occurred:", err);
  process.exit(1);
});
