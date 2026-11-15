# Guided work — implementation plan

**Status:** Phases 1 and 2 are built. Phases 3–4 build the rest of the flow, 5–6 clean up and accept the ADR, 7 is the pilot.\
**Decision:** [ADR 2026-11-15 — Guided Work](../adr/2026-11-15-guided-work-subtasks-and-review.md). Its decisions are cited here as **D1–D11**. Read the ADR first; this plan does not repeat its reasons.\
**Branch:** `feat/guided-work`, from `main`. One feature, one branch, one PR, one commit per phase.

This document is harness-agnostic. Any agent or person can pick up the next unchecked item without other context. An item is done when its exit evidence exists: a test, a grep result or a recorded number.

## Rules that apply to every phase

- New learning logic goes into `src/kernel/`. The kernel imports no HTTP and no LLM code.
- IDs are ULIDs (`ulid()`).
- `zam bridge` prints JSON only, errors included.
- No new dependency.
- A schema change goes into BOTH `src/kernel/db/schema.ts` and a numbered, idempotent migration in `runMigrations` (`src/kernel/db/provision.ts`), and raises `CURRENT_SCHEMA_VERSION` there. It is 48 today, so this plan uses **M049**. If `main` has moved, take the next free number.
- Every tool must be safe to auto-approve (`docs/okf/agent-trust-model.md`): no argument is read as a path, none is fetched as a URL, none writes a security switch.
- Verify at the end of each phase: `npm run lint`, the named test files with `npm run test -- <file>`, then `npm run build`. If lint fails before you touched code, check that `biome.json` matches the installed Biome first.
- Commit format: `<type>: <short summary>`. Everything on GitHub is English.

## Phase 1 — Subtasks in the kernel

Goal: a session can hold subtasks with an owner, and the kernel enforces D1, D4 and D6. No tool yet.

- [x] **1.1** Table `session_subtasks` in `src/kernel/db/schema.ts` and as migration **M049**:

  ```sql
  CREATE TABLE IF NOT EXISTS session_subtasks (
    id              TEXT PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    ordinal         INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 9),
    title           TEXT NOT NULL,
    done_criterion  TEXT NOT NULL DEFAULT '',
    kind            TEXT NOT NULL CHECK (kind IN ('text', 'terminal', 'computer_use')),
    owner           TEXT NOT NULL CHECK (owner IN ('user', 'agent', 'other')),
    state           TEXT NOT NULL DEFAULT 'open'
                    CHECK (state IN ('open', 'handed_over', 'done', 'cancelled')),
    waits_for       TEXT NOT NULL DEFAULT '[]',
    external_ref    TEXT,
    done_by         TEXT CHECK (done_by IN ('user', 'agent', 'other')),
    checked         TEXT CHECK (checked IN ('passed', 'failed', 'not_checked')),
    help            TEXT CHECK (help IN ('none', 'pointer', 'pattern', 'agent_did_it')),
    commit_id       TEXT,
    handed_over_at  TEXT,
    closed_at       TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (session_id, ordinal)
  );
  CREATE INDEX IF NOT EXISTS idx_session_subtasks_session
    ON session_subtasks(session_id);
  ```

  `waits_for` is a JSON array of ordinals. The ADR's state `blocked` is **not stored**: a subtask is blocked while one it waits for is neither `done` nor `cancelled`. Compute it on read. `session_steps` is not changed.
