# Closed-Group Learning Library: Curation, Privacy and Deployment

**Status:** Accepted (2026-07-25; rewritten from and superseding the
2026-07-04 draft)
**Date:** 2026-07-04, rewritten and accepted 2026-07-25
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md)
(**the product principle this ADR implements** — see below) ·
[2026-07-04-knowledge-contexts.md](2026-07-04-knowledge-contexts.md)
(Decision 9 binds context to the database) ·
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

### Relationship to ADR 2026-07-25

[2026-07-25 "Create Once, Improve Continuously, Serve Many"](2026-07-25-shared-curated-learning-content.md)
establishes the **product principle**: curated learning content is a
first-class shared asset, each improvement is paid once, tokens are shared
while cards stay personal, and generation cost is amortised at publish time.
It explicitly lists *"defining the schema of the central Lehrplan database"*
among its non-goals.

**This ADR supplies exactly that missing half** for one concrete setting — a
closed group such as a company. Where 2026-07-25 says content should be created
once, improved continuously and served to many, this one specifies *how*: the
editorial states and who may move between them, what a published version is,
what happens to learners when content changes, where the data lives, who may
read it, and how a member is identified. Read 2026-07-25 for **why**, this one
for **how**; neither overrides the other.

**Scope clarification (2026-08-15):** This workflow describes the mature
closed-group publishing process. It is not a prerequisite for source-grounded
agent content, the bounded curriculum field test, or the first Bayern-first
library build. Reviewers may be agents or humans. Teachers are a valuable later
improvement channel, not a mandatory approval role.

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
- **Offline matters for reviews.** Reviews happen on trains and in meeting
  rooms. This pulls against cross-device progress, and the two deployments
  below resolve the tension differently rather than pretending it away.
- **The existing database paths must keep working** (project owner,
  2026-07-25): local SQLite, embedded libsql replica, and Turso/`sqld` remote
  stay supported and remain the default. Anything new is parallel and opt-in.
- **A closed group needs an identity boundary** — someone must be able to say
  who is in and who is out, and revoke it when a colleague leaves.
- **Scale is modest.** Family 2–5, class ~30, company team 10–100s.

## Decision drivers

1. **Editorial quality first** — the library exists so a few people can make
   content good for everyone.
2. **Knowledge shared, learning state the learner's** — and no aggregates about
   people at all (Decision 11).
3. **Offline-first stays available** — Deployment A never blocks a review on a
   server. Deployment B trades this for cross-device progress, deliberately and
   with Deployment A still there for anyone who needs offline (Decision 6).
4. **Additive** — existing single-learner and Turso/`sqld` paths keep working.
5. **A fix must reach the people who learned the broken version.**
6. **Smallest credible step** before new deployables.

## Data classes

| Class | Tables | Sharing | Writers |
|-------|--------|---------|---------|
| **Knowledge** | tokens, prerequisites, sources, token_sources, token_embeddings, agent_skills (curated) | Shared library, versioned | Curators |
| **Assignment** | *new:* assignments (who should learn what, by when) | Visible to assigner + learner | Curators/leads |
| **Learning state** | cards, review_logs, sessions, session_steps, session_syntheses | **Private to the learner.** Deployment A: local. Deployment B: in the shared database, isolated by RLS | The learner only |
| **Aggregates** | *derived:* coverage %, due counts | **Not built** — nobody but the learner sees their numbers (Decision 11) | — |

"Private to the learner" is the invariant; *where* the rows sit is a deployment
choice. In Deployment A it holds because the data never leaves the machine; in
Deployment B it holds because RLS says so — a weaker guarantee against a
superuser, which Decision 6 states plainly rather than papering over.

## Decision

### 1. The unit of sharing is a published token version, not a database

A group library is a set of tokens (plus prerequisites, sources, embeddings)
that carry an editorial state and a content version. Learners consume
**published** versions. What is shared is knowledge; a learner never sees
another learner's cards or review logs — in Deployment A because that data
never leaves the machine, in Deployment B because RLS forbids it (Decision 6).

### 2. A future editorial workflow for controlled shared releases

```
draft ──► in-review ──► published ──► deprecated
  ▲           │
  └── changes requested
```

- **Anyone in the group may author a draft or propose a change** to an existing
  token. Learning surfaces friction better than curating does: the person who
  just failed a badly worded card is the best-placed to report it.
- **Only the publisher/curator role promotes a version** once this shared
  workflow exists. That is an authorization and distribution boundary, not a
  requirement for teacher or expert approval.
