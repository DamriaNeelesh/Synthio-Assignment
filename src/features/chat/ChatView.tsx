import { useEffect, useRef } from 'react';
import { BrandMark } from '../../components/BrandMark';
import type { Conversation } from '../../types';
import { ChatComposer } from './ChatComposer';
import { MessageBubble } from './MessageBubble';
import { StarterPrompts } from './StarterPrompts';

interface ChatViewProps {
  conversation: Conversation | null;
  isGenerating: boolean;
  onRetryMessage: (messageId: string) => void;
  onSendMessage: (content: string) => void;
  onStartVoice: () => void;
  onStopGeneration: () => void;
}

export function ChatView({
  conversation,
  isGenerating,
  onRetryMessage,
  onSendMessage,
  onStartVoice,
  onStopGeneration,
}: ChatViewProps) {
  const scrollRegionRef = useRef<HTMLDivElement>(null);
  const shouldFocusMessageLogRef = useRef(false);
  const lastMessage = conversation?.messages.at(-1);
  const hasMessages = Boolean(conversation?.messages.length);

  useEffect(() => {
    const scrollRegion = scrollRegionRef.current;
    if (!scrollRegion) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      scrollRegion.scrollTo({
        behavior: reduceMotion || !hasMessages ? 'auto' : 'smooth',
        top: hasMessages ? scrollRegion.scrollHeight : 0,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    conversation?.id,
    conversation?.messages.length,
    hasMessages,
    lastMessage?.content,
  ]);

  useEffect(() => {
    if (!hasMessages || !shouldFocusMessageLogRef.current) {
      return;
    }

    shouldFocusMessageLogRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      scrollRegionRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [conversation?.id, hasMessages]);

  function handleStarterPromptSelect(prompt: string) {
    shouldFocusMessageLogRef.current = true;
    onSendMessage(prompt);
  }

  return (
    <section className="chat-view" aria-label="Chat with Synthio Assistant">
      <div
        aria-label={hasMessages ? 'Conversation messages' : undefined}
        aria-live={hasMessages ? 'polite' : undefined}
        aria-relevant={hasMessages ? 'additions text' : undefined}
        className="chat-view__scroll-region"
        ref={scrollRegionRef}
        role={hasMessages ? 'log' : undefined}
        tabIndex={hasMessages ? -1 : undefined}
      >
        <div
          className={[
            'chat-view__content',
            hasMessages ? '' : 'chat-view__content--empty',
          ].join(' ')}
        >
          {hasMessages && conversation ? (
            conversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={onRetryMessage}
              />
            ))
          ) : (
            <div className="chat-empty">
              <div aria-hidden="true" className="chat-empty__mark">
                <BrandMark height={38} width={38} />
              </div>
              <h2>What should we explore across life sciences?</h2>
              <p>
                Choose a one-click demo workflow or write your own. Every
                scenario uses synthetic data—never enter real patient or HCP
                information.
              </p>
              <StarterPrompts
                disabled={isGenerating}
                onSelectPrompt={handleStarterPromptSelect}
              />
            </div>
          )}
        </div>
      </div>

      <ChatComposer
        isGenerating={isGenerating}
        onSend={onSendMessage}
        onStartVoice={onStartVoice}
        onStop={onStopGeneration}
      />
    </section>
  );
}
