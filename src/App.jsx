import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { supabase } from './lib/supabase';
import Login from './components/login';
import Register from './components/register';
import AdminDashboard from './admin/adminDashboard.jsx';

import './App.css';


//ADMIN ROUTE (fixed dis na ragh)
function AdminRoute({ session }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      setChecking(true);
      setIsAdmin(false);
      setErrorMessage('');

      if (!session?.user) {
        setErrorMessage('You are not logged in.');
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error('Admin check failed:', error);
        setErrorMessage(`Supabase error: ${error.message}`);
      } else if (!data) {
        setErrorMessage('No profile was found for this account.');
      } else if (data.role !== 'admin') {
        setErrorMessage(
          `Your profile role is "${data.role}". It must be "admin".`
        );
      } else {
        setIsAdmin(true);
      }

      setChecking(false);
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [session]);

  if (checking) {
    return (
      <div className="admin-access-page">
        <div className="admin-access-card">
          <div className="admin-access-logo">
            KORRECT<span>.</span>
          </div>

          <div className="admin-access-spinner" />

          <h2>VERIFYING ACCESS</h2>
          <p>Please wait while we check your administrator account.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    const notLoggedIn = !session?.user;

    return (
      <div className="admin-access-page">
        <div className="admin-access-card">
          <div className="admin-access-logo">
            KORRECT<span>.</span>
          </div>

          <div className="admin-access-icon">
            {notLoggedIn ? '🔒' : '⚠️'}
          </div>

          <p className="admin-access-eyebrow">
            ADMINISTRATOR PORTAL
          </p>

          <h1>
            {notLoggedIn
              ? 'SIGN IN REQUIRED'
              : 'ACCESS RESTRICTED'}
          </h1>

          <p className="admin-access-description">
            {notLoggedIn
              ? 'You need to sign in with your administrator account before accessing the KORRECT admin dashboard.'
              : errorMessage}
          </p>

          <div className="admin-access-notice">
            <span className="admin-access-status-dot" />
            {notLoggedIn
              ? 'You are currently signed out.'
              : 'Your account does not have administrator access.'}
          </div>

          <div className="admin-access-actions">
            {notLoggedIn && (
              <button
                className="admin-access-primary"
                onClick={() => {
                  window.location.href = '/?tab=account';
                }}
              >
                GO TO LOGIN <span>→</span>
              </button>
            )}

            <button
              className="admin-access-secondary"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              RETURN TO WEBSITE
            </button>
          </div>

          <div className="admin-access-footer">
            <span>KORRECT ADMIN SYSTEM</span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ------------------------------
// BANNED / SUSPENDED POP-UP
// ------------------------------
function AccountBlockedModal({ status, onClose }) {
  if (!status) return null;

  const word = status === 'suspended' ? 'suspended' : 'banned';

  return (
    <div style={blockedStyles.overlay} role="presentation">
      <div
        style={blockedStyles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="blocked-title"
        aria-describedby="blocked-text"
      >
        <div style={blockedStyles.icon}>🚫</div>
        <h2 id="blocked-title" style={blockedStyles.title}>
          ACCOUNT {word.toUpperCase()}
        </h2>
        <p id="blocked-text" style={blockedStyles.text}>
          Your account has been {word}. Contact support for more
          information.
        </p>
        <button type="button" onClick={onClose} style={blockedStyles.button}>
          OK
        </button>
      </div>
    </div>
  );
}

const blockedStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    color: '#20242b',
    borderRadius: '14px',
    padding: '32px 28px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    borderTop: '6px solid #f58220',
  },
  icon: { fontSize: '40px', marginBottom: '8px' },
  title: { margin: '0 0 12px', fontSize: '22px', letterSpacing: '1px' },
  text: { margin: '0 0 24px', fontSize: '16px', lineHeight: 1.5 },
  button: {
    background: '#f58220',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 36px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

// ------------------------------
// PLAYER WEBSITE
// ------------------------------
function Website({ session, onBlocked }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showRegister, setShowRegister] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // CHANGE PASSWORD state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const emptyProfile = {
    first_name: '',
    last_name: '',
    birthday: '',
    gender: '',
    address: '',
    username: '',
    status: 'active',
  };

  const [profile, setProfile] = useState(emptyProfile);

  // LOAD PLAYER PROFILE
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!session?.user) {
        setProfile(emptyProfile);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileMessage('');

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'first_name, last_name, birthday, gender, address, username, status'
        )
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error('Profile loading error:', error.message);
        setProfileMessage('Could not load your profile.');
      } else if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          birthday: data.birthday || '',
          gender: data.gender || '',
          address: data.address || '',
          username:
            data.username ||
            session.user.user_metadata?.username ||
            'KORRECT Player',
          status: data.status || 'active',
        });
      } else {
        setProfileMessage(
          'Profile not found. Please contact the administrator.'
        );
      }

      setProfileLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [session]);

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // SAVE PLAYER PROFILE
  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!session?.user) return;

    setSaving(true);
    setProfileMessage('');

    const updates = {
      first_name: profile.first_name.trim(),
      last_name: profile.last_name.trim(),
      birthday: profile.birthday || null,
      gender: profile.gender || null,
      address: profile.address.trim() || null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    setSaving(false);

    if (error) {
      console.error('Profile save error:', error.message);
      setProfileMessage(
        'Could not save changes. Please check your database policies.'
      );
      return;
    }

    setProfileMessage('Profile changes saved successfully!');
  }

  // CHANGE PASSWORD
  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleChangePassword() {
    if (!session?.user) return;

    setPasswordMessage('');

    if (!passwordForm.current) {
      setPasswordMessage('Please enter your current password.');
      return;
    }

    if (passwordForm.next.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }

    if (passwordForm.next === passwordForm.current) {
      setPasswordMessage(
        'New password must be different from your current password.'
      );
      return;
    }

    setPasswordSaving(true);

    // Verify the current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: passwordForm.current,
    });

    if (verifyError) {
      setPasswordSaving(false);
      setPasswordMessage('Current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.next,
    });

    setPasswordSaving(false);

    if (error) {
      setPasswordMessage(error.message);
      return;
    }

    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordMessage('Password updated successfully!');
  }

  // Pressing Enter in a password box should change the password,
  // not submit the profile form that surrounds it.
  function handlePasswordKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleChangePassword();
    }
  }

  // LOGOUT
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Logout failed: ' + error.message);
      return;
    }

    setActiveTab('home');
    setShowRegister(false);
  }

  // DOWNLOAD
  function handleDownload() {
    if (!session) {
      setActiveTab('account');
      setShowRegister(false);
      return;
    }

    alert(
      'You are logged in! The KORRECT APK will be available once the game is released.'
    );
  }

  // WEBSITE CONTENT
  function renderContent() {
    if (activeTab === 'home') {
      return (
        <>
          <section className="hero-section">
            <p className="eyebrow">
              GAMIFIED MOTORCYCLE SAFETY SIMULATION
            </p>

            <h1>
              RIDE SMART.
              <span>RIDE KORRECT.</span>
            </h1>

            <p className="hero-description">
              KORRECT is a gamified motorcycle driving simulation
              designed to help aspiring motorcycle drivers recognize
              and correct unsafe riding behaviors in a safe,
              controlled virtual environment.
            </p>

            <button
              className="primary-button"
              onClick={() => setActiveTab('about')}
            >
              EXPLORE KORRECT
            </button>
          </section>

          <section className="content-section">
            <p className="eyebrow">WHAT IS KORRECT?</p>
            <h2>LEARN BEFORE YOU RIDE.</h2>

            <p>
              KORRECT stands for Kamote Offense Reduction
              and Correction Simulation and it is for
              Aspiring Motorcycle Drivers in Valenzuela City.
            </p>

            <p>
              The project combines motorcycle simulation,
              gamified missions, traffic awareness, and
              performance feedback to support beginner riders
              in developing safer riding habits.
            </p>

            <p>
              KORRECT is designed as a supplementary learning
              tool and does not replace formal driving instruction,
              actual road practice, or LTO licensing procedures.
            </p>
          </section>

          <section className="content-section">
            <p className="eyebrow">CORE FEATURES</p>
            <h2>BUILT FOR BETTER RIDING.</h2>

            <p>🏍️ Basic Motorcycle Driving Lessons</p>
            <p>🎯 Gamified Missions and Activities</p>
            <p>⚠️ Traffic Violation Awareness</p>
            <p>📊 Performance Evaluation and Feedback</p>
            <p>
              🌦️ Basic Weather Conditions and Beginner-Friendly Gameplay
            </p>
          </section>
        </>
      );
    }

    if (activeTab === 'about') {
      return (
        <section className="content-section">
          <p className="eyebrow">THE STORY BEHIND THE PROJECT</p>
          <h2>ABOUT KORRECT</h2>

          <p>
            Motorcycles are widely used in the Philippines because
            they are affordable, efficient, and practical for
            everyday transportation.
          </p>

          <p>
            However, unsafe riding behaviors such as overspeeding,
            counterflowing, and illegal overtaking contribute to
            road safety concerns.
          </p>

          <p>
            Many aspiring motorcycle drivers learn informally from
            friends or family. KORRECT was proposed to provide
            a safer and more interactive way to practice recognizing
            unsafe riding behaviors before experiencing real traffic.
          </p>

          <p>
            The simulation focuses on selected traffic situations,
            defensive riding practices, and learning activities
            aligned with selected LTO guidelines.
          </p>

          <p className="eyebrow">OUR DEVELOPMENT TEAM</p>
          <h2>THE DEVELOPERS</h2>

          <p><strong>LORENCE</strong></p>
          <p><strong>THEO</strong></p>
          <p><strong>KRISTAL</strong></p>
          <p><strong>ANNA</strong></p>

          <p>
            This project was developed as an undergraduate
            capstone project under the College of Engineering
            and Information Technology at Pamantasan ng Lungsod ng Valenzuela.
          </p>
        </section>
      );
    }

    if (activeTab === 'download') {
      return (
        <section className="content-section">
          <p className="eyebrow">YOUR RIDING JOURNEY STARTS HERE</p>
          <h2>DOWNLOAD KORRECT</h2>

          <p>
            KORRECT is being developed as a mobile motorcycle
            simulation focused on beginner-friendly learning,
            guided missions, and safe riding practices.
          </p>

          {!session ? (
            <>
              <p>
                Please log in to your account before downloading
                the KORRECT game.
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  setActiveTab('account');
                  setShowRegister(false);
                }}
              >
                LOGIN TO DOWNLOAD
              </button>
            </>
          ) : (
            <>
              <p>
                You are logged in. The official APK will become
                available once the Unity game is ready for release.
              </p>

              <button
                className="primary-button"
                onClick={handleDownload}
              >
                DOWNLOAD APK
              </button>
            </>
          )}
        </section>
      );
    }

    if (activeTab === 'account') {
      if (!session) {
        return showRegister ? (
          <Register
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <Login
            onSwitchToRegister={() => setShowRegister(true)}
            onBlocked={onBlocked}
          />
        );
      }

      const username =
        profile.username ||
        session.user.user_metadata?.username ||
        'KORRECT Player';

      return (
        <section className="account-page">
          <div className="account-card">
            <div className="account-header">
              <div className="profile-avatar">
                {username.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="account-label">MY ACCOUNT</p>
                <h2>{username}</h2>
                <p className="account-subtitle">
                  Manage your KORRECT player profile
                </p>
              </div>
            </div>

            {profileLoading && <p>Loading profile...</p>}

            <form onSubmit={handleSaveProfile}>
              <div className="account-section">
                <h3>Personal Information</h3>

                <div className="account-grid">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={profile.first_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={profile.last_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      value={session.user.email || ''}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={profile.address}
                      onChange={handleProfileChange}
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="birthday">Birthday</label>
                    <input
                      id="birthday"
                      name="birthday"
                      type="date"
                      value={profile.birthday}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={profile.gender}
                      onChange={handleProfileChange}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="account-section">
                <h3>Account Security</h3>

                <div className="account-grid">
                  <div className="form-group">
                    <label>Account Status</label>
                    <input
                      type="text"
                      value={profile.status}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={session.user.email || ''}
                      readOnly
                    />
                  </div>
                </div>

                <h3>Change Password</h3>

                <div className="account-grid">
                  <div className="form-group">
                    <label htmlFor="current_password">
                      Current Password
                    </label>
                    <input
                      id="current_password"
                      name="current"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current}
                      onChange={handlePasswordFieldChange}
                      onKeyDown={handlePasswordKeyDown}
                    />
                  </div>

                  <div className="form-group" />

                  <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      id="new_password"
                      name="next"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={passwordForm.next}
                      onChange={handlePasswordFieldChange}
                      onKeyDown={handlePasswordKeyDown}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm_password"
                      name="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirm}
                      onChange={handlePasswordFieldChange}
                      onKeyDown={handlePasswordKeyDown}
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <p role="status">{passwordMessage}</p>
                )}

                <div className="account-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                  >
                    {passwordSaving ? 'UPDATING...' : 'CHANGE PASSWORD'}
                  </button>
                </div>
              </div>

              <div className="account-section">
                <h3>KORRECT Player Information</h3>

                <div className="account-grid">
                  <div className="form-group">
                    <label>Game Progress</label>
                    <input
                      type="text"
                      value="Not available yet"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Mission Results</label>
                    <input
                      type="text"
                      value="Not available yet"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {profileMessage && (
                <p role="status">{profileMessage}</p>
              )}

              <div className="account-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleLogout}
                >
                  LOGOUT
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || profileLoading}
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <div className="website">
      <header className="navbar">
        <button
          className="logo"
          onClick={() => setActiveTab('home')}
        >
          KORRECT<span>.</span>
        </button>

        <nav>
          <button
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => setActiveTab('home')}
          >
            HOME
          </button>

          <button
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
          >
            ABOUT
          </button>

          <button
            className={activeTab === 'download' ? 'active' : ''}
            onClick={() => setActiveTab('download')}
          >
            DOWNLOAD
          </button>

          <button
            className={activeTab === 'account' ? 'active' : ''}
            onClick={() => setActiveTab('account')}
          >
            ACCOUNT
          </button>
        </nav>
      </header>

      <main>{renderContent()}</main>

      <footer>
        <p>© 2026 KORRECT | Quadtum | All Rights Reserved.</p>
      </footer>
    </div>
  );
}

