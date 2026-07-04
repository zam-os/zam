# Multi-Learner Tier: Shared Knowledge, Private Learning State

**Status:** Proposed (draft)
**Date:** 2026-07-04
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-03-rag-semantic-token-search.md](2026-07-03-rag-semantic-token-search.md)
(Decision 4 + Open Question 2) ·
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)
(the "central sync service" follow-up idea)

---

## Context

ZAM is single-learner-first: one local SQLite file, one implicit user, with
optional Turso sync for the *same person's* other machines. The domain model
already separates the two halves cleanly — **tokens** (knowledge, "shared
across users" by design) and **cards/review_logs/sessions** (one learner's
FSRS state) — and `cards.user_id` plus `bridge database-select-user` show the
multi-profile seam exists. What does not exist is any story for **several
people sharing one knowledge base**: a family working through school
curricula, a team curating company know-how, a class with a teacher.

Two prior decisions point here and wait on this ADR:

1. The semantic-search ADR put search behind an abstraction so "the shared
   company tier" can plug in a different backend (its Phase 4), and left
   **Open Question 2** — self-hosted `sqld` vs. Postgres + pgvector — to be
   answered "when the multi-learner ADR is written". This is that ADR.
2. The LehrplanPLUS wizard work noted a future **central sync service** so a
   curated curriculum import lands once and reaches every learner.

### Forces at play

- **Learning state is intimate.** Review logs record what someone failed, how
  often, and when. In a family or company setting, sharing *knowledge* must
  not silently mean sharing *performance*. ZAM's symbiosis stance implies the
  learner owns their learning state — a teacher/employer sees progress only by
  explicit opt-in. This is the defining constraint, not an afterthought.
- **Write patterns differ per data class.** Tokens/prerequisites: few writers
  (curators), many readers, low conflict. Cards/review_logs: exactly one
  writer each (the learner), append-heavy, no cross-user conflicts by
  construction. This asymmetry is a gift — exploited correctly, the
  multi-learner problem needs no CRDTs and no distributed transactions.
- **Offline-first is non-negotiable.** Reviews happen on trains and in
  classrooms. The learner's working set must live locally; the shared tier can
  only ever be a sync target, never a hard runtime dependency.
- **The stack already speaks three providers** (better-sqlite3, native libsql
  replica, Turso HTTP) behind one async `Database` contract. A self-hosted
  `sqld` server is wire-compatible with the existing Turso paths — the
  cheapest possible shared store. Postgres would mean a fourth provider AND a
  dialect audit of every kernel query.
- **Embeddings are now part of the knowledge.** `token_embeddings` rows are
  portable BLOBs with a canonical model id — they can (and should) be synced
  with the tokens so one machine's embedding work benefits every learner.
- **Self-hosted, no license cost** (inherited from the search ADR): OSI
  licenses, runs on a home server or company VM.
- **Scale is modest.** Family: 2–5 learners. Class: ~30. Company team:
  10–100s. Nothing here needs web-scale infrastructure; everything needs
  clear ownership boundaries.

## Decision drivers

1. **Privacy by data class** — knowledge shared, learning state private by
   default, aggregates opt-in.
2. **Offline-first** — a learner's reviews never block on a server.
3. **Smallest credible step** — reuse the existing provider/sync machinery
   before building services.
4. **One knowledge base, many learners** — curriculum imports, token curation,
   and embeddings land once and reach everyone.
5. **Self-hosted, no license cost, kernel stays SQL/SQLite-dialect.**
6. **A seam that survives growth** — the same client-visible contract from
   family scale to company scale.

## Data classes (the core of this ADR)

| Class | Tables | Sharing | Writers |
|-------|--------|---------|---------|
| **Knowledge** | tokens, prerequisites, sources, token_sources, token_embeddings, agent_skills (curated) | Shared library, versioned | Curators (role) |
| **Assignment** | *new:* assignments (who should learn what, by whom, due) | Visible to assigner + learner | Curators/guardians |
| **Learning state** | cards, review_logs, sessions, session_steps, session_syntheses | **Private to the learner; stays local by default** | The learner only |
| **Aggregates** | *derived:* coverage %, due counts, streaks | Opt-in, coarse, learner-controlled | Derived client-side, published explicitly |

## Options considered

| Option | Privacy model | Offline | Migration | Notes |
|--------|---------------|---------|-----------|-------|
| **A. One shared self-hosted `sqld`, every learner an embedded replica** | ❌ none — every client replicates the *entire* DB including everyone's review_logs | ✅ excellent | **None** — existing providers work against `sqld` today | Perfect for a **trusted circle** (family) where mutual visibility is acceptable; untenable beyond it. Auth = one DB token, all-or-nothing. |
| **B. ZAM Sync Service: small self-hosted API syncing per data class; clients stay local-SQLite** | ✅ enforced at the API: knowledge shared, state never uploaded without opt-in | ✅ local DB remains source of truth for state | Medium — one new service + a client sync command | The service owns authorization; its *internal* store is an implementation detail (start `sqld`/libsql, swap to Postgres+pgvector if scale demands) — which quietly answers the search ADR's Open Question 2: **the seam moves from the SQL dialect to the service API.** |
| **C. Postgres + pgvector as a fourth kernel provider, RLS for privacy** | ✅ via RLS, but complex to get right | ❌ weak — kernel queries go remote, offline needs a second local store anyway | **Large** — dialect audit of the whole kernel | Row-level security is attractive, but buys privacy at the cost of the offline-first property and the biggest migration. Kept as the *internal* scaling exit of Option B, not as the client contract. |
| **D. Managed Turso cloud, one DB per learner + one shared DB** | partial | ✅ | small | Vendor-dependent and per-seat cost; conflicts with self-hosted-no-cost. Rejected as the *required* path; remains possible since B/A speak the same protocol. |

