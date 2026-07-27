import { describe, expect, it } from 'vitest';
import type { ConversationState } from '../../types';
import {
  createEmptyConversationState,
  createSeededConversationState,
} from './seed';
import {
  CONVERSATION_STORAGE_KEY,
  CONVERSATION_STORAGE_VERSION,
  loadConversationState,
  saveConversationState,
  type ConversationStorage,
} from './storage';

class MemoryStorage implements ConversationStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createState(): ConversationState {
  return {
    activeConversationId: 'conversation-1',
    conversations: [
      {
        id: 'conversation-1',
        title: 'Saved conversation',
        createdAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:01:00.000Z',
        messages: [
          {
            id: 'message-1',
            role: 'assistant',
            content: 'Saved response',
            createdAt: '2026-07-28T10:01:00.000Z',
            status: 'complete',
          },
        ],
      },
    ],
  };
}

describe('conversation storage', () => {
  it('round-trips state in a versioned envelope', () => {
    const storage = new MemoryStorage();
    const state = createState();

    expect(saveConversationState(state, storage)).toBe(true);
    expect(
      JSON.parse(storage.values.get(CONVERSATION_STORAGE_KEY) ?? ''),
    ).toMatchObject({
      version: CONVERSATION_STORAGE_VERSION,
    });
    expect(loadConversationState(storage)).toEqual(state);
  });

  it('recovers an in-flight response as a retryable interruption', () => {
    const storage = new MemoryStorage();
    const state = createState();
    state.conversations[0].messages.push({
      id: 'message-streaming',
      role: 'assistant',
      content: 'A partial response',
      createdAt: '2026-07-28T10:02:00.000Z',
      status: 'streaming',
      retry: {
        attempt: 1,
        lastAttemptAt: '2026-07-28T10:02:00.000Z',
        userMessageId: 'message-1',
      },
    });

    expect(saveConversationState(state, storage)).toBe(true);
    const recoveredMessage =
      loadConversationState(storage).conversations[0].messages.at(-1);

    expect(recoveredMessage).toMatchObject({
      id: 'message-streaming',
      status: 'error',
      error: {
        code: 'interrupted',
        retryable: true,
      },
    });
  });

  it.each([
    ['malformed JSON', '{not-json'],
    [
      'an unsupported version',
      JSON.stringify({
        version: CONVERSATION_STORAGE_VERSION + 1,
        state: createState(),
      }),
    ],
    [
      'an invalid active conversation',
      JSON.stringify({
        version: CONVERSATION_STORAGE_VERSION,
        state: {
          ...createEmptyConversationState(),
          activeConversationId: 'missing',
        },
      }),
    ],
  ])('falls back to fresh seed data for %s', (_label, serialized) => {
    const storage = new MemoryStorage();
    storage.values.set(CONVERSATION_STORAGE_KEY, serialized);

    const firstLoad = loadConversationState(storage);
    const secondLoad = loadConversationState(storage);

    expect(firstLoad.conversations.length).toBeGreaterThan(0);
    expect(firstLoad.activeConversationId).not.toBeNull();
    expect(secondLoad).toEqual(firstLoad);
    expect(secondLoad).not.toBe(firstLoad);
    expect(secondLoad.conversations[0]).not.toBe(firstLoad.conversations[0]);
  });

  it('contains storage exceptions and returns a safe fallback', () => {
    const unavailableStorage: ConversationStorage = {
      getItem() {
        throw new Error('Storage is unavailable');
      },
      setItem() {
        throw new Error('Storage is unavailable');
      },
    };

    expect(loadConversationState(unavailableStorage).conversations).toHaveLength(
      createSeededConversationState().conversations.length,
    );
    expect(
      saveConversationState(createState(), unavailableStorage),
    ).toBe(false);
  });
});