// ------------------------------
// APP SESSION HANDLER
// ------------------------------
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 'banned' | 'suspended' | null  (controls the pop-up)
  const [blockedStatus, setBlockedStatus] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Session error:', error.message);
      }

      setSession(session);
      setLoading(false);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Check the account status every time someone logs in (or the page
  // loads with a saved login). Banned / suspended players are signed
  // out and shown a pop-up.
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function enforceAccountStatus() {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      console.log('[KORRECT] account status check:', data?.status, error);

      if (cancelled || error || !data) return;

      if (data.status === 'banned' || data.status === 'suspended') {
        setBlockedStatus(data.status);
        await supabase.auth.signOut();
      }
    }

    enforceAccountStatus();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div style={loadingStyle}>
        Loading KORRECT...
      </div>
    );
  }

  return (
    <>
    <AccountBlockedModal
      status={blockedStatus}
      onClose={() => setBlockedStatus(null)}
    />

    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={<AdminRoute session={session} />}
        />

        <Route
          path="*"
          element={
            <Website
              session={session}
              onBlocked={setBlockedStatus}
            />
          }
        />
      </Routes>
    </BrowserRouter>
    </>
  );
}

const loadingStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#20242b',
  color: '#f58220',
  fontFamily: 'Arial, sans-serif',
};

export default App;