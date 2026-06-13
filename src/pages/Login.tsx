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
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,210,106,0.07) 0%, transparent 60%)',
        }}
      />

      {/* Logo */}
      <div className="animate-fade-in" style={{ marginBottom: 32, textAlign: 'center' }}>
        {/* Soccer ball SVG instead of emoji */}
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ margin: '0 auto 12px' }}
        >
          <circle cx="28" cy="28" r="26" stroke="#00d26a" strokeWidth="2" fill="none" />
          <circle cx="28" cy="28" r="8" fill="#00d26a" opacity="0.15" />
          <polygon points="28,10 34,20 22,20" fill="#00d26a" opacity="0.6" />
          <polygon points="28,46 34,36 22,36" fill="#00d26a" opacity="0.6" />
          <polygon points="10,28 20,22 20,34" fill="#00d26a" opacity="0.6" />
          <polygon points="46,28 36,22 36,34" fill="#00d26a" opacity="0.6" />
          <circle cx="28" cy="28" r="5" fill="#00d26a" />
        </svg>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>
          <span style={{ color: '#00d26a' }}>mundial</span>
          <span style={{ color: '#ffffff' }}>-hub</span>
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
          Predicciones del Mundial 2026
        </p>
      </div>

      {/* Auth Card */}
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 360,
          backgroundColor: '#13131a',
          border: '1px solid #1e1e2e',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          animationDelay: '0.1s',
          animationFillMode: 'both',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Ingresá a tu cuenta
          </h2>
          <p style={{ fontSize: 13, marginTop: 6, color: '#6b7280' }}>
            Te enviamos un link por email para entrar
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
                  inputBackground: '#0d0d14',
                  inputBorder: '#1e1e2e',
                  inputBorderHover: '#00d26a',
                  inputBorderFocus: '#00d26a',
                  inputText: '#ffffff',
                  inputLabelText: '#a1a1aa',
                  inputPlaceholder: '#3f3f50',
                  messageText: '#a1a1aa',
                  messageTextDanger: '#ef4444',
                  anchorTextColor: '#00d26a',
                  anchorTextHoverColor: '#00e876',
                },
                fonts: {
                  bodyFontFamily: 'Inter, sans-serif',
                  buttonFontFamily: 'Inter, sans-serif',
                  inputFontFamily: 'Inter, sans-serif',
                  labelFontFamily: 'Inter, sans-serif',
                },
                fontSizes: {
                  baseBodySize: '14px',
                  baseInputSize: '15px',
                  baseLabelSize: '13px',
                  baseButtonSize: '14px',
                },
                radii: {
                  borderRadiusButton: '10px',
                  buttonBorderRadius: '10px',
                  inputBorderRadius: '10px',
                },
                space: {
                  inputPadding: '12px 14px',
                  buttonPadding: '12px 20px',
                },
              },
            },
            style: {
              container: { backgroundColor: 'transparent' },
              anchor: { color: '#00d26a' },
              message: { color: '#a1a1aa' },
              label: { color: '#a1a1aa', fontWeight: 500 },
              button: { fontWeight: 600 },
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
                button_label: 'Enviar link de acceso',
                confirmation_text: 'Listo — revisa tu email para entrar',
              },
            },
          }}
        />
      </div>

      <p style={{ marginTop: 24, fontSize: 12, textAlign: 'center', color: '#3f3f50' }}>
        Solo usuarios aprobados pueden ingresar
      </p>
    </div>
  );
}
