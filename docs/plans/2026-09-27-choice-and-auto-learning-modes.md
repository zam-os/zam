# Choice and Auto learning modes — implementation plan

**Status:** All seven phases done (2026-09-27 to 2026-09-29). Open before the
release: the manual Studio pass with an AI model (Ask chat, Auto with a typed
answer, live option generation). Delete this plan before the release that
ships the feature, unless open tasks remain.\
**Decision:** [ADR 2026-09-27 — Choice and Auto Learning Modes](../adr/2026-09-27-choice-and-auto-learning-modes.md).
Its decisions are cited here as D1–D10. Read the ADR first; this plan does not
repeat its reasons.\
**Branch:** create `feat/choice-and-auto-modes` from `main` after PR #368 (the
ADR and this plan) is merged. All phases go onto that one branch and one PR,
with one commit per phase.

This document is harness-agnostic. Claude Code, Antigravity, Codex or a human
can pick up the next unchecked phase without any other context.

## Goal

Add two opt-in learning modes:

- **Choice**: three options; the rating is derived from the chosen option.
- **Auto**: choice while a card is new, then free recall from the recall probe
  on.

The kernel also bounds every rating that rests on a tapped option — a choice,
or a tier-1 fast-check tap followed by a self-rating — so that it never
schedules beyond 20 days (D4).

## Status

- [x] **Phase 1** — answer format and the tap ceiling (kernel and every submit path) — `dad5d0e`
- [x] **Phase 2** — the two new modes in study settings (kernel and bridge) — `8cfb3e7`
- [x] **Phase 3** — choice presentation in the kernel (LLM-free) — `20f0daa`
- [x] **Phase 4** — generated options (the `text` role, reject filter, cache fill) — `5f0a014`
- [x] **Phase 5** — Desktop Studio — `1a99554`, fixes from the manual pass in `a33b1a8`
- [x] **Phase 6** — Mobile (iPadOS and Android) — `4451d55`; manual pass on the iPad (A16) simulator
- [x] **Phase 7** — documentation and handover — OKF `fsrs-scheduling.md` and `voice-mode.md`, conventions in `CLAUDE.md`/`AGENTS.md`, ADR status

**Order.**

- Phase 1 ships on its own: it already implements the owner decision on tier-1
  taps.
- Phases 2 and 3 are prerequisites for everything after them.
- Phases 5 and 6 need 2 and 3, but not 4: without generation they still work,
  using curated and derived options.
- Phases 4, 5 and 6 may run in parallel.

## Ground rules for every phase

Repository conventions from `CLAUDE.md` / `AGENTS.md` that this feature touches:

- **Kernel versus CLI.**
  - Learning logic lives in `src/kernel/`.
  - No HTTP or LLM calls in the kernel. Prompt text and model calls live in
    `src/cli/llm/` and `mobile/src/`.
  - The kernel receives generated options as data.
- **Schema changes** go into BOTH `src/kernel/db/schema.ts` (fresh databases)
  AND an idempotent numbered migration in `runMigrations`
  (`src/kernel/db/provision.ts`).
  - Increment `CURRENT_SCHEMA_VERSION`; `tests/kernel/provision.test.ts`
    guards it.
  - Migrations must run on SQLite and PostgreSQL — check with `npm run pg:test`.
  - Timestamps are ISO strings written by the kernel, not `datetime('now')`
    defaults.
- **Bridge.** `zam bridge` emits JSON only. `src/bridge/protocol.ts` changes are
  additive and optional; never rename or remove a field.
- **IDs** are ULIDs (`ulid()`).
- **No randomness in the kernel.**
  - Every selection and permutation is derived deterministically from the
    card id and its due date, as `presentFastCheck()` does in
    `src/kernel/scheduler/queue.ts`.
  - A re-render must never move an option under the learner's finger.
- **FSRS is the source of truth.**
  - `src/kernel/scheduler/fsrs.ts` gains helpers only; its scheduling output
    must not change.
  - `tests/kernel/fsrs.test.ts` stays green without edits.
- **i18n.**
  - New strings go into the `en` and `de` reference packs only:
    `desktop/src/i18n.ts` and `mobile/src/i18n.ts`.
  - Do not machine-fill `es/fr/pt/zh/ja`; the owner reviews those.
- **Commits** follow `<type>: <summary>` (`feat`, `fix`, `test`, `docs`,
  `refactor`, `chore`).
