# Skill-learner observation — implementation plan

**Status:** Draft for review, together with the ADR. Phases 2–7 wait for an accepted decision. Phase 0 is containment and can start on approval, independently of the decision.\
**Decision:** [ADR 2026-10-08 — Observation Without Content](../adr/2026-10-08-skill-learner-observation.md). Its decisions are cited here as **R1–R8** and its options as **A–E**. Read the ADR first; this plan does not repeat its reasons. The companion [ADR 2026-10-08b](../adr/2026-10-08b-corporate-deployment-baseline.md) is cited as **D1–D9**.\
**Branch:** this document lives on `docs/screen-observer-adr`. Implementation starts on a new branch from `main` after acceptance. One feature, one branch, one PR, one commit per phase, as in the photo-import plan. Phase 0 (0A and 0B) ships as one PR from `feat/observation-containment`, one commit per sub-phase (owner decision, 2026-10-08).

This document is harness-agnostic. Any agent or person can pick up the next unchecked item without other context.

## Scope

Sequencing, gates and owner decisions. No code changes in this document. Every item is a checklist entry; an item is done when its exit evidence exists (a test, a grep result, a recorded spike result).

## Phase 0A — Screen containment (can start on approval)

Goal: no screen content reaches a model through ZAM until the removal in Phase 5 lands (R8). Nothing here depends on the choice between C, D and E.

- [x] **0A.1** Add the machine-local switch `observation.screen` to `~/.zam/config.json` (`src/kernel/system/install-config.ts`), off when absent. While it is off, each of these returns a typed refusal (`screen-observation-off`) before it captures or reads anything: `capture-ui` (live and `--image`), `observe-ui-snapshot`, and the read-back of stored observer reports through `get-observations` and `observe-ui-watch`. The UI branch of session synthesis reads no reports and returns no candidates. Keeping a legacy file for the owner's inventory (0B.6) does not keep serving it. The recording commands and video input are deleted (0A.3). No `setting-set` key, bridge command or MCP tool writes the switch, and `llm.vision.enabled` does not open it.
- [x] **0A.2** Desktop: one Rust reader for `config.json` in `desktop/src-tauri/src/lib.rs`. It resolves the path the same way the kernel does (`ZAM_CONFIG_PATH`, else `~/.zam/config.json`), and it records how `ZAM_HOME` relates to that. The companion's managed policy will reuse it (D6). Every Tauri command that starts the sidecar or captures checks the switch: the sidecar spawns at `lib.rs:556` and `lib.rs:811`, and every `run_zam_observer_blocking*` call site.
- [x] **0A.3** Delete the desktop observer panel and its loop (`desktop/src/main.ts:1008–1027`, `4511–4691`), every Tauri command that starts the sidecar, `start-recording`, `stop-recording` and video input to `observe-ui-snapshot`. Nobody uses them (ADR open question 3, decided 2026-10-08).
- [x] **0A.4** Remove the OCR fallback from `observer/src/uia.rs`: the `capture_rect_gdi` and `ocr_bitmap` call in `focused_element_from` (about lines 961–976), and both helpers, which have no other caller. An element without an accessible name reports an empty name. Correct the privacy claim in `observer/README.md` (line 140) and the comment on `build_text_changed_event` (lines 496–497).
- [x] **0A.5** Replace the shell-string `execSync` calls in `src/cli/llm/vision.ts` (lines 112 and 122) with `execFile` and an argument array, so a file name can never be read as shell syntax. `observe-ui-snapshot` refuses before any ffmpeg call.
- [x] **0A.6** Material import (R7): confirm with a test that `material-import-analyze` stays off MCP and off the Studio allowlist. When D1 lands, its `--file` paths go through D1's resolver.
- [x] **0A.7** Tests: every surface in 0A.1 refuses under default config, `capture-ui --image` included; `setting-set llm.vision.enabled true` leaves the refusal in place; no ffmpeg process is spawned while the switch is off; a Rust test shows that the Tauri commands refuse while the switch is off, and that an unnamed element yields an empty name, never recognised text.

Exit gate: owner approval; one PR; release-note line "screen observation is off by default".

Done on `feat/observation-containment`. Evidence and deviations:

