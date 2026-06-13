import { useLiveMatches } from '../hooks/useLiveMatches';
import { LiveScore } from '../components/LiveScore';
import { MatchCard } from '../components/MatchCard';
import { CountdownTimer } from '../components/CountdownTimer';

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="skeleton w-14 h-11 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton h-10 w-20 rounded" />
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="skeleton w-14 h-11 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { liveMatches, upcomingMatches, todayResults, loading, error } = useLiveMatches();
  const hasLive = liveMatches.length > 0;

  return (
    <main className="page pb-24 md:pb-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-green-dim)', border: '1px solid rgba(0,210,106,0.2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d26a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="8"/>
              <path d="M6 8H4a2 2 0 0 1-2-2V4h4"/><path d="M18 8h2a2 2 0 0 0 2-2V4h-4"/>
              <rect x="6" y="4" width="12" height="8" rx="1"/>
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            FIFA World Cup 2026
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm ml-13">
          Horario Argentina (UTC−3)
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          Error al cargar partidos: {error}
        </div>
      )}

      {/* Live Section */}
      {loading ? (
        <div className="mb-8">
          <SectionHeader title="En Vivo" />
          <SkeletonCard />
        </div>
      ) : hasLive ? (
        <section className="mb-8">
          <SectionHeader
            title="En Vivo"
            subtitle={`${liveMatches.length} partido${liveMatches.length > 1 ? 's' : ''} en curso`}
          />
          <div className="flex flex-col gap-4">
            {liveMatches.map(match => (
              <LiveScore key={match.fixture.id} match={match} />
            ))}
          </div>
        </section>
      ) : (
        /* Upcoming Section */
        <section className="mb-8">
          <SectionHeader title="Proximos Partidos" subtitle="Cuenta regresiva al proximo pitazo" />
          {upcomingMatches.length === 0 ? (
            <div
              className="card p-8 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <p className="font-semibold">No hay partidos programados</p>
              <p className="text-sm mt-1">El Mundial todavia no tiene fixtures publicados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {upcomingMatches.map((match, idx) => (
                <div
                  key={match.fixture.id}
                  className="card p-4 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: 'both' }}
                >
                  {idx === 0 && (
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Siguiente partido
                      </span>
                      <CountdownTimer targetDate={match.fixture.date} />
                    </div>
                  )}
                  <MatchCard match={match} variant={idx === 0 ? 'full' : 'compact'} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Today's Results */}
      {(loading || todayResults.length > 0) && (
        <section>
          <SectionHeader title="Resultados de Hoy" />
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : todayResults.length === 0 ? (
            <div className="card p-6 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No hubo partidos hoy</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {todayResults.map(match => (
                <MatchCard key={match.fixture.id} match={match} variant="compact" />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
