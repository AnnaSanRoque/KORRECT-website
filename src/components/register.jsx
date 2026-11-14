import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2: email code verification
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setMessage('');

    if (username.trim().length < 3) {
      setMessage('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off, so the user is already logged in.
      setMessage('Account created successfully!');
    } else {
      // Confirmation is on: ask for the code that was emailed.
      setPendingEmail(email.trim());
      setAwaitingCode(true);
      setMessage('We sent a code to your email. Enter it below.');
    }

    setUsername('');
    setEmail('');
    setPassword('');
  }

  async function handleVerify(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code.trim(),
      type: 'signup',
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // On success Supabase logs the user in automatically,
    // and App.jsx picks up the new session.
    setMessage('Email confirmed! You are now logged in.');
    setCode('');
  }

  async function handleResend() {
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
    });

    setLoading(false);
    setMessage(error ? error.message : 'A new code was sent to your email.');
  }

  if (awaitingCode) {
    return (
      <div className="auth-container">
        <h1>KORRECT</h1>
        <h2>Confirm Your Email</h2>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the code from your email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {message && <p>{message}</p>}

        <button type="button" onClick={handleResend} disabled={loading}>
          Resend code
        </button>

        <button type="button" onClick={onSwitchToLogin}>
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1>KORRECT</h1>
      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button type="button" onClick={onSwitchToLogin}>
        Already have an account? Login
      </button>
    </div>
  );
}

export default Register;