- The switch lives in `src/kernel/system/install-config.ts` (`isScreenObservationEnabled`) and `src/kernel/observation/screen-switch.ts`. Besides the four surfaces of 0A.1 it also refuses `get-observations` and `observe-ui-watch`, because stored reports carry screen-derived text, and a UI session's synthesis reads no reports while it is off. The recording commands were deleted later in 0A (see 0A.3). `get-observer-policy` and `zam observer status` report the switch.
- 0A.2: first built as `desktop/src-tauri/src/machine_config.rs` with the gate in `resolve_observer_runtime`. Superseded once open question 3 was answered: the panel was the only caller of the sidecar commands, so the Tauri shell no longer starts the sidecar at all, and the reader went with it. #390 D6 therefore needs no Rust reader for the sidecar.
- 0A.3: open question 3 was answered "nobody uses them, delete" (2026-10-08). Deleted in 0A: the desktop observer panel and loop (HTML, `main.ts`, CSS, the 38 `observer_*` keys in every locale, the privacy-reason labels), every observer Tauri command with its watch state, `start-recording`, `stop-recording`, and video input to `observe-ui-snapshot` (frames via ffmpeg). `lbl_observer_model` stays: the Settings AI card still shows the vision model. The sidecar is no longer bundled with the desktop app (see 5.2); its crate stays until the C/D/E decision, as does `llm.vision.max_frames`, which nothing reads any more.
- 0A.4: the crate features `Media_Ocr`, `Graphics_Imaging` and `Security_Cryptography` are gone as well; `cargo check --target aarch64-pc-windows-msvc` passes. Unnamed elements are not unit-testable off Windows, so a source guard replaces the Rust test the plan asked for.
- 0A.5: `stop-recording`'s ffmpeg call in `bridge.ts` had the same shell string and got the same fix.
- 0A.6: the D1 resolver part waits for ADR 2026-10-08b.
- 0A.7: `tests/cli/screen-observation-switch.test.ts` (fake `ffmpeg` on `PATH` proves nothing spawns; the desktop has no panel, no command that starts the sidecar and no bundled sidecar; the sidecar has no OCR), and the off case in `tests/kernel/session-synthesis.test.ts`. The Rust tests were deleted with `machine_config.rs` (see 0A.2).

## Phase 0B — Shell redaction and retention (can start on approval)

Goal: command text reaches agents and models only in redacted form, and raw observation files do not outlive their purpose (R5, R6). The shell hooks append command lines themselves (`src/kernel/observation/shell-hooks.ts:42–133`), so ZAM cannot redact on write.

- [x] **0B.1** Add a redactor to the kernel, next to `src/kernel/observation/monitor-io.ts`. It keeps the command name, subcommands and flag names, and replaces values with a fixed marker in at least these positions:
  - environment assignments: `NAME=value`, `export NAME=value`, `env NAME=value cmd`, `$env:NAME = "value"`, `set NAME=value`, `setx NAME value`, `[Environment]::SetEnvironmentVariable(…)`;
  - headers in every form: `-H 'Authorization: …'`, `-H'…'`, `--header=…`, `Cookie`, `X-Api-Key`, `X-Auth-Token`;
  - secret flags in separate, `=` and attached forms: `--token`, `--password`, `--secret`, `--api-key`, `-p` and `-pVALUE` (as in `mysql`), `-u user:pass`, `--user`, `--data 'password=…'`, `--from-literal=…`, `-e KEY=value` (as in `docker`), `openssl … -pass pass:…`, `sshpass -p`;
  - PowerShell parameters, case-insensitive and abbreviable: `-Credential`, `-Token`, `-ClientSecret`, `-Password`, and `ConvertTo-SecureString '…' -AsPlainText`;
  - Windows: `cmdkey /pass:…`, `net use … /user:… password`;
  - piped secrets: `echo … | docker login --password-stdin`, `… | gh auth login --with-token`;
  - registry tokens: `npm config set …:_authToken …`, `_authToken=` appended to `.npmrc`;
  - credentials inside URLs (`user:password@`) and connection strings (`Password=…;`, `postgres://user:pass@…`);
  - the name heuristic: any value whose key or flag contains `pass`, `pwd`, `secret`, `token`, `key`, `auth`, `cred`, `cookie` or `bearer`;
  - high-entropy strings above a length threshold, JWT-shaped tokens (dots split naive entropy checks), and inline private-key blocks.
