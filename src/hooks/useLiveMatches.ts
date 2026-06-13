import { useEffect, useRef, useState } from 'react';
import { getLiveMatches, getUpcomingMatches, getTodayMatches } from '../lib/api-football';
import type { Match } from '../types';

const POLL_INTERVAL = 120_000; // 2 min — data is refreshed server-side every ~10 min

export function useLiveMatches() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchAll() {
    try {
      const [live, upcoming, today] = await Promise.all([
        getLiveMatches(),
        getUpcomingMatches(3),
        getTodayMatches(),
      ]);
      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      setTodayMatches(today);
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

  return { liveMatches, upcomingMatches, todayMatches, loading, error, refetch: fetchAll };
}
