import { supabase } from './supabase';
import type { Match, StandingGroup, Standing} from '../types';
import { WC2026_TEAMS } from '../types';

// ============================================================================
// HIGHLIGHTLY FETCHING LAYER (VIA SUPABASE EDGE FUNCTION)
// ============================================================================

// The frontend reads the cached snapshot directly from the `api_cache` table.
// A scheduled job (pg_cron, every ~10 min) is the ONLY thing that calls the
// Highlightly API and refreshes this table. This way every user visit is
// instant, costs zero API quota, and shows the last refreshed snapshot.
async function readCachedData<T>(endpoint: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('api_cache')
    .select('data')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (error) {
    console.error(`api_cache read error for ${endpoint}:`, error);
    return null;
  }
  return (data?.data ?? null) as T | null;
}

// In-memory de-duplication: a single page render reads matches several times
// in parallel (live + upcoming + today). Share one DB read per endpoint for a
// short window. Failures are NOT cached so the next poll can recover.
const MEM_TTL = 30_000;
const memCache: Record<string, { ts: number; promise: Promise<any> }> = {};

function cachedFetch<T>(endpoint: string): Promise<T | null> {
  const hit = memCache[endpoint];
  if (hit && Date.now() - hit.ts < MEM_TTL) {
    return hit.promise as Promise<T | null>;
  }
  const promise = readCachedData<T>(endpoint).then(res => {
    if (res == null) delete memCache[endpoint];
    return res;
  });
  memCache[endpoint] = { ts: Date.now(), promise };
  return promise;
}

export async function fetchFromHighlightly<T>(endpoint: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('highlightly-sync', {
      body: { endpoint }
    });

    if (error) {
      console.error(`Edge Function Error for ${endpoint}:`, error);
      return null;
    }

    if (data.error) {
      console.error(`Highlightly API Error for ${endpoint}:`, data.error);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error(`Fetch exception for ${endpoint}:`, error);
    return null;
  }
}

// ============================================================================
// ADAPTERS
// ============================================================================

export function getIsoCode(teamName: string): string {
  if (!teamName) return '';
  const tc = teamName.toLowerCase().trim();
  const found = WC2026_TEAMS.find(t => t.code === tc || t.name.toLowerCase() === tc);
  if (found) return found.code;
  
  const map: Record<string, string> = {
    'usa': 'us',
    'united states': 'us',
    'south korea': 'kr',
    'korea republic': 'kr',
    'england': 'gb-eng',
    'wales': 'gb-wls',
    'scotland': 'gb-sct'
  };
  return map[tc] || tc;
}

function parseScore(scoreString: string | null): { home: number | null, away: number | null } {
  if (!scoreString) return { home: null, away: null };
  const parts = scoreString.split(' - ');
  if (parts.length === 2) {
    return { home: parseInt(parts[0], 10), away: parseInt(parts[1], 10) };
  }
  return { home: null, away: null };
}

function mapHighlightlyMatchToMatch(apiData: any): Match {
  const score = parseScore(apiData.state?.score?.current);
  
  // Highlightly statuses: "Not started", "First half", "Second half", "Finished", etc.
  const desc = apiData.state?.description || 'Not started';
  let shortStatus = 'NS';
  if (desc === 'Finished') shortStatus = 'FT';
  else if (desc === 'Finished after penalties') shortStatus = 'PEN';
  else if (desc === 'Finished after extra time') shortStatus = 'AET';
  else if (desc === 'First half' || desc === 'Second half' || desc === 'In progress') shortStatus = '1H'; // or 2H

  return {
    fixture: {
      id: apiData.id,
      date: apiData.date,
      timestamp: new Date(apiData.date).getTime() / 1000,
      status: {
        long: desc,
        short: shortStatus,
        elapsed: apiData.state?.clock || 0
      },
      venue: null // Highlightly basic match doesn't have venue in the list
    },
    league: {
      id: apiData.league?.id || 1635,
      name: apiData.league?.name || 'World Cup',
      round: apiData.round || 'Group Stage',
      group: apiData.round?.includes('Group') ? apiData.round : ''
    },
    teams: {
      home: {
        id: apiData.homeTeam?.id || 0,
        name: apiData.homeTeam?.name || '',
        code: getIsoCode(apiData.homeTeam?.name || ''),
        logo: apiData.homeTeam?.logo || ''
      },
      away: {
        id: apiData.awayTeam?.id || 0,
        name: apiData.awayTeam?.name || '',
        code: getIsoCode(apiData.awayTeam?.name || ''),
        logo: apiData.awayTeam?.logo || ''
      }
    },
    goals: {
      home: score.home,
      away: score.away
    },
    score: {
      halftime: { home: null, away: null },
      fulltime: score,
      extratime: { home: null, away: null },
      penalty: parseScore(apiData.state?.score?.penalties)
    }
  };
}

// ============================================================================
// MOCK FALLBACK DATA (For API Limits/Empty State)
// ============================================================================

function generateMockStandings(): StandingGroup[] {
  const groups: StandingGroup[] = [];
  const groupNames = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  let teamIdx = 0;
  for (let i = 0; i < 12; i++) {
    const standings: Standing[] = [];
    for (let j = 0; j < 4; j++) {
      if (teamIdx >= WC2026_TEAMS.length) break;
      const team = WC2026_TEAMS[teamIdx++];
      standings.push({
        rank: j + 1,
        team: { id: teamIdx, name: team.name, code: team.code, logo: '' },
        points: (3-j) * 3,
        goalsDiff: (3-j),
        group: `Group ${groupNames[i]}`,
        form: '',
        status: '',
        description: '',
        all: { played: 3, win: 3-j, draw: 0, lose: j, goals: { home: 3, away: j } },
        home: { played: 1, win: 0, draw: 0, lose: 0, goals: { home: 0, away: 0 } },
        away: { played: 1, win: 0, draw: 0, lose: 0, goals: { home: 0, away: 0 } },
      });
    }
    groups.push({ group: `Group ${groupNames[i]}`, standings });
  }
  return groups;
}

