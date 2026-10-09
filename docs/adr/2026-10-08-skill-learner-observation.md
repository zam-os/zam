# Observation Without Content: Skill-Learner Evidence Replaces the In-House Screen Observer

**Status:** Proposed
**Date:** 2026-10-08
**Deciders:** Thomas (project owner), after external review
**Review:** first model review (Fable) on 2026-10-08; its findings are applied below
**Related:** [ADR 2026-10-08b — Corporate deployment baseline](2026-10-08b-corporate-deployment-baseline.md) (companion: trust model, path confinement, managed policy) · [ADR 2026-06-20 — Observer permission model](2026-06-20-observer-permission-model.md) · [ADR 2026-06-22 — Screen recording observer](2026-06-22-screen-recording-observer.md) · [ADR 2026-10-05 — Learning cards from photos and files](2026-10-05-learning-cards-from-photos-and-files.md) · [ADR 2026-07-06a — MCP agent transport and surfaces](2026-07-06a-mcp-agent-transport-and-surfaces.md) · [Observer privacy model (OKF)](../okf/observer-privacy-model.md) · [Observer open-source research](../observer-open-source-research.md)
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
| `capture-ui` (one screenshot; `screencapture` on macOS, PowerShell on Windows). With `--image` it skips capture and returns any existing file instead | `src/cli/commands/bridge.ts:2530`, `--image` at 2535 and 2547–2551 | Returned to the calling agent, which is a model | Live capture: yes (`bridge.ts:2539`), by window title and process only. `--image`: none |
| `start-recording` / `stop-recording` (background ffmpeg, full screen: `avfoundation` on macOS, `gdigrab` desktop on Windows; files in the OS temp directory) | `bridge.ts:2631–2853` | Decimated video goes to `observe-ui-snapshot` | **No.** The block never reads the policy. |
| `observe-ui-snapshot` (images or video; video frames via ffmpeg; `--image` accepts any file) | `bridge.ts:2066–2123`, `src/cli/llm/vision.ts:88–130` | Vision role, cloud or local | **No.** Only `llm.vision.enabled` is checked. |
| Desktop observer panel: snapshot-and-analyze and a timed loop. The Tauri shell starts the sidecar itself | `desktop/src/main.ts:4511–4691`, `lib.rs:556`, `lib.rs:811` | Through the rows above | Through the sidecar |
| Shell monitor: every command line and working directory of a monitored session, verbatim. The shell hooks append to the log themselves (`printf >>` in bash and zsh, `AppendAllText` in PowerShell); ZAM's own writer only adds metadata | `src/kernel/observation/shell-hooks.ts:42–133`, `src/cli/commands/monitor.ts:108` | `zam_monitor`, the bridge monitor commands, synthesis candidates (matched and unmatched commands), skill discovery examples | None. No redaction. |

Six consequences follow.

1. The policy from ADR 2026-06-20 covers part of one path. The full-screen video path, `observe-ui-snapshot` and `capture-ui --image` bypass it. The bypass is in the code, not only in the design.
2. `llm.vision.enabled` is the only model-side gate. Photo import uses the same flag (`src/cli/llm/client.ts:466`), so enabling vision for photos also enables screen analysis through the bridge. The flag is also one of the keys `setting-set` may write (`bridge.ts:3895–3904`), and `setting-set` is on the Studio bridge allowlist (`src/cli/commands/mcp.ts:159`). The Studio bridge tool is registered app-only, but that is a hint to the host: the server cannot tell a panel's call from a model's call. A gate a model can open is not a gate, even where the capture itself runs from a loop the learner started.
3. Observation is on by default, subject to per-session consent: the default policy scope is `window` (`src/kernel/observation/policy.ts:42`).
4. The sidecar's UI Automation channel is not content-free. The OCR fallback turns the pixels of unnamed fields into text, typed text included. Accessible names are screen text in their own right: window titles, email subjects, document names, list items with customer names. `observer/README.md:140` says the sidecar "never reads element values", and the comment on `build_text_changed_event` (`uia.rs:496–497`) says text-change events never carry "the text value itself". Both are wrong while the fallback exists.
5. Retention is declared but not enforced. The default policy says `retention: "none"`, and no code deletes observer reports, snapshots or monitor logs. No "dismiss" exists for synthesis either: attempts are `rated`, `recorded` or `conflict` (`src/kernel/observation/attempts.ts`).
6. Skill steps have no identity. `agent_skills.steps` is a JSON array of strings (`src/kernel/db/schema.ts:359`). Synthesis derives command patterns from the step text (`normalizeSkillStep`, `session-synthesis.ts:140–160`), and only for skills linked to exactly one token. Nothing outside ZAM can name a step.