- [x] **1.2** Add `session_subtasks` to `SNAPSHOT_TABLES` (`src/kernel/db/snapshot.ts`, next to `session_steps`) and to the row-level-security policies (`src/cli/deploy/rls-policies.ts`): copy the `session_steps` policy, which takes its owner from the session, and add the table to `RLS_PROTECTED_TABLES`.
- [x] **1.3** New module `src/kernel/models/subtask.ts`, exported through `src/kernel/index.ts`:

  ```ts
  export type SubtaskOwner = "user" | "agent" | "other";
  export type SubtaskState = "open" | "handed_over" | "done" | "cancelled";
  export type SubtaskKind = "text" | "terminal" | "computer_use";
  export interface Subtask { /* the columns, plus blocked: boolean */ }

  planSubtasks(db, { sessionId, subtasks }): Promise<Subtask[]>
  handOverSubtask(db, { sessionId, ordinal }): Promise<Subtask[]>
  closeSubtask(db, { sessionId, ordinal, doneBy, checked, help?, commitId? }): Promise<Subtask[]>
  listSubtasks(db, sessionId): Promise<Subtask[]>
  ```

  A subtask is addressed by its ordinal (1–9) within the session. Ordinals never change, so a first plan can say "3 waits for 1 and 2" before any row exists. All three writes return the session's full list.

  Rules, each with a test:
  - `planSubtasks` is an update that can be repeated (D6). An entry whose `ordinal` exists changes that subtask; otherwise it adds one. At most nine per session. With an empty list it only reads.
  - Through `planSubtasks` a subtask may change title, criterion, kind, `waitsFor`, `externalRef` and owner while it is `open` or `handed_over`. `state: "cancelled"` cancels it, and `state: "done_by_other"` records that a colleague finished it (D4). It can never become `done` by `user` or `agent` this way. A handed-over subtask whose owner changes away from `user` is `open` again.
  - A `done` or `cancelled` subtask accepts only a new `external_ref`.
  - `handOverSubtask` needs owner `user`, state `open` and not blocked. It sets `handed_over` and `handed_over_at`.
  - `closeSubtask` with `doneBy: 'user'` needs owner `user` and state `handed_over`. With `doneBy: 'agent'` it accepts owner `agent`, and owner `user` only with `help: 'agent_did_it'`. It never accepts `'other'`; that comes in through `planSubtasks`.
  - `waits_for` must name subtasks of the same session and must not form a cycle.
  - A session that has ended (`completed_at` set) refuses all three writes.
- [x] **1.4** Input limits, enforced in the kernel: `title` 1–120 characters and `done_criterion` up to 300, plain text without control characters. `external_ref` is an `http(s)` URL of at most 300 characters or an id matching `[A-Za-z0-9#_.-]{1,64}`. It is stored and returned, never fetched. `commit_id` matches `[0-9a-f]{7,40}`.
- [x] **1.5** Tests in `tests/kernel/subtask.test.ts` for every rule above, plus a migration test that runs M049 twice on a version-48 database.

Exit evidence: `npm run test -- tests/kernel/subtask.test.ts tests/kernel/snapshot.test.ts tests/kernel/postgres-rls.test.ts tests/kernel/postgres-team.test.ts` passes.

Done on `feat/guided-work`, 2026-11-15. Evidence and deviations:

- 27 tests in `tests/kernel/subtask.test.ts`. Lint, `tsc --noEmit` and the full suite pass (454 files, 4760 tests, 32 skipped).
- **Not run locally:** the PostgreSQL tests need `POSTGRES_URL` and were skipped. The new policy in `rls-policies.ts` and the translation of the new table for PostgreSQL are first exercised by CI, which starts a PostgreSQL service. The table-classification test in `postgres-team.test.ts` and the snapshot guard did run and pass.
- The column is `ordinal`, not `position`: `position` is a keyword in PostgreSQL, and the PostgreSQL tests could not be run locally to prove it harmless.
- Subtasks are addressed by ordinal, not by id, and `waits_for` holds ordinals. A first plan can then name what a subtask waits for.
- A refusal by a rule is a `SubtaskRuleError`, so Phase 2 can tell it from a broken call.
- A subtask the agent owns cannot be closed while it still waits for another. The plan did not ask for this; it keeps the order of the list honest.

Pitfall: the team library runs on PostgreSQL. Use the same column idioms as `session_steps`; the three existing tests named above pin the snapshot list and the policies.

## Phase 2 — Three tools

Goal: Plan, Hand over and Close exist as MCP tools and as bridge commands (D6).

- [x] **2.1** Handlers in a new file `src/cli/work-handlers.ts`, following `startSession` in `src/cli/bridge-handlers.ts`: `workPlan`, `workHandOver`, `workClose`. Each resolves the user with `resolveHandlerUser`, checks that the session belongs to that user and returns

  ```ts
  { sessionId, subtasks: Subtask[], instruction: string }
  ```

  `instruction` is the next step in plain English. It is how the flow stays in the agent's view (D9), so write it with care:
  - `workPlan`: names the subtasks the agent must not write. On the first call it also says: ask the learner, in so many words, to take the subtasks that are hardest for them (D3), and create board items only after they chose (D4).
  - `workHandOver`: "End your turn now. Do not edit the files of this subtask. Wait for the learner." It names the subtask and its done-criterion.
  - `workClose`: after `doneBy: 'user'`, "Review this subtask with the learner now" (D7). After the last open subtask, "Draw up the record" (D8).
