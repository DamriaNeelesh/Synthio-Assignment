import type { ConversationState } from '../../types';

export const DEFAULT_CONVERSATION_TITLE = 'New conversation';

/**
 * Interview-ready sample data based on fictional life-sciences workflows.
 * The names, records, and scenarios below are synthetic and contain no PHI.
 */
const SEEDED_STATE: ConversationState = {
  activeConversationId: 'conversation-jarvis',
  conversations: [
    {
      id: 'conversation-jarvis',
      title: 'Jarvis field call prep',
      createdAt: '2026-07-27T19:35:00.000Z',
      updatedAt: '2026-07-27T20:04:07.000Z',
      messages: [
        {
          id: 'message-jarvis-welcome',
          role: 'assistant',
          content:
            "Hi! I'm Synthio Assistant. I can turn synthetic, approved life-sciences context into clear field, HCP, patient-support, research, and commercial workflows. This demo never uses real patient or HCP data. What should we work through?",
          createdAt: '2026-07-27T19:35:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-jarvis-user',
          role: 'user',
          content:
            'Create a Jarvis-style pre-call brief from a fictional CRM record for Riverside Cardiology.',
          createdAt: '2026-07-27T19:36:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-jarvis-assistant',
          role: 'assistant',
          content:
            'Jarvis-style pre-call brief — synthetic demo\n\n1. Account context — Riverside Cardiology is a fictional group practice. The mock CRM shows an open request for approved access and logistics material.\n2. Conversation objective — Confirm the request, understand the operational barrier, and agree on a documented follow-up.\n3. Suggested questions — What information would be most useful? Which approved format fits the team workflow? Who should receive the follow-up?\n4. Compliance checkpoints — Use only approved content, route off-label questions to Medical Information, and escalate any adverse-event or product-quality report through the required safety workflow.\n5. After the call — Capture the need, action, owner, due date, and source reference in a reviewable CRM note.\n\nNo clinical claim has been generated, and no real HCP or patient data is included.',
          createdAt: '2026-07-27T19:36:08.000Z',
          status: 'complete',
        },
        {
          id: 'message-jarvis-user-followup',
          role: 'user',
          content:
            'Now give me a compliant post-call note template with an audit trail.',
          createdAt: '2026-07-27T20:04:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-jarvis-followup-assistant',
          role: 'assistant',
          content:
            'Review-ready post-call note — synthetic demo\n\n1. Interaction context — Record the fictional account, channel, timestamp, and purpose.\n2. Documented HCP need — Capture the question or operational barrier in neutral language without adding an interpretation.\n3. Approved content shared — List the approved asset and source reference; do not recreate a clinical claim.\n4. Follow-up — Record the action, owner, due date, and completion status.\n5. Escalation — Route off-label questions to Medical Information and safety or product-quality reports through the required workflow.\n6. Audit trail — Preserve source versions, timestamps, reviewer state, and linked escalation IDs.\n\nKeep unnecessary personal data out of the note and submit it through the configured CRM review process.',
          createdAt: '2026-07-27T20:04:07.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-ather',
      title: 'Ather scientific exchange',
      createdAt: '2026-07-27T12:15:00.000Z',
      updatedAt: '2026-07-27T19:05:00.000Z',
      messages: [
        {
          id: 'message-ather-user',
          role: 'user',
          content:
            'Show how Ather should handle a fictional HCP question that may be off-label.',
          createdAt: '2026-07-27T12:15:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-ather-assistant',
          role: 'assistant',
          content:
            'Ather-style safe-response workflow\n\n1. Clarify the scientific intent without expanding the unapproved topic.\n2. Answer only from configured PI, approved content, Medical Information guidance, and permitted references.\n3. If the request remains off-label, avoid generating a promotional answer and route it to the approved Medical Information channel.\n4. Preserve the question, response boundary, source set, timestamp, and escalation outcome in the audit log.\n5. If a safety signal is mentioned, start the adverse-event workflow immediately rather than waiting for the conversation to end.\n\nThis is a workflow demonstration, not medical guidance or a product claim.',
          createdAt: '2026-07-27T12:15:06.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-helix',
      title: 'Helix patient onboarding',
      createdAt: '2026-07-26T09:45:00.000Z',
      updatedAt: '2026-07-27T15:05:00.000Z',
      messages: [
        {
          id: 'message-helix-user',
          role: 'user',
          content:
            'Draft a Helix onboarding flow for a fictional patient-support program.',
          createdAt: '2026-07-26T09:45:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-helix-assistant',
          role: 'assistant',
          content:
            'Helix-style onboarding flow — synthetic demo\n\n1. Welcome and consent — Explain the support scope, privacy choices, and how to reach a human.\n2. Enrollment — Walk through required fields and flag missing information without requesting unnecessary sensitive data.\n3. Access support — Explain benefit-verification and prior-authorization steps using approved program content.\n4. Treatment support — Share only approved expectations and reminders; direct clinical decisions to the care team.\n5. Safety handoff — Detect possible adverse events, acknowledge them neutrally, and trigger the configured human escalation workflow.\n\nUse fictional records for this demo; never paste identifiable patient information into the chat.',
          createdAt: '2026-07-26T09:45:07.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-simulation',
      title: 'Simulation Studio concept test',
      createdAt: '2026-07-25T09:45:00.000Z',
      updatedAt: '2026-07-26T19:05:00.000Z',
      messages: [
        {
          id: 'message-simulation-user',
          role: 'user',
          content:
            'Design a concept test with synthetic HCP and patient personas in Simulation Studio.',
          createdAt: '2026-07-25T09:45:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-simulation-assistant',
          role: 'assistant',
          content:
            'Simulation Studio research plan\n\n1. Define the decision, approved concept variants, and success criteria before creating personas.\n2. Build a diverse synthetic panel across role, setting, experience, access context, and communication preference.\n3. Ask identical core questions, then use controlled probes for clarity, credibility, fair balance, and likely confusion.\n4. Compare themes by persona, surface minority viewpoints, and retain transcripts plus prompt versions for review.\n5. Treat simulated findings as hypotheses: validate material decisions with compliant human research and Medical, Legal, and Regulatory review.\n\nSynthetic personas are research tools; they are not real clinicians or patients.',
          createdAt: '2026-07-25T09:45:07.000Z',
          status: 'complete',
        },
      ],
    },
    {
      id: 'conversation-polaris',
      title: 'Polaris HQ commercial insight',
      createdAt: '2026-07-24T11:30:00.000Z',
      updatedAt: '2026-07-25T16:20:00.000Z',
      messages: [
        {
          id: 'message-polaris-user',
          role: 'user',
          content:
            'How should Polaris HQ answer a commercial question across synthetic field and access data?',
          createdAt: '2026-07-24T11:30:00.000Z',
          status: 'complete',
        },
        {
          id: 'message-polaris-assistant',
          role: 'assistant',
          content:
            'Polaris HQ analysis pattern\n\n1. Confirm the business question, period, population, and approved data sources.\n2. Run parallel views across field activity, recurring HCP needs, access barriers, patient-support signals, and commercial outcomes.\n3. Separate observed evidence from interpretation and state missing-data or selection-bias limitations.\n4. Return the leading signals with drill-down dimensions and source references, not unsupported causal claims.\n5. Log the query, transformations, source freshness, and output so every insight remains auditable.\n\nNo source dataset is connected in this demo, so I will not invent a trend or metric.',
          createdAt: '2026-07-24T11:30:07.000Z',
          status: 'complete',
        },
      ],
    },
  ],
};

function cloneState(state: ConversationState): ConversationState {
  return {
    activeConversationId: state.activeConversationId,
    conversations: state.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        error: message.error ? { ...message.error } : undefined,
        retry: message.retry ? { ...message.retry } : undefined,
      })),
    })),
  };
}

export function createSeededConversationState(): ConversationState {
  return cloneState(SEEDED_STATE);
}

export function createEmptyConversationState(): ConversationState {
  return {
    activeConversationId: null,
    conversations: [],
  };
}
