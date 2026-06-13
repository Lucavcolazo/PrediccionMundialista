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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl">🏆</span>
          <h1 className="text-2xl md:text-3xl font-black">
            FIFA World Cup 2026
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">
          Horario Argentina (UTC−3)
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Live Section */}
      {loading ? (
        <div className="mb-8">
          <SectionHeader title="🔴 En Vivo" />
          <SkeletonCard />
        </div>
      ) : hasLive ? (
        <section className="mb-8">
          <SectionHeader title="🔴 En Vivo" subtitle={`${liveMatches.length} partido${liveMatches.length > 1 ? 's' : ''} en curso`} />
          <div className="flex flex-col gap-4">
            {liveMatches.map(match => (
              <LiveScore key={match.fixture.id} match={match} />
            ))}
          </div>
        </section>
      ) : (
        /* Upcoming Section */
        <section className="mb-8">
          <SectionHeader title="⏳ Próximos Partidos" subtitle="Conteo regresivo al próximo pitazo" />
          {upcomingMatches.length === 0 ? (
            <div
              className="card p-8 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <p className="text-4xl mb-3">🏁</p>
              <p className="font-semibold">No hay partidos programados</p>
              <p className="text-sm mt-1">El Mundial todavía no tiene fixtures publicados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {upcomingMatches.map((match, idx) => (
                <div
                  key={match.fixture.id}
                  className="card p-4 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Teams summary */}
                    <div className="text-sm font-semibold">
                      {match.teams.home.name}
                      <span style={{ color: 'var(--text-muted)' }} className="font-normal"> vs </span>
                      {match.teams.away.name}
                    </div>
                    {idx === 0 && (
                      <CountdownTimer targetDate={match.fixture.date} />
                    )}
                  </div>
                  {idx === 0 && <div className="divider" />}
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
          <SectionHeader title="✅ Resultados de Hoy" />
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
