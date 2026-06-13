import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStandings, getAllFixtures, getIsoCode } from '../lib/api-football';
import { FlagImage } from '../components/FlagImage';
import { BarChart2, ChevronDown } from 'lucide-react';
import type { StandingGroup, Match } from '../types';

function GroupTable({ group }: { group: StandingGroup }) {
  const [expanded, setExpanded] = useState(false);
  const letter = group.group.replace(/Grupo |Group /g, '');

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Group header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: '1px solid var(--bg-border)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black bg-[var(--accent-gold-dim)] text-[var(--accent-gold)]"
          >
            {letter}
          </span>
          <span className="font-bebas text-xl tracking-[1px] mt-1">GRUPO {letter}</span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>
          <ChevronDown
            size={18}
            style={{
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </span>
      </div>

      {/* Standings table */}
      <table className="standings-table">
        <thead>
          <tr>
            <th style={{ width: '28px' }}>#</th>
            <th style={{ textAlign: 'left', paddingLeft: '8px' }}>Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th style={{ color: 'var(--accent-gold)' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((s) => {
            const isoCode = getIsoCode(s.team.code);
            const isQualify = s.rank <= 2;
            return (
              <tr key={s.team.id}>
                <td>
                  <span
                    className="w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold mx-auto"
                    style={{
                      background: isQualify ? 'var(--accent-gold-dim)' : 'transparent',
                      color: isQualify ? 'var(--accent-gold)' : 'var(--text-muted)',
                    }}
                  >
                    {s.rank}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <FlagImage code={isoCode} teamName={s.team.name} size="sm" />
                    <span className="text-[13px] font-medium truncate max-w-[120px] sm:max-w-[160px]">{s.team.name}</span>
                  </div>
                </td>
                <td className="font-mono-score text-xs">{s.all.played}</td>
                <td className="font-mono-score text-xs">{s.all.win}</td>
                <td className="font-mono-score text-xs">{s.all.draw}</td>
                <td className="font-mono-score text-xs">{s.all.lose}</td>
                <td className="font-mono-score text-xs">{s.all.goals.home ?? 0}</td>
                <td className="font-mono-score text-xs">{s.all.goals.away ?? 0}</td>
                <td className="font-mono-score text-xs" style={{ color: s.goalsDiff >= 0 ? 'var(--accent-green)' : '#ef4444' }}>
                  {s.goalsDiff >= 0 ? '+' : ''}{s.goalsDiff}
                </td>
                <td>
                  <span className="font-mono-score font-bold" style={{ color: isQualify ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                    {s.points}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Fixtures toggle */}
      {expanded && <GroupFixtures groupName={group.group} teamIds={group.standings.map(s => s.team.id)} />}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5 hover:text-[var(--accent-gold)]"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)' }}
        >
          Ver fixtures del grupo
          <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}

function GroupFixtures({ groupName, teamIds }: { groupName: string, teamIds: number[] }) {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllFixtures().then(all => {
      const groupFixtures = all.filter(m =>
        teamIds.includes(m.teams.home.id) && teamIds.includes(m.teams.away.id)
      );
      setFixtures(groupFixtures);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupName]);

  if (loading) {
    return (
      <div className="p-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)' }}>
        Sin fixtures disponibles
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
      {fixtures.map(match => {
        const isFinished = ['FT', 'AET', 'PEN'].includes(match.fixture.status.short);
        const kickoff = new Date(match.fixture.date);
        const dateStr = format(kickoff, "d MMM HH:mm", { locale: es });

        return (
          <div
            key={match.fixture.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <span className="font-mono-score" style={{ color: 'var(--text-muted)', minWidth: '80px' }}>{dateStr}</span>
            <span className="flex-1 font-medium truncate">
              {match.teams.home.name}
            </span>
            <span className="font-mono-score font-bold px-2" style={{ color: isFinished ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {isFinished ? `${match.goals.home} – ${match.goals.away}` : 'vs'}
            </span>
            <span className="flex-1 font-medium truncate text-right">
              {match.teams.away.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--bg-border)' }}>
        <div className="skeleton w-8 h-8 rounded-lg" />
        <div className="skeleton h-5 w-20 rounded" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-8 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState<StandingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStandings()
      .then(data => {
        setGroups(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="page">
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[var(--accent-gold-dim)] border border-[rgba(201,168,76,0.3)] rounded-xl flex items-center justify-center text-[var(--accent-gold)]">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="font-bebas text-4xl tracking-[3px] text-[var(--text-primary)] leading-none">
              GRUPOS Y POSICIONES
            </h1>
            <div className="text-xs text-[var(--text-muted)] mt-1 tracking-[0.5px]">
              Las 2 primeras selecciones clasifican a octavos
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonGroup key={i} />)
          : groups.length === 0
          ? (
            <div className="col-span-full card p-12 text-center">
              <p className="font-bebas text-2xl tracking-[1px]">POSICIONES NO DISPONIBLES</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Los grupos se publicaran cuando comience el torneo
              </p>
            </div>
          )
          : groups.map(group => (
            <GroupTable key={group.group} group={group} />
          ))
        }
      </div>
    </main>
  );
}
