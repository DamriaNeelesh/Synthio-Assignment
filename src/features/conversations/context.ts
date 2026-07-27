import { createContext, useContext } from 'react';
import type {
  Conversation,
  ConversationId,
  ConversationState,
  MessageError,
  MessageId,
  MessageRetryMetadata,
  NewMessage,
} from '../../types';

export interface ConversationActions {
  createConversation: (title?: string) => ConversationId;
  selectConversation: (conversationId: ConversationId) => void;
  deleteConversation: (conversationId: ConversationId) => void;
  renameConversation: (
    conversationId: ConversationId,
    title: string,
  ) => void;
  appendMessage: (
    conversationId: ConversationId,
    message: NewMessage,
  ) => MessageId;
  appendUserMessage: (
    content: string,
    conversationId?: ConversationId,
  ) => MessageId;
  appendAssistantMessage: (
    content: string,
    conversationId?: ConversationId,
  ) => MessageId;
  startAssistantMessage: (
    conversationId?: ConversationId,
    retry?: MessageRetryMetadata,
  ) => MessageId;
  appendStreamingChunk: (
    conversationId: ConversationId,
    messageId: MessageId,
    delta: string,
  ) => void;
  completeMessage: (
    conversationId: ConversationId,
    messageId: MessageId,
    content?: string,
  ) => void;
  markMessageError: (
    conversationId: ConversationId,
    messageId: MessageId,
    error: MessageError,
    userMessageId?: MessageId,
  ) => void;
  startMessageRetry: (
    conversationId: ConversationId,
    messageId: MessageId,
    userMessageId?: MessageId,
  ) => void;
}

export interface ConversationContextValue extends ConversationActions {
  state: ConversationState;
  conversations: Conversation[];
  activeConversationId: ConversationId | null;
  activeConversation: Conversation | null;
}

export const ConversationContext =
  createContext<ConversationContextValue | null>(null);

export function useConversations(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      'useConversations must be used within a ConversationProvider.',
    );
  }
  return context;
}
