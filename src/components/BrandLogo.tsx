import type { ImgHTMLAttributes } from 'react';

export interface BrandLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  variant?: 'dark' | 'white';
}

/**
 * Official Synthio Labs wordmark.
 *
 * The assets are self-hosted copies of the public brand files used by
 * synthiolabs.com, so the assignment remains sharp, fast, and offline-safe.
 */
export function BrandLogo({
  alt = 'Synthio Labs',
  className,
  draggable = false,
  height,
  variant = 'white',
  width,
  ...imageProps
}: BrandLogoProps) {
  const intrinsicSize =
    variant === 'white'
      ? { height: 23, width: 133 }
      : { height: 32, width: 142 };

  return (
    <img
      {...imageProps}
      alt={alt}
      className={['brand-logo', className].filter(Boolean).join(' ')}
      decoding="async"
      draggable={draggable}
      height={height ?? intrinsicSize.height}
      src={`${import.meta.env.BASE_URL}synthio-logo-${variant}.svg`}
      width={width ?? intrinsicSize.width}
    />
  );
}
