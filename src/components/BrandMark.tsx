import type { ImgHTMLAttributes } from 'react';

export interface BrandMarkProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'alt' | 'src' | 'title'
  > {
  /**
   * Provide a title when the mark is shown without an adjacent text label.
   * It is decorative by default.
   */
  title?: string;
}

/**
 * Official Synthio Labs product mark, self-hosted from the public website.
 */
export function BrandMark({
  className,
  title,
  width = 32,
  height = 32,
  ...imageProps
}: BrandMarkProps) {
  const isDecorative = title === undefined;

  return (
    <img
      {...imageProps}
      alt={title ?? ''}
      aria-hidden={isDecorative ? true : undefined}
      className={['brand-mark', className].filter(Boolean).join(' ')}
      decoding="async"
      draggable={false}
      height={height}
      src={`${import.meta.env.BASE_URL}synthio-mark-96.png`}
      srcSet={`${import.meta.env.BASE_URL}synthio-mark-96.png 1x, ${import.meta.env.BASE_URL}synthio-app-icon-256.png 2x`}
      width={width}
    />
  );
}
