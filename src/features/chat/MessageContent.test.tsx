import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageContent } from './MessageContent';

describe('MessageContent', () => {
  it('renders plain text as a paragraph', () => {
    const { container } = render(
      <MessageContent content="A concise answer for the user." />,
    );

    const paragraph = screen.getByText('A concise answer for the user.');
    expect(paragraph).toHaveClass('message-content__paragraph');
    expect(container.querySelector('.message-content')?.children).toHaveLength(
      1,
    );
  });

  it('renders consecutive numbered steps as one ordered list', () => {
    render(
      <MessageContent
        content={[
          '1. Discover — Talk to users',
          '2. Decide — Choose the smallest useful scope',
        ].join('\n')}
      />,
    );

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('1DiscoverTalk to users');
    expect(items[1]).toHaveTextContent(
      '2DecideChoose the smallest useful scope',
    );
  });

  it('preserves paragraph, numbered-list, paragraph DOM order', () => {
    const { container } = render(
      <MessageContent
        content={[
          'Start with the customer outcome.',
          '',
          '1. Discover — Talk to users',
          '2. Decide — Choose the smallest useful scope',
          '',
          'Finish by measuring what changed.',
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
      'Start with the customer outcome.',
      '1DiscoverTalk to users2DecideChoose the smallest useful scope',
      'Finish by measuring what changed.',
    ]);
  });
});
