import { useLiveMatches } from '../hooks/useLiveMatches';
import { LiveScore } from '../components/LiveScore';
import { FlagImage } from '../components/FlagImage';
import { getIsoCode } from '../lib/api-football';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Match } from '../types';

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[11px] font-bold tracking-[2px] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
      {title}
    </h2>
  );
}

function UpcomingCard({ match }: { match: Match }) {
  const homeCode = getIsoCode(match.teams.home.code);
  const awayCode = getIsoCode(match.teams.away.code);
  
  const groupInfo = match.league?.group ? `Grupo ${match.league.group.replace('Group ', '')}` : '';
  const venueInfo = match.fixture.venue?.name || '';
  const details = [groupInfo, venueInfo].filter(Boolean).join(' · ');

  // Calculate time remaining like "1h 23m"
  const date = new Date(match.fixture.date);
  // Custom format since date-fns formatDistanceToNowStrict returns things like "1 hour"
  let timeStr = formatDistanceToNowStrict(date, { locale: es });
  // Map "1 hour", "2 hours" to "1h", "2h", "minutes" to "m"
  timeStr = timeStr.replace(/ horas?/, 'h').replace(/ minutos?/, 'm').replace(/ días?/, 'd').replace(/ segundos?/, 's');

  return (
    <div className="flex items-center justify-between p-5 rounded-xl border mb-4 bg-[var(--bg-card)] border-[var(--bg-border)]">
      <div className="flex items-center gap-5">
        <div className="flex -space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--bg-card)] shrink-0 z-10 bg-[var(--bg-base)] flex items-center justify-center">
            <FlagImage code={homeCode} logo={match.teams.home.logo} teamName={match.teams.home.name} size="sm" />
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--bg-card)] shrink-0 z-20 bg-[var(--bg-base)] flex items-center justify-center">
            <FlagImage code={awayCode} logo={match.teams.away.logo} teamName={match.teams.away.name} size="sm" />
          </div>
        </div>
        <div>
          <h4 className="font-bold text-[var(--text-primary)] text-[15px]">{match.teams.home.name} vs {match.teams.away.name}</h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{details}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-[17px] tracking-tight text-[var(--accent-gold)]">{timeStr}</div>
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">arg</div>
      </div>
    </div>
  );
}

function ResultRow({ match, isLast }: { match: Match; isLast: boolean }) {
  const homeCode = getIsoCode(match.teams.home.code);
  const awayCode = getIsoCode(match.teams.away.code);
  const groupName = match.league?.group ? `Gr. ${match.league.group.replace('Group ', '')}` : '';

  // Determine winners to highlight name
  const hg = match.goals.home ?? 0;
  const ag = match.goals.away ?? 0;
  const homeWon = hg > ag;
  const awayWon = ag > hg;

  return (
    <div className={`flex items-center justify-between py-4 px-6 ${!isLast ? 'border-b border-[var(--bg-border)]' : ''}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--bg-border)] flex items-center justify-center shrink-0">
            <FlagImage code={homeCode} logo={match.teams.home.logo} teamName={match.teams.home.name} size="sm" />
          </div>
          <span className={`text-[15px] ${homeWon ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-medium'}`}>
            {match.teams.home.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--bg-border)] flex items-center justify-center shrink-0">
            <FlagImage code={awayCode} logo={match.teams.away.logo} teamName={match.teams.away.name} size="sm" />
          </div>
          <span className={`text-[15px] ${awayWon ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-medium'}`}>
            {match.teams.away.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col gap-3 items-end">
          <span className={`text-lg leading-none ${homeWon ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}>
            {match.goals.home}
          </span>
          <span className={`text-lg leading-none ${awayWon ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] font-semibold'}`}>
            {match.goals.away}
          </span>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] w-8 text-right">
          {groupName}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { liveMatches, todayMatches, loading, error } = useLiveMatches();

  const finishedToday = todayMatches.filter(m => ['FT', 'AET', 'PEN'].includes(m.fixture.status.short));
  const upcomingToday = todayMatches.filter(m => m.fixture.status.short === 'NS');

  return (
    <main className="page max-w-[1000px] mx-auto pt-6 pb-12 px-4 lg:px-0">
      
      {error && (
        <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          Error al cargar partidos: {error}
        </div>
      )}

      {loading ? (
        <div className="w-full h-40 skeleton rounded-2xl mb-8" />
      ) : (
        <>
          {/* Top: Live Match */}
          {liveMatches.length > 0 && (
            <section className="mb-12">
              <SectionHeader title="En Vivo" />
              <div className="flex flex-col gap-4">
                {liveMatches.map(match => (
                  <LiveScore key={match.fixture.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left Column: Upcoming */}
            <section>
              <SectionHeader title="Próximos Partidos" />
              {upcomingToday.length === 0 ? (
                <div className="card p-6 text-center border-dashed" style={{ borderColor: 'var(--bg-border)', color: 'var(--text-muted)' }}>
                  <p className="text-sm font-medium">No hay más partidos en la jornada</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {upcomingToday.map(match => (
                    <UpcomingCard key={match.fixture.id} match={match} />
                  ))}
                </div>
              )}
            </section>

            {/* Right Column: Results */}
            <section>
              <SectionHeader title="Resultados de Hoy" />
              {finishedToday.length === 0 ? (
                <div className="card p-6 text-center border-dashed" style={{ borderColor: 'var(--bg-border)', color: 'var(--text-muted)' }}>
                  <p className="text-sm font-medium">Sin resultados previos hoy</p>
                </div>
              ) : (
                <div className="rounded-xl border bg-[var(--bg-card)] overflow-hidden" style={{ borderColor: 'var(--bg-border)' }}>
                  {finishedToday.map((match, idx) => (
                    <ResultRow key={match.fixture.id} match={match} isLast={idx === finishedToday.length - 1} />
                  ))}
                </div>
              )}
            </section>

          </div>
        </>
      )}
    </main>
  );
}
