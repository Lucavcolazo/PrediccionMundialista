import type { Match, Standing, StandingGroup } from '../types';

const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';
const LEAGUE = 1;    // FIFA World Cup
const SEASON = 2026;

function getHeaders() {
  const key = import.meta.env.VITE_RAPIDAPI_KEY as string;
  return {
    'X-RapidAPI-Key': key || '',
    'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.response as T;
}

// ---- Fixtures ----

export async function getLiveMatches(): Promise<Match[]> {
  return apiFetch<Match[]>(
    `/fixtures?live=all&league=${LEAGUE}&season=${SEASON}`
  );
}

export async function getUpcomingMatches(next = 3): Promise<Match[]> {
  return apiFetch<Match[]>(
    `/fixtures?next=${next}&league=${LEAGUE}&season=${SEASON}`
  );
}

export async function getTodayResults(): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0];
  return apiFetch<Match[]>(
    `/fixtures?date=${today}&league=${LEAGUE}&season=${SEASON}`
  );
}

export async function getAllFixtures(): Promise<Match[]> {
  return apiFetch<Match[]>(
    `/fixtures?league=${LEAGUE}&season=${SEASON}`
  );
}

export async function getFixtureById(id: number): Promise<Match | null> {
  const matches = await apiFetch<Match[]>(`/fixtures?id=${id}`);
  return matches[0] ?? null;
}

// ---- Standings ----

interface RawStandingResponse {
  league: {
    standings: Standing[][];
  };
}

export async function getStandings(): Promise<StandingGroup[]> {
  const raw = await apiFetch<RawStandingResponse[]>(
    `/standings?league=${LEAGUE}&season=${SEASON}`
  );

  if (!raw || raw.length === 0) return [];

  const standings = raw[0].league.standings;

  // Group by group name
  const groups: StandingGroup[] = standings.map((group) => ({
    group: group[0]?.group || 'Group',
    standings: group,
  }));

  return groups.sort((a, b) => a.group.localeCompare(b.group));
}

// ---- Team code normalization ----
// API-Football uses team.code (3-letter) but flagcdn needs ISO alpha-2
// We maintain a best-effort map; unknown codes fall back to emoji
const TEAM_CODE_MAP: Record<string, string> = {
  ARG: 'ar', AUS: 'au', BEL: 'be', BRA: 'br', CMR: 'cm',
  CAN: 'ca', CHI: 'cl', COL: 'co', CRO: 'hr', DEN: 'dk',
  ECU: 'ec', EGY: 'eg', ENG: 'gb-eng', FRA: 'fr', GER: 'de',
  GHA: 'gh', IRN: 'ir', ITA: 'it', JPN: 'jp', KOR: 'kr',
  MEX: 'mx', MAR: 'ma', NED: 'nl', NZL: 'nz', NGA: 'ng',
  PAN: 'pa', PAR: 'py', PER: 'pe', POL: 'pl', POR: 'pt',
  KSA: 'sa', SEN: 'sn', SRB: 'rs', SVN: 'si', RSA: 'za',
  ESP: 'es', SUI: 'ch', TUN: 'tn', UKR: 'ua', USA: 'us',
  URU: 'uy', VEN: 've', WAL: 'gb-wls', CRC: 'cr', HON: 'hn',
  BOL: 'bo', GUA: 'gt', TGO: 'tg',
};

export function getIsoCode(teamCode: string): string {
  return TEAM_CODE_MAP[teamCode?.toUpperCase()] ?? teamCode?.toLowerCase() ?? '';
}
