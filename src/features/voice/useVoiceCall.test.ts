import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoiceCall } from './useVoiceCall';
import type {
  BrowserSpeechRecognition,
  BrowserSpeechRecognitionErrorEvent,
  BrowserSpeechRecognitionEvent,
  BrowserSpeechRecognitionResult,
  BrowserSpeechRecognitionResultList,
} from './voice.types';

class FakeSpeechRecognition implements BrowserSpeechRecognition {
  static latest: FakeSpeechRecognition | null = null;

  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 0;
  onaudioend: ((event: Event) => void) | null = null;
  onaudiostart: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null = null;
  onnomatch: ((event: Event) => void) | null = null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null = null;
  onsoundend: ((event: Event) => void) | null = null;
  onsoundstart: ((event: Event) => void) | null = null;
  onspeechend: ((event: Event) => void) | null = null;
  onspeechstart: ((event: Event) => void) | null = null;
  onstart: ((event: Event) => void) | null = null;
  abortCount = 0;
  startCount = 0;

  constructor() {
    FakeSpeechRecognition.latest = this;
  }

  abort(): void {
    this.abortCount += 1;
    this.onend?.(new Event('end'));
  }

  start(): void {
    this.startCount += 1;
    this.onstart?.(new Event('start'));
  }

  stop(): void {
    this.onend?.(new Event('end'));
  }

  emitError(error: string, message = ''): void {
    const event = Object.assign(new Event('error'), { error, message });
    this.onerror?.(event);
  }

  emitResult(text: string, isFinal: boolean): void {
    const result: BrowserSpeechRecognitionResult = {
      0: { confidence: 0.99, transcript: text },
      isFinal,
      length: 1,
    };
    const results: BrowserSpeechRecognitionResultList = {
      0: result,
      length: 1,
    };
    const event = Object.assign(new Event('result'), {
      resultIndex: 0,
      results,
    });

    this.onresult?.(event);
  }
}

class FakeSpeechSynthesisUtterance {
  static latest: FakeSpeechSynthesisUtterance | null = null;

  lang = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pitch = 1;
  rate = 1;
  readonly text: string;
  voice: SpeechSynthesisVoice | null = null;
  volume = 1;

  constructor(text: string) {
    this.text = text;
    FakeSpeechSynthesisUtterance.latest = this;
  }

  complete(): void {
    this.onend?.();
  }
}

const originalSpeechSynthesisDescriptor = Object.getOwnPropertyDescriptor(
  window,
  'speechSynthesis',
);
const originalUtteranceDescriptor = Object.getOwnPropertyDescriptor(
  window,
  'SpeechSynthesisUtterance',
);

function restoreWindowProperty(
  property: 'speechSynthesis' | 'SpeechSynthesisUtterance',
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) {
    Reflect.deleteProperty(window, property);
  } else {
    Object.defineProperty(window, property, descriptor);
  }
}

