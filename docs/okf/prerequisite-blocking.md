---
type: data-model
title: Prerequisite Graph and Blocking
description: Tokens form a directed prerequisite graph; blocking and unblocking of dependent cards is a separate mechanism from FSRS rating, invoked by callers after a failed review.
tags:
  - kernel
  - scheduling
  - prerequisites
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/prerequisite-blocking.md"
timestamp: 2026-07-17T00:00:00Z
---

Tokens are connected by a **directed prerequisite graph** (table
`prerequisites`): an edge means "learn this first". The graph powers two
behaviors:

**Blocking.** When a learner demonstrably lacks a foundation, cards that
depend on it can be blocked out of the queue. `cascadeBlock()` in
`src/kernel/scheduler/blocker.ts` walks the dependents of a failed token
and marks their cards blocked; `unblockReady()` releases cards whose
prerequisites have recovered.

**Separation from rating.** Blocking is deliberately *not* part of
`evaluateRating()` (see [fsrs-scheduling.md](fsrs-scheduling.md)). A rating
of `1` (Again) only updates FSRS state and the review log; the caller —
CLI command, bridge, or MCP handler — decides whether to invoke the
blocker afterwards. This keeps the FSRS math pure and lets surfaces choose
their own blocking policy.

Blocked cards are excluded when `src/kernel/scheduler/queue.ts` builds the
review queue; unblocking re-admits them.

Prerequisite edges can be suggested semantically: the kernel ranks
candidate foundations from stored embeddings (`suggestFoundations`), and
agents link them explicitly (`zam_link_prereq` over MCP, or
`zam bridge`'s prerequisite commands).

# Citations

- [ADR 2026-03-27 — Stabilization and Workflow Integrity](../adr/2026-03-27-stabilization-and-workflow-integrity.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- Code: `src/kernel/scheduler/blocker.ts`, `src/kernel/scheduler/queue.ts`