- [x] **0B.2** Apply the redactor as a response filter on every payload derived from a monitor log, not field by field: `zam_monitor` (`src/cli/commands/mcp.ts:1293`; it is `readOnlyHint`, so auto-approvable), the monitor handlers in `src/cli/bridge-handlers.ts` (including `commands[]` and `unmatchedCommands`), `analyzeMonitor`, synthesis candidates (`matchedCommandTexts` and `unmatchedCommands`), `discover-skills` examples, and the synthesis returned by `zam_session_end`.
- [x] **0B.3** At `zam monitor stop` and at session end, rewrite the session's log in redacted form. Sweep for logs of sessions that never stopped at `zam monitor start`, bridge start and desktop start.
- [x] **0B.4** Retention (R6): delete a session's raw monitor log and observer reports when the session ends, right after its synthesis candidates are prepared, and any such file older than `observation.retentionDays` (default 1, i.e. 24 hours; ADR open question 6, decided 2026-10-08 and refined 2026-10-09). Add an explicit action that drops a running session's files sooner (bridge, MCP and one Studio action). Run the sweep at session end, `zam monitor start`, bridge start and desktop start, and hourly while the bridge or the MCP server runs. Files from before this change are only listed until the owner confirms (0B.6).
- [x] **0B.5** Before deleting a log, store a value-free digest of the session (redacted, normalised command prefixes), and make `discover-skills` (`src/cli/commands/bridge.ts:1906`) read digests.
- [x] **0B.6** Inventory and report: `zam-recording-*` and `zam-capture-*` in the OS temp directory, `~/.zam/observer/*.jsonl` (may hold OCR text) and `~/.zam/monitor/*.jsonl` (may hold unredacted commands). Delete only after the owner confirms the list.
- [x] **0B.7** Tests:
  - a corpus of fake secrets in every position 0B.1 claims to cover, asserted absent from every payload in 0B.2 and from the rewritten log;
  - existing monitor-pattern tests still match after redaction;
  - retention deletes at session end, on the explicit action and after the window, and never touches a file from before the change without confirmation;
  - a session ended on another machine deletes nothing locally;
  - `discover-skills` finds the same steps and session counts from digests as from raw logs; its examples are then prefixes, not full commands.

Exit gate: owner approval; one PR; release-note lines "monitored commands are stored and returned redacted" and "observation files are deleted after use".

Done on `feat/observation-containment`, in the same PR as 0A. Evidence and deviations:

- 0B.1: `src/kernel/observation/redact.ts`. Besides every listed position it also covers `sqlcmd -P`, `az -p`, `openssl -k`, `htpasswd -b`, `--otp`, `git config KEY VALUE`, `aws configure set`, secret managers (`gh secret set`, `kubectl create secret`) and heredoc bodies. Hex runs of 32 or more characters count as secrets, except 40-character git object ids; ULIDs and UUIDs pass. A secret buried as one segment of a path survives.
- 0B.2: the filter sits in `readMonitorLog`, the one read path every listed consumer uses, rather than on each response; a caller-supplied pattern therefore cannot probe the raw text either. `prepareSessionSynthesis` redacts commands a caller passes in, and `applySessionSynthesis` redacts the texts an agent sends back before they reach the shared database.
- 0B.3: the rewrite keeps the file's modification time, so it does not extend retention, and drops lines that do not parse. The sweep rewrites only logs idle for ten minutes; a rewrite can lose one line a hook appends at that moment. Since 2026-10-09 session end deletes the log instead of rewriting it (0B.4); the rewrite stays for `zam monitor stop` and the sweep.
- 0B.4: refined by the owner on 2026-10-09: a raw log is evidence only at the time of capture. Session end (`zam_session_end`, bridge `end-session`, `zam session end`) prepares the synthesis candidates and then deletes the session's raw files, keeping the digest; the candidates carry the redacted texts the learner confirms. The separate confirm/dismiss outcome is gone. `zam_observation_close` (MCP, destructive), `zam bridge observation-close`, `zam observation close` and a "Delete observation logs" row in Settings → Data (shown only while logs exist) drop a running or never-ended session's files sooner. Legacy means "the session's ULID predates `observation.retentionSince`", which the first sweep records in `config.json`. The desktop app's own watch logs in its app data directory are covered too.
- 0B.5: digests live in `~/.zam/monitor/digests/` (newest 200 kept); `discover-skills` reads logs and digests.
- 0B.6: `zam observation inventory [--delete]`, a learner command only, never on the bridge or MCP.
- Review of 2026-10-09 (Gemini, Grok): monitor patterns are redacted the same way as the commands before the substring match, so a step written as `export FOO=bar` still matches `export FOO=[redacted]`; every read drops the working directory, and so does the rewrite at rest; `zam bridge serve` and `zam mcp` sweep again every hour (`scheduleObservationSweeps`).
- 0B.6, library: a confirmed synthesis kept the matched command texts verbatim in `session_syntheses.evidence`, in `review_attempts.evidence` and `evidence_key`, and in the session step note. Owner decision 2026-10-09: delete them, because the hidden mode was very likely used only on the owner's own library. Migration M039 does it once, in a library stamped before it; ratings and review history stay.
- 0B.7: `tests/kernel/observation/redact.test.ts` (corpus, idempotence, pattern matching after redaction), `tests/kernel/observation/retention.test.ts`, `tests/cli/monitor-redaction.test.ts`.
- Found on the way: the analyzer matches patterns as case-insensitive substrings, not as prefixes or regular expressions as the ADR's context section and the `TokenPattern` comment say.

