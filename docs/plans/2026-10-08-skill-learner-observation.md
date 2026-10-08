# Skill-learner observation — implementation plan

**Status:** Draft for review, together with the ADR. Phases 2–7 wait for an accepted decision. Phase 0 is containment and can start on approval, independently of the decision.\
**Decision:** [ADR 2026-10-08 — Observation Without Content](../adr/2026-10-08-skill-learner-observation.md). Its decisions are cited here as **R1–R8** and its options as **A–E**. Read the ADR first; this plan does not repeat its reasons.\
**Branch:** this document lives on `docs/screen-observer-adr`. Implementation starts on a new branch from `main` after acceptance. One feature, one branch, one PR, one commit per phase, as in the photo-import plan. Phase 0 may ship as two small PRs (screen, shell).

This document is harness-agnostic. Any agent or person can pick up the next unchecked item without other context.

## Scope

Sequencing, gates and owner decisions. No code changes in this document. Every item is a checklist entry; an item is done when its exit evidence exists (a test, a grep result, a recorded spike result).

## Phase 0 — Containment (can start on approval)

Goal: stop screen content and unredacted commands from reaching a model, until the removal in Phase 5 lands. Nothing here depends on the choice between C, D and E.

Screen (R8):

- [ ] **0.1** Add the machine-local switch `observation.screen` to `~/.zam/config.json` (`src/kernel/system/install-config.ts`), off when absent. Every screen surface checks it before it captures anything and returns a typed refusal (`screen-observation-off`) while it is off: `capture-ui`, `start-recording`, `stop-recording`, `observe-ui-snapshot` for video and `--image` input, the sidecar launch in `desktop/src-tauri/src/lib.rs`, and the desktop panel loop. No `setting-set` key, bridge command or MCP tool writes the switch, and `llm.vision.enabled` does not open it.
- [ ] **0.2** Remove the OCR fallback from `observer/src/uia.rs`: the `capture_rect_gdi` and `ocr_bitmap` call in `focused_element_from` (about lines 961–976), and both helpers, which have no other caller. An element without an accessible name reports an empty name. Correct the privacy claim in `observer/README.md` (line 140) and the comment on `build_text_changed_event` (line 495).
- [ ] **0.3** `observe-ui-snapshot` refuses before any ffmpeg call. Replace the shell-string `execSync` calls in `src/cli/llm/vision.ts` (lines 112 and 122) with `execFile` and an argument array, so a file name can never be read as shell syntax.
- [ ] **0.4** Tests: every surface in 0.1 refuses under default config; `setting-set llm.vision.enabled true` leaves the refusal in place; no ffmpeg process is spawned while the switch is off; a Rust unit test shows that an unnamed element yields an empty name, never recognised text.

Shell and retention (R5, R6):

- [ ] **0.5** Add a redactor for monitor lines in the kernel, next to `src/kernel/observation/monitor-io.ts`. It runs in `writeMonitorEvent` before the append. Cover at least environment assignments (`NAME=value`, `export NAME=value`, `$env:NAME = "value"`), `Authorization`, `Cookie` and `X-Api-Key` headers, the values of `--token`, `--password`, `--secret`, `--api-key`, `-p` and their `=` forms, `user:password@` in URLs, and high-entropy strings above a length threshold. The redacted value becomes a fixed marker; the command name and flags stay.
- [ ] **0.6** Run the same redactor on every read path that returns command text to an agent: `zam_monitor`, and `matchedCommandTexts` in session synthesis candidates. This covers logs written before 0.5.
- [ ] **0.7** Retention: delete a session's monitor log and observer reports once its synthesis is confirmed or dismissed, and any such file older than the window (default 14 days; ADR open question 6). Files older than this change are only listed, not deleted, until the owner confirms (0.8).
- [ ] **0.8** Inventory and report: `zam-recording-*` and `zam-capture-*` in the OS temp directory, `~/.zam/observer/*.jsonl` (may hold OCR text) and `~/.zam/monitor/*.jsonl` (may hold unredacted commands). Delete only after the owner confirms the list.
- [ ] **0.9** Tests: a corpus of fake secrets in every position 0.5 claims to cover, asserted absent on disk and in `zam_monitor` output; existing monitor-pattern tests still match after redaction; retention deletes after confirmation and after the window, and never touches a file from before the change without confirmation.

