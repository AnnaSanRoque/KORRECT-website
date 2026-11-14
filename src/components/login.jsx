import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Login({ onSwitchToRegister, onLoginSuccess, onBlocked }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setMessage('');
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      // Check the player's account status before letting them in.
      // A banned player can still authenticate (Supabase doesn't know
      // about "banned"), so we check profiles.status ourselves and
      // sign them right back out if it's not clear to play.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        setMessage('Unable to verify account status. Please try again.');
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === 'banned' || profile.status === 'suspended') {
        await supabase.auth.signOut();
        setPassword('');
        // Show the pop-up (rendered by the parent page)
        if (onBlocked) onBlocked(profile.status);
        return;
      }

      setMessage('Login successful!');

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (error) {
      setMessage(
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h1>KORRECT</h1>
      <h2>Player Login</h2>

      <form onSubmit={handleLogin}>
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
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={onSwitchToRegister}
      >
        Create an account
      </button>
    </div>
  );
}

export default Login;