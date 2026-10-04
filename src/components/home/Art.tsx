/**
 * Decorative illustrations for the landing page capability cards.
 *
 * Every shape here is a concept, not data: rings with no values, a signal line
 * that goes flat where there is no record, a skyline with one anchored pin, and
 * three labelled bars. All are aria-hidden and animate only under
 * prefers-reduced-motion: no-preference (see globals.css).
 */
import { Tr } from '@/lib/i18n';


export function RadarArt() {
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="art-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff3333" stopOpacity="0" />
          <stop offset="1" stopColor="#ff3333" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {[40, 80, 120].map((r) => (
        <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" />
      ))}
      <circle cx="150" cy="150" r="144" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeDasharray="2 7" />
      <path d="M150 6 V294 M6 150 H294" stroke="rgb(255 255 255 / 0.08)" />
      <g fontSize="9" fill="#8f8f8a" letterSpacing="1.5">
        <text x="150" y="20" textAnchor="middle"><Tr s="PAY" /></text>
        <text x="284" y="153" textAnchor="end">BIZ</text>
        <text x="150" y="292" textAnchor="middle">FIN</text>
        <text x="16" y="153">TXN</text>
      </g>
      <g className="frl-sweep">
        <path d="M150 150 L150 8 A142 142 0 0 1 250 49 Z" fill="url(#art-sweep)" />
        <path d="M150 150 L150 8" stroke="#ff5a4d" strokeWidth="1.5" />
      </g>
      <circle className="frl-ping-a" cx="150" cy="150" r="5" fill="none" stroke="#ff5a4d" />
      <circle className="frl-ping-b" cx="150" cy="150" r="5" fill="none" stroke="#ff5a4d" />
      <circle cx="150" cy="150" r="5" fill="#ff3333" />
    </svg>
  );
}

export function SignalArt() {
  return (
    <svg viewBox="0 0 400 130" aria-hidden="true" className="h-full w-full">
      <path d="M0 65 H400" stroke="rgb(255 255 255 / 0.06)" />
      <path
        className="frl-wave"
        d="M0 70 H34 L48 34 L64 100 L84 22 L106 86 L124 52 L142 70 H196"
        fill="none"
        stroke="#ff5a4d"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M204 70 H396" stroke="rgb(255 255 255 / 0.28)" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx="200" cy="70" r="4" fill="#0c0c0c" stroke="#ff5a4d" strokeWidth="2" />
      <text x="300" y="58" textAnchor="middle" fontSize="10" fill="#8f8f8a" letterSpacing="1.6">
        <Tr s="NO RECORD · NO SIGNAL" />
      </text>
    </svg>
  );
}

const TOWERS = [
  { x: 6, w: 28, h: 46 },
  { x: 38, w: 22, h: 64 },
  { x: 64, w: 34, h: 38 },
  { x: 102, w: 26, h: 78 },
  { x: 132, w: 30, h: 52 },
  { x: 166, w: 22, h: 40 },
  { x: 192, w: 36, h: 62 },
];

export function SkylineArt() {
  return (
    <svg viewBox="0 0 240 120" aria-hidden="true" className="h-full w-full">
      <path d="M0 108 H240" stroke="rgb(255 255 255 / 0.18)" />
      {TOWERS.map((t, i) => (
        <g key={i}>
          <rect x={t.x} y={108 - t.h} width={t.w} height={t.h} fill="#161616" stroke="rgb(255 255 255 / 0.1)" />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => (
              <rect
                key={`${r}-${c}`}
                className="frl-twinkle"
                style={{ animationDelay: `${((i * 5 + r * 3 + c * 7) % 11) * 0.37}s` }}
                x={t.x + 5 + c * (t.w / 2 - 2)}
                y={108 - t.h + 8 + r * 12}
                width="4"
                height="5"
                fill="#ffb347"
              />
            )),
          )}
        </g>
      ))}
      {/* the entity this profile is anchored to */}
      <g className="frl-drop">
        <path d="M115 18 C106 18 100 25 100 33 C100 44 115 58 115 58 C115 58 130 44 130 33 C130 25 124 18 115 18 Z" fill="#ff3333" />
        <circle cx="115" cy="33" r="5" fill="#0c0c0c" />
      </g>
    </svg>
  );
}

export function ScanArt() {
  const rows = [
    { label: 'SOURCE', w: 260, dashed: false },
    { label: 'RETRIEVAL STATUS', w: 190, dashed: false },
    { label: 'UNKNOWN', w: 110, dashed: true },
  ];
  return (
    <svg viewBox="0 0 520 110" aria-hidden="true" className="h-full w-full">
      {rows.map((r, i) => (
        <g key={r.label}>
          <text x="0" y={28 + i * 30} fontSize="10" fill="#8f8f8a" letterSpacing="1.6">
            <Tr s={r.label} />
          </text>
          <rect
            x="170"
            y={18 + i * 30}
            width={r.w}
            height="12"
            fill={r.dashed ? 'none' : 'rgb(255 255 255 / 0.1)'}
            stroke={r.dashed ? 'rgb(255 255 255 / 0.3)' : 'none'}
            strokeDasharray={r.dashed ? '4 4' : undefined}
          />
        </g>
      ))}
      <rect className="frl-beam" x="170" y="6" width="2" height="98" fill="#ff5a4d" />
    </svg>
  );
}

export function AxesArt() {
  const labels = ['REL', 'STA', 'RES', 'LEV', 'TRK', 'CNF'];
  const pt = (i: number, r: number) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: 150 + Math.cos(a) * r, y: 150 + Math.sin(a) * r };
  };
  const ring = (r: number) => labels.map((_, i) => `${pt(i, r).x},${pt(i, r).y}`).join(' ');
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="h-full w-full">
      <polygon points={ring(118)} fill="none" stroke="rgb(255 255 255 / 0.22)" />
      <polygon points={ring(78)} fill="none" stroke="rgb(255 255 255 / 0.1)" />
      <polygon points={ring(40)} fill="none" stroke="rgb(255 255 255 / 0.08)" />
      <circle className="frl-spin-slow" cx="150" cy="150" r="104" fill="none" stroke="rgb(255 90 70 / 0.5)" strokeDasharray="3 9" />
      {labels.map((l, i) => {
        const e = pt(i, 118);
        const t = pt(i, 138);
        return (
          <g key={l}>
            <line x1="150" y1="150" x2={e.x} y2={e.y} stroke="rgb(255 255 255 / 0.18)" />
            <circle className="frl-axis-dot" style={{ animationDelay: `${i * 0.5}s` }} cx={e.x} cy={e.y} r="4.5" fill="#ff5a4d" />
            <text x={t.x} y={t.y + 3} textAnchor="middle" fontSize="9" letterSpacing="1.4" fill="#8f8f8a">
              <Tr s={l} />
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SealArt({ tone }: { tone: 'success' | 'danger' | 'warning' | 'insufficient' }) {
  const color = { success: '#34d399', danger: '#ff3333', warning: '#fbbf24', insufficient: '#a3a39e' }[tone];
  const glyph = {
    success: 'M100 152 L136 188 L204 112',
    danger: 'M108 108 L192 192 M192 108 L108 192',
    warning: 'M150 96 V162 M150 192 V196',
    insufficient: 'M108 150 H192',
  }[tone];
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="h-full w-full overflow-visible">
      <circle className="frl-spin-slow" cx="150" cy="150" r="136" fill="none" stroke={color} strokeOpacity="0.55" strokeDasharray="4 12" />
      <circle cx="150" cy="150" r="104" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="3" style={{ filter: `drop-shadow(0 0 14px ${color})` }} />
      <path d={glyph} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