## Phase 1 — Review

- [ ] **1.1** Send the ADR and this plan to external review, using the prompt in Appendix C.
- [ ] **1.2** Owner answers ADR open questions 1–7 and chooses among options C, D and E, including whether C is limited to managed deployments with D as the default for individual learners.
- [ ] **1.3** Record the decision: ADR status becomes Accepted (or the ADR is revised), with the answers written into it.

Exit gate: an accepted ADR. Without it, Phases 2–7 do not start.

## Phase 2 — Inventory (read only)

- [ ] **2.1** Consumer map: every caller of the surfaces in the ADR table, including `get-observations`, `observe-ui-watch` and `zam_monitor`. Cover the bridge, the desktop app and Tauri, CI and release, tests, docs, and the skill files under `skills/zam/`, `.agents/skills/zam/`, `.claude/skills/zam/` and `.agent/skills/zam/`. Store the map in Appendix A.
- [ ] **2.2** Data map, for pilot machines and with the owner present: `~/.zam/observer/`, `~/.zam/monitor/`, temp recordings, and `observer.*` rows in `user_settings`. Classify each as delete, keep or migrate. Start from the 0B.6 inventory.
- [ ] **2.3** Photo-import check: confirm that removing the observer leaves `resolveCapability("image")`, the `llm.vision.*` settings and the material pipeline unchanged. Confirm which cloud-vision recommendations from ADR 2026-06-22 (its Decision 2) material import uses, and keep those.
- [ ] **2.4** Public-API check: which `zam-core` exports for observation (`src/kernel/index.ts`, about lines 600–700) are used outside this repository.

Exit gate: complete lists in the appendix. No deletion yet.

## Phase 3 — Learner spike (time-boxed, 2–3 working days, no ZAM code)

Order: measure the two ZAM baselines first. On the research snapshot no Windows candidate is expected to pass G1, so D or E is the expected outcome; the external candidates run only after the baselines have set the bar.

Candidates. Each claim below comes from the research snapshot and must be verified against the repository itself, not against a directory listing.

| Candidate | Platform (claimed) | Capture (claimed) | Verify first |
|---|---|---|---|
| Baseline: ZAM sidecar, UI Automation mode without OCR and without element names (after 0A.4) | Windows | control type, automation id, Raw Input counts | coverage of GUI skills; labelling effort (R4) |
| Baseline: ZAM shell observation (redacted, after 0B.1) and skill discovery | any | shell commands | coverage; whether a structural default (ADR open question 7) loses patterns |
| humblebanana/open-record-replay | macOS | mouse, keyboard and UI events as JSON | LICENSE file; whether typed characters are stored |
| video-db/open-record-replay | macOS, Windows | accessibility events, typed text | LICENSE; storage of typed text; network calls |
| ugarchance/record-and-replay-skill | macOS, Windows, Linux | input capture plus a screenshot per click | LICENSE; expected to fail G1 and G2 |
| beuaaa/pywinauto_recorder | Windows | accessibility-based recording, Python output | LICENSE; output format; maintenance |
| OpenAdapt (openadapt-capture, openadapt-flow) | macOS, Windows | screen, input and timing | LICENSE; expected to fail G1 unless screen capture can be disabled |
| Microsoft skill recorder | macOS, Windows 11 | on-screen activity, clicks, narration | open-source status; offline operation; expected to fail G1 |