Exit gate: owner approval; PRs with 0.1–0.4 and 0.5–0.9; release-note lines "screen observation is off by default" and "monitored commands are stored redacted".

## Phase 1 — Review

- [ ] **1.1** Send the ADR and this plan to external review, using the prompt in Appendix C.
- [ ] **1.2** Owner answers ADR open questions 1–6 and chooses among options C, D and E.
- [ ] **1.3** Record the decision: ADR status becomes Accepted (or the ADR is revised), with the answers written into it.

Exit gate: an accepted ADR. Without it, Phases 2–7 do not start.

## Phase 2 — Inventory (read only)

- [ ] **2.1** Consumer map: every caller of the surfaces in the ADR table, including `get-observations`, `observe-ui-watch` and `zam_monitor`. Cover the bridge, the desktop app and Tauri, CI and release, tests, docs, and the skill files under `skills/zam/`, `.agents/skills/zam/`, `.claude/skills/zam/` and `.agent/skills/zam/`. Keep AGENTS.md consistent where it repeats these steps. Store the map in Appendix A.
- [ ] **2.2** Data map, for pilot machines and with the owner present: `~/.zam/observer/`, `~/.zam/monitor/`, temp recordings, and `observer.*` rows in `user_settings`. Classify each as delete, keep or migrate. Start from the 0.8 inventory.
- [ ] **2.3** Photo-import check: confirm that removing the observer leaves `resolveCapability("image")`, the `llm.vision.*` settings and the material pipeline unchanged. Confirm which cloud-vision recommendations from ADR 2026-06-22 (its Decision 2) material import uses, and keep those.
- [ ] **2.4** Public-API check: which `zam-core` exports for observation (`src/kernel/index.ts`) are used outside this repository.

Exit gate: complete lists in the appendix. No deletion yet.

## Phase 3 — Learner spike (time-boxed, 2–3 working days, no ZAM code)

Candidates. Each claim below comes from the research snapshot and must be verified against the repository itself, not against a directory listing.

| Candidate | Platform (claimed) | Capture (claimed) | Verify first |
|---|---|---|---|
| humblebanana/open-record-replay | macOS | mouse, keyboard and UI events as JSON | LICENSE file; whether typed characters are stored |
| video-db/open-record-replay | macOS, Windows | accessibility events, typed text | LICENSE; storage of typed text; network calls |
| ugarchance/record-and-replay-skill | macOS, Windows, Linux | input capture plus a screenshot per click | LICENSE; expected to fail G1 and G2 |
| beuaaa/pywinauto_recorder | Windows | accessibility-based recording, Python output | LICENSE; output format; maintenance |
| OpenAdapt (openadapt-capture, openadapt-flow) | macOS, Windows | screen, input and timing | LICENSE; expected to fail G1 unless screen capture can be disabled |
| Microsoft skill recorder | macOS, Windows 11 | on-screen activity, clicks, narration | open-source status; offline operation; expected to fail G1 |
| Baseline: ZAM sidecar, UI Automation mode without OCR and without element names (after 0.2) | Windows | control type, automation id, Raw Input counts | already in ZAM; measure coverage only |
| Baseline: ZAM shell observation (redacted, after 0.5) and skill discovery | any | shell commands | already in ZAM; measure coverage only |

Gates. A candidate must pass **G1, G2, G3, G7 and G8** to be eligible. **G4, G5, G6 and G9** must be verified before any use.

