# Kernel Polish and Performance

**Status:** Implemented (items 1–2 shipped 2026-07-08 with v0.9.3; item 3
shipped 2026-07-08 for v0.10.0 — revised, see item note; item 5 had already
shipped with v0.5.2; items 4, 6, 7 rejected 2026-07-08 — see item notes)
**Deciders:** Thomas (project owner)

---

## Context

A full codebase review identified several performance bottlenecks, correctness edge cases, and missing ergonomic features that accumulate as the system grows. None are blockers individually, but together they degrade the experience: N+1 queries in hot paths, silent data overwrites, and missing provenance tracking for LLM-generated content.

## Goal

Address the highest-impact polish items discovered during the code review: fix N+1 query patterns, protect manual edits from LLM overwrites, add question-source provenance, improve interleaving performance, and batch-load observation patterns. Each item is independent and can be merged separately.

## Decisions

### 1. N+1 queries in `unblockReady()`
Replace the per-card loop with a single JOIN query that returns all blocked cards along with their prerequisite counts in one pass.

### 2. N+1 queries in `prepareSessionSynthesis()`
Collect all unique token slugs from the merged patterns first, then run a single `SELECT * FROM tokens WHERE slug IN (...)` query, and build the pattern map from the result.

### 3. Question-source provenance (`question_source`)
- Add `question_source TEXT NOT NULL DEFAULT 'manual'` column to the `tokens` table (next free migration slot — M007–M012 have since been taken by other features). Valid values: `'manual'`, `'llm'`, `'template'`.
- `createToken()` and `updateToken()` accept an optional `question_source`.
- `ensureHighQualityQuestion()` only overwrites when `question_source !== 'manual'`.
- `generateQuestionViaLLM()` sets `question_source = 'llm'` when persisting.

*Implemented 2026-07-08 for v0.10.0 (migration M013), with one revision
decided during implementation: review-time question generation is
**ephemeral**. `ensureHighQualityQuestion()` never persists generated
questions — the stored question changes only through deliberate editing
surfaces (Studio content editor, token CLI, imports). Manual questions are
asked verbatim, without LLM variation. `question_source` is pure provenance
for curation: `'manual'` for human-authored questions (API question edits
without a declared source default to it), `'llm'` for agent- and
curriculum-authored questions (also the column default, so pre-M013 rows and
old snapshot restores classify as LLM-era), `'template'` reserved.*

### 4. `interleave()` performance
Replace the inner loop with a priority-queue approach: maintain a min-heap of (domain, remaining-count) and pick from the domain with the most remaining items that does not violate `maxConsecutive`. This brings the complexity to O(n log n).

*Rejected 2026-07-08. `interleave()` runs once per queue build on
session-sized input (tens of cards, a handful of domains); the current
O(n·d·log d) costs microseconds. A heap rewrite risks changing the
user-visible tie-breaking of the review order for an imperceptible gain —
and the open decision below already conceded a sorted array may beat the
heap at these sizes. Revisit only if queues grow by orders of magnitude.*

### 5. Review-context caching
Add a module-level `Map<string, { context: ReviewContext; expiresAt: number }>` cache with a configurable TTL. `resolveReviewContext()` checks the cache before fetching. Cache is keyed by the normalized `sourceLink`.

*Already shipped with v0.5.2 (`reviewContextCache` in `src/kernel/recall/reference-resolver.ts`, keyed by link + max length).*

### 6. Goal-engine async migration
Convert all file operations to their `fs/promises` equivalents (`readFile`, `writeFile`, `readdir`). Update function signatures to return `Promise<...>`. Update callers in `src/cli/commands/goal.ts`.

*Rejected 2026-07-08 as standalone work. The goal engine is consumed only by
the one-shot `zam goal` CLI command, where synchronous I/O blocks nobody; the
value is consistency alone. Do it opportunistically when goals are touched
anyway — mandatory before goals join a long-running surface (`zam mcp`,
`bridge serve`), where sync I/O would stall the event loop.*

### 7. Incremental snapshot deltas
Add `exportSnapshotDelta(db, since)` that only exports rows modified after a given timestamp. Requires adding `updated_at` columns to tables that lack them. The delta snapshot format uses the same SQL-text approach but includes only INSERT statements for changed rows and DELETE statements for removed rows.

*Rejected 2026-07-08. Three reasons: (1) no observed pain — snapshots exclude
the recomputable embeddings and run only on backup/machine-move, not in any
hot path; (2) the sketch under-specifies deletions — `updated_at` cannot find
rows that no longer exist, so deltas need tombstones or a change-log table, a
multiple of the effort described here; (3) the multi-learner sync ADR will
introduce a real sync protocol that would supersede hand-rolled deltas.
Revisit only if snapshot size or export/import time hurts in practice, and
then inside the multi-learner sync design.*

## Open decisions

- **Item 4 (interleave):** Should we implement a custom min-heap or use a sorted-array approach? For the typical queue size (50–100 items), a simple sorted array may be faster than a heap due to cache locality.
  *Moot — item rejected 2026-07-08.*
- **Item 5 (cache TTL):** Should the TTL be configurable via settings or hardcoded at 5 minutes? Configurable adds complexity for a feature that rarely needs tuning.
  *Resolved in practice — shipped hardcoded with v0.5.2; no tuning need has surfaced.*
- **Item 7 (delta snapshots):** Should deltas be cumulative (each delta is self-contained) or incremental (each delta depends on the previous one)? Cumulative is simpler but larger; incremental is smaller but requires a chain of deltas for restore.
  *Moot — item rejected 2026-07-08.*
