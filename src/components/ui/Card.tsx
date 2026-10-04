import type { HTMLAttributes } from 'react';

/**
 * FRL Card / Surface — UI Phase 1 primitive.
 *
 * A Card is a group of related information sitting on one plane. It is not a
 * styling upgrade for everything: if the content is not a meaningful group, it
 * does not belong in a Card.
 *
 * `tone` chooses the plane; `interactive` adds hover/press feedback for cards
 * that genuinely act as a control.
 */

export type CardTone = 'base' | 'elevated' | 'muted' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const TONES: Record<CardTone, string> = {
  base: 'bg-slate-900 border-white/10 shadow-[var(--shadow-surface)]',
  elevated: 'bg-slate-800 border-white/10 shadow-[var(--shadow-elevated)]',
  muted: 'bg-slate-900/40 border-white/[0.06]',
  // Translucency is a privilege, not a default: it belongs on chrome and
  // selected panels, never on every grouped block.
  glass:
    'bg-slate-900/70 border-white/10 shadow-[var(--shadow-float)] ' +
    'backdrop-blur-xl backdrop-saturate-150',
};

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /**
   * Adds hover/press feedback. Only set this when the card is genuinely
   * clickable — hover feedback on static content misleads.
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
  children,
  ...rest
}: CardProps) {
  return (
    <div
      data-selected={selected || undefined}
      className={[
        'rounded-lg border',
        'transition-[background-color,border-color,box-shadow,transform] duration-[var(--frl-dur-normal)]',
        'ease-[var(--frl-ease-standard)]',
        TONES[tone],
        PADDINGS[padding],
        selected ? 'border-indigo-400/50 ring-1 ring-indigo-400/20' : '',
        interactive
          ? 'cursor-pointer hover:border-indigo-400/40 hover:shadow-[var(--shadow-elevated)] ' +
            'active:translate-y-px ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover ' +
            'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
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