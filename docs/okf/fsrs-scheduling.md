---
type: algorithm
title: FSRS-5 Scheduling
description: ZAM schedules reviews with a pure-function FSRS-5 implementation; ratings 1-4 update stability and difficulty, and the FSRS test suite is the source of truth for scheduling behavior.
tags:
  - kernel
  - fsrs
  - scheduling
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"
timestamp: 2026-07-31T08:10:00Z
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

Published learning content has a substance version. A curator classifies
each revision as `cosmetic` or `material`: cosmetic publication leaves
scheduling untouched; material publication increments the token's
`content_version` and makes cards learned against an older version due
now. Stability, difficulty, repetitions, and lapses are deliberately kept
so the next real answer re-tests the change instead of resetting history.
After that answer, `evaluateRating()` synchronizes the card's
`learned_content_version`; queue items expose the change and publisher
provenance so the recall surface can explain why the card returned.

# Review queue

`src/kernel/scheduler/queue.ts` builds each session's queue from eligible
due cards plus new cards. It excludes blocked or learner-detached cards and
tokens that are deprecated, in maintenance, or not in the `published`
editorial state; an active knowledge context can narrow the set further.
The remaining cards are interleaved by domain (so one topic doesn't
monopolize a session), with a new card inserted at every 5th position.

# Voice review

The Android companion and the macOS/Windows desktop app can operate the same
review session hands-free. One shared controller speaks the existing template
question, captures a spoken answer, speaks the expected answer or an
evaluation, and maps German or English rating words to ratings 1-4. The
transcript is persisted as the current session draft; the selected rating still
enters the shared kernel through the same review-session controller and
`executeReviewAction()`. Typing and tap/click ratings remain available
throughout.

Whether the speech itself stays on the device depends on the learner's
preference and on what the device can do. On Android it is always on-device:
recognition uses the on-device recognizer and synthesis selects only installed
voices that need no network connection. A microphone/media-playback foreground
service, partial wake lock, and audio-focus handling keep an explicitly started
voice session usable with the screen off and pause it across transient focus
loss. See [voice-mode.md](voice-mode.md) for the engine tiering and the
per-platform detail.

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
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- [ADR 2026-07-31 — Cross-Platform Voice Mode](../adr/2026-07-31-cross-platform-voice-mode.md)
- Tests as source of truth for scheduling semantics: `tests/kernel/fsrs.test.ts`, `tests/kernel/library-revision.test.ts`, `tests/kernel/card-detach.test.ts`
- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/evaluator.ts`, `src/kernel/recall/actions.ts`, `src/kernel/recall/voice-review.ts`, `src/kernel/library/revision.ts`, `src/kernel/models/card.ts`, `mobile/src/review-session.ts`, `mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt`
- Algorithm reference: <https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm>
