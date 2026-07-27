# Design fidelity ledger

The
[desktop concept](synthio-desktop-concept.png) and
[mobile concept](synthio-mobile-concept.png)
were used as the visual contract for the Synthio Labs AI Assistant prototype.
This ledger records the implementation decisions and available review evidence.

| Comparison point | Concept evidence | Implementation evidence | Resolution |
| --- | --- | --- | --- |
| Three-surface desktop shell | Persistent session rail, central chat, and voice panel share one full-height canvas | `App.tsx` composes the sidebar and workspace; `styles.css` uses a flex shell with fixed sidebar/voice widths and a fluid chat column | Preserved |
| Information hierarchy | Synthio Labs branding, conversation title, and availability lead the chat; utility actions remain secondary | `AppHeader.tsx` uses one heading, a status group, and compact labelled actions | Preserved with accessible labels |
| Message roles | Synthio Assistant content is left-aligned with an identity mark; user content uses a compact right-aligned bubble | `MessageBubble.tsx` keeps semantic articles, delivery metadata, copy, error, retry, and streaming states | Preserved and extended |
| Domain relevance | Jarvis, Ather, Helix, Simulation Studio, and Polaris HQ scenarios make the workspace relevant to public Synthio Labs workflow themes | Synthetic seed data and the domain-aware mock adapter provide immediate reviewer paths without claiming live product integrations | Added as an assignment differentiator |
| Structured assistant answers | Recommendations use quiet dividers and clear step markers | `MessageContent.tsx` renders ordered blocks without reordering surrounding paragraphs | Preserved and regression-tested |
| Voice presence | Listening state, orb, transcript, waveform, timer, mute, and end-call controls form one focused surface | `VoicePanel.tsx` implements the required states and controls; `useVoiceCall.ts` owns recognition, synthesis, timers, cancellation, and fallback mode | Preserved with an honest unsupported-browser fallback |
| Mobile transformation | Navigation becomes a drawer and voice becomes a dedicated full-screen call view | Responsive styles collapse the sidebar, promote voice to a modal, trap and restore focus, and keep controls usable in short landscape viewports | Preserved and hardened for keyboard and touch |
| Motion and feedback | Subtle glow, waveform movement, streaming feedback, and panel entrances communicate activity | CSS motion is limited to state feedback and disabled by `prefers-reduced-motion`; live regions announce status and transcript changes | Preserved with reduced-motion support |

## Verification record

- Both generated concepts were inspected at original resolution.
- The release gate covers lint, strict TypeScript, the automated Vitest suite,
  and a production build. Deployment checks cover the Vercel and GitHub Pages
  outputs.
- An earlier `1280x720` interaction smoke covered initial rendering,
  Enter-to-send, streaming output, deterministic `/error` and retry behavior,
  and a clean console.
- A fresh in-app-browser screenshot pass was attempted against both public
  deployments. The managed browser rejected the hosting domains under its
  enterprise network policy, so no fresh implementation screenshot is claimed
  as evidence. No alternative browser surface was used to bypass that policy.

## Intentional deviations

- The implementation uses restrained CSS gradients for the voice orb instead of
  a raster hero asset, keeping the interface lightweight, sharp, and themeable.
- Mobile chat bubbles are less card-heavy than the concept so long responses
  remain readable at `320px` and high zoom.
- Unsupported speech recognition remains an explicitly labelled demo call with
  no fabricated transcript.
- Public product themes inform the seeded scenarios, but the prototype uses
  synthetic data and mock integrations so it cannot be mistaken for a
  production medical, safety, patient-support, CRM, or analytics system.
