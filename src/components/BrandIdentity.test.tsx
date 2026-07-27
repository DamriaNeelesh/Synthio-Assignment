import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './BrandLogo';
import { BrandMark } from './BrandMark';

describe('Synthio Labs brand identity', () => {
  it('renders the official wordmark variants with intrinsic dimensions', () => {
    const { rerender } = render(<BrandLogo />);

    const whiteLogo = screen.getByRole('img', { name: 'Synthio Labs' });
    expect(whiteLogo).toHaveAttribute('src', '/synthio-logo-white.svg');
    expect(whiteLogo).toHaveAttribute('width', '133');
    expect(whiteLogo).toHaveAttribute('height', '23');

    rerender(<BrandLogo variant="dark" />);

    const darkLogo = screen.getByRole('img', { name: 'Synthio Labs' });
    expect(darkLogo).toHaveAttribute('src', '/synthio-logo-dark.svg');
    expect(darkLogo).toHaveAttribute('width', '142');
    expect(darkLogo).toHaveAttribute('height', '32');
  });

  it('keeps repeated marks decorative unless they provide the identity label', () => {
    const { container, rerender } = render(<BrandMark />);

    const decorativeMark = container.querySelector('img');
    expect(decorativeMark).toHaveAttribute('alt', '');
    expect(decorativeMark).toHaveAttribute('aria-hidden', 'true');
    expect(decorativeMark).toHaveAttribute('src', '/synthio-mark-96.png');
    expect(decorativeMark).toHaveAttribute(
      'srcset',
      '/synthio-mark-96.png 1x, /synthio-app-icon-256.png 2x',
    );

    rerender(<BrandMark title="Synthio Labs" />);

    const labelledMark = within(container).getByRole('img', {
      name: 'Synthio Labs',
    });
    expect(labelledMark).not.toHaveAttribute('aria-hidden');
    expect(labelledMark).not.toHaveAttribute('title');
  });
});
