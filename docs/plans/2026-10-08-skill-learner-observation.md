# Skill-learner observation — implementation plan

**Status:** Draft for review, together with the ADR. Phases 2–7 wait for an accepted decision. Phase 0 is a containment fix and can start on approval, independently of the decision.\
**Decision:** [ADR 2026-10-08 — Skill-Learner Observation Replaces the In-House Screen Observer](../adr/2026-10-08-skill-learner-observation.md). Its decisions are cited here as **R1–R6** and its options as **A–E**. Read the ADR first; this plan does not repeat its reasons.\
**Branch:** this document lives on `docs/screen-observer-adr`. Implementation starts on a new branch from `main` after acceptance. One feature, one branch, one PR, one commit per phase, as in the photo-import plan.

This document is harness-agnostic. Any agent or person can pick up the next unchecked item without other context.

## Scope

Sequencing, gates and owner decisions. No code changes in this document. Every item is a checklist entry; an item is done when its exit evidence exists (a test, a grep result, a recorded spike result).

## Phase 0 — Containment (can start on approval)

Goal: stop screen content from reaching a model through paths that bypass the policy, until the removal in Phase 5 lands.

- [ ] **0.1** Add a hard default-off switch for the video path. `zam bridge start-recording` and `stop-recording` return a typed refusal while it is off. The switch is not overridable by the policy allowlist.
- [ ] **0.2** `observe-ui-snapshot` refuses video input and `--image` input unless the same pre-capture and post-capture checks that `capture-ui` applies allow it. Without that gate, the refusal is the default.
- [ ] **0.3** List leftover files in the OS temp directory (`zam-recording-*`, `zam-capture-*`) and report them. Delete only after the owner confirms the list.
- [ ] **0.4** Tests: both refusals under default settings; no ffmpeg process is spawned while the switch is off.

Exit gate: owner approval; one small PR with 0.1–0.4; release-note line "screen recording is disabled by default".

## Phase 1 — Review

- [ ] **1.1** Send the ADR and this plan to external review, using the prompt in Appendix C.
- [ ] **1.2** Owner answers ADR open questions 1–5 and chooses among options C, D and E.
- [ ] **1.3** Record the decision: ADR status becomes Accepted (or the ADR is revised), with the answers written into it.

Exit gate: an accepted ADR. Without it, Phases 2–7 do not start.

## Phase 2 — Inventory (read only)

- [ ] **2.1** Consumer map: every caller of the surfaces in the ADR table. Cover the bridge, the desktop app and Tauri, CI and release, tests, docs, and the skill files under `skills/zam/`, `.agents/skills/zam/`, `.claude/skills/zam/` and `.agent/skills/zam/`. Keep AGENTS.md consistent where it repeats these steps. Store the map in Appendix A.
- [ ] **2.2** Data map, for pilot machines and with the owner present: `~/.zam/observer/`, temp recordings, and `observer.*` rows in `user_settings`. Classify each as delete, keep or migrate.
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
| Baseline: ZAM sidecar, UI Automation mode only | Windows | UI Automation events, Raw Input counts | already in ZAM; measure coverage only |
| Baseline: ZAM shell observation and skill discovery | any | shell commands | already in ZAM; measure coverage only |

Gates. A candidate must pass **G1, G2, G3, G7 and G8** to be eligible. **G4, G5 and G6** must be verified before any use.

- **G1** No pixels and no video leave the machine by default. No cloud model is required.
- **G2** Typed characters are not stored. Verified with a fake secret typed into a password field, into a terminal line, and into a web form.
- **G3** The output names a skill step and an outcome, and step identifiers stay stable across runs.
- **G4** The licence is stated in the repository's LICENSE file and allows an unmodified, admin-installed use.
- **G5** Maintained: a commit or release within the last six months.
- **G6** Works on Windows, the enterprise target. A macOS-only candidate is a documented limitation, not a blocker, if Windows has an alternative.
- **G7** Removable without residue: documented uninstall, no background service by default.
- **G8** A visible indicator is shown while recording is active.

Method. Scripted runs in a disposable account or VM. Record (a) network connections during the run, (b) files written, including temporary directories, (c) output files, and (d) whether the fake secret appears in any of them. Keep the raw evidence out of the repository. Record only the results, in Appendix B.

Exit gate and decision rule:
- A candidate passes G1, G2, G3, G7 and G8, and G4–G6 are verified → option C with that candidate.
- Nothing passes → option D.
- External learners lack element context that ZAM needs on Windows, and only the sidecar's UI Automation mode provides it → option E.

