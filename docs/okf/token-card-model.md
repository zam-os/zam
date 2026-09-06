---
type: data-model
title: Token and Card Model
description: ZAM separates learning objectives, alignments, curriculum bindings, shared practice items, and each learner's personal FSRS card state.
tags:
  - kernel
  - data-model
  - tokens
  - cards
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/token-card-model.md"
timestamp: 2026-09-06T19:08:40.000Z
---

ZAM's published central-learning model separates five objects:

1. A **LearningAtom** is a language-neutral learning objective in the shared
   prerequisite DAG.
2. A **ConceptAlignment** is a typed advisory link from that objective to an
   external vocabulary or another objective; it is not automatic identity.
3. A **CurriculumBinding** says where an objective appears in a provider,
   school type, grade, track, subject, and topic.
4. A **PracticeItem** is learner-facing recall substance for an atom: wording,
   reference answer, language, Bloom level, interaction tier, and optional
   structured fast check.
5. A **Card** is one learner's scheduling and participation state for one local
   practice item.

The database still names the shared local PracticeItem row **token**. A token
therefore carries the item text and metadata plus an optional `atom_id`;
legacy, imported, and repo-knowledge tokens may stand alone without an atom.
It is not the canonical cross-language objective. Token fields include slug,
title, concept, domain, Bloom level, context, `source_link`, editorial and
revision provenance, `language`, `tier`, and serialized `fast_check`.
Bloom drives prompt generation, while tier and fast-check metadata define the
review interaction. `provider` and `topic_id` remain a legacy one-binding
projection for curriculum imports; the n:m truth is stored in atom curriculum
bindings.

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

Tokens carry an **editorial state**: `draft`, `in_review`, `published`, or
`deprecated`. Only `published` content enters review queues, due lists,
presentation admission and rating. Raw captures —
MCP/Bridge `zam_add_token`, `zam token register`, Studio create, generic
curriculum extract, source/URL capture, Mobile import, and generated
split/foundation items — write `draft`. Curated KVT cells, OKF import that
passes structural checks, and adoption of existing Anki/file cards remain
identifiable published paths. `createToken()` still defaults to `published`
so those curated callers stay explicit. First-run starter cards pass
`published` so they remain immediately reviewable.

Publishing runs inexpensive structural checks: a required question for first
publication of a draft, a non-empty criterion that is not a slug echo, and
valid referenced atoms and prerequisite edges. A slug that ZAM derived from
the token's own question or concept is never an echo of them; a raw slug
pasted into a field always is. OKF import parks a token without a question
as a draft (listed under `drafts`) and publishes it on a re-import that
supplies the question. Semantic review of scope,
leakage, and subject-matter dependencies stays with the author. Publishing
records `published_by` / `published_at`; a material revision increments
`content_version`, while a cosmetic revision keeps the version. The version
lets ZAM identify cards whose learner last answered older substance. First
publication of a draft is typically cosmetic. Studio and Mobile expose a
Publish action that uses the same `personal-card-publish-revision` /
`zam_publish_revision` contract as MCP/Bridge. `zam_list_drafts` and
`zam bridge list-drafts` list unpublished captures.

A **card** is one user's FSRS and participation state for a token:
stability, difficulty, due date, state, block status, the
`learned_content_version`, optional assignment provenance, and optional
`detached_at` (see [fsrs-scheduling.md](fsrs-scheduling.md) and
[prerequisite-blocking.md](prerequisite-blocking.md)).

The practical consequence: **a concept needs a card for that user and must
be published to enter the review queue.** `zam token register` creates the
shared token as a draft; `zam bridge add-token` creates the draft *and* the
calling user's card. The card is visible in Studio and Mobile, but unpublished
drafts stay out of the queue until publish. The Android additive-import and
quick-capture flow preserves the same split: after explicit confirmation it
atomically creates a draft token and the paired learner's card, together with
requested prerequisite and knowledge-context links. Editing and publication
remain reachable there after Save.

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

# Bundled cells: installation and enrolment

A bundled cell is commit-controlled shared content plus an explicit list of
in-scope atom ids. Installing it creates or reconciles atoms, alignments,
curriculum bindings, prerequisite edges, and local PracticeItem/token rows; it
creates **zero cards**. Enrolling a learner is a second operation that
materializes cards for the in-scope atoms' practice items: every item of an
atom the learner has no card on yet, and one new item per enrolment call
for an atom that already carries cards, so a content revision feeds new
items within the normal learning budget instead of enrolling existing
learners in every new card at once. A concept appears in a learner's queue
only after that card exists and the token is published. Installation,
enrolment, and publication remain separate kernel steps.

A tile may retire practice items. A retired item keeps its cards and review
history but stops representing its atom: token prerequisites derived from
atom edges move to the item flagged `edge_representative` (else the first
published Tier-1 item, else the lowest published id), and edges that
pointed at the retired item are removed so it cannot block a learner who
never reviewed it.

Different cells may reuse the same atom and some of the same practice items.
Installation status therefore checks every declared atom and item id, while
enrolment status checks personal card coverage of every in-scope atom. Personal
review evidence can later be rebound to a rebuilt central knowledge-base model;
exact successor declarations may preserve it, while ambiguous or materially
changed mappings require real re-retrieval.

# Citations
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- Tests: `tests/kernel/kvt-attach.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/tier-interaction-bonus.test.ts`, `tests/kernel/publication.test.ts`
- Code: `src/kernel/library/kvt-attach.ts`, `src/kernel/library/bundled-cells.ts`, `src/kernel/library/bonus.ts`, `src/kernel/library/publication.ts`, `src/kernel/scheduler/queue.ts`

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
