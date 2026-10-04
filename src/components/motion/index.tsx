'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Presentation-only motion helpers. They animate a value the caller already
 * has; none of them computes, estimates or changes data. With reduced motion
 * (or no IntersectionObserver) the final state renders immediately.
 */

/** True once the element has entered the viewport (one-shot). */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** Wrapper that slides and clips its content in once when scrolled into view. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  return (
    <div
      ref={ref}
      data-in={inView}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`frl-reveal ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Counts from 0 up to `value`. The real value is announced to assistive tech.
 * With `whenInView` it waits until it is scrolled into view before counting.
 */
export function CountUp({
  value,
  duration = 1100,
  whenInView = false,
}: {
  value: number;
  duration?: number;
  whenInView?: boolean;
}) {
  const [shown, setShown] = useState(value);
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const go = !whenInView || inView;

  useEffect(() => {
    if (!go) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, go]);

  return (
    <span ref={ref} aria-label={String(value)}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** Bar that grows to `percent` once in view. `percent` is supplied, never computed here. */
export function GrowBar({ percent, className = '' }: { percent: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div
      ref={ref}
      data-in={inView}
      style={{ ['--bar-w' as string]: `${percent}%`, width: `${percent}%` }}
      className={`frl-bar h-full ${className}`}
    />
  );
}

/** Strip of repeating text. Decorative, so hidden from assistive tech. */
export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="frl-display flex items-center text-lg text-white sm:text-xl">
          <span className="px-6">{t}</span>
          <span aria-hidden="true" className="text-primary">
            {'///'}
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="frl-marquee overflow-hidden border-y border-white/[0.14] py-3">
      <div className="frl-marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
