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

Response time is wall-clock, so a card left open measures the pause, not the
work — see Decision 7 for the cap that keeps this honest.

### 3. Aggregation on-the-fly, in SQL, over the existing index

Buckets are computed with `GROUP BY` over `idx_review_logs_user (user_id,
reviewed_at)` using SQLite date functions — no aggregate table, no migration.
The review log is small enough that a range scan plus one pass is
well below interactive thresholds, and it keeps one truth instead of a cache
that can drift. If a future client needs unbounded history, an incremental
`daily_stats` table can be added behind the same kernel API; the ADR-to-code
boundary (a single `getReviewActivity` query) makes that a local change.

### 4. Stored UTC, bucketed in the learner's local time; weeks are ISO weeks

`reviewed_at` stays UTC. "Per day/week/month" is bucketed with SQLite
`date(reviewed_at, 'localtime')` for days, `strftime('%G-W%V', ...)` for weeks,
and `strftime('%Y-%m', ...)` for months. `%G-W%V` is the ISO 8601 week-year/week
pair: weeks start on Monday, week 1 is the week containing the year's first
Thursday, and early-January days label with the previous ISO year
(2027-01-01 → `2026-W53`, 2025-12-29 → `2026-W01`). Buckets are reported as
local-time bucket starts. The optional `window` bound is cut on the same local
calendar (`date(reviewed_at, 'localtime')` against the current local period
start), so "last N buckets" means exactly N local periods — never an
approximation derived from UTC day spans.

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

### 6. One kernel API, every client

`getReviewActivity(db, userId, { period, window?, since? })` lives in
`src/kernel/analytics/` and is re-exported from `src/kernel/index.ts`. It is
exposed as:

- `zam stats --period day|week|month` (text and `--json`),
- `zam bridge stats-activity` (JSON, for the desktop app and automation),
- the MCP tool `zam_progress_stats` (any connected client),
- the desktop app's Statistics view (over the bridge), and
- the mobile companion's Statistics view on Android and iOS, which calls the
  kernel function directly and therefore also works offline.

The window counts **periods, not days** — `--period week --window 12` is the
current ISO week plus the eleven before it — so the option is named `window`
on every surface rather than `days`.

Bucket keys (`2026-08-01`, `2026-W31`, `2026-08`) are the machine-facing
contract and stay verbatim in the CLI and every JSON payload. The GUIs render
them in the learner's language via `formatActivityBucketLabel`, shared by
desktop and mobile so a bar reads the same on every device.

### 7. Study time is capped per rating at read time

A rating's response time is wall-clock between "card shown" and "rating
submitted". A locked phone, a companion resuming its persisted session the next
morning, or a terminal abandoned mid-prompt therefore books hours against a
single card and swamps the number the learner came to see.

`review_logs` keeps the raw measurement — it is an immutable audit trail, and
the raw value is the only thing that could ever support a different analysis.
The **interpretation** is capped: `getReviewActivity` clamps each rating into
`[0, STUDY_TIME_CAP_MS]` (ten minutes) before summing. Capping at read time
rather than at write time also repairs rows written before the cap existed,
including the mobile rows that already carry resumed-session outliers.

Ten minutes is well past an honest single-card answer, including a slow cloud
evaluation and a spoken response. If real work is ever clipped by it, the fix
is a per-surface idle timeout on the measurement, not a larger cap.

## Consequences

- `response_time_ms` becomes meaningful on all surfaces; the existing column
  needs no schema change and no migration.
- Historical study time before this release is NULL and excluded; counts are
  unaffected. Surfaces render an unmeasured bucket as "—", never as "0s".
- The desktop app gains a dedicated Statistics view rendered from
  `zam bridge stats-activity`; the mobile companion gains the same view over a
  direct kernel call. No new npm or native dependencies on either.
- Study time is a floor, not an exact total: capped outliers and unlogged
  history both pull it down. It answers "am I putting the hours in", not
  billing.
- Non-decisions for now: distinct-card counts (vs. events), an aggregate
  table, session wall-clock time as a primary metric, and export — all can be
  layered on the same API without revisiting this ADR's choices.

## Citations

- Kernel statistics: `src/kernel/analytics/stats.ts` (`getUserStats`).
- Review log schema: `src/kernel/db/schema.ts` (`review_logs`).
- Activity series and the cap: `src/kernel/analytics/progress.ts`.
- Mobile response-time logging: `mobile/src/review-session.ts`.
- Mobile statistics view: `mobile/src/stats.ts`.
