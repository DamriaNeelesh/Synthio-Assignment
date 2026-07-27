import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  detectVoiceSupport,
  getInitialVoiceError,
  getSpeechRecognitionConstructor,
  joinTranscript,
  mapRecognitionError,
} from './voiceBrowser';
import type {
  BrowserSpeechRecognition,
  BrowserSpeechRecognitionEvent,
  SpeakOptions,
  UseVoiceCallOptions,
  UseVoiceCallResult,
  VoiceCallError,
  VoiceCallMode,
  VoiceCallStatus,
  VoiceSupport,
  VoiceTranscript,
} from './voice.types';

export type {
  SpeakOptions,
  UseVoiceCallOptions,
  UseVoiceCallResult,
  VoiceCallError,
  VoiceCallErrorCode,
  VoiceCallMode,
  VoiceCallStatus,
  VoiceSupport,
  VoiceTranscript,
} from './voice.types';

const RECOGNITION_RESTART_DELAY_MS = 220;
const DEMO_CONNECT_DELAY_MS = 320;
const MIN_DEMO_SPEECH_MS = 700;
const MAX_DEMO_SPEECH_MS = 4_000;
const AVERAGE_WORD_SPEECH_MS = 240;

interface VoiceCallState {
  elapsedSeconds: number;
  error: VoiceCallError | null;
  isMuted: boolean;
  mode: VoiceCallMode;
  status: VoiceCallStatus;
  transcript: VoiceTranscript;
}

type VoiceCallAction =
  | { type: 'append-final'; value: string }
  | { type: 'clear-transcript' }
  | { type: 'set-elapsed'; value: number }
  | { type: 'set-error'; value: VoiceCallError }
  | { type: 'set-interim'; value: string }
  | { type: 'set-mode'; value: VoiceCallMode }
  | { type: 'set-muted'; value: boolean }
  | { type: 'set-status'; value: VoiceCallStatus }
  | {
      type: 'start';
      error: VoiceCallError | null;
      mode: VoiceCallMode;
    };

function voiceCallReducer(
  state: VoiceCallState,
  action: VoiceCallAction,
): VoiceCallState {
  switch (action.type) {
    case 'append-final': {
      const nextFinal = joinTranscript(state.transcript.final, action.value);

      return {
        ...state,
        transcript: {
          final: nextFinal,
          interim: '',
        },
      };
    }
    case 'clear-transcript':
      return state.transcript.final === '' && state.transcript.interim === ''
        ? state
        : { ...state, transcript: { final: '', interim: '' } };
    case 'set-elapsed':
      return state.elapsedSeconds === action.value
        ? state
        : { ...state, elapsedSeconds: action.value };
    case 'set-error':
      return { ...state, error: action.value };
    case 'set-interim':
      return state.transcript.interim === action.value
        ? state
        : {
            ...state,
            transcript: { ...state.transcript, interim: action.value },
          };
    case 'set-mode':
      return state.mode === action.value
        ? state
        : { ...state, mode: action.value };
    case 'set-muted':
      return state.isMuted === action.value
        ? state
        : { ...state, isMuted: action.value };
    case 'set-status':
      return state.status === action.value
        ? state
        : { ...state, status: action.value };
    case 'start':
      return {
        ...state,
        elapsedSeconds: 0,
        error: action.error,
        mode: action.mode,
        status: 'connecting',
        transcript: { final: '', interim: '' },
      };
  }
}

function createInitialState(support: VoiceSupport): VoiceCallState {
  return {
    elapsedSeconds: 0,
    error: getInitialVoiceError(support),
    isMuted: false,
    mode: support.liveCall ? 'live' : 'demo',
    status: 'disconnected',
    transcript: { final: '', interim: '' },
  };
}

function getDemoSpeechDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/u).filter(Boolean).length;

  return Math.min(
    MAX_DEMO_SPEECH_MS,
    Math.max(MIN_DEMO_SPEECH_MS, wordCount * AVERAGE_WORD_SPEECH_MS),
  );
}

