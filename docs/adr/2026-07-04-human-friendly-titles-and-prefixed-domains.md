# Human-friendly Titles and Prefixed Domains for the Knowledge Graph

**Status:** Implemented (v0.7.2 — titles, both search legs, `/` scoping,
display fallback, and `zam doctor` with titles/texts/duplicates/domains;
the contexts/identity doctor tasks belong to their own ADRs)
**Date:** 2026-07-04
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md) ·
[2026-07-03-rag-semantic-token-search.md](2026-07-03-rag-semantic-token-search.md) ·
[semantic prerequisite suggestions plan](../plans/2026-07-04-semantic-prerequisite-suggestions.md)

---

## Context

The 3D Knowledge Graph (experimental feature in `desktop/src/main.ts`)
visualizes tokens as nodes with labels, edges for prerequisites/dependents,
and domain-based filtering/coloring.

Currently, node labels are derived from the technical `slug` field:

- Slugs are ASCII-only (`slugify` strips anything outside `[a-z0-9]`).
- They are domain-prefixed (e.g.,
  `mathematik-realschule-9-iii-wie-weist-man-mit-der-umkehru`).
- Umlauts and non-Latin scripts (Chinese, Japanese, Arabic, …) are mangled or
  lost during import/generation.
- When a domain filter is active, we apply `getShortSlug` stripping, but the
  base remains machine-oriented and often unreadable.

This makes the graph hard to understand, especially for curriculum imports
(Lehrpläne with natural German) and custom/team content (e.g. internal
DocuWare COPS knowledge).

Tokens already distinguish `slug` (stable technical ID), `concept` (full
reference answer — intentionally the "spoiler") and `question` (active-recall
prompt — must not spoil). There is no dedicated display name.

Domains are flat strings used for slug prefixes, graph filtering, and
coloring. For team/project content a flat list does not scale.

Since v0.7.0/v0.7.1 tokens are also **semantically indexed**: lexical search
(`findTokens`), embeddings (`embeddingContentForToken` → content hash →
`token_embeddings`), duplicate detection, and foundation suggestions all
derive from token text fields. Any new human-meaning field must take a
position in that pipeline — a display name that search cannot see would be a
UX contradiction.

The graph must remain usable offline and without local AI. The overall goal
is **understandability** of the personal/team knowledge structure.

## Decision

1. **Introduce a dedicated `title` column on `tokens`** (nullable TEXT,
   idempotent M-series migration):
   - Human-friendly natural language, full Unicode (umlauts, CJK, Arabic).
   - **Never** includes a domain prefix, and **no domain echo**: the title
     must not repeat the domain name ("Node Drain Protection", not
     "Axon Ivy Node Drain Protection" inside `axon-ivy`). Context comes from
     the domain itself, which every surface may always display — a domain is
     a *name of an area*, it never spoils an answer. This is a generation
     rule (curriculum prompt, doctor `titles` task), not a renderer hack.
   - Soft length target ≤ 80 characters (enforced in generation prompts,
     ellipsized by renderers).
   - Sources: LLM during curriculum import, user-provided
     (`zam token register --title` / `zam token edit --title`), or absent.
   - Used as the primary label in the 3D graph and other display surfaces.
   - **Not** shown during active recall/reviews (only `question` + revealed
     `concept`) — a title is a *name*, not the answer, but reviews stay
     title-free by design.

2. **`title` is part of search — both legs.** The display name of a token
   must be findable:
   - `findTokens` (the lexical leg) matches `title` alongside slug, concept,
     and domain.
   - `embeddingContentForToken` appends the title as a fourth line
     (`concept\nquestion\ndomain\ntitle`, empty string when null), so
     semantic search, dedup, and foundation suggestions see it too.
   - Consequence: content hashes change for **every** token → one full
     re-embed after upgrade (self-healing via the existing staleness
     mechanism; `zam token reembed` / the doctor task below completes it in
     one pass; release notes must say so).

3. **Keep `slug` as the immutable technical key** (ASCII, domain-prefixed,
   stable for references, prerequisites, agent-skill links, dedup).

