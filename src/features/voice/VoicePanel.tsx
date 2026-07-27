import {
  AudioLines,
  ChevronLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  X,
} from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { BrandMark } from '../../components/BrandMark';
import { IconButton } from '../../components/IconButton';
import { formatCallDuration } from '../../lib/format';
import type {
  VoiceCallError,
  VoiceCallMode,
  VoiceCallStatus,
} from './voice.types';

interface VoicePanelProps {
  assistantTranscript: string;
  elapsedSeconds: number;
  error: VoiceCallError | null;
  interimTranscript: string;
  isMuted: boolean;
  isModal: boolean;
  mode: VoiceCallMode;
  onClose: () => void;
  onEndCall: () => void;
  onStartCall: () => void;
  onToggleMute: () => void;
  status: VoiceCallStatus;
  userTranscript: string;
}

const WAVEFORM_HEIGHTS = [
  18, 28, 42, 24, 36, 52, 30, 20, 40, 58, 32, 26, 47, 63, 34, 22, 38, 54,
  27, 19, 44, 59, 33, 24, 41, 50, 29, 20, 35, 46, 26, 18,
];

const STATUS_LABELS: Record<VoiceCallStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  listening: 'Listening',
  speaking: 'Speaking',
};

function Waveform({ active }: { active: boolean }) {
  return (
    <div
      aria-label={active ? 'Live audio waveform' : 'Audio waveform paused'}
      className={`voice-waveform ${active ? 'voice-waveform--active' : ''}`}
      role="img"
    >
      {WAVEFORM_HEIGHTS.map((height, index) => (
        <span
          aria-hidden="true"
          key={`${height}-${index}`}
          style={
            {
              '--bar-delay': `${(index % 8) * -0.09}s`,
              '--bar-height': `${height}%`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function VoicePanel({
  assistantTranscript,
  elapsedSeconds,
  error,
  interimTranscript,
  isMuted,
  isModal,
  mode,
  onClose,
  onEndCall,
  onStartCall,
  onToggleMute,
  status,
  userTranscript,
}: VoicePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isActive = status !== 'disconnected';
  const waveformActive =
    status === 'listening' || status === 'speaking';
  const visibleUserTranscript =
    interimTranscript.trim() || userTranscript.trim();

  useEffect(() => {
    if (!isModal) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    function getFocusableElements(panel: HTMLElement) {
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) {
        (getFocusableElements(panel)[0] ?? panel).focus();
      }
    });

    function handleModalKeyDown(event: globalThis.KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(panel);
      const first = focusableElements[0] ?? panel;
      const last = focusableElements.at(-1) ?? panel;

      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleModalKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleModalKeyDown);
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
      previousFocusRef.current = null;
    };
  }, [isModal, onClose]);

  return (
    <aside
      aria-label={isModal ? undefined : 'Voice conversation'}
      aria-labelledby={isModal ? 'voice-panel-title' : undefined}
      aria-modal={isModal ? true : undefined}
      className={`voice-panel voice-panel--${status}`}
      ref={panelRef}
      role={isModal ? 'dialog' : undefined}
      tabIndex={isModal ? -1 : undefined}
    >
      <header className="voice-panel__header">
        <IconButton
          className="voice-panel__back"
          label="Close voice conversation"
          onClick={onClose}
          size="large"
        >
          <ChevronLeft size={22} strokeWidth={1.9} />
        </IconButton>
        <div className="voice-panel__heading">
          <AudioLines aria-hidden="true" size={21} strokeWidth={1.8} />
          <h2 id="voice-panel-title">Voice conversation</h2>
        </div>
        <IconButton
          className="voice-panel__close"
          label="Close voice conversation"
          onClick={onClose}
          size="medium"
        >
          <X size={19} strokeWidth={1.9} />
        </IconButton>
      </header>

      <div
        aria-live="polite"
        className="voice-panel__status"
        role="status"
      >
        <span aria-hidden="true" />
        {STATUS_LABELS[status]}
      </div>

      <div className={`voice-orb voice-orb--${status}`} aria-hidden="true">
        <span className="voice-orb__ring voice-orb__ring--one" />
        <span className="voice-orb__ring voice-orb__ring--two" />
        <span className="voice-orb__ring voice-orb__ring--three" />
        <span className="voice-orb__core">
          <BrandMark height={48} width={48} />
        </span>
      </div>

      <time className="voice-panel__timer">
        {formatCallDuration(elapsedSeconds)}
      </time>

      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="voice-transcript"
      >
        {visibleUserTranscript ? (
          <div className="voice-transcript__entry">
            <div className="voice-transcript__speaker">
              <span>You</span>
              {interimTranscript ? <em>Live</em> : null}
            </div>
            <p>{visibleUserTranscript}</p>
          </div>
        ) : (
          <p className="voice-transcript__empty">
            {status === 'connecting'
              ? 'Preparing your microphone…'
              : status === 'disconnected'
                ? 'Start a call to talk with Synthex.'
                : isMuted
                  ? 'Microphone muted'
                  : mode === 'demo'
                    ? 'Voice transcription is unavailable in this browser.'
                    : 'Listening for your voice…'}
          </p>
        )}

        {assistantTranscript ? (
          <div className="voice-transcript__entry voice-transcript__entry--assistant">
            <div className="voice-transcript__speaker">
              <BrandMark height={18} width={18} />
              <span>Synthex</span>
            </div>
            <p>{assistantTranscript}</p>
          </div>
        ) : null}
      </div>

      <Waveform active={waveformActive && !isMuted} />

      {error && mode === 'demo' ? (
        <p
          aria-live="polite"
          className="voice-panel__notice"
          role="status"
        >
          {error.message}
        </p>
      ) : null}

      <div className="voice-panel__controls">
        {isActive ? (
          <>
            <button
              aria-pressed={isMuted}
              className={`voice-control ${isMuted ? 'voice-control--active' : ''}`}
              onClick={onToggleMute}
              type="button"
            >
              {isMuted ? (
                <MicOff aria-hidden="true" size={21} strokeWidth={1.8} />
              ) : (
                <Mic aria-hidden="true" size={21} strokeWidth={1.8} />
              )}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button
              className="voice-control voice-control--end"
              onClick={onEndCall}
              type="button"
            >
              <PhoneOff aria-hidden="true" size={22} strokeWidth={2} />
              <span>End call</span>
            </button>
          </>
        ) : (
          <button
            className="voice-control voice-control--start"
            onClick={onStartCall}
            type="button"
          >
            <Phone aria-hidden="true" size={21} strokeWidth={2} />
            <span>Start call</span>
          </button>
        )}
      </div>
    </aside>
  );
}
