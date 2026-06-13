import { FlagImage } from './FlagImage';
import { getIsoCode } from '../lib/api-football';
import type { Match } from '../types';

interface LiveScoreProps {
  match: Match;
}

export function LiveScore({ match }: LiveScoreProps) {
  const { fixture, teams, goals } = match;
  const homeCode = getIsoCode(teams.home.code);
  const awayCode = getIsoCode(teams.away.code);

  return (
    <div
      className="card p-6 md:p-8 animate-fade-in relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d1f14 0%, #13131a 60%)',
        borderColor: 'rgba(0, 210, 106, 0.3)',
        boxShadow: '0 0 40px rgba(0, 210, 106, 0.15)',
      }}
    >
      {/* Live glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(0,210,106,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Live badge */}
      <div className="flex items-center justify-center mb-5">
        <span className="badge badge-live animate-pulse-live text-sm px-4 py-1">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] inline-block animate-pulse" />
          EN VIVO • {fixture.status.elapsed}'
        </span>
      </div>

      {/* Round info */}
      {match.league?.round && (
        <p className="text-center text-xs text-[var(--text-muted)] mb-4 uppercase tracking-wider">
          {match.league.round}
          {match.league.group ? ` · Grupo ${match.league.group.replace('Group ', '')}` : ''}
        </p>
      )}

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-6">
        {/* Home */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <FlagImage code={homeCode} teamName={teams.home.name} size="xl" />
          <span className="font-bold text-base md:text-lg text-center">{teams.home.name}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-3 animate-count-pulse">
            <span
              className="text-6xl md:text-7xl font-black tabular-nums"
              style={{ textShadow: '0 0 30px rgba(0,210,106,0.5)' }}
            >
              {goals.home ?? '–'}
            </span>
            <span className="text-4xl text-[var(--text-muted)] font-light">:</span>
            <span
              className="text-6xl md:text-7xl font-black tabular-nums"
              style={{ textShadow: '0 0 30px rgba(0,210,106,0.5)' }}
            >
              {goals.away ?? '–'}
            </span>
          </div>
          {fixture.status.short === 'HT' && (
            <span className="text-xs text-[var(--accent-gold)] font-semibold uppercase tracking-wider">
              Medio Tiempo
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <FlagImage code={awayCode} teamName={teams.away.name} size="xl" />
          <span className="font-bold text-base md:text-lg text-center">{teams.away.name}</span>
        </div>
      </div>

      {/* Venue */}
      {fixture.venue?.name && (
        <p className="text-xs text-[var(--text-muted)] text-center mt-5">
          📍 {fixture.venue.name}, {fixture.venue.city}
        </p>
      )}
    </div>
  );
}
