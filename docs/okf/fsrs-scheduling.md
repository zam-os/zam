---
type: algorithm
title: FSRS-6 Scheduling
description: ZAM schedules reviews with a deterministic FSRS-6 kernel, persisted same-day learning steps, a 20-day ceiling for tapped answers, per-learner workload controls, and sibling-aware queues and burial.
tags:
  - kernel
  - fsrs
  - scheduling
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"
timestamp: 2026-09-29T10:00:00.000Z
---

ZAM's spaced repetition uses **FSRS-6** (Free Spaced Repetition Scheduler,
version 6), implemented as pure functions in
`src/kernel/scheduler/fsrs.ts`. Scheduling has no database, network, AI, or
random operations: the same card, rating, time, and parameters produce the same
result on every surface.

A review takes a **rating** on a four-point scale, and the scale is binary
before it is graded: `1` Again records a recall that **failed** — missed
outright or only partly there — while `2` Hard, `3` Good, and `4` Easy all
record a recall that **succeeded** and differ only in how much effort it cost.
Studio, the Recall panel, and Mobile render that as two labelled groups
rather than four peers, so a learner who half-remembered a card reaches for
Again instead of Hard; the `zam learn`/`zam review` choice list names the same
split in its option labels, and `reconcileRecallSuggestedRating()` holds the
evaluator to it by rewriting any partial or incorrect verdict to `1`. The
spoken voice prompt still offers the four names as a flat list.
Each card carries per-user FSRS state:
**stability** (the interval in days at which recall reaches 90%),
**difficulty** (1–10), elapsed/scheduled days, repetition and lapse counts, a
state of `new`, `learning`, `review`, or `relearning`, a nullable
zero-based `learning_step`, its last-review and next-due timestamps, and
optional temporary burial fields.

# Parameters and memory updates

The default scheduler uses the official 21 FSRS-6 weights, 90% requested
retention, a 36,500-day maximum long-term interval, learning steps at 1 and 10
minutes, and one relearning step at 10 minutes. Custom weights must contain
exactly 21 finite numbers. Retention, step sequences, and the interval cap are
validated when `createFSRS()` is constructed, then the resolved parameters
and arrays are frozen.

FSRS-6 makes the forgetting curve's decay trainable through `w20`; long-term
intervals are whole days. Reviews less than one day after the prior answer use
the FSRS-6 short-term stability update through `w17`–`w19`. Short steps
store fractional `scheduled_days` values and exact `due_at` timestamps, so
they are not clamped to the one-day minimum used by long-term reviews.
`tests/kernel/fsrs.test.ts` pins the default vector, long-term and same-day
formulas, difficulty damping and mean reversion, lapse bounds, interval caps,
and state transitions. The instance also exposes two pure helpers bound to its
resolved parameters, `intervalDays(stability)` and
`initialDifficulty(rating)`; they add no scheduling behavior of their own.

# Learning and relearning steps

A new card rated Again enters Learning step 0 and is due in 1 minute. Hard stays
on step 0 and is due in 5.5 minutes, the midpoint of the two default steps.
Good advances to step 1 and is due in 10 minutes. Easy graduates directly to
Review and receives its long-term FSRS interval.

While Learning, Again returns to step 0, Hard repeats the current step, Good
advances or graduates after the final step, and Easy graduates immediately.
Again on a Review card enters Relearning step 0 and is due in 10 minutes. With
the single default relearning step, Hard repeats it after 15 minutes and Good
or Easy returns the card to Review.

Migration M020 adds the nullable `cards.learning_step` cursor. Existing
Learning or Relearning cards receive `NULL`; on their next successful answer
they graduate instead of replaying a newly introduced step sequence. Portable
snapshots retain the cursor, so an in-progress same-day sequence resumes after
restart or restore.

# Rating transaction

