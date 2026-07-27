import type { ConversationState } from '../../types';

export const DEFAULT_CONVERSATION_TITLE = 'New conversation';

const SEEDED_STATE: ConversationState = {
  activeConversationId: 'conversation-strategy',
  conversations: [
    {
      id: 'conversation-strategy',
      title: 'Product strategy',
      createdAt: '2026-07-27T19:35:00.000Z',
      updatedAt: '2026-07-27T20:04:00.000Z',
      messages: [
        {
          id: 'message-strategy-welcome',
          role: 'assistant',
          content:
            "Hi Jane! I'm Synthex. I can help you refine your strategy, analyze markets, and turn ideas into actionable plans. What would you like to focus on today?",
          createdAt: '2026-07-27T19:35:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-strategy-user',
          role: 'user',
          content:
            "I'm working on our product strategy for next year. Where should we start?",
          createdAt: '2026-07-27T19:36:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-strategy-assistant',
          role: 'assistant',
          content:
            "Great place to start. Let's build a strong foundation.\n\n1. Market insight — Validate the problem, segment, and opportunity size.\n2. Customer outcomes — Define the core jobs, outcomes, and success metrics.\n3. Strategic bets — Prioritize initiatives that drive differentiation and impact.",
          createdAt: '2026-07-27T19:36:08.000Z',
          status: 'complete',
        },
        {
          id: 'message-strategy-user-followup',
          role: 'user',
          content: "That makes sense. Let's dig into market insight first.",
          createdAt: '2026-07-27T20:04:00.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-launch',
      title: 'Go-to-market plan',
      createdAt: '2026-07-27T12:15:00.000Z',
      updatedAt: '2026-07-27T19:05:00.000Z',
      messages: [
        {
          id: 'message-launch-user',
          role: 'user',
          content: 'Create a simple launch checklist for our analytics feature.',
          createdAt: '2026-07-27T12:15:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-launch-assistant',
          role: 'assistant',
          content:
            'Here’s a focused checklist: validate the target audience, confirm instrumentation, prepare enablement material, recruit a small beta cohort, monitor activation and retention, then publish the wider release with a clear feedback channel.',
          createdAt: '2026-07-27T12:15:06.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-research',
      title: 'Competitive analysis',
      createdAt: '2026-07-25T09:45:00.000Z',
      updatedAt: '2026-07-27T15:05:00.000Z',
      messages: [
        {
          id: 'message-research-user',
          role: 'user',
          content:
            'Compare our onboarding experience with the strongest products in the category.',
          createdAt: '2026-07-25T09:45:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-research-assistant',
          role: 'assistant',
          content:
            'The strongest products shorten time-to-value with a guided first task, a realistic sample workspace, and contextual collaboration prompts. Those are the three moments I would benchmark first.',
          createdAt: '2026-07-25T09:45:07.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-synthesis',
      title: 'User research synthesis',
      createdAt: '2026-07-26T09:45:00.000Z',
      updatedAt: '2026-07-26T19:05:00.000Z',
      messages: [
        {
          id: 'message-synthesis-user',
          role: 'user',
          content:
            'Summarize the recurring themes from five customer calls about onboarding.',
          createdAt: '2026-07-26T09:45:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-synthesis-assistant',
          role: 'assistant',
          content:
            'The strongest themes were unclear first steps, too much setup before seeing value, and uncertainty about inviting teammates. A guided first task, sample workspace, and contextual invite prompt would address the highest-friction moments.',
          createdAt: '2026-07-26T09:45:07.000Z',
          status: 'complete',
        },
      ],
    },
  ],
};

function cloneState(state: ConversationState): ConversationState {
  return {
    activeConversationId: state.activeConversationId,
    conversations: state.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        error: message.error ? { ...message.error } : undefined,
        retry: message.retry ? { ...message.retry } : undefined,
      })),
    })),
  };
}

export function createSeededConversationState(): ConversationState {
  return cloneState(SEEDED_STATE);
}

export function createEmptyConversationState(): ConversationState {
  return {
    activeConversationId: null,
    conversations: [],
  };
}
