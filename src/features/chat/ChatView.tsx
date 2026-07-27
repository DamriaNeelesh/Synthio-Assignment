import { BarChart3, FlaskConical, Stethoscope } from 'lucide-react';
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
    icon: Stethoscope,
    label: 'Prepare a field call',
    prompt:
      'Create a Jarvis-style pre-call brief from a fictional CRM record. Use only approved content and include follow-up and compliance checkpoints.',
  },
  {
    icon: FlaskConical,
    label: 'Test a scientific exchange',
    prompt:
      'Show how Ather should handle a fictional HCP scientific question that may be off-label, including audit and escalation steps.',
  },
  {
    icon: BarChart3,
    label: 'Explore commercial data',
    prompt:
      'Show how Polaris HQ would answer a commercial question across synthetic field and access data without inventing unsupported findings.',
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
    <section className="chat-view" aria-label="Chat with Synthio Assistant">
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
              <h2>What should we explore across life sciences?</h2>
              <p>
                Try a synthetic field, HCP, patient-support, research, or
                commercial workflow. Never enter real patient or HCP data.
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
