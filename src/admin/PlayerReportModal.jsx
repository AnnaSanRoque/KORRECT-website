// KORRECT admin website - one player's performance report.
// Shows the player's violations, finished levels and run history, and lets the admin
// download the same report as a PDF. It only READS from the database
// (rpc admin_player_report), nothing in Supabase is changed.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildPlayerReportPdf } from '../lib/pdfReport';

const fmtTime = (s) => (s == null || s < 0 ? '—' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
const stars = (n) => '★'.repeat(n || 0) || '—';

export default function PlayerReportModal({ player, onClose, styles }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_player_report', { p_user_id: player.id });
      if (error) setError(error.message);
      else setReport(data);
    })();
  }, [player.id]);

  // Optional extras for the PDF header (name, birthday). Ignored if not readable.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, birthday')
        .eq('id', player.id)
        .maybeSingle();
      if (data) setDetails(data);
    })();
  }, [player.id]);

  const violations = report?.violations || [];
  const progress = report?.progress || [];
  const attempts = report?.attempts || [];

  const violationCounts = {};
  violations.forEach((v) => {
    violationCounts[v.violation_type] = (violationCounts[v.violation_type] || 0) + 1;
  });

  const completed = progress.filter((p) => p.completed).length;
  const highest = attempts.reduce((best, a) => Math.max(best, Number(a.score) || 0), 0);

  function handleDownload() {
    setPdfError('');
    try {
      const blob = buildPlayerReportPdf({ ...player, ...details }, report);
      const url = URL.createObjectURL(blob);
      const safeName = String(player.username || player.email || 'player').replace(/[^a-z0-9_-]+/gi, '_');
      const link = document.createElement('a');
      link.href = url;
      link.download = `KORRECT-report-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('PDF error:', err);
      setPdfError('Could not create the PDF. Please try again.');
    }
  }

  const tile = (label, value) => (
    <div style={{ flex: '1 1 140px', padding: '14px 16px', borderRadius: 10, background: '#f6f7f9', borderLeft: '4px solid #f58220' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#20242b' }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: '0.7px', color: '#7e8794', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ ...styles.panel, width: 'min(960px, 94vw)', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.panelHeading}>
          <div>
            <h3 style={styles.panelTitle}>Player stats: {player.username || player.email}</h3>
            <p style={styles.subtitle}>
              Rider status: <b>{player.rider_status || 'Learner'}</b> · Stars: {player.total_stars || 0} · Score: {player.total_score || 0} ·
              Playtime: {Math.round((player.total_playtime_seconds || 0) / 60)} min · Joined {fmtDate(player.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDownload} disabled={!report} style={{ ...styles.actionButtonStats, opacity: report ? 1 : 0.5 }}>
              Download PDF
            </button>
            <button type="button" onClick={onClose} style={styles.actionButtonBan}>Close</button>
          </div>
        </div>

        {pdfError && <p style={{ ...styles.subtitle, color: '#b42323' }}>{pdfError}</p>}
        {error && <p style={{ ...styles.subtitle, color: '#b42323' }}>{error}</p>}
        {!report && !error && <p style={styles.subtitle}>Loading…</p>}

        {report && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {tile('LEVELS COMPLETED', completed)}
              {tile('VIOLATIONS COMMITTED', violations.length)}
              {tile('HIGHEST SCORE', highest)}
              {tile('RUNS PLAYED', attempts.length)}
            </div>

            <h4 style={styles.panelTitle}>Violations committed</h4>
            <p style={styles.subtitle}>
              {Object.keys(violationCounts).length === 0
                ? 'None recorded.'
                : Object.entries(violationCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ×${n}`).join(' · ')}
            </p>

            <h4 style={{ ...styles.panelTitle, marginTop: 24 }}>Levels progress</h4>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['LEVEL', 'COMPLETED', 'BEST STARS', 'BEST SCORE', 'BEST CLEAN TIME', 'TRIES', 'FINISHED', 'FAILED', 'LAST PLAYED']
                  .map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {progress.map((p) => (
                    <tr key={p.level_name}>
                      <td style={styles.td}>{p.level_name}</td>
                      <td style={styles.td}>{p.completed ? '✓' : '—'}</td>
                      <td style={styles.td}>{stars(p.best_stars)}</td>
                      <td style={styles.td}>{p.best_score}</td>
                      <td style={styles.td}>{fmtTime(p.best_time_seconds)}</td>
                      <td style={styles.td}>{p.attempts}</td>
                      <td style={styles.td}>{p.finishes}</td>
                      <td style={styles.td}>{p.fails}</td>
                      <td style={styles.td}>{fmtDate(p.last_played_at)}</td>
                    </tr>
                  ))}
                  {progress.length === 0 && <tr><td colSpan="9" style={styles.emptyCell}>No levels played yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <h4 style={{ ...styles.panelTitle, marginTop: 24 }}>Runs (newest first)</h4>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['DATE', 'LEVEL', 'RESULT', 'TIME', 'POINTS', 'STARS', 'SCORE', 'SAFETY']
                  .map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td style={styles.td}>{fmtDate(a.ended_at)}</td>
                      <td style={styles.td}>{a.level_name}</td>
                      <td style={styles.td}>{a.result}</td>
                      <td style={styles.td}>{fmtTime(a.duration_seconds)}</td>
                      <td style={styles.td}>{a.points_left} / {a.starting_points}</td>
                      <td style={styles.td}>{stars(a.stars)}</td>
                      <td style={styles.td}>{a.score}</td>
                      <td style={styles.td}>{a.safety_rating} ({a.safety_percent}%)</td>
                    </tr>
                  ))}
                  {attempts.length === 0 && <tr><td colSpan="8" style={styles.emptyCell}>No runs recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
