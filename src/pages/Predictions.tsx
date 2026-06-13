import { useEffect, useState, useMemo } from 'react';
import { getStandings, getIsoCode } from '../lib/api-football';
import { FlagImage } from '../components/FlagImage';
import { usePredictions } from '../hooks/usePredictions';
import { WC2026_TEAMS } from '../types';
import { generateBracketNodes } from '../lib/simulator';
import { Bracket } from '../components/Bracket';
import { Edit3, Trophy, CheckCircle2 } from 'lucide-react';
import type { StandingGroup, GroupPrediction } from '../types';

// ============================================================
// Group Prediction Card
// ============================================================

interface GroupPredictionCardProps {
  group: StandingGroup;
  prediction?: GroupPrediction;
  onSave: (groupName: string, first: string, second: string, third: string | null) => Promise<{ error: string | null }>;
  saving: boolean;
}

function GroupPredictionCard({ group, prediction, onSave, saving }: GroupPredictionCardProps) {
  const [first, setFirst] = useState<string | null>(prediction?.first_place_code || null);
  const [second, setSecond] = useState<string | null>(prediction?.second_place_code || null);
  const [third, setThird] = useState<string | null>(prediction?.third_place_code || null);
  const [localSaving, setLocalSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFirst(prediction?.first_place_code || null);
    setSecond(prediction?.second_place_code || null);
    setThird(prediction?.third_place_code || null);
  }, [prediction]);

  const handleSelect = (teamCode: string) => {
    if (first === teamCode) setFirst(null);
    else if (second === teamCode) setSecond(null);
    else if (third === teamCode) setThird(null);
    else if (!first) setFirst(teamCode);
    else if (!second) setSecond(teamCode);
    else if (!third) setThird(teamCode);
  };

  const handleSave = async () => {
    if (!first || !second) return;
    setLocalSaving(true);
    await onSave(group.group, first, second, third);
    setLocalSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isComplete = first && second;
  const hasChanged = first !== (prediction?.first_place_code || null) ||
                     second !== (prediction?.second_place_code || null) ||
                     third !== (prediction?.third_place_code || null);

  const renderSlot = (label: string, code: string | null, num: number) => {
    const team = group.standings.find(s => s.team.code === code)?.team;
    return (
      <div 
        className="flex items-center gap-3 p-2 rounded-lg mb-2"
        style={{ background: 'var(--bg-base)', border: '1px solid var(--bg-border)' }}
      >
        <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" 
              style={{ background: code ? 'var(--accent-gold-dim)' : 'transparent', color: code ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
          {num}°
        </span>
        {team ? (
          <div className="flex items-center gap-2 flex-1">
            <FlagImage code={getIsoCode(team.code)} teamName={team.name} size="sm" />
            <span className="text-sm font-medium">{team.name}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--text-muted)] flex-1">{label}</span>
        )}
      </div>
    );
  };

  return (
    <div className="card p-4 animate-fade-in" style={{ borderColor: isComplete ? 'rgba(46,204,113,0.2)' : 'var(--bg-border)' }}>
      <h3 className="font-bebas text-xl tracking-[1px] mb-4">
        {group.group.replace('Group ', 'GRUPO ')}
      </h3>

      <div className="mb-4">
        {renderSlot('Elegir 1° puesto', first, 1)}
        {renderSlot('Elegir 2° puesto', second, 2)}
        {renderSlot('Elegir 3° puesto (Opcional)', third, 3)}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {group.standings.map(s => {
          const isSelected = first === s.team.code || second === s.team.code || third === s.team.code;
          return (
            <button
              key={s.team.id}
              onClick={() => handleSelect(s.team.code)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: isSelected ? 'var(--accent-gold)' : 'var(--bg-base)',
                color: isSelected ? '#000' : 'var(--text-primary)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent-gold)' : 'var(--bg-border)',
                opacity: isSelected ? 0.5 : 1
              }}
            >
              <FlagImage code={getIsoCode(s.team.code)} teamName={s.team.name} size="sm" />
              {s.team.name}
            </button>
          );
        })}
      </div>

      <button
        className="btn w-full py-2 text-xs"
        style={{
          background: isComplete ? 'var(--accent-gold)' : 'var(--bg-base)',
          color: isComplete ? '#000' : 'var(--text-muted)'
        }}
        onClick={handleSave}
        disabled={!isComplete || localSaving || saving || (!hasChanged && !saved)}
      >
        {saved ? <><CheckCircle2 size={14} /> Guardado</> : localSaving ? 'Guardando...' : 'Guardar posiciones'}
      </button>
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
    <div className="card p-6 md:p-8" style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(201,168,76,0.05) 100%)' }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <Trophy size={24} color="var(--accent-gold)" />
        </div>
        <div>
          <h3 className="font-bebas text-2xl tracking-[1px] text-[var(--accent-gold)]">CAMPEÓN DEL MUNDIAL</h3>
          <p className="text-xs mt-0.5 tracking-[0.5px]" style={{ color: 'var(--text-muted)' }}>+10 puntos si acertas al ganador</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="w-full flex items-center gap-4">
          {selectedTeam && (
            <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--bg-border)] overflow-hidden flex items-center justify-center">
              <FlagImage code={selectedTeam.code} teamName={selectedTeam.name} size="md" />
            </div>
          )}
          <select
            className="input flex-1 appearance-none text-sm font-medium cursor-pointer"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">Selecciona un país</option>
            {WC2026_TEAMS.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {current && (
        <p className="text-[11px] uppercase tracking-[1px] mb-4" style={{ color: 'var(--text-muted)' }}>
          Predicción actual: <span className="font-bold text-[var(--accent-gold)]">{current.team_name}</span>
        </p>
      )}

      <button
        className="btn w-full font-bold uppercase tracking-[1px]"
        style={{ background: 'var(--accent-gold)', color: '#000' }}
        onClick={handleSave}
        disabled={!selected || localSaving || saving}
      >
        {saved ? 'Guardado' : localSaving ? 'Guardando...' : current ? 'Actualizar campeón' : 'Guardar campeón'}
      </button>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function Predictions() {
  const [standings, setStandings] = useState<StandingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grupos' | 'bracket'>('grupos');
  
  const [userBracketPreds, setUserBracketPreds] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mundialhub_bracket');
    return saved ? JSON.parse(saved) : {};
  });

  const { groupPredictions, championPrediction, saving, saveGroupPrediction, saveChampion, getGroupPrediction } = usePredictions();

  useEffect(() => {
    getStandings()
      .then(data => {
        setStandings(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleBracketPredict = (nodeId: string, winnerCode: string) => {
    const updated = { ...userBracketPreds, [nodeId]: winnerCode };
    setUserBracketPreds(updated);
    localStorage.setItem('mundialhub_bracket', JSON.stringify(updated));
  };

  const completedGroups = groupPredictions.filter(p => p.first_place_code && p.second_place_code).length;

  const bracketNodes = useMemo(() => {
    if (loading || standings.length === 0) return {};
    return generateBracketNodes(groupPredictions, standings, userBracketPreds);
  }, [groupPredictions, standings, userBracketPreds, loading]);

  return (
    <main className="page max-w-none">
      <div className="max-w-[900px] mx-auto mb-10">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 bg-[var(--accent-gold-dim)] border border-[rgba(201,168,76,0.3)] rounded-xl flex items-center justify-center text-[var(--accent-gold)]">
            <Edit3 size={22} />
          </div>
          <div>
            <h1 className="font-bebas text-4xl tracking-[3px] text-[var(--text-primary)] leading-none">
              MIS PREDICCIONES
            </h1>
            <div className="text-xs text-[var(--text-muted)] mt-1 tracking-[0.5px]">
              Predecí el orden de los grupos y simulá la fase final
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && standings.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="font-mono-score text-3xl font-black mb-1" style={{ color: 'var(--accent-gold)' }}>
                {completedGroups} / {standings.length}
              </p>
              <p className="text-[10px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Grupos completados
              </p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-mono-score text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                {championPrediction ? 1 : 0} / 1
              </p>
              <p className="text-[10px] uppercase font-semibold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Campeón Elegido
              </p>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-xl p-1.5 mb-8 max-w-[400px] mx-auto">
          <button
            onClick={() => setActiveTab('grupos')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'grupos' ? 'bg-[var(--accent-gold)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Fase de Grupos
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'bracket' ? 'bg-[var(--accent-gold)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Fase Final
          </button>
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            Error: {error}
          </div>
        )}
      </div>

      {activeTab === 'grupos' ? (
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="card p-4 h-[300px]">
                  <div className="skeleton h-6 w-32 rounded mb-4" />
                  <div className="skeleton h-10 w-full rounded mb-2" />
                  <div className="skeleton h-10 w-full rounded mb-2" />
                  <div className="skeleton h-10 w-full rounded mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="skeleton h-8 w-20 rounded-full" />
                    <div className="skeleton h-8 w-20 rounded-full" />
                  </div>
                  <div className="skeleton h-10 w-full rounded mt-auto" />
                </div>
              ))}
            </div>
          ) : standings.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-bold">No hay grupos disponibles todavía</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
              {standings.map(group => (
                <GroupPredictionCard
                  key={group.group}
                  group={group}
                  prediction={getGroupPrediction(group.group)}
                  onSave={saveGroupPrediction}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in w-full">
          <div className="max-w-[900px] mx-auto mb-4 text-center">
            <h2 className="font-bebas text-3xl tracking-[1px] text-[var(--accent-gold)]">SIMULADOR DE LLAVES</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Los equipos se autocompletan basados en tus predicciones de fase de grupos.</p>
          </div>
          {loading ? (
            <div className="max-w-[900px] mx-auto card p-10 flex justify-center">
              <div className="skeleton w-full h-[400px] rounded-xl" />
            </div>
          ) : (
            <Bracket nodes={bracketNodes} onPredict={handleBracketPredict} />
          )}

          {!loading && (
            <div className="max-w-[900px] mx-auto mt-16 mb-12">
              <ChampionPicker
                current={championPrediction}
                onSave={saveChampion}
                saving={saving}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
