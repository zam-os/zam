# Hierarchical Domain Ontology and Composite Token Identity

**Status:** Draft (reverted from Accepted, 2026-08-14)
**Date:** 2026-07-04
**Deciders:** Thomas (project owner)

> Reopened. This ADR answered how a personal or team graph stays
> addressable when slugs grow long. The central learning-path work
> asks a harder identity question — how two curricula and two
> publishers recognize the same pedagogical atom — and that join key
> is not settled. See
> [central-learning-path-identity.md](../concepts/central-learning-path-identity.md).
> Treat the decisions below as a candidate, not as a constraint.
**Related:**
[2026-07-04-human-friendly-titles-and-prefixed-domains.md](2026-07-04-human-friendly-titles-and-prefixed-domains.md)
(Decision 4 `/` separator, Open Question 1) ·
[2026-07-04-knowledge-contexts.md](2026-07-04-knowledge-contexts.md) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md) ·
[2026-07-03-rag-semantic-token-search.md](2026-07-03-rag-semantic-token-search.md)

---

## Context

The owner's observation that seeded this ADR: use **domain + slug as the
identifier** — then slugs can be short and domains long and precise;
hierarchical domains, ideally aligned with standard ontology names for
general knowledge, would make the growing Knowledge Graph legible again
("es wird aktuell schon unübersichtlich").

Today the weight sits at the wrong end:

- Slugs carry everything: `mathematik-realschule-9-iii-wie-weist-man-mit-
  der-umkehru` — domain prefix + truncated question crammed into 60 ASCII
  chars, globally unique via counter suffixes.
- Domains carry almost nothing: flat labels (`axon-ivy`, `Deutsch`, `rag`),
  22+ of them already, no structure, casing inconsistencies, doing triple
  duty as subject, scope group, and implied context.

What references what (the blast radius that shapes every option):

- `prerequisites`, `cards`, `review_logs`, `sessions`, `token_embeddings`
  reference **`token_id` (ULID)** — untouched by any renaming.
- `agent_skills.token_slugs` stores **bare slug strings** (JSON arrays).
- Bridge/CLI address tokens by **bare slug** everywhere (`add-token`,
  `suggest-foundations`, `token prereq --token/--requires`, …); the bridge
  protocol is a stable contract.
- Curriculum re-import dedupes by regenerated base slug (plus
  `provider`/`topic_id` where present).
- `slug` is declared immutable; `embeddingContentForToken` includes
  `domain`, so domain moves change content hashes (and trigger re-embeds).

The titles ADR already fixed the *display* layer (`title`) and chose `/` as
the hierarchy separator for scoped domains, explicitly forward-compatible
with this ADR. The contexts ADR proposes work/school/private as an
orthogonal attribute. What remains is the structural question: **what is a
token's address, what is its identity, and what gives domains meaning?**

## Decision drivers

1. **Short, human slugs** — the slug should name the atom
   (`umkehrfunktion-nachweis`), not restate its classification.
2. **A taxonomy that may live** — hierarchies get refactored (doctor task
   `domains` exists precisely for that); reclassification must never break
   references or learning history.
3. **Legible graph at growing scale** — collapse/expand by hierarchy level,
   filter by subtree, color by top segment.
4. **Ontology as leverage, not bureaucracy** — standard anchors where they
   help (general knowledge, cross-learner matching later), freedom where
   reality is idiosyncratic (`docuware-cops/ai` fits no standard ontology).
5. **Contract stability** — bridge consumers and agent skills must keep
   working through the transition.
6. **Small steps** — each phase shippable, each reversible short of the
   final uniqueness switch.

## Options considered

