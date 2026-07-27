export type ConversationId = string;
export type MessageId = string;
export type IsoTimestamp = string;

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'error';

export interface MessageError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface MessageRetryMetadata {
  attempt: number;
  lastAttemptAt: IsoTimestamp;
  userMessageId?: MessageId;
}

export interface Message {
  id: MessageId;
  role: MessageRole;
  content: string;
  createdAt: IsoTimestamp;
  status: MessageStatus;
  error?: MessageError;
  retry?: MessageRetryMetadata;
}

export interface Conversation {
  id: ConversationId;
  title: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  messages: Message[];
}

export interface ConversationState {
  conversations: Conversation[];
  activeConversationId: ConversationId | null;
}

export type NewMessage = Pick<Message, 'content' | 'role'> &
  Partial<Pick<Message, 'status' | 'retry'>>;
