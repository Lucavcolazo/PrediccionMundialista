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

  const groupInfo = match.league?.group ? `Grupo ${match.league.group.replace('Group ', '')}` : '';
  const roundInfo = match.league?.round || '';
  const venueInfo = fixture.venue?.name ? `${fixture.venue.name}, ${fixture.venue.city}` : '';

  const details = [groupInfo, roundInfo, venueInfo].filter(Boolean).join(' · ');

  return (
    <div
      className="border rounded-2xl p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
    >
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-live" />
          EN VIVO
        </span>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          {details}
          {fixture.status.elapsed && (
            <span className="ml-2 font-bold text-[var(--accent-gold)]">{fixture.status.elapsed}'</span>
          )}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-center gap-12 md:gap-24">
        {/* Home */}
        <div className="flex flex-col items-center gap-4 w-32">
          <div className="flex items-center justify-center rounded-xl p-2 bg-[var(--bg-card-hover)] border border-[var(--bg-border)]">
            <FlagImage code={homeCode} logo={teams.home.logo} teamName={teams.home.name} size="xl" className="rounded-lg shadow-sm" />
          </div>
          <span className="font-bebas text-2xl tracking-[1.5px] text-[var(--text-secondary)] uppercase text-center">{teams.home.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-6">
          <span className="text-7xl font-medium tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            {goals.home ?? '0'}
          </span>
          <span className="text-4xl text-[var(--bg-border)] font-light mt-2">-</span>
          <span className="text-7xl font-medium tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            {goals.away ?? '0'}
          </span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-4 w-32">
          <div className="flex items-center justify-center rounded-xl p-2 bg-[var(--bg-card-hover)] border border-[var(--bg-border)]">
            <FlagImage code={awayCode} logo={teams.away.logo} teamName={teams.away.name} size="xl" className="rounded-lg shadow-sm" />
          </div>
          <span className="font-bebas text-2xl tracking-[1.5px] text-[var(--text-secondary)] uppercase text-center">{teams.away.name}</span>
        </div>
      </div>
    </div>
  );
}
