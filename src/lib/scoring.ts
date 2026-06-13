import type { Match, ScoringResult } from '../types';

/**
 * Scoring rules:
 * - Exact result (same home & away goals)      → 3 pts
 * - Correct winner + same goal difference       → 2 pts
 * - Correct winner/draw only                   → 1 pt
 * - Wrong                                      → 0 pts
 * - Champion correct                           → +10 pts bonus
 */

function getOutcome(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

export function scoreOnePrediction(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): ScoringResult['type'] {
  // Exact result
  if (predHome === actualHome && predAway === actualAway) return 'exact';

  const predOutcome = getOutcome(predHome, predAway);
  const actualOutcome = getOutcome(actualHome, actualAway);

  if (predOutcome !== actualOutcome) return 'miss';

  // Same winner + same goal difference
  if (predHome - predAway === actualHome - actualAway) return 'outcome_and_diff';

  // Only outcome correct
  return 'outcome';
}

export function pointsForType(type: ScoringResult['type']): number {
  switch (type) {
    case 'exact':            return 3;
    case 'outcome_and_diff': return 2;
    case 'outcome':          return 1;
    default:                 return 0;
  }
}

export interface PredictionRecord {
  fixture_id: number;
  home_score: number;
  away_score: number;
}

export function calculateUserScore(
  predictions: PredictionRecord[],
  finishedMatches: Match[],
  championCorrect = false
): {
  total: number;
  exact: number;
  outcome_and_diff: number;
  outcome: number;
  miss: number;
  results: ScoringResult[];
} {
  const matchMap = new Map<number, Match>();
  for (const m of finishedMatches) {
    matchMap.set(m.fixture.id, m);
  }

  let total = 0;
  let exact = 0;
  let outcome_and_diff_count = 0;
  let outcome_count = 0;
  let miss = 0;
  const results: ScoringResult[] = [];

  for (const pred of predictions) {
    const match = matchMap.get(pred.fixture_id);
    if (!match) {
      results.push({ fixture_id: pred.fixture_id, points: 0, type: 'pending' });
      continue;
    }

    const ah = match.goals.home;
    const aa = match.goals.away;

    if (ah === null || aa === null) {
      results.push({ fixture_id: pred.fixture_id, points: 0, type: 'pending' });
      continue;
    }

    const type = scoreOnePrediction(pred.home_score, pred.away_score, ah, aa);
    const pts = pointsForType(type);
    total += pts;

    if (type === 'exact')            exact++;
    if (type === 'outcome_and_diff') outcome_and_diff_count++;
    if (type === 'outcome')          outcome_count++;
    if (type === 'miss')             miss++;

    results.push({ fixture_id: pred.fixture_id, points: pts, type });
  }

  if (championCorrect) total += 10;

  return { total, exact, outcome_and_diff: outcome_and_diff_count, outcome: outcome_count, miss, results };
}