`evaluateRating()` in `src/kernel/recall/evaluator.ts` loads the persisted
card and cursor, runs FSRS scheduling, applies the tap ceiling where the
answer format calls for it, updates the card, appends an immutable row to
`review_logs`, and applies enabled sibling burial. Rating is separate from
prerequisite blocking: `evaluateRating()` does not itself block or unblock
cards (see [prerequisite-blocking.md](prerequisite-blocking.md)).

Interactive surfaces normally call `executeReviewAction()` in
`src/kernel/recall/actions.ts`. Its `rate` action owns one database
transaction around FSRS evaluation, sibling burial, an optional rating-1
prerequisite cascade, choice bookkeeping, and optional session auditing. When a
`sessionId` is supplied, the review-log row references that session and a
matching user `session_steps` row is written with the rating. A failure in any
write rolls back the card update, review log, burial, blocking changes, choice
counters, and session step. The session must exist and belong to the learner;
it may already be completed, because confirmed synthesis candidates arrive
after `zam_session_end`. Only published, non-deprecated tokens take a rating.

A rating may carry the attempt id that admission handed out when the card
was shown. The same attempt never writes a second review: a retried submit
returns `applied: false`, a different rating for the same attempt is
refused, and an id issued for another learner or card is rejected. A
same-day learning step is a new attempt — re-admitting a card whose previous
attempt was rated hands out a fresh id.

Published learning content has a substance version. A cosmetic publication
leaves scheduling untouched. A material publication increments the token's
`content_version` and makes cards learned against an older version due now
while preserving stability, difficulty, repetitions, lapses, and the active
step cursor. After the answer, `evaluateRating()` synchronizes the card's
`learned_content_version`.

# Answer format and the tap ceiling

Every rating declares **how** the card was answered, stored in
`review_logs.answer_format` (migration M035):

- `recall` — the learner produced the answer (Flash, typed, spoken) and rated
  it or had it evaluated;
- `options` — the learner tapped an authored fast-check option and then rated
  themselves;
- `choice` — the rating was derived from the option the learner chose.

`NULL` is history from before M035 and counts as `recall`. Surfaces pass the
format to `executeReviewAction()` (bridge `submit --answer-format`, MCP
`zam_submit_review` `answerFormat`); anything that does not say so is `recall`.

Recognising an answer among options is weaker evidence than producing it, so a
**successful** rating (`2`–`4`) with format `options` or `choice` passes
through `applyTapCeiling()` in `src/kernel/scheduler/choice-ceiling.ts`, with
`CHOICE_CEILING_DAYS = 20`:

- stored stability is `min(S_fsrs, max(20, S_previous))` — taps build
  stability up to 20 days and never erode stability that free recall earned;
- in Review, the next interval is `intervalDays(min(stability, 20))`, so a tap
  never books more than 20 days ahead; learning and relearning steps keep
  their minute intervals;
- a new card's difficulty is `initialDifficulty(2)` (5.11) whatever the
  rating, and later taps leave difficulty unchanged — a tap cannot make a card
  look easy.

A miss (`1`) is an ordinary FSRS lapse, and `recall` ratings are unchanged
FSRS. With default parameters, a new card answered correctly by choice each
time it is due runs 10 minutes → 2 → 8 → 20 → 20 days. The evaluation reports
`ceilingApplied` when the ceiling shortened the result. Because
`CHOICE_CEILING_DAYS` is below `MATURE_STABILITY_DAYS` (21, the maturity line
in `src/kernel/analytics/stats.ts`), a card answered only by taps never counts
as mature.

# Choice and Auto presentation

The `choice` and `auto` learning modes ask a card as a choice of three
options. `resolveAnswerPresentation()` in
`src/kernel/recall/answer-presentation.ts` decides, without any model, whether
a card is shown as a choice or in a recall format, and why:

1. Answers up to Bloom level 3 without answer media are suitable;
   `choiceUnsuitability()` names the rule that excludes the rest
   (`bloom_level` or `answer_media`), and the presentation carries it as
   `detail` so a surface can say why. The number of answer points does not
   matter: many items predate the one-point authoring rule.