- **Verification** for each phase, before its commit:

  ```bash
  npm run typecheck
  ```

  ```bash
  npm run lint
  ```

  ```bash
  npm run test
  ```

  Schema phases add `npm run pg:test`; surface phases add `npm run build`.

## Shared vocabulary

| Name | Where | Value |
|---|---|---|
| `AnswerFormat` | `src/kernel/scheduler/choice-ceiling.ts` | `"recall" \| "options" \| "choice"` (D5) |
| `CHOICE_CEILING_DAYS` | same file | `20` |
| `MATURE_STABILITY_DAYS` | `src/kernel/analytics/stats.ts` | `21` (extracted from the two inline `stability >= 21` predicates) |
| `StudyLearningMode` | `src/kernel/scheduler/study-settings.ts` | adds `"choice"` and `"auto"` |
| `AutoRecallPin` | same file | `"answer" \| "flash" \| null` (`null` follows evaluator availability) |

Reference numbers come from the default FSRS-6 parameters, with each review
answered when due. They are reproduced in tests:

| Case | Expected |
|---|---|
| new card, correct choices | intervals 10 min → 2 d → 8 d → 20 d → 20 d; stability 2.31 → 2.31 → ≈8.0 → 20 → 20; difficulty 5.11 throughout |
| card S = 260, D = 4, correct choice | stability stays 260, next interval 20 d, difficulty stays 4 |
| new tier-1 card, `options` tap rated Easy | state review, stability 8.30, interval 8 d, difficulty 5.11 (plain FSRS: 1.00) |
| Auto, new card, all correct | choice, choice, choice; the 4th presentation (day 10) is the probe; a recall Good then schedules ≈26 → 74 → 189 d |
| Auto, probe missed | stability ≈1.2, difficulty ≈8.38; relearning stays in free recall: 10 min → 1 → 3 → 6 → 13 d |
| Auto, young card (S = 2.3) 30 days overdue | probed immediately |

`fsrs.initialDifficulty(2)` is 5.1122 and `(3)` is 2.1181.

---

## Phase 1 — answer format and the tap ceiling

Implements D4 and D5, and the owner decision that tier-1 taps in the answer
modes are bounded too. Everything after this phase records an answer format.

### Kernel

1. **`src/kernel/scheduler/fsrs.ts`.** Extend the `FSRS` interface with two
   pure helpers bound to the instance's resolved parameters:
   - `intervalDays(stability: number): number` — the existing private
     `nextInterval(...)` with this instance's retention and maximum.
   - `initialDifficulty(rating: Rating): number` — the existing private
     `initialDifficulty(w, rating)`.
2. **New `src/kernel/scheduler/choice-ceiling.ts`**, pure:
   ```ts
   export type AnswerFormat = "recall" | "options" | "choice";
   export const ANSWER_FORMATS: readonly AnswerFormat[];
   export const CHOICE_CEILING_DAYS = 20;
   export function isAnswerFormat(value: unknown): value is AnswerFormat;
   /** True for a successful rating that rests on a tapped option. */
   export function isTapBounded(format: AnswerFormat, rating: Rating): boolean;
   export function applyTapCeiling(
     fsrs: FSRS,
     previous: SchedulingCard,
     scheduled: SchedulingCard,
     now: Date,
   ): { card: SchedulingCard; ceilingApplied: boolean };
   ```
   The rules (D4):
   - `stability = min(scheduled.stability, max(C, previous.stability))`.
   - `difficulty` is `fsrs.initialDifficulty(2)` when `previous.state` is
     `"new"`, and `previous.difficulty` otherwise.
   - When `scheduled.state === "review"`:
     `days = fsrs.intervalDays(min(stability, C))`, `scheduledDays = days`,
     `dueAt = now + days`.
   - In `learning` or `relearning`, keep `scheduled`'s step, `scheduledDays`
     and `dueAt`.
   - `ceilingApplied` is true when the returned `dueAt` or `stability` is
     below `scheduled`'s.
3. **`src/kernel/recall/evaluator.ts`.**
   - `EvaluateInput.answerFormat?: AnswerFormat`, defaulting to `"recall"`.
   - After `fsrs.schedule(...)`, when `isTapBounded(format, rating)`, use
     `applyTapCeiling(...)`.
   - Write the adjusted card.
   - Insert `answer_format` into `review_logs`.
   - `EvaluateResult` gains `ceilingApplied: boolean`.
