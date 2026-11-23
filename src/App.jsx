import { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { supabase } from './lib/supabase';
import { syncProfileFromMetadata } from './lib/profile';
import AdminDashboard from './admin/adminDashboard.jsx';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NoticeModal from './components/NoticeModal';
import { Icon } from './components/MotoArt';

import Home from './pages/Home';
import News from './pages/News';
import Article from './pages/Article';
import Guide from './pages/Guide';
import Quadtum from './pages/Quadtum';
import Auth from './pages/Auth';
import Download from './pages/Download';
import Account from './pages/Account';

import './App.css';
import './admin-access.css';

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
            {notLoggedIn ? <Icon.Block width="34" height="34" /> : <Icon.Alert width="34" height="34" />}
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
                  window.location.href = '/play';
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
// PLAYER WEBSITE
// ------------------------------
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function Website({ session, onNotice }) {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Logout failed: ' + error.message);
      return;
    }

    navigate('/');
  }, [navigate]);

  return (
    <div className="site">
      <ScrollToTop />
      <Navbar session={session} onLogout={handleLogout} />

      <main className="site__main">
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<Article />} />
          <Route path="/guide" element={<Guide session={session} />} />
          <Route path="/quadtum" element={<Quadtum />} />
          <Route path="/play" element={<Auth session={session} onNotice={onNotice} />} />
          <Route path="/download" element={<Download session={session} />} />
          <Route
            path="/account"
            element={<Account session={session} onLogout={handleLogout} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

// ------------------------------
// APP SESSION HANDLER
// ------------------------------
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // { tone, title, text } | null  (controls the pop-up)
  const [notice, setNotice] = useState(null);

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
  // loads with a saved login). Banned / suspended / archived players are
  // signed out and shown a pop-up.
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const user = session.user;

    async function enforceAccountStatus() {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled || error || !data) return;

      if (data.status === 'banned' || data.status === 'suspended') {
        setNotice({
          tone: 'danger',
          title: data.status === 'suspended' ? 'Account suspended' : 'Account banned',
          text: `Your account has been ${data.status}. Contact support for more information.`,
        });
        await supabase.auth.signOut();
        return;
      }

      if (data.status === 'archived') {
        setNotice({
          tone: 'warning',
          title: 'Account removed',
          text: 'This account has been removed by an administrator and can no longer be used.',
        });
        await supabase.auth.signOut();
        return;
      }

      // Fill in first name / last name / birthday from sign-up if still empty.
      syncProfileFromMetadata(user);
    }

    enforceAccountStatus();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return <div className="boot">Loading KORRECT...</div>;
  }

  return (
    <>
      <NoticeModal notice={notice} onClose={() => setNotice(null)} />

      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={<AdminRoute session={session} />}
          />

          <Route
            path="*"
            element={<Website session={session} onNotice={setNotice} />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
