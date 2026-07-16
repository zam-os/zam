# Smart Recall through the MCP Apps host

**Goal:** Make Recall use the intelligence supplied by its MCP Apps host by
default, while preserving the current reveal-and-self-rate flow behind an
opt-in speed setting.

## Status

- [x] **Phase 1 — host-assisted Recall and opt-in quick mode**

## Architecture

- `recall.quick_mode` is a user setting. Missing means `false`, so smart mode
  is the default. The Settings card labels the opt-in behavior “Just show
  questions and answers for speed”.
- `zam_open_recall` reads that setting and passes `quickMode` to the Recall
  app. Quick mode preserves the current type/reveal/compare/self-rate flow.
- Smart mode feature-detects MCP Apps host capabilities. It prefers draft
  `sampling/createMessage` for in-card evaluation and follow-up discussion;
  when only stable `ui/message` exists, it hands the answer to the host
  conversation. It never silently treats an unsupported host as intelligent.
- The ZAM Companion implements MCP Apps sampling by adapting requests to the
  VS Code Language Model API. Model access remains user-initiated and uses the
  editor's consent and quota controls. No model provider enters the kernel.
- A2UI is not added. It changes how UI is described and rendered, but it does
  not supply the model bridge needed by this fixed Recall surface.

## Phase 1 — host-assisted Recall and opt-in quick mode

- Add failing contracts for the setting, MCP opening result, Companion
  sampling bridge, and Recall bundle markers.
- Expose the setting through the existing closed Settings bridge allowlist
  and render the disabled-by-default toggle.
- Add host-assisted answer evaluation, suggested rating, reference feedback,
  and in-card follow-up discussion to Recall; preserve quick mode unchanged.
- Advertise and implement `sampling/createMessage` in the Companion through
  the VS Code Language Model API, with no-model and consent failures surfaced
  to the card.
- Run formatting, lint, typecheck, focused tests, the full suite, and build.
