import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAllFixtures, getIsoCode } from '../lib/api-football';
import { FlagImage } from '../components/FlagImage';
import { usePredictions } from '../hooks/usePredictions';
import { WC2026_TEAMS } from '../types';
import type { Match } from '../types';

// Lock icon SVG
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ============================================================
// Single match prediction row
// ============================================================

interface PredictionRowProps {
  match: Match;
  savedHome?: number;
  savedAway?: number;
  onSave: (fixtureId: number, h: number, a: number) => Promise<void>;
  saving: boolean;
}

function PredictionRow({ match, savedHome, savedAway, onSave, saving }: PredictionRowProps) {
  const { fixture, teams, goals } = match;
  const homeCode = getIsoCode(teams.home.code);
  const awayCode = getIsoCode(teams.away.code);
  const isLocked = new Date(fixture.date).getTime() <= Date.now();
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
  const isLive = ['1H', 'HT', '2H', 'ET', 'LIVE'].includes(fixture.status.short);

  const [home, setHome] = useState<string>(savedHome !== undefined ? String(savedHome) : '');
  const [away, setAway] = useState<string>(savedAway !== undefined ? String(savedAway) : '');
  const [saved, setSaved] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);

  // Sync with saved values
  useEffect(() => {
    if (savedHome !== undefined) setHome(String(savedHome));
    if (savedAway !== undefined) setAway(String(savedAway));
  }, [savedHome, savedAway]);

  const handleSave = async () => {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setLocalSaving(true);
    await onSave(fixture.id, h, a);
    setLocalSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const kickoff = new Date(fixture.date);
  const dateStr = format(kickoff, "EEE d MMM, HH:mm", { locale: es });
  const hasPrediction = savedHome !== undefined && savedAway !== undefined;

  return (
    <div
      className="card p-4 transition-all duration-200"
      style={{
        borderColor: isLive ? 'rgba(0,210,106,0.3)' : hasPrediction && !isLocked ? 'rgba(0,210,106,0.15)' : 'var(--bg-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {match.league?.round ?? 'Grupo'}
          </span>
          {match.league?.group && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              · Grupo {match.league.group.replace('Group ', '')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLocked && <LockIcon />}
          {isLive && (
            <span className="badge badge-live text-xs animate-pulse-live">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
              {fixture.status.elapsed}'
            </span>
          )}
          {isFinished && <span className="badge badge-finished text-xs">FT</span>}
          {!isLocked && (
            <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
          )}
        </div>
      </div>

      {/* Teams + Inputs */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FlagImage code={homeCode} teamName={teams.home.name} size="sm" />
          <span className="text-sm font-semibold truncate">{teams.home.name}</span>
        </div>

        {/* Score inputs or result */}
        <div className="flex items-center gap-2 shrink-0">
          {isLocked ? (
            <div className="flex items-center gap-2">
              {/* User's prediction (faded) */}
              {hasPrediction && (
                <span
                  className="text-sm tabular-nums px-2 rounded"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-base)' }}
                >
                  {savedHome}–{savedAway}
                </span>
              )}
              {/* Actual result */}
              {isFinished && (
                <span className="text-lg font-bold tabular-nums px-2">
                  {goals.home}–{goals.away}
                </span>
              )}
              {isLive && (
                <span
                  className="text-lg font-bold tabular-nums px-2 animate-count-pulse"
                  style={{ color: 'var(--accent-green)' }}
                >
                  {goals.home}–{goals.away}
                </span>
              )}
              {!isFinished && !isLive && (
                <span className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {format(kickoff, 'HH:mm')}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={99}
                className="score-input"
                value={home}
                onChange={e => setHome(e.target.value)}
                disabled={isLocked || localSaving || saving}
                placeholder="–"
              />
              <span className="text-lg font-light" style={{ color: 'var(--text-muted)' }}>:</span>
              <input
                type="number"
                min={0}
                max={99}
                className="score-input"
                value={away}
                onChange={e => setAway(e.target.value)}
                disabled={isLocked || localSaving || saving}
                placeholder="–"
              />
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold truncate text-right">{teams.away.name}</span>
          <FlagImage code={awayCode} teamName={teams.away.name} size="sm" />
        </div>
      </div>

      {/* Save button */}
      {!isLocked && (
        <div className="flex justify-end mt-3">
          <button
            className="btn btn-primary text-xs py-1.5 px-4"
            onClick={handleSave}
            disabled={localSaving || saving || home === '' || away === ''}
          >
            {saved ? 'Guardado' : localSaving ? 'Guardando...' : hasPrediction ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Champion Picker
// ============================================================

interface ChampionPickerProps {
  current: { team_name: string; team_code: string } | null;
  onSave: (name: string, code: string) => Promise<{ error: string | null }>;
  saving: boolean;
}

function ChampionPicker({ current, onSave, saving }: ChampionPickerProps) {
  const [selected, setSelected] = useState(current?.team_code ?? '');
  const [saved, setSaved] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => {
    if (current?.team_code) setSelected(current.team_code);
  }, [current]);

  const handleSave = async () => {
    const team = WC2026_TEAMS.find(t => t.code === selected);
    if (!team) return;
    setLocalSaving(true);
    await onSave(team.name, team.code);
    setLocalSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedTeam = WC2026_TEAMS.find(t => t.code === selected);

  return (
    <div
      className="card p-5"
      style={{
        borderColor: 'rgba(245,197,24,0.2)',
        background: 'linear-gradient(135deg, #1a1a10 0%, var(--bg-card) 60%)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="8"/>
            <path d="M6 8H4a2 2 0 0 1-2-2V4h4"/><path d="M18 8h2a2 2 0 0 0 2-2V4h-4"/>
            <rect x="6" y="4" width="12" height="8" rx="1"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold">Campeon del Mundial</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            +10 puntos si acertas al ganador
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {selectedTeam && (
          <FlagImage code={selectedTeam.code} teamName={selectedTeam.name} size="md" />
        )}
        <select
          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium appearance-none"
          style={{
            background: 'var(--bg-base)',
            border: '2px solid var(--bg-border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Selecciona un pais</option>
          {WC2026_TEAMS.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>

      {current && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Prediccion actual:{' '}
          <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>
            {current.team_name}
          </span>
        </p>
      )}

      <button
        className="btn w-full"
        style={{ background: 'var(--accent-gold)', color: '#000' }}
        onClick={handleSave}
        disabled={!selected || localSaving || saving}
      >
        {saved ? 'Guardado' : localSaving ? 'Guardando...' : current ? 'Actualizar campeon' : 'Guardar campeon'}
      </button>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function Predictions() {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<string>('all');

  const { predictions, championPrediction, saving, savePrediction, saveChampion, getPredictionForFixture } = usePredictions();

  useEffect(() => {
    getAllFixtures()
      .then(all => {
        const sorted = [...all].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
        setFixtures(sorted);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Get unique rounds
  const rounds = ['all', ...Array.from(new Set(fixtures.map(m => m.league?.round ?? 'Grupo'))).sort()];

  const filteredFixtures = activeRound === 'all'
    ? fixtures
    : fixtures.filter(m => (m.league?.round ?? 'Grupo') === activeRound);

  const handleSave = useCallback(async (fixtureId: number, h: number, a: number) => {
    const { error } = await savePrediction(fixtureId, h, a);
    if (error) console.error('Error saving prediction:', error);
  }, [savePrediction]);

  const totalPredicted = predictions.length;
  const totalLocked = fixtures.filter(m => new Date(m.fixture.date).getTime() <= Date.now()).length;

  return (
    <main className="page pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black">Mis Predicciones</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Predeci los partidos antes del pitazo inicial
        </p>
      </div>

      {/* Stats bar */}
      {!loading && fixtures.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Predicciones', value: totalPredicted, color: 'var(--accent-green)' },
            { label: 'Bloqueados', value: totalLocked, color: 'var(--accent-gold)' },
            { label: 'Total', value: fixtures.length, color: 'var(--text-secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          Error: {error}
        </div>
      )}

      {/* Round filter */}
      {!loading && rounds.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {rounds.map(r => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeRound === r ? 'var(--accent-green)' : 'var(--bg-card)',
                color: activeRound === r ? '#000' : 'var(--text-muted)',
                border: activeRound === r ? 'none' : '1px solid var(--bg-border)',
              }}
            >
              {r === 'all' ? 'Todos' : r}
            </button>
          ))}
        </div>
      )}

      {/* Match list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="flex items-center gap-4">
                <div className="skeleton flex-1 h-8 rounded" />
                <div className="skeleton w-24 h-10 rounded" />
                <div className="skeleton flex-1 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">No hay partidos en este filtro</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {filteredFixtures.map(match => {
            const pred = getPredictionForFixture(match.fixture.id);
            return (
              <PredictionRow
                key={match.fixture.id}
                match={match}
                savedHome={pred?.home_score}
                savedAway={pred?.away_score}
                onSave={handleSave}
                saving={saving}
              />
            );
          })}
        </div>
      )}

      {/* Champion Picker */}
      {!loading && (
        <ChampionPicker
          current={championPrediction}
          onSave={saveChampion}
          saving={saving}
        />
      )}
    </main>
  );
}