## Phase 4 — Evidence contract (after acceptance)

- [ ] **4.1** Write the skill-step evidence schema, version 1. Fields: `version`, `sessionId`, `skillId`, `stepId`, `outcome` (`done`, `skipped`, `failed`, `uncertain`), `observedFrom`, `observedTo`, `application.processName`, optional `element.role` and `element.name`, and `learner` (`id`, `version`). Unknown keys are rejected.
- [ ] **4.2** Forbidden content, rejected at any depth: `image`, `frame`, `keyframe`, `screenshot`, `video`, `text`, `typedText`, `keystrokes`, `clipboard`, any string beginning with `data:`, and any value above a size limit. This implements R3.
- [ ] **4.3** Bridge command `submit-skill-evidence`: JSON in, JSON out, a typed `denied` reason on rejection. Decide whether an MCP tool is also needed. ADR 2026-07-06a names MCP as the canonical agent transport.
- [ ] **4.4** Storage: decide between the existing session log (JSONL) and a table. A table needs an entry in `src/kernel/db/schema.ts` and an idempotent M-series migration in `runMigrations`, with `CURRENT_SCHEMA_VERSION` incremented, as the project rules require.
- [ ] **4.5** Mapping: session synthesis maps evidence steps to tokens through the existing skill-step link. Confirmation stays mandatory (R4).
- [ ] **4.6** Tests first: schema acceptance; forbidden-content rejection at depth; step-to-token mapping; no state change before confirmation.

Exit gate: all Phase 4 tests pass with no screen code present in the tree.

## Phase 5 — Removal (one branch; one commit per step)

- [ ] **5.1** Desktop: remove the observer panel and loop in `desktop/src/main.ts`, the observer Tauri commands in `desktop/src-tauri/src/lib.rs`, the observer CSS in `desktop/src/styles.css`, and the `observer_*` and `lbl_observer_model` keys in every locale. Update `tests/desktop/i18n-completeness.test.ts`.
- [ ] **5.2** Release and CI: remove the sidecar build and prepare steps from `.github/workflows/release.yml` (about lines 167–171). Remove or retarget the observer jobs in `.github/workflows/ci.yml` (about lines 61–62, 94–97 and 236–298). Remove `scripts/prepare-observer-sidecar.mjs` and the `observer:*` scripts in `package.json`. Update the comments in `scripts/sign-macos-resources.mjs`.
- [ ] **5.3** CLI and bridge: remove `zam observer` (`src/cli/commands/observer.ts` and its registration in `src/cli/app.ts`). Remove `capture-ui`, the screen use of `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observer-policy` and `sync-observer-policy`. Keep `check-vision` only if photo import needs it, and rename it if kept.
- [ ] **5.4** Settings: remove the `observer.*` side effects in `src/cli/commands/settings.ts` (about lines 114 and 133). Apply the data plan from 2.2.
- [ ] **5.5** Kernel: remove `src/kernel/observation/policy.ts` and `src/kernel/observation/observer-sidecar-policy.ts`, and their exports in `src/kernel/index.ts`. Note the public API change for library consumers in the release notes.
- [ ] **5.6** Native: delete the `observer/` crate under option C. Move it only under option E, and then only for the sensor that E keeps.
- [ ] **5.7** Tests: remove `tests/kernel/observation/observer-policy.test.ts`, `tests/kernel/observation/observer-sidecar-policy.test.ts`, the screen cases in `tests/cli/llm-vision.test.ts` and `tests/cli/llm-providers.test.ts`, the observer block in `tests/integration/cli-e2e.test.ts` (about lines 76–123), and the observer keys in `tests/kernel/settings-scopes.test.ts` (about lines 54–55). Keep the photo-import vision tests.

Each step must be revertible on its own. The Phase 0 switch stays in place until 5.3 lands.

## Phase 6 — Docs and knowledge (same PR as the behaviour change)

