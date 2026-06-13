import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FlagImage } from './FlagImage';
import { getIsoCode } from '../lib/api-football';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  variant?: 'compact' | 'full';
  className?: string;
}

function StatusBadge({ status }: { status: Match['fixture']['status'] }) {
  const short = status.short;
  const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(short);

  if (isLive) {
    return (
      <span className="badge badge-live animate-pulse-live">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] inline-block" />
        {status.elapsed ? `${status.elapsed}'` : 'LIVE'}
      </span>
    );
  }

  if (isFinished) {
    return <span className="badge badge-finished">FT</span>;
  }

  return <span className="badge badge-upcoming">Proximo</span>;
}

export function MatchCard({ match, variant = 'full', className = '' }: MatchCardProps) {
  const { fixture, teams, goals } = match;
  const homeCode = getIsoCode(teams.home.code);
  const awayCode = getIsoCode(teams.away.code);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
  const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT'].includes(fixture.status.short);
  const hasScore = goals.home !== null && goals.away !== null;

  // Date in Argentina time (UTC-3)
  const kickoff = new Date(fixture.date);
  const dateStr = format(kickoff, "EEE d MMM, HH:mm", { locale: es });

  if (variant === 'compact') {
    return (
      <div className={`p-4 flex items-center justify-between gap-4 w-full ${className}`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <FlagImage code={homeCode} logo={teams.home.logo} teamName={teams.home.name} size="sm" />
          <span className="text-[14px] font-medium truncate">{teams.home.name}</span>
        </div>

        <div className="flex items-center justify-center shrink-0 min-w-[60px]">
          {hasScore ? (
            <span className="font-mono-score text-[15px] font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] px-3 py-1 rounded-md border border-[var(--bg-border)]">
              {goals.home} – {goals.away}
            </span>
          ) : (
            <span className="font-mono-score text-[13px] font-semibold text-[var(--text-muted)]">
              {format(kickoff, 'HH:mm')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-[14px] font-medium truncate text-right">{teams.away.name}</span>
          <FlagImage code={awayCode} logo={teams.away.logo} teamName={teams.away.name} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`py-4 animate-fade-in border-b border-[var(--bg-border)] last:border-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-[var(--text-muted)] tracking-wider uppercase">
          {match.league?.round ?? 'Grupo'}
          {match.league?.group ? ` — Grupo ${match.league.group.replace('Group ', '')}` : ''}
        </span>
        <StatusBadge status={fixture.status} />
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <FlagImage code={homeCode} logo={teams.home.logo} teamName={teams.home.name} size="md" />
          <span className="text-sm font-semibold text-center leading-tight">{teams.home.name}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {(isLive || isFinished) && hasScore ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-black tabular-nums">{goals.home}</span>
              <span className="text-xl md:text-2xl text-[var(--text-muted)] font-light">-</span>
              <span className="text-3xl md:text-4xl font-black tabular-nums">{goals.away}</span>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl font-bold">{format(kickoff, 'HH:mm')}</p>
              <p className="text-xs text-[var(--text-muted)]">{format(kickoff, 'd MMM', { locale: es })}</p>
            </div>
          )}
          {isLive && (
            <span className="text-xs text-[var(--accent-green)] font-semibold">
              {fixture.status.elapsed}'
            </span>
          )}
          {isFinished && match.score?.penalty?.home !== null && (
            <span className="text-xs text-[var(--text-muted)]">
              (PEN {match.score?.penalty?.home} – {match.score?.penalty?.away})
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <FlagImage code={awayCode} logo={teams.away.logo} teamName={teams.away.name} size="md" />
          <span className="text-sm font-semibold text-center leading-tight">{teams.away.name}</span>
        </div>
      </div>

      {/* Footer */}
      {!isLive && !isFinished && (
        <p className="text-xs text-[var(--text-muted)] text-center mt-4 capitalize">{dateStr}</p>
      )}
      {fixture.venue?.city && (
        <p className="text-xs text-[var(--text-muted)] text-center mt-1">{fixture.venue.city}</p>
      )}
    </div>
  );
}
