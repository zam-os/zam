---
type: algorithm
title: FSRS-6 Scheduling
description: ZAM schedules reviews with a deterministic FSRS-6 kernel, persisted same-day learning steps, per-learner workload controls, and sibling-aware queues and burial.
tags:
  - kernel
  - fsrs
  - scheduling
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"
timestamp: 2026-09-06T19:08:40.000Z
---

ZAM's spaced repetition uses **FSRS-6** (Free Spaced Repetition Scheduler,
version 6), implemented as pure functions in
`src/kernel/scheduler/fsrs.ts`. Scheduling has no database, network, AI, or
random operations: the same card, rating, time, and parameters produce the same
result on every surface.

A review takes a **rating** on a four-point scale: `1` Again (forgot),
`2` Hard, `3` Good, or `4` Easy. Each card carries per-user FSRS state:
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
and state transitions.

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
card and cursor, runs FSRS scheduling, updates the card, appends an immutable
row to `review_logs`, and applies enabled sibling burial. Rating is separate
from prerequisite blocking: `evaluateRating()` does not itself block or
unblock cards (see [prerequisite-blocking.md](prerequisite-blocking.md)).

Interactive surfaces normally call `executeReviewAction()` in
`src/kernel/recall/actions.ts`. Its `rate` action owns one database
transaction around FSRS evaluation, sibling burial, an optional rating-1
prerequisite cascade, and optional session auditing. When a `sessionId` is
supplied, the review-log row references that session and a matching user
`session_steps` row is written with the rating. A failure in any write rolls
back the card update, review log, burial, blocking changes, and session step.
The session must exist and belong to the learner; it may already be
completed, because confirmed synthesis candidates arrive after
`zam_session_end`. Only published, non-deprecated tokens take a rating.

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

# Review queue and workload

`src/kernel/scheduler/queue.ts` assembles eligible due and new cards, sorts
overdue work by urgency, interleaves domains, and inserts new cards regularly.
Due Learning and Relearning cards use the same timestamp comparison as Review
cards, including minute-level due times. The queue excludes blocked, detached,
actively buried, deprecated, maintenance, and unpublished cards; a knowledge
context can narrow it further. The due list behind `check-due` and
`get-reviews` applies the same published and non-deprecated filter.

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
`flash`, `answer_feedback`, or the scaffolded `answer_variation`, plus
bounded voice reveal and rating timeouts. These preferences change how a
surface gathers evidence, never the FSRS calculation. A contextual default may
depend on evaluator availability, but it is not persisted by a read and cannot
override an explicit learner choice.

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
without scheduling or logging the card. The selected German or English rating
still enters the shared kernel through `executeReviewAction()`, so voice,
typing, tap, and click interactions persist the same FSRS-6, burial, and
short-step state. See [voice-mode.md](voice-mode.md) for speech-engine and
platform behavior.

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
});
```

# Central learning-path queue behavior

Published practice items may belong to a language-neutral learning atom and
carry a presentation tier. The field-test rule is named `tier1-first`: a new
`tier2_synthesis` card stays out while the same atom still has an unseen
`tier1_fast` card. A valid `binary_choice` `fast_check` is normalized by
the queue and rendered as a one-tap choice; malformed optional metadata falls
back to the ordinary question instead of breaking the queue.

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
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [Field-test slice plan](../plans/2026-08-15-central-learning-field-test-slice.md)
- Tests: `tests/kernel/precondition-assessment.test.ts`, `tests/kernel/pull-forward.test.ts`, `tests/kernel/tier-interaction-bonus.test.ts`, `tests/cli/bridge-handlers.test.ts`, `tests/mobile/review-session.test.ts`
- Code: `src/kernel/library/precondition-assessment.ts`, `src/kernel/library/pull-forward.ts`, `src/kernel/scheduler/queue.ts`, `src/cli/bridge-handlers.ts`, `desktop/src/panel/recall.ts`, `desktop/src/main.ts`, `mobile/src/review-session.ts`, `mobile/src/main.ts`

- [ADR 2026-05-30a — Standalone Learning Session](../adr/2026-05-30a-standalone-learning-session.md)
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- [ADR 2026-07-31 — Cross-Platform Voice Mode](../adr/2026-07-31-cross-platform-voice-mode.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Flashcard learning-mode plan](../plans/2026-09-03-flashcard-learning-mode.md)
- [Anki Manual — Deck Options](https://docs.ankiweb.net/deck-options.html)
- [Anki Manual — Studying](https://docs.ankiweb.net/studying.html)
- Tests: `tests/kernel/fsrs.test.ts`, `tests/kernel/rich-anki-scheduling.test.ts`, `tests/kernel/study-settings.test.ts`, `tests/mobile/voice.test.ts`, `tests/integration/token-card-review.test.ts`, `tests/kernel/provision.test.ts`, `tests/kernel/snapshot.test.ts`
- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/scheduler/study-settings.ts`, `src/kernel/scheduler/siblings.ts`, `src/kernel/recall/evaluator.ts`, `src/kernel/recall/actions.ts`, `src/kernel/recall/voice-review.ts`, `src/kernel/models/card.ts`, `src/kernel/db/schema.ts`, `src/kernel/db/provision.ts`, `src/kernel/db/snapshot.ts`, `desktop/src/main.ts`, `mobile/src/main.ts`
- Algorithm reference: <https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm>