The Studio MCP bridge excludes observer commands (`src/cli/commands/mcp.ts:122–131`), but see consequence 2. Any agent that can run shell commands also reaches all of them through `zam bridge`. Such an agent is outside the companion ADR's trust model, because it does not need ZAM to capture the screen.

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

Consequence: a recorder does not remove the secret problem; it moves it. Accessibility data carries screen text as well. On this snapshot no Windows candidate is expected to pass the first spike gate, so the honest expectation is option D or E, not C. The decision therefore rests on rules that ZAM enforces itself: on what it accepts, on who turns a trace into skill steps, and on what it hands back to agents.

## Decision (proposed)

1. **R1 — ZAM stops producing screen observations.** On acceptance, the following are removed in phases (plan, Phase 5): the `observer/` sidecar, `capture-ui`, `start-recording`, `stop-recording`, the screen use of `observe-ui-snapshot`, the screen read-back commands `get-observations` and `observe-ui-watch`, the UI branch of session synthesis and its kernel modules, `zam observer`, the desktop observer panel, the `observer.*` capture policy and its enforcement, and the sidecar build and bundling in release and CI.

2. **R2 — GUI demonstrations come from a learner that emits structural events.** A learner is either an external skill-recording tool, installed and governed by an organisation, or ZAM's own reduced Windows sensor (option E). ZAM bundles no learner and depends on none, its own sensor included: whatever can capture the screen is a separate install, so an organisation can prohibit it and verify that with its own tooling (see *Trade-off analysis*, packaging). Individual learners get option D by default: shell observation, skill discovery and hand-authored skills. Option C is for managed deployments that install an approved learner.

3. **R3 — ZAM accepts only structural events, with no free-text field.** A learner submits events in a closed schema (plan, Phase 4): event kind, time, process name, control type from a fixed list, and an optional automation id. There is no element name, window title, value, text or pixel field, because each of those is screen content. Unknown keys are rejected at any depth. Every string has a pattern and a length limit: ASCII, normalised, no zero-width characters. A rejection never echoes the submitted string; logs and `denied` reasons carry a hash of it.

   ZAM cannot recognise screen text inside an arbitrary string, so the rule does not depend on recognising it: it holds because no accepted field can carry much of it. What remains is about a hundred bytes of identifier-shaped strings per event, plus timing and ordering as a low-bandwidth channel. The schema therefore defends against a careless or over-collecting learner, not a hostile one. A hostile local process could send its data elsewhere directly, and the companion trust model treats local processes as untrusted. Rejecting known content keys (`image`, `frame`, `text`, `clipboard` and similar) and `data:` strings stays as defence in depth. What ZAM returns to agents about screen observation follows the same schema.

4. **R4 — ZAM maps events to skill steps itself, without a model.** No model reads a raw trace: if the mapping needed one, the content problem would move from ZAM to the agent. For that, skill steps need identity:
   - Each step gets a stable id (ULID) and optional structural selectors: process name, control type and automation id, in order. Today steps are plain strings (consequence 6), so this is a schema change with an M-series migration. Existing steps keep their text, which command-pattern matching continues to use.
   - The learner sets selectors by labelling one demonstration in the Studio. ZAM shows the demonstration's structural events, and the learner assigns them to steps. The Studio shows no screen content, because ZAM holds none.
   - Session synthesis matches event sequences against selectors and proposes candidates. Confirmation stays mandatory: no learning state changes before the learner confirms.

   If labelling proves too hard for learners, or external learners cannot emit stable identifiers, option C fails and option D applies. The spike measures both.

