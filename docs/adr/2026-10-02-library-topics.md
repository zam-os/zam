# Library Topics: Starting on the Content a Library Already Holds

**Status:** Accepted — phase 1 implemented (2026-10-02)\
**Implementation plan:** [2026-10-02-library-topics.md](../plans/2026-10-02-library-topics.md)\
**Date:** 2026-10-02\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-04](2026-07-04-multi-learner-shared-knowledge.md) (Decisions 4, 10, 11) ·
[2026-07-18](2026-07-18-okf-learning-import.md) ·
[2026-07-25](2026-07-25-shared-curated-learning-content.md) (Decision 5) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decision 10) ·
[2026-09-04](2026-09-04-team-library-postgres-entra-pilot.md)

---

## Context

A team library holds the curated knowledge of a group — on the pilot server,
mostly tokens a curator imported from the team's knowledge hub through the OKF
import. Tokens are shared; cards are personal, and a concept enters a queue
only once that learner has a card for it (token–card model). A colleague who
connects for the first time therefore owns **no cards at all**, and nothing in
the Studio shows them what the library holds.

What a newcomer has today, and why none of it gets them started:

| Path | Why it does not serve a new member |
|---|---|
| OKF import (`zam_okf_import`) | Ensures cards for the importer only. Re-running it per colleague needs the hub checkout and an agent. |
| Assignments | Bind correctly and lazily under RLS (ADR 2026-09-04), but exist only as bridge/MCP calls, one token and one learner id at a time; binding is also the wrong default for "have a look". |
| Onboarding goal step, Goal Import | Drafts **new** tokens with the model and reuses a library token only on an exact slug match. On a shared library every apprentice adds near-duplicates of the same concepts; a member added with `--no-curator` cannot write tokens at all, so the step fails for them. |
| Bundled cells, curriculum wizard, open content | Public curricula, not the library's own content. |

ADR 2026-07-25 Decision 5 already binds the direction: when a library holds
source-grounded cards for a topic, ZAM prefers attaching to them over
regenerating. It left the API and UX open. The owner's answers of 2026-10-02:
topics are both **derived** from what the library holds and, later,
**curated** bundles; taking them is **voluntary first**, binding later; and the
work **starts with the smallest part all of that shares** — the operation
"take these published tokens as my cards" and one place to choose them.

## Decisions

### 1. A library topic is a derived grouping, not a new object

In this phase a topic is computed, never stored:

- **Key:** `tokens.source_link` with its `#fragment` removed. OKF import writes
  the article's `resource` URL plus an anchor per token, so one article is one
  topic; other source-grounded imports group by their source page the same way.
  The key compares literally — the rule `getTokensBySourceLinkBase` already
  applies to one article — so the catalog, a start and an OKF re-import agree
  on an article's members; a trailing slash, another casing or a query string
  is another topic. Normalising links is left to the writers.
- **Members:** tokens with that key that are `editorial_state = 'published'`,
  not deprecated and not in maintenance.
- **Name:** the key's last path segment without extension, humanised
  (`token-card-model.md` → "Token card model"); OKF file names follow article
  titles. The most frequent `domain` of the members is shown beside it. Real
  names arrive with curated bundles (phase 3).
- Tokens without a `source_link` form no topic in this phase — source-grounded
  content first (ADR 2026-07-25).

No schema change, so nothing to provision or migrate on the team library.

A library topic is not `tokens.provider`/`topic_id`, which carry a curriculum
provider's topic code; code calls the new thing `LibraryTopic` and never stores
it in `topic_id`.

### 2. Starting a topic creates the learner's own cards, nothing else

`startLibraryTopic(db, userId, key)` in the kernel ensures one card per member
token for that learner, in one transaction, and returns how many it created,
how many the learner already held, and how many they had set aside.

- It writes **learning state only**, so it works for every member under
  row-level security — curator or not — and identically on a personal library.
- **Idempotent.** Starting again after a curator added tokens to the article
  picks up exactly the new ones.
- **Voluntary.** A card the learner detached ("not for me") stays detached;
  only an assignment overrides that choice (ADR 2026-07-04 Decision 10).
- **Paced by the existing new-card budget.** A 40-card topic is introduced over
  several days, not in one session; this phase adds no pacing of its own.
- Prerequisites outside the topic are not pulled in up front. A failed rating
  already ensures the prerequisite's card (`scheduler/blocker.ts`).

### 3. The catalog shows the learner's own numbers only

`listLibraryTopics(db, userId)` returns per topic its key, name, domain, item
count, and the learner's **own** held and set-aside counts. It never reports
how many colleagues learn a topic or how they do — that is an aggregate about
people (ADR 2026-07-04 Decision 11). Topics the learner has not started come
first, then by name.

### 4. Surfaces in this phase

