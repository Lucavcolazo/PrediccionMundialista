import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, BarChart2, Edit3, Trophy, LogOut, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',             label: 'Inicio',       Icon: Home },
  { to: '/groups',      label: 'Grupos',       Icon: BarChart2 },
  { to: '/predictions', label: 'Predicciones', Icon: Edit3 },
  { to: '/leaderboard', label: 'Puntos',       Icon: Trophy },
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
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 h-14 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="font-bebas text-[22px] tracking-[2px] text-[var(--text-primary)] no-underline flex items-center">
            MUNDIAL<span style={{ color: 'var(--accent-gold)' }}>·</span>HUB
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-[0.5px] uppercase transition-colors no-underline ${
                    isActive
                      ? 'text-[var(--accent-gold)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* User section */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-[13px] font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{ background: 'linear-gradient(135deg, var(--accent-gold), #8B6914)', color: 'var(--bg-base)' }}
                >
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden md:block hover:text-[var(--text-primary)]">{displayName}</span>
                <ChevronDown size={14} className="opacity-60 hidden md:block" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden"
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
                        <LogOut size={16} />
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
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] uppercase font-semibold tracking-wider transition-all no-underline ${
                  isActive
                    ? 'text-[var(--accent-gold)]'
                    : 'text-[var(--text-muted)]'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