- [x] **2.2** MCP tools in `src/cli/commands/mcp.ts`, registered like `zam_session_start`: `zam_work_plan`, `zam_work_hand_over`, `zam_work_close`. `destructiveHint: false`. They change state, so they are **not** added to the pre-approved list in `src/cli/agent-approval.ts` and not to `STUDIO_BRIDGE_COMMANDS`.
- [x] **2.3** Bridge commands in `src/cli/commands/bridge.ts`, following `start-session`: `work-plan` (subtasks as JSON on stdin), `work-hand-over --session <id> --subtask <n>`, `work-close --session <id> --subtask <n> --done-by <user|agent> --checked <passed|failed|not_checked> --help-given <none|pointer|pattern|agent_did_it> [--commit <sha>]`. The option is `--help-given` because Commander reserves `--help`.
- [x] **2.4** Types for the three responses in `src/bridge/protocol.ts`. Adding fields is safe; do not change an existing one.
- [x] **2.5** `zam_session_end` and `end-session` return the session's subtasks in their summary, so a harness without the new tools can still show them.
- [x] **2.6** Tests: `tests/cli/work-tools.test.ts` (each handler, each refusal, the `instruction` texts), an addition to `tests/cli/mcp.test.ts` (the three tools are listed and none is pre-approved), and a bridge test that every error is JSON.

Exit evidence: the three test files pass; `zam bridge work-plan` round-trips a plan against a temporary database.

Done on `feat/guided-work`, 2026-11-15. Evidence and deviations:

- `tests/cli/work-tools.test.ts` covers the handlers, the three MCP tools and the three bridge commands in one file (14 tests); `tests/cli/mcp.test.ts` now pins 52 tools. Lint, `tsc --noEmit` and the full suite pass (455 files, 4774 tests, 32 skipped).
- The tools take the subtask's ordinal (`subtask: 2`), as Phase 1 settled.
- `work-plan` reads `{"subtasks": [...]}` or a bare list on stdin; no input or `[]` only reads.
- Another learner's session is answered as "Session not found", not as forbidden.
- `instruction` is computed from the list alone (`nextStep` in `src/cli/work-handlers.ts`): it names the learner's subtasks the agent must not write, then the one next step. When every subtask has ended it spells out the record at the end, so Phase 4's skill can stay short.
- A first plan in which no subtask is the learner's yet tells the agent to ask the learner to take the hardest ones and to record that by setting `owner: user`.

## Phase 3 — The record at the end

Goal: the two parts of D8 can be recorded.

- [ ] **3.1** `findTokens` (`src/cli/bridge-handlers.ts`) returns the card id for a card the learner already has: add `id` inside the existing `card` object. Nothing else changes; a token without a card still returns `card: null`. Update the type in `src/bridge/protocol.ts` if one exists and the description of `zam_find_tokens`. The tool stays read-only and pre-approved.
- [ ] **3.2** No new tool for the confirmation. The work skill (Phase 4) records each kept card with `zam_submit_review`: `cardId`, `rating: 3`, `independent: true`, `activity: "work-coverage"`, `answerFormat: "recall"`, `doneBy: "user"` and the session id. All of these parameters exist today. No `zam_admit_review` before it: nothing was presented.
- [ ] **3.3** Tests: `findTokens` returns the id for an owned card and `null` for a token without one; a submit with the parameters of 3.2 writes one review and makes a due card not due; the same submit with `tokenId` for a token without a card is **not** part of the flow (assert that the skill text never tells the agent to pass `tokenId`).

Exit evidence: the tests pass.

Pitfall: `submitReview` calls `ensureCard` when it gets a `tokenId` and no card exists. That would enrol the learner in a shared or Bonus token. The flow passes `cardId` only.

## Phase 4 — The work skill

Goal: a short skill carries the flow, and every harness gets it.