- **G1** Nothing leaves the machine by default: no pixels, no video, no text, no telemetry. No cloud model is required.
- **G2** Typed characters and screen text are not stored. Verified with a fake secret typed into a password field, into a field with no accessible name, into a terminal line and into a web form, and with a fake secret visible in a window title.
- **G3** The output names a skill step by a stable identifier, not by on-screen text, and the identifier stays the same across runs. Mapping it to R3 needs no free-text field.
- **G4** The licence is stated in the repository's LICENSE file and allows an unmodified, admin-installed use.
- **G5** Maintained: a commit or release within the last six months.
- **G6** Works on Windows, the enterprise target. A macOS-only candidate is a documented limitation, not a blocker, if Windows has an alternative.
- **G7** Removable without residue: documented uninstall, no background service by default.
- **G8** A visible indicator is shown while recording is active.
- **G9** The learner's own raw store, if it keeps one, has a documented location and a retention or delete setting.

Method. Scripted runs in a disposable account or VM. Record (a) network connections during the run, (b) files written, including temporary directories, (c) output files, and (d) whether the fake secret appears in any of them. Keep the raw evidence out of the repository. Record only the results, in Appendix B.

Exit gate and decision rule:

- A candidate passes G1, G2, G3, G7 and G8, and G4–G6 and G9 are verified → option C with that candidate.
- Nothing passes → option D.
- External learners lack element context that ZAM needs on Windows, and only the reduced sidecar baseline provides it → option E.

## Phase 4 — Evidence contract (after acceptance)

- [ ] **4.1** Write the skill-step evidence schema, version 1. Fields: `version`, `sessionId`, `skillId`, `stepId`, `outcome` (`done`, `skipped`, `failed`, `uncertain`), `observedFrom`, `observedTo`, `application.processName`, optional `element.role` (an enumerated control type), and `learner` (`id`, `version`). No element name and no window title (R3). Unknown keys are rejected at any depth.
- [ ] **4.2** Every string field has a pattern and a length limit: ids are ULIDs or the ids ZAM issued for the skill and step; `application.processName` is an executable name; `learner.id` and `learner.version` are short identifiers. `skillId` and `stepId` must resolve to a skill step ZAM holds; evidence for an unknown step is rejected. Defence in depth: content keys (`image`, `frame`, `keyframe`, `screenshot`, `video`, `text`, `typedText`, `keystrokes`, `clipboard`) and any string beginning with `data:` are rejected even where the schema would already reject them.
- [ ] **4.3** Bridge command `submit-skill-evidence`: JSON in, JSON out, a typed `denied` reason on rejection. Decide whether an MCP tool is also needed. ADR 2026-07-06a names MCP as the canonical agent transport.
- [ ] **4.4** Storage: decide between a session log (JSONL, under R6 retention) and a table. A table needs an entry in `src/kernel/db/schema.ts` and an idempotent M-series migration in `runMigrations`, with `CURRENT_SCHEMA_VERSION` incremented, as the project rules require.
- [ ] **4.5** Mapping: session synthesis maps evidence steps to tokens through the existing skill-step link. Confirmation stays mandatory (R4).
- [ ] **4.6** Tests first: schema acceptance; unknown keys rejected at depth; unknown step ids rejected; over-long and pattern-violating strings rejected; content keys and `data:` strings rejected; step-to-token mapping; no state change before confirmation.

Exit gate: all Phase 4 tests pass with no screen code present in the tree.

## Phase 5 — Removal (one branch; one commit per step)

