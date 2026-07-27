export type VoiceCallStatus =
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'disconnected';

export type VoiceCallMode = 'live' | 'demo';

export type VoiceCallErrorCode =
  | 'insecure-context'
  | 'microphone-unavailable'
  | 'permission-denied'
  | 'recognition-error'
  | 'recognition-unsupported'
  | 'synthesis-error'
  | 'synthesis-unsupported';

export interface VoiceCallError {
  code: VoiceCallErrorCode;
  message: string;
  recoverable: boolean;
}

export interface VoiceSupport {
  recognition: boolean;
  synthesis: boolean;
  secureContext: boolean;
  liveCall: boolean;
}

export interface VoiceTranscript {
  final: string;
  interim: string;
}

export interface SpeakOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
  voice?: SpeechSynthesisVoice;
  volume?: number;
}

export interface UseVoiceCallOptions {
  lang?: string;
  onError?: (error: VoiceCallError) => void;
  onFinalTranscript?: (transcript: string) => void;
  onSpokenComplete?: (text: string) => void;
  speech?: Omit<SpeakOptions, 'lang'>;
}

export interface UseVoiceCallResult {
  clearTranscript: () => void;
  elapsedSeconds: number;
  endCall: () => void;
  error: VoiceCallError | null;
  isMuted: boolean;
  mode: VoiceCallMode;
  resumeListening: () => void;
  setMuted: (muted: boolean) => void;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  startCall: () => void;
  status: VoiceCallStatus;
  support: VoiceSupport;
  toggleMute: () => void;
  transcript: VoiceTranscript;
}

export interface BrowserSpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

export interface BrowserSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionAlternative;
}

export interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionResult;
}

export interface BrowserSpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: BrowserSpeechRecognitionResultList;
}

export interface BrowserSpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((event: Event) => void) | null;
  onaudiostart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((event: Event) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onsoundend: ((event: Event) => void) | null;
  onsoundstart: ((event: Event) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

export interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}