- [ ] **4.1** New skill `skills/zam-work/SKILL.md`, at most 80 lines. A draft is in Appendix A. It holds the flow and the rules; the tool results carry the step-by-step instruction.
- [ ] **4.2** Harness copies `.claude/skills/zam-work/`, `.agent/skills/zam-work/` and `.agents/skills/zam-work/`. The body below the front matter is identical in all four. Add `tests/cli/work-skill.test.ts`, which fails when a body differs.
- [ ] **4.3** Distribution. Today the code knows one skill:
  - `src/kernel/system/hooks.ts` (`distributeGlobalSkills` and the path helpers above it),
  - `src/cli/provisioning/index.ts` (`wireSkills` and its health report),
  - `package.json` `files`,
  - the tests `tests/cli/skill-links.test.ts`, `tests/cli/agent-plugin.test.ts`, `tests/cli/setup.test.ts` and `tests/kernel/system.test.ts`.

  Turn the single name into a list of two, `zam` and `zam-work`, in each place. Keep the behaviour for `zam` exactly as it is; extend the tests rather than rewrite them.
- [ ] **4.4** In all four copies of the existing `zam` skill, change only what points at guided work: the menu entry **Guided collaboration** now says to load the `zam-work` skill, and the sentence about guided collaboration in STEP 4 goes. Add one sentence to the rule against inferring a running flow from old rows: a guided-work session is picked up again with `zam_work_plan`.
- [ ] **4.5** Check by hand in one harness: `/zam`, choose guided collaboration, and follow a small real task to the record.

Exit evidence: the tests of 4.2 and 4.3 pass; a note in this plan on what 4.5 showed.

Out of scope: the three harness copies of the existing `zam` skill have drifted from `skills/zam` (they lack the material-import lines). Repairing that is a separate change.

## Phase 5 — The authored symbiosis mode goes out of use

Goal: D10.

- [ ] **5.1** `src/cli/llm/client.ts`: remove `symbiosis_mode` from the three prompts that ask for it, and make `parseGeneratedCardArray` accept a card without it. `GeneratedCardProposal.symbiosis_mode` becomes optional. A value that is present and invalid is still refused.
- [ ] **5.2** Callers that pass the generated mode on to `createToken` pass `null` when it is absent.
- [ ] **5.3** Leave alone: the `symbiosisMode` parameter of `zam_add_token` and `zam_review_action`, the column, `resolveActiveSymbiosisMode` and `getDomainCompetence`.
- [ ] **5.4** Tests: a generated card without the field parses; one with an invalid value throws.

Exit evidence: the LLM client tests pass; `grep -n "symbiosis_mode" src/cli/llm/client.ts` shows no prompt line.

## Phase 6 — Beliefs, documents, acceptance

Goal: D11, and the documents say what the code does. Same PR as the phases before.

- [ ] **6.1** Belief edits, component by component, as D11 lists them: session model (3), observation over interruption (1, 4), modes (5, 6), skill decay (2, 3, 5) and the related line in `beliefs/forgetting/README.md`, symbiosis (6), bidirectional learning (1 and the new sentence on repository knowledge). Keep each belief at seven components or fewer.
- [ ] **6.2** OKF, through `zam_okf_upsert` and never by hand: update `docs/okf/mcp-surfaces.md` (three new tools, `card.id` in the search result) and add an article `guided-work` that describes the flow as built.
- [ ] **6.3** Knowledge map: add statements for `src/kernel/models/subtask.ts`, `src/cli/work-handlers.ts` and `skills/zam-work/SKILL.md` to `docs/knowledge-map/map.json`, then run `npm run dev -- knowledge-map validate --repo . --write`.
- [ ] **6.4** `CLAUDE.md` and `AGENTS.md`: one convention bullet for guided work, the same text in both.
- [ ] **6.5** Set the ADR to **Accepted** in its header, its status history and `docs/adr/README.md`. **Owner gate:** only on the owner's word.

Exit evidence: `npm run test -- tests/cli/knowledge-map.test.ts` passes; the OKF audit reports no error.

## Phase 7 — Pilot

Goal: the measure in the ADR's *Delivery*. No code.

- [ ] **7.1** Ten real development tasks, on at least two harnesses. For each, fill one row of Appendix B.
- [ ] **7.2** Report the four numbers: sessions with a subtask handed over and closed by the learner unasked; take-overs; tokens and duration; cards proposed and accepted.
- [ ] **7.3** **Owner gate:** decide from the numbers whether card steps during the work come back (D8) and whether the hand-over needs more than a tool result (D6).

