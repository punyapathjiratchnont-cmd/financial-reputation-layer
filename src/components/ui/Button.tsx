import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * FRL Button — UI Phase 1 primitive.
 *
 * Presentation only. This component never changes what a control does; it
 * receives an `onClick` and renders an ordinary `<button>`, so the behaviour of
 * every caller stays exactly as it was.
 *
 * Why a single component rather than per-page button markup: the product had
 * grown five different button silhouettes. Centralising variant + size + state
 * makes "premium and consistent" enforceable instead of aspirational.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Height is fixed per size so buttons align in a row regardless of label
 * length. sm/md/lg map to 36/44/48px; md and lg meet the 44px touch target.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap ' +
  'rounded-md select-none ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--frl-dur-fast)] ' +
  'ease-[var(--frl-ease-standard)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:opacity-50 disabled:pointer-events-none ' +
  'aria-disabled:opacity-50 aria-disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-500 active:bg-indigo-700 active:translate-y-px',
  secondary:
    'bg-white/5 text-slate-100 border border-white/15 ' +
    'hover:bg-white/10 hover:border-white/25 active:bg-white/[0.07] active:translate-y-px',
  outline:
    'bg-transparent text-slate-200 border border-white/20 ' +
    'hover:bg-white/5 hover:text-slate-50 active:bg-white/[0.03] active:translate-y-px',
  ghost:
    'bg-transparent text-slate-300 border border-transparent ' +
    'hover:bg-white/[0.06] hover:text-slate-50 active:bg-white/[0.03]',
  danger:
    'bg-rose-600 text-white shadow-sm ' +
    'hover:bg-rose-500 active:bg-rose-700 active:translate-y-px',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner, marks the control busy for assistive tech, and blocks
   * further activation. Children stay mounted so the button keeps its width and
   * the surrounding layout does not jump mid-request.
   */
  loading?: boolean;
  /** Rendered before the label. Decorative — hidden from assistive tech. */
  icon?: ReactNode;
  /** Rendered after the label. Decorative — hidden from assistive tech. */
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    trailingIcon,
    fullWidth = false,
    className = '',
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      // A loading button is inert: disabled blocks clicks and removes it from
      // the tab order, which is what we want for a control mid-flight.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2
          aria-hidden="true"
          className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
      {trailingIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
});