describe('useVoiceCall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSpeechRecognition.latest = null;
    FakeSpeechSynthesisUtterance.latest = null;
    window.SpeechRecognition = FakeSpeechRecognition;
    window.webkitSpeechRecognition = undefined;
    restoreWindowProperty(
      'speechSynthesis',
      originalSpeechSynthesisDescriptor,
    );
    restoreWindowProperty(
      'SpeechSynthesisUtterance',
      originalUtteranceDescriptor,
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    restoreWindowProperty(
      'speechSynthesis',
      originalSpeechSynthesisDescriptor,
    );
    restoreWindowProperty(
      'SpeechSynthesisUtterance',
      originalUtteranceDescriptor,
    );
  });

  it('streams interim and final recognition results without fake messages', () => {
    const onFinalTranscript = vi.fn();
    const { result, unmount } = renderHook(() =>
      useVoiceCall({ onFinalTranscript }),
    );

    act(() => {
      result.current.startCall();
    });

    expect(result.current.status).toBe('listening');
    expect(result.current.mode).toBe('live');
    expect(result.current.transcript).toEqual({ final: '', interim: '' });

    const recognition = FakeSpeechRecognition.latest;
    expect(recognition).not.toBeNull();

    act(() => {
      recognition?.emitResult('interim words', false);
    });
    expect(result.current.transcript.interim).toBe('interim words');
    expect(onFinalTranscript).not.toHaveBeenCalled();

    act(() => {
      recognition?.emitResult('final words', true);
    });
    expect(result.current.transcript).toEqual({
      final: 'final words',
      interim: '',
    });
    expect(onFinalTranscript).toHaveBeenCalledOnce();
    expect(onFinalTranscript).toHaveBeenCalledWith('final words');

    act(() => {
      unmount();
    });
    expect(recognition?.abortCount).toBeGreaterThan(0);
  });

  it('pauses recognition after a final transcript until the response is ready', () => {
    const onFinalTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceCall({ onFinalTranscript }),
    );

    act(() => {
      result.current.startCall();
    });

    const recognition = FakeSpeechRecognition.latest;
    expect(recognition?.startCount).toBe(1);

    act(() => {
      recognition?.emitResult('What should we build?', true);
    });

    expect(onFinalTranscript).toHaveBeenCalledWith(
      'What should we build?',
    );
    expect(result.current.status).toBe('connected');
    expect(recognition?.abortCount).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(recognition?.startCount).toBe(1);
    expect(result.current.status).toBe('connected');

    act(() => {
      result.current.resumeListening();
    });

    expect(recognition?.startCount).toBe(2);
    expect(result.current.status).toBe('listening');

    act(() => {
      result.current.endCall();
    });
  });

  it('does not restart recognition after ending a call awaiting a response', () => {
    const { result } = renderHook(() => useVoiceCall());

    act(() => {
      result.current.startCall();
    });

    const recognition = FakeSpeechRecognition.latest;

    act(() => {
      recognition?.emitResult('End this call', true);
    });
    expect(result.current.status).toBe('connected');
    expect(recognition?.startCount).toBe(1);

    act(() => {
      result.current.endCall();
      result.current.resumeListening();
      recognition?.onend?.(new Event('end'));
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.status).toBe('disconnected');
    expect(recognition?.startCount).toBe(1);
  });

  it('mutes the microphone and resumes recognition when unmuted', () => {
    const { result } = renderHook(() => useVoiceCall());

    act(() => {
      result.current.startCall();
    });

    const recognition = FakeSpeechRecognition.latest;

    act(() => {
      result.current.setMuted(true);
    });
    expect(result.current.isMuted).toBe(true);
    expect(result.current.status).toBe('connected');
    expect(recognition?.abortCount).toBe(1);

    act(() => {
      result.current.toggleMute();
    });
    expect(result.current.isMuted).toBe(false);
    expect(result.current.status).toBe('listening');
    expect(recognition?.startCount).toBe(2);

    act(() => {
      result.current.endCall();
    });
    expect(result.current.status).toBe('disconnected');
  });

  it('continues safely in demo mode when microphone permission is denied', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useVoiceCall({ onError }));

    act(() => {
      result.current.startCall();
      FakeSpeechRecognition.latest?.emitError('not-allowed');
    });

    expect(result.current.mode).toBe('demo');
    expect(result.current.status).toBe('connected');
    expect(result.current.error?.code).toBe('permission-denied');
    expect(result.current.transcript).toEqual({ final: '', interim: '' });
    expect(onError).toHaveBeenCalledOnce();

    act(() => {
      result.current.endCall();
    });
  });

  it('uses a deterministic, transcript-free demo call when recognition is absent', () => {
    delete window.SpeechRecognition;
    const { result } = renderHook(() => useVoiceCall());

    expect(result.current.support.recognition).toBe(false);
    expect(result.current.mode).toBe('demo');
    expect(result.current.error?.code).toBe('recognition-unsupported');

    act(() => {
      result.current.startCall();
    });
    expect(result.current.status).toBe('connecting');

    act(() => {
      vi.advanceTimersByTime(320);
    });
    expect(result.current.status).toBe('connected');
    expect(result.current.transcript).toEqual({ final: '', interim: '' });

    act(() => {
      vi.advanceTimersByTime(680);
    });
    expect(result.current.elapsedSeconds).toBe(1);

    act(() => {
      result.current.endCall();
    });
  });

  it('finishes speaking gracefully when synthesis is unavailable', async () => {
    const onSpokenComplete = vi.fn();
    const { result } = renderHook(() =>
      useVoiceCall({ onSpokenComplete }),
    );

    act(() => {
      result.current.startCall();
    });

    let completion = Promise.resolve();

    act(() => {
      completion = result.current.speak('A concise spoken answer.');
    });
    expect(result.current.status).toBe('speaking');
    expect(result.current.error?.code).toBe('synthesis-unsupported');

    await act(async () => {
      vi.advanceTimersByTime(1_000);
      await completion;
    });

    expect(onSpokenComplete).toHaveBeenCalledWith(
      'A concise spoken answer.',
    );
    expect(result.current.status).toBe('listening');

    act(() => {
      result.current.endCall();
    });
  });

  it('uses native speech synthesis and reports spoken completion', async () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak },
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: FakeSpeechSynthesisUtterance,
    });
    const onSpokenComplete = vi.fn();
    const { result } = renderHook(() =>
      useVoiceCall({ lang: 'en-IN', onSpokenComplete }),
    );

    act(() => {
      result.current.startCall();
    });

    let completion = Promise.resolve();

    act(() => {
      completion = result.current.speak('Native speech works.');
    });

    expect(result.current.support.synthesis).toBe(true);
    expect(result.current.status).toBe('speaking');
    expect(speak).toHaveBeenCalledOnce();
    expect(FakeSpeechSynthesisUtterance.latest?.lang).toBe('en-IN');

    act(() => {
      FakeSpeechSynthesisUtterance.latest?.complete();
    });
    await completion;

    expect(onSpokenComplete).toHaveBeenCalledWith('Native speech works.');
    expect(result.current.status).toBe('listening');
    expect(cancel).toHaveBeenCalled();

    act(() => {
      result.current.endCall();
    });
  });
});
