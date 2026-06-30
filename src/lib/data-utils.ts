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

export function getRawLeaderboard(): HackerRankResponse | null {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) return null;
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    return JSON.parse(data) as HackerRankResponse;
  } catch (err) {
    console.error("Error reading leaderboard.json", err);
    return null;
  }
}

export function getFlagsStore(): FlagsStore {
  try {
    if (!fs.existsSync(FLAGS_FILE)) return {};
    const data = fs.readFileSync(FLAGS_FILE, 'utf-8');
    return JSON.parse(data) as FlagsStore;
  } catch (err) {
    console.error("Error reading flags.json", err);
    return {};
  }
}

export function saveFlagsStore(store: FlagsStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Error saving flags.json", err);
  }
}

export function setFlag(hacker: string, isFlagged: boolean, notes: string = "") {
  const store = getFlagsStore();
  if (isFlagged) {
    store[hacker] = { notes, flaggedAt: new Date().toISOString() };
  } else {
    delete store[hacker];
  }
  saveFlagsStore(store);
}

export function getProcessedLeaderboard(): ProcessedLeaderboardEntry[] {
  const raw = getRawLeaderboard();
  if (!raw || !raw.models) return [];
  
  const flags = getFlagsStore();

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
