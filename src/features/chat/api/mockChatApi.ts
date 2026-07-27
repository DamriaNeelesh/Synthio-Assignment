import {
  ChatApiError,
  type ChatApi,
  type ChatResponse,
  type ChatStreamChunk,
  type StreamChatRequest,
} from './types';

export interface MockChatApiOptions {
  initialDelayMs?: number;
  chunkDelayMs?: number;
  wordsPerChunk?: number;
}

const DEFAULT_OPTIONS: Required<MockChatApiOptions> = {
  initialDelayMs: 30,
  chunkDelayMs: 7,
  wordsPerChunk: 6,
};

let mockResponseSequence = 0;

function createMockResponseId(): string {
  mockResponseSequence += 1;
  return `message-mock-${Date.now().toString(36)}-${mockResponseSequence.toString(36)}`;
}

function createAbortError(): DOMException {
  return new DOMException('The request was aborted.', 'AbortError');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

async function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

  if (milliseconds <= 0) {
    await Promise.resolve();
    throwIfAborted(signal);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    function handleAbort() {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', handleAbort);
      reject(createAbortError());
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function splitIntoChunks(content: string, wordsPerChunk: number): string[] {
  const words = content.match(/\S+\s*/g) ?? [];
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += wordsPerChunk) {
    chunks.push(words.slice(index, index + wordsPerChunk).join(''));
  }

  return chunks;
}

export function createMockReply(message: string): string {
  const normalized = message.trim().toLowerCase();
  const explicitProduct =
    normalized.includes('jarvis')
      ? 'jarvis'
      : normalized.includes('ather')
        ? 'ather'
        : normalized.includes('helix')
          ? 'helix'
          : normalized.includes('simulation studio')
            ? 'simulation'
            : normalized.includes('polaris')
              ? 'polaris'
              : null;

  if (
    normalized.includes('adverse event') ||
    normalized.includes('safety signal') ||
    normalized.includes('side effect')
  ) {
    return 'Safety-first workflow — synthetic demo\n\n1. Acknowledge the report neutrally and avoid assessing causality or giving medical advice.\n2. Capture only the minimum details required by the configured safety process; do not request or display unnecessary personal data here.\n3. Trigger the approved adverse-event escalation immediately and connect the person to the designated human or emergency pathway when configured.\n4. Preserve the original wording, timestamp, consent state, and handoff outcome in the audit trail.\n\nThis mock assistant does not replace a clinician, pharmacovigilance team, or emergency service.';
  }

  if (
    explicitProduct === 'jarvis' ||
    (explicitProduct === null &&
      (normalized.includes('pre-call') ||
        normalized.includes('post-call') ||
        normalized.includes('field call') ||
        normalized.includes('crm record')))
  ) {
    return 'Jarvis field workflow — synthetic demo\n\n1. Pre-call — Summarize the fictional account context, recent needs, open actions, and approved talking points.\n2. During the call — Listen for questions and commitments without generating unsupported clinical or promotional claims.\n3. Post-call — Structure the need, theme, action, owner, due date, and approved source references for CRM review.\n4. Guardrails — Route off-label questions to Medical Information and any adverse-event or product-quality report to the required safety workflow.\n\nNo real HCP or patient data is used, and every output should remain reviewable and auditable.';
  }

  if (
    explicitProduct === 'ather' ||
    (explicitProduct === null &&
      (normalized.includes('hcp') ||
        normalized.includes('scientific exchange') ||
        normalized.includes('off-label') ||
        normalized.includes('medical information')))
  ) {
    return 'Ather scientific-response workflow — synthetic demo\n\n1. Clarify the HCP’s intent and desired level of detail.\n2. Retrieve only configured PI, approved content, Medical Information guidance, and permitted references.\n3. Present a concise answer with source traceability; do not fabricate a study, statistic, dosing instruction, or product claim.\n4. Route off-label requests through the approved Medical Information escalation rather than generating a promotional response.\n5. Log the question, response boundary, sources, and escalation outcome for review.\n\nThis demonstrates interaction design, not medical guidance.';
  }

  if (
    explicitProduct === 'helix' ||
    (explicitProduct === null &&
      (normalized.includes('patient support') ||
        normalized.includes('patient-support') ||
        normalized.includes('onboarding') ||
        normalized.includes('enrollment') ||
        normalized.includes('coverage')))
  ) {
    return 'Helix patient-support flow — synthetic demo\n\n1. Welcome and consent — Explain the program scope, privacy choices, and route to a human.\n2. Onboarding — Guide the fictional participant through required steps and flag missing information without collecting unnecessary sensitive data.\n3. Access — Explain approved benefit-verification, prior-authorization, and support-program steps.\n4. Ongoing support — Use approved education and reminders while directing clinical decisions to the care team.\n5. Safety — Detect possible adverse events and trigger the configured human escalation immediately.\n\nNever paste identifiable patient information into this demo.';
  }

  if (
    explicitProduct === 'simulation' ||
    (explicitProduct === null &&
      (normalized.includes('persona') ||
        normalized.includes('concept test') ||
        normalized.includes('market research') ||
        normalized.includes('advisory board')))
  ) {
    return 'Simulation Studio research plan — synthetic demo\n\n1. Define the decision, approved concepts, target segments, and success criteria.\n2. Create diverse synthetic HCP or patient personas with documented assumptions.\n3. Run identical core questions plus controlled probes for clarity, credibility, fair balance, and confusion.\n4. Compare themes, retain minority viewpoints, and preserve prompt versions and transcripts for auditability.\n5. Treat simulated findings as hypotheses and validate material decisions with compliant human research and Medical, Legal, and Regulatory review.\n\nSynthetic personas are not real clinicians or patients.';
  }

  if (
    explicitProduct === 'polaris' ||
    (explicitProduct === null &&
      (normalized.includes('commercial data') ||
        normalized.includes('commercial question') ||
        normalized.includes('dashboard') ||
        normalized.includes('trend')))
  ) {
    return 'Polaris HQ analysis pattern — synthetic demo\n\n1. Confirm the commercial question, time period, population, and approved source systems.\n2. Analyze field activity, recurring HCP needs, access barriers, patient-support signals, and outcomes in parallel.\n3. Separate observed evidence from interpretation and disclose freshness, missing-data, and selection-bias limitations.\n4. Return leading signals with drill-down dimensions and source references, never an unsupported causal claim.\n5. Log the query, transformations, sources, and output so the result remains auditable.\n\nNo dataset is connected in this demo, so I will not invent a finding or metric.';
  }

  if (
    normalized.includes('hello') ||
    normalized.includes('hi ') ||
    normalized === 'hi'
  ) {
    return 'Hi — I’m Synthio Assistant. Try a fictional Jarvis field workflow, an Ather scientific exchange, a Helix patient-support journey, a Simulation Studio concept test, or a Polaris HQ commercial question. I use synthetic scenarios only and keep approved-content, audit, off-label, and safety escalation boundaries visible.';
  }

  return 'I can help map that request to a Synthio Labs workflow. Share the business outcome and choose Jarvis, Ather, Helix, Simulation Studio, or Polaris HQ. Please use only fictional records: this demo does not need real patient or HCP data, and it will not invent medical facts or commercial findings.';
}

export function createMockChatApi(
  options: MockChatApiOptions = {},
): ChatApi {
  const settings = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return {
    async streamMessage({
      message,
      signal,
      onChunk,
    }: StreamChatRequest): Promise<ChatResponse> {
      await delay(settings.initialDelayMs, signal);

      if (message.toLowerCase().includes('/error')) {
        throw new ChatApiError(
          'forced_mock_error',
          'The mock assistant was asked to simulate an error.',
          { retryable: true },
        );
      }

      const content = createMockReply(message);
      const chunks = splitIntoChunks(content, settings.wordsPerChunk);

      for (let index = 0; index < chunks.length; index += 1) {
        await delay(settings.chunkDelayMs, signal);
        throwIfAborted(signal);

        const chunk: ChatStreamChunk = {
          delta: chunks[index],
          index,
        };
        await onChunk(chunk);
      }

      throwIfAborted(signal);
      return {
        id: createMockResponseId(),
        content,
        provider: 'mock',
        finishedAt: new Date().toISOString(),
      };
    },
  };
}
