# Increment 13: Kernel Polish and Performance

Status: planned

## Problem

A full codebase review identified several performance bottlenecks, correctness
edge cases, and missing ergonomic features that accumulate as the system grows.
None are blockers individually, but together they degrade the experience:
N+1 queries in hot paths, silent data overwrites, and missing provenance
tracking for LLM-generated content.

## Goal

Address the highest-impact polish items discovered during the code review:
fix N+1 query patterns, protect manual edits from LLM overwrites, add
question-source provenance, improve interleaving performance, and batch-load
observation patterns. Each item is independent and can be merged separately.

## Items

### 1. N+1 queries in `unblockReady()`

**File:** `src/kernel/scheduler/blocker.ts:116-161`

Currently iterates over every blocked card and runs two separate queries per
card (totalPrereqs + metPrereqs). With 50 blocked cards that is 100 DB calls.

**Fix:** Replace the per-card loop with a single JOIN query that returns all
blocked cards along with their prerequisite counts in one pass.

### 2. N+1 queries in `prepareSessionSynthesis()`

**File:** `src/kernel/observation/session-synthesis.ts:198-205`

`buildSkillPatterns()` itself is in-memory only (no DB calls). The N+1 is in
`prepareSessionSynthesis()` which calls `getTokenBySlug()` per pattern in a
loop (line 201). Should batch-load all tokens in one query.

**Fix:** Collect all unique token slugs from the merged patterns first, then
run a single `SELECT * FROM tokens WHERE slug IN (...)` query, and build the
pattern map from the result.

### 3. Question-source provenance (`question_source`)

**File:** `src/kernel/models/token.ts`, `src/kernel/db/schema.ts`,
`src/cli/llm/client.ts`

`ensureHighQualityQuestion()` silently overwrites manually authored questions
with LLM-generated ones. There is no way to distinguish a human-written
question from an LLM-generated one.

**Fix:**
- Add `question_source TEXT NOT NULL DEFAULT 'manual'` column to the `tokens`
  table (migration M007). Valid values: `'manual'`, `'llm'`, `'template'`.
- `createToken()` and `updateToken()` accept an optional `question_source`.
- `ensureHighQualityQuestion()` only overwrites when `question_source !== 'manual'`.
- `generateQuestionViaLLM()` sets `question_source = 'llm'` when persisting.

### 4. `interleave()` performance

**File:** `src/kernel/scheduler/interleaver.ts:66-128`

The current implementation re-sorts `activeDomains` in every iteration and
breaks after the first pick. For small queues (50–100 items) this is fine, but
the pattern is O(n²) in the worst case.

**Fix:** Replace the inner loop with a priority-queue approach: maintain a
min-heap of (domain, remaining-count) and pick from the domain with the most
remaining items that does not violate `maxConsecutive`. This brings the
complexity to O(n log n).

### 5. Review-context caching

**File:** `src/kernel/recall/reference-resolver.ts`

`resolveReviewContext()` fetches the same URL on every review round. A simple
in-memory TTL cache (5 minutes) would eliminate redundant HTTP requests during
a single session.

**Fix:** Add a module-level `Map<string, { context: ReviewContext; expiresAt: number }>`
cache with a configurable TTL. `resolveReviewContext()` checks the cache
before fetching. Cache is keyed by the normalized `sourceLink`.

### 6. Goal-engine async migration

**File:** `src/kernel/goals/engine.ts`

Uses `readFileSync`, `writeFileSync`, `readdirSync` — blocking the event loop.
Inconsistent with the async `Database` interface used everywhere else.

**Fix:** Convert all file operations to their `fs/promises` equivalents
(`readFile`, `writeFile`, `readdir`). Update function signatures to return
`Promise<...>`. Update callers in `src/cli/commands/goal.ts`.

### 7. Incremental snapshot deltas

**File:** `src/kernel/db/snapshot.ts`

The current snapshot system always exports the full database. For large
databases synced over slow connections, this is wasteful.

**Fix:** Add `exportSnapshotDelta(db, since)` that only exports rows modified
after a given timestamp. Requires adding `updated_at` columns to tables that
lack them (currently only `tokens` and `agent_skills` have them). The delta
snapshot format uses the same SQL-text approach but includes only INSERT
statements for changed rows and DELETE statements for removed rows.

### ~~8. Dynamic import of `@inquirer/prompts`~~ — withdrawn

The dynamic `await import()` in `src/cli/llm/client.ts` is **intentional**: it
keeps `@inquirer/prompts` out of the non-interactive bridge/headless path (the
bridge daemon runs non-TTY). A static top-level import would always load
inquirer, even in the daemon — a regression for startup and path isolation.
No change needed.

## Evidence (files to modify)

- `src/kernel/scheduler/blocker.ts` — item 1
- `src/kernel/observation/session-synthesis.ts` — item 2 (prepareSessionSynthesis)
- `src/kernel/models/token.ts` — item 3
- `src/kernel/db/schema.ts` — item 3
- `src/kernel/db/connection.ts` — item 3 (migration M007)
- `src/cli/llm/client.ts` — item 3
- `src/kernel/scheduler/interleaver.ts` — item 4
- `src/kernel/recall/reference-resolver.ts` — item 5
- `src/kernel/goals/engine.ts` — item 6
- `src/cli/commands/goal.ts` — item 6
- `src/kernel/db/snapshot.ts` — item 7

## Tests

Each item should have a corresponding test:

- `tests/kernel/blocker.test.ts` — verify unblockReady() with multiple blocked cards
- `tests/kernel/session-synthesis.test.ts` — verify prepareSessionSynthesis() batching
- `tests/kernel/token.test.ts` — verify question_source field
- `tests/kernel/interleaver.test.ts` — verify performance with large inputs
- `tests/kernel/reference-resolver.test.ts` — verify cache behavior
- `tests/kernel/goals.test.ts` — verify async goal operations
- `tests/kernel/snapshot.test.ts` — verify delta snapshots

## Promotes (ideas folded in)

- `learning/question-source-provenance` (item 3)
- `operations/incremental-snapshots` (item 7)

## Open decisions

- **Item 4 (interleave):** Should we implement a custom min-heap or use a
  sorted-array approach? For the typical queue size (50–100 items), a simple
  sorted array may be faster than a heap due to cache locality.
- **Item 5 (cache TTL):** Should the TTL be configurable via settings or
  hardcoded at 5 minutes? Configurable adds complexity for a feature that
  rarely needs tuning.
- **Item 7 (delta snapshots):** Should deltas be cumulative (each delta is
  self-contained) or incremental (each delta depends on the previous one)?
  Cumulative is simpler but larger; incremental is smaller but requires a
  chain of deltas for restore.