4. **`src/kernel/recall/actions.ts`.**
   - `ExecuteReviewActionInput` gains `answerFormat?: AnswerFormat` and
     `choiceEvidence?: ChoiceEvidence`. Declare the type in Phase 1 as an open
     record; Phase 3 fills it.
   - Pass `answerFormat` to the evaluation, and
     `evidence: { answerFormat, ...choiceEvidence }` to `recordAttempt`.
5. **Schema.**
   - Add `answer_format TEXT CHECK (answer_format IN ('recall', 'options', 'choice'))`
     to `review_logs` in `schema.ts`.
   - **M035** in `runMigrations` adds the same column when `columnsOf(db,
     "review_logs")` lacks it.
   - `CURRENT_SCHEMA_VERSION = 35`.
   - Old rows stay `NULL`, which counts as `recall` (D5).
6. **`src/kernel/analytics/stats.ts`.** Export `MATURE_STABILITY_DAYS = 21` and
   use it in both predicates.
7. **`src/kernel/index.ts`.** Export the new types, constants and functions.

### Submit paths

Every path that shows a tier-1 fast check must record `options`. Everything
else records `recall`.

8. **Bridge.**
   - `zam bridge submit` gains `--answer-format <recall|options|choice>`,
     validated with `isAnswerFormat` and defaulting to `recall`.
   - `SubmitReviewParams.answerFormat` in `src/cli/bridge-handlers.ts` is
     passed to `executeReviewAction`.
   - The MCP tool `zam_submit_review` (`src/cli/commands/mcp.ts`) gains an
     optional `answerFormat` (zod enum).
   - In `protocol.ts`, `SubmitReviewResult.evaluation.ceilingApplied?` is
     additive.
9. **Desktop study window.**
   - `desktop/src/study-card-actions.ts`: `SubmitRatingInput.answerFormat?`
     maps to `--answer-format`.
   - `desktop/src/main.ts`: the option buttons created in
     `renderFastCheckAnswer()` set the active card's answer format to
     `options`; `submitRating()` passes it on. Reset it for every new card.
10. **MCP Recall panel** (`desktop/src/panel/recall.ts`): the fast-check option
    path — the `card.fastCheck` branch near the `showReveal(text)` call — adds
    `answerFormat: "options"` to the `zam_submit_review` args.
11. **Mobile.**
    - `mobile/src/review-session.ts`: `rate(rating, { answerFormat })` passes it
      to `executeReviewAction`.
    - Persist the format in the session snapshot, so a restored session keeps
      it.
    - `mobile/src/main.ts`: the fast-check option buttons set `options`.
12. **Voice** (`src/kernel/recall/voice-review.ts`): widen the `mode` union to
    `StudyLearningMode`. Voice ratings are `recall`.

### Tests

- **`tests/kernel/choice-ceiling.test.ts`:** every row of the reference table
  that does not need Phase 3.
  - Learning steps keep their minutes.
  - A miss is an ordinary FSRS lapse.
  - `recall` ratings are byte-identical to plain FSRS.
- **Evaluator integration:** `review_logs.answer_format` is written, and
  `ceilingApplied` is reported.
- **Migrations:** `tests/kernel/provision.test.ts` covers the version constant;
  `tests/kernel/postgres-provision.test.ts` runs M035.
- **Invariant:** `CHOICE_CEILING_DAYS < MATURE_STABILITY_DAYS`.
- **Bridge:** `submit` rejects an unknown `--answer-format`.
- **Wiring** (`tests/desktop/*`, `tests/mobile/*`): each fast-check tap path
  submits `options`.

**Done when:**

- A tier-1 tap followed by Easy never schedules beyond 20 days.
- Flash and typed answers schedule exactly as before.
- A v34 library upgrades to v35 on SQLite and PostgreSQL.

---

## Phase 2 — the two new modes in study settings

Settings and bridge only. No surface offers the new modes until Phases 5 and 6;
a selectable mode without a working study view would strand the learner.

1. **`src/kernel/scheduler/study-settings.ts`.**
   - `StudyLearningMode` adds `"choice"` and `"auto"`. `STUDY_LEARNING_MODES`
     order: `flash`, `choice`, `answer_feedback`, `answer_variation`, `auto`.
   - `StudyLearningSettings` gains `autoRecallPin: AutoRecallPin`, default
     `null`, validated in `normalizeLearningSettings`.
   - An unset learner still defaults to Flash or the answer mode. Do not change
     `DEFAULT_STUDY_LEARNING_SETTINGS.learningMode`.
