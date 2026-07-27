import { Lightbulb, ListChecks, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { BrandMark } from '../../components/BrandMark';
import type { Conversation } from '../../types';
import { ChatComposer } from './ChatComposer';
import { MessageBubble } from './MessageBubble';

interface ChatViewProps {
  conversation: Conversation | null;
  isGenerating: boolean;
  onRetryMessage: (messageId: string) => void;
  onSendMessage: (content: string) => void;
  onStartVoice: () => void;
  onStopGeneration: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Lightbulb,
    label: 'Shape a product idea',
    prompt: 'Help me turn a rough product idea into a focused one-page plan.',
  },
  {
    icon: ListChecks,
    label: 'Build an action plan',
    prompt: 'Create a practical action plan for my highest-priority goal.',
  },
  {
    icon: Sparkles,
    label: 'Improve my writing',
    prompt: 'Help me make an important message clearer and more persuasive.',
  },
] as const;

export function ChatView({
  conversation,
  isGenerating,
  onRetryMessage,
  onSendMessage,
  onStartVoice,
  onStopGeneration,
}: ChatViewProps) {
  const scrollRegionRef = useRef<HTMLDivElement>(null);
  const lastMessage = conversation?.messages.at(-1);

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
        behavior: reduceMotion ? 'auto' : 'smooth',
        top: scrollRegion.scrollHeight,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    conversation?.id,
    conversation?.messages.length,
    lastMessage?.content,
  ]);

  const hasMessages = Boolean(conversation?.messages.length);

  return (
    <section className="chat-view" aria-label="Chat with Synthex">
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="chat-view__scroll-region"
        ref={scrollRegionRef}
        role="log"
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
              <h2>What can I help you think through?</h2>
              <p>
                Start with a question, a rough idea, or the outcome you want.
              </p>
              <div className="chat-empty__prompts">
                {STARTER_PROMPTS.map(({ icon: PromptIcon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => onSendMessage(prompt)}
                    type="button"
                  >
                    <PromptIcon aria-hidden="true" size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
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
