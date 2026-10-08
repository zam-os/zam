# Observation Without Content: Skill-Learner Evidence Replaces the In-House Screen Observer

**Status:** Proposed
**Date:** 2026-10-08
**Deciders:** Thomas (project owner), after external review
**Related:** [ADR 2026-06-20 — Observer permission model](2026-06-20-observer-permission-model.md) · [ADR 2026-06-22 — Screen recording observer](2026-06-22-screen-recording-observer.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-07-06a — MCP agent transport and surfaces](2026-07-06a-mcp-agent-transport-and-surfaces.md) · [Observer privacy model (OKF)](../okf/observer-privacy-model.md) · [Observer open-source research](../observer-open-source-research.md)
**Supersedes on acceptance:** [ADR 2026-06-22](2026-06-22-screen-recording-observer.md) (Proposed; its screen-recording and observer decisions). Amends [ADR 2026-06-20](2026-06-20-observer-permission-model.md): its capture-policy parts then describe a path that no longer exists.
**Plan:** [Skill-learner observation plan](../plans/2026-10-08-skill-learner-observation.md)

---

## Context

### What ZAM can capture today

Checked against `main` at 87955c59. An enterprise security review of 0.43.2 reported several of these rows independently; each was re-checked on `main`.

| Surface | Location | Output reaches a model | Policy checked before capture |
|---|---|---|---|
| Windows sidecar `observer/` (window capture, UI Automation events, Raw Input counts, keyframes) | `observer/`, `desktop/src-tauri/src/lib.rs` | Through `observe-ui-snapshot`, the desktop panel and the observer report log | Yes, inside the sidecar (`privacy.rs`, `policy.json`) |
| Sidecar OCR fallback: a GDI screenshot of the focused element, read by Windows OCR, when the element has no accessible name and is not a password field. Text-change events take the same route, so it runs again on every edit | `observer/src/uia.rs:961` | The recognised text becomes the element name in `~/.zam/observer/*.reports.jsonl`, which agents read | Only the built-in privacy floor; no setting turns it off |
| `capture-ui` (one screenshot; `screencapture` on macOS, PowerShell on Windows) | `src/cli/commands/bridge.ts:2530` | Returned to the calling agent, which is a model | Yes (`bridge.ts:2539`), by window title and process only |
| `start-recording` / `stop-recording` (background ffmpeg, full screen: `avfoundation` on macOS, `gdigrab` desktop on Windows; files in the OS temp directory) | `bridge.ts:2631–2853` | Decimated video goes to `observe-ui-snapshot` | **No.** The block never reads the policy. |
| `observe-ui-snapshot` (images or video; video frames via ffmpeg; `--image` accepts any file) | `bridge.ts:2066–2123`, `src/cli/llm/vision.ts:88–130` | Vision role, cloud or local | **No.** Only `llm.vision.enabled` is checked. |
| Desktop observer panel: snapshot-and-analyze and a timed loop | `desktop/src/main.ts:4511–4691` | Through the rows above | Through the sidecar |
| Shell monitor: every command line and working directory of a monitored session, verbatim | `src/kernel/observation/monitor-io.ts:46` | `zam_monitor`, and session synthesis returns the matched command texts to the agent | None. No redaction. |

Five consequences follow.

1. The policy from ADR 2026-06-20 covers part of one path. The full-screen video path and `observe-ui-snapshot` bypass it. The bypass is in the code, not only in the design.
2. `llm.vision.enabled` is the only model-side gate. Photo import uses the same flag (`src/cli/llm/client.ts:466`), so enabling vision for photos also enables screen analysis through the bridge. The flag is also one of the keys `setting-set` may write (`bridge.ts:3895–3904`), and `setting-set` is on the Studio bridge allowlist (`src/cli/commands/mcp.ts:159`). The Studio bridge tool is registered app-only, but that is a hint to the host: the server cannot tell a panel's call from a model's call. A gate a model can open is not a gate.
3. Observation is on by default, subject to per-session consent: the default policy scope is `window` (`src/kernel/observation/policy.ts:42`).
4. The sidecar's UI Automation channel is not content-free. The OCR fallback turns the pixels of unnamed fields into text, typed text included. Accessible names are screen text in their own right: window titles, email subjects, document names, list items with customer names. `observer/README.md:140` says the sidecar "never reads element values", and the comment at `uia.rs:495` says text-change events never carry "the text value itself". Both are wrong while the fallback exists.
5. Retention is declared but not enforced. The default policy says `retention: "none"`, and no code deletes observer reports, snapshots or monitor logs.

