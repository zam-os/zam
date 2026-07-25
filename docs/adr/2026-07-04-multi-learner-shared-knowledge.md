# Shared Curated Learning Content in a Closed Group

**Status:** Proposed (rewritten 2026-07-25; supersedes the 2026-07-04 draft)
**Date:** 2026-07-04, rewritten 2026-07-25
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-03-rag-semantic-token-search.md](2026-07-03-rag-semantic-token-search.md)
(Decision 4 + Open Question 2) ·
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md) ·
[2026-07-17-okf-knowledge-base.md](2026-07-17-okf-knowledge-base.md) ·
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)
(the "central sync service" follow-up idea)

---

## Context

Inside a closed group — a company like DocuWare, a family, a class — people
learn overlapping material. Today each learner curates alone: everyone imports
the same curriculum, writes their own version of the same card, re-embeds the
same tokens, and repeats the same mistakes in wording, scope and Bloom level.

The reason to put a group on one library is not storage and not sync. It is
that **a few people can take responsibility for the quality of the learning
content, and everyone else benefits from that work.** That is the core idea;
everything below follows from it.

> The 2026-07-04 draft of this ADR led with sync topology and a bespoke sync
> service. That put the plumbing before the purpose, and the purpose had not
> been thought through yet (project owner, 2026-07-25). This rewrite starts
> from content quality. The data-class privacy table survives from the draft
> because it is load-bearing; the sync-service design does not.

### What "quality" actually means here

A curator is not a database administrator. The properties they are responsible
for are editorial:

- the token is **atomic** — one concept, one question, one answer;
- the **Bloom level** matches what the question really demands;
- there is a **real source** (`source_link`: an OKF article, a spec, a
  curriculum entry), not folklore;
- no **duplicates** and no **contradictions** with the rest of the library;
- **prerequisite edges** reflect actual dependency, so blocking is meaningful;
- the content is **still true** — and when it stops being true, someone fixes
  it and the fix reaches people who already learned the old version.

That last point is the one a shared database alone does not solve, and it is
the most valuable thing a curated group library can offer.

### Forces at play

- **Content quality is the product.** A shared library full of sloppy cards is
  worse than no shared library: it multiplies one person's errors across the
  whole group and lends them false authority.
- **Write patterns are deeply asymmetric.** Knowledge: few writers, many
  readers, low conflict. Learning state: exactly one writer each, append-heavy,
  no cross-user conflicts by construction. Exploited correctly this needs no
  CRDTs and no distributed transactions.
- **Learning state is intimate — and sharper at an employer.** Review logs
  record what someone failed, how often, and when. In a company, that is
  performance data about an employee. Sharing *content* must never quietly mean
  sharing *performance*.
- **Offline-first for reviews.** Reviews happen on trains and in meeting rooms.
- **The existing database paths must keep working** (project owner,
  2026-07-25): local SQLite, embedded libsql replica, and Turso/`sqld` remote
  stay supported and remain the default. Anything new is parallel and opt-in.
- **A closed group needs an identity boundary** — someone must be able to say
  who is in and who is out, and revoke it when a colleague leaves.
- **Scale is modest.** Family 2–5, class ~30, company team 10–100s.

## Decision drivers

1. **Editorial quality first** — the library exists so a few people can make
   content good for everyone.
2. **Knowledge shared, learning state private by default**, aggregates opt-in.
3. **Offline-first** — a learner's reviews never block on a server.
4. **Additive** — existing single-learner and Turso/`sqld` paths keep working.
5. **A fix must reach the people who learned the broken version.**
6. **Smallest credible step** before new deployables.

## Data classes

| Class | Tables | Sharing | Writers |
|-------|--------|---------|---------|
| **Knowledge** | tokens, prerequisites, sources, token_sources, token_embeddings, agent_skills (curated) | Shared library, versioned | Curators |
| **Assignment** | *new:* assignments (who should learn what, by when) | Visible to assigner + learner | Curators/leads |
| **Learning state** | cards, review_logs, sessions, session_steps, session_syntheses | **Private to the learner; local by default** | The learner only |
| **Aggregates** | *derived:* coverage %, due counts | Opt-in, coarse, learner-controlled | Published explicitly |

## Decision

### 1. The unit of sharing is a published token version, not a database

A group library is a set of tokens (plus prerequisites, sources, embeddings)
that carry an editorial state and a content version. Learners consume
**published** versions; they never see another learner's cards or review logs
by construction, because those are a different data class that does not travel.

### 2. An editorial workflow, because that is what quality control is

```
draft ──► in-review ──► published ──► deprecated
  ▲           │
  └── changes requested
```