5. **R5 — Shell observation stays, and ZAM redacts it on the way to every reader.** The shell hooks append command lines to the log themselves, so ZAM is not in the write path. Redaction therefore works in three places:
   - **Every read.** Redaction is a response filter on every payload derived from a monitor log, before it reaches an agent or a model: `zam_monitor`, the bridge monitor commands, synthesis candidates including unmatched commands, skill discovery examples, and the synthesis returned at session end. This is the primary control. It covers logs written before this change as well.
   - **At rest.** At `zam monitor stop` and at session end, ZAM rewrites the log in redacted form. A sweep at `zam monitor start`, bridge start and desktop start does the same for logs of sessions that never stopped. Unredacted text stays on disk only while a session runs.
   - **What it covers.** The redactor knows named positions (plan, Phase 0) and applies a name heuristic: a value is redacted when its key or flag contains `pass`, `pwd`, `secret`, `token`, `key`, `auth`, `cred`, `cookie` or `bearer`. It also redacts high-entropy strings and JWT-shaped tokens. Its limits are named: a secret in an unusual position can survive, and heredoc bodies are captured differently by each shell.

   A command is the skill, so shell evidence cannot be made structural without losing it. Redaction is weaker than R3, and the plan tests it with fake secrets in every position it claims to cover. Monitor patterns match on prefixes and structure, so synthesis keeps working. Before this change, a confirmed synthesis kept the matched command texts verbatim in the library, in its evidence, in the attempt's evidence key and in the session step note. A migration deletes them once; the ratings and the review history stay (owner decision 2026-10-09). Under the companion's managed policy, `observation.shell: denied` makes `zam monitor start` refuse and every monitor tool return a typed refusal.

6. **R6 — Retention is enforced, not declared.**
   - A session's raw observation files (its monitor log, and observer reports for as long as they exist) are evidence only while they are captured. They are deleted when the session ends, right after its synthesis candidates are prepared, and a session that never ends loses them after a fixed window. The candidates carry the redacted texts the learner confirms, so confirmation needs no raw file. An explicit action drops a running session's files sooner (owner decision 2026-10-09).
   - Before deleting, ZAM stores a value-free digest of the session: its redacted, normalised command prefixes. Skill discovery reads the twenty most recent sessions and needs at least two (`bridge.ts:1906`), so it reads digests instead of raw logs. The digests are the one thing observation leaves behind; the owner kept them for skill discovery (2026-10-09).
   - Files are machine-local, while sessions live in the shared database. Ending a session on one machine deletes nothing on another; there only the window applies. Sessions that never end fall to the window as well.
   - The sweep runs at session end, at `zam monitor start`, at bridge start and at desktop start.
   - The window defaults to 1 day (24 hours) and is set in `~/.zam/config.json` (`observation.retentionDays`). A raw log only has to live until it is turned into redacted evidence and a conclusion is drawn; after that the digest is all that stays. The companion's managed policy can cap it.
   - Files from before this decision are inventoried first (plan, Phase 0). Nothing older is deleted without the owner's confirmation.

7. **R7 — The `vision` role serves learner-initiated material import only** (ADR 2026-10-05). It is never used for screen content. ZAM cannot tell a screenshot from a photo of class notes, so purpose is enforced by path and action, not by content. `material-import-analyze` stays off MCP and off the Studio allowlist, and the files it accepts fall under the companion's path confinement (ADR 2026-10-08b, D1).