## Risks

- **Agents do not stop.** The protocol is cooperative (D6). Phase 7 measures it. If take-overs are frequent, the first thing to change is the wording of the `instruction` texts, not the design.
- **The skill is not loaded.** A harness may start working before it reads `zam-work`. The `instruction` of `zam_work_plan` repeats the two rules that matter most: do not write the learner's subtasks, and stop after the hand-over.
- **Board tooling differs per environment.** ZAM touches no board (D4). The skill names no product; it says "with the tools this environment has".
- **Migration number.** Another branch may take M049 first. Renumber before merging.

## Owner decisions still to come

- 6.5: accept the ADR.
- 7.3: what the pilot changes.

## Appendix A — Draft of `skills/zam-work/SKILL.md`

```markdown
---
name: zam-work
description: Work on a real task together with ZAM. The task is split into subtasks, the learner takes the hardest ones and does them by hand, and each one ends with a colleague's review. Use when the learner chooses guided collaboration or asks to do part of a task themselves.
---

# ZAM — guided work

You and the learner are a team on one task. Your job is not to finish it
alone. The learner does real work by hand, and you make that work possible.

## The flow

1. Start a session with `zam_session_start`.
2. Read the code and form your own view of the path. Do not show it yet.
3. Ask the learner where they would start, or let them split the task. A
   sketch in the task statement is that answer. They may also ask you to
   split it and then review your split.
4. Compare the two paths. If theirs has a gap, explain it. If theirs is one
   you did not have, name every drawback you see, say for each whether it
   is negligible, and say whether the path is good enough. They decide.
5. Record the subtasks with `zam_work_plan`: at most nine, each with a
   done-criterion, an owner and what it waits for. Then ask the learner, in
   so many words, to take the subtasks that are hardest for them.
6. Only now create work items, with the tools this environment has, and
   give ZAM their references with another `zam_work_plan`.
7. Do your own subtasks. For a learner's subtask prepare the surroundings
   and leave the gap: the caller and a failing test exist, the piece itself
   does not.
8. When only the learner's subtasks are left, call `zam_work_hand_over`. It
   is your last call. End your turn and wait.
9. When the learner is back, check the result against the done-criterion,
   close with `zam_work_close`, and review it like a colleague: one or two
   questions about the reasons, short feedback, what you would have done
   differently. Never ask whether they did it themselves.
10. If the learner questions your subtask and their way is better, change
    your work. Propose a note on the context you lacked for a place the
    repository already has, and write it after they confirm.
11. Keep the board right: update an item whenever its subtask changes
    state. At the end of the day, remind the learner to push.

## If the learner is stuck

Help in three steps: where to look; a pattern elsewhere in the repository;
do it yourself. After the third, close the subtask as done by you.

## When a session resumes

Call `zam_work_plan` to get the list. Read the board items again. What a
colleague changed wins: finished is done by `other`, taken over gets the
owner `other`, removed is cancelled.

## The record at the end

No card step happens during the work. At the end:

- **New cards, few.** Propose one only if the concept will probably still
  exist in two years and is more than something easily looked up. Show each
  by itself with its question, its answer and one line on why it passes.
  Create it with `zam_add_token` only after a yes.
- **Cards the learner already has.** Search with `zam_find_tokens`. List,
  by title only, the cards whose criterion the learner met in full in
  subtasks they closed themselves. Leave out any card whose answer you
  supplied. Ask: did you apply each of these in full and by yourself? For
  each one they keep, call `zam_submit_review` with its `cardId`,
  `rating: 3`, `independent: true`, `activity: "work-coverage"`,
  `answerFormat: "recall"` and `doneBy: "user"`. Never pass a `tokenId`.

Then end the session with `zam_session_end`.

## Rules

- Never write a subtask the learner owns unless they ask you to.
- No subagents, except one background check when the two paths disagree
  and reading does not settle it.
- Team rules for branches and pushes come first.
```

## Appendix B — Pilot sheet

| # | Harness | Task | Subtasks (learner / agent) | Handed over unasked? | Take-overs | Tokens | Minutes | Cards proposed / accepted | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | |
