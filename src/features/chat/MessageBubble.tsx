import { AlertCircle, Check, Copy, RotateCcw } from 'lucide-react';
import { memo, useState } from 'react';
import { BrandMark } from '../../components/BrandMark';
import type { Message } from '../../types';
import { formatMessageTime } from '../../lib/format';
import { MessageContent } from './MessageContent';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  onRetry: (messageId: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onRetry,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';
  const isEmptyStreaming =
    message.status === 'streaming' && !message.content.trim();

  async function copyMessage() {
    if (!message.content.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      aria-label={`${isAssistant ? 'Synthio Assistant' : 'You'} message`}
      className={[
        'message',
        `message--${message.role}`,
        `message--${message.status}`,
      ].join(' ')}
      data-message-id={message.id}
    >
      {isAssistant ? (
        <div aria-hidden="true" className="message__avatar">
          <BrandMark height={24} width={24} />
        </div>
      ) : null}

      <div className="message__column">
        <div className="message__body">
          {isEmptyStreaming ? (
            <TypingIndicator />
          ) : (
            <MessageContent content={message.content} />
          )}
          {message.status === 'streaming' && message.content ? (
            <span aria-hidden="true" className="message__stream-caret" />
          ) : null}
        </div>

        {message.status === 'error' ? (
          <div className="message__error" role="alert">
            <AlertCircle aria-hidden="true" size={15} strokeWidth={2} />
            <span>
              {message.error?.message ??
                'This response could not be completed.'}
            </span>
            {message.error?.retryable ? (
              <button
                className="message__retry"
                onClick={() => onRetry(message.id)}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={14} strokeWidth={2} />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="message__meta">
          <time dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
          {!isAssistant && message.status === 'complete' ? (
            <span
              aria-atomic="true"
              aria-live="polite"
              className="message__delivered"
              role="status"
            >
              <Check aria-hidden="true" size={13} strokeWidth={2.3} />
              <Check aria-hidden="true" size={13} strokeWidth={2.3} />
              <span className="visually-hidden">Delivered</span>
            </span>
          ) : null}
          {isAssistant && message.status === 'complete' ? (
            <button
              aria-label={copied ? 'Message copied' : 'Copy message'}
              className="message__copy"
              onClick={() => void copyMessage()}
              type="button"
            >
              {copied ? (
                <Check aria-hidden="true" size={14} strokeWidth={2} />
              ) : (
                <Copy aria-hidden="true" size={14} strokeWidth={1.8} />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
});
