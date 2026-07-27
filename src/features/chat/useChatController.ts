import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  Conversation,
  ConversationId,
  Message,
  MessageId,
} from '../../types';
import { useConversations } from '../conversations';
import {
  ChatApiError,
  createChatApi,
  isAbortError,
  type ChatHistoryItem,
} from './api';

const chatApi = createChatApi();

interface ActiveRequest {
  assistantMessageId: MessageId;
  controller: AbortController;
}

function toHistory(
  conversation: Conversation | undefined,
): ChatHistoryItem[] {
  if (!conversation) {
    return [];
  }

  return conversation.messages.flatMap((message) =>
    message.status === 'complete' && message.content.trim()
      ? [{ role: message.role, content: message.content }]
      : [],
  );
}

function findRetryUserMessage(
  conversation: Conversation,
  assistantMessage: Message,
): Message | undefined {
  const explicitUserId = assistantMessage.retry?.userMessageId;
  if (explicitUserId) {
    return conversation.messages.find(
      (message) => message.id === explicitUserId && message.role === 'user',
    );
  }

  const assistantIndex = conversation.messages.findIndex(
    (message) => message.id === assistantMessage.id,
  );
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (conversation.messages[index]?.role === 'user') {
      return conversation.messages[index];
    }
  }
  return undefined;
}

export function useChatController() {
  const {
    activeConversation,
    activeConversationId,
    appendMessage,
    appendStreamingChunk,
    completeMessage,
    conversations,
    createConversation,
    markMessageError,
    startMessageRetry,
  } = useConversations();
  const requestsRef = useRef(new Map<ConversationId, ActiveRequest>());
  const mountedRef = useRef(true);

  const runAssistant = useCallback(
    async ({
      assistantMessageId,
      conversationId,
      history,
      message,
      userMessageId,
    }: {
      assistantMessageId: MessageId;
      conversationId: ConversationId;
      history: ChatHistoryItem[];
      message: string;
      userMessageId: MessageId;
    }): Promise<string | null> => {
      requestsRef.current.get(conversationId)?.controller.abort();
      const controller = new AbortController();
      requestsRef.current.set(conversationId, {
        assistantMessageId,
        controller,
      });

      try {
        const response = await chatApi.streamMessage({
          conversationId,
          message,
          history,
          signal: controller.signal,
          onChunk: ({ delta }) => {
            if (mountedRef.current) {
              appendStreamingChunk(
                conversationId,
                assistantMessageId,
                delta,
              );
            }
          },
        });

        if (!mountedRef.current) {
          return null;
        }

        completeMessage(
          conversationId,
          assistantMessageId,
          response.content,
        );
        return response.content;
      } catch (error: unknown) {
        if (!mountedRef.current) {
          return null;
        }

        const wasAborted = isAbortError(error);
        const chatError =
          error instanceof ChatApiError
            ? error
            : new ChatApiError(
                'request_failed',
                'Synthio Assistant could not complete that response.',
                { cause: error, retryable: true },
              );

        markMessageError(
          conversationId,
          assistantMessageId,
          {
            code: wasAborted ? 'aborted' : chatError.code,
            message: wasAborted
              ? 'Response stopped. You can retry when ready.'
              : chatError.message,
            retryable: wasAborted || chatError.retryable,
          },
          userMessageId,
        );
        return null;
      } finally {
        const activeRequest = requestsRef.current.get(conversationId);
        if (activeRequest?.assistantMessageId === assistantMessageId) {
          requestsRef.current.delete(conversationId);
        }
      }
    },
    [
      appendStreamingChunk,
      completeMessage,
      markMessageError,
    ],
  );

  const sendMessage = useCallback(
    async (content: string): Promise<string | null> => {
      const message = content.trim();
      if (!message) {
        return null;
      }

      const conversation =
        activeConversation ??
        conversations.find(
          (candidate) => candidate.id === activeConversationId,
        );
      const conversationId =
        conversation?.id ?? createConversation();
      const history = toHistory(conversation);
      const userMessageId = appendMessage(conversationId, {
        role: 'user',
        content: message,
        status: 'complete',
      });
      const assistantMessageId = appendMessage(conversationId, {
        role: 'assistant',
        content: '',
        status: 'streaming',
        retry: {
          attempt: 1,
          lastAttemptAt: new Date().toISOString(),
          userMessageId,
        },
      });

      return runAssistant({
        assistantMessageId,
        conversationId,
        history,
        message,
        userMessageId,
      });
    },
    [
      activeConversation,
      activeConversationId,
      appendMessage,
      conversations,
      createConversation,
      runAssistant,
    ],
  );

  const retryMessage = useCallback(
    async (
      conversationId: ConversationId,
      assistantMessageId: MessageId,
    ): Promise<string | null> => {
      const conversation = conversations.find(
        (candidate) => candidate.id === conversationId,
      );
      const assistantMessage = conversation?.messages.find(
        (message) => message.id === assistantMessageId,
      );
      if (!conversation || !assistantMessage) {
        return null;
      }

      const userMessage = findRetryUserMessage(
        conversation,
        assistantMessage,
      );
      if (!userMessage) {
        return null;
      }

      const userIndex = conversation.messages.findIndex(
        (message) => message.id === userMessage.id,
      );
      const history = conversation.messages
        .slice(0, userIndex)
        .flatMap((message) =>
          message.status === 'complete' && message.content.trim()
            ? [{ role: message.role, content: message.content }]
            : [],
        );

      startMessageRetry(
        conversationId,
        assistantMessageId,
        userMessage.id,
      );

      return runAssistant({
        assistantMessageId,
        conversationId,
        history,
        message: userMessage.content,
        userMessageId: userMessage.id,
      });
    },
    [conversations, runAssistant, startMessageRetry],
  );

  const stopGeneration = useCallback(
    (conversationId = activeConversationId) => {
      if (!conversationId) {
        return;
      }
      requestsRef.current.get(conversationId)?.controller.abort();
    },
    [activeConversationId],
  );

  useEffect(() => {
    mountedRef.current = true;
    const requests = requestsRef.current;
    return () => {
      mountedRef.current = false;
      requests.forEach(({ controller }) => controller.abort());
      requests.clear();
    };
  }, []);

  const isGenerating = useMemo(
    () =>
      activeConversation?.messages.some(
        (message) => message.status === 'streaming',
      ) ?? false,
    [activeConversation?.messages],
  );

  return {
    isGenerating,
    retryMessage,
    sendMessage,
    stopGeneration,
  };
}
