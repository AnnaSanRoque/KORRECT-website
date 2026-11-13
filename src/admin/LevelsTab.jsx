// KORRECT admin website - "Levels & Lessons" tab (diagram 9: Admin Content Management)
// Copy to: src/admin/LevelsTab.jsx   (see Database/ADMIN_WEBSITE_GUIDE.md, step 5)
//
// Upload / edit lesson & scenario data -> validate & store -> validate content via fetchLTOLevel().
// "Scenario data" = each level's settings the game reads at the start of the level (title, published, ranking,
// starting points, 3-star rule, score multiplier). "Lessons" = the briefing cards shown before the level.
// New level SCENES are still made in Unity; a new level only needs a row here with the same Level Id.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

export default function LevelsTab({ styles }) {
  const [levels, setLevels] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [issues, setIssues] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadLevels(selectName) {
    const { data, error } = await supabase.from('levels').select('*').order('sort_order');
    if (error) return setMessage(error.message);
    setLevels(data || []);
    const keep = selectName || selected || data?.[0]?.level_name || null;
    setSelected(keep);
  }

  async function loadLessons(levelName) {
    const { data, error } = await supabase
      .from('lessons').select('*').eq('level_name', levelName).order('page_order');
    if (error) return setMessage(error.message);
    setLessons(data || []);
    setDeletedIds([]);
    setIssues([]);
  }

  useEffect(() => { loadLevels(); }, []);
  useEffect(() => { if (selected) loadLessons(selected); }, [selected]);

  const level = levels.find((l) => l.level_name === selected);

  function editLevel(field, value) {
    setLevels((prev) => prev.map((l) => (l.level_name === selected ? { ...l, [field]: value } : l)));
  }

  function editLesson(index, field, value) {
    setLessons((prev) => prev.map((ls, i) => (i === index ? { ...ls, [field]: value } : ls)));
  }

  function moveLesson(index, dir) {
    setLessons((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  function removeLesson(index) {
    const ls = lessons[index];
    if (!window.confirm(`Remove the card "${ls.title || 'untitled'}"?`)) return;
    if (ls.id) setDeletedIds((prev) => [...prev, ls.id]);
    setLessons((prev) => prev.filter((_, i) => i !== index));
  }

  function addLesson() {
    setLessons((prev) => [...prev, { title: '', description: '', image_url: '' }]);
  }

  async function addLevel() {
    const levelName = window.prompt('Level Id, exactly as in Unity (LevelFlow â†’ Level Id), e.g. Chp1Lvl3:');
    if (!levelName) return;
    const title = window.prompt('Title shown to players, e.g. "Intersections":') || levelName;
    const { error } = await supabase.from('levels').insert({
      level_name: levelName.trim(), title, chapter: 1, sort_order: levels.length, is_published: false,
    });
    if (error) return setMessage(error.message);
    setMessage(`Level ${levelName} added (unpublished). Add its briefing cards, then publish it.`);
    loadLevels(levelName.trim());
  }

  // "Validate content via fetchLTOLevel()" - the same function the game calls when the level starts.
  async function validate(levelName) {
    const { data, error } = await supabase.rpc('fetch_lto_level', { p_level_name: levelName });
    if (error) { setIssues([error.message]); return false; }
    setIssues(data?.issues || []);
    return !!data?.ok;
  }

  async function save() {
    if (!level) return;
    setBusy(true);
    setMessage('');
    try {
      const { error: levelError } = await supabase.from('levels').update({
        title: level.title,
        chapter: Number(level.chapter) || 0,
        sort_order: Number(level.sort_order) || 0,
        is_published: !!level.is_published,
        counts_for_ranking: !!level.counts_for_ranking,
        starting_points: emptyToNull(level.starting_points),
        three_star_max_penalty: emptyToNull(level.three_star_max_penalty),
        score_multiplier: Number(level.score_multiplier) || 1,
      }).eq('level_name', level.level_name);
      if (levelError) throw levelError;

      for (const id of deletedIds) {
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error) throw error;
      }

      for (const [i, ls] of lessons.entries()) {
        const row = {
          level_name: level.level_name, page_order: i,
          title: ls.title?.trim() || '', description: ls.description?.trim() || '', image_url: emptyToNull(ls.image_url?.trim()),
        };
        const { error } = ls.id
          ? await supabase.from('lessons').update(row).eq('id', ls.id)
          : await supabase.from('lessons').insert(row);
        if (error) throw error;
      }

      const ok = await validate(level.level_name);
      setMessage(ok ? 'Saved and validated âœ“ Players get these changes the next time they start this level.'
                    : 'Saved, but the content has problems (see below).');
      await loadLessons(level.level_name);
    } catch (error) {
      setMessage(error.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  const field = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: '#7e8794', fontWeight: 'bold' };
  const input = { ...styles.searchInput, marginBottom: 0, padding: '9px 11px' };

  return (
    <section style={styles.panel}>
      <div style={styles.panelHeading}>
        <div>
          <h3 style={styles.panelTitle}>Levels &amp; Lessons</h3>
          <p style={styles.subtitle}>Edit each level's settings and briefing cards. The game loads them when a level starts.</p>
        </div>
        <button type="button" onClick={addLevel} style={styles.actionButtonBan}>+ Add level</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {levels.map((l) => (
          <button key={l.level_name} type="button" onClick={() => setSelected(l.level_name)}
            style={{ ...styles.actionButtonBan, ...(l.level_name === selected ? { background: '#f58220', color: '#fff' } : {}) }}>
            {l.title} {l.is_published ? '' : '(hidden)'}
          </button>
        ))}
      </div>

      {message && <p style={{ ...styles.subtitle, color: message.includes('âœ“') ? '#16804a' : '#b42323' }}>{message}</p>}

      {level && (
        <>
          <h4 style={styles.panelTitle}>Scenario settings: {level.level_name}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '12px 0 24px' }}>
            <label style={field}>TITLE<input style={input} value={level.title || ''} onChange={(e) => editLevel('title', e.target.value)} /></label>
            <label style={field}>CHAPTER<input style={input} type="number" value={level.chapter ?? ''} onChange={(e) => editLevel('chapter', e.target.value)} /></label>
            <label style={field}>ORDER<input style={input} type="number" value={level.sort_order ?? ''} onChange={(e) => editLevel('sort_order', e.target.value)} /></label>
            <label style={field}>STARTING POINTS (empty = Unity value)<input style={input} type="number" min="1" value={level.starting_points ?? ''} onChange={(e) => editLevel('starting_points', e.target.value === '' ? '' : Number(e.target.value))} /></label>
            <label style={field}>3-STAR MAX PENALTY (empty = Unity value)<input style={input} type="number" min="0" value={level.three_star_max_penalty ?? ''} onChange={(e) => editLevel('three_star_max_penalty', e.target.value === '' ? '' : Number(e.target.value))} /></label>
            <label style={field}>SCORE MULTIPLIER<input style={input} type="number" step="0.1" min="0.1" value={level.score_multiplier ?? 1} onChange={(e) => editLevel('score_multiplier', e.target.value)} /></label>
            <label style={{ ...field, flexDirection: 'row', alignItems: 'center' }}>
              <input type="checkbox" checked={!!level.is_published} onChange={(e) => editLevel('is_published', e.target.checked)} /> PUBLISHED
            </label>
            <label style={{ ...field, flexDirection: 'row', alignItems: 'center' }}>
              <input type="checkbox" checked={!!level.counts_for_ranking} onChange={(e) => editLevel('counts_for_ranking', e.target.checked)} /> COUNTS FOR LEADERBOARDS
            </label>
          </div>

          <h4 style={styles.panelTitle}>Lesson cards (briefing)</h4>
          {lessons.length === 0 && <p style={styles.subtitle}>No cards yet: the game uses its built-in briefing for this level.</p>}
          {lessons.map((ls, i) => (
            <div key={ls.id || `new-${i}`} style={{ border: '1px solid #e8ebf0', borderRadius: 10, padding: 14, margin: '12px 0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 12 }}>Card {i + 1}</strong>
                <span style={{ marginLeft: 'auto' }} />
                <button type="button" onClick={() => moveLesson(i, -1)} style={styles.actionButtonBan}>â†‘</button>
                <button type="button" onClick={() => moveLesson(i, 1)} style={styles.actionButtonBan}>â†“</button>
                <button type="button" onClick={() => removeLesson(i)} style={styles.actionButtonDelete}>Remove</button>
              </div>
              <input style={{ ...input, width: '100%', marginBottom: 8 }} placeholder="Title" value={ls.title || ''} onChange={(e) => editLesson(i, 'title', e.target.value)} />
              <textarea style={{ ...input, width: '100%', minHeight: 70, marginBottom: 8 }} placeholder="Text shown on the card" value={ls.description || ''} onChange={(e) => editLesson(i, 'description', e.target.value)} />
              <input style={{ ...input, width: '100%' }} placeholder="Picture URL (optional, empty = keep the game's picture)" value={ls.image_url || ''} onChange={(e) => editLesson(i, 'image_url', e.target.value)} />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={addLesson} style={styles.actionButtonBan}>+ Add card</button>
            <button type="button" disabled={busy} onClick={save} style={{ ...styles.actionButtonBan, background: '#f58220', color: '#fff' }}>
              {busy ? 'Savingâ€¦' : 'Save & validate'}
            </button>
          </div>

          {issues.length > 0 && (
            <div style={styles.notice}>
              <strong>Validation (fetchLTOLevel):</strong>
              <ul>{issues.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}


