import {
  BarChart3,
  FlaskConical,
  HeartHandshake,
  ShieldAlert,
  Target,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

export interface StarterPrompt {
  description: string;
  icon: LucideIcon;
  id: string;
  product: string;
  prompt: string;
  title: string;
}

export const STARTER_PROMPTS: readonly StarterPrompt[] = [
  {
    description:
      'Create a review-ready brief from a fictional CRM record.',
    icon: Target,
    id: 'jarvis',
    product: 'Jarvis',
    prompt:
      'Create a Jarvis-style pre-call brief from a fictional CRM record. Include approved-content, follow-up, and compliance checkpoints.',
    title: 'Prepare a field call',
  },
  {
    description:
      'Review source boundaries, audit steps, and Medical Information escalation.',
    icon: FlaskConical,
    id: 'ather',
    product: 'Ather',
    prompt:
      'Show an Ather-style safe-response workflow for a fictional HCP question that may be off-label. Include source boundaries, audit steps, and Medical Information escalation.',
    title: 'Handle an HCP question',
  },
  {
    description:
      'Map consent, access support, privacy boundaries, and human handoffs.',
    icon: HeartHandshake,
    id: 'helix',
    product: 'Helix',
    prompt:
      'Draft a Helix-style onboarding flow for a fictional patient-support program. Include consent, access support, privacy boundaries, and human escalation.',
    title: 'Plan patient onboarding',
  },
  {
    description:
      'Compare approved concepts with clearly labelled synthetic personas.',
    icon: UsersRound,
    id: 'simulation',
    product: 'Simulation Studio',
    prompt:
      'Design a Simulation Studio concept test with synthetic HCP and patient personas. Include assumptions, evaluation criteria, and validation limits.',
    title: 'Test a concept',
  },
  {
    description:
      'Frame an analysis across fictional data without inventing metrics.',
    icon: BarChart3,
    id: 'polaris',
    product: 'Polaris HQ',
    prompt:
      'Show a Polaris HQ analysis pattern for a commercial question across synthetic field and access data. Separate evidence from interpretation and do not invent metrics.',
    title: 'Explore commercial signals',
  },
  {
    description:
      'Demonstrate a safe handoff without diagnosing or giving advice.',
    icon: ShieldAlert,
    id: 'safety',
    product: 'Safety drill',
    prompt:
      'A caller reports a possible adverse event. Show the safety-first handoff using fictional details only; do not diagnose or give medical advice.',
    title: 'Run a safety handoff',
  },
] as const;

export const ERROR_TEST_PROMPT =
  'Please /error so I can test the retry experience.';
