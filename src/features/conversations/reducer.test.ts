import { describe, expect, it } from 'vitest';
import type { Conversation, ConversationState, Message } from '../../types';
import { conversationReducer, deriveConversationTitle } from './reducer';
import {
  createEmptyConversationState,
  DEFAULT_CONVERSATION_TITLE,
} from './seed';

const CREATED_AT = '2026-07-28T10:00:00.000Z';
const UPDATED_AT = '2026-07-28T10:01:00.000Z';

function createConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id: 'conversation-1',
    title: DEFAULT_CONVERSATION_TITLE,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    messages: [],
    ...overrides,
  };
}

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    role: 'user',
    content:
      'Design a compliant Jarvis pre-call brief from a fictional CRM record.',
    createdAt: UPDATED_AT,
    status: 'complete',
    ...overrides,
  };
}

describe('conversationReducer', () => {
  it('creates, selects, renames, and deletes conversations predictably', () => {
    const firstConversation = createConversation();
    const secondConversation = createConversation({
      id: 'conversation-2',
      title: 'Ather scientific exchange',
    });

    let state = conversationReducer(createEmptyConversationState(), {
      type: 'conversation/created',
      conversation: firstConversation,
    });
    state = conversationReducer(state, {
      type: 'conversation/created',
      conversation: secondConversation,
    });

    expect(state.activeConversationId).toBe('conversation-2');
    expect(state.conversations.map(({ id }) => id)).toEqual([
      'conversation-2',
      'conversation-1',
    ]);

    state = conversationReducer(state, {
      type: 'conversation/selected',
      conversationId: 'conversation-1',
    });
    state = conversationReducer(state, {
      type: 'conversation/renamed',
      conversationId: 'conversation-1',
      title: '  Helix   onboarding  ',
      at: UPDATED_AT,
    });

    expect(state.activeConversationId).toBe('conversation-1');
    expect(state.conversations[0].title).toBe('Helix onboarding');

    state = conversationReducer(state, {
      type: 'conversation/deleted',
      conversationId: 'conversation-1',
    });

    expect(state.activeConversationId).toBe('conversation-2');
    expect(state.conversations).toHaveLength(1);
  });

  it('derives the title from the first user message without mutating prior state', () => {
    const initial: ConversationState = {
      activeConversationId: 'conversation-1',
      conversations: [createConversation()],
    };
    const message = createMessage();

    const next = conversationReducer(initial, {
      type: 'message/appended',
      conversationId: 'conversation-1',
      message,
    });

    expect(initial.conversations[0].messages).toHaveLength(0);
    expect(initial.conversations[0].title).toBe(DEFAULT_CONVERSATION_TITLE);
    expect(next.conversations[0].messages).toEqual([message]);
    expect(next.conversations[0].title).toBe(
      deriveConversationTitle(message.content),
    );
    expect(
      deriveConversationTitle(
        'Prepare a detailed synthetic Simulation Studio concept test for diverse HCP personas',
      ),
    ).toMatch(/…$/);
  });

  it('streams, completes, fails, and retries an assistant message', () => {
    const assistantMessage = createMessage({
      id: 'message-assistant',
      role: 'assistant',
      content: '',
      status: 'streaming',
    });
    let state: ConversationState = {
      activeConversationId: 'conversation-1',
      conversations: [
        createConversation({
          messages: [assistantMessage],
        }),
      ],
    };

    state = conversationReducer(state, {
      type: 'message/stream-chunk',
      conversationId: 'conversation-1',
      messageId: 'message-assistant',
      delta: 'Approved ',
      at: UPDATED_AT,
    });
    state = conversationReducer(state, {
      type: 'message/stream-chunk',
      conversationId: 'conversation-1',
      messageId: 'message-assistant',
      delta: 'workflow',
      at: UPDATED_AT,
    });
    state = conversationReducer(state, {
      type: 'message/completed',
      conversationId: 'conversation-1',
      messageId: 'message-assistant',
      at: UPDATED_AT,
    });

    expect(state.conversations[0].messages[0]).toMatchObject({
      content: 'Approved workflow',
      status: 'complete',
    });

    state = conversationReducer(state, {
      type: 'message/failed',
      conversationId: 'conversation-1',
      messageId: 'message-assistant',
      at: UPDATED_AT,
      error: {
        code: 'request_failed',
        message: 'Please try again.',
        retryable: true,
      },
      retry: {
        attempt: 1,
        lastAttemptAt: UPDATED_AT,
        userMessageId: 'message-user',
      },
    });

    expect(state.conversations[0].messages[0]).toMatchObject({
      status: 'error',
      retry: {
        attempt: 1,
        userMessageId: 'message-user',
      },
    });

    state = conversationReducer(state, {
      type: 'message/retry-started',
      conversationId: 'conversation-1',
      messageId: 'message-assistant',
      at: '2026-07-28T10:02:00.000Z',
      clearContent: true,
    });

    expect(state.conversations[0].messages[0]).toMatchObject({
      content: '',
      status: 'streaming',
      retry: {
        attempt: 2,
        userMessageId: 'message-user',
      },
    });
    expect(state.conversations[0].messages[0].error).toBeUndefined();
  });

  it('ignores actions targeting unknown conversations or messages', () => {
    const state: ConversationState = {
      activeConversationId: 'conversation-1',
      conversations: [createConversation()],
    };

    expect(
      conversationReducer(state, {
        type: 'conversation/selected',
        conversationId: 'missing',
      }),
    ).toBe(state);
    expect(
      conversationReducer(state, {
        type: 'message/completed',
        conversationId: 'conversation-1',
        messageId: 'missing',
        at: UPDATED_AT,
      }),
    ).toBe(state);
  });
});