- **Deprecated, never deleted.** `review_logs` reference tokens; retiring a
  token stops scheduling new reviews and hides it from search, but history
  stays intact.
- Provenance is recorded — authoring agent or human, any reviewers, timestamp
  and sources — so a learner can see how a card was produced. This is the same
  discipline OKF articles already follow (ADR 2026-07-17); an OKF article is
  the natural `source_link` target for a curated token.

**Where the mature loop runs (project owner, 2026-07-25; scope clarified
2026-08-15): content in git, release in the Studio.** Authoring and review can
happen as they already do for OKF —
articles and token drafts in a repository, reviewed through pull requests,
where diffs, history and reviewer identity are solved problems and no new UI is
needed. What the Studio owns is the **release step**: a curator sees what a
merge would change for learners, classifies each change (Decision 3), and
publishes. Merging a pull request therefore does not by itself reach anybody's
queue — publishing does.

The split follows the two different questions being asked. "What evidence and
review produced this text?" is a versioning question git answers well. "What
should happen to the people who already learned the old version?" is a
scheduling question only ZAM can answer, and it needs the curator in front of
ZAM.

**Corollary: concurrent curation needs no design of its own** (project owner,
2026-07-25). Two curators editing the same token is a **merge conflict**,
resolved by tools that have done exactly this for decades, with diff, history
and blame included. The database only ever receives the *result* of a publish,
so it has no competing writers for knowledge at all. No last-write-wins rule,
no curation log, no merge UI — the draft's Open Question about conflict policy
dissolves rather than being answered, which is the best outcome an open
question can have.

### 3. Content changes classify as cosmetic or material — and material changes touch FSRS

This is the part a plain shared database cannot do, and the reason curation is
worth the effort.

Tokens carry a `content_version`. A learner's card records the version it was
learned against. When a curator publishes a change they classify it:

- **Cosmetic** (typo, clearer phrasing, formatting): learners keep their FSRS
  state untouched. The card silently updates.
- **Material** (the answer changed, the scope changed, it was simply wrong):
  the card becomes **due now**, and the learner sees what changed and who
  changed it.

Without this, quality control is cosmetic in the worst sense: a curator fixes a
wrong card and everyone who already memorized the wrong answer stays
confidently wrong on a comfortable review interval. Making a correction
propagate into scheduling is what turns "someone checks the content" into a
real guarantee.

**A material change does not reset FSRS state directly — it re-tests**
(project owner, 2026-07-25):

```
curator publishes (material)
        │
        ▼
due_at = now, notice on the card:
  "content changed by <curator>, <date>"  + what changed
        │
        ▼
learner answers, rates 1–4
        │
        ▼
FSRS recomputes stability from the real answer
```

This is the FSRS-native answer and it avoids inventing a number. A hard reset
throws away history that the scheduler could have used and punishes people who
already knew the correction; a "soft reset" needs a stability penalty that
nobody can justify. Re-testing needs neither: the scheduler already knows how
to tell "still knew it" from "did not", and the learner's actual rating is
better evidence than any guess ZAM could make on their behalf. Someone who
already knew the new answer rates it well once and is back on their previous
rhythm; someone who held the outdated version lapses, which is exactly correct.

**There is no default** (project owner, 2026-07-25). Publishing forces the
curator to classify the change; ZAM never guesses materiality from a text diff
and never picks the safe-looking option on the curator's behalf. Defaulting to
cosmetic would let a real correction slip through and leave learners
confidently wrong; defaulting to material would reset cards for typo fixes
until people stopped trusting the library. The small friction per publish is a
**scheduling-safety step** in the future workflow: it makes the publisher think
about people who already learned the prior version. It is not a subject-matter
approval gate.

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

For DocuWare colleagues. This is an **additional** path selected by
configuration, never a replacement.

**Hosted in a company subscription in the `docuware.com` tenant from the
start** (project owner, 2026-07-25). An earlier plan would have piloted on the
project owner's Visual Studio Professional credit and migrated later; that
subscription could not be activated, and going straight to a company-owned one
turns out to be the simpler design anyway:

- Colleagues authenticate as **ordinary tenant members** — no B2B guest
  invitations, no personally-owned identity boundary, and offboarding follows
  the corporate directory automatically.
- **There is no planned migration**, so the schema, the role grants and the
  data all live in their final home from day one. The migration drill the
  earlier draft required disappears with it.
- Nobody's learning history depends on a personal subscription staying funded.

