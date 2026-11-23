import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { syncProfileFromMetadata } from '../lib/profile';

// Step 2 of sign-up: the confirmation code that is emailed to the player.
export default function Verify({ email, initialMessage, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(initialMessage || '');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'signup',
    });

    if (error) {
      setLoading(false);
      setIsError(true);
      setMessage(error.message);
      return;
    }

    // Verifying logs the player in. Save their details, then sign out so they
    // are taken back to the login page as requested.
    if (data?.user) await syncProfileFromMetadata(data.user);
    await supabase.auth.signOut();

    setLoading(false);
    onVerified();
  }

  async function handleResend() {
    setMessage('');
    setIsError(false);
    setLoading(true);

    const { error } = await supabase.auth.resend({ type: 'signup', email });

    setLoading(false);
    setIsError(Boolean(error));
    setMessage(error ? error.message : 'A new code was sent to your email.');
  }

  return (
    <div className="auth-form">
      <p className="eyebrow">Almost there</p>
      <h2>Confirm your email</h2>
      <p className="auth-help">
        We sent a confirmation code to <strong>{email}</strong>. Enter it below to finish creating your account.
      </p>

      <form onSubmit={handleVerify}>
        <label className="field">
          <span>Confirmation code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="field__code"
            required
          />
        </label>

        {message && <div className={`alert ${isError ? 'alert--err' : 'alert--ok'}`} role="status">{message}</div>}

        <button type="submit" className="btn btn--block" disabled={loading}>
          <span>{loading ? 'Verifying...' : 'Verify and finish'}</span>
        </button>
      </form>

      <p className="auth-switch">
        <button type="button" className="text-btn" onClick={handleResend} disabled={loading}>Resend code</button>
        <span className="auth-dot">&middot;</span>
        <button type="button" className="text-btn" onClick={onBack}>Back to log in</button>
      </p>
    </div>
  );
}