| Option | Identity | Verdict |
|--------|----------|---------|
| **A. Status quo** — global domain-prefixed slugs | slug | The problem statement. Rejected. |
| **B. Hard composite identity** — `(domain, slug)` IS the identity | domain+slug | Bakes classification into identity: every taxonomy refactor (the *point* of hierarchical domains) changes identities and breaks references. Rejected. |
| **C. ULID identity + composite address** — `token_id` stays the identity; `(domain path, short slug)` becomes the human/API **address**; slug-storing references migrate to ids | ULID | Short slugs AND a living taxonomy; domain moves are metadata updates. Costs a reference migration and an addressing transition. **Chosen.** |
| **D. Globally-unique short slugs** (drop the domain prefix, keep global uniqueness) | slug | Cross-domain collisions (`einfuehrung`, `grundlagen`) come back as counter suffixes — the ugliness returns at scale. Rejected as the end state; acceptable interim while C's uniqueness switch is pending. |
| **E. Mandatory standard ontology** (Wikidata/Dewey/schema.org as the domain vocabulary) | — | Team and project knowledge has no home in any standard; curriculum content already follows LehrplanPLUS's own taxonomy. Rejected in favor of optional anchors (Decision 4). |

## Decision

**1. Identity stays with `token_id` (ULID); `(domain, slug)` becomes the
composite *address*.** Domains stop being part of what a token *is* and
remain part of where it *lives*. Moving a token to a better place in the
taxonomy is a metadata update: history, prerequisites, cards, embeddings
(modulo re-embed), and skills all survive because they reference the id.

**2. Slugs become short and domain-free — for new tokens first.**
`generateTokenSlug` stops prefixing the domain and stops deriving from the
question; it derives from the *title* (the human name, titles ADR
Decision 1), target ≤ 30 chars. Existing slugs stay valid indefinitely;
shortening the backlog is a `zam doctor identity` task run *after* Phase A
(below), never a bulk rename before it.

**3. Domains are `/`-separated paths with a metadata side-table.**
`tokens.domain` remains the TEXT source of truth (join-free, `/` semantics
from the titles ADR). A new `domain_meta` table enriches paths without
constraining them:

```sql
CREATE TABLE IF NOT EXISTS domain_meta (
  path         TEXT PRIMARY KEY,   -- "mathematik/realschule-9"
  label        TEXT,               -- localized display name, Unicode
  ontology_ref TEXT,               -- optional anchor, e.g. "wikidata:Q11348"
  notes        TEXT
);
```

Hierarchy is implicit in the path (no parent_id to keep consistent);
`domain_meta` rows are optional — an unlisted path is simply a plain
domain. The doctor `domains` task maintains both (renames update tokens +
meta in one transaction).

**Path roots are subject areas — never life areas or teams.** `mathematik`,
`ai`, `axon-ivy` are roots; "school", "work", `docuware-cops` are contexts
(contexts ADR) and must not appear in paths. The team-scoping example from
the titles ADR (`docuware-cops/ai`) therefore migrates into a context once
contexts ship; the `/` mechanics it introduced are unchanged.

