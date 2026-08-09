---
type: algorithm
title: FSRS-6 Scheduling
description: ZAM schedules reviews with a deterministic FSRS-6 kernel, persisted same-day learning and relearning steps, and one shared rating path across every review surface.
tags:
  - kernel
  - fsrs
  - scheduling
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"
timestamp: 2026-08-09T05:50:28Z
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
zero-based `learning_step`, and its last-review and next-due timestamps.

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
`tests/kernel/fsrs.test.ts` pins the default vector, the long-term and
same-day formulas, difficulty damping and mean reversion, lapse bounds,
interval caps, and state transitions.

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
database snapshots include the cursor automatically with the rest of each card,
so an in-progress same-day sequence resumes after restart or restore.

# Rating transaction

`evaluateRating()` in `src/kernel/recall/evaluator.ts` loads the persisted
card and cursor, runs FSRS scheduling, updates the card, and appends an immutable
row to `review_logs`. Rating is separate from prerequisite blocking:
`evaluateRating()` does not block or unblock cards (see
[prerequisite-blocking.md](prerequisite-blocking.md)).

Interactive surfaces normally call `executeReviewAction()` in
`src/kernel/recall/actions.ts`. Its `rate` action owns one database
transaction around FSRS evaluation, an optional rating-1 prerequisite cascade,
and optional session auditing. When a `sessionId` is supplied, the review-log
row references that session and a matching user `session_steps` row is written
with the rating. A failure in any write rolls back the card update, review log,
blocking changes, and session step together.

Published learning content has a substance version. A cosmetic publication
leaves scheduling untouched. A material publication increments the token's
`content_version` and makes cards learned against an older version due now
while preserving stability, difficulty, repetitions, lapses, and the active
step cursor. After the answer, `evaluateRating()` synchronizes the card's
`learned_content_version`.

# Review queue

`src/kernel/scheduler/queue.ts` builds each session's queue from eligible due
cards plus new cards. Due Learning and Relearning cards enter through the same
timestamp comparison as Review cards, including minute-level due times. The
queue excludes blocked or learner-detached cards and tokens that are deprecated,
in maintenance, or not in the `published` editorial state; an active
knowledge context can narrow the set further. Remaining due cards are
interleaved by domain, with a new card inserted at every fifth position.

# Voice review

Android, iOS, macOS, and Windows use the same kernel review path for hands-free
sessions. The shared controller speaks the question, captures an answer,
presents or speaks the expected answer/evaluation, and maps German or English
rating words to ratings 1–4. The selected rating still enters the shared kernel
through `executeReviewAction()`, so voice, typing, tap, and click interactions
all persist the same FSRS-6 and short-step state. See
[voice-mode.md](voice-mode.md) for speech-engine and platform behavior.

# Example

```ts
import { executeReviewAction } from "zam-core";

await executeReviewAction(db, {
  action: "rate",
  cardId,
  userId,
  rating: 3,
  sessionId,
  responseTimeMs: 1250,
});
```

# Citations

- [ADR 2026-05-30a — Standalone Learning Session](../adr/2026-05-30a-standalone-learning-session.md)
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- [ADR 2026-07-31 — Cross-Platform Voice Mode](../adr/2026-07-31-cross-platform-voice-mode.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- Tests as source of truth for scheduling semantics: `tests/kernel/fsrs.test.ts`, `tests/integration/token-card-review.test.ts`, `tests/kernel/provision.test.ts`, `tests/kernel/snapshot.test.ts`, `tests/kernel/library-revision.test.ts`, `tests/kernel/card-detach.test.ts`
- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/evaluator.ts`, `src/kernel/recall/actions.ts`, `src/kernel/recall/voice-review.ts`, `src/kernel/models/card.ts`, `src/kernel/db/schema.ts`, `src/kernel/db/provision.ts`, `src/kernel/db/snapshot.ts`, `mobile/src/review-session.ts`
- Algorithm reference: <https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm>
