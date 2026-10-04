import type { HTMLAttributes, ReactNode } from 'react';

/**
 * FRL Badge — UI Phase 1 primitive.
 *
 * A badge is a short, non-interactive status marker. If the thing is clickable
 * it is a Button, not a Badge.
 */

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  /** Sample data. Always visually provisional — see the dashed border. */
  | 'demo'
  /** A valid data state, not an error. Must never read as a failure. */
  | 'insufficient';

export type BadgeSize = 'sm' | 'md';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/5 text-slate-300 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  primary: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',

  // Demo reads as provisional by construction, not just by colour: the dashed
  // edge is the signal. A filled solid badge would imply settled fact.
  demo: 'bg-amber-500/10 text-amber-300 border-amber-500/30 border-dashed',

  // Deliberately muted rather than amber or red. "Insufficient Data" is an
  // honest answer to the question asked — it is not a broken component, and
  // borrowing error styling would make a valid state look like a fault.
  insufficient:
    'bg-slate-400/[0.08] text-slate-400 border-slate-400/25 border-dotted',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-[0.625rem]',
  md: 'h-6 px-2.5 text-[0.6875rem]',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Leading status dot. Decorative — the text carries the meaning. */
  dot?: boolean;
  children?: ReactNode;
}

const DOT_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-sky-400',
  primary: 'bg-indigo-400',
  demo: 'bg-amber-400',
  insufficient: 'bg-slate-400',
};

export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-pill border font-semibold uppercase',
        'tracking-[0.08em] whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONES[tone]}`}
        />
      ) : null}
      {children}
    </span>
  );
}

/**
 * Small colour swatch used in metadata rows (source, verification, retrieval).
 * Purely decorative.
 */
export function MetaDot({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-3 w-3 shrink-0 rounded-full border border-white/15 ${className}`}
    />
  );
}