**4. The ontology actively guides naming; the schema stays free.**
Whenever a domain path is created or restructured (imports, token
registration, doctor `domains`), the LLM-assisted flow **proposes
standard-aligned path names** — Wikidata labels for general knowledge,
the official curriculum taxonomy (LehrplanPLUS structure) for school
content — and records the matching `ontology_ref` anchor (Wikidata QID,
`lehrplanplus:<topic_id>`) alongside. Users can always override; team and
project domains simply have no anchor. Anchors stay additive: nothing
requires one, nothing breaks without one — but the *default pull* is
toward standard names, which is what makes the graph converge instead of
sprawl. (Language-neutral anchor ids also give localized labels for free
and let the future multi-learner tier match "same concept, different
learners".)

**5. Addressing in CLI/bridge: qualified first, bare tolerated.** The
canonical written form becomes `domain/path:slug` (e.g.
`mathematik/bruchrechnung:erweitern-kuerzen`; `:` separates path from slug since `/`
belongs to the path). All commands accept: a qualified address, a bare slug
(resolved iff globally unambiguous, error with candidates otherwise), or a
ULID. Bridge outputs gain the qualified `address` field additively.

**6. Reference migration before uniqueness change.**
`agent_skills.token_slugs` migrates to `token_ids` (M-series migration
translating existing arrays; the skill format keeps slugs only as display
hints). Only after that — and after qualified addressing ships — does a
final migration relax `UNIQUE(slug)` to `UNIQUE(domain, slug)`. Until then
new short slugs remain globally unique (Option D as interim), so nothing
depends on the switch date.

**7. Contexts stay orthogonal.** This ADR deliberately does **not** absorb
work/school/private into the domain hierarchy: context is *whose world*
(with language and sharing attributes), the domain path is *which
subject*. The contexts ADR's Open Question 1 is hereby answered:
no absorption.

## Migration & compatibility

- **Existing 253+ tokens:** untouched by default. Doctor tasks do the work
  incrementally and with confirmation: `domains` (restructure flat domains
  into subject paths, e.g. `rag` → `ai/rag` — team membership like
  `docuware-cops` moves to the *context* attribute, never into the path),
  `identity`
  (shorten legacy slugs, updating nothing but the slug since references are
  id-based after Phase A).
- **Re-embeds:** domain moves change `embeddingContentForToken` output →
  affected tokens re-embed automatically via hash staleness; a large
  restructuring pass should mention `zam token reembed` in its summary.
- **Curriculum re-import:** keeps `provider`/`topic_id` matching (primary),
  base-slug matching remains as fallback during the interim.
- **Bridge consumers:** bare-slug addressing keeps working through the
  whole transition; the qualified form is additive. The only breaking
  change ever is the uniqueness relaxation (Phase D), gated on consumers
  being qualified-address-clean.

## Open questions

1. **Anchor payoff validation** — before investing in Wikidata tooling,
   validate one concrete use: cross-learner concept matching in the
   multi-learner tier, or localized domain labels in the graph. If neither
   lands, anchors stay a dormant column (cheap either way).
2. **Path depth convention** — recommend ≤ 3 levels in docs; enforce
   nothing. Revisit when real trees exist.
3. **Bare-slug deprecation horizon** — whether bare slugs in *skill files
   and scripts* should warn after Phase C, or stay silently supported.

## Scope and delivery plan

- **Phase 0 — this ADR** proposed for sign-off.
- **Phase A — reference migration:** `agent_skills` slugs → token_ids
  (M-series + verification); qualified `address` field added to bridge
  outputs (additive).
- **Phase B — path domains + `domain_meta`:** `/`-path support end-to-end
  (list/filter/graph grouping exist since the titles ADR), `domain_meta`
  table, doctor `domains` task, imports emit path domains.
  **Priority decision:** B including a first doctor-`domains`
  restructuring pass over the live base runs as early as possible — the
  graph-legibility pain is the driving complaint. Prerequisite: the doctor
  scaffolding from the titles ADR exists first.
- **Phase C — short slugs for new tokens:** title-derived generation,
  qualified addressing accepted everywhere, doctor `identity` task for the
  backlog.
- **Phase D — uniqueness switch:** `UNIQUE(domain, slug)` replaces global
  slug uniqueness once A–C are verified in the field.
- **Phase E — graph level-of-detail:** collapse/expand by path segment,
  color by top level, breadcrumb filter (may run parallel to C/D; pure UI).

## Out of scope

- Contexts (own ADR; explicitly not absorbed here).
- Multi-learner sync mechanics (own ADR; this ADR only ensures ULIDs remain
  the sync anchor and anchors *could* aid concept matching).
- Automatic ontology classification of existing content (doctor proposes,
  humans confirm — no autonomous re-taxonomizing).
- Renaming the `domain` column or introducing a separate `category` field
  (rejected in the titles ADR; still rejected).

## Consequences

- New tokens immediately get dignified addresses:
  `mathematik/bruchrechnung:erweitern-kuerzen` instead of a 60-char mangled
  question — and the graph gains a real hierarchy to fold.
- Taxonomy work becomes *safe, routine maintenance* (doctor + id-based
  references) instead of a breaking event — which is what makes the
  owner's ontology ambition practical at all.
- Two migrations carry real risk and are therefore isolated and gated:
  agent-skills reference translation (Phase A) and the uniqueness switch
  (Phase D); everything between is additive.
- The address grammar (`path:slug`) is one more concept for agents/users —
  mitigated by bare slugs continuing to work and by AGENTS.md documenting
  the form once it ships.
- `domain_meta` may accumulate stale rows when paths change outside the
  doctor (direct SQL); accepted — it is advisory metadata, and the doctor
  reconciles.
