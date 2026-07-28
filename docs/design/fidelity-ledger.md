# Brand and design fidelity ledger

The supplied logo reference and public Synthio Labs website form the identity
reference for this independent prototype. This ledger records the implementation
decisions and available review evidence.

| Comparison point | Reference evidence | Implementation evidence | Resolution |
| --- | --- | --- | --- |
| Brand identity | Supplied black wordmark reference plus the public website's white and dark SVG wordmarks and product icon | `BrandLogo.tsx` and `BrandMark.tsx` self-host the official public assets; responsive CSS switches between full wordmark and compact mark without distorting either | Preserved |
| Typography | The public Synthio Labs site uses Geist for interface and body content | `@fontsource-variable/geist` is bundled locally and `Geist Variable` leads the application font stack | Preserved without a runtime font request |
| Three-surface desktop shell | Persistent session rail, central chat, and voice panel share one full-height canvas | `App.tsx` composes the sidebar and workspace; `styles.css` uses a flex shell with fixed sidebar/voice widths and a fluid chat column | Preserved |
| Information hierarchy | Synthio Labs branding, conversation title, and availability lead the chat; utility actions remain secondary | `AppHeader.tsx` uses one heading, a status group, and compact labelled actions | Preserved with accessible labels |
| Message roles | Synthio Assistant content is left-aligned with an identity mark; user content uses a compact right-aligned bubble | `MessageBubble.tsx` keeps semantic articles, delivery metadata, copy, error, retry, and streaming states | Preserved and extended |
| Domain relevance | Jarvis, Ather, Helix, Simulation Studio, and Polaris HQ scenarios make the workspace relevant to public Synthio Labs workflow themes | Six synthetic starter workflows cover those five product themes plus a cross-workflow safety handoff without claiming live product integrations | Added as an assignment differentiator |
| Fresh-chat discovery | An evaluator should understand the available demo paths without first writing domain-specific prompts | `StarterPrompts.tsx` presents six outcome-led cards that send immediately, followed by a separate, clearly labelled shortcut for the intentional retry-error state | Added for one-click reviewer testing |
| Structured assistant answers | Recommendations use quiet dividers and clear step markers | `MessageContent.tsx` renders ordered blocks without reordering surrounding paragraphs | Preserved and regression-tested |
| Voice presence | Listening state, orb, transcript, waveform, timer, mute, and end-call controls form one focused surface | `VoicePanel.tsx` implements the required states and controls; `useVoiceCall.ts` owns recognition, synthesis, timers, cancellation, and fallback mode | Preserved with an honest unsupported-browser fallback |
| Mobile transformation | Navigation becomes a drawer and voice becomes a dedicated full-screen call view | Responsive styles collapse the sidebar, promote voice to a modal, trap and restore focus, and keep controls usable in short landscape viewports | Preserved and hardened for keyboard and touch |
| Motion and feedback | Subtle glow, waveform movement, streaming feedback, and panel entrances communicate activity | CSS motion is limited to state feedback and disabled by `prefers-reduced-motion`; live regions announce status and transcript changes | Preserved with reduced-motion support |

## Verification record

- The supplied logo reference and official public SVG/PNG assets were inspected
  at original resolution before integration.
- The release gate covers lint, strict TypeScript, the automated Vitest suite,
  and a production build. Deployment checks cover the Vercel and GitHub Pages
  outputs.
- An earlier `1280x720` interaction smoke covered initial rendering,
  Enter-to-send, streaming output, deterministic `/error` and retry behavior,
  and a clean console.
- The final brand pass is checked locally with Playwright at `1440×900`,
  `430×900`, `390×844`, `320×640`, and a short `667×320` voice layout.
  Breakpoint checks also cover `375`, `420`, `768`, `860`, `1179`, and `1180`
  pixels without header collisions or horizontal overflow. The managed
  in-app browser was unavailable for this pass, so local rendered QA used
  Playwright; an earlier hosted-site pass was also blocked by enterprise
  network policy. Two verified implementation screenshots are committed for
  the reviewer-facing README; transient snapshots remain ignored QA artifacts.

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