Gates. A candidate must pass **G1, G2a, G2b, G3, G7, G8 and G11** to be eligible. **G4, G5, G6, G9, G10, G12, G13 and G14** must be verified before any use.

- **G1** Nothing leaves the machine by default: no pixels, no video, no text, no telemetry. No cloud model is required.
- **G2a** What reaches ZAM, after any adapter, fits the R3 schema. Verified with a fake secret typed into a password field, into a field with no accessible name, into a terminal line and into a web form, and with a fake secret visible in a window title.
- **G2b** The learner's own raw store masks typed characters. Its retention follows G9.
- **G3** The output carries stable element identifiers and timing, from which ZAM's model-free mapping (R4) can derive skill steps. The identifiers stay the same across runs.
- **G4** The licence is stated in the repository's LICENSE file and allows an unmodified, admin-installed use.
- **G5** Maintained: a commit or release within the last six months.
- **G6** Works on Windows, the enterprise target. A macOS-only candidate is a documented limitation, not a blocker, if Windows has an alternative.
- **G7** Removable without residue: documented uninstall, no background service by default.
- **G8** A visible indicator is shown while recording is active.
- **G9** The learner's own raw store, if it keeps one, has a documented location and a retention or delete setting.
- **G10** The output format is documented and machine-readable.
- **G11** Keystroke logging is off by default.
- **G12** It can be installed by device management, and is signed or reproducibly buildable from source.
- **G13** It has its own application denylist, so an organisation can exclude applications at the source.
- **G14** It runs without administrator rights and installs no system-wide keyboard or input hook beyond what G11 allows. Any component that needs elevation is installed by device management, never at run time.

Method. Scripted runs in a disposable account or VM. Record (a) network connections during the run, (b) files written, including temporary directories, (c) output files, and (d) whether the fake secret appears in any of them. For the sidecar baseline and every candidate that reaches labelling, time how long a learner without technical background needs to label one demonstration, and count wrong assignments (R4). The script includes a web or Electron screen with several controls that look alike as structural events (`invoke Button` without a distinguishing automation id). Keep the raw evidence out of the repository. Record only the results, in Appendix B.

Exit gate and decision rule:

- A candidate passes G1, G2a, G2b, G3, G7, G8 and G11, the remaining gates are verified, and labelling is acceptable → option C with that candidate, for managed deployments.
- Nothing passes, or labelling is not acceptable → option D.
- External learners lack element context that ZAM needs on Windows, and only the reduced sidecar baseline provides it → option E.

## Phase 4 — Evidence contract and model-free mapping (after acceptance)

- [ ] **4.1** Structural event schema, version 1: `version`, `sessionId` (ULID), `learner` (`id`, `version`), and `events[]` with `kind` (enumerated: focus, invoke, value-changed without the value, window-switch), `at`, `processName`, `controlType` (enumerated) and optional `automationId`. No element name, window title, value or text (R3). Unknown keys are rejected at any depth. Arrays and the whole submission have size limits.
- [ ] **4.2** Field rules: every string ASCII, normalised, without zero-width characters, with a pattern and a length limit (ids are ULIDs; `processName` is an executable name; `automationId` matches `[A-Za-z0-9_-]{1,64}`, and an id that does not is dropped from the event rather than rejected, because web frameworks put e-mail addresses, URLs and record ids there). Defence in depth: content keys (`image`, `frame`, `keyframe`, `screenshot`, `video`, `text`, `typedText`, `keystrokes`, `clipboard`) and any string beginning with `data:` are rejected even where the schema would already reject them. Rejections never echo the submitted string; `denied` reasons and logs carry a hash.
- [ ] **4.3** Skill steps get identity (R4): `agent_skills.steps` changes from a string array to objects with `id` (ULID), `text` and optional `selectors` (ordered process, control type and automation id). This needs an entry in `src/kernel/db/schema.ts`, an idempotent M-series migration in `runMigrations` (existing strings get ids and keep their text), and an increment of `CURRENT_SCHEMA_VERSION`. `normalizeSkillStep` keeps reading `text`.
- [ ] **4.4** Labelling in the Studio: one screen that shows a demonstration's structural events and lets the learner assign them to steps, one action per step. The result is stored as selectors.
- [ ] **4.5** Model-free matcher in the kernel: it matches event sequences against step selectors and produces synthesis candidates with a confidence. Confirmation stays mandatory (R4).
- [ ] **4.6** Bridge command `submit-ui-events`: JSON in, JSON out, a typed `denied` reason on rejection. Decide whether an MCP tool is also needed. ADR 2026-07-06a names MCP as the canonical agent transport.
- [ ] **4.7** Storage: decide between a session log (JSONL, under R6 retention) and a table. A table needs the same schema, migration and version steps as 4.3.
- [ ] **4.8** Tests first: schema acceptance; unknown keys rejected at depth; over-long, non-ASCII and zero-width strings rejected; content keys and `data:` strings rejected; an automation id holding an e-mail address, a URL or a record id dropped; rejection reasons free of input; migration keeps step text and assigns ids; matching from selectors; no state change before confirmation.

