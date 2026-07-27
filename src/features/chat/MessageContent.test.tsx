import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageContent } from './MessageContent';

describe('MessageContent', () => {
  it('renders plain text as a paragraph', () => {
    const { container } = render(
      <MessageContent content="A concise, approved-content summary." />,
    );

    const paragraph = screen.getByText(
      'A concise, approved-content summary.',
    );
    expect(paragraph).toHaveClass('message-content__paragraph');
    expect(container.querySelector('.message-content')?.children).toHaveLength(
      1,
    );
  });

  it('renders consecutive numbered steps as one ordered list', () => {
    render(
      <MessageContent
        content={[
          '1. Ground — Use approved sources',
          '2. Escalate — Route safety concerns',
        ].join('\n')}
      />,
    );

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('1GroundUse approved sources');
    expect(items[1]).toHaveTextContent(
      '2EscalateRoute safety concerns',
    );
  });

  it('preserves paragraph, numbered-list, paragraph DOM order', () => {
    const { container } = render(
      <MessageContent
        content={[
          'Start with the documented HCP need.',
          '',
          '1. Ground — Use approved sources',
          '2. Escalate — Route safety concerns',
          '',
          'Finish with an auditable follow-up.',
        ].join('\n')}
      />,
    );

    const root = container.querySelector('.message-content');
    expect(root).not.toBeNull();

    const children = Array.from(root?.children ?? []);
    expect(children.map((element) => element.tagName)).toEqual([
      'P',
      'OL',
      'P',
    ]);
    expect(children.map((element) => element.textContent)).toEqual([
      'Start with the documented HCP need.',
      '1GroundUse approved sources2EscalateRoute safety concerns',
      'Finish with an auditable follow-up.',
    ]);
  });
});
