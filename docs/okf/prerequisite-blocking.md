---
type: data-model
title: Prerequisite Graph and Blocking
description: Tokens form a directed prerequisite graph; blocking and unblocking of dependent cards is separate from FSRS math and coordinated atomically by the review-action kernel API.
tags:
  - kernel
  - scheduling
  - prerequisites
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/prerequisite-blocking.md"
timestamp: 2026-08-15T10:51:34.868Z
---

Tokens are connected by a **directed prerequisite graph** (table
`prerequisites`): an edge means "learn this first". The graph powers two
behaviors:

**Blocking.** When a learner demonstrably lacks a foundation, cards that
depend on it can be blocked out of the queue. `cascadeBlock()` in
`src/kernel/scheduler/blocker.ts` walks the dependents of a failed token
and marks their cards blocked; `unblockReady()` releases cards whose
prerequisites have recovered.

**Separation from FSRS math.** Blocking is deliberately *not* part of
`evaluateRating()` (see [fsrs-scheduling.md](fsrs-scheduling.md)). The
kernel's higher-level `executeReviewAction()` coordinates the interactive
policy: for a rating of `1`, it checks whether the token has prerequisites
and then invokes `cascadeBlock()`. The card update, immutable review log,
blocking changes, and an optional session step share one transaction, so a
failure cannot leave a partially applied review.

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

# Atom prerequisites and entry assessment

Curated central-learning content also has an atom graph in
`atom_prerequisites`. An edge connects a learning objective to the objective
it requires and is explicitly `hard` or `soft`. Soft atom edges inform
ordering but never gate. Hard edges identify the direct foundations that may be
offered for precondition self-assessment. The assessment endpoint additionally
requires that the edge gate one of the learner's live, published cards:
globally installed content is not personal work and cannot be self-certified.

This graph does **not** create a proactive admission gate. Enrolling in a cell
materializes its scoped practice-item cards, and a dependent card remains
accessible. If a direct hard foundation reaches the queue, the learner may
either learn it now or defer its unretrieved cards to a finite date. Deferral is
burial only, never evidence that the atom is held. Explicitly pulling such a
card forward replaces its future date with `precondition_ready` intent until
a genuine review clears the marker, so a restart cannot cause the same
self-assessment prompt again. Actual failure can still use the existing
token-card cascade, and only observed retrieval satisfies the held-atom
predicate used by bonus offers.

# Citations
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- Tests: `tests/kernel/precondition-assessment.test.ts`, `tests/kernel/tier-interaction-bonus.test.ts`
- Code: `src/kernel/library/precondition-assessment.ts`, `src/kernel/library/bonus.ts`, `src/kernel/library/kvt-attach.ts`, `src/kernel/db/schema.ts`

- [ADR 2026-03-27 — Stabilization and Workflow Integrity](../adr/2026-03-27-stabilization-and-workflow-integrity.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- Code: `src/kernel/models/prerequisite.ts`, `src/kernel/scheduler/blocker.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/actions.ts`
