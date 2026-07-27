import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import {
  ConversationProvider,
  createSeededConversationState,
} from './features/conversations';

const defaultInnerWidth = window.innerWidth;

function renderApp() {
  return render(
    <ConversationProvider
      initialState={createSeededConversationState()}
      storage={null}
    >
      <App />
    </ConversationProvider>,
  );
}

function useViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      const minWidth = /min-width:\s*(\d+)px/.exec(query);
      const maxWidth = /max-width:\s*(\d+)px/.exec(query);
      const matches =
        (minWidth ? width >= Number(minWidth[1]) : true) &&
        (maxWidth ? width <= Number(maxWidth[1]) : true);

      return {
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      };
    }),
  );
}

afterEach(() => {
  cleanup();
  window.speechSynthesis?.cancel();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: defaultInnerWidth,
    writable: true,
  });
});

describe('Synthio Labs AI assistant', () => {
  it('switches between persisted conversation sessions', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Jarvis field call prep' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Ather scientific exchange' }),
    );

    expect(
      screen.getByText(
        'Show how Ather should handle a fictional HCP question that may be off-label.',
      ),
    ).toBeInTheDocument();
  });

  it('creates a chat and streams a fast mock response via Enter', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole('button', { name: 'New conversation' }),
    );
    const composer = screen.getByLabelText('Message Synthio Assistant');
    await user.type(
      composer,
      'Show an Ather scientific exchange with approved content{Enter}',
    );

    expect(
      within(
        screen.getByRole('article', { name: 'You message' }),
      ).getByText(
        'Show an Ather scientific exchange with approved content',
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByRole('article').at(-1)).toHaveTextContent(
        'Ather scientific-response workflow',
      );
    }, { timeout: 5_000 });
  });

  it('renders a retryable error state deterministically', async () => {
    const user = userEvent.setup();
    renderApp();

    const composer = screen.getByLabelText('Message Synthio Assistant');
    await user.type(composer, '/error{Enter}');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'The mock assistant was asked to simulate an error.',
    );
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('moves through connecting, connected, and disconnected voice states', async () => {
    const user = userEvent.setup();
    renderApp();

    const header = screen.getByRole('banner');
    await user.click(
      within(header).getByRole('button', {
        name: 'Start voice conversation',
      }),
    );

    expect(
      screen.getByRole('complementary', { name: 'Voice conversation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Connecting')).toBeInTheDocument();
    expect(await screen.findByText('Connected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'End call' }));
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('presents voice as a focus-contained modal on compact viewports', async () => {
    useViewport(390);
    const user = userEvent.setup();
    renderApp();

    const workspace = screen.getByRole('main');
    const voiceTrigger = within(screen.getByRole('banner')).getByRole(
      'button',
      { name: 'Start voice conversation' },
    );
    await user.click(voiceTrigger);

    const dialog = screen.getByRole('dialog', {
      name: 'Voice conversation',
    });
    expect(workspace).toHaveAttribute('aria-hidden', 'true');
    expect(workspace).toHaveAttribute('inert');
    await waitFor(() => {
      expect(dialog).toContainElement(
        document.activeElement as HTMLElement,
      );
    });

    const firstControl = within(dialog).getAllByRole('button')[0];
    const lastControl = within(dialog).getByRole('button', {
      name: 'End call',
    });
    expect(firstControl).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(lastControl).toHaveFocus();
    await user.tab();
    expect(firstControl).toHaveFocus();
  });

  it('makes the workspace inert while the mobile conversation drawer is open', async () => {
    useViewport(390);
    const user = userEvent.setup();
    renderApp();

    const workspace = screen.getByRole('main');
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', {
        name: 'Open conversation sidebar',
      }),
    );

    const navigation = screen.getByRole('complementary', {
      name: 'Conversation navigation',
    });
    expect(navigation).toHaveAttribute('aria-hidden', 'false');
    expect(workspace).toHaveAttribute('aria-hidden', 'true');
    expect(workspace).toHaveAttribute('inert');
    expect(document.querySelector('.skip-link')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    await user.click(
      within(navigation).getByRole('button', {
        name: 'Close conversation sidebar',
      }),
    );

    expect(workspace).not.toHaveAttribute('aria-hidden');
    expect(workspace).not.toHaveAttribute('inert');
  });

  it('closes the compact voice modal with Escape and restores focus', async () => {
    useViewport(1179);
    const user = userEvent.setup();
    renderApp();

    const voiceTrigger = within(screen.getByRole('banner')).getByRole(
      'button',
      { name: 'Start voice conversation' },
    );
    await user.click(voiceTrigger);
    await screen.findByRole('dialog', { name: 'Voice conversation' });

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: 'Voice conversation' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(voiceTrigger).toHaveFocus());
  });
});
