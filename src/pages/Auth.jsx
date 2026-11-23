import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Login from '../components/login';
import Register from '../components/register';
import Verify from '../components/verify';

// The hidden "Play Now" page: log in, create an account, or confirm an email code.
export default function Auth({ session, onNotice }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [pending, setPending] = useState({ email: '', message: '' });
  const [banner, setBanner] = useState('');

  // Someone who was already signed in when they opened this page goes straight on.
  // (A login that happens on this page is handled by onSuccess instead, so a banned
  // player is never let through while their status is still being checked.)
  const wasSignedIn = useRef(Boolean(session));
  if (wasSignedIn.current && session) return <Navigate to="/download" replace />;

  const goLogin = (text) => {
    setBanner(text || '');
    setMode('login');
  };

  return (
    <section className="auth">
      <div className="auth__art" aria-hidden="true">
        <p className="auth__quote">Ride Smart.<br /><span>Ride Korrect.</span></p>
      </div>

      <div className="auth__panel">
        <div className="auth__card">
          {mode === 'login' && (
            <Login
              banner={banner}
              onSwitchToRegister={() => { setBanner(''); setMode('register'); }}
              onNeedsVerify={(email, message) => { setPending({ email, message }); setMode('verify'); }}
              onNotice={onNotice}
              onSuccess={() => navigate('/', { replace: true })}
            />
          )}

          {mode === 'register' && (
            <Register
              onSwitchToLogin={() => goLogin('')}
              onNeedsVerify={(email, message) => { setPending({ email, message }); setMode('verify'); }}
              onCreatedWithoutVerify={() => goLogin('Account created. You can now log in.')}
            />
          )}

          {mode === 'verify' && (
            <Verify
              email={pending.email}
              initialMessage={pending.message}
              onVerified={() => goLogin('Account created and confirmed. Please log in.')}
              onBack={() => goLogin('')}
            />
          )}
        </div>
      </div>
    </section>
  );
}