The Studio MCP bridge excludes observer commands (`src/cli/commands/mcp.ts:122–131`), but see consequence 2. Any agent that can run shell commands also reaches all of them through `zam bridge`.

### The concern this ADR must answer

The project owner's main concern is that a model receives secrets visible on screen or in a terminal during observation: passwords, API keys, tokens, customer data, banking screens. Current controls are based on window title and process name (built-in floor and denylist). None of them inspects content. A secret in an ordinary window, such as `export TOKEN=…` in a terminal, a `.env` file in an editor or a field in a browser form, is outside every current control. The open-source research already lists PII detection before vision as "Not started" (`docs/observer-open-source-research.md`, learning point 3).

The terminal example is not only a screen problem. The shell monitor stores that line as typed, and an agent reads it back. Removing screen capture alone leaves this route open.

A second route carries screen content to models: the vision model's text (summary, action targets, rationale). ZAM stores that text in the observer report log. The agent reads it back through `get-observations` and `observe-ui-watch`, and session synthesis uses it (`src/kernel/observation/session-synthesis.ts:268`). Removing the pixels does not remove this route.

Packaging does not solve the concern on its own. An optional tool still carries the capture code and the screen-to-model path.

### What observation is for

The project owner's framing (2026-10-08): observation watches the human in order to record a skill. Computer Use is the agent's own perceive-and-act capability; the observer should be the human-side counterpart. Skill-recording tools already exist, so building a bespoke visual recorder would duplicate a crowded field. ZAM already holds the parts that connect a skill to learning: skill discovery (`src/kernel/observation/skill-discovery.ts`) and session synthesis, which matches monitor commands against the steps of skills linked to one token (`docs/concepts/monitoring-methods.md`). Monitor patterns are command prefixes or regular expressions (`src/kernel/observation/analyzer.ts:36`), so they match on a command's structure, not on the values passed to it.

### Research snapshot (2026-10-08)

Demonstration-to-skill recorders exist. None of the candidates found combines the properties ZAM needs: structural capture, no pixels, keystroke masking at capture, and a clear licence.

