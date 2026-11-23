import { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  maskBirthday,
  parseBirthday,
  passwordChecks,
  isPasswordValid,
  usernameError,
  syncProfileFromMetadata,
} from '../lib/profile';

function Register({ onSwitchToLogin, onNeedsVerify, onCreatedWithoutVerify }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    birthday: '',
    password: '',
    confirm: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (name) => (e) => {
    const value = name === 'birthday' ? maskBirthday(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const birthday = parseBirthday(form.birthday);
  const checks = passwordChecks(form.password);
  const passwordsMatch = form.confirm.length > 0 && form.password === form.confirm;
  const showMismatch = form.confirm.length > 0 && form.password !== form.confirm;

  async function handleRegister(e) {
    e.preventDefault();
    setMessage('');

    const userErr = usernameError(form.username);
    if (userErr) return setMessage(userErr);
    if (!form.firstName.trim() || !form.lastName.trim()) return setMessage('Please enter your first and last name.');
    if (!birthday) return setMessage('Enter a valid birthday in mm/dd/yyyy format.');
    if (!isPasswordValid(form.password)) return setMessage('Password must be 8 to 16 characters and include at least one number.');
    if (form.password !== form.confirm) return setMessage('Passwords do not match.');

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          username: form.username.trim(),
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          birthday: birthday.iso,
          age: birthday.age,
        },
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    // Supabase hides duplicate emails by returning a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setLoading(false);
      setMessage('An account with this email already exists. Try logging in instead.');
      return;
    }

    if (data.session) {
      // Email confirmation is switched off in Supabase: the player is already signed in.
      await syncProfileFromMetadata(data.user);
      await supabase.auth.signOut();
      setLoading(false);
      onCreatedWithoutVerify();
      return;
    }

    setLoading(false);
    onNeedsVerify(form.email.trim(), 'We sent a code to your email. Enter it below.');
  }

  return (
    <div className="auth-form">
      <p className="eyebrow">Join KORRECT</p>
      <h2>Create account</h2>

      <form onSubmit={handleRegister}>
        <label className="field">
          <span>Username</span>
          <input type="text" autoComplete="username" placeholder="3 to 20 characters" value={form.username} onChange={set('username')} required />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>First name</span>
            <input type="text" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} required />
          </label>
          <label className="field">
            <span>Last name</span>
            <input type="text" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} required />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Birthday</span>
            <input type="text" inputMode="numeric" autoComplete="bday" placeholder="mm/dd/yyyy" maxLength={10} value={form.birthday} onChange={set('birthday')} required />
          </label>
          <label className="field">
            <span>Age</span>
            <input type="text" value={birthday ? String(birthday.age) : ''} placeholder="Auto" readOnly tabIndex={-1} aria-describedby="age-help" />
          </label>
        </div>
        <p id="age-help" className="field-help">Your age is worked out from your birthday.</p>

        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete="new-password" maxLength={16} value={form.password} onChange={set('password')} required />
        </label>

        <ul className="checks" aria-label="Password requirements">
          {checks.map((c) => (
            <li key={c.id} className={c.ok ? 'is-ok' : ''}>{c.ok ? '\u2713' : '\u2022'} {c.label}</li>
          ))}
        </ul>

        <label className="field">
          <span>Repeat password</span>
          <input
            type="password"
            autoComplete="new-password"
            maxLength={16}
            value={form.confirm}
            onChange={set('confirm')}
            aria-invalid={showMismatch}
            className={showMismatch ? 'is-invalid' : passwordsMatch ? 'is-valid' : ''}
            required
          />
        </label>
        {showMismatch && <p className="field-error">Passwords do not match.</p>}
        {passwordsMatch && <p className="field-ok">Passwords match.</p>}

        {message && <div className="alert alert--err" role="alert">{message}</div>}

        <button type="submit" className="btn btn--block" disabled={loading}>
          <span>{loading ? 'Creating account...' : 'Create account'}</span>
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="text-btn" onClick={onSwitchToLogin}>Log in</button>
      </p>
    </div>
  );
}

export default Register;
