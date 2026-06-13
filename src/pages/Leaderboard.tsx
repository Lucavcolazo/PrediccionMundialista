import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAllFixtures } from '../lib/api-football';
import { calculateUserScore } from '../lib/scoring';
import { useAuth } from '../contexts/AuthContext';
import type { Match, LeaderboardEntry } from '../types';
import type { Prediction, ChampionPrediction } from '../types';

interface UserPredictionsModalProps {
  userId: string;
  username: string;
  fixtures: Match[];
  onClose: () => void;
}

function UserPredictionsModal({ userId, username, fixtures, onClose }: UserPredictionsModalProps) {
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [champ, setChamp] = useState<ChampionPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('predictions').select('*').eq('user_id', userId),
      supabase.from('champion_predictions').select('*').eq('user_id', userId).single(),
    ]).then(([predsRes, champRes]) => {
      setPreds(predsRes.data ?? []);
      setChamp(champRes.data ?? null);
      setLoading(false);
    });
  }, [userId]);

  const fixtureMap = new Map(fixtures.map(f => [f.fixture.id, f]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h3 className="font-bold">Predicciones de {username}</h3>
            {champ && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Campeón: <span style={{ color: 'var(--accent-gold)' }}>{champ.team_name}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Predictions list */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))
          ) : preds.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              Sin predicciones guardadas
            </p>
          ) : (
            preds.map(pred => {
              const match = fixtureMap.get(pred.fixture_id);
              if (!match) return null;
              const isFinished = ['FT', 'AET', 'PEN'].includes(match.fixture.status.short);
              const actualHome = match.goals.home;
              const actualAway = match.goals.away;
              let scoreType: string | null = null;

              if (isFinished && actualHome !== null && actualAway !== null) {
                if (pred.home_score === actualHome && pred.away_score === actualAway) {
                  scoreType = 'exact';
                } else {
                  const pDiff = pred.home_score - pred.away_score;
                  const aDiff = actualHome - actualAway;
                  const pOut = pDiff > 0 ? 'H' : pDiff < 0 ? 'A' : 'D';
                  const aOut = aDiff > 0 ? 'H' : aDiff < 0 ? 'A' : 'D';
                  if (pOut === aOut) {
                    scoreType = pDiff === aDiff ? 'diff' : 'outcome';
                  } else {
                    scoreType = 'miss';
                  }
                }
              }

              const badgeMap: Record<string, { label: string; color: string }> = {
                exact:   { label: '+3', color: 'var(--accent-green)' },
                diff:    { label: '+2', color: 'var(--accent-blue)' },
                outcome: { label: '+1', color: 'var(--accent-gold)' },
                miss:    { label: '0',  color: 'var(--text-muted)' },
              };
              const badge = scoreType ? badgeMap[scoreType] : null;

              return (
                <div
                  key={pred.fixture_id}
                  className="flex items-center gap-3 p-2 rounded-lg text-xs"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="flex-1 font-medium truncate">
                    {match.teams.home.name}
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {pred.home_score}–{pred.away_score}
                  </span>
                  {isFinished && (
                    <span className="font-bold tabular-nums text-white">
                      {actualHome}–{actualAway}
                    </span>
                  )}
                  <span className="flex-1 font-medium truncate text-right">
                    {match.teams.away.name}
                  </span>
                  {badge && (
                    <span className="font-bold text-xs shrink-0" style={{ color: badge.color, minWidth: '20px', textAlign: 'right' }}>
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Leaderboard
// ============================================================

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch fixtures and all predictions + profiles in parallel
        const [allFixtures, profilesRes, predsRes, champRes] = await Promise.all([
          getAllFixtures(),
          supabase.from('profiles').select('*'),
          supabase.from('predictions').select('*'),
          supabase.from('champion_predictions').select('*'),
        ]);

        setFixtures(allFixtures);

        const profiles = profilesRes.data ?? [];
        const allPreds = predsRes.data ?? [];
        const allChamp = champRes.data ?? [];

        // Finished matches
        const finished = allFixtures.filter(m =>
          ['FT', 'AET', 'PEN'].includes(m.fixture.status.short)
        );

        // Calculate champion (this is a placeholder — actual champion unknown until final)
        const actualChampion: string | null = null; // Set when tournament ends

        // Score per user
        const leaderboard: LeaderboardEntry[] = profiles.map(profile => {
          const userPreds = allPreds.filter(p => p.user_id === profile.id);
          const userChamp = allChamp.find(c => c.user_id === profile.id);
          const championCorrect = actualChampion !== null && userChamp?.team_code === actualChampion;

          const score = calculateUserScore(
            userPreds.map(p => ({
              fixture_id: p.fixture_id,
              home_score: p.home_score,
              away_score: p.away_score,
            })),
            finished,
            championCorrect
          );

          const total = userPreds.length;
          const scored = score.exact + score.outcome_and_diff + score.outcome;

          return {
            user_id: profile.id,
            username: profile.username,
            email: profile.email,
            total_points: score.total,
            exact_results: score.exact,
            correct_outcomes: score.outcome,
            total_predicted: total,
            accuracy_pct: total > 0 ? Math.round((scored / total) * 100) : 0,
            champion_correct: championCorrect,
          };
        });

        // Sort by points
        leaderboard.sort((a, b) => b.total_points - a.total_points);
        setEntries(leaderboard);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el leaderboard');
        setLoading(false);
      }
    }

    load();
  }, []);

  const medalMap: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

  return (
    <main className="page pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black">🏆 Tabla de Puntos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Exacto: 3pts · Ganador+DG: 2pts · Solo ganador: 1pt · Campeón: +10pts
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👀</p>
            <p className="font-bold">Nadie hizo predicciones todavía</p>
          </div>
        ) : (
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ textAlign: 'left' }}>Jugador</th>
                <th title="Puntos totales" style={{ color: 'var(--accent-gold)' }}>Pts</th>
                <th title="Exactos (3pts)" className="hidden sm:table-cell">Exactos</th>
                <th title="% de acierto" className="hidden sm:table-cell">Acierto</th>
                <th title="Ver predicciones" style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <tr
                    key={entry.user_id}
                    className="transition-colors"
                    style={{
                      background: isCurrentUser ? 'rgba(0,210,106,0.05)' : 'transparent',
                    }}
                  >
                    <td>
                      <span className="text-base">
                        {medalMap[idx] ?? (
                          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                            {idx + 1}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                          style={{ background: isCurrentUser ? 'var(--accent-green)' : 'var(--bg-border)' }}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs" style={{ color: 'var(--accent-green)' }}>
                                (vos)
                              </span>
                            )}
                          </p>
                          {entry.champion_correct && (
                            <p className="text-xs" style={{ color: 'var(--accent-gold)' }}>
                              🏆 Acertó el campeón
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-black text-lg" style={{ color: 'var(--accent-gold)' }}>
                        {entry.total_points}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="font-semibold" style={{ color: 'var(--accent-green)' }}>
                        {entry.exact_results}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {entry.accuracy_pct}%
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedUser(entry)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ color: 'var(--text-muted)' }}
                        title="Ver predicciones"
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Point system legend */}
      <div className="mt-6 card p-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-muted)' }}>Sistema de puntos</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Resultado exacto', pts: '3 pts', color: 'var(--accent-green)' },
            { label: 'Ganador + diferencia de goles', pts: '2 pts', color: 'var(--accent-blue)' },
            { label: 'Solo ganador / empate', pts: '1 pt', color: 'var(--accent-gold)' },
            { label: 'Campeón correcto (bonus final)', pts: '+10 pts', color: 'var(--accent-gold)' },
          ].map(({ label, pts, color }) => (
            <div key={label} className="flex items-center justify-between gap-2 p-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-bold shrink-0" style={{ color }}>{pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserPredictionsModal
          userId={selectedUser.user_id}
          username={selectedUser.username}
          fixtures={fixtures}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </main>
  );
}