Exit gate: all Phase 4 tests pass with no screen code present in the tree.

## Phase 5 — Removal (one branch; one commit per step)

- [ ] **5.1** Desktop: remove the observer panel and loop in `desktop/src/main.ts` (unless 0A.3 already did), the observer Tauri commands in `desktop/src-tauri/src/lib.rs`, the observer CSS in `desktop/src/styles.css`, and the `observer_*` and `lbl_observer_model` keys in every locale. Update `tests/desktop/i18n-completeness.test.ts`. *Done in 0A except `lbl_observer_model`, which still labels the vision model in Settings.*
- [ ] **5.2** Release and CI: remove the sidecar build and prepare steps from `.github/workflows/release.yml` (about lines 166–171). Remove or retarget the observer jobs in `.github/workflows/ci.yml` (about lines 61–62, 94–97 and 236–299). Remove `scripts/prepare-observer-sidecar.mjs` and the `observer:*` scripts in `package.json`. Update the comments in `scripts/sign-macos-resources.mjs`. *Bundling removed in Phase 0 (owner decision 2026-10-08, ADR trade-off on packaging): no build or prepare step in `release.yml` or the desktop CI job, `scripts/prepare-observer-sidecar.mjs` and `observer:prepare` gone, `desktop:prepare` deletes a stale local copy. The crate's own CI jobs and `observer:check|test|build` stay until 5.6.*
- [ ] **5.3** CLI and bridge: remove `zam observer` (`src/cli/commands/observer.ts` and its registration in `src/cli/app.ts`). Remove `capture-ui`, the screen use of `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations`, `observe-ui-watch`, `get-observer-policy` and `sync-observer-policy`. Remove `observerPolicyHint` (`src/cli/bridge-handlers.ts:1524–1536`, `src/cli/commands/session.ts:137`). Keep `check-vision` only if photo import needs it, and rename it if kept. Remove the `observation.screen` switch from 0A.1 together with the last surface it guards.
- [ ] **5.4** Settings: remove the `observer.*` side effects in `src/cli/commands/settings.ts` (about lines 114 and 133). Apply the data plan from 2.2.
- [ ] **5.5** Kernel and protocol: remove `src/kernel/observation/policy.ts`, `observer-sidecar-policy.ts`, `ui-observer.ts`, `ui-observer-io.ts` and `ui-observer-synthesis.ts`, the UI branch of `session-synthesis.ts` (about line 268), their exports in `src/kernel/index.ts` (about lines 679–696), and the observer types in `src/bridge/protocol.ts` (about lines 376–460). Note the public API change for library consumers in the release notes. Sessions with `execution_context = 'ui'` stay in the database and synthesise nothing (ADR, Consequences).
- [ ] **5.6** Native: delete the `observer/` crate under options C and D. Under option E keep only the reduced sensor, emitting the Phase 4 schema.
- [ ] **5.7** Tests: remove `tests/kernel/observation/observer-policy.test.ts`, `observer-sidecar-policy.test.ts`, `ui-observer.test.ts` and `ui-observer-synthesis.test.ts`, `tests/cli/observer.test.ts`, the screen cases in `tests/cli/llm-vision.test.ts`, `tests/cli/local-vision.test.ts` and `tests/cli/llm-providers.test.ts`, the observer cases in `tests/cli/mcp.test.ts` (about line 887), the observer block in `tests/integration/cli-e2e.test.ts` (about lines 76–123), and the observer keys in `tests/kernel/settings-scopes.test.ts` (about lines 54–55). Keep the photo-import vision tests and the redaction and retention tests from 0B.7.

