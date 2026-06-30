import fs from 'fs';
import path from 'path';

export interface HackerRankModel {
  hacker_id: number;
  rank: number;
  score: number;
  time_taken: number;
  hacker: string;
  avatar: string;
  country: string;
  school: string | null;
  company: string;
  timestamp: number;
  submitted_at: string;
}

export interface HackerRankResponse {
  models: HackerRankModel[];
  page: number;
  total: number;
}

export interface FlagData {
  notes: string;
  flaggedAt: string;
}

// Key is hacker (username)
export type FlagsStore = Record<string, FlagData>;

export interface ProcessedLeaderboardEntry extends HackerRankModel {
  official_rank: number;
  is_flagged: boolean;
  notes?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const FLAGS_FILE = path.join(DATA_DIR, 'flags.json');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID; // For flags
const JSONBIN_LEADERBOARD_BIN_ID = process.env.JSONBIN_LEADERBOARD_BIN_ID; // For leaderboard
// Only use JSONBin if the keys are actually set AND we are deployed to Vercel
const USE_JSONBIN_FLAGS = !!(JSONBIN_API_KEY && JSONBIN_BIN_ID && process.env.VERCEL === '1');
const USE_JSONBIN_LEADERBOARD = !!(JSONBIN_API_KEY && JSONBIN_LEADERBOARD_BIN_ID && process.env.VERCEL === '1');

export async function getRawLeaderboard(): Promise<HackerRankResponse | null> {
  if (USE_JSONBIN_LEADERBOARD) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_LEADERBOARD_BIN_ID}/latest`, {
        headers: {
          'X-Master-Key': JSONBIN_API_KEY!
        },
        next: { tags: ['leaderboard'], revalidate: 3600 }
      });
      if (res.ok) {
        const json = await res.json();
        return json.record as HackerRankResponse;
      }
    } catch (e) {
      console.error("Error fetching leaderboard from JSONBin", e);
    }
    return null;
  } else {
    try {
      if (!fs.existsSync(LEADERBOARD_FILE)) return null;
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      return JSON.parse(data) as HackerRankResponse;
    } catch (err) {
      console.error("Error reading leaderboard.json", err);
      return null;
    }
  }
}

export async function getFlagsStore(): Promise<FlagsStore> {
  if (USE_JSONBIN_FLAGS) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: {
          'X-Master-Key': JSONBIN_API_KEY!
        },
        next: { tags: ['flags'], revalidate: 3600 }
      });
      if (res.ok) {
        const json = await res.json();
        return (json.record || {}) as FlagsStore;
      }
    } catch (e) {
      console.error("Error fetching from JSONBin", e);
    }
    return {};
  } else {
    try {
      if (!fs.existsSync(FLAGS_FILE)) return {};
      const data = fs.readFileSync(FLAGS_FILE, 'utf-8');
      return JSON.parse(data) as FlagsStore;
    } catch (err) {
      console.error("Error reading flags.json", err);
      return {};
    }
  }
}

export async function saveFlagsStore(store: FlagsStore): Promise<void> {
  if (USE_JSONBIN_FLAGS) {
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY!
        },
        body: JSON.stringify(store)
      });
    } catch (e) {
      console.error("Error saving to JSONBin", e);
    }
  } else {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(FLAGS_FILE, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error("Error saving flags.json", err);
    }
  }
}

export async function setFlag(hacker: string, isFlagged: boolean, notes: string = ""): Promise<void> {
  const store = await getFlagsStore();
  if (isFlagged) {
    store[hacker] = { notes, flaggedAt: new Date().toISOString() };
  } else {
    delete store[hacker];
  }
  await saveFlagsStore(store);
}

export async function getProcessedLeaderboard(): Promise<ProcessedLeaderboardEntry[]> {
  const raw = await getRawLeaderboard();
  if (!raw || !raw.models) return [];
  
  const flags = await getFlagsStore();

  const processed = raw.models.map(model => {
    const flagInfo = flags[model.hacker];
    return {
      ...model,
      official_rank: -1, // placeholder
      is_flagged: !!flagInfo,
      notes: flagInfo?.notes
    };
  });

  // Calculate official ranks
  let currentRank = 1;
  let prevScore = -1;
  let prevTime = -1;
  let tiedRank = 1;

  for (let i = 0; i < processed.length; i++) {
    if (processed[i].is_flagged) {
      continue; // keep official_rank as -1
    }

    if (processed[i].score === prevScore && processed[i].time_taken === prevTime) {
      processed[i].official_rank = tiedRank;
      currentRank++;
    } else {
      processed[i].official_rank = currentRank;
      tiedRank = currentRank;
      currentRank++;
      prevScore = processed[i].score;
      prevTime = processed[i].time_taken;
    }
  }

  return processed;
}