8. **R8 — Containment now.** Until R1 lands, screen observation sits behind one hard switch, `observation.screen` in the machine-local `~/.zam/config.json`. It is off by default and covers every screen surface in the table:
   - `capture-ui`, both live capture and `--image`;
   - `start-recording` and `stop-recording`;
   - `observe-ui-snapshot` for video and `--image` input;
   - in the desktop app, every Tauri command that starts the sidecar or captures, not only the first launch.

   The switch is not a database setting. No `setting-set` key, bridge command or MCP tool can write it, and turning `llm.vision.enabled` on does not open it. The Tauri shell reads no `config.json` today. One Rust reader therefore serves this switch and the companion's managed policy, and it resolves paths the same way the kernel does. The desktop observer panel is hidden in Phase 0. The OCR fallback is removed outright rather than put behind the switch. None of this depends on the option chosen below.

   This is a written exception to the simplicity principle: the switch has no Settings entry, because the bridge that Settings uses must not write it. The exception is temporary, it ends with Phase 5, and the hidden panel means no learner needs the switch in normal use.

   An agent with unrestricted shell access can capture the screen without ZAM. The switch does not claim to stop that. It ensures that ZAM is not the tool that does it, and that an agent limited to ZAM's own tools cannot open the path.

## Options considered

**A. Keep and extend the in-house observer.** Rejected. Screen content stays inside ZAM, the native part is Windows-only, the video path sits outside the policy, and the research already shows the PII gap.

**B. Extract the visual observer into an optional installable tool.** Feasible, and it has one real advantage over a switch inside ZAM: a separately installed component can be prohibited. An organisation's own tooling — software inventory, application control (AppLocker, WDAC), device-management compliance checks, EDR — can block the install and flag any machine where it appears, without trusting ZAM. But the capture code, the screen prompts and the screen-to-model path remain ZAM's to maintain and audit, and on a machine where the tool is installed it carries the same threat. C keeps the governance advantage and drops the rest.

**C. Delete visual capture; adopt external structural learners under R3 and R4.** Recommended for managed deployments. It removes the largest secret surface from ZAM's own code and lets an organisation choose and govern its recorder. Its risks are learner quality, licences, learners that capture pixels or keys on their side, and the labelling effort R4 asks of learners. R3 and deployment policy contain the content risk; the spike measures the rest.

**D. Delete all demonstration capture.** ZAM keeps shell observation (under R5) and skill discovery, and skills are authored by hand. Simplest to audit and lowest risk, with lower fidelity for GUI work. Recommended as the default for individual learners, and the fallback everywhere if no learner passes the gates.

**E. ZAM's own reduced UI Automation sensor as the learner.** Conditional. Keep the Windows sensor only if the spike shows that external learners lack element context ZAM needs, and only in the reduced form: control type, automation id, process, timing, counts, emitted in the R3 schema. Today's sensor does not qualify (consequence 4). Otherwise delete it: it is a second native maintenance surface.

## Trade-off analysis

C beats B because the threat depends on where screen content lives and who processes it, not on which package ships it.

Packaging still matters, for governance rather than for the threat. Where an organisation wants no screen capture at all, a component that is not installed is a stronger control than a setting that is off:

- **Who enforces it.** A missing component is enforced by the organisation's own inventory, application-control and compliance tooling. A managed policy (ADR 2026-10-08b, D6) is enforced by ZAM's own code, and holds only as long as that code honours it. The bypasses this ADR records — capture paths that never read the observer policy — are the counterexample.
- **Who can verify it.** Absence is visible from outside: the binary is there or it is not. For a policy an auditor can check that the file exists, not that ZAM obeys it.
- **What an agent can start.** Code that is not on the machine cannot be started; code behind a switch can, by any agent with a shell.

A managed policy is broader and finer: it governs ZAM's own behaviour — the shell monitor, cloud models, retention, pairing — where there is nothing to uninstall. The two controls are complementary, not alternatives. C and E keep the packaging advantage only if the capture component is never bundled with ZAM; D has it trivially, because nothing captures the screen.

