import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/',             label: 'Inicio' },
  { to: '/groups',      label: 'Grupos' },
  { to: '/predictions', label: 'Predicciones' },
  { to: '/leaderboard', label: 'Puntos' },
];

// Icon components (SVG, no emoji)
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="8"/>
      <path d="M6 8H4a2 2 0 0 1-2-2V4h4"/><path d="M18 8h2a2 2 0 0 0 2-2V4h-4"/>
      <rect x="6" y="4" width="12" height="8" rx="1"/>
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/':             <HomeIcon />,
  '/groups':      <ChartIcon />,
  '/predictions': <PencilIcon />,
  '/leaderboard': <TrophyIcon />,
};

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'Usuario';
  const displayEmail = user?.email ?? '';

  return (
    <>
      <nav className="navbar">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 no-underline">
            <svg width="22" height="22" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="28" cy="28" r="26" stroke="#00d26a" strokeWidth="2.5" fill="none"/>
              <circle cx="28" cy="28" r="5" fill="#00d26a"/>
              <polygon points="28,10 33,19 23,19" fill="#00d26a" opacity="0.7"/>
              <polygon points="28,46 33,37 23,37" fill="#00d26a" opacity="0.7"/>
              <polygon points="10,28 19,23 19,33" fill="#00d26a" opacity="0.7"/>
              <polygon points="46,28 37,23 37,33" fill="#00d26a" opacity="0.7"/>
            </svg>
            <span className="font-black text-lg tracking-tight">
              <span style={{ color: 'var(--accent-green)' }}>mundial</span>
              <span className="text-white">-hub</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline ${
                    isActive
                      ? 'text-[var(--accent-green)] bg-[var(--accent-green-dim)]'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {NAV_ICONS[to]}
                {label}
              </NavLink>
            ))}
          </div>

          {/* User section */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
                  style={{ background: 'var(--accent-green)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block">{displayName}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="opacity-60">
                  <path d="M6 8L1 3h10z"/>
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--bg-border)' }}>
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{displayEmail}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <LogoutIcon />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex items-center justify-around py-2 px-2">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all no-underline ${
                  isActive
                    ? 'text-[var(--accent-green)]'
                    : 'text-[var(--text-muted)]'
                }`
              }
            >
              {NAV_ICONS[to]}
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
