import type {
  Conversation,
  ConversationId,
  ConversationState,
  IsoTimestamp,
  Message,
  MessageError,
  MessageId,
  MessageRetryMetadata,
} from '../../types';
import { DEFAULT_CONVERSATION_TITLE } from './seed';

export type ConversationAction =
  | {
      type: 'conversation/created';
      conversation: Conversation;
    }
  | {
      type: 'conversation/selected';
      conversationId: ConversationId;
    }
  | {
      type: 'conversation/deleted';
      conversationId: ConversationId;
    }
  | {
      type: 'conversation/renamed';
      conversationId: ConversationId;
      title: string;
      at: IsoTimestamp;
    }
  | {
      type: 'message/appended';
      conversationId: ConversationId;
      message: Message;
    }
  | {
      type: 'message/stream-chunk';
      conversationId: ConversationId;
      messageId: MessageId;
      delta: string;
      at: IsoTimestamp;
    }
  | {
      type: 'message/completed';
      conversationId: ConversationId;
      messageId: MessageId;
      at: IsoTimestamp;
      content?: string;
    }
  | {
      type: 'message/failed';
      conversationId: ConversationId;
      messageId: MessageId;
      at: IsoTimestamp;
      error: MessageError;
      retry: MessageRetryMetadata;
    }
  | {
      type: 'message/retry-started';
      conversationId: ConversationId;
      messageId: MessageId;
      at: IsoTimestamp;
      userMessageId?: MessageId;
      clearContent?: boolean;
    };

const TITLE_MAX_LENGTH = 48;

export function deriveConversationTitle(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  if (normalized.length <= TITLE_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}

function moveConversationToFront(
  conversations: Conversation[],
  conversationId: ConversationId,
): Conversation[] {
  const index = conversations.findIndex(
    (conversation) => conversation.id === conversationId,
  );

  if (index <= 0) {
    return conversations;
  }

  return [
    conversations[index],
    ...conversations.slice(0, index),
    ...conversations.slice(index + 1),
  ];
}

function updateConversation(
  state: ConversationState,
  conversationId: ConversationId,
  updater: (conversation: Conversation) => Conversation,
): ConversationState {
  let changed = false;
  const updated = state.conversations.map((conversation) => {
    if (conversation.id !== conversationId) {
      return conversation;
    }

    const nextConversation = updater(conversation);
    changed ||= nextConversation !== conversation;
    return nextConversation;
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    conversations: moveConversationToFront(updated, conversationId),
  };
}

function updateMessage(
  state: ConversationState,
  conversationId: ConversationId,
  messageId: MessageId,
  at: IsoTimestamp,
  updater: (message: Message) => Message,
): ConversationState {
  return updateConversation(state, conversationId, (conversation) => {
    let changed = false;
    const messages = conversation.messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      const nextMessage = updater(message);
      changed ||= nextMessage !== message;
      return nextMessage;
    });

    return changed
      ? {
          ...conversation,
          updatedAt: at,
          messages,
        }
      : conversation;
  });
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'conversation/created': {
      if (
        state.conversations.some(
          (conversation) => conversation.id === action.conversation.id,
        )
      ) {
        return state;
      }

      return {
        activeConversationId: action.conversation.id,
        conversations: [action.conversation, ...state.conversations],
      };
    }

    case 'conversation/selected': {
      const exists = state.conversations.some(
        (conversation) => conversation.id === action.conversationId,
      );
      if (!exists || state.activeConversationId === action.conversationId) {
        return state;
      }

      return {
        ...state,
        activeConversationId: action.conversationId,
      };
    }

    case 'conversation/deleted': {
      const deletedIndex = state.conversations.findIndex(
        (conversation) => conversation.id === action.conversationId,
      );
      if (deletedIndex === -1) {
        return state;
      }

      const conversations = state.conversations.filter(
        (conversation) => conversation.id !== action.conversationId,
      );
      const activeConversationId =
        state.activeConversationId === action.conversationId
          ? (conversations[Math.min(deletedIndex, conversations.length - 1)]
              ?.id ?? null)
          : state.activeConversationId;

      return {
        conversations,
        activeConversationId,
      };
    }

    case 'conversation/renamed': {
      const title = action.title.replace(/\s+/g, ' ').trim();
      if (!title) {
        return state;
      }

      return updateConversation(
        state,
        action.conversationId,
        (conversation) =>
          conversation.title === title
            ? conversation
            : {
                ...conversation,
                title,
                updatedAt: action.at,
              },
      );
    }

    case 'message/appended': {
      return updateConversation(state, action.conversationId, (conversation) => {
        if (
          conversation.messages.some(
            (message) => message.id === action.message.id,
          )
        ) {
          return conversation;
        }

        const shouldDeriveTitle =
          action.message.role === 'user' &&
          conversation.title === DEFAULT_CONVERSATION_TITLE &&
          conversation.messages.length === 0;

        return {
          ...conversation,
          title: shouldDeriveTitle
            ? deriveConversationTitle(action.message.content)
            : conversation.title,
          updatedAt: action.message.createdAt,
          messages: [...conversation.messages, action.message],
        };
      });
    }

    case 'message/stream-chunk': {
      if (!action.delta) {
        return state;
      }

      return updateMessage(
        state,
        action.conversationId,
        action.messageId,
        action.at,
        (message) => {
          if (message.role !== 'assistant' || message.status === 'error') {
            return message;
          }

          return {
            ...message,
            content: `${message.content}${action.delta}`,
            status: 'streaming',
          };
        },
      );
    }

    case 'message/completed': {
      return updateMessage(
        state,
        action.conversationId,
        action.messageId,
        action.at,
        (message) => ({
          ...message,
          content: action.content ?? message.content,
          status: 'complete',
          error: undefined,
        }),
      );
    }

    case 'message/failed': {
      return updateMessage(
        state,
        action.conversationId,
        action.messageId,
        action.at,
        (message) => ({
          ...message,
          status: 'error',
          error: action.error,
          retry: action.retry,
        }),
      );
    }

    case 'message/retry-started': {
      return updateMessage(
        state,
        action.conversationId,
        action.messageId,
        action.at,
        (message) => ({
          ...message,
          content: action.clearContent ? '' : message.content,
          status: 'streaming',
          error: undefined,
          retry: {
            attempt: (message.retry?.attempt ?? 0) + 1,
            lastAttemptAt: action.at,
            userMessageId:
              action.userMessageId ?? message.retry?.userMessageId,
          },
        }),
      );
    }
  }
}