Each step must be revertible on its own. The Phase 0A switch stays in place until 5.3 lands.

## Phase 6 — Docs and knowledge (same PR as the behaviour change)

- [ ] **6.1** OKF article `docs/okf/observer-privacy-model.md`: rewrite through the `zam_okf_upsert` tool, covering screen removal, shell redaction and retention. Do not edit the bundle files by hand, as CLAUDE.md requires. Phases 0A and 0B already change behaviour this article describes, so their PRs update the article too.
- [ ] **6.2** Status lines: mark ADR 2026-06-20 and ADR 2026-06-22 as superseded by the new ADR. Accepted ADRs are immutable, so add a status line and do not rewrite the text.
- [ ] **6.3** `docs/concepts/monitoring-methods.md` (Level 2) and `beliefs/symbiosis/observation-over-interruption/README.md`: state that screen observation is delegated to structural learners and that shell commands are redacted.
- [ ] **6.4** Skill files: remove the screen capture and observer steps from `skills/zam/SKILL.md` (about lines 127 and 195–199) and from its copies in `.agents/skills/zam/`, `.claude/skills/zam/` and `.agent/skills/zam/`. `AGENTS.md` has no observer steps today; check it, change nothing unless that has changed.
- [ ] **6.5** Observer documents `docs/windows-ui-observer-proposal.md`, `docs/observer-next-steps.md`, `docs/ui-observation-protocol.md` and `docs/observer-open-source-research.md`: mark them historical, or delete them under the plan lifecycle rule.
- [ ] **6.6** `docs/knowledge-map/map.json`: update every statement the removal makes untrue and every citation of a moved or deleted file, statement by statement with existing ids, and check it with `npm run dev -- knowledge-map validate --repo . --write`.
- [ ] **6.7** ADR index in `docs/adr/README.md`: set the status of the new ADR and of the superseded ones.
- [ ] **6.8** Delete this plan once its last phase is done, unless open tasks remain.

## Phase 7 — Verification and release gate

- [ ] **7.1** `npm run build`, `npm run typecheck`, `npm run lint` and `npm run test` pass.
- [ ] **7.2** Desktop: `npm run desktop:prepare` and a desktop build complete. The bundle contains no `zam-observer` resource.
- [ ] **7.3** Grep gate in shipped paths (`src`, `desktop/src`, `desktop/src-tauri/src`, and the skill files): no `capture-ui`, `observe-ui-snapshot`, `start-recording`, `stop-recording`, `get-observations`, `observe-ui-watch`, `zam-observer`, `screencapture`, `gdigrab`, `avfoundation` or `OcrEngine`. Historical documents are excluded.
- [ ] **7.4** The contract tests from 4.8 pass with fixtures that contain a fake secret in every forbidden field and in every allowed string field.
- [ ] **7.5** Smoke runs: one learner session with a fake secret on screen, and one monitored shell session with a fake secret on the command line. Confirm that only structural events and redacted commands are stored and returned, that no temporary file and no model request carries image or video data, and that retention deletes the raw files after confirmation.
- [ ] **7.6** Release notes: removed commands, removed desktop panel, the public API change, shell redaction and retention, and how to install a learner.

## Risks

