import { describe, expect, it } from 'vitest';
import { createSeededConversationState } from './seed';

describe('seeded Synthio Labs conversations', () => {
  it('showcases all five product workflows with synthetic, safe data', () => {
    const state = createSeededConversationState();

    expect(state.activeConversationId).toBe('conversation-jarvis');
    expect(state.conversations.map(({ title }) => title)).toEqual([
      'Jarvis field call prep',
      'Ather scientific exchange',
      'Helix patient onboarding',
      'Simulation Studio concept test',
      'Polaris HQ commercial insight',
    ]);

    const transcript = state.conversations
      .flatMap(({ messages }) => messages.map(({ content }) => content))
      .join('\n');

    expect(transcript).toContain("I'm Synthio Assistant");
    expect(transcript).toContain('no real HCP or patient data');
    expect(transcript).toContain('off-label');
    expect(transcript).toContain('adverse-event');
    expect(transcript).toContain('auditable');
    expect(transcript).toContain('Synthetic personas');
  });

  it('returns a defensive clone for each caller', () => {
    const first = createSeededConversationState();
    const second = createSeededConversationState();

    first.conversations[0].title = 'Changed locally';
    first.conversations[0].messages[0].content = 'Changed locally';

    expect(second.conversations[0].title).toBe('Jarvis field call prep');
    expect(second.conversations[0].messages[0].content).toContain(
      'Synthio Assistant',
    );
  });
});
