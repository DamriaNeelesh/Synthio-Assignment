import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ConversationId,
  ConversationState,
  Message,
  MessageError,
  MessageId,
  MessageRetryMetadata,
  NewMessage,
} from '../../types';
import {
  ConversationContext,
  type ConversationContextValue,
} from './context';
import { conversationReducer } from './reducer';
import {
  DEFAULT_CONVERSATION_TITLE,
} from './seed';
import {
  loadConversationState,
  resolveBrowserStorage,
  saveConversationState,
  type ConversationStorage,
} from './storage';

let fallbackIdSequence = 0;

function createId(prefix: 'conversation' | 'message'): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackIdSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackIdSequence.toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

export interface ConversationProviderProps {
  children: ReactNode;
  initialState?: ConversationState;
  storage?: ConversationStorage | null;
}

export function ConversationProvider({
  children,
  initialState,
  storage,
}: ConversationProviderProps) {
  const [resolvedStorage] = useState<ConversationStorage | null>(() =>
    storage === undefined ? resolveBrowserStorage() : storage,
  );
  const [state, dispatch] = useReducer(
    conversationReducer,
    undefined,
    (): ConversationState =>
      initialState
        ? {
            ...initialState,
            conversations: initialState.conversations.map((conversation) => ({
              ...conversation,
              messages: conversation.messages.map((message) => ({
                ...message,
              })),
            })),
          }
        : loadConversationState(resolvedStorage),
  );
  const stateRef = useRef(state);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
    if (persistTimerRef.current !== null) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      saveConversationState(stateRef.current, resolvedStorage);
    }, 140);
  }, [resolvedStorage, state]);

  useEffect(
    () => () => {
      if (persistTimerRef.current !== null) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      saveConversationState(stateRef.current, resolvedStorage);
    },
    [resolvedStorage],
  );

  const createConversation = useCallback(
    (title = DEFAULT_CONVERSATION_TITLE): ConversationId => {
      const conversationId = createId('conversation');
      const createdAt = now();
      dispatch({
        type: 'conversation/created',
        conversation: {
          id: conversationId,
          title: title.trim() || DEFAULT_CONVERSATION_TITLE,
          createdAt,
          updatedAt: createdAt,
          messages: [],
        },
      });
      return conversationId;
    },
    [],
  );

  const selectConversation = useCallback(
    (conversationId: ConversationId) => {
      dispatch({ type: 'conversation/selected', conversationId });
    },
    [],
  );

  const deleteConversation = useCallback(
    (conversationId: ConversationId) => {
      dispatch({ type: 'conversation/deleted', conversationId });
    },
    [],
  );

  const renameConversation = useCallback(
    (conversationId: ConversationId, title: string) => {
      dispatch({
        type: 'conversation/renamed',
        conversationId,
        title,
        at: now(),
      });
    },
    [],
  );

  const appendMessage = useCallback(
    (conversationId: ConversationId, input: NewMessage): MessageId => {
      const messageId = createId('message');
      const message: Message = {
        id: messageId,
        role: input.role,
        content: input.content,
        createdAt: now(),
        status: input.status ?? 'complete',
        retry: input.retry,
      };

      dispatch({
        type: 'message/appended',
        conversationId,
        message,
      });
      return messageId;
    },
    [],
  );

  const ensureConversation = useCallback(
    (conversationId?: ConversationId): ConversationId => {
      const requestedConversationExists =
        conversationId !== undefined &&
        stateRef.current.conversations.some(
          (conversation) => conversation.id === conversationId,
        );
      if (requestedConversationExists) {
        return conversationId;
      }

      const activeConversationId = stateRef.current.activeConversationId;
      if (
        !conversationId &&
        activeConversationId &&
        stateRef.current.conversations.some(
          (conversation) => conversation.id === activeConversationId,
        )
      ) {
        return activeConversationId;
      }

      return createConversation();
    },
    [createConversation],
  );

  const appendUserMessage = useCallback(
    (content: string, conversationId?: ConversationId): MessageId =>
      appendMessage(ensureConversation(conversationId), {
        role: 'user',
        content,
        status: 'complete',
      }),
    [appendMessage, ensureConversation],
  );

  const appendAssistantMessage = useCallback(
    (content: string, conversationId?: ConversationId): MessageId =>
      appendMessage(ensureConversation(conversationId), {
        role: 'assistant',
        content,
        status: 'complete',
      }),
    [appendMessage, ensureConversation],
  );

  const startAssistantMessage = useCallback(
    (
      conversationId?: ConversationId,
      retry?: MessageRetryMetadata,
    ): MessageId =>
      appendMessage(ensureConversation(conversationId), {
        role: 'assistant',
        content: '',
        status: 'streaming',
        retry,
      }),
    [appendMessage, ensureConversation],
  );

  const appendStreamingChunk = useCallback(
    (
      conversationId: ConversationId,
      messageId: MessageId,
      delta: string,
    ) => {
      dispatch({
        type: 'message/stream-chunk',
        conversationId,
        messageId,
        delta,
        at: now(),
      });
    },
    [],
  );

  const completeMessage = useCallback(
    (
      conversationId: ConversationId,
      messageId: MessageId,
      content?: string,
    ) => {
      dispatch({
        type: 'message/completed',
        conversationId,
        messageId,
        content,
        at: now(),
      });
    },
    [],
  );

  const markMessageError = useCallback(
    (
      conversationId: ConversationId,
      messageId: MessageId,
      error: MessageError,
      userMessageId?: MessageId,
    ) => {
      const previousMessage = stateRef.current.conversations
        .find((conversation) => conversation.id === conversationId)
        ?.messages.find((message) => message.id === messageId);
      const failedAt = now();
      dispatch({
        type: 'message/failed',
        conversationId,
        messageId,
        at: failedAt,
        error,
        retry: {
          attempt: Math.max(1, previousMessage?.retry?.attempt ?? 1),
          lastAttemptAt: failedAt,
          userMessageId:
            userMessageId ?? previousMessage?.retry?.userMessageId,
        },
      });
    },
    [],
  );

  const startMessageRetry = useCallback(
    (
      conversationId: ConversationId,
      messageId: MessageId,
      userMessageId?: MessageId,
    ) => {
      dispatch({
        type: 'message/retry-started',
        conversationId,
        messageId,
        at: now(),
        userMessageId,
        clearContent: true,
      });
    },
    [],
  );

  const activeConversation =
    state.conversations.find(
      (conversation) => conversation.id === state.activeConversationId,
    ) ?? null;

  const value = useMemo<ConversationContextValue>(
    () => ({
      state,
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
      activeConversation,
      createConversation,
      selectConversation,
      deleteConversation,
      renameConversation,
      appendMessage,
      appendUserMessage,
      appendAssistantMessage,
      startAssistantMessage,
      appendStreamingChunk,
      completeMessage,
      markMessageError,
      startMessageRetry,
    }),
    [
      activeConversation,
      appendAssistantMessage,
      appendMessage,
      appendStreamingChunk,
      appendUserMessage,
      completeMessage,
      createConversation,
      deleteConversation,
      markMessageError,
      renameConversation,
      selectConversation,
      startAssistantMessage,
      startMessageRetry,
      state,
    ],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}