| Risk | Mitigation |
|---|---|
| The chosen learner leaks pixels or keys | R3 accepts no field that can carry them; gates G1, G2a, G2b and G11; enterprise allowlist for learner installs |
| Screen text arrives through an allowed field | R3: closed schema, ASCII patterns and length limits, no names or titles; the residual bandwidth is stated, not denied |
| Mapping a trace to steps needs a model | R4 keeps mapping model-free inside ZAM; if it cannot work, option D |
| Labelling is too hard for learners | The spike times it; D stays the default for individual learners |
| The shell redactor misses a secret format | Test corpus in 0B.7, extended when a miss is found; redaction on every read; R6 limits how long a miss stays on disk |
| Retention breaks skill discovery | Per-session digests (0B.5) |
| An agent opens a gate through settings | R8 switch outside the database and outside every tool-writable surface |
| Licence or supply-chain problem | G4 and G12; pinned version; source review before enterprise use |
| The learner stops being maintained | G5; ZAM depends only on the evidence contract, so a learner can be replaced |
| Assessment quality drops without pixels | The spike measures it; option E (reduced sensor) is the fallback on Windows |
| Stored data from pilots | Inventory 0B.6 and data plan 2.2; no deletion without owner confirmation |
| Agents break after bridge removal | Consumer map 2.1; skill-file updates 6.4; release note 7.6 |
| Legal exposure in employee, vocational-training or school deployments | ADR open question 4, which covers shell observation and any learner; legal review before activation |

## Owner decisions

1. Option C, D or E (ADR), and whether C is limited to managed deployments with D as the default for individual learners.
2. Where learner configuration lives (ADR open question 1).
3. Whether anyone uses the video path or the observer panel today (ADR open question 3). If not, Phase 0A deletes them. **Decided 2026-10-08: nobody does; deleted in 0A.**
4. Scope of the legal review that must precede any deployment (ADR open question 4).
5. The retention window (ADR open question 6). **Decided 2026-10-08: 24 hours** (`observation.retentionDays` default 1).
6. Redaction or a structural default for the shell monitor (ADR open question 7).
7. Whether Phases 0A and 0B are approved before the review finishes. It is recommended, because the bypasses, the OCR fallback and the unredacted monitor are known. **Decided 2026-10-08:** approved and implemented.
8. Review findings of 2026-10-09 (Gemini, Grok). **Decided 2026-10-09:** the corrections and the three code changes are applied in 0A/0B; the labelling measurement, the `automationId` rule, gate G14 and the documented limit for UI synthesis are taken into the ADR and this plan. MiMo did not review.

## Appendix A — Consumer map

To be filled in by 2.1.

## Appendix B — Spike results

To be filled in by Phase 3. One row per candidate, with the gate results, the evidence summary and, for the sidecar baseline, the labelling time.

## Appendix C — Review prompt

Paste the prompt below into the reviewing model, then paste the ADR and this plan under it.

```text
Review the attached architecture decision (ADR) and implementation plan for ZAM,
an open-source learning kernel with a CLI, a bridge and a desktop app.

Context: ZAM currently has its own screen observer (Windows sidecar with UI
Automation and an OCR fallback, screenshots, ffmpeg full-screen video, vision
analysis) and a shell monitor whose hooks append command lines to a log. The
proposal removes screen capture. GUI demonstrations come from a learner (an
external recorder, or ZAM's reduced sensor) that submits structural events in
a closed schema with no free-text field (R3). ZAM maps events to skill steps
itself, without a model, using step selectors the learner labels once (R4).
Shell observation stays, redacted on every read and rewritten redacted at
session end (R5), with enforced retention (R6). Until removal, one
machine-local switch keeps every screen surface off (R8). Option C is meant
for managed deployments; option D is the default for individual learners.

Please answer:
1. What is the strongest argument against this design? Does the ADR answer it?
2. Is R3 complete? Name any field, channel or encoding through which screen
   text could still enter.
3. Is R4's model-free mapping workable, and is labelling acceptable for
   learners who never open a terminal?
4. Is R5 an acceptable control for shell commands? Which secret positions does
   the redactor list in Phase 0B.1 miss? Which read paths does 0B.2 miss?
5. Is R6 well defined across machines, sessions that never end, and skill
   discovery?
6. Are gates G1–G13 sufficient and testable? Which would you add, drop or
   sharpen?
7. Is containment (Phase 0A) complete? Can an agent limited to ZAM's own tools
   open any screen path?
8. Which privacy or legal points need a lawyer for employee, vocational
   training or school deployments? Do not give legal advice; flag only.
9. What evidence would change your recommendation?

Output: findings ranked critical / major / minor, each with a concrete fix.
Mark what you could not verify. Stay under 900 words.

--- ADR ---
(paste docs/adr/2026-10-08-skill-learner-observation.md)

--- PLAN ---
(paste docs/plans/2026-10-08-skill-learner-observation.md)
```
