import {
  ChatApiError,
  type ChatApi,
  type ChatHistoryItem,
  type ChatResponse,
  type ChatStreamCallback,
  type StreamChatRequest,
} from './types';

export interface RemoteChatApiOptions {
  fetch?: typeof globalThis.fetch;
}

let remoteResponseSequence = 0;

function createRemoteResponseId(): string {
  remoteResponseSequence += 1;
  return `message-remote-${Date.now().toString(36)}-${remoteResponseSequence.toString(36)}`;
}

function extractContent(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.content === 'string') {
    return record.content;
  }
  if (typeof record.reply === 'string') {
    return record.reply;
  }
  if (typeof record.delta === 'string') {
    return record.delta;
  }

  const message = record.message;
  if (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as Record<string, unknown>).content === 'string'
  ) {
    return (message as Record<string, string>).content;
  }

  const choices = record.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const firstChoice: unknown = (choices as unknown[])[0];
    if (typeof firstChoice === 'object' && firstChoice !== null) {
      const choiceRecord = firstChoice as Record<string, unknown>;
      return (
        extractContent(choiceRecord.delta) ??
        extractContent(choiceRecord.message) ??
        extractContent(choiceRecord.text)
      );
    }
  }

  return null;
}

async function emitChunk(
  content: string,
  index: number,
  onChunk: ChatStreamCallback,
): Promise<void> {
  if (content) {
    await onChunk({ delta: content, index });
  }
}

function parseEventData(line: string, isEventStream: boolean): string | null {
  if (isEventStream && !line.startsWith('data:')) {
    return null;
  }

  const value = isEventStream ? line.slice(5).trimStart() : line;
  if (!value || value === '[DONE]') {
    return null;
  }

  try {
    return extractContent(JSON.parse(value)) ?? '';
  } catch {
    return value;
  }
}

async function consumeLineStream(
  response: Response,
  onChunk: ChatStreamCallback,
  isEventStream: boolean,
): Promise<string> {
  if (!response.body) {
    throw new ChatApiError(
      'invalid_response',
      'The chat endpoint returned an empty response.',
      { retryable: true },
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let completeContent = '';
  let chunkIndex = 0;

  while (true) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value, { stream: !done });
    const lines = pending.split(/\r?\n/);
    pending = done ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      const delta = parseEventData(line, isEventStream);
      if (delta) {
        completeContent += delta;
        await emitChunk(delta, chunkIndex, onChunk);
        chunkIndex += 1;
      }
    }

    if (done) {
      if (pending) {
        const delta = parseEventData(pending, isEventStream);
        if (delta) {
          completeContent += delta;
          await emitChunk(delta, chunkIndex, onChunk);
        }
      }
      break;
    }
  }

  return completeContent;
}

async function consumeTextStream(
  response: Response,
  onChunk: ChatStreamCallback,
): Promise<string> {
  if (!response.body) {
    throw new ChatApiError(
      'invalid_response',
      'The chat endpoint returned an empty response.',
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let completeContent = '';
  let chunkIndex = 0;

  while (true) {
    const { done, value } = await reader.read();
    const delta = decoder.decode(value, { stream: !done });
    if (delta) {
      completeContent += delta;
      await emitChunk(delta, chunkIndex, onChunk);
      chunkIndex += 1;
    }

    if (done) {
      break;
    }
  }

  return completeContent;
}

function createPayload(
  request: StreamChatRequest,
): {
  conversationId: string;
  message: string;
  messages: ChatHistoryItem[];
  stream: true;
} {
  return {
    conversationId: request.conversationId,
    message: request.message,
    messages: [
      ...(request.history ?? []),
      { role: 'user', content: request.message },
    ],
    stream: true,
  };
}

export function createRemoteChatApi(
  endpoint: string,
  options: RemoteChatApiOptions = {},
): ChatApi {
  const normalizedEndpoint = endpoint.trim();
  if (!normalizedEndpoint) {
    throw new Error('A non-empty chat API endpoint is required.');
  }

  const requestFetch = options.fetch ?? globalThis.fetch;

  return {
    async streamMessage(request: StreamChatRequest): Promise<ChatResponse> {
      let response: Response;
      try {
        response = await requestFetch(normalizedEndpoint, {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream, application/json, text/plain',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createPayload(request)),
          signal: request.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        throw new ChatApiError(
          'request_failed',
          'Unable to reach the chat service. Please try again.',
          { cause: error, retryable: true },
        );
      }

      if (!response.ok) {
        throw new ChatApiError(
          'request_failed',
          `The chat service returned ${response.status}.`,
          {
            retryable: response.status === 408 || response.status === 429 || response.status >= 500,
            status: response.status,
          },
        );
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      let content: string;

      if (contentType.includes('application/json')) {
        const body: unknown = await response.json();
        const parsedContent = extractContent(body);
        if (parsedContent === null) {
          throw new ChatApiError(
            'invalid_response',
            'The chat service returned an unsupported response.',
            { retryable: false },
          );
        }
        content = parsedContent;
        await emitChunk(content, 0, request.onChunk);
      } else if (
        contentType.includes('text/event-stream') ||
        contentType.includes('application/x-ndjson')
      ) {
        content = await consumeLineStream(
          response,
          request.onChunk,
          contentType.includes('text/event-stream'),
        );
      } else {
        content = await consumeTextStream(response, request.onChunk);
      }

      return {
        id: createRemoteResponseId(),
        content,
        provider: 'remote',
        finishedAt: new Date().toISOString(),
      };
    },
  };
}
