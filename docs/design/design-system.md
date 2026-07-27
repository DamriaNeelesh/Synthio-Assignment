# Synthio Labs AI Assistant design system

The implementation follows the desktop and mobile concepts in this directory.
It presents Synthio Assistant as a focused life-sciences workflow companion,
while remaining clearly identified as an independent assignment prototype.

## Direction

- Premium near-black AI workspace with editorial spacing and restrained
  periwinkle light.
- Open conversation canvas instead of a stack of dashboard cards.
- Slim conversation rail, focused chat area, and contextual voice panel on
  desktop.
- Drawer-based chat navigation and full-screen voice dialog on mobile.
- Domain cues come from useful text and workflow context, not decorative
  clinical imagery.
- Motion is limited to message entry, streaming feedback, the live waveform,
  and voice-state communication.

## Core tokens

| Role | Value |
| --- | --- |
| App background | `#080b12` |
| Raised background | `#0d121d` |
| Surface | `#121827` |
| Surface strong | `#182036` |
| Primary text | `#f3f4fb` |
| Muted text | `#8c93a8` |
| Hairline | `rgba(166, 176, 209, 0.16)` |
| Accent | `#7779ff` |
| Accent bright | `#9d9eff` |
| Online / listening | `#7ee7c4` |
| Destructive | `#ff5b64` |
| Compact radius | `12px` |
| Message radius | `18px` |
| Panel radius | `22px` |

## Typography

- UI and content use an Inter-compatible system stack.
- Conversation title: `18px-22px` at weight `650`.
- Body: `15px / 1.55`.
- Utility labels: `12px-13px` at weight `550`.
- Mobile interactive targets: minimum `44px`.

## Component families

- **Buttons:** primary accent, neutral icon, destructive call, and low-emphasis
  text variants.
- **Conversation rows:** default, hover, active, and contextual-action states.
- **Messages:** open assistant rows, right-aligned user bubbles, streaming,
  complete, and failed variants.
- **Voice:** desktop rail and mobile full-screen dialog powered by the same call
  state model.
- **Feedback:** inline error with retry, loading indicator, empty state,
  transcript status, and toast.
- **Safety cues:** concise synthetic-data and approved-content reminders that do
  not impersonate a production compliance system.

## Responsive model

- `>=1180px`: three-region desktop layout with integrated voice rail when
  active.
- `768px-1179px`: conversation rail plus chat; voice opens as an overlay.
- `<768px`: sidebar drawer, compact app bar, edge-to-edge chat, and full-screen
  voice call.

Breakpoints alter composition rather than duplicating behavior, so sessions,
message state, voice state, and accessibility semantics remain consistent.

## Interaction principles

- Show user input immediately and stream assistant output to reduce perceived
  latency.
- Keep state labels explicit: Connecting, Connected, Listening, Speaking, or
  Disconnected.
- Preserve a usable text path when speech recognition or synthesis is
  unavailable.
- Make destructive session and call actions visually distinct.
- Trap and restore focus in modal surfaces, label icon-only controls, and
  respect reduced-motion preferences.
- Never imply that synthetic workflow content is medical advice, real patient
  data, or an approved production response.