2. In `auto`, a card is in the **recall stage** once any of its review-log
   rows is `recall` or `NULL`, and stays there. Before that, the review at
   which a correct choice would bring stability to 20 days (the card already
   holds 20, or a Good would reach it) is the **recall probe** and is asked
   freely — with default parameters the fourth presentation, on day 10. The
   free-recall format is an AI-evaluated answer when an evaluator is available
   and the learner has not pinned `flash` ("later without typing").
3. Options come from the first source that yields enough usable distractors:
   the item's authored `fast_check` (binary, or 3–4 options), curated
   `choice_distractors` rows shipped with a tile, answers of other items the
   learner has already met in the same domain and knowledge context (derived
   per learner, ranked by stored embeddings or text similarity, never
   stored), then cached generated options.
4. Every candidate passes the deterministic checks in
   `src/kernel/recall/choice-checks.ts` (empty, equal to or containing the
   answer, duplicate, all/none of the above, negated answer, named in the
   question, outside the length band), and the shown set is rejected when its
   form gives the answer away (a length or parenthesis cue).
5. Which distractors are shown and their order are seeded by card id and due
   date: a re-render never moves an option under the learner's finger.

The rating follows from the pick: the correct option, or a disputed one
("my answer is also correct"), earns `3`; a wrong option or "Don't know" earns
`1`. `executeReviewAction()` refuses a choice rating that contradicts its
evidence, stores the evidence with the attempt, counts exposures and picks of
cached options, retires a generated option picked in fewer than 5% of at
least 30 showings, retires a disputed generated option for everyone, and
excludes a disputed curated or derived option for that learner only
(`choice_exclusions`, migration M036).

Generated options are written by the CLI (`zam bridge choice-prepare`) or
Mobile, never by the kernel: a `text`-role model writes candidates with a
reason each, the same checks run, and a reject filter answering from a
seeded, shuffled set drops every candidate it considers correct. Each call
walks on to the next model of its role's chain when a row refuses it — a
keyless OpenRouter row passes the readiness check, because the model
catalogue is public, and fails only at the call. Surfaces prepare the next
cards in the background; a card whose options are not ready is asked in a
recall format.

# Review queue and workload

`src/kernel/scheduler/queue.ts` assembles eligible due and new cards, sorts
overdue work by urgency, interleaves domains, and inserts new cards regularly.
Due Learning and Relearning cards use the same timestamp comparison as Review
cards, including minute-level due times. The queue excludes blocked, detached,
actively buried, deprecated, maintenance, and unpublished cards; a knowledge
context can narrow it further. The due list behind `check-due` and
`get-reviews` applies the same published and non-deprecated filter, and the
desktop dashboard's startup due digest reads the same eligibility source:
`getDueSummary()` in `src/kernel/models/card.ts` aggregates it into the
`desktop-bootstrap` payload instead of issuing a separate `check-due`
request.

At most one distinct practice item of a learning atom is shown to a learner
on one local learning day. Every surface — Studio, Mobile, the Recall panel,
`zam learn`, `zam review`, `zam session`, and agents through
`zam_admit_review` — admits a card immediately before display, and the queue
hides the other items of an atom that already has a presentation that day.
A queue prefetch is not an exposure. Due dates are compared as UTC instants
regardless of the learner's zone.

Each learner has persisted workload settings. The balanced default allows 10
new cards within 50 total cards and buries both new and review siblings. The
exam preset raises those limits to 40 and 200 and keeps siblings visible. The
problems preset uses 5 and 30 with both burial switches enabled. Learners can
customize both bounded limits and each burial switch in Desktop or standalone
Mobile settings; CLI and bridge sessions read the same values. Explicit kernel
queue options remain available for automation. Limits are applied after
sibling filtering, so a suppressed sibling does not consume a daily slot.

