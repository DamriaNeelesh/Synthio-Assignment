import type {
  BrowserSpeechRecognitionConstructor,
  BrowserSpeechRecognitionErrorEvent,
  VoiceCallError,
  VoiceSupport,
} from './voice.types';

const LOCAL_HOSTNAMES = new Set(['127.0.0.1', '::1', 'localhost']);

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function isBrowserContextSecure(): boolean {
  if (!hasWindow()) {
    return false;
  }

  if (window.isSecureContext) {
    return true;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

export function getSpeechRecognitionConstructor():
  | BrowserSpeechRecognitionConstructor
  | undefined {
  if (!hasWindow()) {
    return undefined;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function detectVoiceSupport(): VoiceSupport {
  const secureContext = isBrowserContextSecure();
  const recognition =
    secureContext && getSpeechRecognitionConstructor() !== undefined;
  const synthesis =
    hasWindow() &&
    'speechSynthesis' in window &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function';

  return {
    liveCall: recognition,
    recognition,
    secureContext,
    synthesis,
  };
}

export function getInitialVoiceError(
  support: VoiceSupport,
): VoiceCallError | null {
  if (!support.secureContext) {
    return {
      code: 'insecure-context',
      message:
        'Microphone access needs HTTPS (or localhost). Demo mode is available without recording audio.',
      recoverable: false,
    };
  }

  if (!support.recognition) {
    return {
      code: 'recognition-unsupported',
      message:
        'Live speech recognition is unavailable in this browser. Demo mode is ready and will not fabricate transcript content.',
      recoverable: false,
    };
  }

  return null;
}

export function mapRecognitionError(
  event: Pick<BrowserSpeechRecognitionErrorEvent, 'error' | 'message'>,
): VoiceCallError | null {
  switch (event.error) {
    case 'aborted':
    case 'no-speech':
      return null;
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code: 'permission-denied',
        message:
          'Microphone permission was denied. The call has continued safely in demo mode.',
        recoverable: true,
      };
    case 'audio-capture':
      return {
        code: 'microphone-unavailable',
        message:
          'No usable microphone was found. The call has continued safely in demo mode.',
        recoverable: true,
      };
    default:
      return {
        code: 'recognition-error',
        message:
          event.message.trim() ||
          'Speech recognition was interrupted. Please try the call again.',
        recoverable: true,
      };
  }
}

export function joinTranscript(
  currentTranscript: string,
  nextTranscript: string,
): string {
  const current = currentTranscript.trim();
  const next = nextTranscript.trim();

  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return `${current} ${next}`;
}
