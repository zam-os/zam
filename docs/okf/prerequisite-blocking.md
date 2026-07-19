---
type: data-model
title: Prerequisite Graph and Blocking
description: Tokens form a directed prerequisite graph; blocking and unblocking of dependent cards is a separate mechanism from FSRS rating, invoked by callers after a failed review.
tags:
  - kernel
  - scheduling
  - prerequisites
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/prerequisite-blocking.md"
timestamp: 2026-07-19T08:50:00Z
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
`zam bridge`'s prerequisite commands). Kernel callers add and remove
individual edges through `addPrerequisite()` and `removePrerequisite()`.
Operations that reconcile several edges perform those calls inside one
database transaction.

An OKF learning re-import treats each confirmed token's submitted
prerequisite list as its complete desired direct-neighbor set. It removes
obsolete edges before adding declared edges inside the import transaction.
If an addition would create a cycle, the transaction restores the prior
content and graph rather than leaving a partial reconciliation.

# Citations

- [ADR 2026-03-27 — Stabilization and Workflow Integrity](../adr/2026-03-27-stabilization-and-workflow-integrity.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- Code: `src/kernel/models/prerequisite.ts`, `src/kernel/scheduler/blocker.ts`, `src/kernel/scheduler/queue.ts`, `src/cli/bridge-handlers.ts`
