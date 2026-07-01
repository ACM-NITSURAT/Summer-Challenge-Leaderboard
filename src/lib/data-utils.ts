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

export interface CodeforcesModel {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  avatar: string;
  organization: string;
  firstName?: string;
  lastName?: string;
  contestCount?: number;
  lastContestName?: string;
}

export interface HackerRankResponse {
  models: HackerRankModel[];
  cf_models?: CodeforcesModel[];
  page: number;
  total: number;
}

export interface FlagData {
  notes: string;
  flaggedAt: string;
}

export interface FlagsStore {
  hackerrank?: Record<string, FlagData>;
  codeforces?: Record<string, FlagData>;
  hidden_hr?: string[];
  hidden_cf?: string[];
  extra_cf?: string[];
  [key: string]: any; // fallback
}

export interface ProcessedLeaderboardEntry extends HackerRankModel {
  official_rank: number;
  is_flagged: boolean;
  notes?: string;
}

export interface ProcessedCFLeaderboardEntry extends CodeforcesModel {
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

export async function setFlag(hacker: string, isFlagged: boolean, notes: string = "", platform: 'hr' | 'cf' = 'hr'): Promise<void> {
  const store = await getFlagsStore();
  
  // Migration for old format
  if (!store.hackerrank) {
    const migratedHR: Record<string, FlagData> = {};
    for (const key of Object.keys(store)) {
      if (key !== 'hackerrank' && key !== 'codeforces') {
        migratedHR[key] = store[key];
        delete store[key];
      }
    }
    store.hackerrank = migratedHR;
  }
  if (!store.codeforces) store.codeforces = {};

  const targetStore = platform === 'hr' ? store.hackerrank : store.codeforces;
  
  if (isFlagged) {
    targetStore[hacker] = { notes, flaggedAt: new Date().toISOString() };
  } else {
    delete targetStore[hacker];
  }
  await saveFlagsStore(store);
}

export async function manageAdminList(
  listName: 'hidden_hr' | 'hidden_cf' | 'extra_cf',
  action: 'add' | 'remove',
  item: string
): Promise<void> {
  const store = await getFlagsStore();
  let list = store[listName] || [];
  
  if (action === 'add') {
    if (!list.includes(item)) {
      list.push(item);
    }
  } else {
    list = list.filter(x => x !== item);
  }
  
  store[listName] = list;
  await saveFlagsStore(store);
}

export async function getProcessedLeaderboard(): Promise<ProcessedLeaderboardEntry[]> {
  const raw = await getRawLeaderboard();
  if (!raw || !raw.models) return [];
  
  const flags = await getFlagsStore();
  const hrFlags = flags.hackerrank || flags;
  const hiddenHr = flags.hidden_hr || [];

  const processed = raw.models
    .filter(m => !hiddenHr.includes(m.hacker))
    .map(model => {
      const flagInfo = hrFlags[model.hacker];
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

export async function getProcessedCFLeaderboard(): Promise<ProcessedCFLeaderboardEntry[]> {
  const raw = await getRawLeaderboard();
  if (!raw || !raw.cf_models) return [];
  
  const flags = await getFlagsStore();
  const cfFlags = flags.codeforces || {};
  const hiddenCf = flags.hidden_cf || [];

  let processed = raw.cf_models
    .filter(m => !hiddenCf.includes(m.handle))
    .map(model => {
      const flagInfo = cfFlags[model.handle];
    return {
      ...model,
      official_rank: -1,
      is_flagged: !!flagInfo,
      notes: flagInfo?.notes
    };
  });

  // Sort by rating desc
  processed.sort((a, b) => {
    return (b.rating || 0) - (a.rating || 0);
  });

  // Calculate official ranks
  let currentRank = 1;
  let prevRating = -1;
  let tiedRank = 1;

  for (let i = 0; i < processed.length; i++) {
    if (processed[i].is_flagged) continue;

    const rating = processed[i].rating || 0;
    if (rating === prevRating) {
      processed[i].official_rank = tiedRank;
      currentRank++;
    } else {
      processed[i].official_rank = currentRank;
      tiedRank = currentRank;
      currentRank++;
      prevRating = rating;
    }
  }

  return processed;
}
