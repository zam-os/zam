# Learning Progress Statistics: Reviews per Day/Week/Month and Study Time

**Status:** Accepted

**Supersedes nothing.** Extends the `zam stats` dashboard (kernel
`src/kernel/analytics/stats.ts`) with an activity series — cards reviewed per
day/week/month and study time — and closes the logging gap that would otherwise
make "study time" unanswerable.

## Context

Learners want to see that ZAM is working: how many cards they worked through per
day, per week, per month, and how much time they actually spent learning. Today
`zam stats` answers "where am I" (deck size, due, maturity, retention) but not
"what have I been doing".

What is already logged:

- `review_logs` is an immutable per-rating audit trail: `reviewed_at` (UTC),
  `rating`, optional `response_time_ms`, `session_id`, indexed on
  `(user_id, reviewed_at)`. Card counts per time bucket are derivable today.
- `sessions` carries wall-clock start/end for work sessions, but only the CLI
  `zam session` flow and agent sessions populate it; the desktop recall card
  never opens one.

The gap: **study time is effectively unlogged outside mobile.** Only the mobile
companion sends `response_time_ms` (mobile/src/review-session.ts). The desktop
recall card submits ratings through the MCP tool `zam_submit_review`, whose
schema does not even accept a response time, and the CLI `zam review` flow
measures nothing. Without closing this, any "learning time" statistic would be
silently incomplete and wrong on the two surfaces the feature is built for.

Because `response_time_ms` is NULL for every past desktop/CLI review, historical
study time is not reconstructible. This is accepted: **counts are complete from
day one; study time starts counting from the release that closes the logging
gap.**

## Decisions

### 1. `review_logs` is the single source of truth; one rating = one card worked

The activity series is computed from `review_logs` only. Each rating event
counts as one worked card — a card reviewed twice in a day counts twice, because
the learner worked it twice. No new write path, no duplicate bookkeeping, and
every existing row is already correct.

### 2. Study time = sum of per-card response time

"Lernzeit" is the sum of `response_time_ms` over the same events: the time the
learner actually spent producing each answer. It is the metric every surface can
measure identically (card shown → rating submitted), it already exists on mobile,
and it does not depend on session bookkeeping. Session wall-clock duration stays
a separate, secondary signal owned by the sessions feature and is not folded
into this statistic.

### 3. Aggregation on-the-fly, in SQL, over the existing index

Buckets are computed with `GROUP BY` over `idx_review_logs_user (user_id,
reviewed_at)` using SQLite date functions — no aggregate table, no migration.
The review log is small enough that a range scan plus one pass is
well below interactive thresholds, and it keeps one truth instead of a cache
that can drift. If a future client needs unbounded history, an incremental
`daily_stats` table can be added behind the same kernel API; the ADR-to-code
boundary (a single `getReviewActivity` query) makes that a local change.

### 4. Stored UTC, bucketed in the learner's local time; weeks start on Monday

`reviewed_at` stays UTC. "Per day/week/month" is bucketed with SQLite
`date(reviewed_at, 'localtime')` / `strftime('%Y-%W', ...)`, so a Monday-evening
review lands on the right day for the learner. ISO weeks (Monday start) are the
week definition. Buckets are reported as local-time bucket starts.

### 5. Every surface measures response time the same way: card shown → rating submitted

- **Desktop recall card** (`desktop/src/panel/recall.ts`) records a timestamp
  when a card is displayed and sends `responseTimeMs` with
  `zam_submit_review`.
- **CLI `zam review`** (`src/cli/review-actions.ts`) measures between prompt
  display and the rating keystroke.
- **MCP `zam_submit_review`** and **`zam bridge submit`** accept an optional
  `responseTimeMs` and pass it through to the kernel — the kernel already
  persists it (`review_logs.response_time_ms`).
- Mobile already does this and needs no change.

Measurement is best-effort: a client that cannot produce a time sends `null`
and the row simply does not contribute to study time.

### 6. One kernel API, three surfaces, ready for more

`getReviewActivity(db, userId, { period, since? })` lives in
`src/kernel/analytics/` and is re-exported from `src/kernel/index.ts`. It is
exposed as:

- `zam stats --period day|week|month` (text and `--json`),
- `zam bridge stats-activity` (JSON, for the desktop app and automation),
- the MCP tool `zam_progress_stats` (any connected client).

Because the data lives in the shared database, any other client (mobile, a
future web UI) can render the same numbers once it has a UI — this is the
feature's "other clients later" guarantee.

## Consequences

- `response_time_ms` becomes meaningful on all surfaces; the existing column
  needs no schema change and no migration.
- Historical study time before this release is NULL and excluded; counts are
  unaffected.
- The desktop app gains a dedicated stats view (panel) rendered from
  `zam bridge stats-activity`; no new npm or native dependencies.
- Non-decisions for now: distinct-card counts (vs. events), an aggregate
  table, session wall-clock time as a primary metric, and export — all can be
  layered on the same API without revisiting this ADR's choices.

## Citations

- Kernel statistics: `src/kernel/analytics/stats.ts` (`getUserStats`).
- Review log schema: `src/kernel/db/schema.ts` (`review_logs`).
- Mobile response-time logging: `mobile/src/review-session.ts`.
