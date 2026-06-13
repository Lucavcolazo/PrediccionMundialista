import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, navigate, from]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,210,106,0.08) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.04) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="text-5xl mb-3">🌍</div>
        <h1 className="text-3xl font-black tracking-tight">
          <span style={{ color: 'var(--accent-green)' }}>mundial</span>
          <span className="text-white">-hub</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          Predicciones del Mundial 2026
        </p>
      </div>

      {/* Auth Card */}
      <div
        className="w-full max-w-sm rounded-2xl border p-6 animate-fade-in relative z-10"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          animationDelay: '0.1s',
          animationFillMode: 'both',
        }}
      >
        <div className="mb-5 text-center">
          <h2 className="text-lg font-bold">Ingresá a tu cuenta</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Te enviamos un link mágico por email ✨
          </p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#00d26a',
                  brandAccent: '#00e876',
                  brandButtonText: '#000000',
                  defaultButtonBackground: '#1a1a25',
                  defaultButtonBackgroundHover: '#22223a',
                  defaultButtonBorder: '#1e1e2e',
                  defaultButtonText: '#ffffff',
                  dividerBackground: '#1e1e2e',
                  inputBackground: '#0a0a0f',
                  inputBorder: '#1e1e2e',
                  inputBorderHover: '#00d26a',
                  inputBorderFocus: '#00d26a',
                  inputText: '#ffffff',
                  inputPlaceholder: '#52525b',
                  messageText: '#a1a1aa',
                  anchorTextColor: '#00d26a',
                  anchorTextHoverColor: '#00e876',
                },
                fonts: {
                  bodyFontFamily: 'Inter, sans-serif',
                  buttonFontFamily: 'Inter, sans-serif',
                  inputFontFamily: 'Inter, sans-serif',
                },
                radii: {
                  borderRadiusButton: '10px',
                  buttonBorderRadius: '10px',
                  inputBorderRadius: '10px',
                },
              },
            },
            style: {
              anchor: { color: 'var(--accent-green)' },
              message: { color: 'var(--text-muted)' },
            },
          }}
          providers={[]}
          view="magic_link"
          showLinks={false}
          localization={{
            variables: {
              magic_link: {
                email_input_label: 'Email',
                email_input_placeholder: 'tu@email.com',
                button_label: 'Enviar link mágico',
                confirmation_text: '✅ Revisá tu email — te enviamos el link de acceso',
              },
            },
          }}
        />
      </div>

      <p className="mt-6 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Solo usuarios aprobados pueden ingresar
      </p>
    </div>
  );
}
