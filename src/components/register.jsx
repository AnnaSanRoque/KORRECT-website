import { useState } from 'react';
import { supabase } from '../lib/supabase';

function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

    setMessage(
      data.session
        ? 'Account created successfully!'
        : 'Account created! Check your email to confirm your account.'
    );

    setUsername('');
    setEmail('');
    setPassword('');
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

      <p>{message}</p>

      <button type="button" onClick={onSwitchToLogin}>
        Already have an account? Login
      </button>
    </div>
  );
}

export default Register;