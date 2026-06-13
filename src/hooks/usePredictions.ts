import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Prediction, ChampionPrediction, GroupPrediction } from '../types';

export function usePredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [championPrediction, setChampionPrediction] = useState<ChampionPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPredictions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [predsResult, champResult, groupResult] = await Promise.all([
      supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('champion_predictions')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('group_predictions')
        .select('*')
        .eq('user_id', user.id),
    ]);
    setPredictions(predsResult.data ?? []);
    setChampionPrediction(champResult.data ?? null);
    setGroupPredictions(groupResult.data ?? []);
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

  const saveGroupPrediction = async (
    groupName: string,
    firstPlaceCode: string,
    secondPlaceCode: string,
    thirdPlaceCode: string | null
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    setSaving(true);
    const { error } = await supabase.from('group_predictions').upsert(
      {
        user_id: user.id,
        group_name: groupName,
        first_place_code: firstPlaceCode,
        second_place_code: secondPlaceCode,
        third_place_code: thirdPlaceCode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,group_name' }
    );
    setSaving(false);
    if (!error) {
      setGroupPredictions(prev => {
        const existing = prev.findIndex(p => p.group_name === groupName);
        const updated = {
          id: '',
          user_id: user.id,
          group_name: groupName,
          first_place_code: firstPlaceCode,
          second_place_code: secondPlaceCode,
          third_place_code: thirdPlaceCode,
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

  const getGroupPrediction = (groupName: string): GroupPrediction | undefined => {
    return groupPredictions.find(p => p.group_name === groupName);
  };

  return {
    predictions,
    groupPredictions,
    championPrediction,
    loading,
    saving,
    savePrediction,
    saveGroupPrediction,
    saveChampion,
    getPredictionForFixture,
    getGroupPrediction,
    refetch: fetchPredictions,
  };
}
