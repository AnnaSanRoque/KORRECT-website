import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { accountExists } from '../lib/profile';

function Login({ onSwitchToRegister, onNeedsVerify, onSuccess, onNotice, banner }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const code = error.code || '';
        const text = (error.message || '').toLowerCase();

        // Email was never confirmed: send a fresh code and go to the code screen.
        if (code === 'email_not_confirmed' || text.includes('not confirmed')) {
          await supabase.auth.resend({ type: 'signup', email: email.trim() });
          onNeedsVerify(email.trim(), 'Your email is not confirmed yet. We sent a new code to your inbox.');
          return;
        }

        if (code === 'invalid_credentials' || text.includes('invalid login credentials')) {
          const exists = await accountExists(email.trim());
          setPassword('');

          if (exists === false) {
            onNotice({
              tone: 'warning',
              title: 'No account found',
              text: 'We could not find an account with that email. It may not have been created yet, or it may have been deleted. You can create a new account.',
            });
          } else {
            onNotice({
              tone: 'warning',
              title: 'Incorrect email or password',
              text: 'Please check your credentials and try again. If you have not created an account yet, or it was deleted, you will need to register first.',
            });
          }
          return;
        }

        setMessage(error.message);
        return;
      }

      // A banned player can still authenticate (Supabase does not know about "banned"),
      // so profiles.status is checked here and the player is signed straight back out.
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
        onNotice({
          tone: 'danger',
          title: profile.status === 'suspended' ? 'Account suspended' : 'Account banned',
          text: `Your account has been ${profile.status}. Contact support for more information.`,
        });
        return;
      }

      if (profile.status === 'archived') {
        await supabase.auth.signOut();
        setPassword('');
        onNotice({
          tone: 'warning',
          title: 'Account removed',
          text: 'This account has been removed by an administrator and can no longer be used. You can create a new account.',
        });
        return;
      }

      onSuccess(data.user);
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <p className="eyebrow">Welcome back</p>
      <h2>Log in</h2>

      {banner && <div className="alert alert--ok" role="status">{banner}</div>}

      <form onSubmit={handleLogin} noValidate={false}>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {message && <div className="alert alert--err" role="alert">{message}</div>}

        <button type="submit" className="btn btn--block" disabled={loading}>
          <span>{loading ? 'Logging in...' : 'Log in'}</span>
        </button>
      </form>

      <p className="auth-switch">
        New to KORRECT?{' '}
        <button type="button" className="text-btn" onClick={onSwitchToRegister}>Create an account</button>
      </p>
    </div>
  );
}

export default Login;
