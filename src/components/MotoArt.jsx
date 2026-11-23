// Inline SVG artwork. Everything is drawn with currentColor / CSS variables so it follows the theme.

export function Motorcycle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 800 400" fill="none" aria-hidden="true">
      {/* wheels */}
      <g className="moto-wheel" stroke="currentColor" strokeWidth="6">
        <circle cx="170" cy="285" r="88" />
        <circle cx="170" cy="285" r="62" strokeOpacity=".45" />
        <circle cx="170" cy="285" r="10" fill="currentColor" />
        <path d="M170 197v176M82 285h176M108 223l124 124M232 223L108 347" strokeOpacity=".4" strokeWidth="3" />
      </g>
      <g className="moto-wheel" stroke="currentColor" strokeWidth="6">
        <circle cx="640" cy="285" r="88" />
        <circle cx="640" cy="285" r="62" strokeOpacity=".45" />
        <circle cx="640" cy="285" r="10" fill="currentColor" />
        <path d="M640 197v176M552 285h176M578 223l124 124M702 223L578 347" strokeOpacity=".4" strokeWidth="3" />
      </g>
      {/* body */}
      <g stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M205 222 L300 208 C330 150 425 132 480 160 L528 176 L575 146 L618 178 L572 222 L452 240 L340 272 L240 272 Z" fill="var(--moto-fill, #0b0b0d)" />
        <path d="M205 222 C170 216 138 204 112 184 L148 232 Z" fill="var(--moto-fill, #0b0b0d)" />
        <path d="M575 146 L640 285" />
        <path d="M545 150 L505 128 L480 128" />
        <path d="M170 285 L330 268" />
        <path d="M300 208 C340 196 400 190 450 196" strokeOpacity=".5" />
        <path d="M455 200 L520 196" strokeOpacity=".5" />
      </g>
      <path d="M330 255 h70 l-12 28 h-52z" fill="currentColor" fillOpacity=".25" />
    </svg>
  );
}

export function Tachometer({ className = '' }) {
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const a = (-210 + i * 12) * (Math.PI / 180);
    const big = i % 5 === 0;
    const r1 = big ? 112 : 120;
    return { x1: 150 + Math.cos(a) * r1, y1: 150 + Math.sin(a) * r1, x2: 150 + Math.cos(a) * 132, y2: 150 + Math.sin(a) * 132, big, i };
  });
  const needle = (-210 + 14 * 12) * (Math.PI / 180);
  return (
    <svg className={className} viewBox="0 0 300 300" fill="none" aria-hidden="true">
      <circle cx="150" cy="150" r="142" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <circle cx="150" cy="150" r="100" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" />
      {ticks.map((t) => (
        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth={t.big ? 4 : 2} strokeOpacity={t.i > 16 ? 1 : 0.6} strokeLinecap="round" className={t.i > 16 ? 'tach-red' : ''} />
      ))}
      <line x1="150" y1="150" x2={150 + Math.cos(needle) * 105} y2={150 + Math.sin(needle) * 105} stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="tach-needle" />
      <circle cx="150" cy="150" r="14" fill="currentColor" />
      <circle cx="150" cy="150" r="5" fill="var(--k0, #050506)" />
    </svg>
  );
}

export function RoadLines({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 300 L520 20 H680 L1200 300 Z" fill="url(#roadfade)" />
      <path d="M0 300 L520 20" stroke="currentColor" strokeOpacity=".5" strokeWidth="2" />
      <path d="M1200 300 L680 20" stroke="currentColor" strokeOpacity=".5" strokeWidth="2" />
      <path className="road-dash" d="M600 20 V300" stroke="currentColor" strokeWidth="5" strokeDasharray="22 26" />
      <defs>
        <linearGradient id="roadfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".14" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Small illustrated motif used on the news cards, one per article type.
export function NewsMotif({ type }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const motifs = {
    download: (
      <g {...common}>
        <path d="M150 70v110M105 140l45 45 45-45" />
        <path d="M80 215h140" />
      </g>
    ),
    rank: (
      <g {...common}>
        <path d="M150 55l25 52 57 8-41 40 10 57-51-27-51 27 10-57-41-40 57-8z" />
      </g>
    ),
    warning: (
      <g {...common}>
        <path d="M150 62L240 218H60z" />
        <path d="M150 112v50" />
        <circle cx="150" cy="190" r="3" fill="currentColor" />
      </g>
    ),
    weather: (
      <g {...common}>
        <path d="M95 175a38 38 0 0 1 8-75 52 52 0 0 1 99 14 32 32 0 0 1-4 61z" />
        <path d="M110 205l-8 20M150 205l-8 20M190 205l-8 20" />
      </g>
    ),
    city: (
      <g {...common}>
        <path d="M60 225V120h50v105M110 225V80h60v145M170 225V135h70v90M45 225h210" />
        <path d="M128 105h24M128 135h24M128 165h24" strokeOpacity=".6" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 300 280" aria-hidden="true" className="news-motif">
      {motifs[type] || motifs.city}
    </svg>
  );
}

const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Icon = {
  Logout: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Menu: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  Close: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Arrow: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Back: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  User: (p) => (
    <svg {...iconProps} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  Check: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  Alert: (p) => (
    <svg {...iconProps} {...p}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18h.01" />
    </svg>
  ),
  Block: (p) => (
    <svg {...iconProps} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  ),
};