2. **Bridge** (`src/cli/commands/bridge.ts`).
   - `study-learning-get` and `study-learning-set` accept the new modes.
   - Add `--auto-recall-pin <answer|flash|none>` (`none` stores `null`).
   - Update the option help text and error messages.
3. **`desktop/src/study-learning-ui.ts`.**
   - Mirror the type.
   - Replace `flashSelected` / `aiSelected` in
     `resolveStudyLearningControlState` with `selectedMode`, and update callers
     and tests.
   - `acceptsTypedStudyAnswer(mode)` is false for `flash` and `choice`. For
     `auto` it takes the resolved card format (Phase 3), so give it an optional
     second parameter now.
4. **Tests:** `tests/kernel/study-settings.test.ts` (round trip, invalid values,
   pin normalisation); bridge handler tests.

**Done when:** both modes and the pin round-trip through the kernel and the
bridge. The UIs are unchanged.

---

## Phase 3 — choice presentation in the kernel

Everything a surface needs in order to show a choice, with no model involved:
suitability, curated options, derived options, the cached generated pool, the
deterministic checks, rotation, the Auto stage, disputes, counters and
retirement.

### Schema — M036, `CURRENT_SCHEMA_VERSION = 36`

```sql
CREATE TABLE IF NOT EXISTS choice_distractors (
  id              TEXT PRIMARY KEY,               -- ULID
  token_id        TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  source_hash     TEXT NOT NULL,                  -- item id + question + answer text (D6 cache key)
  source          TEXT NOT NULL CHECK (source IN ('curated', 'generated')),
  text            TEXT NOT NULL,
  reason          TEXT,                           -- one line: why it is wrong
  model           TEXT,
  filter_model    TEXT,
  filter_verdict  TEXT,                           -- JSON, kept for audit
  shown_count     INTEGER NOT NULL DEFAULT 0,
  chosen_count    INTEGER NOT NULL DEFAULT 0,
  retired_at      TEXT,
  retired_reason  TEXT CHECK (retired_reason IN ('disputed', 'unchosen', 'filter')),
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_choice_distractors_token
  ON choice_distractors(token_id, source_hash);

CREATE TABLE IF NOT EXISTS choice_exclusions (   -- personal: disputes of derived or curated options
  user_id       TEXT NOT NULL,
  token_id      TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  excluded_key  TEXT NOT NULL,                   -- 'donor:<tokenId>' | 'curated:<index>'
  created_at    TEXT NOT NULL,
  PRIMARY KEY (user_id, token_id, excluded_key)
);
```

**Team library** (added while implementing): classify both tables in
`src/cli/deploy/`.

- `choice_exclusions` is learning state under row-level security
  (`rls-policies.ts`).
- `choice_distractors` is a new **shared cache** class (`team-provision.ts`).
  Members may insert rows and update only `shown_count`, `chosen_count`,
  `retired_at` and `retired_reason`; curators write everything. Without this
  a member's choice rating fails with "permission denied".

Add both tables to the table list in `src/kernel/db/snapshot.ts`, after
`tokens`, and to the snapshot round-trip test.

- `choice_exclusions` is personal learning state.
- `choice_distractors` is a rebuildable cache, but restoring it keeps an
  offline iPad usable.

### Modules

1. **`src/kernel/recall/choice-checks.ts`**, pure (D6 deterministic checks).
   - `normalizeOption(text)`: case, whitespace, punctuation, Unicode
     normalisation.
   - `checkCandidate(correct, candidate, accepted)` returns a reject reason
     (`empty`, `equals_answer`, `contains_answer`, `duplicate`,
     `all_or_none`, `negated_answer`, `length_outlier`) or `null`.
     - The `all_or_none` patterns cover de and en ("alle", "keine der",
       "all of the above", "none of the above").
     - Length band: 0.5×–2× the correct answer's length, with a floor of ±8
       characters for short answers.
   - `checkShownSet(options, correctIndex)`: rejects a set where the correct
     option is the only one that is ≥40 % longer or shorter than every
     distractor, or the only one containing parentheses.