- [ ] **5.1** Desktop: remove the observer panel and loop in `desktop/src/main.ts`, the observer Tauri commands in `desktop/src-tauri/src/lib.rs`, the observer CSS in `desktop/src/styles.css`, and the `observer_*` and `lbl_observer_model` keys in every locale. Update `tests/desktop/i18n-completeness.test.ts`.
- [ ] **5.2** Release and CI: remove the sidecar build and prepare steps from `.github/workflows/release.yml` (about lines 167–171). Remove or retarget the observer jobs in `.github/workflows/ci.yml` (about lines 61–62, 94–97 and 236–298). Remove `scripts/prepare-observer-sidecar.mjs` and the `observer:*` scripts in `package.json`. Update the comments in `scripts/sign-macos-resources.mjs`.
- [ ] **5.3** CLI and bridge: remove `zam observer` (`src/cli/commands/observer.ts` and its registration in `src/cli/app.ts`). Remove `capture-ui`, the screen use of `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations`, `observe-ui-watch`, `get-observer-policy` and `sync-observer-policy`. Keep `check-vision` only if photo import needs it, and rename it if kept. Remove the `observation.screen` switch from 0.1 together with the last surface it guards.
- [ ] **5.4** Settings: remove the `observer.*` side effects in `src/cli/commands/settings.ts` (about lines 114 and 133). Apply the data plan from 2.2.
- [ ] **5.5** Kernel: remove `src/kernel/observation/policy.ts` and `src/kernel/observation/observer-sidecar-policy.ts`, the UI branch of `src/kernel/observation/session-synthesis.ts` (about line 268) with `readUiObservationLog`, and their exports in `src/kernel/index.ts`. Note the public API change for library consumers in the release notes.
- [ ] **5.6** Native: delete the `observer/` crate under option C. Move it only under option E, and then only for the reduced sensor that E keeps.
- [ ] **5.7** Tests: remove `tests/kernel/observation/observer-policy.test.ts`, `tests/kernel/observation/observer-sidecar-policy.test.ts`, the screen cases in `tests/cli/llm-vision.test.ts` and `tests/cli/llm-providers.test.ts`, the observer block in `tests/integration/cli-e2e.test.ts` (about lines 76–123), and the observer keys in `tests/kernel/settings-scopes.test.ts` (about lines 54–55). Keep the photo-import vision tests and the shell redaction tests from 0.9.

Each step must be revertible on its own. The Phase 0 switch stays in place until 5.3 lands.

## Phase 6 — Docs and knowledge (same PR as the behaviour change)

- [ ] **6.1** OKF article `docs/okf/observer-privacy-model.md`: rewrite through the `zam_okf_upsert` tool, covering screen removal, shell redaction and retention. Do not edit the bundle files by hand, as CLAUDE.md requires. Phase 0 already changes behaviour this article describes, so its PR updates the article too.
- [ ] **6.2** Status lines: mark ADR 2026-06-20 and ADR 2026-06-22 as superseded by the new ADR. Accepted ADRs are immutable, so add a status line and do not rewrite the text.
- [ ] **6.3** `docs/concepts/monitoring-methods.md` (Level 2) and `beliefs/symbiosis/observation-over-interruption/README.md`: state that screen observation is delegated to skill learners and that shell commands are stored redacted.
- [ ] **6.4** Skill files: remove the capture and observer steps, including Approach C, from `skills/zam/SKILL.md`, `.agents/skills/zam/SKILL.md`, `.claude/skills/zam/SKILL.md` and `.agent/skills/zam/SKILL.md`. Apply the same change to AGENTS.md wherever it repeats these steps.
- [ ] **6.5** Observer documents `docs/windows-ui-observer-proposal.md`, `docs/observer-next-steps.md`, `docs/ui-observation-protocol.md` and `docs/observer-open-source-research.md`: mark them historical, or delete them under the plan lifecycle rule.
- [ ] **6.6** `docs/knowledge-map/map.json`: regenerate it if a generator exists. Do not hand-edit it.
- [ ] **6.7** ADR index in `docs/adr/README.md`: set the status of the new ADR and of the superseded ones.
- [ ] **6.8** Delete this plan once its last phase is done, unless open tasks remain.

## Phase 7 — Verification and release gate

- [ ] **7.1** `npm run build`, `npm run typecheck`, `npm run lint` and `npm run test` pass.
- [ ] **7.2** Desktop: `npm run desktop:prepare` and a desktop build complete. The bundle contains no `zam-observer` resource.
- [ ] **7.3** Grep gate in shipped paths (`src`, `desktop/src`, `desktop/src-tauri/src`, and the skill files): no `capture-ui`, `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations`, `observe-ui-watch`, `zam-observer`, `screencapture`, `gdigrab`, `avfoundation` or `OcrEngine`. Historical documents are excluded.
- [ ] **7.4** The contract tests from 4.6 pass with fixtures that contain a fake secret in every forbidden field and in every allowed string field.
- [ ] **7.5** Smoke runs: one learner session with a fake secret on screen, and one monitored shell session with a fake secret on the command line. Confirm that only structural evidence and redacted commands are stored, that no temporary file and no model request carries image or video data, and that retention deletes the raw files after confirmation.
- [ ] **7.6** Release notes: removed commands, removed desktop panel, the public API change, shell redaction and retention, and how to install a learner.