## Decision (proposed)

**1. Two tiers, one principle.** Sharing is organized by **data class**, not by
database: knowledge is shared, learning state is private by default,
aggregates are explicit opt-ins. Both tiers below implement the same table
above — they differ only in enforcement strength.

**2. Trusted-circle tier now (Option A): a shared self-hosted `sqld` for
small circles that accept mutual visibility.** Families and 2–3-person teams
get multi-learner ZAM immediately: one `sqld` on a home server/NAS, every
member connected via the existing Turso-compatible providers (embedded
replica for offline). Per-user separation stays what it is today —
`cards.user_id` discipline, not enforcement. Deliverables are documentation,
a `zam connector setup` path for plain `sqld` URLs, and multi-user smoke
tests. No schema changes.

**3. Organization tier as the target (Option B): a small self-hosted ZAM Sync
Service.** A single self-hosted API (Node, same repo, Apache-2.0) that syncs
per data class:

- **Library sync (down/up):** tokens, prerequisites, sources, embeddings —
  curators push, everyone pulls. Embedding vectors travel with the tokens
  (canonical model id makes them portable), so one machine embeds and all
  benefit.
- **Assignments (down):** "learn these 12 tokens by March" lands in the
  learner's queue as ordinary cards, created locally.
- **Learning state: never uploaded by default.** The service cannot see
  review logs. An explicit `zam share progress --with <circle>` publishes
  coarse aggregates (coverage, due counts) — revocable, learner-initiated.
- **Roles:** `curator` (write library), `learner` (read library, own state),
  `guardian/coach` (read the aggregates a learner opted to publish).
- **Server store:** starts as `sqld`/libsql — one dialect everywhere, native
  vector search available server-side, satisfying the search ADR's Phase 4.
  If an org outgrows it, the service swaps its internal store to Postgres +
  pgvector **without changing the client protocol** — resolving Open
  Question 2 of the search ADR: *`sqld` first, Postgres as the internal
  scaling exit, and the stable seam is the service API, not the SQL dialect.*

**4. The kernel stays single-learner.** No RLS, no auth, no HTTP in the
kernel. Multi-learner semantics live in the sync layer (CLI/service), exactly
like LLM access does. The kernel's only multi-user awareness remains what it
already has: `user_id` columns.

## Open questions

1. **Auth mechanism for the service.** Start with invite tokens per circle
   (simple, self-hosted-friendly); OIDC/SSO only if a company deployment
   demands it. Lean invite tokens.
2. **Conflict policy for curated knowledge.** Last-write-wins with
   `updated_at` + a curation log is likely sufficient at expected scale;
   verify against the multi-curator case before building merge UI.
3. **Assignment ↔ card lifecycle.** Does deleting an assignment retire the
   card (learner keeps history?) — interacts with FSRS-state ownership.
4. **Aggregate vocabulary.** Which opt-in metrics exist (coverage, streak,
   due-count) and their exact granularity — needs a guardian/coach user story
   before freezing.
5. **Does the trusted-circle tier need soft privacy?** E.g. client-side
   filtering of other users' review_logs in UI — cosmetic, since replicas see
   the file; decide whether to bother or document honestly.

## Scope and delivery plan

- **Phase 0 — This ADR** proposed for sign-off.
- **Phase A — Trusted circle on `sqld`** (small): setup docs + connector path
  for self-hosted `sqld` URLs, multi-user smoke test, honest privacy note.
- **Phase B — Sync Service MVP** (library down-sync only): read-only shared
  library, `zam library pull`, embeddings included. Curation still happens on
  the curator's machine.
- **Phase C — Library up-sync + roles + assignments.**
- **Phase D — Opt-in aggregates** (guardian/coach view) and, only if scale
  demands, the internal Postgres+pgvector swap (search ADR Phase 4 completes
  here at the latest — `sqld` native vectors may already cover it in B).

## Out of scope

- Real-time collaboration/presence; CRDT merging (write asymmetry makes it
  unnecessary at this scale).
- Central review scheduling — FSRS runs on the learner's device, always.
- Billing/tenancy for a hosted product; this ADR is self-hosted only.
- The Studio UI for curation workflows (own design effort once Phase B
  exists).

## Consequences

- Families get multi-learner ZAM with zero new code (Phase A is docs +
  connector polish), at the honest cost of mutual visibility.
- The privacy line — knowledge shared, state private — becomes an
  architectural invariant enforced by the service, not a UI promise, and it
  matches the symbiosis philosophy: the system serves the learner, it does
  not surveil them.
- A new deployable (the sync service) enters the repo: more surface, but the
  kernel and CLI remain unchanged in character, and the service reuses the
  bridge-protocol discipline (JSON contracts, versioned).
- Open Question 2 of the search ADR is answered without a datastore bet:
  `sqld` first; if Postgres ever arrives, it arrives *inside* the service.
