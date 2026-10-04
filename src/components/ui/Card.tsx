import type { HTMLAttributes } from 'react';

/**
 * FRL Card / Surface.
 *
 * A Card is a group of related information on one plane. It is drawn as a
 * cut-corner panel (two chamfered corners, a red-to-grey edge, a light that
 * follows the pointer) and rises into view once as it is scrolled to.
 *
 * Layout classes passed in `className` (margins, width, height, grid placement,
 * positioning) are applied to the outer frame so the card still sits where its
 * parent puts it; every other class (flex, gap, text, space-y …) is applied to
 * the inner panel where the content lives.
 *
 * `tone` chooses the plane; `interactive` adds a lift for cards that genuinely
 * act as a control.
 */

export type CardTone = 'base' | 'elevated' | 'muted' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const TONES: Record<CardTone, string> = {
  base: '',
  elevated: 'frl-in-elevated',
  muted: 'frl-in-muted',
  glass: '',
};

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const CUTS: Record<CardPadding, string> = {
  none: '26px',
  sm: '14px',
  md: '22px',
  lg: '28px',
};

// Classes that decide where the card sits (outer frame). Anything else goes inside.
const OUTER =
  /^(?:-?m[trblxy]?-|w-|h-|min-w-|min-h-|max-w-|max-h-|col-|row-|self-|justify-self-|order-|grow|shrink|flex-1$|basis-|z-|sticky$|top-|bottom-|left-|right-|inset-|absolute$|relative$|hidden$|block$|lg:|md:|sm:|xl:)/;

function splitClasses(className: string) {
  const outer: string[] = [];
  const inner: string[] = [];
  for (const token of className.split(/\s+/).filter(Boolean)) {
    const base = token.slice(token.lastIndexOf(':') + 1);
    // responsive layout tokens (e.g. lg:col-span-2) have a layout base; others (md:p-8) do not
    const isLayout = OUTER.test(base) && !/^(?:p[trblxy]?-|gap-|space-|text-|font-|flex$|grid$|items-|justify-(?!self))/.test(base);
    (isLayout ? outer : inner).push(token);
  }
  return { outer: outer.join(' '), inner: inner.join(' ') };
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /**
   * Adds a lift on hover. Only set this when the card is genuinely clickable —
   * hover feedback on static content misleads.
   */
  interactive?: boolean;
  /** Visually selected (a tab, a chosen panel). */
  selected?: boolean;
}

export function Card({
  tone = 'base',
  padding = 'md',
  interactive = false,
  selected = false,
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  const { outer, inner } = splitClasses(className);
  return (
    <div
      data-fx="card"
      data-selected={selected || undefined}
      className={['frl-bevel-wrap', interactive ? 'frl-hoverlift' : '', outer].filter(Boolean).join(' ')}
      style={{ ['--bevel' as string]: CUTS[padding], ...style }}
    >
      <div className="frl-bevel h-full">
        <div
          className={[
            'frl-bevel-in frl-spot h-full',
            TONES[tone],
            PADDINGS[padding],
            interactive
              ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover'
              : '',
            inner,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-h4 text-slate-100 ${className}`}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-body-sm text-slate-400 ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}