- **Anyone in the group may author a draft or propose a change** to an existing
  token. Learning surfaces friction better than curating does: the person who
  just failed a badly worded card is the best-placed to report it.
- **Only curators publish.** Publishing is the quality gate and the only way
  content reaches other learners' queues.
- **Deprecated, never deleted.** `review_logs` reference tokens; retiring a
  token stops scheduling new reviews and hides it from search, but history
  stays intact.
- Provenance is recorded — author, reviewer, timestamp — so a learner can see
  who stands behind a card. This is the same discipline OKF articles already
  follow (ADR 2026-07-17); an OKF article is the natural `source_link` target
  for a curated token.

### 3. Content changes classify as cosmetic or material — and material changes touch FSRS

This is the part a plain shared database cannot do, and the reason curation is
worth the effort.

Tokens carry a `content_version`. A learner's card records the version it was
learned against. When a curator publishes a change they classify it:

- **Cosmetic** (typo, clearer phrasing, formatting): learners keep their FSRS
  state untouched. The card silently updates.
- **Material** (the answer changed, the scope changed, it was simply wrong):
  every learner who already learned the old version is **told**, and the card's
  scheduling is reset — its stability no longer describes what they now need to
  know.

Without this, quality control is cosmetic in the worst sense: a curator fixes a
wrong card and everyone who already memorized the wrong answer stays
confidently wrong on a comfortable review interval. Making a correction
propagate into scheduling is what turns "someone checks the content" into a
real guarantee.

Cosmetic is the default only when the curator says so; ZAM never guesses
materiality from a text diff.

### 4. Roles

| Role | May |
|------|-----|
| **Curator** | publish, deprecate, approve proposals, classify changes |
| **Contributor** | author drafts, propose changes (any group member) |
| **Learner** | read published content, own their learning state |
| **Admin** | manage membership of the closed group |

Roles are per library, not global. A person is typically contributor+learner,
and a handful are also curators.

### 5. Deployment A — existing paths, unchanged (the default)

Local SQLite, the embedded libsql replica, and Turso/`sqld` remote keep working
exactly as today, single-learner or trusted-circle. A family or a 2–3 person
team can share one `sqld` and accept mutual visibility; the honest caveat
stays documented (every replica technically sees everything), with the Studio's
own-data display filter labeled as cosmetic, not a security boundary.

**No schema-breaking change and no forced migration for anyone on these paths.**

### 6. Deployment B — closed company group on Azure PostgreSQL with Microsoft Entra (new, parallel)

For DocuWare colleagues, hosted on the project owner's Azure subscription.
This is an **additional** path selected by configuration, never a replacement.

- **Store:** Azure Database for PostgreSQL Flexible Server, Burstable tier,
  32 GiB (the service's storage floor — ZAM's data is far smaller: 768-dim
  embeddings are ≈3 KB per token, so 100k tokens ≈ 300 MB). `pgvector` provides
  server-side vector search, which completes Phase 4 of the search ADR for this
  tier and answers its Open Question 2: **Postgres, but only for this tier, and
  only as a deployment choice — not as the kernel's dialect.**
- **Identity = the closed group.** Microsoft Entra authentication is enabled on
  the server; an administrator grants access by mapping Entra principals or
  **groups** to database roles (`pgaadauth_create_principal`). Membership of
  the group *is* membership of the library, so onboarding and offboarding
  follow the corporate directory instead of a ZAM-specific invite list.
- **Passwordless sign-in from the local user identity.** The client acquires an
  Entra access token (scope
  `https://ossrdbms-aad.database.windows.net/.default`) through an MSAL public
  client — interactive browser or device-code — and presents it in the
  connection's password field. ZAM stores no password and no long-lived secret.
  Tokens are short-lived (roughly an hour), so the provider must refresh and
  reconnect transparently; that refresh loop is the one genuinely new piece of
  client machinery this tier needs.
- **Authorization by data class** is enforced by Postgres grants and row-level
  security rather than by convention: published knowledge readable by every
  member, writable only by curators; assignments visible to their learner and
  author.
- **Learning state stays local.** For this tier the recommendation is that
  `cards`, `review_logs` and `sessions` do **not** go into the corporate
  database at all. This keeps reviews offline-capable, and it removes the
  awkward question of what an employer's database administrator can read —
  because RLS does not protect data from a superuser, and on a managed service
  the subscription owner is close enough to one. What the company hosts is the
  *library*; what the employee keeps is their *learning*.

### 7. The kernel stays single-learner

No RLS, no auth, no HTTP in the kernel. Multi-learner semantics live in the
CLI/sync layer, exactly like LLM access does. The kernel's only multi-user
awareness stays what it already has: `user_id` columns.

## Cost (Deployment B)

Indicative only — **verify in the Azure pricing calculator for the actual
region before committing**, since tiers and prices move:

| Item | Rough monthly |
|------|---------------|
| Burstable B1ms (1 vCore, 2 GiB) | ~$12–15 |
| Burstable B2s (2 vCore, 4 GiB) | ~$25–30 |
| 32 GiB storage | ~$4 |
| Backup (within storage size) | included |

B1ms plus storage lands near $20/month and B2s near $35 — both inside the
$50/month allowance. Flexible Server can be stopped when idle, which pauses
compute billing. Two caveats worth checking early: Burstable instances have a
low `max_connections` ceiling, and built-in connection pooling is not offered
on every tier — a group of ~30 with desktop, CLI and mobile clients may need
B2s or an external pooler.

**Why Azure and not something cheaper.** Neon, Supabase or a €5 Hetzner VM all
run Postgres with pgvector for less. None of them offer "an administrator
grants Microsoft Entra identities access in the database" as a supported
feature — each would mean building and owning the identity bridge. The Entra
requirement, not the database, is what selects Azure here. If that ever stops
being true, PostgreSQL 18's native OAuth support is the portability exit: a
self-hosted server can validate Entra tokens directly.

## Open questions

1. **Where does curation actually happen?** ZAM already has an OKF knowledge
   base curated through git and pull requests. For a company library, the
   proposal→review→publish loop could reuse that (review content as OKF
   articles in a repo, sync published tokens to the database) instead of
   building review UI in the Studio. This is likely the smallest credible first
   step and should be decided before any workflow code is written.
2. **Materiality classification UX.** Curators must classify every published
   change. What is the default, what does the learner see when a card resets,
   and can a learner appeal a reset?
3. **Assignment ↔ card lifecycle.** Does deleting an assignment retire the
   card, and does the learner keep the history?
4. **Aggregate vocabulary.** Which opt-in metrics exist and at what
   granularity — needs a concrete lead/coach story before freezing. At an
   employer this needs to be conservative by default.
5. **Does Deployment B ever need offline?** Decision 6 keeps learning state
   local, so reviews stay offline-capable and only *library sync* needs
   network. If the group later wants cross-device learning state, that
   reopens both the offline question and the DBA-visibility question.
6. **Conflict policy for concurrent curation.** Last-write-wins on
   `updated_at` plus a curation log is probably enough at this scale; verify
   against a real two-curator case before building merge UI.
7. **Dialect cost, measured.** The 2026-07-04 draft assumed a Postgres provider
   means "a dialect audit of every kernel query". A survey on 2026-07-25 found
   the actual surface small: `datetime('now')` ×21, `LIKE` ×16 (SQLite's is
   case-insensitive for ASCII, Postgres' is not — needs `ILIKE`),
   `INSERT OR IGNORE` ×4, `last_insert_rowid` ×3, plus mechanical `?`→`$n`
   placeholder translation in the adapter. ULIDs everywhere mean almost no
   autoincrement coupling. Worth re-confirming against the full CLI query
   surface before scheduling the work, but this is tens of sites, not hundreds.

## Scope and delivery plan

- **Phase 0 — this ADR** for sign-off.
- **Phase A — trusted circle on `sqld`** (docs + connector path + multi-user
  smoke test + honest privacy note). No schema changes. Unchanged from the
  draft.
- **Phase B — library model:** editorial state, `content_version`, provenance,
  and the cosmetic/material change classification with its FSRS consequence.
  This is the heart of the ADR and is **independent of any deployment** — it is
  worth doing on the existing paths first.
- **Phase C — Deployment B:** the Postgres provider behind the existing async
  `Database` contract, Entra token acquisition and refresh, RLS policies, and
  the admin runbook for granting Entra groups access.
- **Phase D — assignments**, then opt-in aggregates.

## Out of scope

- Real-time collaboration, presence, CRDT merging.
- Central review scheduling — FSRS runs on the learner's device, always.
- Billing/tenancy for a hosted commercial product.
- Replacing or deprecating any existing database path.

## Consequences

- The group gets something a shared folder cannot give it: content somebody is
  accountable for, and corrections that actually reach the people holding the
  outdated version.
- The privacy line — knowledge shared, learning state the learner's — becomes
  an architectural invariant rather than a UI promise, and it holds *more*
  strongly at an employer because learning state simply is not in the corporate
  database.
- Phase B pays off on every deployment, including single-learner, because
  versioned content with a materiality signal is useful even for one person
  correcting their own old cards.
- A fourth database provider is a real cost, but a bounded and measured one,
  and it is confined to one opt-in deployment.
- ZAM takes a dependency on Microsoft Entra for that deployment only. The
  identity boundary of the closed group becomes the corporate directory, which
  is the honest place for it.