The cost is a dependency: this needs DocuWare to provide a subscription and
carry the (small) bill before the first colleague can use it. That is a
conversation to have early, not a technical risk.

This remains a **pilot in scope** — a small group, a deliberately limited
library — just not a pilot in infrastructure.

- **Store:** Azure Database for PostgreSQL Flexible Server, Burstable **B1ms**,
  32 GiB, **PostgreSQL 17** — the exact SKU and the reason for pinning 17 are
  in Decision 13. (The storage figure is the service's floor; ZAM's data is far
  smaller: 768-dim embeddings are ≈3 KB per token, so 100k tokens ≈ 300 MB.)
  `pgvector` provides
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
- **Learning state lives in the shared database too** (project owner,
  2026-07-25), so a colleague's progress follows them across machines instead
  of being trapped on one laptop. `cards`, `review_logs`, `sessions`,
  `session_steps` and `session_syntheses` are stored per learner and isolated
  by RLS.

  This makes RLS the **load-bearing privacy boundary**, not a convenience, and
  that has to be built accordingly:

  - Every learning-state table carries the learner's ULID and an RLS policy
    keyed to the connected principal's mapped ULID (Decision 7). A learner's
    role can read and write only their own rows; there is no group-wide
    `SELECT` on these tables for anyone, including curators.
  - `ALTER TABLE … FORCE ROW LEVEL SECURITY`, so the policy also applies to the
    table owner. Without it, the owning role bypasses RLS silently.
  - The schema owner is a **separate role from any human administrator**, and
    no person logs in as it during normal operation.
  - The policies are tested, not assumed: a test suite asserts that learner A
    cannot read learner B's cards or review logs through any supported query
    path. A privacy boundary nobody tests is a privacy claim, not a boundary.

  **Stated honestly:** a PostgreSQL superuser, and anyone who can act as the
  Azure server administrator, can still read every row. RLS does not defend
  against them. In this deployment the learners and the administrators are
  colleagues at the same employer, and review logs are performance-adjacent
  data about employees.

  **ZAM says so itself, in the app** (project owner, 2026-07-25). Connecting a
  device to a company library shows a plain-language disclosure once, and the
  same statement stays permanently visible in Settings:

  > Your learning progress is stored in a database operated by your
  > organisation. Other learners cannot see it. Database administrators
  > technically can.
  >
  > **[Understood]  [Learn locally instead]**

  Two things make this more than a notice. It is written in the language a
  colleague actually thinks in, not as a legal clause — and it comes with a
  **real alternative**, because Deployment A is right there and fully
  supported. A disclosure with no way out is an announcement; a disclosure next
  to a working local option is a choice.

  Deliberately, this does not wait on a works-council agreement or a corporate
  privacy review. Those may well follow and are DocuWare's to run, but the
  honesty is part of the product and ships with it. ZAM is not blocked by a
  process it does not control, and no colleague ends up in the company library
  without having been told what that means.

- **Consequence: Deployment B is online-only for reviews** (project owner,
  2026-07-25). With state in the server, a review needs the network — the same
  trade the companion already accepted (ADR 2026-07-23). Deployment A remains
  the offline-capable path for anyone who needs it.

  A local cache with write-back would fix this and is deliberately **not**
  built: it brings back exactly the sync state machine, conflict policy and
  online/offline test matrix that the write-asymmetry otherwise lets this ADR
  avoid, and it would be built against a guess. The pilot answers the question
  instead — how often does someone actually stand in front of ZAM with no
  network? On a company PC that is rare; if the pilot shows otherwise, an
  offline cache is a well-motivated follow-up with its own ADR.

### 7. ZAM's data never marries Entra

The planned subscription migration is gone (Decision 6), but the constraint it
implied is kept, because it is right for its own reasons.

- **Entra identifiers never become keys in ZAM's data.** A learner stays a ZAM
  ULID `user_id`. A single deployment-scoped mapping table binds that ULID to
  an Entra principal (object id + UPN). Everything else — cards, assignments,
  provenance, curator attribution — references the ULID only.

  The rule earns its place three times over. Deployment A has no Entra at all,
  so the kernel cannot depend on one. Entra object ids are tenant-specific, so
  any future move — a tenant reorganisation, an acquisition, a self-hosted
  server — would otherwise corrupt authorship and ownership across the whole
  library. And a colleague who leaves and returns, or whose account is
  recreated, keeps their learning history instead of becoming a stranger to it.