- **Bridge:** `library-topics-list` and `library-topic-start --key <key>`,
  JSON only.
- **Studio:** a **Library Topics** action in the Learning Content header beside
  Curriculum Wizard and Goal Import, opening the catalog with one **Start
  learning** per topic and its result ("Kubernetes pods: 2 cards added — they
  join your reviews over the next days."). A dashboard with no cards at all on
  a library that has topics points at the catalog — the one clear action for a
  newcomer.
- **Colleague guide:** `docs/team-library.md` gains "Get your first cards".
- MCP tools and the onboarding step follow in phase 2; Mobile is not part of
  this ADR's phases yet.

### 5. Relation to cells and generic import

A library topic is not a curriculum position, so it does not compete with
cells (ADR 2026-08-14 Decision 10); it is offered beside them. The goal step
is unchanged in this phase; the commit-on-Next fix (PR #371) reached `main`
separately and ships in the same release.

## Later phases

Recorded so this phase does not foreclose them; each gets its own decision
when it starts.

- **Phase 2 — onboarding and goal step prefer the library.** On a library with
  topics, onboarding offers the catalog; the goal step searches the library
  (hybrid search) and offers matching tokens and topics before drafting, and
  drafts only what is missing. What a non-curator member may do with drafted
  cards — a proposal to curators, a personal library, or no drafting — is that
  phase's open question. MCP tools for listing and starting topics.
- **Phase 3 — curated bundles.** A curator names and orders a set of tokens or
  articles ("first week"); stored as knowledge-class tables (curators write,
  members read) and shown in the same catalog. Starting one is
  `startLibraryTopic` over its members.
- **Phase 4 — required topics.** A curator marks a topic or bundle required for
  members; that becomes standing assignments, bound lazily by each member's
  own queue build — including members added later.
- **Phase 5 — topic export for other teams** (owner request, 2026-10-02).
  Once one team learns successfully, general topics it built — a REST API
  topic, say — are worth as much to other teams, and rebuilding them per team
  is the regeneration ADR 2026-07-25 argues against. A
  topic or bundle exports to a file another library imports through an
  **existing** import path, never a new one-off format. The cheapest first
  step is the model-free CSV/TSV import: one row per token with a stable
  `id`, question, answer, title and tags, and `source` set to the token's own
  `source_link` — that column becomes the imported token's `source_link`, so
  the topic reappears as the same topic in the importing library and its
  members start it from there. CSV carries no prerequisites, Bloom levels or
  fast checks; whether that loss is acceptable, or the export should be a
  tile with practice items, prerequisites and `replaces`, is that phase's
  open question. Learning state never leaves with an export. Two further
  questions belong to that phase: a topic citing a team's private knowledge
  hub carries source links the importing team may not be able to open, so
  the export may need to carry the source text or a public citation; and
  within one organisation, a second team *reading* the first team's library
  as a content source (ADR 2026-07-04, "a content source is not a
  workspace") may serve better than copies drifting apart.

## Consequences

- A new member goes from "connected" to a first review in two clicks, without
  an agent, a hub checkout or curator rights.
- Curators keep authoring through the OKF import; no second publishing path.
- Topic names are only as good as article file names until phase 3.
- Articles split or renamed change the topic key. Cards are unaffected (they
  belong to tokens); only the grouping moves, and maintenance state already
  hides tokens whose source binding is unclear.

## Alternatives considered

- **Stored topic table now.** Rejected for this phase: it needs a migration, a
  provisioning round on the team library, and curator authoring before a
  newcomer gains anything. Phase 3 adds it where naming really needs a human.
- **Enrol every published token on first connect.** Rejected: it ignores the
  learner's choice, floods the new-card budget with whatever was imported
  first, and a growing library makes it worse every month.
- **Assignment UI per token.** Rejected as the entry path: binding by default,
  per-learner administration, and the curator needs learner ids. It stays the
  mechanism for phase 4.

## Verification

On `zam_test`, a member added with `--no-curator` and no cards connects from
the Studio, opens **Library Topics**, starts one article, and reviews its
first new card the same day; starting it again adds nothing; a card they
detached stays detached. Kernel tests cover grouping, filtering and
idempotence on SQLite and PostgreSQL, and the detached rule on SQLite.

## Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-02 | Proposed | Scoped by the owner to the shared core (derived topics, start, catalog); curated bundles and required topics recorded as later phases. |
| 2026-10-02 | Phase 1 implemented | Kernel `listLibraryTopics`/`startLibraryTopic`, bridge `library-topics-list`/`library-topic-start` (also on the Studio panel allowlist), Studio dialog from Learning Content and the empty dashboard, all seven locales. Verified on SQLite and PostgreSQL 18 and in the built desktop app; the MCP Apps panel click-through in VS Code is open. Phase 5 (export for other teams) added on the owner's request. |
