import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockReply } from './api/mockChatApi';
import { StarterPrompts } from './StarterPrompts';
import { STARTER_PROMPTS } from './starterPromptCatalog';

const EXPECTED_CARD_NAMES = [
  'Try Jarvis prompt: Prepare a field call',
  'Try Ather prompt: Handle an HCP question',
  'Try Helix prompt: Plan patient onboarding',
  'Try Simulation Studio prompt: Test a concept',
  'Try Polaris HQ prompt: Explore commercial signals',
  'Try Safety drill prompt: Run a safety handoff',
] as const;

const EXPECTED_RESPONSE_HEADINGS_BY_ID = {
  ather: 'Ather scientific-response workflow',
  helix: 'Helix patient-support flow',
  jarvis: 'Jarvis field workflow',
  polaris: 'Polaris HQ analysis pattern',
  safety: 'Safety-first workflow',
  simulation: 'Simulation Studio research plan',
} as const;

afterEach(cleanup);

describe('StarterPrompts', () => {
  it('renders six accessible one-click workflow cards', () => {
    render(<StarterPrompts onSelectPrompt={vi.fn()} />);

    const promptRegion = screen.getByRole('region', {
      name: 'One-click demo prompts',
    });
    const promptList = within(promptRegion).getByRole('list');
    const cards = within(promptList).getAllByRole('button');

    expect(cards).toHaveLength(6);
    EXPECTED_CARD_NAMES.forEach((name) => {
      expect(
        within(promptList).getByRole('button', { name }),
      ).toBeEnabled();
    });
  });

  it.each(STARTER_PROMPTS)(
    'sends the exact $product prompt payload',
    async ({ product, prompt, title }) => {
      const user = userEvent.setup();
      const onSelectPrompt = vi.fn();
      render(<StarterPrompts onSelectPrompt={onSelectPrompt} />);

      await user.click(
        screen.getByRole('button', {
          name: `Try ${product} prompt: ${title}`,
        }),
      );

      expect(onSelectPrompt).toHaveBeenCalledTimes(1);
      expect(onSelectPrompt).toHaveBeenCalledWith(prompt);
    },
  );

  it('supports native Enter and Space activation', async () => {
    const user = userEvent.setup();
    const onSelectPrompt = vi.fn();
    render(<StarterPrompts onSelectPrompt={onSelectPrompt} />);
    const button = screen.getByRole('button', {
      name: 'Try Safety drill prompt: Run a safety handoff',
    });

    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onSelectPrompt).toHaveBeenCalledTimes(2);
    expect(onSelectPrompt).toHaveBeenNthCalledWith(
      1,
      STARTER_PROMPTS.at(-1)?.prompt,
    );
    expect(onSelectPrompt).toHaveBeenNthCalledWith(
      2,
      STARTER_PROMPTS.at(-1)?.prompt,
    );
  });

  it('prevents every prompt action while disabled', async () => {
    const user = userEvent.setup();
    const onSelectPrompt = vi.fn();
    render(
      <StarterPrompts
        disabled
        onSelectPrompt={onSelectPrompt}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
    buttons.forEach((button) => expect(button).toBeDisabled());

    await user.click(buttons[0]);
    await user.click(
      screen.getByRole('button', {
        name: 'Simulate a retryable mock error',
      }),
    );
    expect(onSelectPrompt).not.toHaveBeenCalled();
  });

  it.each(STARTER_PROMPTS)(
    'maps the $product prompt to its deterministic mock response',
    ({ id, prompt }) => {
      const expectedHeading =
        EXPECTED_RESPONSE_HEADINGS_BY_ID[
          id as keyof typeof EXPECTED_RESPONSE_HEADINGS_BY_ID
        ];

      expect(expectedHeading).toBeDefined();
      expect(createMockReply(prompt)).toContain(expectedHeading);
    },
  );
});
