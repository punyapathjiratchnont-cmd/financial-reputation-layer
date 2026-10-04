import type { ElementType, HTMLAttributes } from 'react';

/**
 * FRL responsive layout primitives — UI Phase 1.
 *
 * These are thin, typed wrappers over the `.frl-*` structural classes in
 * globals.css. They exist so the horizontal padding rhythm and max-width ladder
 * are decided in exactly one place instead of being re-guessed per page.
 */

export type ContainerWidth = 'narrow' | 'read' | 'content' | 'wide' | 'full';

const WIDTHS: Record<ContainerWidth, string> = {
  narrow: 'frl-container--narrow', //  44rem — focused prose, single column
  read: 'frl-container--read', //     56rem — forms, long text
  content: 'frl-container--content', // 64rem — the product default
  wide: 'frl-container--wide', //     72rem — dashboards
  full: 'frl-container--full', //     80rem — dense intelligence views
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
}

export function Container({
  width = 'content',
  className = '',
  children,
  ...rest
}: ContainerProps) {
  return (
    <div className={`frl-container ${WIDTHS[width]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export function Section({
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag className={`frl-section ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Fixed column count on desktop, or a responsive 1 -> 2 -> 3 ladder. */
  columns?: 2 | 3;
}

export function Grid({
  columns = 3,
  className = '',
  children,
  ...rest
}: GridProps) {
  return (
    <div
      className={`frl-grid ${columns === 2 ? 'frl-grid--2col' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}