- **Role grants are deployment configuration, not data.** The
  `pgaadauth_create_principal` mappings and the RLS grants live in a runbook,
  are applied to the server, and are never expected to survive a `pg_dump`.
  Restoring a backup restores the library, not the permissions.

- **Nothing depends on subscription-specific features.** The store stays
  ordinary PostgreSQL plus `pgvector`, so an export is restorable anywhere —
  another subscription, another tenant, or a self-hosted server. What would
  *not* travel is the passwordless sign-in: outside Azure there is no
  production-ready way to authenticate Postgres against Entra today
  (Decision 13). Portability here means the data and the schema, not the
  identity integration — an insurance policy rather than a scheduled task.

### 8. The kernel stays single-learner

No RLS, no auth, no HTTP in the kernel. Multi-learner semantics live in the
CLI/sync layer, exactly like LLM access does. The kernel's only multi-user
awareness stays what it already has: `user_id` columns.

### 9. The database selection carries the knowledge context

Choosing the database chooses the knowledge context (project owner,
2026-07-25). Connecting to the company library *is* being at work; the private
local database *is* private (and school). A learner does not pick the two
independently.

This puts two existing concepts in the right order. The knowledge-contexts ADR
(2026-07-04) is explicit that a context is a **library slice and not an
authorization boundary** — "tagging something `work` must never make it
shareable by itself". The deployment is the real boundary. Deriving the context
from the connection therefore removes a whole class of mistake: you cannot
misfile a private card into the company library by picking the wrong entry in a
dropdown, because the company library only ever offers its own contexts.

**In practice the binding is per device, not a toggle** (project owner,
2026-07-25): the phone at home is connected to the private database; the work
PC is connected to the company database. That matches where the connection
already lives — machine-local config in `~/.zam/config.json`, never in the
shared database — so a device is set up once and simply *is* a work device or a
private one. The mobile companion pairing (ADR 2026-07-23) is the private
server database in exactly this picture.

Concretely:

- `contexts` rows live in the database they belong to, so each deployment
  already carries its own set. The active context resolves to the connected
  library's default; the context picker only offers what that database
  contains.
- Switching database is a context boundary in the same sense the companion
  context bar already means it (ADR 2026-07-16): reset the local view, do not
  carry a stale context across the switch.
- Authoring language follows for free. The contexts ADR gave contexts a
  `language` field precisely because the team area is English while private
  content is German; connecting to the corporate library therefore switches the
  authoring-language default without a separate setting.

The honest consequence of a per-device binding is that **there is no single
"everything I owe today" view across both worlds.** At work you see work cards;
at home on the phone you see private ones. For work–life separation that is
arguably the feature rather than the cost — and it is the same separation that
keeps private learning out of an employer's database entirely. But it should be
a stated choice, not a surprise: someone who wants one combined queue will not
get it, and the fix would be a cross-library aggregation view that deliberately
does not exist yet.

This does **not** promote context to an authorization boundary. It makes the
boundary the thing that *selects* the context. Inside the company library,
contexts remain ordinary slices.

This is the pilot's rule rather than a general law: a later read-only
curriculum library would be a content *source* without being a store, which
separates the two again. See "Direction beyond the pilot".

### 10. An assignment binds while it stands; the learning outlives it

An assignment ("learn these 12 tokens by March") creates ordinary cards in the
learner's queue. Two rules govern their life (project owner, 2026-07-25):

- **While the assignment is active, the learner cannot detach the card.** The
  "not for me" opt-out is unavailable. That unavailability is precisely what
  makes it an assignment rather than a suggestion. It constrains the *queue*,
  never the answer: ZAM still never compels a rating, and the learner's results
  remain their own private data like any other.
- **When the assignment is withdrawn or completed, the cards and their full
  FSRS history stay with the learner.** What someone worked to learn belongs to
  them, not to the task that prompted it — a lead changing their mind must not
  erase a colleague's learning. The assignment was the occasion, not the owner.

From that moment the card is ordinary personal content and the learner has full
control: keep it (the default — it simply keeps scheduling), detach it with
**"not for me"**, or delete it outright in the Studio. Both are one action.

The asymmetry is deliberate. An assigner may withdraw an assignment; an
assigner may never delete another person's cards or review history. Deletion of
learning state is always the learner's own act — which also keeps `review_logs`
append-only from every direction except the person they belong to.

