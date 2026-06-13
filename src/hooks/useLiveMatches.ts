import { useEffect, useRef, useState } from 'react';
import { getLiveMatches, getUpcomingMatches, getTodayResults } from '../lib/api-football';
import type { Match } from '../types';

const POLL_INTERVAL = 60_000; // 60 seconds

export function useLiveMatches() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [todayResults, setTodayResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchAll() {
    try {
      const [live, upcoming, today] = await Promise.all([
        getLiveMatches(),
        getUpcomingMatches(3),
        getTodayResults(),
      ]);
      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      // Filter today results to only finished matches
      setTodayResults(today.filter(m => m.fixture.status.short === 'FT' || m.fixture.status.short === 'AET' || m.fixture.status.short === 'PEN'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { liveMatches, upcomingMatches, todayResults, loading, error, refetch: fetchAll };
}
