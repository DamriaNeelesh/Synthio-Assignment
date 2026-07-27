import type {
  ConversationId,
  MessageId,
  MessageRole,
} from '../../../types';

export interface ChatHistoryItem {
  role: MessageRole;
  content: string;
}

export interface ChatStreamChunk {
  delta: string;
  index: number;
}

export type ChatStreamCallback = (
  chunk: ChatStreamChunk,
) => void | Promise<void>;

export interface StreamChatRequest {
  conversationId: ConversationId;
  message: string;
  history?: readonly ChatHistoryItem[];
  signal?: AbortSignal;
  onChunk: ChatStreamCallback;
}

export interface ChatResponse {
  id: MessageId;
  content: string;
  provider: 'mock' | 'remote';
  finishedAt: string;
}

export interface ChatApi {
  streamMessage(request: StreamChatRequest): Promise<ChatResponse>;
}

export type ChatApiErrorCode =
  | 'aborted'
  | 'forced_mock_error'
  | 'invalid_response'
  | 'request_failed';

export class ChatApiError extends Error {
  readonly code: ChatApiErrorCode;
  readonly retryable: boolean;
  readonly status?: number;

  constructor(
    code: ChatApiErrorCode,
    message: string,
    options?: { retryable?: boolean; status?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ChatApiError';
    this.code = code;
    this.retryable = options?.retryable ?? true;
    this.status = options?.status;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof ChatApiError && error.code === 'aborted')
  );
}
