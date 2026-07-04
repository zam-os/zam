# Knowledge Contexts: Work, School, Private

**Status:** Proposed (draft)
**Date:** 2026-07-04
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-04-human-friendly-titles-and-prefixed-domains.md](2026-07-04-human-friendly-titles-and-prefixed-domains.md)
(Decision 7, Open Question 4) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)
(data classes / sharing circles) ·
[2026-07-04-hierarchical-domain-ontology-and-token-identity.md](2026-07-04-hierarchical-domain-ontology-and-token-identity.md)
(seed note — may later subsume this)

---

## Context

One learner, several lives. The same knowledge base currently holds DocuWare
COPS platform knowledge (authored in **English** by explicit decision — an
8-nationality team should be able to read it), German school curricula for
the family, and private interests. Today these worlds are distinguishable
only by *guessing from domain names* (`axon-ivy` is probably work,
`Deutsch` is probably school).

Three recent decisions all tripped over this missing notion:

1. **Language** (titles ADR, Decision 7): `system.locale` had to be demoted
   from "mandate" to "default" because the COPS area is deliberately
   English. The *rule* ("this area is English") currently lives nowhere —
   it exists only as owner intent.
2. **Sharing** (multi-learner ADR): knowledge is shared with a *circle* —
   the COPS team should see COPS tokens, never the kids' school progress or
   private notes. The natural sharing boundary is exactly this missing
   concept.
3. **Graph overview**: the graph is getting crowded; the coarsest useful
   filter ("show me only work") is not expressible.

Domains cannot carry this cleanly: a domain is a **subject area**
(`mathematik`, `kubernetes`), and subjects are context-ambiguous — math can
be school *and* work. Overloading domains with context semantics is exactly
the kind of implicit convention the titles ADR just removed for prefixes.

The hierarchical-ontology ADR (seed note) may eventually restructure
domains entirely; whatever we do here must be **small, additive, and
forward-compatible** with that outcome.

## Decision drivers

1. **Make existing owner intent explicit** — "COPS is English", "school is
   shared with the family circle" should be data, not memory.
2. **Orthogonality** — context (whose world) ⊥ domain (which subject).
3. **Smallest additive change** — no identity changes, no domain
   restructuring, no schema churn ahead of the ontology ADR.
4. **Sharing-ready** — the multi-learner service needs a boundary object to
   publish by.
5. **Graceful absence** — tokens without a context behave exactly like
   today; single-context users never need to see the feature.

## Options considered

| Option | Shape | Verdict |
|--------|-------|---------|
| **A. Context = top domain level by convention** (`work/…`, `school/…`) | No schema change; reuses the `/` separator | Conflates context with subject taxonomy (`work/mathematik` vs `school/mathematik` duplicates subjects under two roots); no place to attach attributes like language; a rename-only convention — rejected as the primary mechanism, though the ontology ADR may revisit it. |
| **B. `contexts` table + nullable `tokens.context_id`** | Context as a small first-class entity with attributes (language, sharing default) | Additive, one M-migration; attributes have a home; the sharing boundary becomes a real object; forward-compatible (the ontology ADR can absorb or keep it). **Chosen.** |
| **C. Settings-only mapping** (domain-prefix → language in `settings`) | Zero schema | Solves only the language symptom; invisible to graph filtering and sharing; another implicit convention. Rejected. |

## Decision (proposed)

**1. Introduce `contexts` as a small first-class entity.**

```sql
CREATE TABLE IF NOT EXISTS contexts (
  id         TEXT PRIMARY KEY,            -- ULID
  name       TEXT NOT NULL UNIQUE,        -- "work-docuware", "school", "private"
  label      TEXT,                        -- display name, Unicode
  language   TEXT,                        -- BCP-47 ("en", "de"); NULL = system.locale
  visibility TEXT NOT NULL DEFAULT 'private'
             CHECK (visibility IN ('private', 'circle')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

plus nullable `tokens.context_id REFERENCES contexts(id)` (idempotent
M-series migration; `SELECT *` cost is one small TEXT column). `NULL`
context = today's behavior everywhere.

**2. Context is orthogonal to domain.** A token's domain stays the subject
(`mathematik`); its context says whose world it belongs to (`school`).
Nothing about slugs, identity, or domain names changes.

**3. Language resolution becomes explicit:** generation paths (curriculum
import, title generation, `zam doctor titles`) use
`context.language ?? system.locale`. This turns the COPS-is-English rule
from owner memory into data, and completes titles-ADR Decision 7.

**4. Context is the coarsest filter.** `zam token list --context`, bridge
`list-tokens` context field (additive), graph: context selector above the
domain selector. The review queue gains an *optional* `--context` scope
(default remains: everything, interleaved — learning across contexts is a
feature, not a bug).

**5. Context is the sharing anchor for the multi-learner tier.** The sync
service publishes a library *per context* (`visibility: 'circle'` marks
candidates); private contexts never leave the machine. Details stay in the
multi-learner ADR — this ADR only provides the boundary object it was
missing.

**6. Assignment is maintained by `zam doctor` (task `contexts`).** The
doctor proposes context assignments from domain names and content language
(LLM-assisted, confirmed by the user, like every doctor task), so the
existing 253-token base gets classified without hand-editing. New tokens:
`--context <name>` flags on register/import wizards, plus an optional
`context.default` setting for "I'm currently working".

**7. Bridge/protocol changes are additive:** `context` object in token
payloads, `list-contexts` command, `--context` filters. No breaking
changes.

## Open questions

1. **Absorption by the ontology ADR** — if domains become a real hierarchy,
   contexts could become its roots or stay orthogonal facets. The seed note
   lists this; `contexts` as a table survives either outcome (worst case:
   a doctor task migrates assignments into the hierarchy).
2. **Active-context UX in the Studio** — a visible switcher vs. implicit
   default; needs a design pass, not an architecture decision.
3. **Per-context review pacing** — should FSRS queues weight contexts
   differently (work sprints vs. school terms)? Deliberately out of scope
   here; revisit with real usage.

## Scope and delivery plan

- **Phase 0 — this ADR** proposed for sign-off.
- **Phase A — schema + kernel + CLI filters** (contexts table, `context_id`,
  list/register/edit support, language resolution in generation paths).
- **Phase B — doctor task `contexts`** (LLM-assisted backfill of the
  existing base).
- **Phase C — Studio/graph selector** (context above domain).
- **Phase D — sharing anchor** lands with multi-learner Phase B (library
  publish per context).

## Out of scope

- Permissions/roles (multi-learner ADR owns them).
- Domain restructuring or ontology alignment (seed-note ADR).
- Per-context FSRS parameters or scheduling changes.
- Multiple contexts per token (a token belongs to at most one; shared
  concepts can exist per context — dedup will flag true duplicates).

## Consequences

- The three dangling threads — per-area language, sharing boundary, coarse
  graph filter — get one small, common answer instead of three conventions.
- One new table + one nullable column; every existing flow is unaffected
  until a context is assigned (strict opt-in).
- The multi-learner service gains its publish boundary before it is built —
  no retrofit.
- A future ontology decision is not constrained: contexts are data and can
  be migrated by a doctor task if the hierarchy absorbs them.
- Slight modeling risk: "at most one context per token" may pinch for truly
  shared concepts (e.g. `git` used at work and privately) — mitigated by
  dedup-aware duplication per context, and revisitable once real friction
  appears.