2. **`src/kernel/recall/choice-options.ts`.**
   - `isChoiceSuitable({ bloomLevel, concept, hasAnswerMedia })`: Bloom ≤ 3,
     `countAnswerPoints(concept) === 1` (`src/kernel/library/answer-points.ts`),
     and no answer media (D9).
   - `choiceSourceHash(token)`: a hash of the token id, question and concept.
   - Generated and curated pool: `listActiveDistractors(db, tokenId,
     sourceHash)`; `storeDistractors(db, { tokenId, sourceHash, source,
     entries, model, filterModel })`.
   - `deriveDistractors(db, { userId, token, knowledgeContext })` (D6, source
     2). **Donors** are tokens:
     - for which this learner has a card with `last_review_at IS NOT NULL`
       — never an item the learner has not met;
     - in the same domain, and in `knowledgeContext` when the session is
       filtered by context (`token_contexts`);
     - published, not deprecated, and themselves suitable.

     **Excluded:** the same `atom_id`, the same sibling group (see
     `sibling_group` in `src/kernel/scheduler/queue.ts`), candidates failing
     `checkCandidate`, and this learner's `choice_exclusions`.

     **Ranking:** cosine similarity of stored embeddings when both tokens have
     one under the same model (`getTokenEmbedding` in
     `src/kernel/models/token-embedding.ts`, `cosineSimilarity` in
     `src/kernel/search/hybrid.ts`). Otherwise character-trigram similarity
     plus length closeness.

     Keep the top 4. **Derived options are computed per call and never
     stored:** they depend on the learner.
   - The fast-check contract: `ReviewFastCheck.type` becomes
     `"binary_choice" | "multiple_choice"`.
     - `parseReviewFastCheck` accepts `multiple_choice` with 3–4 options, and
       `binary_choice` with 2.
     - `presentFastCheck` is unchanged.
     - `src/kernel/library/kvt-attach.ts` validation accepts both types.
     - Mirror the union in `src/bridge/protocol.ts`.
   - Tiles may carry `choice_distractors: [{ text, reason }]` on a practice
     item; `installKvtTile` stores them as `source = 'curated'` rows. They are
     presentation data: no `content_version` bump.
3. **`src/kernel/recall/answer-presentation.ts`.**
   ```ts
   export type RecallReason =
     | "mode" | "unsuitable" | "no_options" | "probe" | "recall_stage" | "curated_disputed";
   export interface PresentedChoice {
     options: string[];
     correctIndex: number;
     entries: Array<{
       source: "correct" | "curated" | "derived" | "generated";
       distractorId?: string;   // choice_distractors row
       donorTokenId?: string;   // derived
       reason?: string | null;  // contrast line; derived → the donor's question
     }>;
   }
   export type AnswerPresentation =
     | { format: "choice"; choice: PresentedChoice }
     | { format: "recall"; reason: RecallReason };
   export async function resolveAnswerPresentation(db, input: {
     userId: string; cardId: string; mode: StudyLearningMode;
     now?: Date; knowledgeContext?: string;
   }): Promise<AnswerPresentation>;
   ```
   The decision, in this order:
   1. Mode `flash` or `answer_*` → `recall/mode`. Surfaces keep today's
      fast-check handling in the answer modes.
   2. Not suitable → `recall/unsuitable`.
   3. **Auto only**, the D8 stage:
      - The card is in the recall stage when any review log row for it has
        `answer_format = 'recall'` or `NULL` → `recall/recall_stage`.
      - Otherwise probe when `card.stability >= C` or
        `fsrs.schedule(card, 3, now).stability >= C` → `recall/probe`.
   4. **Options:**
      - A `fast_check` wins, with its authored options. For a binary check
        with an excluded option → `recall/curated_disputed`.
      - Otherwise the pool is the active curated or generated distractors
        plus the derived candidates.
      - Fewer than 2 usable distractors → `recall/no_options`.
   5. **Presentation:**
      - Choose 2 distractors and a permutation deterministically, seeded on
        `cardId + dueAt`. Factor the hash out of `presentFastCheck` into a
        shared helper; do not duplicate it.
      - Run `checkShownSet`. Try the next combination if it fails, and fall
        back to `recall/no_options` if none passes.
4. **Rating a choice** (`src/kernel/recall/actions.ts`, inside the existing rate
   transaction):
   - `ChoiceEvidence = { options, correctIndex, chosen: number | "dont_know",
     entries, disputed?: boolean }`.
   - **Enforce consistency:** chosen correct or disputed → rating 3;
     otherwise 1. Reject mismatches. A dispute keeps `answer_format =
     'choice'` (D7).
   - **Counters:** increment `shown_count` on the generated or curated rows
     shown, and `chosen_count` on the chosen one.
   - **Retirement (D6):**
     - `shown_count >= 30` and `chosen_count / shown_count < 0.05` →
       `retired_reason = 'unchosen'`.
     - A dispute of a stored row → `'disputed'`.
     - A dispute of a derived option → `choice_exclusions` `donor:<id>`.
     - A dispute of a curated `fast_check` option → `curated:<index>`; the
       curator sees it in the attempt evidence.
