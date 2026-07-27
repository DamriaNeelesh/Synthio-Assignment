import { createMockChatApi, type MockChatApiOptions } from './mockChatApi';
import {
  createRemoteChatApi,
  type RemoteChatApiOptions,
} from './remoteChatApi';
import type { ChatApi } from './types';

export interface CreateChatApiOptions {
  endpoint?: string;
  mock?: MockChatApiOptions;
  remote?: RemoteChatApiOptions;
}

export function createChatApi(options: CreateChatApiOptions = {}): ChatApi {
  const configuredEndpoint: unknown = import.meta.env.VITE_CHAT_API_URL;
  const environmentEndpoint =
    typeof configuredEndpoint === 'string'
      ? configuredEndpoint.trim()
      : undefined;
  const endpoint =
    options.endpoint === undefined
      ? environmentEndpoint
      : options.endpoint.trim();

  return endpoint
    ? createRemoteChatApi(endpoint, options.remote)
    : createMockChatApi(options.mock);
}

export { createMockChatApi, createMockReply } from './mockChatApi';
export { createRemoteChatApi } from './remoteChatApi';
export {
  ChatApiError,
  isAbortError,
  type ChatApi,
  type ChatApiErrorCode,
  type ChatHistoryItem,
  type ChatResponse,
  type ChatStreamCallback,
  type ChatStreamChunk,
  type StreamChatRequest,
} from './types';
export type { MockChatApiOptions } from './mockChatApi';
export type { RemoteChatApiOptions } from './remoteChatApi';