- **Pixel-based.** ugarchance/record-and-replay-skill records input and a screenshot per click; its desktop capture uses OpenAdapt. OpenAdapt records screen, input and timing, with vision-based step matching; its raw captures stay local and unscrubbed by design. Microsoft's skill recorder captures on-screen activity, clicks and narration; deriving the steps requires Copilot CLI.
- **Structural.** humblebanana/open-record-replay (macOS; MIT according to a directory listing; mouse, keyboard and UI events as JSON traces; alpha). video-db/open-record-replay (accessibility-level events and typed text; macOS and Windows; no replay component). beuaaa/pywinauto_recorder (accessibility-based; Windows; emits Python).
- **Keystroke redaction at capture** is a documented pattern (webblackbox PR #3; merge status not verified). Matomo makes keystroke recording opt-in and masks password and card fields by default.
- **Licences** are not visible for every candidate. Each one needs its LICENSE file checked before any use.
- ZAM's own sidecar has a structural channel (UI Automation events, Raw Input counts), but today it is not content-free: see consequence 4. Without the OCR fallback and without element names it would be the only non-visual sensor ZAM owns, and it is Windows-only.

Consequence: a recorder does not remove the secret problem; it moves it. Accessibility data carries screen text as well. The decision therefore rests on a rule that ZAM enforces itself, on what it accepts and on what it hands back to agents.

## Decision (proposed)

1. **R1 — ZAM stops producing screen observations.** On acceptance, the following are removed in phases (plan, Phase 5): the `observer/` sidecar, `capture-ui`, `start-recording`, `stop-recording`, the screen use of `observe-ui-snapshot`, the screen read-back commands `get-observations` and `observe-ui-watch`, the UI branch of session synthesis, `zam observer`, the desktop observer panel, the `observer.*` capture policy and its enforcement, and the sidecar build and bundling in release and CI.

2. **R2 — Demonstrations come from external skill learners.** A learner runs outside ZAM and is installed by the learner or the organisation. ZAM does not bundle one and does not depend on one.

3. **R3 — ZAM accepts only evidence that has no free-text field.** The contract (plan, Phase 4) is a closed schema: the skill, the step, the outcome, the times, and the application's process name. Unknown keys are rejected at any depth. Every string field has a pattern and a length limit. `skillId` and `stepId` must resolve to a skill step ZAM already holds; evidence for an unknown step is rejected, not stored. Version 1 has no element name and no window title, because both are screen text.

   ZAM cannot recognise screen text inside an arbitrary string, so the rule does not depend on recognising it: it holds because no accepted field can carry it. Rejecting known content keys (`image`, `frame`, `text`, `clipboard` and similar) and `data:` strings stays as defence in depth. ZAM enforces this rule itself, so a learner's privacy claim is never the control. The same schema governs what ZAM returns to agents about observation.

4. **R4 — Evidence binds to skills through the existing skill-step link.** Session synthesis already maps monitor commands to the steps of skills linked to one token. The same mapping takes skill-step evidence. Confirmation stays mandatory: no learning state changes before the learner confirms.

5. **R5 — Shell observation stays, redacted when it is written.** A command is the skill, so shell evidence cannot be made structural without losing it. Instead, the monitor redacts secret-shaped values before a line reaches disk. At minimum it redacts environment assignments, authorisation and cookie headers, the values of flags such as `--token`, `--password`, `--secret` and `-p`, credentials inside URLs, and long high-entropy strings. The same redactor runs on every path that returns command text to an agent: `zam_monitor` and the matched command texts in synthesis candidates. Redaction is weaker than R3 and its limits are named: a secret in an unusual position can survive. Monitor patterns match on prefixes and structure, so redacting values keeps synthesis working.

6. **R6 — Retention is enforced, not declared.** Raw observation files (monitor logs, and observer reports for as long as they exist) are deleted once synthesis for the session is confirmed or dismissed, and at the latest after a fixed window. The window defaults to 14 days and can be set shorter. Files from before this decision are inventoried first (plan, Phase 2); nothing older is deleted without the owner's confirmation.

7. **R7 — The `vision` role serves material import only** (ADR 2026-10-05). It is never used for screen content.

8. **R8 — Containment now.** Until R1 lands, screen observation sits behind one hard switch, `observation.screen` in the machine-local `~/.zam/config.json`. It is off by default and covers every screen surface in the table: `capture-ui`, `start-recording` and `stop-recording`, `observe-ui-snapshot` for video and `--image` input, the sidecar, and the desktop panel loop. The switch is not a database setting. No `setting-set` key, bridge command or MCP tool can write it, and turning `llm.vision.enabled` on does not open it. The OCR fallback is removed outright rather than put behind the switch. This does not depend on the option chosen below.

   An agent with unrestricted shell access can capture the screen without ZAM. The switch does not claim to stop that. It ensures that ZAM is not the tool that does it, and that an agent limited to ZAM's own tools cannot open the path.

## Options considered

**A. Keep and extend the in-house observer.** Rejected. Screen content stays inside ZAM, the native part is Windows-only, the video path sits outside the policy, and the research already shows the PII gap.

**B. Extract the visual observer into an optional installable tool.** Feasible. But the capture code, the screen prompts and the screen-to-model path remain ZAM's to maintain and audit, and an installed tool carries the same threat.

**C. Delete visual capture; adopt external structural learners under R3.** Recommended. It removes the largest secret surface from ZAM's own code and reuses an existing skill-creation path. Its risks are learner quality, licences, and learners that capture pixels or keys on their side. R3 and deployment policy contain the last risk, and the spike tests it.

**D. Delete all demonstration capture.** ZAM keeps shell observation (under R5) and skill discovery, and skills are authored by hand. Simplest to audit and lowest risk, with lower fidelity for GUI work. This is the fallback if no learner passes the gates.

**E. C plus ZAM's own UI Automation sensor, without OCR and without element names.** Conditional. Keep the Windows sensor only if the spike shows that external learners lack element context ZAM needs, and only in the reduced form: control type, automation id, process, timing, counts. Today's sensor does not qualify (consequence 4). Otherwise delete it: it is a second native maintenance surface, and C provides the same structural evidence.

## Trade-off analysis

C beats B because the threat depends on where screen content lives and who processes it, not on which package ships it. C beats D on fidelity, but only if the spike passes. The plan therefore makes the spike a gate, not an assumption.

Replacement does not make secrets safe by itself. Most learners capture pixels or keys, and accessibility data carries screen text. R3 keeps those payloads out of ZAM by accepting only fields that cannot carry them. Deployment policy must keep an unapproved learner off the machine. Both controls are required.

Shell observation gets a weaker control (R5) than screen evidence (R3). The difference is deliberate: the command is the skill, a screenshot is not. The plan tests the redactor with fake secrets in every position it claims to cover.

## Consequences

Easier:

- ZAM loses its screen capture code, its Windows sidecar, its desktop observer panel and two release steps.
- Screen evidence becomes structural skill steps; shell evidence stays, redacted and with a retention limit.
- An organisation can switch observation off by not installing a learner. The default build contains no screen capture code.

Harder:

- The evidence contract must be defined, versioned and tested. R3 needs tests for unknown keys at every depth, unknown step ids and over-long strings.
- The shell redactor needs a test corpus and will need maintenance as new secret formats appear.
- Bridge contracts change. Agents that call `capture-ui`, `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations` or `observe-ui-watch` must move. Before 1.0 the commands can be removed directly, but the removal belongs in the release notes.
- Existing data may contain screen-derived text, video or unredacted commands: `~/.zam/observer/*.jsonl`, `~/.zam/monitor/*.jsonl`, `zam-recording-*` and `zam-capture-*` files in the OS temp directory, and `observer.*` rows. Phase 2 inventories them. Nothing is deleted without confirmation.
- A learner needs governance: licence review, pinned versions, source review, and a visible indicator while recording (gate G8 in the plan).

## Open questions for review

1. **Where does learner configuration live?** ADR 2026-09-04 keeps `observer.*` machine-scoped in `user_settings`. The owner's working rule says machine-local state belongs in `~/.zam/config.json`, not in the shareable database. R8 follows the working rule for the containment switch; the learner decision has to settle the rest. An organisation-wide override belongs to the managed policy proposed in the corporate deployment baseline ADR.
2. **Is a structural channel enough for assessment?** The spike decides between C and E, and whether any element context beyond control type and automation id is needed at all.
3. **Does anyone use the video path today?** Containment changes their workflow, so the owner must confirm.
4. **Legal review before any deployment with employees or minors.** Systematic monitoring of people raises GDPR questions (a data protection impact assessment is likely), and in Germany works-council co-determination applies to technical devices suited to monitoring employees (BetrVG §87(1) Nr. 6). This covers the shell monitor and any external learner, not only screen capture. Observing minors needs guardian consent rules. This ADR does not assess compliance.
5. **Which learner or learners are acceptable?** The spike result answers it.
6. **Is 14 days the right retention window?** Shorter limits what a compromised machine exposes; longer gives learners more time to confirm synthesis.

## Citations

ZAM code, checked on `main` (87955c59):

- `src/cli/commands/bridge.ts`: `observe-ui-watch` (1991), `get-observations` (2036), `observe-ui-snapshot` (2066), `capture-ui` (2530, policy at 2539), `start-recording` (2631), `stop-recording` (2746), `get-observer-policy` (2853), `UI_WRITABLE_SETTINGS` (3895–3904), `setting-set` (3907)
- `src/cli/llm/vision.ts`: `observeUiSnapshotViaLLM` (88), ffmpeg frame extraction through a shell string (112, 122)
- `src/cli/llm/client.ts`: default-off vision (191–194), vision gate for image and video capabilities (466)
- `src/cli/llm/material-analyze.ts`: image capability for photo import (100–102)
- `src/kernel/observation/session-synthesis.ts`: UI branch (268), shell branch (318)
- `src/kernel/observation/monitor-io.ts`: verbatim monitor write (46)
- `src/kernel/observation/analyzer.ts`: prefix and regex patterns (36)
- `src/kernel/observation/policy.ts`: default scope `window`, retention `none` (40–49); retention is never enforced
- `src/cli/commands/mcp.ts`: Studio allowlist excludes observer commands (122–131) but includes `setting-set` (159); app-only registration (1684)
- `observer/src/uia.rs`: text-change handler (473–495), OCR fallback (961–976)
- `observer/README.md`: sidecar capabilities and privacy claim (140)
- `desktop/src/main.ts`: observer panel and loop (1008–1027, 4511–4691)

Research, 2026-10-08:

- <https://github.com/ugarchance/record-and-replay-skill>
- <https://github.com/humblebanana/open-record-replay>
- <https://github.com/video-db/open-record-replay>
- <https://themenonlab.blog/blog/microsoft-skill-recorder-teach-agents-by-demonstration>
- <https://github.com/OpenAdaptAI/openadapt-capture>
- <https://github.com/OpenAdaptAI/openadapt-flow>
- <https://github.com/beuaaa/pywinauto_recorder>
- <https://github.com/a3mitskevich/webblackbox/pull/3>
- <https://matomo.org/faq/heatmap-session-recording/faq_24214/>