The same settings module stores a separate per-learner interaction object:
`flash`, `choice`, `answer_feedback`, the scaffolded `answer_variation`, or
`auto`, Auto's recall pin (`answer`, `flash`, or unset), and bounded voice
reveal and rating timeouts. A mode changes how a surface gathers evidence;
the evidence's answer format — not the mode — decides whether the tap ceiling
applies. A contextual default may depend on evaluator availability, but it is
not persisted by a read and cannot override an explicit learner choice.

# Sibling-aware study

Cards imported from the same Anki note share its stable note GUID as a sibling
group. When burial is enabled for a card's bucket, only the first eligible
sibling is placed in a queue. After a rating, other eligible sibling cards for
that learner are marked with `buried_reason = 'sibling'` until the next local
calendar day. New- and Review-state burial can be controlled independently.

Learning and Relearning siblings are never buried: an active short-step
sequence must stay available on the same day. The just-rated card clears any
old burial of its own. Learners can explicitly unbury all sibling cards from
Desktop, Mobile, or the bridge `study-unbury` command. The
`study-workload-get` and `study-workload-set` commands expose the same
per-learner settings as JSON-only bridge operations.

# Voice review

Android, iOS, macOS, and Windows use the same kernel review path for hands-free
sessions. In answer modes the shared controller captures an answer before
presenting or speaking the expected answer/evaluation. In Flash mode it
captures only reveal/stop/rating commands and never treats silence as evidence:
a reveal timeout shows the answer, while a rating timeout pauses the session
without scheduling or logging the card. In the `choice` and `auto` modes voice
runs the Flash loop; there are no spoken choices yet, so a spoken rating is a
`recall` rating. The selected German or English rating still enters the shared
kernel through `executeReviewAction()`, so voice, typing, tap, and click
interactions persist the same FSRS-6, burial, and short-step state. See
[voice-mode.md](voice-mode.md) for speech-engine and platform behavior.

# Example

```ts
import { executeReviewAction } from "zam-core";

await executeReviewAction(db, {
  action: "rate",
  cardId,
  tokenId,
  userId,
  rating: 3,
  sessionId,
  responseTimeMs: 1250,
  answerFormat: "recall",
});
```

# Central learning-path queue behavior

Published practice items may belong to a language-neutral learning atom and
carry a presentation tier. The field-test rule is named `tier1-first`: a new
`tier2_synthesis` card stays out while the same atom still has an unseen
`tier1_fast` card. A valid `fast_check` — `binary_choice` with two options or
`multiple_choice` with three or four — is normalized by the queue and rendered
as a one-tap choice in the answer modes; the tap is recorded as `options`, so
the self-rating that follows is bounded by the tap ceiling. Malformed optional
metadata falls back to the ordinary question instead of breaking the queue.

A learner may self-assess only an atom that is a **hard**
precondition of one of that learner's live, published cards. Globally installed
content is not enough. Choosing “already know this” buries every live,
unretrieved card for that atom with reason `precondition`. It changes no FSRS
field and writes no review log. The pilot horizon is 21 days plus four days per
other active deferred atom. Active replays are idempotent; an expired claim
cannot be extended, and any real retrieval evidence prevents self-assessment.
When the date arrives, the unchanged new card is eligible for genuine recall.

“Keep going” is also explicit. New cards beyond the normal `maxNew` limit
receive a session-local admission budget; their stored due date is not
rewritten. A selected future review can be moved to now. Pulling an active
precondition clears its burial date and writes the FSRS-neutral reason
`precondition_ready`; this preserves the explicit choice across restarts,
prevents a second assessment prompt, and is cleared by the genuine review.
Expired deferrals, detached or unpublished content, and unrelated buried cards
are not pull-forward candidates. Native Desktop tracks both total and new-card
limits across repeated bridge reads; Mobile and MCP Recall take bounded queue
snapshots with the same workload and tier rules.