5. **Bridge.**
   - `zam bridge answer-presentation --card-id <id> --mode <choice|auto>
     [--knowledge-context <name>]` returns `AnswerPresentation` as JSON.
   - `zam bridge submit --choice-evidence <json>` is required with
     `--answer-format choice`.
   - Add both to `protocol.ts`.

### Tests (`tests/kernel/choice-*.test.ts`)

- **Suitability** at the Bloom, point and media boundaries.
- **Checks:** every reject reason, and the cue check on shown sets.
- **Derived donors:**
  - an unmet item never appears;
  - context scoping;
  - atom and sibling exclusion;
  - `choice_exclusions` respected;
  - embedding ranking before trigram ranking.
- **Rotation:** the same card and due date give the same set; a different due
  date may change it; no randomness.
- **Auto stage:** the reference rows (probe at the 4th presentation, sticky
  recall stage after a missed probe, overdue probe), and existing cards with
  `NULL` history in the recall stage.
- **Disputes and retirement:** each path and its exact writes.
- **Migration:** M036 on SQLite and PostgreSQL; snapshot round trip.

**Done when:** the bridge returns a correct presentation for curated, derived
and cached options, and the correct recall reason in every other case.

---

## Phase 4 — generated options

1. **New `src/cli/llm/choice-prompt.ts`**, pure with no Node built-ins, so that
   Mobile can import it like the pure modules under `src/cli/curriculum/`.
   - `buildChoiceGenerationPrompt(item)` returns `{ system, user }`.
     - Write in the **item's** language, not the UI locale.
     - Ask for 4–6 candidates of the same category, grammar and length band,
       each plausible (typical misconceptions) and unambiguously wrong, with no
       "all/none of the above" and no negation of the answer.
     - One-line reason each. JSON array output.
   - `parseChoiceGeneration(text)` returns `Array<{ text, reason }>`. Tolerate
     fences and surrounding prose; return `[]` on garbage.
   - `buildChoiceFilterPrompt({ question, options })`: the options arrive
     already shuffled, deterministically in code, from the question text. The
     prompt asks which options correctly answer the question and expects a
     JSON index list.
   - `parseChoiceFilter(text)` returns the indices.
   - `runChoiceGeneration({ item, complete, completeFilter })`: generate →
     `checkCandidate` (kernel) → shuffle → filter → drop every candidate the
     filter calls correct. It returns accepted and rejected candidates with
     reasons and the filter verdict. `complete` and `completeFilter` are
     injected `(system, user) => Promise<string>`.
2. **CLI** (`src/cli/llm/client.ts`).
   - Two thin transports:
     - **Generation** resolves its endpoint through the `text` role exactly as
       `generateSplitProposalsViaLLM` does, including the agent transport.
     - **Filtering** uses the `recall` role when its model differs from the
       `text` model, and the `text` role otherwise (D6).
   - Store the results with `storeDistractors(... source 'generated',
     model, filterModel)`, including the verdict.
3. **Bridge:** `zam bridge choice-prepare [--limit <n>] [--card-id <id>]`.
   - Walks the next queue cards (or the named card).
   - For each suitable card without a usable pool, it runs the generation.
   - Returns `{ prepared, skipped, failed: [{ cardId, error }] }`.
   - One failing item never fails the command.
4. **Mobile.** New `mobile/src/choice-generate.ts`.
   - Resolve the capability `text` with `resolveAiCapabilityTier`
     (`src/kernel/ai/tier-preference.ts`), following the patterns in
     `mobile/src/evaluate.ts`.
   - `device-only` without an on-device text model → no generation. That
     degradation is accepted (D6).
   - Call `runChoiceGeneration` through `generateViaHttp`, and store via the
     kernel.
   - *As built:* Mobile has one cloud text chain and no separate recall row,
     so its filter runs on the same chain. The shared orchestration is
     `src/cli/llm/choice-prepare.ts` (`prepareChoiceOptionsForCards`), used by
     both the bridge and `mobile/src/choice-generate.ts`.
