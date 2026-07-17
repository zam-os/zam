---
type: data-model
title: Token and Card Model
description: A token is a shared atomic knowledge concept; a card is one user's FSRS state for it — a concept only appears in a user's queue if a card exists.
tags:
  - kernel
  - data-model
  - tokens
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/token-card-model.md"
timestamp: 2026-07-17T00:00:00Z
---

The central distinction in ZAM's domain model:

A **token** is an atomic knowledge concept, shared across all users. It
carries a slug, title, concept text, domain, a **Bloom level** (1–5,
driving how recall prompts are phrased), an optional learning context, an
optional `source_link` (the URL of the knowledge source the concept was
derived from — for repo knowledge, an OKF article), provenance fields
(`provider`, `topic_id` for curriculum imports), and a
**`symbiosis_mode`** of `shadowing`, `copilot`, or `autonomy` describing
how much of the skill the human should own versus delegate to AI. Token
metadata is load-bearing: Bloom levels drive prompt generation
(`src/kernel/recall/prompter.ts`, template-based, not LLM), and
`symbiosis_mode` drives coaching behavior.

A **card** is one user's FSRS scheduling state for a token: stability,
difficulty, due date, state, and block status (see
[fsrs-scheduling.md](fsrs-scheduling.md) and
[prerequisite-blocking.md](prerequisite-blocking.md)).

The practical consequence: **a concept only appears in a user's review
queue if a card exists for that user.** `zam token register` creates only
the shared token; `zam bridge add-token` creates the token *and* the
calling user's card. Removing a card (`personal-card-remove`) clears that
user's learning state and history but leaves the shared token untouched;
deleting a token (`personal-card-delete`) removes the concept for
everyone.

Supporting tables: `prerequisites` (directed dependency edges between
tokens), `review_logs` (immutable audit trail of review events),
`session`/`session_step` (work+learning episodes with per-step ratings),
and `token_embeddings` (semantic-search vectors, produced by the CLI
layer, stored by the kernel).

# Citations

- [ADR 2026-03-26 — Personal Workflow Foundations](../adr/2026-03-26-personal-workflow-foundations.md)
- [ADR 2026-07-04 — Knowledge Contexts](../adr/2026-07-04-knowledge-contexts.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- Code: `src/kernel/models/token.ts`, `src/kernel/recall/prompter.ts`
