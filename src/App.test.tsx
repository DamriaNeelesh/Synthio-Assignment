import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import {
  ConversationProvider,
  createSeededConversationState,
} from './features/conversations';

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

afterEach(() => {
  cleanup();
  window.speechSynthesis?.cancel();
});

describe('Synthex app', () => {
  it('switches between persisted conversation sessions', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Product strategy' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Go-to-market plan' }),
    );

    expect(
      screen.getByText(
        'Create a simple launch checklist for our analytics feature.',
      ),
    ).toBeInTheDocument();
  });

  it('creates a chat and streams a fast mock response via Enter', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole('button', { name: 'New conversation' }),
    );
    const composer = screen.getByLabelText('Message Synthex');
    await user.type(composer, 'Create a practical launch plan{Enter}');

    expect(
      within(
        screen.getByRole('article', { name: 'You message' }),
      ).getByText('Create a practical launch plan'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(
          'A focused plan has four stages: define the outcome and success metric, choose the smallest useful first milestone, assign owners and checkpoints, then review results and adjust. Start with the highest-risk assumption so you learn early without slowing delivery.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders a retryable error state deterministically', async () => {
    const user = userEvent.setup();
    renderApp();

    const composer = screen.getByLabelText('Message Synthex');
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
});