## Risks

| Risk | Mitigation |
|---|---|
| The chosen learner leaks pixels or keys | R3 accepts no field that can carry them; gates G1 and G2 in the spike; enterprise allowlist for learner installs |
| Screen text arrives through an allowed field | R3: ids must resolve to ZAM's skill steps, every string has a pattern and a limit, no element name in v1 |
| The shell redactor misses a secret format | Test corpus in 0.9, extended when a miss is found; R6 limits how long a miss stays on disk |
| An agent opens a gate through settings | R8 switch outside the database and outside every tool-writable surface |
| Licence or supply-chain problem | G4 verified from the LICENSE file; pinned version; source review before enterprise use |
| The learner stops being maintained | G5; ZAM depends only on the evidence contract, so a learner can be replaced |
| Assessment quality drops without pixels | The spike measures it; option E (reduced sensor) is the fallback on Windows |
| Stored data from pilots | Inventory 0.8 and data plan 2.2; no deletion without owner confirmation |
| Agents break after bridge removal | Consumer map 2.1; skill-file updates 6.4; release note 7.6 |
| Legal exposure in employee or minor deployments | ADR open question 4, which covers shell observation too; legal review before activation |

## Owner decisions

1. Option C, D or E (ADR).
2. Where learner configuration lives (ADR open question 1).
3. Whether anyone uses the video path today (ADR open question 3).
4. Scope of the legal review that must precede any deployment.
5. The retention window (ADR open question 6).
6. Whether Phase 0 is approved before the review finishes. It is recommended, because the bypass, the OCR fallback and the unredacted monitor are known.

## Appendix A — Consumer map

To be filled in by 2.1.

## Appendix B — Spike results

To be filled in by Phase 3. One row per candidate, with the gate results and the evidence summary.

## Appendix C — Review prompt

Paste the prompt below into the reviewing model, then paste the ADR and this plan under it.

```text
Review the attached architecture decision (ADR) and implementation plan for ZAM,
an open-source learning kernel with a CLI, a bridge and a desktop app.

Context: ZAM currently has its own screen observer (Windows sidecar with UI
Automation and an OCR fallback, screenshots, ffmpeg full-screen video, vision
analysis) and a shell monitor that stores command lines. The proposal removes
screen capture, adopts external skill-recording tools, and accepts only
structural skill-step evidence through a closed schema with no free-text field
(R3). Shell observation stays, redacted at write time (R5), with enforced
retention (R6). Until removal, one machine-local switch keeps every screen
surface off (R8).

Please answer:
1. What is the strongest argument against replacing the screen observer with
   external learners (option C)? Does the ADR answer it?
2. Is R3 complete? Name any field, channel or encoding through which screen
   text could still enter, including ids that do not resolve, base64 inside
   strings, and accessibility names.
3. Is R5 an acceptable control for shell commands? Which secret positions does
   the redactor list in Phase 0.5 miss?
4. Are gates G1–G9 sufficient and testable? Which would you add, drop or sharpen?
5. Is containment (Phase 0) complete? Which other paths could send screen
   content or command text to a model, and can an agent limited to ZAM's own
   tools open any of them?
6. Which privacy or legal points need a lawyer for employee or minor
   deployments? Do not give legal advice; flag only.
7. What evidence would change your recommendation?

Output: findings ranked critical / major / minor, each with a concrete fix.
Mark what you could not verify. Stay under 900 words.

--- ADR ---
(paste docs/adr/2026-10-08-skill-learner-observation.md)

--- PLAN ---
(paste docs/plans/2026-10-08-skill-learner-observation.md)
```
