# Synthex product design system

This implementation follows the approved visual concepts in this directory.

## Direction

- Premium, near-black AI workspace with editorial spacing and restrained periwinkle light.
- Open conversation canvas rather than stacked card grids.
- A slim conversation rail, focused chat area, and contextual voice panel on desktop.
- A drawer-based chat layout and full-screen voice surface on mobile.
- Motion is limited to useful state communication: message entry, streaming dots, the live waveform, and the voice orb.

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

- UI and content: Inter-compatible system stack, with deliberate sizes for every control.
- Conversation title: 18–22px / 650.
- Body: 15px / 1.55.
- Utility labels: 12–13px / 550.
- Mobile tap targets: minimum 44px.

## Component families

- Buttons: primary accent, neutral icon, destructive call, and low-emphasis text variants.
- Conversation rows: default, hover, active, and contextual-action states.
- Messages: open assistant rows, right-aligned user bubbles, streaming and failed variants.
- Voice: desktop rail and mobile full-screen variants powered by the same call-state model.
- Feedback: inline error with retry, loading/streaming indicator, empty conversation state, and toast.

## Responsive model

- `>= 1180px`: three-region desktop layout with integrated voice rail when active.
- `768–1179px`: conversation rail plus chat; voice opens as an overlay.
- `< 768px`: sidebar drawer, compact app bar, edge-to-edge chat, full-screen voice call.
