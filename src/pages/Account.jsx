import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  USERNAME_COOLDOWN_DAYS,
  calcAge,
  formatBirthday,
  isPasswordValid,
  passwordChecks,
  syncProfileFromMetadata,
  usernameCooldown,
  usernameError,
} from '../lib/profile';

const longDate = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function Account({ session, onLogout }) {
  const user = session?.user;

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [stats, setStats] = useState(null); // { violations, completed, highest } | 'error'

  const [newName, setNewName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const userId = user?.id;

  // Load the profile (same table and columns the site already used).
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;

    (async () => {
      await syncProfileFromMetadata(user);
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, birthday, username, status')
        .eq('id', user.id)
        .maybeSingle();
      if (!alive) return;

      if (error) setLoadError('Could not load your profile.');
      else if (!data) setLoadError('Profile not found. Please contact the administrator.');
      else {
        setProfile(data);
        setNewName(data.username || '');
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Load the player's own stats from the existing game tables (read only).
  useEffect(() => {
    if (!userId) return undefined;
    let alive = true;

    (async () => {
      const [viol, attempts] = await Promise.all([
        supabase.from('game_violations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('level_attempts').select('level_name, result, score').eq('user_id', userId).limit(5000),
      ]);
      if (!alive) return;

      if (viol.error || attempts.error) {
        console.warn('[KORRECT] stats unavailable:', viol.error?.message || attempts.error?.message);
        setStats('error');
        return;
      }

      const rows = attempts.data || [];
      const done = new Set(rows.filter((r) => r.result === 'finished').map((r) => r.level_name));
      setStats({
        violations: viol.count ?? 0,
        completed: done.size,
        highest: rows.reduce((best, r) => Math.max(best, Number(r.score) || 0), 0),
      });
    })();

    return () => { alive = false; };
  }, [userId]);

  if (!session) return <Navigate to="/play" replace />;

  const username = profile?.username || user.user_metadata?.username || 'KORRECT Player';
  const age = calcAge(profile?.birthday);
  const cooldown = usernameCooldown(user);

  async function handleUsername(e) {
    e.preventDefault();
    setNameMsg({ type: '', text: '' });

    const trimmed = newName.trim();
    if (cooldown.locked) return setNameMsg({ type: 'err', text: `You can change your username again on ${longDate(cooldown.until)}.` });
    if (trimmed === username) return setNameMsg({ type: 'err', text: 'That is already your username.' });
    const problem = usernameError(trimmed);
    if (problem) return setNameMsg({ type: 'err', text: problem });

    setNameBusy(true);
    const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', user.id);

    if (error) {
      setNameBusy(false);
      const taken = error.code === '23505' || /duplicate|unique/i.test(error.message || '');
      setNameMsg({ type: 'err', text: taken ? 'That username is already taken.' : 'Could not update your username. Please try again.' });
      return;
    }

    // Remember when it changed so the 14 day cooldown can be enforced.
    await supabase.auth.updateUser({ data: { username: trimmed, username_changed_at: new Date().toISOString() } });

    setNameBusy(false);
    setProfile((p) => ({ ...p, username: trimmed }));
    setNameMsg({ type: 'ok', text: `Username updated. You can change it again in ${USERNAME_COOLDOWN_DAYS} days.` });
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (!pw.current) return setPwMsg({ type: 'err', text: 'Please enter your current password.' });
    if (!isPasswordValid(pw.next)) return setPwMsg({ type: 'err', text: 'New password must be 8 to 16 characters and include a number.' });
    if (pw.next !== pw.confirm) return setPwMsg({ type: 'err', text: 'New password and confirmation do not match.' });
    if (pw.next === pw.current) return setPwMsg({ type: 'err', text: 'New password must be different from your current password.' });

    setPwBusy(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current });
    if (verifyError) {
      setPwBusy(false);
      return setPwMsg({ type: 'err', text: 'Current password is incorrect.' });
    }

    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) return setPwMsg({ type: 'err', text: error.message });

    setPw({ current: '', next: '', confirm: '' });
    setPwMsg({ type: 'ok', text: 'Password updated successfully.' });
  }

  const statCards = [
    { label: 'Violations committed', value: stats && stats !== 'error' ? stats.violations : null },
    { label: 'Completed levels', value: stats && stats !== 'error' ? stats.completed : null },
    { label: 'Highest points received', value: stats && stats !== 'error' ? stats.highest : null },
  ];

  return (
    <>
      <section className="page-hero page-hero--account">
        <div className="wrap account-head">
          <div className="avatar">{username.charAt(0).toUpperCase()}</div>
          <div>
            <p className="eyebrow">My account</p>
            <h1>{username}</h1>
            <p className="page-hero__lead">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email}</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap account">
          {loadError && <div className="alert alert--err">{loadError}</div>}

          {/* STATS */}
          <h2 className="account__h">Account stats</h2>
          <div className="stat-grid">
            {statCards.map((s) => (
              <div className="stat" key={s.label}>
                <strong>{s.value == null ? (stats === 'error' ? '\u2014' : '...') : s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          {stats === 'error' && <p className="field-help">Your stats could not be loaded right now. Play a mission, then check back.</p>}

          <div className="account__cols">
            {/* PROFILE */}
            <div className="panel">
              <h2 className="account__h">Profile</h2>

              <form onSubmit={handleUsername} className="account__form">
                <label className="field">
                  <span>Username</span>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={cooldown.locked || nameBusy} maxLength={20} />
                </label>
                <p className="field-help">
                  {cooldown.locked
                    ? `You changed your username recently. You can change it again on ${longDate(cooldown.until)}.`
                    : `You can change your username once every ${USERNAME_COOLDOWN_DAYS} days.`}
                </p>
                {nameMsg.text && <div className={`alert alert--${nameMsg.type}`} role="status">{nameMsg.text}</div>}
                <button type="submit" className="btn btn--sm" disabled={cooldown.locked || nameBusy}>
                  <span>{nameBusy ? 'Saving...' : 'Save username'}</span>
                </button>
              </form>

              <div className="readonly-grid">
                <label className="field"><span>First name</span><input type="text" value={profile?.first_name || ''} readOnly /></label>
                <label className="field"><span>Last name</span><input type="text" value={profile?.last_name || ''} readOnly /></label>
                <label className="field"><span>Birthday</span><input type="text" value={formatBirthday(profile?.birthday)} readOnly /></label>
                <label className="field"><span>Age</span><input type="text" value={age == null ? '' : age} readOnly /></label>
                <label className="field readonly-grid__wide"><span>Email</span><input type="text" value={user.email || ''} readOnly /></label>
              </div>
              <p className="field-help">Your name, birthday and age cannot be changed. Contact support if something is wrong.</p>
            </div>

            {/* PASSWORD */}
            <div className="panel">
              <h2 className="account__h">Change password</h2>
              <form onSubmit={handlePassword} className="account__form">
                <label className="field">
                  <span>Current password</span>
                  <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                </label>
                <label className="field">
                  <span>New password</span>
                  <input type="password" autoComplete="new-password" maxLength={16} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                </label>
                <ul className="checks">
                  {passwordChecks(pw.next).map((c) => <li key={c.id} className={c.ok ? 'is-ok' : ''}>{c.ok ? '\u2713' : '\u2022'} {c.label}</li>)}
                </ul>
                <label className="field">
                  <span>Repeat new password</span>
                  <input type="password" autoComplete="new-password" maxLength={16} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </label>
                {pwMsg.text && <div className={`alert alert--${pwMsg.type}`} role="status">{pwMsg.text}</div>}
                <button type="submit" className="btn btn--sm" disabled={pwBusy}>
                  <span>{pwBusy ? 'Updating...' : 'Change password'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="account__foot">
            <Link to="/download" className="btn"><span>Download the game</span></Link>
            <button type="button" className="btn btn--ghost" onClick={onLogout}><span>Log out</span></button>
          </div>
        </div>
      </section>
    </>
  );
}
