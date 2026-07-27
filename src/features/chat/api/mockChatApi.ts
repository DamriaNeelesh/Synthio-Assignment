import {
  ChatApiError,
  type ChatApi,
  type ChatResponse,
  type ChatStreamChunk,
  type StreamChatRequest,
} from './types';

export interface MockChatApiOptions {
  initialDelayMs?: number;
  chunkDelayMs?: number;
  wordsPerChunk?: number;
}

const DEFAULT_OPTIONS: Required<MockChatApiOptions> = {
  initialDelayMs: 45,
  chunkDelayMs: 12,
  wordsPerChunk: 4,
};

let mockResponseSequence = 0;

function createMockResponseId(): string {
  mockResponseSequence += 1;
  return `message-mock-${Date.now().toString(36)}-${mockResponseSequence.toString(36)}`;
}

function createAbortError(): DOMException {
  return new DOMException('The request was aborted.', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

async function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

  if (milliseconds <= 0) {
    await Promise.resolve();
    throwIfAborted(signal);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    function handleAbort() {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', handleAbort);
      reject(createAbortError());
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function splitIntoChunks(content: string, wordsPerChunk: number): string[] {
  const words = content.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += wordsPerChunk) {
    chunks.push(words.slice(index, index + wordsPerChunk).join(''));
  }

  return chunks;
}

export function createMockReply(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes('interview') ||
    normalized.includes('prepare')
  ) {
    return 'Let’s make this practical. Frame each answer as context, decision, action, and measurable outcome. Prepare one strong story for ownership, one for ambiguity, and one for collaboration. Rehearse them aloud, keep each under two minutes, and close with thoughtful questions about the team’s priorities and definition of success.';
  }

  if (
    normalized.includes('summarize') ||
    normalized.includes('summary')
  ) {
    return 'Here’s the concise version: identify the central decision, group the supporting evidence into three themes, and end with the next action. Share the source material when you are ready and I’ll turn it into a clear, decision-ready summary.';
  }

  if (
    normalized.includes('plan') ||
    normalized.includes('roadmap') ||
    normalized.includes('launch')
  ) {
    return 'A focused plan has four stages: define the outcome and success metric, choose the smallest useful first milestone, assign owners and checkpoints, then review results and adjust. Start with the highest-risk assumption so you learn early without slowing delivery.';
  }

  if (
    normalized.includes('hello') ||
    normalized.includes('hi ') ||
    normalized === 'hi'
  ) {
    return 'Hi — I’m ready. Ask me to plan a project, summarize research, improve your writing, or think through a difficult decision. I’ll keep the answer clear and actionable.';
  }

  return 'I can help with that. A strong next step is to clarify the outcome, note the constraints, and choose the smallest action that produces useful feedback. If you share a little more context, I’ll turn it into a concise plan with concrete next steps.';
}

export function createMockChatApi(
  options: MockChatApiOptions = {},
): ChatApi {
  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return {
    async streamMessage({
      message,
      signal,
      onChunk,
    }: StreamChatRequest): Promise<ChatResponse> {
      await delay(settings.initialDelayMs, signal);

      if (message.toLowerCase().includes('/error')) {
        throw new ChatApiError(
          'forced_mock_error',
          'The mock assistant was asked to simulate an error.',
          { retryable: true },
        );
      }

      const content = createMockReply(message);
      const chunks = splitIntoChunks(content, settings.wordsPerChunk);

      for (let index = 0; index < chunks.length; index += 1) {
        await delay(settings.chunkDelayMs, signal);
        throwIfAborted(signal);

        const chunk: ChatStreamChunk = {
          delta: chunks[index],
          index,
        };
        await onChunk(chunk);
      }

      throwIfAborted(signal);
      return {
        id: createMockResponseId(),
        content,
        provider: 'mock',
        finishedAt: new Date().toISOString(),
      };
    },
  };
}
