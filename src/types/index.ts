// ============================================================
// TYPES — mundial-hub
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

// API-Football types
export interface Team {
  id: number;
  name: string;
  code: string; // ISO alpha-2 for flag
  logo: string;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface FixtureStatus {
  long: string;
  short: string; // "NS" | "1H" | "HT" | "2H" | "ET" | "FT" | "LIVE" | "PEN"
  elapsed: number | null;
}

export interface FixtureInfo {
  id: number;
  date: string; // ISO 8601
  timestamp: number;
  venue: { name: string; city: string } | null;
  status: FixtureStatus;
}

export interface Match {
  fixture: FixtureInfo;
  teams: {
    home: Team;
    away: Team;
  };
  goals: Goals;
  score?: {
    halftime: Goals;
    fulltime: Goals;
    extratime: Goals | null;
    penalty: Goals | null;
  };
  league?: {
    id: number;
    name: string;
    round: string;
    group?: string;
  };
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: Goals;
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: Goals;
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: Goals;
  };
}

export interface StandingGroup {
  group: string;
  standings: Standing[];
}

// Supabase types
export interface Prediction {
  id: string;
  user_id: string;
  fixture_id: number;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
}

export interface ChampionPrediction {
  id: string;
  user_id: string;
  team_name: string;
  team_code: string;
  created_at: string;
}

export interface GroupPrediction {
  id: string;
  user_id: string;
  group_name: string;
  first_place_code: string;
  second_place_code: string;
  third_place_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

// Leaderboard
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  email: string;
  total_points: number;
  exact_results: number;
  correct_outcomes: number;
  total_predicted: number;
  accuracy_pct: number;
  champion_correct: boolean;
}

export interface ScoringResult {
  fixture_id: number;
  points: number;
  type: 'exact' | 'outcome_and_diff' | 'outcome' | 'miss' | 'pending';
}

// World Cup 2026 Teams with ISO codes
export const WC2026_TEAMS: Array<{ name: string; code: string }> = [
  { name: 'Argentina', code: 'ar' },
  { name: 'Australia', code: 'au' },
  { name: 'Belgium', code: 'be' },
  { name: 'Brazil', code: 'br' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Canada', code: 'ca' },
  { name: 'Chile', code: 'cl' },
  { name: 'Colombia', code: 'co' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Egypt', code: 'eg' },
  { name: 'England', code: 'gb-eng' },
  { name: 'France', code: 'fr' },
  { name: 'Germany', code: 'de' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Iran', code: 'ir' },
  { name: 'Italy', code: 'it' },
  { name: 'Japan', code: 'jp' },
  { name: 'Korea Republic', code: 'kr' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Panama', code: 'pa' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Slovenia', code: 'si' },
  { name: 'South Africa', code: 'za' },
  { name: 'Spain', code: 'es' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Togo', code: 'tg' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'United States', code: 'us' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Venezuela', code: 've' },
  { name: 'Wales', code: 'gb-wls' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Guatemala', code: 'gt' },
];
