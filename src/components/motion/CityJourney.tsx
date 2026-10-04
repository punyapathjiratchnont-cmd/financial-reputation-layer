'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { TermsDialog } from '@/components/TermsDialog';

/**
 * Scroll-driven trip through a night city (2D, side view).
 *
 * The page scrolls natively (no scroll hijacking). A tall wrapper holds a
 * sticky full-screen stage. Scroll position is only a TARGET: the camera walks
 * toward it with easing and a hard speed limit, so a fast wheel flick cannot
 * whip the view. Progress (0..1) is written to CSS variables and the layers
 * slide past at different speeds (parallax): sky, searchlights, three
 * skylines, then foreground lamp posts and overpasses that move fastest.
 * Four tall "station" towers stand along the route; as each one passes, its
 * card opens. At the end of the road all four steps are shown together.
 *
 * Nothing here carries data. The words are the four steps the landing page
 * already lists, and the neon signs are decoration. With reduced motion the
 * scene is skipped and the same four steps are shown statically (see
 * .frl-city-* in globals.css).
 */

const STEPS = [
  { key: 'evidence', label: 'Evidence', note: 'Records actually held' },
  { key: 'signals', label: 'Signals', note: 'Derived from that evidence' },
  { key: 'analysis', label: 'Analysis', note: 'Interpreted, not assumed' },
  { key: 'reputation', label: 'Reputation', note: 'Reported with provenance' },
];

// Progress value at which each station is in front of the viewer.
const STATION_AT = [0.2, 0.4, 0.6, 0.8];
// Near layer travels 380vw over the whole route; stations are placed so that
// station i sits at 70vw on screen when progress equals STATION_AT[i].
const NEAR_TRAVEL = 380;

// Remembered for the current browser session only, so every new visit shows the notice.
const TERMS_KEY = 'frl_terms_accepted_v1';

const SIGNS = ['AUDIT', 'TRUST', 'LEDGER', 'PROOF', 'REGISTRY', 'SIGNAL'];

// Small deterministic PRNG so server and client render the same city.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Building = {
  left: number;
  width: number;
  height: number;
  lit: { x: number; y: number }[];
  sign?: string;
  beacon: boolean;
};

function makeLayer(
  seed: number,
  count: number,
  span: number,
  hMin: number,
  hMax: number,
  opts: { avoid?: number[]; signs?: boolean } = {},
): Building[] {
  const r = rng(seed);
  const out: Building[] = [];
  let x = -2;
  for (let i = 0; i < count && x < span; i++) {
    const width = 5 + r() * 9;
    const height = hMin + r() * (hMax - hMin);
    const skip = (opts.avoid ?? []).some((a) => Math.abs(x + width / 2 - a) < 9);
    if (!skip) {
      const lit = Array.from({ length: 4 }, () => ({ x: 12 + r() * 70, y: 8 + r() * 80 }));
      const sign = opts.signs && width > 7 && r() < 0.34 ? SIGNS[Math.floor(r() * SIGNS.length)] : undefined;
      out.push({ left: x, width, height, lit, sign, beacon: r() < 0.4 });
    }
    x += width + r() * 2.2;
  }
  return out;
}

const STATIONS_X = STATION_AT.map((s) => 70 + NEAR_TRAVEL * s);

const FAR = makeLayer(11, 44, 220, 12, 40);
const MID = makeLayer(23, 38, 320, 20, 54);
const NEAR = makeLayer(37, 36, 480, 26, 60, { avoid: STATIONS_X, signs: true });

const STARS = (() => {
  const r = rng(7);
  return Array.from({ length: 90 }, () => ({
    x: r() * 100,
    y: r() * 58,
    s: 1 + Math.floor(r() * 2.4),
    d: r() * 5,
  }));
})();

const LAMPS = Array.from({ length: 22 }, (_, i) => 24 + i * 44);
const BRIDGES = [310, 700];

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