5. **Prefetch contract.** Generation never blocks a displayed card: a card
   without options is asked in a recall format (D6).
   - Desktop runs `choice-prepare --limit 3` in the background at session
     start and after each rating.
   - Mobile does the same for the next three queue items.
   - Each prepared item costs two model calls; log both.

### Tests

- Prompt builders are deterministic.
- Parsers handle fences, prose and garbage.
- `runChoiceGeneration` with fake completions:
  - duplicates, answer-containing, length-outlier and filter-marked-correct
    candidates are rejected;
  - the filter input order differs from the generation order and is
    deterministic.
- `choice-prepare` with a stub provider. Follow the provider stubs in
  `tests/cli/llm-providers.test.ts`.
- The Mobile generator with a stubbed `fetch` and a `device-only`
  preference.

---

## Phase 5 — Desktop Studio

1. **Modes.**
   - Offer `choice` and `auto` in the native Settings (`desktop/index.html`
     `#settings-learning-mode`, `desktop/src/main.ts`) and in the Settings panel
     (`desktop/src/panel/settings.ts`).
   - Add the Auto pin control, "Später ohne Tippen" / "Later without typing",
     visible only while Auto is selected.
   - Studio's in-session switcher (`#study-mode-switcher`) gets four radio
     segments: ⚡ Flash · 🔘 Auswahl · 💬 KI · 🔄 Auto.
   - Generalise `studyLearningElements()` and `switchStudyLearningMode()` to
     `StudyLearningMode`. Keep the radio-group keyboard behaviour.
