import type {
  Conversation,
  ConversationState,
  Message,
  MessageError,
  MessageRetryMetadata,
} from '../../types';
import { createSeededConversationState } from './seed';

export const CONVERSATION_STORAGE_KEY = 'synthex.conversations';
export const CONVERSATION_STORAGE_VERSION = 1;

export interface ConversationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

interface PersistedConversationState {
  version: typeof CONVERSATION_STORAGE_VERSION;
  state: ConversationState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function isMessageError(value: unknown): value is MessageError {
  return (
    isRecord(value) &&
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.message) &&
    typeof value.retryable === 'boolean'
  );
}

function isRetryMetadata(value: unknown): value is MessageRetryMetadata {
  return (
    isRecord(value) &&
    typeof value.attempt === 'number' &&
    Number.isInteger(value.attempt) &&
    value.attempt > 0 &&
    isTimestamp(value.lastAttemptAt) &&
    (value.userMessageId === undefined ||
      isNonEmptyString(value.userMessageId))
  );
}

function isMessage(value: unknown): value is Message {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidError =
    value.error === undefined || isMessageError(value.error);
  const hasValidRetry =
    value.retry === undefined || isRetryMetadata(value.retry);

  return (
    isNonEmptyString(value.id) &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string' &&
    isTimestamp(value.createdAt) &&
    (value.status === 'complete' ||
      value.status === 'streaming' ||
      value.status === 'error') &&
    hasValidError &&
    hasValidRetry &&
    (value.status !== 'error' || isMessageError(value.error))
  );
}

function isConversation(value: unknown): value is Conversation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt) &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  );
}

function isConversationState(value: unknown): value is ConversationState {
  if (
    !isRecord(value) ||
    !Array.isArray(value.conversations) ||
    !value.conversations.every(isConversation) ||
    !(
      value.activeConversationId === null ||
      isNonEmptyString(value.activeConversationId)
    )
  ) {
    return false;
  }

  const conversationIds = new Set(
    value.conversations.map((conversation) => conversation.id),
  );
  const hasUniqueConversationIds =
    conversationIds.size === value.conversations.length;
  const activeConversationExists =
    value.activeConversationId === null ||
    conversationIds.has(value.activeConversationId);

  return hasUniqueConversationIds && activeConversationExists;
}

function cloneConversationState(state: ConversationState): ConversationState {
  return {
    activeConversationId: state.activeConversationId,
    conversations: state.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => {
        if (message.status === 'streaming') {
          return {
            ...message,
            status: 'error',
            error: {
              code: 'interrupted',
              message:
                'This response was interrupted by a refresh. Retry to continue.',
              retryable: true,
            },
            retry: message.retry
              ? { ...message.retry }
              : {
                  attempt: 1,
                  lastAttemptAt: message.createdAt,
                },
          };
        }

        return {
          ...message,
          error: message.error ? { ...message.error } : undefined,
          retry: message.retry ? { ...message.retry } : undefined,
        };
      }),
    })),
  };
}

export function resolveBrowserStorage(): ConversationStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadConversationState(
  storage: ConversationStorage | null = resolveBrowserStorage(),
): ConversationState {
  if (!storage) {
    return createSeededConversationState();
  }

  try {
    const serialized = storage.getItem(CONVERSATION_STORAGE_KEY);
    if (!serialized) {
      return createSeededConversationState();
    }

    const parsed: unknown = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.version !== CONVERSATION_STORAGE_VERSION ||
      !isConversationState(parsed.state)
    ) {
      return createSeededConversationState();
    }

    return cloneConversationState(parsed.state);
  } catch {
    return createSeededConversationState();
  }
}

export function saveConversationState(
  state: ConversationState,
  storage: ConversationStorage | null = resolveBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  const payload: PersistedConversationState = {
    version: CONVERSATION_STORAGE_VERSION,
    state,
  };

  try {
    storage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