function Layer({ items, className }: { items: Building[]; className: string }) {
  return (
    <div aria-hidden="true" className={`frl-city-layer ${className}`}>
      {items.map((b, i) => (
        <span
          key={i}
          className="frl-city-building"
          style={{ left: `${b.left}vw`, width: `${b.width}vw`, height: `${b.height}vh` }}
        >
          {b.lit.map((w, j) => (
            <i
              key={j}
              style={{ left: `${w.x}%`, top: `${w.y}%`, animationDelay: `${((i * 3 + j * 5) % 9) * 0.6}s` }}
            />
          ))}
          {b.beacon && <u className="frl-city-beacon" style={{ animationDelay: `${(i % 7) * 0.45}s` }} />}
          {b.sign && (
            <b
              className="frl-city-neon"
              style={{ color: i % 2 ? '#ffb347' : '#ff5a4d', animationDelay: `${(i % 5) * 0.8}s` }}
            >
              {b.sign}
            </b>
          )}
        </span>
      ))}
    </div>
  );
}

export function CityJourney() {
  const { t } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const acceptedRef = useRef(true); // true until the stored answer is read, so nothing flashes

  const accept = () => {
    try {
      sessionStorage.setItem(TERMS_KEY, '1');
    } catch {
      /* storage unavailable: the notice simply shows again next visit */
    }
    acceptedRef.current = true;
    setGateOpen(false);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    try {
      acceptedRef.current = sessionStorage.getItem(TERMS_KEY) === '1';
    } catch {
      acceptedRef.current = false;
    }
    // opened from an animation frame / observer callback, never synchronously in the effect
    const openGate = () => {
      if (acceptedRef.current) return;
      window.requestAnimationFrame(() => {
        if (!acceptedRef.current) setGateOpen(true);
      });
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // no scene: show the notice once the four steps come into view
      const end = wrap.querySelector('.frl-city-final');
      if (!end || typeof IntersectionObserver === 'undefined') return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            openGate();
            io.disconnect();
          }
        },
        { threshold: 0.6 },
      );
      io.observe(end);
      return () => io.disconnect();
    }

    // The scroll position is only a TARGET. The camera walks toward it with
    // easing and a hard speed limit, so a fast wheel flick or a dragged scrollbar
    // cannot whip the view; it simply takes the time a walk should take.
    const MAX_SPEED = 0.09; // fraction of the whole route per second (about 11 s end to end at most)
    const readTarget = () => {
      const rect = wrap.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      return span > 0 ? clamp(-rect.top / span) : 0;
    };
    let raf = 0;
    let target = 0;
    let current = 0;
    let last = 0;

    const render = (p: number) => {
      if (p >= 0.97) openGate();
      const s = wrap.style;
      s.setProperty('--p', p.toFixed(4));
      s.setProperty('--hint', String(1 - seg(p, 0, 0.06)));
      s.setProperty('--lead', String(seg(p, 0.02, 0.1) * (1 - seg(p, 0.12, 0.17))));
      STATION_AT.forEach((at, i) => {
        const open = seg(p, at - 0.07, at - 0.025) * (1 - seg(p, at + 0.05, at + 0.095));
        s.setProperty(`--k${i}`, open.toFixed(3));
        s.setProperty(`--d${i}`, p >= at - 0.03 ? '1' : '0');
      });
      s.setProperty('--fin', String(seg(p, 0.9, 0.96)));
      s.setProperty('--dim', String(seg(p, 0.88, 0.97)));
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const diff = target - current;
      if (Math.abs(diff) < 0.0002) {
        current = target;
        render(current);
        return;
      }
      const eased = diff * (1 - Math.exp(-dt * 3));
      current += clamp(eased, -MAX_SPEED * dt, MAX_SPEED * dt);
      render(current);
      raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = readTarget();
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    target = current = readTarget();
    render(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="frl-city-scroll">
      {gateOpen && <TermsDialog onAccept={accept} />}
      <div className="frl-city-stage">
        {/* ---------- Sky ---------- */}
        <div aria-hidden="true" className="frl-city-sky" />
        <div aria-hidden="true" className="frl-city-stars">
          {STARS.map((st, i) => (
            <i
              key={i}
              style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
            />
          ))}
          <span className="frl-shoot" style={{ top: '9vh', left: '78vw', animationDelay: '3s' }} />
          <span className="frl-shoot" style={{ top: '18vh', left: '95vw', animationDelay: '9s' }} />
          <span className="frl-shoot" style={{ top: '5vh', left: '55vw', animationDelay: '15s' }} />
        </div>
        <div aria-hidden="true" className="frl-city-moon" />

        {/* ---------- Far skyline + searchlights ---------- */}
        <Layer items={FAR} className="frl-city-far" />
        <div aria-hidden="true" className="frl-city-layer frl-city-far frl-city-lights">
          {[34, 92, 150, 196].map((x, i) => (
            <span key={x} className="frl-city-search" style={{ left: `${x}vw`, animationDelay: `${i * 1.7}s` }} />
          ))}
        </div>

        <Layer items={MID} className="frl-city-mid" />
        <div aria-hidden="true" className="frl-city-haze" />
        <div aria-hidden="true" className="frl-city-fog" />

        {/* ---------- Near skyline + station towers ---------- */}
        <Layer items={NEAR} className="frl-city-near" />
        <div aria-hidden="true" className="frl-city-layer frl-city-near frl-city-stations">
          {STEPS.map((step, i) => (
            <span key={step.key} className="frl-city-tower" style={{ left: `${STATIONS_X[i] - 6}vw` }}>
              <i className="frl-tower-beam" />
              <i className="frl-tower-ring" />
              <i className="frl-tower-spire" />
              <i className="frl-tower-beacon" />
              <i className="frl-tower-scan" />
              <b className="frl-display">0{i + 1}</b>
            </span>
          ))}
        </div>

        {/* ---------- Road ---------- */}
        <div aria-hidden="true" className="frl-city-road">
          <span className="frl-city-lane" />
          <span className="frl-city-wet" />
        </div>

        {/* ---------- Foreground: lamp posts + overpasses (fastest layer) ---------- */}
        <div aria-hidden="true" className="frl-city-fore">
          {BRIDGES.map((x) => (
            <span key={x} className="frl-city-bridge" style={{ left: `${x}vw` }}>
              <i />
              <i />
            </span>
          ))}
          {LAMPS.map((x, i) => (
            <span key={x} className="frl-city-lamp" style={{ left: `${x}vw`, animationDelay: `${(i % 4) * 0.7}s` }} />
          ))}
        </div>

        {/* ---------- Text ---------- */}
        <p className="frl-city-lead text-label text-primary-hover">
          {t('Financial Reputation Intelligence', 'Financial Reputation Intelligence')}
        </p>
        <p className="frl-city-hint">
          <span>{t('Scroll to travel', 'Scroll to travel')}</span>
          <span aria-hidden="true" className="frl-city-hint-line" />
        </p>

        {/* Station cards: decorative copy of the final list, one at a time. */}
        {STEPS.map((step, i) => (
          <div key={step.key} aria-hidden="true" className="frl-city-card" style={{ ['--k' as string]: `var(--k${i})` }}>
            <span className="frl-display block text-xs text-primary-hover">0{i + 1} / 04</span>
            <span className="frl-display mt-3 block text-[clamp(1.8rem,5vw,3.4rem)] leading-tight text-white">
              {t(step.label, step.label)}
            </span>
            <span className="mt-3 block max-w-xs text-body text-fg-secondary">{t(step.note, step.note)}</span>
          </div>
        ))}

        {/* Route progress */}
        <ol aria-hidden="true" className="frl-city-route">
          {STEPS.map((step, i) => (
            <li key={step.key} style={{ ['--d' as string]: `var(--d${i})` }}>
              <span />
              <em>{t(step.label, step.label)}</em>
            </li>
          ))}
        </ol>

        {/* End of the road: the real, readable list. */}
        <div className="frl-city-final">
          <ol className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.key} className="frl-city-step">
                <span className="frl-display block text-xs text-primary-hover">0{i + 1}</span>
                <span className="frl-display mt-3 block text-[clamp(1.4rem,3vw,2.2rem)] leading-tight text-white">
                  {t(step.label, step.label)}
                </span>
                <span className="mt-2 block text-body-sm text-fg-muted">{t(step.note, step.note)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
