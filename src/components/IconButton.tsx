import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant =
  | 'ghost'
  | 'outline'
  | 'subtle'
  | 'accent'
  | 'danger';

export type IconButtonSize = 'small' | 'medium' | 'large';

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'aria-label' | 'children' | 'title'
  > {
  /** The accessible name announced by assistive technology. */
  label: string;
  /** Icon content is hidden from assistive technology by this component. */
  children: ReactNode;
  /** Optional visual variant. */
  variant?: IconButtonVariant;
  /** All sizes retain a CSS hook for a minimum 44px interactive target. */
  size?: IconButtonSize;
  /** Tooltip copy. Defaults to `label`. */
  tooltip?: string;
}

export function IconButton({
  children,
  className,
  label,
  size = 'medium',
  tooltip = label,
  type = 'button',
  variant = 'ghost',
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      {...buttonProps}
      aria-label={label}
      className={[
        'icon-button',
        `icon-button--${variant}`,
        `icon-button--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-tooltip={tooltip}
      title={tooltip}
      type={type}
    >
      <span aria-hidden="true" className="icon-button__icon">
        {children}
      </span>
    </button>
  );
}