The strongest argument against C has two parts. First, on the research snapshot no Windows candidate is expected to pass G1. Second, someone has to turn a recorded trace into skill steps, and if that someone is a model reading the raw trace, the content problem has only moved. The ADR answers the second part with R4, a model-free mapping inside ZAM, and the first with the spike gate and the fallbacks. It does not pretend C is the likely outcome: the plan runs the two ZAM baselines first, and D or E is the expected result.

C beats D on fidelity only if a learner passes the gates and labelling is acceptable. D is simpler for individual learners and needs no installation, which is why D is their default.

Replacement does not make secrets safe by itself. Most learners capture pixels or keys, and accessibility data carries screen text. R3 keeps those payloads out of ZAM by accepting only fields that cannot carry much of them. Deployment policy must keep an unapproved learner off the machine. Both controls are required.

Shell observation gets a weaker control (R5) than screen evidence (R3). The difference is deliberate: the command is the skill, a screenshot is not.

## Consequences

Easier:

- ZAM loses its screen capture code, its Windows sidecar, its desktop observer panel and two release steps.
- Screen evidence becomes structural events mapped to skill steps; shell evidence stays, redacted and with a retention limit.
- An organisation can switch screen observation off by not installing a learner, and verify that with its own inventory and application-control tooling instead of trusting ZAM. The shell monitor stays, under the policy key `observation.shell`. The default build contains no screen capture code; ZAM's installer does not bundle the observer sidecar.

Harder:

- The evidence contract must be defined, versioned and tested. R3 needs tests for unknown keys at every depth, over-long and malformed strings, and rejection paths that must not echo input.
- Skill steps become objects with ids and selectors: a schema change, a migration, and a labelling screen in the Studio.
- The shell redactor needs a test corpus, a response filter on every monitor-derived payload, a rewrite at session end and a sweep. It will need maintenance as new secret formats appear.
- Retention deletes raw files at session end, keeps a per-session digest for skill discovery, and needs a sweep that runs per machine.
- Bridge contracts change. Agents that call `capture-ui`, `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations` or `observe-ui-watch` must move. Before 1.0 the commands can be removed directly, but the removal belongs in the release notes.
- Sessions recorded with `execution_context = 'ui'` stay in the database. The column has no CHECK constraint (`src/kernel/db/provision.ts:285`). Once the UI branch is gone, such sessions fall to the shell branch, find no monitor log and synthesise nothing. That is the intended outcome.
- Existing data may contain screen-derived text, video or unredacted commands: `~/.zam/observer/*.jsonl`, `~/.zam/monitor/*.jsonl`, `zam-recording-*` and `zam-capture-*` files in the OS temp directory, and `observer.*` rows. They are inventoried first. Nothing is deleted without confirmation. The command texts stored in the library are the exception: the owner confirmed their deletion on 2026-10-09, and a migration removes them.
- A learner needs governance: licence review, pinned versions, source review, and a visible indicator while recording (gate G8 in the plan).

## Open questions for review

