# Idle-Aware Study Time and Immediate Busy After Rating

**Status:** Accepted — 2026-09-15\
**Date:** 2026-09-15\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-08-01](2026-08-01-learning-progress-stats.md) ·
[2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md)

---

## Context

Study time is the sum of `review_logs.response_time_ms` (ADR 2026-08-01).
That ADR asked every surface to measure wall-clock from "card shown" to
"rating submitted", with a ten-minute cap applied at read time so an
abandoned card cannot swamp the statistic.

Two field problems followed:

1. **Desktop Studio never sent a time.** The MCP Recall card and mobile
   companion do; `zam bridge submit` from the study view did not pass
   `--response-time-ms`. Those ratings land as NULL and show as "—" in
   Statistics, so a normal Studio session often has no learning time at
   all.
2. **Wall-clock is the wrong estimator once the learner is distracted.**
   A minute of thinking is real work. Five minutes with the window open
   while something else is happening is not. Follow-up questions with the
   in-card tutor *are* learning, but a hung model or a walk-away during a
   reply is not worth unbounded minutes.

Separately, after a rating the study UI stayed on screen until submit and
the next-card load finished. The buttons looked unpressed. Nobody needs
the rated card during that wait — least of all when the next question is
an AI generation.

## Decisions

### 1. Every Studio/Recall rating stores a number

The study view and the MCP Recall card always send `responseTimeMs` as a
non-negative integer. A clock that was never started still submits `0`.
NULL remains the historical "never measured" value; new rows from these
surfaces are never NULL.

### 2. Active time, not wall-clock, with a one-minute idle grace

While a card is on screen, learner reactions (pointer down, key, typing)
reset an idle watcher. A gap of up to **one minute** still counts —
reading, thinking, looking back at the question. A longer gap books only
that grace period and **pauses** until the next reaction. The clock does
not keep ticking in the background after the pause; the next click or
key starts it again.

This is the write-side idle timeout ADR 2026-08-01 Decision 7 said to
prefer over raising the ten-minute read cap.

### 3. System waits count; each follow-up is capped at two minutes

Time spent waiting for AI evaluation is learning time: the learner
submitted an answer and is waiting for tutoring. Idle does not pause
during that busy window.

A **follow-up turn** (send → reply) also counts, but at most **two
minutes**. Longer stretches are a hung model or a distraction. After the
reply, the one-minute idle watcher applies again — reading without
scrolling or typing for many minutes is the same walk-away as before
reveal.

The ten-minute `STUDY_TIME_CAP_MS` stays as a read-time backstop.

### 4. Hide the rated card immediately; show a busy indicator

Choosing a rating (click or 1–4) hides the reveal/rating UI at once and
shows the existing bouncing-dot loader with a short status
("Saving your rating…", then "Loading the next card…"). The same overlay
covers AI evaluation and dynamic-question generation so a wait is
visible rather than a frozen card. On submit failure the rated card
comes back so the learner can retry.

The MCP Recall card follows the same rule: no next-due dwell after a
rating. If that rating blocked the card (unmet prerequisites), the
busy overlay still shows `recall_blocked_notice` so the learner sees
why it vanished.

## Consequences

- Desktop study sessions start contributing to Statistics the moment this
  ships. Historical Studio rows stay NULL.
- Study time is still a floor: paused idle, the two-minute follow-up cap,
  and the ten-minute read cap all pull it down versus wall-clock.
- Mobile and CLI keep wall-clock until they grow an idle watcher; the
  kernel clock is shared so they can switch without a new policy.
- The next-due flash after a rating is gone on purpose. A blocked-card
  notice is not: Recall still surfaces it on the overlay.

## Citations

- Activity series and the read-time cap: `src/kernel/analytics/progress.ts`.
- Idle-aware clock: `src/kernel/analytics/learning-clock.ts`.
- Studio study view: `desktop/src/main.ts`.
- MCP Recall card: `desktop/src/panel/recall.ts`.
