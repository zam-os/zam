---
type: data-model
title: Token and Card Model
description: A token is a shared atomic knowledge concept; a card is one user's FSRS and participation state for it — scheduling requires both a card and eligible published content.
tags:
  - kernel
  - data-model
  - tokens
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/token-card-model.md"
timestamp: 2026-08-09T06:55:30Z
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

Tokens imported from OKF articles carry an **anchored source link**:
`<article resource>#<anchor>` (or the bare resource URL without an
anchor). The base identifies the article, the anchor the heading the
concept came from. This makes "the tokens anchored in this bundle" a
queryable set — `listTokens({ sourceLinkBases })`, exposed as
`zam bridge list-tokens --source-link-base` — which the learning graph's
repo scope is built on.

A token can be in **maintenance**: `maintenance_at`/`maintenance_reason`
mark a token whose source binding needs repair (a stale source link, or
a re-import that did not confirm it). A maintenance token is kept — never
deleted — with its learning state preserved, but its cards leave the
review queue and due list until the binding is repaired and maintenance
cleared.

Curated tokens also carry an **editorial state**: `draft`, `in_review`,
`published`, or `deprecated`. Only `published` content enters review
queues. Publishing records `published_by` / `published_at`; a material
revision increments `content_version`, while a cosmetic revision keeps
the version. The version lets ZAM identify cards whose learner last
answered older substance.

A **card** is one user's FSRS and participation state for a token:
stability, difficulty, due date, state, block status, the
`learned_content_version`, optional assignment provenance, and optional
`detached_at` (see [fsrs-scheduling.md](fsrs-scheduling.md) and
[prerequisite-blocking.md](prerequisite-blocking.md)).

The practical consequence: **a concept needs a card for that user and must
remain eligible to enter the review queue.** `zam token register` creates
only the shared token; `zam bridge add-token` creates the token *and* the
calling user's card. The Android additive-import and quick-capture flow
preserves the same invariant: after explicit confirmation it atomically
creates the token and the paired learner's card, together with requested
prerequisite and knowledge-context links.

Local APKG, CSV, and TSV imports preserve the same split. One valid external
card direction maps to one shared token. The importer then ensures a separate
personal card for the importing learner; importing unchanged content for a
second learner reuses the token and creates only that learner's card.
`imported_card_bindings` holds stable external identity and source metadata,
not scheduling state. For Anki the identity is note GUID plus card ordinal, so
siblings remain distinct directions with independent personal schedules. See
[local-card-file-import.md](local-card-file-import.md).

A learner can detach a card as "not for me": the card and review history
remain, scheduling stops, and reattaching resumes the preserved state.
An active assignment prevents detaching or deleting until it is withdrawn.
Removing a card (`personal-card-remove`) clears that user's learning state
and history but leaves the shared token untouched; deleting a token
(`personal-card-delete`) removes the concept for everyone.

Supporting tables: `imported_card_bindings` (stable file-import identity and
provenance), `prerequisites` (directed dependency edges between tokens),
`assignments` (curator-to-learner bindings), `review_logs` (immutable audit
trail of review events), `session`/`session_step` (work+learning episodes
with per-step ratings), and `token_embeddings` (semantic-search vectors,
produced by the CLI layer, stored by the kernel).

# Citations

- [ADR 2026-03-26 — Personal Workflow Foundations](../adr/2026-03-26-personal-workflow-foundations.md)
- [ADR 2026-07-04 — Knowledge Contexts](../adr/2026-07-04-knowledge-contexts.md)
- [ADR 2026-07-04 — Multi-Learner Shared Knowledge](../adr/2026-07-04-multi-learner-shared-knowledge.md)
- [ADR 2026-07-25 — Shared Curated Learning Content](../adr/2026-07-25-shared-curated-learning-content.md)
- [ADR 2026-07-03 — RAG Semantic Token Search](../adr/2026-07-03-rag-semantic-token-search.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-07-18b — Learning Graph Scope Selectors and the Repo Scope](../adr/2026-07-18b-graph-repo-scope.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/kernel/models/token.ts`, `src/kernel/models/card.ts`, `src/kernel/models/assignment.ts`, `src/kernel/library/revision.ts`, `src/kernel/import/text-import.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/prompter.ts`, `src/kernel/db/schema.ts`, `mobile/src/import.ts`
