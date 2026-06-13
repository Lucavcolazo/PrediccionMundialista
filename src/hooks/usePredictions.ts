import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Prediction, ChampionPrediction } from '../types';

export function usePredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [championPrediction, setChampionPrediction] = useState<ChampionPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPredictions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [predsResult, champResult] = await Promise.all([
      supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('champion_predictions')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ]);
    setPredictions(predsResult.data ?? []);
    setChampionPrediction(champResult.data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const savePrediction = async (
    fixtureId: number,
    homeScore: number,
    awayScore: number
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    setSaving(true);
    const { error } = await supabase.from('predictions').upsert(
      {
        user_id: user.id,
        fixture_id: fixtureId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,fixture_id' }
    );
    setSaving(false);
    if (!error) {
      // Update local state
      setPredictions(prev => {
        const existing = prev.findIndex(p => p.fixture_id === fixtureId);
        const updated = {
          id: '',
          user_id: user.id,
          fixture_id: fixtureId,
          home_score: homeScore,
          away_score: awayScore,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }
    return { error: error?.message ?? null };
  };

  const saveChampion = async (
    teamName: string,
    teamCode: string
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    setSaving(true);
    const { error } = await supabase.from('champion_predictions').upsert(
      {
        user_id: user.id,
        team_name: teamName,
        team_code: teamCode,
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    if (!error) {
      setChampionPrediction({
        id: '',
        user_id: user.id,
        team_name: teamName,
        team_code: teamCode,
        created_at: new Date().toISOString(),
      });
    }
    return { error: error?.message ?? null };
  };

  const getPredictionForFixture = (fixtureId: number): Prediction | undefined => {
    return predictions.find(p => p.fixture_id === fixtureId);
  };

  return {
    predictions,
    championPrediction,
    loading,
    saving,
    savePrediction,
    saveChampion,
    getPredictionForFixture,
    refetch: fetchPredictions,
  };
}
