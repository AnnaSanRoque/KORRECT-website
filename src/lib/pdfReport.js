// Dependency-free PDF writer used for the admin "Player Progress Report".
// It only uses the built-in Helvetica fonts, so nothing extra has to be installed.

const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

const PAGE_W = 595.28;
const PAGE_H = 841.89;

// Keep only characters the standard PDF fonts can draw.
function clean(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

export function textWidth(str, size, bold = false) {
  const table = bold ? W_BOLD : W_REG;
  let total = 0;
  for (const ch of clean(str)) {
    const code = ch.charCodeAt(0);
    total += (code >= 32 && code <= 126 ? table[code - 32] : 556);
  }
  return (total * size) / 1000;
}

function fit(str, size, bold, maxWidth) {
  let text = clean(str);
  if (textWidth(text, size, bold) <= maxWidth) return text;
  while (text.length > 1 && textWidth(text + '...', size, bold) > maxWidth) {
    text = text.slice(0, -1);
  }
  return text + '...';
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(' ');
};

export class SimplePdf {
  constructor() {
    this.pages = [];
    this.margin = 40;
    this.addPage();
  }

  addPage() {
    this.pages.push([]);
    this.y = this.margin;
    return this.pages.length;
  }

  get ops() {
    return this.pages[this.pages.length - 1];
  }

  rect(x, y, w, h, color) {
    this.ops.push(`${hex(color)} rg ${x.toFixed(2)} ${(PAGE_H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  line(x1, y1, x2, y2, color = '#cccccc', width = 0.5) {
    this.ops.push(`${hex(color)} RG ${width} w ${x1.toFixed(2)} ${(PAGE_H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_H - y2).toFixed(2)} l S`);
  }

  // y is the TOP of the text line.
  text(x, y, str, { size = 10, bold = false, color = '#111111', maxWidth, align = 'left' } = {}, pageIndex) {
    let out = maxWidth ? fit(str, size, bold, maxWidth) : clean(str);
    let px = x;
    if (align === 'right' && maxWidth) px = x + maxWidth - textWidth(out, size, bold);
    if (align === 'center' && maxWidth) px = x + (maxWidth - textWidth(out, size, bold)) / 2;
    const baseline = PAGE_H - y - size * 0.8;
    const target = pageIndex != null ? this.pages[pageIndex] : this.ops;
    target.push(
      `BT ${hex(color)} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${px.toFixed(2)} ${baseline.toFixed(2)} Td (${esc(out)}) Tj ET`
    );
  }

  ensure(height) {
    if (this.y + height > PAGE_H - 60) {
      this.addPage();
      return true;
    }
    return false;
  }

  // Draws a table with automatic page breaks. columns: [{ label, width, align }]
  table(columns, rows, { rowHeight = 18, fontSize = 8.5, emptyText = 'No records.' } = {}) {
    const usable = PAGE_W - this.margin * 2;
    const total = columns.reduce((s, c) => s + c.width, 0);
    const cols = columns.map((c) => ({ ...c, w: (c.width / total) * usable }));

    const drawHeader = () => {
      this.rect(this.margin, this.y, usable, rowHeight, '#111111');
      let x = this.margin;
      cols.forEach((c) => {
        this.text(x + 5, this.y + 5, c.label, { size: 7.5, bold: true, color: '#f58220', maxWidth: c.w - 10, align: c.align });
        x += c.w;
      });
      this.y += rowHeight;
    };

    this.ensure(rowHeight * 2);
    drawHeader();

    if (!rows.length) {
      this.rect(this.margin, this.y, usable, rowHeight, '#f6f6f6');
      this.text(this.margin + 5, this.y + 5, emptyText, { size: fontSize, color: '#777777' });
      this.y += rowHeight;
      return;
    }

    rows.forEach((row, index) => {
      if (this.ensure(rowHeight)) drawHeader();
      if (index % 2 === 0) this.rect(this.margin, this.y, usable, rowHeight, '#f6f6f6');
      let x = this.margin;
      cols.forEach((c, i) => {
        this.text(x + 5, this.y + 5, row[i], { size: fontSize, maxWidth: c.w - 10, align: c.align });
        x += c.w;
      });
      this.y += rowHeight;
    });
    this.line(this.margin, this.y, PAGE_W - this.margin, this.y, '#dddddd');
  }

  toBlob() {
    const count = this.pages.length;
    // Footers need the final page count.
    this.pages.forEach((_, i) => {
      this.line(this.margin, PAGE_H - 40, PAGE_W - this.margin, PAGE_H - 40, '#dddddd');
      const target = this.pages[i];
      const w = PAGE_W - this.margin * 2;
      const baseline = PAGE_H - (PAGE_H - 30) - 7 * 0.8;
      const left = clean('KORRECT - Player Progress Report');
      const right = `Page ${i + 1} of ${count}`;
      target.push(`BT ${hex('#777777')} rg /F1 7 Tf ${this.margin} ${baseline.toFixed(2)} Td (${esc(left)}) Tj ET`);
      target.push(
        `BT ${hex('#777777')} rg /F1 7 Tf ${(this.margin + w - textWidth(right, 7)).toFixed(2)} ${baseline.toFixed(2)} Td (${esc(right)}) Tj ET`
      );
    });

    const objects = [];
    const pageObjIds = [];
    // 1 catalog, 2 pages, 3 F1, 4 F2, then pairs of page/content
    let next = 5;
    const contents = this.pages.map((ops) => ops.join('\n'));
    contents.forEach(() => {
      pageObjIds.push(next);
      next += 2;
    });

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${count} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    contents.forEach((stream, i) => {
      const pid = pageObjIds[i];
      objects[pid] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pid + 1} 0 R >>`;
      objects[pid + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) {
      pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 255;
    return new Blob([bytes], { type: 'application/pdf' });
  }
}

const fmtTime = (s) => (s == null || s < 0 ? '-' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

export function buildPlayerReportPdf(player, report) {
  const pdf = new SimplePdf();
  const m = pdf.margin;
  const usable = PAGE_W - m * 2;

  // Header band
  pdf.rect(0, 0, PAGE_W, 96, '#0a0a0b');
  pdf.rect(0, 96, PAGE_W, 4, '#f58220');
  pdf.text(m, 26, 'KORRECT', { size: 26, bold: true, color: '#f58220' });
  pdf.text(m, 58, 'PLAYER PROGRESS REPORT', { size: 11, bold: true, color: '#ffffff' });
  pdf.text(m, 74, `Generated ${new Date().toLocaleString()}`, { size: 8, color: '#9a9ca3' });
  pdf.y = 122;

  const name = [player.first_name, player.last_name].filter(Boolean).join(' ');
  pdf.text(m, pdf.y, player.username || player.email || 'Player', { size: 18, bold: true });
  pdf.y += 24;
  const meta = [
    ['Email', player.email || '-'],
    ['Full name', name || '-'],
    ['Account status', player.status || 'active'],
    ['Rider status', player.rider_status || 'Learner'],
    ['Joined', fmtDate(player.created_at)],
    ['Last login', fmtDate(player.last_sign_in_at)],
  ];
  meta.forEach(([k, v], i) => {
    const col = i % 2;
    const x = m + col * (usable / 2);
    pdf.text(x, pdf.y, k.toUpperCase(), { size: 6.5, bold: true, color: '#888888' });
    pdf.text(x, pdf.y + 9, v, { size: 9.5, maxWidth: usable / 2 - 10 });
    if (col === 1 || i === meta.length - 1) pdf.y += 28;
  });

  // Summary tiles
  const attempts = report.attempts || [];
  const progress = report.progress || [];
  const violations = report.violations || [];
  const completed = progress.filter((p) => p.completed).length;
  const highest = attempts.reduce((best, a) => Math.max(best, Number(a.score) || 0), 0);
  const tiles = [
    ['LEVELS COMPLETED', completed],
    ['VIOLATIONS', violations.length],
    ['HIGHEST SCORE', highest],
    ['TOTAL STARS', player.total_stars || 0],
    ['TOTAL SCORE', player.total_score || 0],
    ['PLAYTIME (MIN)', Math.round((player.total_playtime_seconds || 0) / 60)],
  ];
  const tileW = (usable - 5 * 8) / 6;
  tiles.forEach(([label, value], i) => {
    const x = m + i * (tileW + 8);
    pdf.rect(x, pdf.y, tileW, 46, '#f6f6f6');
    pdf.rect(x, pdf.y, 3, 46, '#f58220');
    pdf.text(x + 10, pdf.y + 8, String(value), { size: 15, bold: true, maxWidth: tileW - 14 });
    pdf.text(x + 10, pdf.y + 30, label, { size: 5.8, bold: true, color: '#777777', maxWidth: tileW - 14 });
  });
  pdf.y += 64;

  const heading = (title) => {
    pdf.ensure(60);
    pdf.text(m, pdf.y, title.toUpperCase(), { size: 11, bold: true });
    pdf.rect(m, pdf.y + 15, 28, 2.5, '#f58220');
    pdf.y += 26;
  };

  heading('Progress per level');
  pdf.table(
    [
      { label: 'LEVEL', width: 14 },
      { label: 'DONE', width: 8 },
      { label: 'STARS', width: 8, align: 'right' },
      { label: 'BEST SCORE', width: 12, align: 'right' },
      { label: 'BEST TIME', width: 11, align: 'right' },
      { label: 'TRIES', width: 8, align: 'right' },
      { label: 'FINISHED', width: 10, align: 'right' },
      { label: 'FAILED', width: 8, align: 'right' },
      { label: 'LAST PLAYED', width: 21 },
    ],
    progress.map((p) => [
      p.level_name,
      p.completed ? 'Yes' : 'No',
      p.best_stars || 0,
      p.best_score ?? 0,
      fmtTime(p.best_time_seconds),
      p.attempts ?? 0,
      p.finishes ?? 0,
      p.fails ?? 0,
      fmtDate(p.last_played_at),
    ]),
    { emptyText: 'No levels played yet.' }
  );
  pdf.y += 22;

  heading('Violations committed');
  const tally = {};
  violations.forEach((v) => {
    tally[v.violation_type] = (tally[v.violation_type] || 0) + 1;
  });
  pdf.table(
    [
      { label: 'VIOLATION', width: 80 },
      { label: 'TIMES', width: 20, align: 'right' },
    ],
    Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, n]),
    { emptyText: 'No violations recorded.' }
  );
  pdf.y += 22;

  heading('Run history (newest first)');
  pdf.table(
    [
      { label: 'DATE', width: 22 },
      { label: 'LEVEL', width: 14 },
      { label: 'RESULT', width: 10 },
      { label: 'TIME', width: 8, align: 'right' },
      { label: 'POINTS', width: 12, align: 'right' },
      { label: 'STARS', width: 7, align: 'right' },
      { label: 'SCORE', width: 9, align: 'right' },
      { label: 'SAFETY', width: 18 },
    ],
    attempts.map((a) => [
      fmtDate(a.ended_at),
      a.level_name,
      a.result,
      fmtTime(a.duration_seconds),
      `${a.points_left ?? 0} / ${a.starting_points ?? 0}`,
      a.stars || 0,
      a.score ?? 0,
      `${a.safety_rating ?? '-'} (${a.safety_percent ?? 0}%)`,
    ]),
    { emptyText: 'No runs recorded.' }
  );

  return pdf.toBlob();
}
