import { describe, expect, it } from 'vitest';
import { createMockChatApi, createMockReply } from './mockChatApi';

const TEST_OPTIONS = {
  initialDelayMs: 0,
  chunkDelayMs: 0,
  wordsPerChunk: 3,
};

describe('mock chat API', () => {
  it('streams an awaited deterministic response in order', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const chunks: string[] = [];
    const indexes: number[] = [];
    let callbackInProgress = false;

    const response = await api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Create a Jarvis pre-call brief',
      onChunk: async ({ delta, index }) => {
        expect(callbackInProgress).toBe(false);
        callbackInProgress = true;
        await Promise.resolve();
        chunks.push(delta);
        indexes.push(index);
        callbackInProgress = false;
      },
    });

    expect(response.provider).toBe('mock');
    expect(chunks.join('')).toBe(response.content);
    expect(response.content).toBe(
      createMockReply('Create a Jarvis pre-call brief'),
    );
    expect(indexes).toEqual(indexes.map((_, index) => index));
  });

  it.each([
    [
      'Jarvis',
      'Prepare a Jarvis pre-call brief',
      'Jarvis field workflow — synthetic demo\n\n1. Pre-call — Summarize the fictional account context, recent needs, open actions, and approved talking points.\n2. During the call — Listen for questions and commitments without generating unsupported clinical or promotional claims.\n3. Post-call — Structure the need, theme, action, owner, due date, and approved source references for CRM review.\n4. Guardrails — Route off-label questions to Medical Information and any adverse-event or product-quality report to the required safety workflow.\n\nNo real HCP or patient data is used, and every output should remain reviewable and auditable.',
    ],
    [
      'Ather',
      'Run an Ather HCP scientific exchange with an off-label question',
      'Ather scientific-response workflow — synthetic demo\n\n1. Clarify the HCP’s intent and desired level of detail.\n2. Retrieve only configured PI, approved content, Medical Information guidance, and permitted references.\n3. Present a concise answer with source traceability; do not fabricate a study, statistic, dosing instruction, or product claim.\n4. Route off-label requests through the approved Medical Information escalation rather than generating a promotional response.\n5. Log the question, response boundary, sources, and escalation outcome for review.\n\nThis demonstrates interaction design, not medical guidance.',
    ],
    [
      'Helix',
      'Create a Helix patient onboarding flow',
      'Helix patient-support flow — synthetic demo\n\n1. Welcome and consent — Explain the program scope, privacy choices, and route to a human.\n2. Onboarding — Guide the fictional participant through required steps and flag missing information without collecting unnecessary sensitive data.\n3. Access — Explain approved benefit-verification, prior-authorization, and support-program steps.\n4. Ongoing support — Use approved education and reminders while directing clinical decisions to the care team.\n5. Safety — Detect possible adverse events and trigger the configured human escalation immediately.\n\nNever paste identifiable patient information into this demo.',
    ],
    [
      'Simulation Studio',
      'Design a Simulation Studio concept test with synthetic personas',
      'Simulation Studio research plan — synthetic demo\n\n1. Define the decision, approved concepts, target segments, and success criteria.\n2. Create diverse synthetic HCP or patient personas with documented assumptions.\n3. Run identical core questions plus controlled probes for clarity, credibility, fair balance, and confusion.\n4. Compare themes, retain minority viewpoints, and preserve prompt versions and transcripts for auditability.\n5. Treat simulated findings as hypotheses and validate material decisions with compliant human research and Medical, Legal, and Regulatory review.\n\nSynthetic personas are not real clinicians or patients.',
    ],
    [
      'Polaris HQ',
      'Ask Polaris HQ a commercial data question',
      'Polaris HQ analysis pattern — synthetic demo\n\n1. Confirm the commercial question, time period, population, and approved source systems.\n2. Analyze field activity, recurring HCP needs, access barriers, patient-support signals, and outcomes in parallel.\n3. Separate observed evidence from interpretation and disclose freshness, missing-data, and selection-bias limitations.\n4. Return leading signals with drill-down dimensions and source references, never an unsupported causal claim.\n5. Log the query, transformations, sources, and output so the result remains auditable.\n\nNo dataset is connected in this demo, so I will not invent a finding or metric.',
    ],
    [
      'safety escalation',
      'A caller reports a possible adverse event',
      'Safety-first workflow — synthetic demo\n\n1. Acknowledge the report neutrally and avoid assessing causality or giving medical advice.\n2. Capture only the minimum details required by the configured safety process; do not request or display unnecessary personal data here.\n3. Trigger the approved adverse-event escalation immediately and connect the person to the designated human or emergency pathway when configured.\n4. Preserve the original wording, timestamp, consent state, and handoff outcome in the audit trail.\n\nThis mock assistant does not replace a clinician, pharmacovigilance team, or emergency service.',
    ],
    [
      'fallback',
      'Help with an unknown workflow',
      'I can help map that request to a Synthio Labs workflow. Share the business outcome and choose Jarvis, Ather, Helix, Simulation Studio, or Polaris HQ. Please use only fictional records: this demo does not need real patient or HCP data, and it will not invent medical facts or commercial findings.',
    ],
  ])('returns the exact compliance-aware %s reply', (_label, prompt, expected) => {
    expect(createMockReply(prompt)).toBe(expected);
  });

  it.each([
    [
      'Simulation Studio',
      'Design a concept test with synthetic HCP and patient personas in Simulation Studio.',
      'Simulation Studio research plan',
    ],
    [
      'Polaris HQ',
      'Ask Polaris HQ to synthesize recurring HCP needs from fictional commercial data.',
      'Polaris HQ analysis pattern',
    ],
    [
      'Helix',
      'Create a Helix handoff from a fictional HCP referral into patient support.',
      'Helix patient-support flow',
    ],
  ])(
    'honors explicit %s intent when generic terms overlap',
    (_label, prompt, expectedHeading) => {
      expect(createMockReply(prompt)).toContain(expectedHeading);
    },
  );

  it('returns identical content for identical prompts', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const run = () =>
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Design a Simulation Studio concept test',
        onChunk: () => undefined,
      });

    const [first, second] = await Promise.all([run(), run()]);
    expect(first.content).toBe(second.content);
  });

  it('simulates failures only when explicitly requested', async () => {
    const api = createMockChatApi(TEST_OPTIONS);

    await expect(
      api.streamMessage({
        conversationId: 'conversation-1',
        message: 'Please /error so I can test retry UX',
        onChunk: () => undefined,
      }),
    ).rejects.toMatchObject({
      name: 'ChatApiError',
      code: 'forced_mock_error',
      retryable: true,
    });
  });

  it('honors AbortSignal before and during streaming', async () => {
    const api = createMockChatApi(TEST_OPTIONS);
    const controller = new AbortController();

    const request = api.streamMessage({
      conversationId: 'conversation-1',
      message: 'Create a detailed Polaris HQ analysis',
      signal: controller.signal,
      onChunk: ({ index }) => {
        if (index === 0) {
          controller.abort();
        }
      },
    });

    await expect(request).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
