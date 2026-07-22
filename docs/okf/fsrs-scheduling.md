---
type: algorithm
title: FSRS-5 Scheduling
description: ZAM schedules reviews with a pure-function FSRS-5 implementation; ratings 1-4 update stability and difficulty, and the FSRS test suite is the source of truth for scheduling behavior.
tags:
  - kernel
  - fsrs
  - scheduling
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"
timestamp: 2026-07-22T04:24:00Z
---

ZAM's spaced repetition uses **FSRS-5** (Free Spaced Repetition Scheduler,
v5), implemented as pure functions in `src/kernel/scheduler/fsrs.ts`.

A review takes a **rating** on a four-point scale: `1` Again (forgot),
`2` Hard, `3` Good, `4` Easy. Each card carries FSRS state per user:
**stability** (expected recall half-life in days), **difficulty** (1–10),
elapsed/scheduled days, repetition and lapse counts, a **state** of
`new`, `learning`, `review`, or `relearning`, and the next due date.

`evaluateRating()` in `src/kernel/recall/evaluator.ts` applies a rating: it
runs FSRS scheduling, updates the card, and appends an immutable entry to
`review_logs`. Rating is deliberately separate from prerequisite blocking —
`evaluateRating()` never blocks or unblocks anything (see
[prerequisite-blocking.md](prerequisite-blocking.md)).

Interactive surfaces normally call `executeReviewAction()` in
`src/kernel/recall/actions.ts`. Its `rate` action owns one database
transaction around FSRS evaluation, an optional rating-1 prerequisite cascade,
and optional session auditing. When a `sessionId` is supplied, the review-log
row references that session and a matching user `session_steps` row is written
with the rating. A failure in any of those writes rolls back the card update,
review log, blocking changes, and session step together.

# Review queue

`src/kernel/scheduler/queue.ts` builds each session's queue from due cards
plus new cards: it interleaves cards by domain (so one topic doesn't
monopolize a session) and inserts new cards at every 5th position.

# Examples

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
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- Tests as source of truth for scheduling semantics: `tests/kernel/fsrs.test.ts`
- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/evaluator.ts`, `src/kernel/recall/actions.ts`
- Algorithm reference: <https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm>