2. **The card flow in choice and auto.**
   - After the card is fetched and admitted, call `answer-presentation`.
   - **`choice`:**
     - Render the options with the same button style as the fast check —
       generalise `renderFastCheckAnswer` — plus "Weiß ich nicht" / "Don't
       know".
     - Keys `1`–`3` pick an option only while the options are visible. They
       must not collide with the rating shortcuts, which are active only after
       a reveal.
   - **On a pick:** mark the chosen option and the correct one, show the
     contrast line (the entry's `reason`, or for a derived option "Das
     beantwortet: <Frage>" / "This answers: <question>") and the reference
     answer.
     - **Correct:** auto-advance after about 1.2 s, with a visible "Weiter" /
       "Next".
     - **Wrong or "Don't know":** the card waits. Offer "Nachfragen" / "Ask"
       (opens the chat with the starter "Was ist der Unterschied?" / "What's the
       difference?"), "Meine Antwort stimmt auch" / "My answer is also
       correct", and "Weiter" / "Next".
   - **Submit** on Next or auto-advance with `--answer-format choice
     --choice-evidence …` and the derived rating. Keep the idle-aware
     response time (ADR 2026-09-15).
   - **`recall` result:**
     - In plain Choice, run the Flash flow and show a short notice for the
       reason.
     - In Auto, run the answer mode when an evaluator is available and the pin
       is not `flash`; otherwise run Flash. For the `probe` reason, show the
       badge "Jetzt ohne Auswahl" / "Now without options".
3. **The follow-up chat.**
   - Extend `DiscussionCardContext` (`desktop/src/discussion.ts`) with
     `choice?: { options, chosen, correct }`; `buildDiscussReviewArgs` adds
     `--choice-json`.
   - `zam bridge discuss-review` forwards it to `discussReviewViaLLM`
     (`src/cli/llm/client.ts`).
   - The card frame lists the options, the choice and the solution. When the
     rating was derived, guideline 4 (self-rating) is replaced by "the rating
     was derived from the choice; do not discuss it".
4. **Session summary.**
   - In plain Choice, count the ratings whose evaluation reported
     `ceilingApplied`, and show "N Karten sind bereit für freien Abruf" /
     "N cards are ready for free recall", with one action to switch to Auto.
   - The summary never interrupts the session.
5. **Prefetch** as in Phase 4, only in `choice` or `auto` and only with a
   configured model.
6. **i18n** (`en`, `de`):
   - mode labels;
   - the pin;
   - "Don't know";
   - "Next";
   - "Ask";
   - the chat starter;
   - the dispute button;
   - the "Now without options" badge;
   - one notice per recall reason;
   - the summary line.

### Tests

- Pure-logic tests for the new `study-learning-ui` state.
- Wiring tests in the style of `tests/desktop/learning-mode-wiring.test.ts`:
  - four switcher segments;
  - `answer-presentation` is called;
  - `--answer-format choice` with evidence;
  - the tap paths still send `options`.
- A discussion args test.
- `tests/desktop/i18n-completeness.test.ts` stays green.

**Manual check:** build, run the Studio, and take one card through each of these
paths:

- choice correct;
- choice wrong → chat → dispute;
- "Don't know";
- no options → Flash notice;
- Auto probe → answer mode, and → Flash with the pin set.

---

## Phase 6 — Mobile (iPadOS and Android)

1. **Modes.** Add the Settings select entries and the pin control in
   `mobile/src/main.ts` and `mobile/index.html`. The segmented
   `#review-mode-switcher` gets four segments; `renderReviewModeSwitcher`
   handles every mode.
2. **`mobile/src/review-session.ts`.**
   - Resolve `resolveAnswerPresentation` (kernel, in the WebView) in
     `admitCurrent()`, and keep it in the persisted snapshot so a restored
     session shows the same options.
   - `rate()` passes `answerFormat` and `choiceEvidence`.
3. **UI.** The same behaviour as Desktop (Phase 5, step 2) with large touch
   targets. The chat uses `mobile/src/discuss.ts`, whose prompt frame gains the
   choice lines.
4. **Generation prefetch** via `mobile/src/choice-generate.ts` (Phase 4). It
   never blocks the displayed card.
5. **Voice.** In `choice` and `auto` the voice controller keeps its Flash loop
   and records `recall`. Spoken choices come later.
6. **i18n:** the same keys in `mobile/src/i18n.ts` (`de`, `en`).

### Tests

- `tests/mobile/review-session.test.ts`: presentation persisted and restored,
  rating consistency, evidence written.
- `tests/mobile/dom-contract.test.ts`: the four segments and the option
  controls.
- `tests/mobile/settings-simplicity.test.ts` stays green.

**Manual check:** the iPad simulator, and an Android emulator if available,
with the same card paths as Phase 5.

*As built:* the presentation is resolved when a card is rendered
(`MobileReviewSession.presentCurrent(mode)`) rather than in `admitCurrent()`,
because the mode can change mid-card; it is stored in the snapshot per card
and mode, and an answered card keeps it. The Studio's session summary line
("N cards are ready for free recall") is not on Mobile yet. "Ask" appears when
a cloud text model is connected.

---

## Phase 7 — documentation and handover

1. **OKF.** Update `docs/okf/fsrs-scheduling.md` **through the
   `zam_okf_upsert` MCP tool**; never edit bundle files by hand.
   - Replace "These preferences change how a surface gathers evidence, never
     the FSRS calculation" with the answer-format rule.
   - Add a section "Choice evidence and the tap ceiling", citing the ADR.
   - Update `docs/okf/voice-mode.md` if its mode list changes.
2. **Conventions.** Add one line to both `CLAUDE.md` and `AGENTS.md` under Key
   conventions:
   > Every rating submit declares its `answer_format`: `recall`, `options` for
   > a tapped fast check followed by a self-rating, or `choice` for a rating
   > derived from the chosen option. The kernel's tap ceiling depends on it.
3. **ADR status.** Set the ADR to `Implemented`, or `Partially implemented`
   with a delivery note, and update its row in `docs/adr/README.md`.
4. **This plan.** Mark each phase with its commit hash. Delete the plan before
   the release that ships the feature, unless open tasks remain.

## Deliberately not in this plan

Each needs its own decision or data first:

- Choice in the MCP Recall panel, `zam learn` and agent harnesses (D10).
- Spoken choices in voice mode.
- Retiring distractors that stronger learners choose disproportionately (D6).
  This needs shared-library data.
- Curated distractors for the bundled curriculum cells. That is a content
  task: use a strong model with review, not the cheapest one.
- Auto as the default for new learners (D1, Alternatives).
- Calibrating `CHOICE_CEILING_DAYS` and the probe point from review logs
  (Falsification).

## Pitfalls

- **Team libraries.** A member connection runs no DDL (ADR 2026-09-04 Decision
  8), so members see "update required" until the owner's client migrates. Say
  so in the release notes of the release that ships M035 and M036.
- **Privacy.** Derived options must never land in the shared cache: they are
  built from one learner's history.
- **Mobile imports.** `choice-prompt.ts` is imported by Mobile. A Node built-in
  there breaks the WebView bundle.
- **Tier-1 cards reschedule.** Once Phase 1 is live, tier-1 cards answered by a
  tap return within 20 days. That is intended (owner decision), not a
  regression.
- **Keyboard shortcuts.** The rating keys `1`–`4` are active only after a
  reveal. Option keys must not leak into ratings.
