# Skill-Learner Observation Replaces the In-House Screen Observer

**Status:** Proposed
**Date:** 2026-10-08
**Deciders:** Thomas (project owner), after external review
**Related:** [ADR 2026-06-20 — Observer permission model](2026-06-20-observer-permission-model.md) · [ADR 2026-06-22 — Screen recording observer](2026-06-22-screen-recording-observer.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [Observer privacy model (OKF)](../okf/observer-privacy-model.md) · [Observer open-source research](../observer-open-source-research.md)
**Supersedes on acceptance:** [ADR 2026-06-22](2026-06-22-screen-recording-observer.md) (Proposed; its screen-recording and observer decisions). Amends [ADR 2026-06-20](2026-06-20-observer-permission-model.md): its capture-policy parts then describe a path that no longer exists.
**Plan:** [Skill-learner observation plan](../plans/2026-10-08-skill-learner-observation.md)

---

## Context

### What ZAM can capture today

Checked against `main` at 87955c59.

| Surface | Location | Output reaches a model | Policy checked before capture |
|---|---|---|---|
| Windows sidecar `observer/` (window capture, UI Automation events, Raw Input counts, keyframes) | `observer/`, `desktop/src-tauri/src/lib.rs` | Through `observe-ui-snapshot` and the desktop panel | Yes, inside the sidecar (`privacy.rs`, `policy.json`) |
| `capture-ui` (one screenshot; `screencapture` on macOS, PowerShell on Windows) | `src/cli/commands/bridge.ts:2530` | Returned to the calling agent, which is a model | Yes (`bridge.ts:2539`) |
| `start-recording` / `stop-recording` (background ffmpeg, full screen: `avfoundation` on macOS, `gdigrab` desktop on Windows; files in the OS temp directory) | `bridge.ts:2628–2850` | Decimated video goes to `observe-ui-snapshot` | **No.** The block never reads the policy. |
| `observe-ui-snapshot` (images or video; video frames via ffmpeg; `--image` accepts any file) | `bridge.ts:2066–2123`, `src/cli/llm/vision.ts:88–130` | Vision role, cloud or local | **No.** Only `llm.vision.enabled` is checked. |
| Desktop observer panel: snapshot-and-analyze and a timed loop | `desktop/src/main.ts:4511–4691` | Through the rows above | Through the sidecar |

Two consequences follow.

1. The policy from ADR 2026-06-20 covers part of one path. The full-screen video path and `observe-ui-snapshot` bypass it. The bypass is in the code, not only in the design.
2. `llm.vision.enabled` is the only model-side gate. Photo import uses the same flag (`src/cli/llm/client.ts:466`). Enabling vision for photos therefore also enables screen analysis through the bridge.

The Studio MCP bridge excludes observer commands (`src/cli/commands/mcp.ts:122–131`). Any agent that can run shell commands still reaches them through `zam bridge`.

### The concern this ADR must answer

The project owner's main concern is that a model receives secrets that are visible on screen during observation: passwords, API keys, tokens, customer data, banking screens. Current controls are based on window title and process name (built-in floor and denylist). None of them inspects content. A secret in an ordinary window, such as `export TOKEN=…` in a terminal, a `.env` file in an editor, or a field in a browser form, is outside every current control. The open-source research already lists PII detection before vision as "Not started" (`docs/observer-open-source-research.md`, learning point 3).

A second route carries screen content to models: the vision model's text (summary, action targets, rationale). ZAM stores that text in the session log. The agent reads it back through `get-observations` and `observe-ui-watch`, and session synthesis uses it (`src/kernel/observation/session-synthesis.ts:268`). Removing the pixels does not remove this route.

Packaging does not solve the concern on its own. An optional tool still carries the capture code and the screen-to-model path.

### What observation is for

The project owner's framing (2026-10-08): observation watches the human in order to record a skill. Computer Use is the agent's own perceive-and-act capability; the observer should be the human-side counterpart. Skill-recording tools already exist, so building a bespoke visual recorder would duplicate a crowded field. ZAM already holds the parts that connect a skill to learning: skill discovery (`src/kernel/observation/skill-discovery.ts`) and session synthesis, which matches monitor commands against the steps of skills linked to one token (`docs/concepts/monitoring-methods.md`).

### Research snapshot (2026-10-08)

Demonstration-to-skill recorders exist. None of the candidates found combines the properties ZAM needs: structural capture, no pixels, keystroke masking at capture, and a clear licence.

- **Pixel-based.** ugarchance/record-and-replay-skill records input and a screenshot per click; its desktop capture uses OpenAdapt. OpenAdapt records screen, input and timing, with vision-based step matching; its raw captures stay local and unscrubbed by design. Microsoft's skill recorder captures on-screen activity, clicks and narration; deriving the steps requires Copilot CLI.
- **Structural.** humblebanana/open-record-replay (macOS; MIT according to a directory listing; mouse, keyboard and UI events as JSON traces; alpha). video-db/open-record-replay (accessibility-level events and typed text; macOS and Windows; no replay component). beuaaa/pywinauto_recorder (accessibility-based; Windows; emits Python).
- **Keystroke redaction at capture** is a documented pattern (webblackbox PR #3; merge status not verified). Matomo makes keystroke recording opt-in and masks password and card fields by default.
- **Licences** are not visible for every candidate. Each one needs its LICENSE file checked before any use.
- ZAM's own sidecar already offers a structural channel: UI Automation events and Raw Input counts, without typed characters. It is the only non-visual sensor ZAM owns, and it is Windows-only.

Consequence: a recorder does not remove the secret problem; it moves it. The decision therefore rests on a rule that ZAM enforces itself.

## Decision (proposed)

1. **ZAM stops producing screen observations.** On acceptance, the following are removed in phases (plan, Phase 5): the `observer/` sidecar, `capture-ui`, `start-recording`, `stop-recording`, the screen use of `observe-ui-snapshot`, `zam observer`, the desktop observer panel, the `observer.*` capture policy and its enforcement, and the sidecar build and bundling in release and CI.
2. **Demonstrations come from external skill learners.** A learner runs outside ZAM and is installed by the learner or the organisation. ZAM does not bundle one and does not depend on one.
3. **ZAM accepts only structural skill-step evidence.** The contract (plan, Phase 4) names the skill, the step, the outcome, the times, and the application or process. ZAM rejects, at any depth, payloads that carry pixels, frame or keyframe references, data URIs, typed characters, clipboard text, or free text captured from the screen. ZAM enforces this rule itself, so a learner's privacy claim is never the control.
4. **Evidence binds to skills through the existing skill-step link.** Session synthesis already maps monitor commands to the steps of skills linked to one token. The same mapping takes skill-step evidence. Confirmation stays mandatory: no learning state changes before the learner confirms.
5. **The `vision` role serves material import only** (ADR 2026-10-05). It is never used for screen content.
6. **Containment now.** The two paths that bypass the policy get a hard default-off switch until Phase 5 lands: the video path, and `observe-ui-snapshot` for video and `--image` input. This does not depend on the option chosen below.

## Options considered

**A. Keep and extend the in-house observer.** Rejected. Screen content stays inside ZAM, the native part is Windows-only, the video path sits outside the policy, and the research already shows the PII gap.

**B. Extract the visual observer into an optional installable tool.** Feasible. But the capture code, the screen prompts and the screen-to-model path remain ZAM's to maintain and audit, and an installed tool carries the same threat.

**C. Delete visual capture; adopt external structural learners under rule 3.** Recommended. It removes the largest secret surface from ZAM's own code and reuses an existing skill-creation path. Its risks are learner quality, licences, and learners that capture pixels or keys on their side. Rule 3 and deployment policy contain the last risk, and the spike tests it.

**D. Delete all demonstration capture.** ZAM keeps shell observation and skill discovery, and skills are authored by hand. Simplest to audit and lowest risk, with lower fidelity for GUI work. This is the fallback if no learner passes the gates.

**E. C plus ZAM's own non-visual UI Automation sensor.** Conditional. Keep the Windows sensor only if the spike shows that external learners lack element context ZAM needs. Otherwise delete it: it is a second native maintenance surface, and C provides the same structural evidence.

## Trade-off analysis

C beats B because the threat depends on where screen content lives and who processes it, not on which package ships it. C beats D on fidelity, but only if the spike passes. The plan therefore makes the spike a gate, not an assumption.

Replacement does not make secrets safe by itself. Most learners capture pixels or keys. Rule 3 keeps those payloads out of ZAM. Deployment policy must keep an unapproved learner off the machine. Both controls are required.

## Consequences

Easier:
- ZAM loses its screen capture code, its Windows sidecar, its desktop observer panel and two release steps.
- One evidence path (skill steps) replaces two (shell and screen).
- An organisation can switch observation off by not installing a learner. The default build contains no capture code.

Harder:
- The evidence contract must be defined, versioned and tested. Rule 3 needs forbidden-field tests at every depth.
- Bridge contracts change. Agents that call `capture-ui`, `observe-ui-snapshot`, `start-recording` or `stop-recording` must move. Before 1.0 the commands can be removed directly, but the removal belongs in the release notes.
- Existing data may contain screen-derived text or video: `~/.zam/observer/*.jsonl`, `zam-recording-*` and `zam-capture-*` files in the OS temp directory, and `observer.*` rows. Phase 2 inventories them. Nothing is deleted without confirmation.
- A learner needs governance: licence review, pinned versions, source review, and a visible indicator while recording (requirement G8 in the plan).

## Open questions for review

1. **Where does learner configuration live?** ADR 2026-09-04 keeps `observer.*` machine-scoped in `user_settings`. The owner's working rule says machine-local state belongs in `~/.zam/config.json`, not in the shareable database. These positions conflict, and the learner decision has to settle it.
2. **Is a structural channel enough for assessment?** The spike decides between C and E.
3. **Does anyone use the video path today?** Containment changes their workflow, so the owner must confirm.
4. **Legal review before any deployment with employees or minors.** Systematic monitoring of people raises GDPR questions (a data protection impact assessment is likely), and in Germany works-council co-determination applies to monitoring of employees (BetrVG §87(1) Nr. 6). Observing minors needs guardian consent rules. This ADR does not assess compliance.
5. **Which learner or learners are acceptable?** The spike result answers it.

## Citations

ZAM code, checked on `main` (87955c59):
- `src/cli/commands/bridge.ts`: `observe-ui-snapshot` (2066), `capture-ui` (2530, policy at 2539), `start-recording` (2628), `stop-recording` (2743, decimation at 2819), `get-observer-policy` (2850)
- `src/cli/llm/vision.ts`: `observeUiSnapshotViaLLM` (88), ffmpeg frame extraction (113, 123)
- `src/cli/llm/client.ts`: default-off vision (191–194), vision gate for image and video capabilities (466)
- `src/cli/llm/material-analyze.ts`: image capability for photo import (100–102)
- `src/kernel/observation/session-synthesis.ts`: UI branch (268)
- `src/cli/commands/mcp.ts`: Studio allowlist excludes observer commands (122–131)
- `desktop/src/main.ts`: observer panel and loop (1008–1027, 4511–4691)
- `observer/README.md`: sidecar capabilities and privacy behaviour

Research, 2026-10-08:
- https://github.com/ugarchance/record-and-replay-skill
- https://github.com/humblebanana/open-record-replay
- https://github.com/video-db/open-record-replay
- https://themenonlab.blog/blog/microsoft-skill-recorder-teach-agents-by-demonstration
- https://github.com/OpenAdaptAI/openadapt-capture
- https://github.com/OpenAdaptAI/openadapt-flow
- https://github.com/beuaaa/pywinauto_recorder
- https://github.com/a3mitskevich/webblackbox/pull/3
- https://matomo.org/faq/heatmap-session-recording/faq_24214/