- [ ] **6.1** OKF article `docs/okf/observer-privacy-model.md`: rewrite through the `zam_okf_upsert` tool. Do not edit the bundle files by hand, as CLAUDE.md requires.
- [ ] **6.2** Status lines: mark ADR 2026-06-20 and ADR 2026-06-22 as superseded by the new ADR. Accepted ADRs are immutable, so add a status line and do not rewrite the text.
- [ ] **6.3** `docs/concepts/monitoring-methods.md` (Level 2) and `beliefs/symbiosis/observation-over-interruption/README.md`: state that screen observation is delegated to skill learners.
- [ ] **6.4** Skill files: remove the capture and observer steps, including Approach C, from `skills/zam/SKILL.md`, `.agents/skills/zam/SKILL.md`, `.claude/skills/zam/SKILL.md` and `.agent/skills/zam/SKILL.md`. Apply the same change to AGENTS.md wherever it repeats these steps.
- [ ] **6.5** Observer documents `docs/windows-ui-observer-proposal.md`, `docs/observer-next-steps.md`, `docs/ui-observation-protocol.md` and `docs/observer-open-source-research.md`: mark them historical, or delete them under the plan lifecycle rule.
- [ ] **6.6** `docs/knowledge-map/map.json`: regenerate it if a generator exists. Do not hand-edit it.
- [ ] **6.7** ADR index in `docs/adr/README.md`: set the status of the new ADR and of the superseded ones.
- [ ] **6.8** Delete this plan once its last phase is done, unless open tasks remain.

## Phase 7 — Verification and release gate

- [ ] **7.1** `npm run build`, `npm run typecheck`, `npm run lint` and `npm run test` pass.
- [ ] **7.2** Desktop: `npm run desktop:prepare` and a desktop build complete. The bundle contains no `zam-observer` resource.
- [ ] **7.3** Grep gate in shipped paths (`src`, `desktop/src`, `desktop/src-tauri/src`, and the skill files): no `capture-ui`, `observe-ui-snapshot`, `start-recording`, `stop-recording`, `zam-observer`, `screencapture`, `gdigrab` or `avfoundation`. Historical documents are excluded.
- [ ] **7.4** The contract tests from 4.6 pass with fixtures that contain a fake secret in every forbidden field.
- [ ] **7.5** Smoke run: one learner session with a fake secret on screen. Confirm that only structural evidence is stored, and that no temporary file and no model request carries image or video data.
- [ ] **7.6** Release notes: removed commands, removed desktop panel, the public API change, and how to install a learner.

## Risks

| Risk | Mitigation |
|---|---|
| The chosen learner leaks pixels or keys | R3 rejects such payloads in ZAM; gates G1 and G2 in the spike; enterprise allowlist for learner installs |
| Licence or supply-chain problem | G4 verified from the LICENSE file; pinned version; source review before enterprise use |
| The learner stops being maintained | G5; ZAM depends only on the evidence contract, so a learner can be replaced |
| Assessment quality drops without pixels | The spike measures it; option E is the fallback on Windows |
| Stored data from pilots | Data plan 2.2; no deletion without owner confirmation |
| Agents break after bridge removal | Consumer map 2.1; skill-file updates 6.4; release note 7.6 |
| Legal exposure in employee or minor deployments | ADR open question 4; legal review before activation |

## Owner decisions

1. Option C, D or E (ADR).
2. Where learner configuration lives (ADR open question 1).
3. Whether anyone uses the video path today (ADR open question 3).
4. Scope of the legal review that must precede any deployment.
5. Whether Phase 0 is approved before the review finishes. It is recommended, because the bypass is known.

## Appendix A — Consumer map

To be filled in by 2.1.

## Appendix B — Spike results

To be filled in by Phase 3. One row per candidate, with the gate results and the evidence summary.

## Appendix C — Review prompt

Paste the prompt below into the reviewing model, then paste the ADR and this plan under it.

```text
Review the attached architecture decision (ADR) and implementation plan for ZAM,
an open-source learning kernel with a CLI, a bridge and a desktop app.

Context: ZAM currently has its own screen observer (Windows sidecar, screenshots,
ffmpeg full-screen video, vision analysis). The proposal removes it and adopts
external skill-recording tools. ZAM accepts only structural skill-step evidence
and rejects any payload with pixels, frames, typed characters, clipboard text
or screen text.

Please answer:
1. What is the strongest argument against replacing the screen observer with
   external learners (option C)? Does the ADR answer it?
2. Is evidence rule R3 complete? Name any field, channel or encoding it misses,
   including base64 inside JSON strings and screen text in element names.
3. Are gates G1–G8 sufficient and testable? Which would you add, drop or sharpen?
4. Is containment (Phase 0) complete? Which other paths could send screen content
   to a model?
5. Which privacy or legal points need a lawyer for employee or minor deployments?
   Do not give legal advice; flag only.
6. What evidence would change your recommendation?

Output: findings ranked critical / major / minor, each with a concrete fix.
Mark what you could not verify. Stay under 900 words.

--- ADR ---
(paste docs/adr/2026-10-08-skill-learner-observation.md)

--- PLAN ---
(paste docs/plans/2026-10-08-skill-learner-observation.md)
```