4. **Domain scoping uses `/` as the hierarchy separator** (revised from the
   draft's dash convention):
   - Example: `docuware-cops/ai`, `docuware-cops/security`; arbitrary depth
     allowed (`schule/mathematik/realschule-9` is legal).
   - A selected prefix matches `exact` or `startsWith(prefix + "/")` — no
     heuristics, no ambiguity against dash-containing names like
     `mathematik-realschule-9`.
   - The domain selector groups by first segment; existing flat domains
     remain valid unscoped names.
   - `slugify()` folds `/` to `-` when domains are embedded in slugs.
   - Rationale for the revision: with dashes there is no machine-decidable
     boundary between "prefix" and "word" (`docuware-cops-ai` — is the group
     `docuware`, `docuware-cops`, or `docuware-cops-ai`?), so every surface
     would need its own guessing rule.

5. **One display-fallback rule everywhere: `title`, else short slug.** A
   single shared helper (used by the graph, lists, and any future surface)
   renders `title ?? shortSlug(slug, activeDomainScope)`. `concept` is never
   used as a label — it is long and a spoiler. Until backfill runs, old
   tokens simply look like today, no worse. Because titles carry no domain
   echo (Decision 1), surfaces that need context show the **domain alongside
   the title** (badge/color/tooltip) — always allowed, never a spoiler.

6. **Knowledge-base maintenance becomes a first-class command: `zam doctor`.**
   Structural change is handled by schema migrations (M-series); **content**
   change gets its own home. `zam doctor` diagnoses the knowledge base and
   applies LLM-assisted, user-confirmed fixes, organized as tasks:
   - `titles` — backfill missing titles and rework weak ones (domain echoes,
     question stumps like "RAG What Is", inconsistent casing, concept-prefix
     copies), with the same quality bar as import-time generation
     (thoughtful naming, content-appropriate language — not a cheap string
     transform).
   - `texts` — repair legacy umlaut folding from before the `slugify()` fix,
     in slugs **and** in prose fields: existing data contains ASCII-folded
     umlauts inside `question`/`concept`/`context` too ("Ueber welche
     Wege…"). Infer the intended characters, consult stored sources where
     inference is unsure. Repaired prose changes content hashes, so affected
     tokens re-embed automatically via the staleness mechanism.
   - `duplicates` — surface semantic duplicates (reusing the dedup
     infrastructure) for review and merge/deprecation.
   - `domains` — rename/unify domains (e.g. migrate a team's ad-hoc names
     into a `/`-scoped hierarchy), updating dependent slugs is explicitly
     NOT done (slugs stay immutable; only the `domain` field moves).
   - Principle: **diagnose first, never write without confirmation**; each
     task reports what it would change before it changes it. Interaction
     model (interactive vs. `--fix` vs. `--dry-run` default) is specified in
     the implementation plan, not here.
   - Naming: `doctor` follows the established check-and-heal pattern
     (`brew doctor`, `flutter doctor`, `npm doctor`) — one memorable entry
     point for every future knowledge-base update a new feature requires.

7. **Language:** `system.locale` is the **default** authoring language for
   titles, questions, and concepts — not a global mandate. Content areas may
   deliberately use another language: the DocuWare COPS knowledge is
   authored in English by explicit owner decision (an 8-nationality team
   reads it), while school content stays German. Generation and the doctor
   `titles` task must follow the language already established in a token's
   content/area rather than blindly applying the locale. A first-class
   work-vs-private *context* concept does not exist in the token model yet —
   see Open Questions.

8. **Visual metaphors** (box = foundation, cone = higher abilities, small
   sphere = focus) and a side-oriented default camera support readability,
   but the primary lever is the human title. (Design note, not an
   architectural decision.)

## Post-review deltas — what changes for the current implementation

The first implementation pass (pre-review) needs these concept-level
adjustments:

1. `findTokens` gains `title` matching; `embeddingContentForToken` gains the
   title line — including tests, and accepting the one-time full re-embed.
2. Domain scoping switches from dash examples (`docuware-cops-ai`) to the
   `/` separator (`docuware-cops/ai`) in filtering logic, selector grouping,
   `--domain-prefix` semantics (`startsWith(prefix + "/")`), and docs.
3. The display fallback is unified to `title ?? shortSlug` via one shared
   helper — no `concept`-derived labels anywhere.
4. The planned title backfill ships as `zam doctor` (task `titles`), not as
   a one-off command; legacy umlaut repair is the `texts` doctor task
   (slugs AND prose fields) instead of import-time legacy matching.
5. Bridge/protocol changes are listed explicitly as contract additions:
   `title` field in token payloads (additive), `list-tokens --domain-prefix`
   (slash semantics), `register`/`edit` `--title` flags.
6. Title generation prompts gain the **no-domain-echo rule**; surfaces show
   the domain alongside the title where context is needed (badge/tooltip),
   instead of stripping words out of titles at render time. Existing titles
   with domain echoes (~23% of the current base, e.g. "Axon Ivy …" inside
   `axon-ivy`) are reworked by the doctor `titles` task, not by hand.

## Open questions

1. **Composite identity `domain + slug` with ontology-based hierarchical
   domains.** Shorter slugs, longer/preciser domains (ideally aligned with a
   standard ontology for general knowledge), richer graph filtering — big
   enough for **its own ADR**; explicitly out of scope here. Decision 4's
   `/` separator is forward-compatible with it.
2. **Doctor interaction model & task plumbing** (interactive flow, `--fix`,
   dry-run default, task discovery) — to be fixed in the implementation
   plan.
3. **Title collisions in the graph** — two tokens may share a title;
   disambiguation (domain badge/tooltip) is a UI concern to settle during
   graph polish.
4. **Work vs. private context as a first-class concept.** Language choice
   (Decision 7), sharing boundaries (multi-learner ADR), and graph filtering
   all hint at the same missing notion: tokens belong to a *context* (work
   team, school, private) that today is only implied by domain names. The
   hierarchical-domain/ontology ADR (Open Question 1) should treat context —
   and per-context language — as a candidate first-class attribute.

## Consequences

### Positive

- The Knowledge Graph becomes genuinely navigable ("I can see what I know
  about topic X at a glance"), including non-Latin content.
- The displayed name is findable — lexically and semantically — keeping
  search, dedup, and foundation suggestions coherent with what users see.
- Team/company content is cleanly namespaced (`docuware-cops/…`) with an
  unambiguous, future-proof separator.
- Slugs remain perfect technical identifiers; display concerns are isolated
  in `title`.
- The knowledge base gets a durable update/bugfix story (`zam doctor`) —
  needed again for every future content-shaping feature, and the honest
  answer to "a bug produced bad data" (legacy umlaut slugs) while the user
  base is still small.
- Offline/local-only usage unaffected; without AI, titles are simply absent
  and the fallback renders.

### Negative / trade-offs

- Another field to maintain across creation paths (curriculum prompt, manual
  registration, splits, foundations, source import) and serializations
  (bridge protocol — additive, `NeighborhoodToken`, exports).
- One-time full re-embed after upgrade (bounded, self-healing, but real
  compute on large bases).
- Existing tokens show slug-derived labels until `zam doctor titles` runs.
- Domain hierarchy remains a convention (not a schema constraint); deeper
  ontology alignment is deferred to its own ADR.
- LLM-generated titles can occasionally be imperfect or mildly spoilery;
  good naming is prioritized over perfect spoiler avoidance.

## Alternatives considered

- **Use `concept` directly as graph label** — too long, spoils answers.
- **Derive title purely from slug** — still ASCII, defeats the purpose.
- **Dash-prefixed domain scoping** (the draft's original convention) — no
  machine-decidable prefix boundary; every surface needs a guessing rule;
  replaced by `/`.
- **Separate "category" field besides domain** — complexity without benefit;
  scoped domains already provide grouping.
- **Unicode/human-friendly slugs** — breaks URL/reference/dedup assumptions.
- **Import-time legacy-slug matching** for the umlaut change — patches one
  entry path instead of fixing the data; superseded by the `slugs` doctor
  task.
- **Always require LLM for titles** — violates the offline requirement.
- **A one-off `retitle` command** — every future feature would add another
  one-off; a single maintenance entry point (`doctor`) scales with the
  roadmap.
