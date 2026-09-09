# Central Curriculum Content Service: Content Only, Pulled Forward

**Status:** Accepted — scope and ordering decided (Thomas, 2026-07-26).
**Deciders:** Thomas (project owner)
**Amends:** [2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)
— moves its Phase E ("a broad curriculum library") from *planned after pilot
experience* to *next deliverable*, and hardens its sketched shape into an
invariant.
**Related:**
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)
(Phase 5, the "central sync service" this becomes) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md) ·
[2026-07-26-ipados-companion-target.md](2026-07-26-ipados-companion-target.md)

---

## Context

ADR 2026-07-04 already describes this service, under "Direction beyond the
pilot", and already gets its shape right: read-only, one-way, no cards, no
review logs, "little or no identity". It originally sequenced it after real
experience from the closed group because in July it was a direction, not a
commitment.

Two things changed on 2026-07-26.

**It has a date.** Curriculum import should "be a charm" before the Bavarian
2026/27 school year begins (~mid-September, about seven weeks out). The
Realschule field test starts with that school year, and today every device
re-derives the same Lehrplan material for itself: minutes of generation per
topic, per learner, every time, against a manifest that only covers Realschule
grade 9.

**It may be sponsored.** A company may host it. That makes
the data boundary a commercial question and not only an ethical one — and it is
much easier to answer *before* a partner and a bill exist than after.

The parent ADR's Deployment B — the company closed group, where learning state
does live in the shared database under RLS — is a **different thing that stays
different**. That is a team setup in a business context, and it separates
cleanly from this (project owner, 2026-07-26). This ADR is not about it.

## Decision

### 1. The service holds the Knowledge data class, and nothing else

Using the parent ADR's data-class table verbatim:

| Class | Tables | In this service? |
|---|---|---|
| **Knowledge** | `tokens`, `prerequisites`, `sources`, `token_sources`, `token_embeddings`, curated `agent_skills` | **Yes** |
| **Assignment** | `assignments` | **No** — team/business concern, Deployment B |
| **Learning state** | `cards`, `review_logs`, `sessions`, `session_steps`, `session_syntheses` | **Never** |
| **Aggregates** | derived coverage/due counts | Not built anywhere (parent Decision 11) |

This is not a policy the service promises to honour. Those tables have no
reason to exist in its schema, so the boundary is structural: there is nowhere
for learner data to land. The domain model already splits this way — a `token`
is "shared across users" by definition, a `card` is per-user FSRS state — so
the service is simply the half that was always shared.

### 2. No identity at all — not "little"

The parent ADR said "little or none". This resolves it to **none**: anonymous,
read-only access. No accounts, no per-learner keys, no Entra, no RLS.

RLS is load-bearing in Deployment B precisely because learning state sits
beside other people's. Here there is no learning state and no "other people",
so the entire identity and isolation apparatus is absent rather than
configured-permissively. That is the property that makes it sponsorable.

Accepted cost: no per-learner rate limiting and no usage analytics. Abuse
control, if ever needed, is at the CDN/HTTP layer.

### 3. Read-only, one-way

Content flows out. There is no write path from a learner's device — corrections
travel the editorial route the parent ADR's Decision 2 already defines (content
in git, release step in the Studio), not an API.

### 4. Pulled forward, and run in parallel with the Azure/Entra pilot

Phase E runs **now**, alongside Phases C/C0/D rather than after them. The
company Postgres pilot starts the week of 2026-07-27; the curriculum service
is due before the school year, roughly six weeks later. Neither waits for the
other.

That is affordable precisely because they share almost no machinery: this
service has no Postgres RLS requirement, no Entra token acquisition, no
ULID↔principal mapping, and no dialect audit blocking it. Two deadlines, two
mostly-disjoint stacks, one shared dependency — Phase B's library model, which
the parent ADR already calls "independent of any deployment".

**The risk this creates is sequencing, not capacity.** Deployment B collapses
store and source into a single database, and it ships first. If the library
model is built against that coincidence, the curriculum service breaks it six
weeks later — a rework of exactly the model both depend on. Decision 5 is
therefore a constraint on the *pilot's* Phase B work, not a follow-up to it.

### 5. Store vs. source becomes a precondition of the pilot's library model

The parent ADR's constraint on Phase B — one **store** per device (where my
cards live) plus zero or more **content sources** (libraries I read) — stops
being a forward-looking note and becomes a precondition. Deployment B collapses
store and source into one database; this service breaks that immediately, since
a learner keeps their store on their own device while reading from a remote
library.

Concretely: a published token version must be modelled as something that can
*arrive from* a source, not something that necessarily lives in the same
database as the card pointing at it. Decision 9's "the database selection
carries the context" remains the pilot's rule, not a law.

Because the pilot starts first (Decision 4), this is the one place where the
two efforts genuinely collide, and it is cheap to honour now and expensive to
retrofit. It is a modelling constraint, not extra deployment work — the pilot
can still collapse store and source in practice, as long as the model does not
assume they are the same thing.

## Consequences

- **Sponsorship is uncomplicated.** A sponsor hosting content-only
  infrastructure processes no personal data, so there is no DSGVO processing
  agreement covering a minor's learning behaviour, no data-protection impact
  assessment, and nothing for a school to object to. Had learning state been
  included "just for convenience", every one of those would apply — and the
  first users are minors in a school context.
- **The field-test learner's data never touches sponsor infrastructure**, on
  any device including the school iPad. Not by policy: the service has no table
  for it.
- **Import becomes an attach, not a generation.** Attaching to already-published
  tokens is a database operation in milliseconds where device-side generation
  costs minutes per topic per learner — the second motivation from ADR
  2026-07-25.
- Manifest coverage stops being per-install work. Today only Realschule grade 9
  is curated; a central library makes broadening it benefit everyone at once.
- The service is cache-friendly and CDN-shaped: immutable published versions,
  anonymous reads, no personalisation.

## Open questions

1. **Content licensing — the one genuinely new risk.** LehrplanPLUS material is
   Bavarian state curriculum content. A company using derived cards internally
   (Deployment B) is a different act from publishing them from a broad,
   possibly sponsored service. Redistribution terms and required attribution
   need checking before publication, not after. `sources`/`token_sources`
   already carry provenance, which helps, but does not by itself grant a right
   to redistribute.
2. **Who curates, and under whose name**, once content is public rather than
   internal to a closed group.
3. **Hosting shape** — a database endpoint versus a static, versioned artifact.
   Anonymous read-only content with immutable versions may not need a database
   server at all, which would cut the sponsored cost toward zero. Worth
   deciding before accepting infrastructure.

## Out of scope

- Assignments, and anything else from the team/business setup — Deployment B.
- Any write path from learner devices.
- Billing or tenancy for a commercial product.
- Replacing or deprecating any existing database path.
