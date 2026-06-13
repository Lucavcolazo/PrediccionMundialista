import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/',            label: 'Inicio',      icon: '🏠' },
  { to: '/groups',     label: 'Grupos',      icon: '📊' },
  { to: '/predictions',label: 'Predicciones',icon: '✏️' },
  { to: '/leaderboard',label: 'Puntos',      icon: '🏆' },
];

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
            <span className="text-2xl">🌍</span>
            <span className="font-black text-lg tracking-tight">
              <span style={{ color: 'var(--accent-green)' }}>mundial</span>
              <span className="text-white">-hub</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon }) => (
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
                <span>{icon}</span>
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
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-red-500/10 hover:text-red-400"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        🚪 Cerrar sesión
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
          {NAV_ITEMS.map(({ to, label, icon }) => (
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
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
