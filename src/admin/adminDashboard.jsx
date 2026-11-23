import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PlayerReportModal from './PlayerReportModal';
import LevelsTab from './LevelsTab';

const menuItems = [
  { id: 'overview', label: 'Dashboard', icon: '▦' },
  { id: 'users', label: 'Player Accounts', icon: '♙' },
  { id: 'analytics', label: 'Game Analytics', icon: '▥' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'levels', label: 'Levels & Lessons', icon: '✎' },
  { id: 'logs', label: 'Audit Logs', icon: '☷' },
];

// Built from the same VITE_SUPABASE_URL you already have in .env,
// so there's nothing to hardcode or keep in sync.
const DELETE_PLAYER_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-player`;

// True when the screen is phone / small-tablet sized.
function useIsMobile(breakpoint = 820) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  // On phones the sidebar becomes a slide-in menu, so these styles
  // are layered on top of the normal (desktop) ones.
  const styles = isMobile
    ? mergeStyles(baseStyles, {
        app: { flexDirection: 'column' },
        sidebar: {
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '270px',
          minWidth: '270px',
          minHeight: '0',
          height: '100%',
          zIndex: 60,
          overflowY: 'auto',
          transition: 'transform 0.25s ease',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        },
        main: { padding: '16px' },
        header: { paddingBottom: '16px', marginBottom: '20px' },
        pageTitle: { fontSize: '22px' },
        contentGrid: { gridTemplateColumns: 'minmax(0, 1fr)' },
        statsGrid: {
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '12px',
        },
        statCard: { padding: '14px' },
        statValue: { fontSize: '22px' },
        panel: { padding: '16px' },
      })
    : baseStyles;

  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [adminName, setAdminName] = useState('Administrator');
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState('');
  const [actionPlayerId, setActionPlayerId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [riderFilter, setRiderFilter] = useState('');
  const [riderRanks, setRiderRanks] = useState([]);
  const [reportPlayer, setReportPlayer] = useState(null);
  const [stats, setStats] = useState({
    sessions: '—',
    violations: '—',
    finished: '—',
    avgSafety: '—',
    topViolations: [],
  });
  const [board, setBoard] = useState([]);
  const [fastLevel, setFastLevel] = useState('Chp1Lvl1');
  const [fastest, setFastest] = useState([]);
  const [logs, setLogs] = useState([]);

  async function fetchStats() {
    const count = async (table, filter) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filter) query = filter(query);
      const { count: total } = await query;
      return total ?? 0;
    };
    const [sessions, violations, finished] = await Promise.all([
      count('game_sessions'),
      count('game_violations'),
      count('level_attempts', (query) => query.eq('result', 'finished')),
    ]);
    const { data: safety } = await supabase
      .from('level_attempts')
      .select('safety_percent')
      .neq('result', 'quit');
    const avgSafety = safety?.length
      ? String(Math.round(safety.reduce((sum, row) => sum + row.safety_percent, 0) / safety.length)) + '%'
      : '—';
    const { data: violationRows } = await supabase
      .from('game_violations')
      .select('violation_type')
      .limit(10000);
    const tally = {};
    (violationRows || []).forEach((row) => {
      tally[row.violation_type] = (tally[row.violation_type] || 0) + 1;
    });
    const topViolations = Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    setStats({ sessions, violations, finished, avgSafety, topViolations });
  }

  async function fetchLeaderboard() {
    const { data } = await supabase.rpc('leaderboard_total', { p_limit: 50 });
    setBoard(data || []);
  }

  async function fetchFastest() {
    const { data } = await supabase.rpc('leaderboard_fastest', {
      p_level_name: fastLevel,
      p_limit: 20,
    });
    setFastest(data || []);
  }

  async function fetchLogs() {
    const { data } = await supabase
      .from('admin_logs')
      .select('created_at, action, details, admin:profiles!admin_logs_admin_id_fkey(username), target:profiles!admin_logs_target_user_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs(data || []);
  }

  async function fetchPlayers() {
    setPlayersLoading(true);
    setPlayersError('');

    try {
      const { data, error } = await supabase.rpc('admin_player_overview', {
        p_search: null,
        p_rider_status: riderFilter || null,
      });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      setPlayersError(error.message || 'Unable to load player accounts.');
    } finally {
      setPlayersLoading(false);
    }
  }

  useEffect(() => {
    supabase.from('rider_ranks').select('name').order('min_stars')
      .then(({ data }) => setRiderRanks((data || []).map((r) => r.name)));
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [riderFilter]);

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    fetchFastest();
  }, [fastLevel]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  async function handleBanToggle(player) {
    const isBanned = player.status === 'banned';
    const nextStatus = isBanned ? 'active' : 'banned';

    const confirmed = window.confirm(
      isBanned
        ? `Unban ${player.username || player.email}? They'll be able to log in again.`
        : `Ban ${player.username || player.email}? They won't be able to log in until unbanned.`
    );
    if (!confirmed) return;

    setActionError('');
    setActionPlayerId(player.id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', player.id);

      if (error) throw error;

      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, status: nextStatus } : p))
      );
    } catch (error) {
      setActionError(error.message || 'Unable to update account status.');
    } finally {
      setActionPlayerId(null);
    }
  }

  async function handleDeletePlayer(player) {
    const { data: hasRecords, error: checkError } =
      await supabase.rpc('admin_player_has_records', { p_user_id: player.id });
    if (checkError) {
      setActionError(checkError.message);
      return;
    }

    if (hasRecords) {
      const archive = window.confirm(
        `${player.username || player.email} already has recorded game results, so the account cannot be permanently deleted without losing those records.\n\nPress OK to ARCHIVE it instead. The player will no longer be able to log in, and their records stay available for reports.`
      );
      if (!archive) return;
      setActionError('');
      setActionPlayerId(player.id);
      const { error } = await supabase.rpc('admin_archive_player', { p_user_id: player.id });
      setActionPlayerId(null);
      if (error) {
        setActionError(error.message);
        return;
      }
      setPlayers((prev) => prev.map((p) => (
        p.id === player.id ? { ...p, status: 'archived' } : p
      )));
      setActionNotice(`${player.username || player.email} was archived.`);
      return;
    }

    setActionNotice('');
    const confirmed = window.confirm(
      `Permanently delete ${player.username || player.email}? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionError('');
    setActionPlayerId(player.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Your session expired. Please log in again.');

      const response = await fetch(DELETE_PLAYER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ playerId: player.id }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Delete failed.');

      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      setActionNotice(`${player.username || player.email} was deleted.`);
    } catch (error) {
      setActionError(
        error instanceof TypeError
          ? 'Could not reach the delete service (admin-delete-player). Make sure that Supabase Edge Function is deployed.'
          : error.message || 'Unable to delete account.'
      );
    } finally {
      setActionPlayerId(null);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('Logout failed: ' + error.message);
    }
  }

  return (
    <div style={styles.app}>
      {isMobile && (
        <div style={mobileBarStyle}>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            style={mobileMenuButtonStyle}
          >
            ☰
          </button>
          <strong style={{ letterSpacing: '1px' }}>KORRECT</strong>
          <small style={{ color: '#9da3ae', letterSpacing: '0.7px' }}>
            ADMIN PANEL
          </small>
        </div>
      )}

      {isMobile && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={mobileOverlayStyle}
          role="presentation"
        />
      )}

      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>K</div>

          <div>
            <strong style={styles.logoTitle}>KORRECT</strong>
            <small style={styles.logoSubtitle}>
              ADMIN PANEL
            </small>
          </div>
        </div>

        <p style={styles.menuTitle}>MANAGEMENT</p>

        <nav style={styles.navigation}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMenuOpen(false);
              }}
              style={{
                ...styles.menuButton,
                ...(activeTab === item.id
                  ? styles.activeMenu
                  : {}),
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              {item.label}

              {activeTab === item.id && (
                <span style={styles.activeDot}>●</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.adminAvatar}>A</div>

          <div style={{ flex: 1 }}>
            <strong style={{ color: '#fff' }}>
              {adminName}
            </strong>

            <small style={styles.logoSubtitle}>
              System Administrator
            </small>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            style={styles.logoutButton}
          >
            ↪
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.breadcrumb}>
              KORRECT / ADMINISTRATION
            </p>

            <h1 style={styles.pageTitle}>
              {menuItems.find(
                (item) => item.id === activeTab
              )?.label}
            </h1>

            <p style={styles.subtitle}>
              Manage players and monitor KORRECT game activity.
            </p>
          </div>

          <span style={styles.adminBadge}>
            ● ADMIN ACCESS
          </span>
        </header>

        {activeTab === 'overview' && (
          <>
            <div style={styles.sectionHeading}>
              <h2 style={styles.sectionTitle}>
                System Overview
              </h2>

              <span style={styles.sectionTag}>
                ADMIN DASHBOARD
              </span>
            </div>

            <div style={styles.statsGrid}>
              <StatCard
                title="TOTAL PLAYERS"
                value={playersLoading ? '—' : players.length}
                icon="♙"
                color="#f58220"
              />

              <StatCard
                title="ACTIVE ACCOUNTS"
                value={
                  playersLoading
                    ? '—'
                    : players.filter((p) => p.status !== 'suspended').length
                }
                icon="✓"
                color="#16a085"
              />

              <StatCard
                title="GAME SESSIONS"
                value={stats.sessions}
                icon="▶"
                color="#4b83e5"
              />

              <StatCard
                title="VIOLATIONS RECORDED"
                value={stats.violations}
                icon="!"
                color="#d94b4b"
              />
            </div>

            <div style={styles.contentGrid}>
              <section style={styles.panel}>
                <PanelHeading
                  title="Player Activity"
                  subtitle="Overview of game activity"
                />

                <div style={styles.emptyChart}>
                  <span style={styles.chartIcon}>▥</span>

                  <strong>Average safety rating: {stats.avgSafety}</strong>

                  <p style={styles.subtitle}>
                    Most common violations
                  </p>
                  {(stats.topViolations || []).map(([name, count]) => (
                    <p key={name} style={styles.subtitle}>{name}: {count}</p>
                  ))}
                </div>
              </section>

              <section style={styles.panel}>
                <PanelHeading
                  title="Quick Management"
                  subtitle="Admin shortcuts"
                />

                <QuickAction
                  icon="♙"
                  title="Player Accounts"
                  description="View and manage registered players"
                  onClick={() => setActiveTab('users')}
                />

                <QuickAction
                  icon="🏆"
                  title="Leaderboard"
                  description="View points and player progress"
                  onClick={() => setActiveTab('leaderboard')}
                />

                <QuickAction
                  icon="☷"
                  title="Audit Logs"
                  description="Review recorded admin activity"
                  onClick={() => setActiveTab('logs')}
                />
              </section>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <section style={styles.panel}>
            <PanelHeading
              title="Player Account Management"
              subtitle="Search and review registered player accounts"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search username, email or user ID..."
              style={styles.searchInput}
            />
            <select
              value={riderFilter}
              onChange={(event) => setRiderFilter(event.target.value)}
              style={styles.searchInput}
            >
              <option value="">All rider statuses</option>
              {riderRanks.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>

            {playersLoading && (
              <p style={styles.subtitle}>Loading player accounts...</p>
            )}

            {playersError && (
              <p style={{ ...styles.subtitle, color: '#d94b4b' }}>
                {playersError}
              </p>
            )}

            {actionError && (
              <p style={{ ...styles.subtitle, color: '#d94b4b' }}>
                {actionError}
              </p>
            )}

            {actionNotice && (
              <p style={{ ...styles.subtitle, color: '#1f8a4c' }}>
                {actionNotice}
              </p>
            )}

            {!playersLoading && !playersError && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>PLAYER</th>
                      <th style={styles.th}>EMAIL</th>
                      <th style={styles.th}>ACCOUNT STATUS</th>
                      <th style={styles.th}>LOGIN STATUS</th>
                      <th style={styles.th}>ACCOUNT CREATED</th>
                      <th style={styles.th}>RIDER STATUS</th>
                      <th style={styles.th}>STARS</th>
                      <th style={styles.th}>SCORE</th>
                      <th style={styles.th}>LEVELS</th>
                      <th style={styles.th}>PLAYTIME</th>
                      <th style={{ ...styles.th, ...stickyActionsHead }}>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {players
                      .filter((player) => {
                        const term = search.trim().toLowerCase();
                        return (
                          !term ||
                          player.username?.toLowerCase().includes(term) ||
                          player.email?.toLowerCase().includes(term) ||
                          player.id?.toLowerCase().includes(term)
                        );
                      })
                      .map((player) => (
                        <tr key={player.id}>
                          <td style={styles.td}>
                            {player.username || 'Unnamed Player'}
                          </td>
                          <td style={styles.td}>
                            {player.email || 'Not available'}
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(player.status === 'banned'
                                  ? styles.bannedStatus
                                  : player.status === 'suspended' || player.status === 'archived'
                                  ? styles.suspendedStatus
                                  : styles.activeStatus),
                              }}
                            >
                              {player.status || 'active'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.gameStatusBadge,
                                ...(player.last_sign_in_at
                                  ? styles.loggedInStatus
                                  : {}),
                              }}
                            >
                              {player.last_sign_in_at
                                ? `Last login: ${new Date(
                                    player.last_sign_in_at
                                  ).toLocaleString()}`
                                : 'Never logged in'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {player.created_at
                              ? new Date(player.created_at).toLocaleString()
                              : '—'}
                          </td>
                          <td style={styles.td}>{player.rider_status || 'Learner'}</td>
                          <td style={styles.td}>{player.total_stars || 0} ★</td>
                          <td style={styles.td}>{player.total_score || 0}</td>
                          <td style={styles.td}>{player.levels_finished || 0}</td>
                          <td style={styles.td}>{Math.round((player.total_playtime_seconds || 0) / 60)} min</td>
                          <td style={{ ...styles.td, ...stickyActionsCell }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                disabled={actionPlayerId === player.id}
                                onClick={() => handleBanToggle(player)}
                                style={styles.actionButtonBan}
                              >
                                {actionPlayerId === player.id
                                  ? '...'
                                  : player.status === 'banned'
                                  ? 'Unban'
                                  : 'Ban'}
                              </button>

                              <button
                                type="button"
                                disabled={actionPlayerId === player.id}
                                onClick={() => handleDeletePlayer(player)}
                                style={styles.actionButtonDelete}
                              >
                                {actionPlayerId === player.id ? '...' : 'Delete'}
                              </button>
                              <button
                                type="button"
                                disabled={actionPlayerId === player.id}
                                onClick={() => setReportPlayer(player)}
                                style={styles.actionButtonStats}
                              >
                                View Stats
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {players.filter((player) => {
                      const term = search.trim().toLowerCase();
                      return (
                        !term ||
                        player.username?.toLowerCase().includes(term) ||
                        player.email?.toLowerCase().includes(term) ||
                        player.id?.toLowerCase().includes(term)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan="11" style={styles.emptyCell}>
                          No matching players found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === 'analytics' && (
          <section style={styles.panel}>
            <PanelHeading
              title="Game Analytics"
              subtitle="Monitor player activity and game performance"
            />

            <div style={styles.statsGrid}>
              <StatCard
                title="LOGINS (24 HOURS)"
                value={players.filter((player) => player.last_sign_in_at && Date.now() - new Date(player.last_sign_in_at) < 864e5).length}
                icon="↗"
                color="#4b83e5"
              />

              <StatCard
                title="PLAY TIME"
                  value={String(Math.round(players.reduce((sum, player) => sum + (player.total_playtime_seconds || 0), 0) / 3600)) + ' h'}
                icon="◷"
                color="#16a085"
              />

              <StatCard
                title="COMPLETED SESSIONS"
                value={stats.finished}
                icon="✓"
                color="#f58220"
              />

              <StatCard
                title="VIOLATIONS"
                value={stats.violations}
                icon="!"
                color="#d94b4b"
              />
            </div>

            <div style={styles.emptyChart}>
              <span style={styles.chartIcon}>▥</span>

              <strong>Average safety rating: {stats.avgSafety}</strong>

              <p style={styles.subtitle}>
                Most common violations
              </p>
              {(stats.topViolations || []).map(([name, count]) => (
                <p key={name} style={styles.subtitle}>{name}: {count}</p>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'leaderboard' && (
          <section style={styles.panel}>
            <PanelHeading
              title="Player Leaderboard"
              subtitle="Review player points and progress rankings"
            />

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>RANK</th>
                    <th style={styles.th}>PLAYER</th>
                    <th style={styles.th}>TOTAL SCORE</th>
                    <th style={styles.th}>STARS / RIDER STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {board.map((row) => (
                    <tr key={row.username}>
                      <td style={styles.td}>#{row.rank}</td>
                      <td style={styles.td}>{row.username}</td>
                      <td style={styles.td}>{row.total_score}</td>
                      <td style={styles.td}>{row.total_stars} ★ · {row.rider_status}</td>
                    </tr>
                  ))}
                  {board.length === 0 && (
                    <tr><td colSpan="4" style={styles.emptyCell}>No leaderboard data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <h3 style={styles.panelTitle}>Fastest clean runs</h3>
            <select value={fastLevel} onChange={(event) => setFastLevel(event.target.value)} style={styles.searchInput}>
              <option value="Chp1Lvl1">Chp1Lvl1</option>
              <option value="Chp1Lvl2">Chp1Lvl2</option>
            </select>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>RANK</th><th style={styles.th}>PLAYER</th><th style={styles.th}>TIME</th><th style={styles.th}>DATE</th></tr></thead>
                <tbody>
                  {fastest.map((row) => (
                    <tr key={row.username + '-' + row.rank}>
                      <td style={styles.td}>#{row.rank}</td>
                      <td style={styles.td}>{row.username}</td>
                      <td style={styles.td}>{Math.floor(row.best_time_seconds / 60)}:{String(Math.round(row.best_time_seconds % 60)).padStart(2, '0')}</td>
                      <td style={styles.td}>{new Date(row.achieved_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'levels' && <LevelsTab styles={styles} />}

        {activeTab === 'logs' && (
          <section style={styles.panel}>
            <PanelHeading
              title="Audit Logs"
              subtitle="Review administrative actions and game updates"
            />

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>DATE</th>
                    <th style={styles.th}>ACTION</th>
                    <th style={styles.th}>DETAILS</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={styles.td}>{log.action}{log.admin?.username ? ' (by ' + log.admin.username + ')' : ''}</td>
                      <td style={styles.td}>
                        {log.target?.username ? log.target.username + ': ' : ''}
                        {log.details?.from
                          ? String(log.details.from) + ' → ' + String(log.details.to)
                          : (log.details?.title || log.details?.level_name || '')}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="3" style={styles.emptyCell}>No audit entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {reportPlayer && (
          <PlayerReportModal
            player={reportPlayer}
            styles={styles}
            onClose={() => setReportPlayer(null)}
          />
        )}

        <footer style={styles.footer}>
          KORRECT ADMIN PANEL · MANAGEMENT SYSTEM
        </footer>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={styles.statCard}>
      <div
        style={{
          ...styles.statIcon,
          color,
          background: `${color}18`,
        }}
      >
        {icon}
      </div>

      <p style={styles.statTitle}>{title}</p>

      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

function PanelHeading({ title, subtitle }) {
  return (
    <div style={styles.panelHeading}>
      <div>
        <h3 style={styles.panelTitle}>{title}</h3>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      <span style={styles.panelDot}>●</span>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={styles.quickAction}
    >
      <span style={styles.quickIcon}>{icon}</span>

      <span style={{ flex: 1, textAlign: 'left' }}>
        <strong style={styles.quickTitle}>
          {title}
        </strong>

        <small style={styles.quickDescription}>
          {description}
        </small>
      </span>

      <span style={styles.quickArrow}>›</span>
    </button>
  );
}

// Keeps the Ban / Delete / View Stats buttons on screen even when the table
// is wider than the window (they used to be hidden off to the right).
const stickyActionsHead = {
  position: 'sticky',
  right: 0,
  background: '#f6f7f9',
  boxShadow: '-8px 0 10px -8px rgba(0, 0, 0, 0.18)',
  zIndex: 2,
};

const stickyActionsCell = {
  position: 'sticky',
  right: 0,
  background: '#ffffff',
  boxShadow: '-8px 0 10px -8px rgba(0, 0, 0, 0.18)',
  zIndex: 1,
};

function mergeStyles(base, overrides) {
  const merged = { ...base };
  Object.keys(overrides).forEach((key) => {
    merged[key] = { ...base[key], ...overrides[key] };
  });
  return merged;
}

const baseStyles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    background: '#f3f5f8',
    color: '#20242b',
    fontFamily: 'Arial, sans-serif',
  },

  sidebar: {
    width: '250px',
    minWidth: '250px',
    minHeight: '100vh',
    background: '#20242b',
    color: '#fff',
    padding: '26px 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 8px 30px',
    borderBottom: '1px solid #373b43',
    marginBottom: '27px',
  },

  logoIcon: {
    display: 'grid',
    placeItems: 'center',
    width: '43px',
    height: '43px',
    background: '#f58220',
    color: '#20242b',
    borderRadius: '11px',
    fontSize: '25px',
    fontWeight: '900',
  },

  logoTitle: {
    display: 'block',
    fontSize: '17px',
    letterSpacing: '1px',
  },

  logoSubtitle: {
    display: 'block',
    color: '#9da3ae',
    fontSize: '10px',
    marginTop: '5px',
    letterSpacing: '0.7px',
  },

  menuTitle: {
    color: '#8c929e',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    paddingLeft: '12px',
    marginBottom: '13px',
  },

  navigation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  menuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 13px',
    border: 'none',
    borderRadius: '9px',
    background: 'transparent',
    color: '#c2c6ce',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer',
  },

  activeMenu: {
    background: '#38312a',
    color: '#ffad45',
    fontWeight: 'bold',
    boxShadow: 'inset 3px 0 #f58220',
  },

  menuIcon: {
    width: '21px',
    fontSize: '19px',
    textAlign: 'center',
  },

  activeDot: {
    marginLeft: 'auto',
    fontSize: '8px',
    color: '#f58220',
  },

  sidebarBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: 'auto',
    borderTop: '1px solid #373b43',
    padding: '20px 5px 0',
    fontSize: '12px',
  },

  adminAvatar: {
    width: '39px',
    height: '39px',
    display: 'grid',
    placeItems: 'center',
    background: '#f58220',
    color: '#20242b',
    borderRadius: '50%',
    fontWeight: 'bold',
  },

  logoutButton: {
    border: 'none',
    background: '#343943',
    color: '#fff',
    borderRadius: '7px',
    padding: '8px 10px',
    cursor: 'pointer',
    fontSize: '17px',
  },

  main: {
    flex: 1,
    minWidth: 0,
    padding: '32px',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
    paddingBottom: '25px',
    borderBottom: '1px solid #e1e5eb',
    marginBottom: '30px',
  },

  breadcrumb: {
    color: '#9299a5',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    margin: '0 0 12px',
  },

  pageTitle: {
    fontSize: '29px',
    margin: 0,
    color: '#20242b',
  },

  subtitle: {
    color: '#89919e',
    fontSize: '13px',
    lineHeight: 1.6,
    margin: '7px 0 0',
  },

  adminBadge: {
    background: '#fff0df',
    color: '#bd6415',
    padding: '10px 14px',
    borderRadius: '7px',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.6px',
    whiteSpace: 'nowrap',
  },

  sectionHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },

  sectionTitle: {
    fontSize: '19px',
    margin: 0,
  },

  sectionTag: {
    fontSize: '10px',
    color: '#818996',
    letterSpacing: '1px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '17px',
    marginBottom: '24px',
  },

  statCard: {
    background: '#fff',
    border: '1px solid #e8ebf0',
    borderRadius: '12px',
    padding: '21px',
    boxShadow: '0 3px 12px #20242b06',
  },

  statIcon: {
    width: '39px',
    height: '39px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
  },

  statTitle: {
    color: '#89919e',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '0.6px',
    margin: '17px 0 0',
  },

  statValue: {
    fontSize: '29px',
    margin: '7px 0 0',
    color: '#20242b',
  },

  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)',
    gap: '20px',
  },

  panel: {
    background: '#fff',
    border: '1px solid #e8ebf0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '22px',
    minWidth: 0,
    boxShadow: '0 3px 12px #20242b06',
  },

  panelHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '22px',
  },

  panelTitle: {
    fontSize: '16px',
    margin: 0,
    color: '#272b33',
  },

  panelDot: {
    color: '#f58220',
    fontSize: '10px',
  },

  emptyChart: {
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px',
    border: '1px dashed #dce1e8',
    borderRadius: '10px',
    color: '#59616e',
    boxSizing: 'border-box',
  },

  chartIcon: {
    fontSize: '35px',
    color: '#f58220',
    marginBottom: '12px',
  },

  quickAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '15px 0',
    border: 'none',
    borderBottom: '1px solid #edf0f4',
    background: '#fff',
    cursor: 'pointer',
  },

  quickIcon: {
    display: 'grid',
    placeItems: 'center',
    width: '38px',
    height: '38px',
    background: '#fff1e2',
    color: '#d8781c',
    borderRadius: '9px',
    fontSize: '19px',
  },

  quickTitle: {
    display: 'block',
    color: '#303640',
    fontSize: '12px',
  },

  quickDescription: {
    display: 'block',
    color: '#9299a5',
    fontSize: '10px',
    marginTop: '5px',
  },

  quickArrow: {
    fontSize: '24px',
    color: '#a0a6b0',
  },

  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '13px 15px',
    border: '1px solid #dfe4eb',
    borderRadius: '8px',
    fontSize: '13px',
    outlineColor: '#f58220',
    marginBottom: '20px',
  },

  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12px',
  },

  th: {
    padding: '14px 12px',
    background: '#f6f7f9',
    color: '#7e8794',
    fontSize: '10px',
    letterSpacing: '0.7px',
    whiteSpace: 'nowrap',
  },

  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #edf0f4',
    color: '#303640',
  },

  statusBadge: {
    display: 'inline-block',
    padding: '5px 9px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  activeStatus: {
    background: '#e5f7ed',
    color: '#16804a',
  },

  suspendedStatus: {
    background: '#ffe5e5',
    color: '#b42323',
  },

  bannedStatus: {
    background: '#2a2323',
    color: '#ff8a8a',
  },

  actionButtonStats: {
    padding: '7px 12px',
    border: 'none',
    borderRadius: '8px',
    background: '#f58220',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  actionButtonBan: {
    padding: '7px 12px',
    borderRadius: '7px',
    border: '1px solid #f5c98a',
    background: '#fff6ea',
    color: '#a85e00',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  actionButtonDelete: {
    padding: '7px 12px',
    borderRadius: '7px',
    border: '1px solid #f3b8b8',
    background: '#fff0f0',
    color: '#b42323',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  gameStatusBadge: {
    display: 'inline-block',
    padding: '5px 9px',
    borderRadius: '999px',
    background: '#eef1f5',
    color: '#737d8c',
    fontSize: '10px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },

  loggedInStatus: {
    background: '#e8f1fd',
    color: '#2f6fc9',
  },

  emptyCell: {
    padding: '35px 15px',
    textAlign: 'center',
    color: '#9299a5',
    lineHeight: 1.7,
  },

  notice: {
    background: '#fff8ed',
    border: '1px solid #ffe0b3',
    borderRadius: '9px',
    padding: '15px',
    color: '#88551e',
    fontSize: '12px',
    lineHeight: 1.7,
    marginTop: '20px',
  },

  footer: {
    marginTop: '30px',
    paddingTop: '18px',
    borderTop: '1px solid #e1e5eb',
    color: '#a0a6b0',
    fontSize: '9px',
    letterSpacing: '1px',
    textAlign: 'right',
  },
};

// Used by the small helper components (StatCard, PanelHeading, ...)
const styles = baseStyles;

const mobileBarStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  background: '#20242b',
  color: '#fff',
  boxSizing: 'border-box',
  width: '100%',
};

const mobileMenuButtonStyle = {
  border: 'none',
  background: '#343943',
  color: '#fff',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '20px',
  cursor: 'pointer',
};

const mobileOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 55,
};