export function useVoiceCall(
  options: UseVoiceCallOptions = {},
): UseVoiceCallResult {
  const [support] = useState(detectVoiceSupport);
  const [state, dispatch] = useReducer(
    voiceCallReducer,
    support,
    createInitialState,
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionRunningRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(true);
  const mutedRef = useRef(false);
  const speakingRef = useRef(false);
  const awaitingResponseRef = useRef(false);
  const modeRef = useRef<VoiceCallMode>(
    support.liveCall ? 'live' : 'demo',
  );
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const callStartedAtRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const demoSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const speechTokenRef = useRef(0);
  const speechResolveRef = useRef<(() => void) | null>(null);

  const langRef = useRef(options.lang ?? 'en-US');
  const speechDefaultsRef = useRef(options.speech);
  const onErrorRef = useRef(options.onError);
  const onFinalTranscriptRef = useRef(options.onFinalTranscript);
  const onSpokenCompleteRef = useRef(options.onSpokenComplete);

  useEffect(() => {
    langRef.current = options.lang ?? 'en-US';
    speechDefaultsRef.current = options.speech;
    onErrorRef.current = options.onError;
    onFinalTranscriptRef.current = options.onFinalTranscript;
    onSpokenCompleteRef.current = options.onSpokenComplete;
  }, [
    options.lang,
    options.onError,
    options.onFinalTranscript,
    options.onSpokenComplete,
    options.speech,
  ]);

  const clearTimer = useCallback(
    (timerRef: { current: ReturnType<typeof setTimeout> | null }) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  const reportError = useCallback((error: VoiceCallError) => {
    if (!mountedRef.current) {
      return;
    }

    dispatch({ type: 'set-error', value: error });
    onErrorRef.current?.(error);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current !== null) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    stopElapsedTimer();
    callStartedAtRef.current = Date.now();
    elapsedIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !activeRef.current) {
        return;
      }

      const nextElapsed = Math.floor(
        (Date.now() - callStartedAtRef.current) / 1_000,
      );
      dispatch({ type: 'set-elapsed', value: nextElapsed });
    }, 1_000);
  }, [stopElapsedTimer]);

  const safelyAbortRecognition = useCallback(() => {
    const recognition = recognitionRef.current;

    if (recognition === null) {
      return;
    }

    recognitionRunningRef.current = false;

    try {
      recognition.abort();
    } catch {
      // A recognition instance that is already stopped can throw in Chromium.
    }
  }, []);

  const startRecognitionRef = useRef<() => void>(() => undefined);

  const scheduleRecognitionRestart = useCallback(() => {
    clearTimer(reconnectTimerRef);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      startRecognitionRef.current();
    }, RECOGNITION_RESTART_DELAY_MS);
  }, [clearTimer]);

  const configureRecognition = useCallback(
    (recognition: BrowserSpeechRecognition) => {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = langRef.current;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recognitionRunningRef.current = true;

        if (
          !mountedRef.current ||
          !activeRef.current ||
          mutedRef.current ||
          speakingRef.current ||
          awaitingResponseRef.current ||
          modeRef.current !== 'live'
        ) {
          safelyAbortRecognition();
          return;
        }

        dispatch({
          type: 'set-status',
          value: mutedRef.current ? 'connected' : 'listening',
        });
      };

      recognition.onspeechstart = () => {
        if (
          mountedRef.current &&
          activeRef.current &&
          !mutedRef.current &&
          !speakingRef.current &&
          !awaitingResponseRef.current
        ) {
          dispatch({ type: 'set-status', value: 'listening' });
        }
      };

      recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        if (
          !mountedRef.current ||
          !activeRef.current ||
          mutedRef.current ||
          speakingRef.current ||
          awaitingResponseRef.current ||
          modeRef.current !== 'live'
        ) {
          return;
        }

        const finalParts: string[] = [];
        const interimParts: string[] = [];

        for (
          let resultIndex = event.resultIndex;
          resultIndex < event.results.length;
          resultIndex += 1
        ) {
          const result = event.results[resultIndex];
          const alternative = result?.[0];
          const text = alternative?.transcript.trim() ?? '';

          if (!text) {
            continue;
          }

          if (result.isFinal) {
            finalParts.push(text);
          } else {
            interimParts.push(text);
          }
        }

        const finalText = finalParts.join(' ').trim();
        const interimText = interimParts.join(' ').trim();

        dispatch({ type: 'set-interim', value: interimText });

        if (finalText) {
          dispatch({ type: 'append-final', value: finalText });
          awaitingResponseRef.current = true;
          safelyAbortRecognition();
          dispatch({ type: 'set-status', value: 'connected' });
          onFinalTranscriptRef.current?.(finalText);
        }
      };

      recognition.onerror = (event) => {
        recognitionRunningRef.current = false;

        if (!mountedRef.current || !activeRef.current) {
          return;
        }

        const error = mapRecognitionError(event);

        if (error === null) {
          return;
        }

        reportError(error);

        if (
          error.code === 'permission-denied' ||
          error.code === 'microphone-unavailable'
        ) {
          modeRef.current = 'demo';
          dispatch({ type: 'set-mode', value: 'demo' });
          dispatch({ type: 'set-status', value: 'connected' });
        }
      };

      recognition.onend = () => {
        recognitionRunningRef.current = false;

        if (
          !mountedRef.current ||
          !activeRef.current ||
          mutedRef.current ||
          speakingRef.current ||
          awaitingResponseRef.current ||
          modeRef.current !== 'live'
        ) {
          return;
        }

        dispatch({ type: 'set-status', value: 'connected' });
        scheduleRecognitionRestart();
      };
    },
    [reportError, safelyAbortRecognition, scheduleRecognitionRestart],
  );

  const startRecognition = useCallback(() => {
    if (
      !mountedRef.current ||
      !activeRef.current ||
      mutedRef.current ||
      speakingRef.current ||
      awaitingResponseRef.current ||
      modeRef.current !== 'live' ||
      recognitionRunningRef.current
    ) {
      return;
    }

    clearTimer(reconnectTimerRef);

    let recognition = recognitionRef.current;

    if (recognition === null) {
      const Recognition = getSpeechRecognitionConstructor();

      if (Recognition === undefined) {
        const error = getInitialVoiceError({
          ...support,
          liveCall: false,
          recognition: false,
        });

        modeRef.current = 'demo';
        dispatch({ type: 'set-mode', value: 'demo' });
        dispatch({ type: 'set-status', value: 'connected' });

        if (error !== null) {
          reportError(error);
        }

        return;
      }

      try {
        recognition = new Recognition();
        recognitionRef.current = recognition;
        configureRecognition(recognition);
      } catch {
        const error: VoiceCallError = {
          code: 'recognition-error',
          message:
            'Speech recognition could not start. The call has continued safely in demo mode.',
          recoverable: true,
        };

        modeRef.current = 'demo';
        dispatch({ type: 'set-mode', value: 'demo' });
        dispatch({ type: 'set-status', value: 'connected' });
        reportError(error);
        return;
      }
    } else {
      recognition.lang = langRef.current;
    }

    try {
      recognition.start();
    } catch (caughtError: unknown) {
      const errorName =
        caughtError instanceof DOMException ? caughtError.name : '';

      if (errorName === 'InvalidStateError') {
        recognitionRunningRef.current = true;
        return;
      }

      const permissionDenied =
        errorName === 'NotAllowedError' || errorName === 'SecurityError';
      const error: VoiceCallError = permissionDenied
        ? {
            code: 'permission-denied',
            message:
              'Microphone permission was denied. The call has continued safely in demo mode.',
            recoverable: true,
          }
        : {
            code: 'recognition-error',
            message:
              'Speech recognition could not start. The call has continued safely in demo mode.',
            recoverable: true,
          };

      modeRef.current = 'demo';
      dispatch({ type: 'set-mode', value: 'demo' });
      dispatch({ type: 'set-status', value: 'connected' });
      reportError(error);
    }
  }, [clearTimer, configureRecognition, reportError, support]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  const resumeListening = useCallback(() => {
    awaitingResponseRef.current = false;
    if (
      !activeRef.current ||
      mutedRef.current ||
      speakingRef.current ||
      modeRef.current !== 'live'
    ) {
      if (activeRef.current && mountedRef.current) {
        dispatch({ type: 'set-status', value: 'connected' });
      }
      return;
    }

    dispatch({ type: 'set-status', value: 'connecting' });
    startRecognitionRef.current();
  }, []);

  const finishSpeechRef = useRef<(token: number, text: string) => void>(
    () => undefined,
  );

  const finishSpeech = useCallback(
    (token: number, text: string) => {
      if (token !== speechTokenRef.current) {
        return;
      }

      clearTimer(demoSpeechTimerRef);
      speakingRef.current = false;
      awaitingResponseRef.current = false;
      const resolve = speechResolveRef.current;
      speechResolveRef.current = null;
      resolve?.();

      if (!mountedRef.current) {
        return;
      }

      onSpokenCompleteRef.current?.(text);

      if (!activeRef.current) {
        dispatch({ type: 'set-status', value: 'disconnected' });
        return;
      }

      if (mutedRef.current || modeRef.current === 'demo') {
        dispatch({ type: 'set-status', value: 'connected' });
        return;
      }

      dispatch({ type: 'set-status', value: 'connected' });
      startRecognitionRef.current();
    },
    [clearTimer],
  );

  useEffect(() => {
    finishSpeechRef.current = finishSpeech;
  }, [finishSpeech]);

  const cancelSpeech = useCallback(() => {
    speechTokenRef.current += 1;
    speakingRef.current = false;
    clearTimer(demoSpeechTimerRef);

    if (support.synthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Cancellation is best-effort; the speech token still invalidates events.
      }
    }

    const resolve = speechResolveRef.current;
    speechResolveRef.current = null;
    resolve?.();
  }, [clearTimer, support.synthesis]);

  const startCall = useCallback(() => {
    if (activeRef.current) {
      return;
    }

    const nextMode: VoiceCallMode = support.liveCall ? 'live' : 'demo';
    const initialError = getInitialVoiceError(support);

    activeRef.current = true;
    modeRef.current = nextMode;
    speakingRef.current = false;
    awaitingResponseRef.current = false;
    dispatch({ type: 'start', error: initialError, mode: nextMode });
    startElapsedTimer();

    if (mutedRef.current) {
      dispatch({ type: 'set-status', value: 'connected' });
      return;
    }

    if (nextMode === 'demo') {
      clearTimer(demoConnectTimerRef);
      demoConnectTimerRef.current = setTimeout(() => {
        demoConnectTimerRef.current = null;

        if (mountedRef.current && activeRef.current) {
          dispatch({ type: 'set-status', value: 'connected' });
        }
      }, DEMO_CONNECT_DELAY_MS);
      return;
    }

    startRecognitionRef.current();
  }, [clearTimer, startElapsedTimer, support]);

  const endCall = useCallback(() => {
    activeRef.current = false;
    speakingRef.current = false;
    awaitingResponseRef.current = false;
    recognitionRunningRef.current = false;
    clearTimer(reconnectTimerRef);
    clearTimer(demoConnectTimerRef);
    cancelSpeech();
    safelyAbortRecognition();
    stopElapsedTimer();

    if (mountedRef.current) {
      dispatch({ type: 'set-interim', value: '' });
      dispatch({ type: 'set-status', value: 'disconnected' });
    }
  }, [
    cancelSpeech,
    clearTimer,
    safelyAbortRecognition,
    stopElapsedTimer,
  ]);

  const setMuted = useCallback(
    (muted: boolean) => {
      mutedRef.current = muted;
      dispatch({ type: 'set-muted', value: muted });

      if (!activeRef.current || speakingRef.current) {
        return;
      }

      if (muted) {
        clearTimer(reconnectTimerRef);
        safelyAbortRecognition();
        dispatch({ type: 'set-interim', value: '' });
        dispatch({ type: 'set-status', value: 'connected' });
        return;
      }

      if (modeRef.current === 'live') {
        if (awaitingResponseRef.current) {
          dispatch({ type: 'set-status', value: 'connected' });
          return;
        }
        dispatch({ type: 'set-status', value: 'connecting' });
        startRecognitionRef.current();
      } else {
        dispatch({ type: 'set-status', value: 'connected' });
      }
    },
    [clearTimer, safelyAbortRecognition],
  );

  const toggleMute = useCallback(() => {
    setMuted(!mutedRef.current);
  }, [setMuted]);

  const speak = useCallback(
    (text: string, overrides: SpeakOptions = {}): Promise<void> => {
      const spokenText = text.trim();

      if (!spokenText || !activeRef.current) {
        return Promise.resolve();
      }

      cancelSpeech();
      safelyAbortRecognition();
      clearTimer(reconnectTimerRef);

      const token = speechTokenRef.current + 1;
      speechTokenRef.current = token;
      speakingRef.current = true;
      awaitingResponseRef.current = false;
      dispatch({ type: 'set-interim', value: '' });
      dispatch({ type: 'set-status', value: 'speaking' });

      const completion = new Promise<void>((resolve) => {
        speechResolveRef.current = resolve;
      });

      if (!support.synthesis) {
        reportError({
          code: 'synthesis-unsupported',
          message:
            'Speech playback is unavailable in this browser. The text response is still available.',
          recoverable: false,
        });
        demoSpeechTimerRef.current = setTimeout(() => {
          finishSpeechRef.current(token, spokenText);
        }, getDemoSpeechDuration(spokenText));
        return completion;
      }

      try {
        const defaults = speechDefaultsRef.current;
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = overrides.lang ?? langRef.current;
        utterance.pitch = overrides.pitch ?? defaults?.pitch ?? 1;
        utterance.rate = overrides.rate ?? defaults?.rate ?? 1;
        utterance.volume = overrides.volume ?? defaults?.volume ?? 1;
        utterance.voice = overrides.voice ?? defaults?.voice ?? null;
        utterance.onend = () => {
          finishSpeechRef.current(token, spokenText);
        };
        utterance.onerror = () => {
          reportError({
            code: 'synthesis-error',
            message:
              'Speech playback was interrupted. The text response is still available.',
            recoverable: true,
          });
          finishSpeechRef.current(token, spokenText);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        reportError({
          code: 'synthesis-error',
          message:
            'Speech playback could not start. The text response is still available.',
          recoverable: true,
        });
        finishSpeechRef.current(token, spokenText);
      }

      return completion;
    },
    [
      cancelSpeech,
      clearTimer,
      reportError,
      safelyAbortRecognition,
      support.synthesis,
    ],
  );

  const clearTranscript = useCallback(() => {
    dispatch({ type: 'clear-transcript' });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      activeRef.current = false;
      clearTimer(reconnectTimerRef);
      clearTimer(demoConnectTimerRef);
      clearTimer(demoSpeechTimerRef);
      stopElapsedTimer();
      safelyAbortRecognition();
      cancelSpeech();

      const recognition = recognitionRef.current;

      if (recognition !== null) {
        recognition.onstart = null;
        recognition.onspeechstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }

      recognitionRef.current = null;
    };
  }, [
    cancelSpeech,
    clearTimer,
    safelyAbortRecognition,
    stopElapsedTimer,
  ]);

  return useMemo(
    () => ({
      clearTranscript,
      elapsedSeconds: state.elapsedSeconds,
      endCall,
      error: state.error,
      isMuted: state.isMuted,
      mode: state.mode,
      resumeListening,
      setMuted,
      speak,
      startCall,
      status: state.status,
      support,
      toggleMute,
      transcript: state.transcript,
    }),
    [
      clearTranscript,
      endCall,
      resumeListening,
      setMuted,
      speak,
      startCall,
      state,
      support,
      toggleMute,
    ],
  );
}
