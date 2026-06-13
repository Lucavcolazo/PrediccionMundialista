import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAllFixtures } from '../lib/api-football';
import { calculateUserScore } from '../lib/scoring';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Trophy } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
          <div>
            <h3 className="font-bebas text-2xl tracking-[1px] text-[var(--accent-gold)]">PREDICCIONES DE {username.toUpperCase()}</h3>
            {champ && (
              <p className="text-[11px] uppercase tracking-[1px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Campeón:{' '}
                <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>{champ.team_name}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-colors hover:bg-[var(--bg-border)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        {/* Predictions list */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))
          ) : preds.length === 0 ? (
            <p className="text-center py-10 font-bebas text-xl" style={{ color: 'var(--text-muted)' }}>
              SIN PREDICCIONES GUARDADAS
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
                  className="flex items-center gap-3 p-3 rounded-xl text-sm border border-[var(--bg-border)]"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <span className="flex-1 font-medium truncate">
                    {match.teams.home.name}
                  </span>
                  <span className="font-mono-score font-bold px-2 py-1 rounded" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                    {pred.home_score} – {pred.away_score}
                  </span>
                  {isFinished && (
                    <span className="font-mono-score font-bold px-2 py-1 rounded text-black bg-[var(--text-primary)]">
                      {actualHome} – {actualAway}
                    </span>
                  )}
                  <span className="flex-1 font-medium truncate text-right">
                    {match.teams.away.name}
                  </span>
                  {badge && (
                    <span
                      className="font-mono-score font-black text-sm shrink-0 ml-2"
                      style={{ color: badge.color, minWidth: '24px', textAlign: 'right' }}
                    >
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

        const finished = allFixtures.filter(m =>
          ['FT', 'AET', 'PEN'].includes(m.fixture.status.short)
        );

        const actualChampion: string | null = null;

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

  // Medal positions using CSS/text only
  const rankLabel = (idx: number) => {
    if (idx === 0) return <span className="font-bebas text-2xl text-[var(--accent-gold)]">1</span>;
    if (idx === 1) return <span className="font-bebas text-xl text-zinc-400">2</span>;
    if (idx === 2) return <span className="font-bebas text-xl text-amber-700">3</span>;
    return <span className="font-bebas text-lg text-[var(--text-muted)]">{idx + 1}</span>;
  };

  return (
    <main className="page pb-24 md:pb-8">
      <div className="flex items-center gap-3.5 mb-10">
        <div className="w-11 h-11 bg-[var(--accent-gold-dim)] border border-[rgba(201,168,76,0.3)] rounded-xl flex items-center justify-center text-[var(--accent-gold)]">
          <Trophy size={22} />
        </div>
        <div>
          <h1 className="font-bebas text-4xl tracking-[3px] text-[var(--text-primary)] leading-none">
            LEADERBOARD
          </h1>
          <div className="text-xs text-[var(--text-muted)] mt-1 tracking-[0.5px]">
            Los mejores pronosticadores del mundial
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          Error: {error}
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
          <div className="p-16 text-center">
            <p className="font-bebas text-2xl tracking-[1px] text-[var(--text-muted)]">NADIE HIZO PREDICCIONES TODAVÍA</p>
          </div>
        ) : (
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '20px' }}>#</th>
                <th style={{ textAlign: 'left' }}>Jugador</th>
                <th title="Puntos totales" style={{ color: 'var(--accent-gold)' }}>Pts</th>
                <th title="Exactos (3pts)" className="hidden sm:table-cell">Exactos</th>
                <th title="% de acierto" className="hidden sm:table-cell">Acierto</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <tr
                    key={entry.user_id}
                    className="transition-colors group"
                    style={{ background: isCurrentUser ? 'var(--accent-gold-dim)' : 'transparent' }}
                  >
                    <td style={{ paddingLeft: '20px' }}>
                      {rankLabel(idx)}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0"
                          style={{ background: isCurrentUser ? 'var(--accent-gold)' : 'var(--bg-border)' }}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {entry.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent-gold)' }}>
                                (vos)
                              </span>
                            )}
                          </p>
                          {entry.champion_correct && (
                            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--accent-gold)' }}>
                              Acertó el campeón
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono-score font-black text-xl" style={{ color: 'var(--accent-gold)' }}>
                        {entry.total_points}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="font-mono-score font-bold" style={{ color: 'var(--text-muted)' }}>
                        {entry.exact_results}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="font-mono-score text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {entry.accuracy_pct}%
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedUser(entry)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-[var(--bg-border)] group-hover:bg-[var(--accent-gold)] group-hover:text-black mx-auto"
                        style={{ color: 'var(--text-muted)' }}
                        title="Ver predicciones"
                      >
                        <Eye size={16} />
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
      <div className="mt-8 card p-5 border border-[var(--bg-border)]">
        <h3 className="font-bebas tracking-[1px] text-lg mb-4 text-[var(--accent-gold)]">
          SISTEMA DE PUNTOS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Resultado exacto', pts: '+3 PTS', color: 'var(--accent-green)' },
            { label: 'Ganador + diferencia de goles', pts: '+2 PTS', color: 'var(--accent-blue)' },
            { label: 'Solo ganador o empate', pts: '+1 PT', color: 'var(--accent-gold)' },
            { label: 'Campeón correcto (bonus final)', pts: '+10 PTS', color: 'var(--accent-gold)' },
          ].map(({ label, pts, color }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 p-3 rounded-xl border border-[var(--bg-border)]"
              style={{ background: 'rgba(255,255,255,0.01)' }}
            >
              <span className="uppercase tracking-widest text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-mono-score font-black" style={{ color }}>{pts}</span>
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