function generateMockMatches(): Match[] {
  const matches: Match[] = [];
  
  // 1. Live Match
  matches.push({
    fixture: { id: 9991, date: new Date().toISOString(), timestamp: Date.now()/1000, status: { long: 'In Progress', short: '1H', elapsed: 34 }, venue: { name: 'Estadio Azteca', city: 'Mexico City' } },
    league: { id: 1635, name: 'World Cup', round: 'Group Stage', group: 'Group A' },
    teams: {
      home: { id: 1, name: 'Argentina', code: 'ar', logo: '' },
      away: { id: 2, name: 'Spain', code: 'es', logo: '' }
    },
    goals: { home: 1, away: 0 },
    score: { halftime: {home:null, away:null}, fulltime: {home:null, away:null}, extratime: null, penalty: null }
  });
  
  // 2. Upcoming Match (in 2 hours)
  matches.push({
    fixture: { id: 9992, date: new Date(Date.now() + 7200000).toISOString(), timestamp: (Date.now() + 7200000)/1000, status: { long: 'Not Started', short: 'NS', elapsed: 0 }, venue: { name: 'MetLife Stadium', city: 'New Jersey' } },
    league: { id: 1635, name: 'World Cup', round: 'Group Stage', group: 'Group B' },
    teams: {
      home: { id: 3, name: 'Brazil', code: 'br', logo: '' },
      away: { id: 4, name: 'France', code: 'fr', logo: '' }
    },
    goals: { home: null, away: null },
    score: { halftime: {home:null, away:null}, fulltime: {home:null, away:null}, extratime: null, penalty: null }
  });

  // 3. Finished Match (Yesterday)
  matches.push({
    fixture: { id: 9993, date: new Date(Date.now() - 86400000).toISOString(), timestamp: (Date.now() - 86400000)/1000, status: { long: 'Finished', short: 'FT', elapsed: 90 }, venue: { name: 'SoFi Stadium', city: 'Los Angeles' } },
    league: { id: 1635, name: 'World Cup', round: 'Group Stage', group: 'Group C' },
    teams: {
      home: { id: 5, name: 'England', code: 'gb-eng', logo: '' },
      away: { id: 6, name: 'Germany', code: 'de', logo: '' }
    },
    goals: { home: 2, away: 1 },
    score: { halftime: {home:1, away:0}, fulltime: {home:2, away:1}, extratime: null, penalty: null }
  });

  return matches;
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function getAllFixtures(): Promise<Match[]> {
  const data = await cachedFetch<any>('matches');
  if (!data || !data.data || data.data.length === 0) {
    console.warn("Using mock matches due to missing data or rate limit");
    return generateMockMatches();
  }
  return data.data.map(mapHighlightlyMatchToMatch);
}

export async function getLiveMatches(): Promise<Match[]> {
  const matches = await getAllFixtures();
  return matches.filter(m => !['NS', 'FT', 'PEN', 'AET', 'PST'].includes(m.fixture.status.short));
}

export async function getUpcomingMatches(next = 5): Promise<Match[]> {
  const matches = await getAllFixtures();
  const upcoming = matches
    .filter(m => m.fixture.status.short === 'NS')
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  return upcoming.slice(0, next);
}

export async function getTodayMatches(): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0];
  const matches = await getAllFixtures();
  return matches
    .filter(m => m.fixture.date.startsWith(today))
    .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
}

export async function getFixtureById(id: number): Promise<Match | null> {
  const matches = await getAllFixtures();
  return matches.find(m => m.fixture.id === id) || null;
}

export async function getStandings(): Promise<StandingGroup[]> {
  const apiResponse = await cachedFetch<any>('standings');
  if (!apiResponse || !apiResponse.groups || apiResponse.groups.length === 0) {
    console.warn("Using mock standings due to missing data or rate limit");
    return generateMockStandings();
  }
  
  return apiResponse.groups.map((g: any) => {
    const mappedStandings: Standing[] = g.standings.map((s: any) => ({
      rank: s.position,
      team: {
        id: s.team.id,
        name: s.team.name,
        code: getIsoCode(s.team.name),
        logo: s.team.logo
      },
      points: s.points,
      goalsDiff: s.total.scoredGoals - s.total.receivedGoals,
      group: g.name,
      form: '', // Highlightly standings don't provide form directly
      status: '',
      description: '',
      all: {
        played: s.total.games,
        win: s.total.wins,
        draw: s.total.draws,
        lose: s.total.loses,
        goals: {
          home: s.total.scoredGoals,
          away: s.total.receivedGoals
        }
      },
      home: {
        played: s.home.games,
        win: s.home.wins,
        draw: s.home.draws,
        lose: s.home.loses,
        goals: {
          home: s.home.scoredGoals,
          away: s.home.receivedGoals
        }
      },
      away: {
        played: s.away.games,
        win: s.away.wins,
        draw: s.away.draws,
        lose: s.away.loses,
        goals: {
          home: s.away.scoredGoals,
          away: s.away.receivedGoals
        }
      }
    }));

    return {
      group: g.name,
      standings: mappedStandings
    };
  });
}
