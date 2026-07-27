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
  it('ignores SSE metadata and supports records with or without a data prefix', async () => {
    const response = createStreamingResponse('text/event-stream', [
      ': keep-alive\n',
      'event: message\nid: 42\n',
      'data: {"delta":"Approved "}\n\n',
      'retry: 1000\n',
      '{"choices":[{"delta":{"content":"content"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const requestFetch = vi.fn().mockResolvedValue(response);
    const onChunk = vi.fn();
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: requestFetch,
    });

    const result = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Prepare approved-content references',
      onChunk,
    });

    expect(result.content).toBe('Approved content');
    expect(onChunk).toHaveBeenNthCalledWith(1, {
      delta: 'Approved ',
      index: 0,
    });
    expect(onChunk).toHaveBeenNthCalledWith(2, {
      delta: 'content',
      index: 1,
    });
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it('parses NDJSON records with or without a data prefix', async () => {
    const response = createStreamingResponse('application/x-ndjson', [
      '{"content":"Audit "}\n',
      'data: {"reply":"ready"}\n',
    ]);
    const onChunk = vi.fn();
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: vi.fn().mockResolvedValue(response),
    });

    const result = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Prepare an auditable Jarvis follow-up',
      onChunk,
    });

    expect(result.content).toBe('Audit ready');
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      name: 'blank JSON string',
      response: () =>
        new Response(JSON.stringify('   '), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    },
    {
      name: 'empty JSON body',
      response: () =>
        new Response('', {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    },
    {
      name: 'empty JSON content',
      response: () =>
        new Response(JSON.stringify({ content: '   ' }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    },
    {
      name: 'unsupported JSON content',
      response: () =>
        new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
    },
    {
      name: 'SSE without supported content',
      response: () =>
        createStreamingResponse('text/event-stream', [
          ': keep-alive\n',
          'event: message\n',
          'data: {"status":"ok"}\n\n',
          'data: [DONE]\n\n',
        ]),
    },
    {
      name: 'NDJSON without supported content',
      response: () =>
        createStreamingResponse('application/x-ndjson', [
          '{"status":"ok"}\n',
          'data: {"type":"heartbeat"}\n',
        ]),
    },
    {
      name: 'empty text',
      response: () =>
        createStreamingResponse('text/plain', []),
    },
  ])('rejects $name as a retryable invalid response', async ({ response }) => {
    const onChunk = vi.fn();
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: vi.fn().mockResolvedValue(response()),
    });

    await expect(
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Prepare a compliant HCP brief',
        onChunk,
      }),
    ).rejects.toMatchObject({
      name: 'ChatApiError',
      code: 'invalid_response',
      retryable: true,
    });
  });

  it('preserves AbortError rejections from the request', async () => {
    const abortError = new DOMException('The request was aborted.', 'AbortError');
    const api = createRemoteChatApi('https://example.test/chat', {
      fetch: vi.fn().mockRejectedValue(abortError),
    });

    await expect(
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Prepare a compliant HCP brief',
        onChunk: vi.fn(),
      }),
    ).rejects.toBe(abortError);
  });
});
