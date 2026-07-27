import { describe, expect, it, vi } from 'vitest';
import { createRemoteChatApi } from './remoteChatApi';

function createStreamingResponse(contentType: string, chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, {
    headers: { 'content-type': contentType },
    status: 200,
  });
}

describe('remote chat API', () => {
  it('ignores SSE metadata and emits only data payload content', async () => {
    const response = createStreamingResponse('text/event-stream', [
      ': keep-alive\n',
      'event: message\nid: 42\n',
      'data: {"delta":"Hello "}\n\n',
      'retry: 1000\n',
      'data: {"choices":[{"delta":{"content":"world"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const requestFetch = vi.fn().mockResolvedValue(response);
    const onChunk = vi.fn();
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: requestFetch,
    });

    const result = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Say hello',
      onChunk,
    });

    expect(result.content).toBe('Hello world');
    expect(onChunk).toHaveBeenNthCalledWith(1, {
      delta: 'Hello ',
      index: 0,
    });
    expect(onChunk).toHaveBeenNthCalledWith(2, {
      delta: 'world',
      index: 1,
    });
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it('parses each NDJSON line as a payload', async () => {
    const response = createStreamingResponse('application/x-ndjson', [
      '{"content":"One "}\n',
      '{"reply":"two"}\n',
    ]);
    const onChunk = vi.fn();
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: vi.fn().mockResolvedValue(response),
    });

    const result = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Count',
      onChunk,
    });

    expect(result.content).toBe('One two');
    expect(onChunk).toHaveBeenCalledTimes(2);
  });
});
