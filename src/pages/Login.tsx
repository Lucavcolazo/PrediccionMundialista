import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, navigate, from]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: '¡Cuenta creada! Ya podés iniciar sesión.', type: 'success' });
        setIsSignUp(false); // Switch to login mode
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Navigation is handled by the useEffect above when session changes
      }
    } catch (error: any) {
      // Improve Supabase error messages
      let errorMsg = error.message;
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'Email o contraseña incorrectos';
      } else if (errorMsg.includes('Password should be at least')) {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Ese email ya está registrado';
      }
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle top glow for depth — intentionally faint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 55%)' }}
      />

      {/* Brand */}
      <div className="animate-fade-in text-center mb-8 relative z-10">
        <h1 className="font-bebas text-4xl tracking-[3px] text-[var(--text-primary)] leading-none">
          MUNDIAL<span style={{ color: 'var(--accent-gold)' }}>·</span>HUB
        </h1>
        <p className="text-[13px] mt-2.5" style={{ color: 'var(--text-muted)' }}>
          Predicciones del Mundial 2026
        </p>
      </div>

      {/* Auth Card */}
      <div
        className="card animate-fade-in w-full max-w-[360px] p-6 relative z-10"
        style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
      >
        <div className="text-center mb-6">
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">
            {isSignUp ? 'Crear cuenta' : 'Ingresá a tu cuenta'}
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {isSignUp ? 'Completá tus datos para participar' : 'Ingresá tus credenciales'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div
              className="text-[13px] text-center -mt-1"
              style={{ color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-[13px] transition-colors hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-muted)' }}
          >
            {isSignUp ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
