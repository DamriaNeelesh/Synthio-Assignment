import { describe, expect, it } from 'vitest';
import { createMockChatApi, createMockReply } from './mockChatApi';

const TEST_OPTIONS = {
  initialDelayMs: 0,
  chunkDelayMs: 0,
  wordsPerChunk: 3,
};

describe('mock chat API', () => {
  it('streams an awaited deterministic response in order', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const chunks: string[] = [];
    const indexes: number[] = [];
    let callbackInProgress = false;

    const response = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Create a launch plan',
      onChunk: async ({ delta, index }) => {
        expect(callbackInProgress).toBe(false);
        callbackInProgress = true;
        await Promise.resolve();
        chunks.push(delta);
        indexes.push(index);
        callbackInProgress = false;
      },
    });

    expect(response.provider).toBe('mock');
    expect(chunks.join('')).toBe(response.content);
    expect(response.content).toBe(createMockReply('Create a launch plan'));
    expect(indexes).toEqual(indexes.map((_, index) => index));
  });

  it('returns identical content for identical prompts', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const run = () =>
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Help me prepare for an interview',
        onChunk: () => undefined,
      });

    const [first, second] = await Promise.all([run(), run()]);
    expect(first.content).toBe(second.content);
  });

  it('simulates failures only when explicitly requested', async () => {
    const api = createMockChatApi(TEST_OPTIONS);

    await expect(
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Please /error so I can test retry UX',
        onChunk: () => undefined,
      }),
    ).rejects.toMatchObject({
      name: 'ChatApiError',
      code: 'forced_mock_error',
      retryable: true,
    });
  });

  it('honors AbortSignal before and during streaming', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const controller = new AbortController();

    const request = api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Create a detailed plan',
      signal: controller.signal,
      onChunk: ({ index }) => {
        if (index === 0) {
          controller.abort();
        }
      },
    });

    await expect(request).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