# Citations
- [ADR 2026-09-27 — Choice and Auto Learning Modes](../adr/2026-09-27-choice-and-auto-learning-modes.md)
- Tests: `tests/kernel/choice-ceiling.test.ts`, `tests/kernel/choice-presentation.test.ts`, `tests/cli/choice-generation.test.ts`, `tests/cli/llm-evaluation-retry.test.ts`, `tests/cli/recall-panel-learning-mode.test.ts`, `tests/desktop/answer-format-wiring.test.ts`, `tests/desktop/choice-mode-wiring.test.ts`, `tests/mobile/choice-mode-wiring.test.ts`, `tests/mobile/review-session.test.ts`
- Code: `src/kernel/scheduler/choice-ceiling.ts`, `src/kernel/recall/answer-presentation.ts`, `src/kernel/recall/choice-options.ts`, `src/kernel/recall/choice-checks.ts`, `src/kernel/util/seeded.ts`, `src/cli/llm/choice-prompt.ts`, `src/cli/llm/choice-prepare.ts`, `mobile/src/choice-generate.ts`, `mobile/src/review-session.ts`

- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [Field-test slice plan](../plans/2026-08-15-central-learning-field-test-slice.md)
- Tests: `tests/kernel/precondition-assessment.test.ts`, `tests/kernel/pull-forward.test.ts`, `tests/kernel/tier-interaction-bonus.test.ts`, `tests/cli/bridge-handlers.test.ts`, `tests/mobile/review-session.test.ts`
- Code: `src/kernel/library/precondition-assessment.ts`, `src/kernel/library/pull-forward.ts`, `src/kernel/scheduler/queue.ts`, `src/cli/bridge-handlers.ts`, `desktop/src/panel/recall.ts`, `desktop/src/main.ts`, `mobile/src/review-session.ts`, `mobile/src/main.ts`

- [ADR 2026-09-08 — Answer Points and Score-Based Rating](../adr/2026-09-08-answer-points-and-score-based-rating.md)
- [ADR 2026-05-30a — Standalone Learning Session](../adr/2026-05-30a-standalone-learning-session.md)
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- [ADR 2026-07-31 — Cross-Platform Voice Mode](../adr/2026-07-31-cross-platform-voice-mode.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Flashcard quality contract — PR #321](https://github.com/zam-os/zam/pull/321)
- [Anki Manual — Deck Options](https://docs.ankiweb.net/deck-options.html)
- [Anki Manual — Studying](https://docs.ankiweb.net/studying.html)
- Tests: `tests/kernel/fsrs.test.ts`, `tests/kernel/rich-anki-scheduling.test.ts`, `tests/kernel/study-settings.test.ts`, `tests/kernel/answer-points.test.ts`, `tests/kernel/publication.test.ts`, `tests/desktop/answer-points-surfaces.test.ts`, `tests/desktop/rating-recall-split.test.ts`, `tests/mobile/dom-contract.test.ts`, `tests/mobile/voice.test.ts`, `tests/integration/token-card-review.test.ts`, `tests/kernel/provision.test.ts`, `tests/kernel/snapshot.test.ts`
- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/scheduler/study-settings.ts`, `src/kernel/scheduler/siblings.ts`, `src/kernel/recall/evaluator.ts`, `src/kernel/recall/actions.ts`, `src/kernel/recall/voice-review.ts`, `src/cli/review-actions.ts`, `src/cli/llm/client.ts`, `skills/zam/SKILL.md`, `src/kernel/library/answer-points.ts`, `src/kernel/library/publication.ts`, `desktop/src/panel/recall-evaluation.ts`, `src/kernel/models/card.ts`, `src/kernel/analytics/stats.ts`, `src/kernel/db/schema.ts`, `src/kernel/db/provision.ts`, `src/kernel/db/snapshot.ts`, `desktop/src/main.ts`, `mobile/src/main.ts`
- Algorithm reference: <https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm>