1. **Where does learner configuration live?** ADR 2026-09-04 keeps `observer.*` machine-scoped in `user_settings`. The owner's working rule says machine-local state belongs in `~/.zam/config.json`, not in the shareable database. R6 and R8 follow the working rule; the learner decision has to settle the rest. An organisation-wide override belongs to the managed policy in ADR 2026-10-08b.
2. **Is a structural channel enough, and is labelling acceptable?** The spike decides between C, D and E, whether any element context beyond control type and automation id is needed, and how long labelling one demonstration takes a learner.
3. **Does anyone use the video path or the observer panel today?** If not, Phase 0 deletes them instead of guarding them. The owner must confirm. **Decided 2026-10-08 (owner): nobody uses them; deleted in Phase 0A.**
4. **Legal review before any deployment with employees or minors.** This ADR does not assess compliance; it flags points a lawyer must assess. They apply to the shell monitor and to any learner, not only to screen capture:
   - a data protection impact assessment for systematic monitoring (GDPR Art. 35);
   - employee data and the limited weight of employee consent (GDPR Art. 88, § 26 BDSG);
   - works-council co-determination for technical devices suited to monitoring employees (BetrVG § 87(1) Nr. 6);
   - transparency towards the people observed (GDPR Art. 13);
   - third parties visible on screen or named in commands, such as customers and colleagues, who have not consented;
   - a learner vendor that processes data as a processor (GDPR Art. 28), and cloud models as transfers (GDPR Chapter V);
   - the EU AI Act's high-risk list, which names systems that evaluate learning outcomes in education and vocational training (Annex III, point 3(b)) and systems that monitor and evaluate workers' performance and behaviour (Annex III, point 4(b)). ZAM infers skill ratings from observation;
   - minors: the GDPR's age threshold (Art. 8), school law of the federal states, and guardian consent.
5. **Which learner or learners are acceptable?** The spike result answers it.
6. **Is 14 days the right retention window?** Shorter limits what a compromised machine exposes; longer gives learners more time to confirm synthesis. **Decided 2026-10-08 (owner): 24 hours.** There is no reason to keep raw observation longer than it takes to turn it into a processable form and draw the conclusion. **Refined 2026-10-09 (owner):** a raw log is evidence only at the time of capture, so it goes at session end; the 24 hours remain the limit for sessions that never end.
7. **Should the shell monitor default to structure instead of redaction?** Keeping only the command, its subcommands and its flag names, and dropping every value, would be closer to R3. It may lose positional arguments that skill patterns need. The spike's shell baseline measures it.

## Citations

ZAM code, checked on `main` (87955c59):

- `src/cli/commands/bridge.ts`: `discover-skills` (1906), `observe-ui-watch` (1991), `get-observations` (2036), `observe-ui-snapshot` (2066), `capture-ui` (2530, `--image` 2535 and 2547–2551, policy at 2539), `start-recording` (2631), `stop-recording` (2746), `get-observer-policy` (2853), `UI_WRITABLE_SETTINGS` (3895–3904), `setting-set` (3907), `material-import-analyze` (7087)
- `src/cli/llm/vision.ts`: `observeUiSnapshotViaLLM` (88), ffmpeg frame extraction through a shell string (112, 122)
- `src/cli/llm/client.ts`: default-off vision (191–194), vision gate for image and video capabilities (466)
- `src/cli/llm/material-analyze.ts`: image capability for photo import (98–107)
- `src/cli/commands/monitor.ts`: metadata-only writes (108, 139)
- `src/kernel/observation/shell-hooks.ts`: hooks append command lines directly (42–133)
- `src/kernel/observation/session-synthesis.ts`: `normalizeSkillStep` and single-token rule (140–160), UI branch (268), shell branch (318)
- `src/kernel/observation/monitor-io.ts`: verbatim monitor write (46)
- `src/kernel/observation/analyzer.ts`: prefix and regex patterns (36)
- `src/kernel/observation/attempts.ts`: attempt statuses
- `src/kernel/observation/policy.ts`: default scope `window`, retention `none` (40–49); retention is never enforced
- `src/kernel/db/schema.ts`: `agent_skills.steps` as a string array (359)
- `src/kernel/db/provision.ts`: `execution_context` without CHECK (285)
- `src/cli/commands/mcp.ts`: Studio allowlist excludes observer commands (122–131) but includes `setting-set` (159); app-only registration (1684)
- `observer/src/uia.rs`: text-change handler (473–497), OCR fallback (961–976)
- `observer/README.md`: sidecar capabilities and privacy claim (140)
- `desktop/src/main.ts`: observer panel and loop (1008–1027, 4511–4691)
- `desktop/src-tauri/src/lib.rs`: sidecar spawned by the shell (556, 811)

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
