// KORRECT admin website - one player's performance report (diagrams 6 + 8: "View all user performance reports",
// "Log in & select user profile -> Display user data").
// Copy to: src/admin/PlayerReportModal.jsx   (see Database/ADMIN_WEBSITE_GUIDE.md, step 2)
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const fmtTime = (s) => (s == null || s < 0 ? 'â€”' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : 'â€”');

export default function PlayerReportModal({ player, onClose, styles }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_player_report', { p_user_id: player.id });
      if (error) setError(error.message);
      else setReport(data);
    })();
  }, [player.id]);

  const violationCounts = {};
  (report?.violations || []).forEach((v) => {
    violationCounts[v.violation_type] = (violationCounts[v.violation_type] || 0) + 1;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ ...styles.panel, width: 'min(960px, 94vw)', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panelHeading}>
          <div>
            <h3 style={styles.panelTitle}>Performance report: {player.username || player.email}</h3>
            <p style={styles.subtitle}>
              Rider status: <b>{player.rider_status}</b> Â· Stars: {player.total_stars} Â· Score: {player.total_score} Â·
              Playtime: {Math.round((player.total_playtime_seconds || 0) / 60)} min Â· Joined {fmtDate(player.created_at)}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.actionButtonBan}>Close</button>
        </div>

        {error && <p style={{ ...styles.subtitle, color: '#b42323' }}>{error}</p>}
        {!report && !error && <p style={styles.subtitle}>Loadingâ€¦</p>}

        {report && (
          <>
            <h4 style={styles.panelTitle}>Progress per level</h4>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['LEVEL', 'COMPLETED', 'BEST STARS', 'BEST SCORE', 'BEST CLEAN TIME', 'TRIES', 'FINISHED', 'FAILED', 'LAST PLAYED']
                  .map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(report.progress || []).map((p) => (
                    <tr key={p.level_name}>
                      <td style={styles.td}>{p.level_name}</td>
                      <td style={styles.td}>{p.completed ? 'âœ“' : 'â€”'}</td>
                      <td style={styles.td}>{'â˜…'.repeat(p.best_stars || 0) || 'â€”'}</td>
                      <td style={styles.td}>{p.best_score}</td>
                      <td style={styles.td}>{fmtTime(p.best_time_seconds)}</td>
                      <td style={styles.td}>{p.attempts}</td>
                      <td style={styles.td}>{p.finishes}</td>
                      <td style={styles.td}>{p.fails}</td>
                      <td style={styles.td}>{fmtDate(p.last_played_at)}</td>
                    </tr>
                  ))}
                  {(report.progress || []).length === 0 && <tr><td colSpan="9" style={styles.emptyCell}>No levels played yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <h4 style={{ ...styles.panelTitle, marginTop: 24 }}>Violations committed</h4>
            <p style={styles.subtitle}>
              {Object.keys(violationCounts).length === 0
                ? 'None recorded.'
                : Object.entries(violationCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} Ã—${n}`).join(' Â· ')}
            </p>

            <h4 style={{ ...styles.panelTitle, marginTop: 24 }}>Runs (newest first)</h4>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['DATE', 'LEVEL', 'RESULT', 'TIME', 'POINTS', 'STARS', 'SCORE', 'SAFETY']
                  .map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(report.attempts || []).map((a) => (
                    <tr key={a.id}>
                      <td style={styles.td}>{fmtDate(a.ended_at)}</td>
                      <td style={styles.td}>{a.level_name}</td>
                      <td style={styles.td}>{a.result}</td>
                      <td style={styles.td}>{fmtTime(a.duration_seconds)}</td>
                      <td style={styles.td}>{a.points_left} / {a.starting_points}</td>
                      <td style={styles.td}>{'â˜…'.repeat(a.stars || 0) || 'â€”'}</td>
                      <td style={styles.td}>{a.score}</td>
                      <td style={styles.td}>{a.safety_rating} ({a.safety_percent}%)</td>
                    </tr>
                  ))}
                  {(report.attempts || []).length === 0 && <tr><td colSpan="8" style={styles.emptyCell}>No runs recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


