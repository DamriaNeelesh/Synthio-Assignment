import type { SVGProps } from 'react';

export interface BrandMarkProps
  extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /**
   * Provide a title when the mark is shown without an adjacent text label.
   * It is decorative by default.
   */
  title?: string;
}

/**
 * Synthex's code-native spark mark.
 *
 * The paths use `currentColor`, so the mark can inherit any theme or state
 * color without needing a second asset.
 */
export function BrandMark({
  className,
  title,
  width = 32,
  height = 32,
  ...svgProps
}: BrandMarkProps) {
  const isDecorative = title === undefined;

  return (
    <svg
      {...svgProps}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={title}
      className={['brand-mark', className].filter(Boolean).join(' ')}
      fill="none"
      height={height}
      role={isDecorative ? undefined : 'img'}
      viewBox="0 0 40 40"
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <g className="brand-mark__rays" stroke="currentColor">
        <path d="M20 3.75V36.25" />
        <path d="M3.75 20H36.25" />
        <path d="M8.5 8.5L31.5 31.5" />
        <path d="M31.5 8.5L8.5 31.5" />
      </g>
      <path
        className="brand-mark__core"
        d="M20 14.35C20.74 17.56 22.44 19.26 25.65 20C22.44 20.74 20.74 22.44 20 25.65C19.26 22.44 17.56 20.74 14.35 20C17.56 19.26 19.26 17.56 20 14.35Z"
        fill="currentColor"
      />
    </svg>
  );
}
