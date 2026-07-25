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

**Where the loop runs (project owner, 2026-07-25): content in git, release in
the Studio.** Authoring and peer review happen as they already do for OKF —
articles and token drafts in a repository, reviewed through pull requests,
where diffs, history and reviewer identity are solved problems and no new UI is
needed. What the Studio owns is the **release step**: a curator sees what a
merge would change for learners, classifies each change (Decision 3), and
publishes. Merging a pull request therefore does not by itself reach anybody's
queue — publishing does.

The split follows the two different questions being asked. "Is this text
correct?" is a review question git answers well. "What should happen to the
people who already learned the old version?" is a scheduling question only ZAM
can answer, and it needs the curator in front of ZAM.

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
until people stopped trusting the library. The small friction per publish *is*
the quality gate — it is the moment a curator has to think about the people who
already learned it.

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
- **Phase C — Deployment B pilot:** the Postgres provider behind the existing
  async `Database` contract, Entra token acquisition and refresh, the ULID ↔
  Entra principal mapping, RLS policies **with an isolation test suite**, the
  per-device database binding carrying the context (Decision 9), and the admin
  runbook for granting Entra groups access.
- **Phase D — assignments** (Decision 10). Aggregates are not part of the
  plan (Decision 11).

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