Assignment provenance survives as context on the card ("assigned by … , March
2026"), so a learner can still see why a card entered their queue.

### 11. No aggregates — nobody but the learner sees their numbers

The draft reserved room for opt-in aggregates (coverage %, due counts) that a
guardian or coach could receive. **They are not built** (project owner,
2026-07-25). A learner sees their own figures; no one else sees them at any
granularity, opt-in or otherwise.

Three reasons, and the third is the one that decides it:

- **No demonstrated demand.** No concrete lead-or-coach story exists that needs
  them. Designing a privacy-sensitive feature against an imagined user is how
  you get a feature nobody asked for and everybody has to live with.
- **High misuse potential at an employer.** "Coverage 40%" is one screenshot
  away from being read as an appraisal. And "voluntary" sharing with one's own
  manager is rarely as voluntary as the checkbox suggests.
- **It would corrupt the data it reports on.** FSRS only works when people rate
  themselves honestly — a rating of 1 has to be safe to give. A learner who
  believes their failures are visible to a colleague will start rating
  generously, and the scheduler immediately begins optimising against fiction:
  intervals stretch, weak material stops coming back, and the tool quietly
  becomes worse at the one thing it exists to do. Surveillance does not just
  cost trust here; it costs accuracy.

This is a ratchet, so it is easier not to start: aggregates can be added later
if a real need appears, but a group that has once seen colleagues' numbers
cannot unsee them. Curators who want to find weak *content* are served by
Decision 12 instead, which never needs a person's identity.

### 12. Content-level signals are allowed, because they are about cards

Curators do need feedback to do their job — the point of the library is that
someone improves it. That feedback can be entirely about the material:
"this card is failed by most people who attempt it" is a content-quality
signal, not a personnel signal.

If and when this is built it must be **anonymous and thresholded** — reported
only above a minimum number of distinct learners, so a small group cannot
reverse it into "who failed it". Nothing here is in the pilot either; it is
recorded so a later reader can see that "no aggregates" was a decision about
*people*, not a refusal to help curators.

### 13. The concrete database: Flexible Server B1ms, 32 GiB, **PostgreSQL 17**

Named explicitly so nobody has to re-derive it:

| | |
|---|---|
| Service | Azure Database for PostgreSQL **Flexible Server** |
| Tier / SKU | **Burstable B1ms** (1 vCore, 2 GiB RAM) — the smallest offered |
| Storage | **32 GiB** (the service floor; ZAM needs far less) |
| Engine | **PostgreSQL 17** — *not* 18, see below |
| Extensions | `pgvector` |
| Auth | Microsoft Entra, token presented as the connection password |

**Pin PostgreSQL 17.** PostgreSQL 18 replaced the authentication framework with
native OAuth2/OAUTHBEARER, and Azure's Entra integration is still built on the
older PG11–17 token model. Entra sign-in therefore **fails on PG18 today**, and
the documented workaround is static passwords — which would throw away the one
property this deployment exists for. PG17 is the supported version for Entra
authentication and is what the pilot uses; PG18 is revisited only once Azure
states that Entra works on it.

That finding also retires a claim in an earlier draft of this ADR: PG18's native
OAuth is *not* yet a portability exit to self-hosted Postgres. The community
validator modules needed to make it work with Entra are explicitly not
production-ready. Treat self-hosting as "possible for the data, unsolved for
the identity" until that changes.

**Sizing.** B1ms is chosen because ZAM's workload is genuinely tiny — a few
dozen learners doing short review sessions, a library measured in hundreds of
megabytes. Compute is an online scale-up operation, so starting at the floor
costs nothing but a restart if the pilot proves it wrong. Two things would
force B2s: the Burstable `max_connections` ceiling with many concurrent
desktop/CLI/mobile clients, and `pgvector` index builds over a large library.

### 14. Development and testing run on local Postgres, not on Azure

Almost nothing about this work needs a cloud database.

**Local: Docker PostgreSQL 17 + `pgvector`.** The kernel already runs its
provider suite through `describeDatabaseContract(...)`
(`tests/kernel/provider-contract.test.ts`), today against local SQLite and an
Hrana stub. A Postgres provider joins as a third case, and CI gains a Postgres
service container. That covers:

- the whole dialect delta (`datetime('now')`, `ILIKE`, `ON CONFLICT DO
  NOTHING`, `RETURNING`, `?`→`$n`) and the schema/migrations;
- `pgvector` search;
- the library model — editorial state, `content_version`, materiality and the
  due-now consequence;
- **the RLS isolation suite.** This matters most: RLS is the load-bearing
  privacy boundary (Decision 6), and it is ordinary PostgreSQL. "Learner A
  cannot read learner B's review logs" is fully testable locally and on every
  CI run, against plain roles. The privacy boundary does not need Azure to be
  proven.

**Only the Azure-specific identity path needs Azure:**
`pgaadauth_create_principal`, acquiring a real Entra token, presenting it as
the password, and refreshing it before expiry. Even these are mostly seam-
testable — the token provider is a function returning a string, so tests inject
a fake one and drive the refresh loop with a fake clock. Locally the same code
path connects with an ordinary password.

**Dev and prod do not share one server**, even though extra databases on a
server are free (billing is per server). Three reasons, the third decisive:

- point-in-time restore is per *server*, so restoring prod would roll dev back
  too;
- one B1ms has a single vCore — a careless dev query is a prod outage;
- maintenance and **major-version upgrades hit the whole server at once**. The
  main reason to want a dev environment here is to rehearse the PostgreSQL 18
  move once Azure supports Entra on it (Decision 13). On a shared server that
  rehearsal is impossible by construction.

**Entra sign-in cannot be reproduced locally — and does not need to be.** Stock
PostgreSQL 17 has no OAuth; Azure's Entra support on 17 is an Azure-side
extension that accepts the access token **in the password field**. Locally the
client connects with an ordinary password over the *same code path*: only the
origin of the string differs. Token acquisition and the refresh-before-expiry
loop are therefore unit-testable with an injected provider and a fake clock,
and nothing about them requires a cloud database.

Running PostgreSQL 18 locally to get native OAUTHBEARER would be a trap: 18
ships the framework but no validator, the Entra validators are not
production-ready, and 18 is precisely the version where Azure's Entra auth does
not work (Decision 13). It would test a path ZAM does not ship.

What genuinely needs a real Azure server is a short list — that a live Entra
token is accepted, that `pgaadauth_create_principal` grants behave like the
local roles, and that reconnect-on-expiry works end to end. Decision 15 gives
that a permanent home at no extra cost.

### 15. ZAM is a co-tenant on a server DocuWare needs anyway

The server is not being bought for ZAM (project owner, 2026-07-25). It is set
up as the **prototype for migrating an existing Azure SQL resource to Azure
PostgreSQL** for another service, hosting roughly five databases: three for the
service being replaced, plus **`zam_test`** and **`zam_prod`**.

ZAM's marginal cost is therefore **zero** — billing is per server, and two more
databases on it are free. ZAM also earns its seat: it is a low-risk first
tenant that exercises the migration prototype before the real service depends
on it.

Four consequences follow, and the first two are constraints on other people's
work, so they need agreeing rather than assuming.

- **The PostgreSQL major version is server-wide, and ZAM needs 17.** All
  databases on a Flexible Server share one major version, and an in-place major
  upgrade is server-wide and **irreversible**. ZAM requires 17 because Entra
  sign-in is broken on 18 (Decision 13). If the Azure SQL migration targets 18,
  the two cannot share a server. **This is the sharpest risk in the whole
  arrangement and should be settled before the server is created.**

- **PostgreSQL roles are cluster-wide — there are no per-database users.** This
  is a real difference from Azure SQL, where *contained database users* live
  inside a database and need no server login. Postgres has no equivalent: every
  role, including every Entra principal created with
  `pgaadauth_create_principal`, exists at server level and is visible in
  `pg_roles` to every database on the server.

  The isolation is still achievable, just built rather than inherited:
  `REVOKE CONNECT ON DATABASE … FROM PUBLIC`, then `GRANT CONNECT` only to that
  database's own roles, plus schema and table grants inside. The effect matches
  contained users; the mechanism does not. Worth flagging to the migration
  prototype too — it is exactly the kind of assumption that survives a schema
  conversion and then surprises everyone.

- **Point-in-time restore is per server, not per database.** ZAM cannot ask for
  a server rollback without also rewinding the other service's three databases.
  ZAM's recovery story is therefore **logical**: regular `pg_dump` of
  `zam_prod`, restored into place. Server PITR belongs to the co-tenant, and
  ZAM must never be the reason it is used.

- **The set of people who can read everything grows.** Decision 6 already
  states that a superuser or server administrator can read every row and has
  ZAM disclose it in-app. On a shared server that group now includes whoever
  operates the co-tenant service. The disclosure already says "database
  administrators" without naming a team, so it stays accurate — but the fact
  should be known rather than discovered.

**`zam_test` replaces the ephemeral instance** from Decision 14. A permanent
test database at no extra cost is strictly better: it gives the Entra identity
path — real tokens, `pgaadauth_create_principal`, reconnect-on-expiry — a
standing home to be verified against, while local Docker keeps serving the
inner development loop.

## Cost (Deployment B)

The company subscription carries the bill (Decision 6), so the figures below
are not a budget ceiling — they exist so the ask is small and concrete when
someone at DocuWare has to approve it. The honest version of that ask is
"roughly the price of one lunch per month, and it can be switched off".

Figures checked July 2026; region-dependent, so **confirm in the Azure pricing
calculator for the chosen region before committing**.

### Minimal build-out

| Item | Monthly |
|------|---------|
| Burstable B1ms compute, always on | ~$12–15 |
| 32 GiB storage (~$0.115/GiB) | ~$4 |
| Backup within the provisioned size | included |
| **Total, no optimisation** | **~$16–19** |

Two levers, neither needed on day one:

- **A one-year reservation** takes up to ~65% off compute, bringing the total
  to roughly **$9–10**. Sensible once the pilot is known to continue; pointless
  before that.
- **Stopping the server when idle** pauses compute billing (storage still
  bills). One caveat that matters for automation: a stopped Flexible Server
  **restarts itself after seven days**, so "stop it over the holidays" needs a
  scheduled job rather than a single click.

Storage is the floor, not a driver: ZAM would have to grow by two orders of
magnitude before 32 GiB mattered.

### What ZAM actually adds to the bill: nothing

The figures above describe a server bought for ZAM alone. That is not the plan
(Decision 15): the server exists for the Azure SQL → PostgreSQL migration
prototype, and ZAM adds `zam_test` and `zam_prod` to roughly five databases on
it. Billing is **per server, not per database**, so:

| | Monthly |
|---|---|
| ZAM's marginal cost on the shared server | **$0** |
| Local Docker for development | **$0** |
| A standalone server, if ZAM ever needed its own | ~$16–19 (~$9–10 reserved) |

**Development stays local regardless** (project owner, 2026-07-25) — a test
user with a password against Docker Postgres 17, which is the same client code
path as an Entra token (Decision 14). Even a free database on the shared server
would be a worse inner loop than a container that starts in a second and can be
thrown away.

The standalone figure is kept because it is the fallback if the version
constraint in Decision 15 turns out to be irreconcilable, and because it is the
honest answer to "what would this cost if it had to stand alone".

### Cheaper alternatives, and why they lose

The Entra requirement — an administrator grants **Microsoft Entra identities**
access *in the database*, and ZAM signs in with no password — is what decides
this, not the price.

| Option | Cost | Verdict |
|--------|------|---------|
| **Neon Serverless Postgres (Azure Native)** | free tier 100 CU-h/month; then ~$0.106/CU-h + $0.35/GiB — plausibly **$0–10** with scale-to-zero after 5 min idle | Genuinely cheaper and a real Azure-native service billed through the subscription. But its Entra integration documents **provisioning, portal and billing** — not Entra identities as *database* logins. Fails the deciding requirement unless that turns out to be supported; worth a check if cost ever becomes the binding constraint. |
| **Self-hosted Postgres on a small Azure VM** | ~$8–10 | Cheaper compute, but there is no production-ready way to authenticate Postgres against Entra: PG17 has no OAuth, and PG18's OAuth validators for Entra are explicitly not production-ready. Also hands us patching, backup and HA. |
| **Supabase / Hetzner / any non-Azure Postgres** | €5–25 | Same failure, plus the data leaves the corporate tenant — a harder conversation at DocuWare than the $16 it saves. |
| **Azure SQL Database serverless** | can auto-pause to near-zero | Excellent native Entra auth and now has vector types, but T-SQL moves the dialect distance from "tens of sites" (Open Question 1) to a rewrite. Not worth it to save ~$10. |

**Conclusion: nothing cheaper currently satisfies the Entra requirement.** The
managed service is being bought for the identity integration; Postgres and the
hardware are almost incidental at this size. At ~$16–19/month — and under $10
with a reservation — the difference to the cheapest theoretical option is small
enough that operational simplicity wins.

## Open questions

All questions this ADR raised for the project owner were resolved on
2026-07-25:

| Question | Answer |
|----------|--------|
| Which tenant? | `docuware.com`, in a company subscription from day one — ordinary members, no B2B guests, no planned migration (Decision 6) |
| Where does curation happen? | Content in git, release step in the Studio (Decision 2) |
| Learning state in the shared database? | Yes, isolated by RLS — which makes RLS load-bearing and testable (Decision 6) |
| Default for materiality? | None; publishing forces the curator to classify (Decision 3) |
| What happens on a material change? | The card re-tests rather than resets: due now, next rating recalibrates FSRS (Decision 3) |
| Assignment withdrawn? | Binding while it stands; cards and history then stay with the learner (Decision 10) |
| Residual admin visibility? | ZAM discloses it in-app, beside a working local alternative (Decision 6) |
| Aggregates about people? | Not built at all (Decision 11) |
| Offline in Deployment B? | Online-only; the pilot measures whether a cache is worth its complexity (Decision 6) |
| Concurrent curation? | A git merge conflict — the database never has competing writers (Decision 2) |

Every question this ADR raised for the project owner is now answered. What
remains is one engineering note rather than a decision:

1. **Dialect cost, measured.** The 2026-07-04 draft assumed a Postgres provider
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
- **Phase C0 — local Postgres first:** the Postgres provider and its contract
  case, the dialect delta, `pgvector`, and the RLS isolation suite, all on
  Docker Postgres 17 in CI with a test user and password (Decision 14). No
  Azure resource exists yet, and none is needed to prove the privacy boundary.
- **Phase C — Deployment B pilot:** the Postgres provider behind the existing
  async `Database` contract, Entra token acquisition and refresh, the ULID ↔
  Entra principal mapping, RLS policies **with an isolation test suite**, the
  per-device database binding carrying the context (Decision 9), and the admin
  runbook for granting Entra groups access.
- **Phase D — assignments** (Decision 10). Aggregates are not part of the
  plan (Decision 11).
- **Phase E — a broad curriculum library**, informed by real experience from
  the closed group: read-only content, no learning state, little identity. See
  "Direction beyond the pilot" below for the constraint it puts on Phase B.

## Direction beyond the pilot: a content source is not a workspace

Once the closed group has produced real experience, the natural next step is a
much broader library — a **Bayern-Lehrplan database**, say (project owner,
2026-07-25). Not built here and originally sequenced after that experience, but
recorded because it constrains what Phase B may assume. The later owner
clarification permits a Bayern-first source-grounded library to grow in
parallel rather than wait for this closed-group process.

Its shape is different from Deployment B in one decisive way: **the learning
data really stays with the learner.** A curriculum library is a *source of good
content* — so that an agent grounds itself in versioned source material instead
of inventing a curriculum on every device — and nothing more. It holds no
cards, no review logs, no sessions, and needs no notion of who is learning from
it.

| | Deployment B (company) | Curriculum library (future) |
|---|---|---|
| Membership | closed group, Entra | broad or public |
| Content flows | both ways (colleagues propose) | one way, read-only |
| Learning state | in the database, RLS | **never — stays with the learner** |
| Identity needed | yes | little or none |

**The constraint this puts on Phase B:** the *library* and the *learner's
store* must stay separately addressable. Deployment B happens to collapse them
— the company database is both the library and where cards live — and it would
be easy to bake that coincidence into the model. The curriculum case breaks it
immediately: a learner keeps a local store on their own machine while consuming
content from a remote library they can only read.

So Decision 9's "the database selection carries the context" is the *pilot's*
rule, not a law. The general form is one **store** per device (where my cards
and my state live, exactly one) plus zero or more **content sources**
(libraries I read from). Deployment A has a store and no source; Deployment B
has a store that is also its source; the curriculum library is a source nobody
stores into. Phase B should model a published token version as something that
can *arrive from* a source rather than something that necessarily lives in the
same database as the card pointing at it.

This also closes the loop with ADR 2026-07-25's second motivation: a learner
attaching to already-published curriculum tokens is a database operation
measured in milliseconds, where device-side generation of the same material
costs minutes per topic, per learner, every time.

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
  an architectural invariant rather than a UI promise. In Deployment B it is
  enforced by RLS and must be *tested* like any other security boundary; the
  residual superuser exposure is written down rather than glossed over.
- Private learning never reaches the employer's database at all, because the
  device binding puts it in a different database entirely. That separation is
  physical rather than a policy anyone has to honour.
- The same binding costs a combined cross-world view of what is due. Work
  cards live at work; private cards live at home.
- Phase B pays off on every deployment, including single-learner, because
  versioned content with a materiality signal is useful even for one person
  correcting their own old cards.
- A fourth database provider is a real cost, but a bounded and measured one,
  and it is confined to one opt-in deployment.
- ZAM takes a dependency on Microsoft Entra for that deployment only. The
  identity boundary of the closed group becomes the corporate directory, which
  is the honest place for it.
