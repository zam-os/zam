# Hierarchical Domain Ontology and Composite Token Identity

**Status:** Seed note — deliberately NOT drafted yet. This file collects the
raw material so a **fresh session with full context budget** can think it
through from first principles. It is intentionally kept out of the ADR index
until a real draft exists.
**Date:** 2026-07-04 (note)
**Origin:** Thomas, during the titles/domains review — "Es scheint mir, das
Thema ist groß genug für einen eigenen ADR."
**Related:**
[2026-07-04-human-friendly-titles-and-prefixed-domains.md](2026-07-04-human-friendly-titles-and-prefixed-domains.md)
(Open Questions 1 + 4) · knowledge-contexts ADR (drafted separately) ·
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)

---

## The idea, in the owner's words (condensed)

Use **domain + slug as the identifier**. Then the slug can be short and the
domain long and precise. Domains would be hierarchical — ideally aligned
with **standard ontology titles** for general knowledge. That could give a
much better Knowledge Graph ("es wird aktuell schon unübersichtlich"),
different filtering, and other benefits that come from hierarchy.

## What a fresh session should think about (unordered, no decisions here)

- **Composite identity `(domain, slug)`** — what actually breaks?
  Prerequisites and cards reference `token_id` (ULIDs) and are untouched;
  but `agent_skills.token_slugs`, bridge payloads, dedup-by-slug during
  imports, `generateTokenSlug`'s domain prefixing and 60-char budget, and
  the "slug is immutable" rule all assume globally-unique bare slugs.
  Would slugs become unique only *within* a domain? Can a token move
  domains without changing identity?
- **Ontology choice for general knowledge**: Wikidata QIDs? schema.org?
  Dewey-like taxonomies? German school subjects (LehrplanPLUS structure) vs.
  international standards? Or: free-form hierarchy with *optional* ontology
  anchors instead of a mandated vocabulary? Language-neutral IDs with
  localized labels would fit the per-area-language decision.
- **Relationship to what already shipped/decided**: the `/` separator
  (titles ADR Decision 4) is forward-compatible on purpose; contexts
  (work/school/private) may be the topmost level OR an orthogonal attribute
  — the knowledge-contexts ADR takes the orthogonal-attribute position as
  an interim; this ADR may confirm or subsume it.
- **Graph UX**: hierarchy enables level-of-detail (collapse subtrees),
  breadcrumb filtering, coloring by top level. What does "unübersichtlich"
  concretely need first?
- **Migration**: 253+ live tokens with flat domains and long domain-prefixed
  slugs; a rename/re-domain pass is a natural `zam doctor domains` job; slug
  shortening however touches identity — needs the composite-identity answer
  first.
- **Embeddings/search**: domain is part of `embeddingContentForToken` —
  richer hierarchical domains change semantic weight; re-embed implications.
- **Multi-learner**: shared libraries need stable cross-machine references —
  composite identity vs. ULIDs as the sync anchor.

## Explicitly NOT to do in this note

No decisions, no options table, no schema sketches. Fresh eyes first.
