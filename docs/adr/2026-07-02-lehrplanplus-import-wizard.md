# LehrplanPLUS Curriculum Import Wizard

**Status:** Proposed
**Date:** 2026-07-02
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-30-learning-content-studio.md](2026-06-30-learning-content-studio.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md)

---

## Context

The Learning Content Studio (0.6.0) lets a learner build cards without a
terminal, and its import pipeline turns curriculum text, files, scans, or web
links into reviewed cards. But every import path still starts with the learner
already knowing *what* to import: they must find the right curriculum, copy the
text or paste a URL, and choose a category. The Studio ADR explicitly deferred
"automatically fetching the LehrplanPLUS web page" out of 0.6.0.

The people ZAM most wants to reach here — a Bavarian pupil, a parent, a teacher —
do not think in pasted text and URLs. They think: *"Realschule, 9. Klasse,
Mathematik."* They want to point at their curriculum and pick the topics their
class has actually started.

This ADR proposes a guided **Import wizard** that walks the official curriculum
taxonomy step by step and imports only the selected topics, as an *alternative*
entry point to the existing manual import. **LehrplanPLUS (Bayern)** — the
Bavarian state curriculum published by the ISB at
<https://www.lehrplanplus.bayern.de/> — is the first provider. The wizard is
deliberately not hard-coded to Bavaria: the country/region hierarchy exists so
that other curricula (other Bundesländer, other countries) become additional
**plugins** behind the same contract.

### Current import architecture (forces at play)

- **Source adapters** — [`src/cli/adapters/source-reader.ts`](../../src/cli/adapters/source-reader.ts):
  `readWebLink` fetches and sanitizes a URL with SSRF protection (`isSafeUrl`
  blocks private/reserved ranges and credentials), a 2 MB cap, a 10 s timeout,
  content-type checks, and `cleanHtml`; plus `readLocalFile` and `readImageOCR`.
- **Bridge pipeline** (JSON-only) — [`src/cli/commands/bridge.ts`](../../src/cli/commands/bridge.ts):
  `personal-source-import` fetches text and upserts a row in `sources`;
  `personal-card-import-curriculum` asks the text AI for atomic card proposals;
  `personal-source-confirm-import` (`confirmSourceImport`) persists the reviewed
  proposals, deduplicating against existing tokens and linking them to the
  source via `token_sources`.
- **Data model** — `sources (id, type, uri, content)`, the `token_sources`
  mapping, and tokens/cards. The 0.6.1 `source_link` fallback surfaces the
  originating source URI on imported cards, so provenance already flows back to
  the UI.
- **Desktop** — [`desktop/src/learning-content.ts`](../../desktop/src/learning-content.ts)
  and an "Import Curriculum Standard" modal drive the manual flow today.

The wizard needs **no new persistence model**: it is a new front door plus a
provider that resolves a taxonomy selection into source text, which then flows
through the pipeline above. It does not replace the review-before-save step.

## Product principles (extending the Studio ADR)

1. **Navigation over knowledge.** The learner never needs to know the
   curriculum's internal structure or URL scheme. Each step is enumerated for
   them from the previous choice.
2. **Import only what is selected.** The default selection is empty. The learner
   picks topics; nothing is added implicitly. Returning later to add topics the
   class has newly started is a first-class, repeatable action.
3. **Stay grounded in the source.** Only official LehrplanPLUS content for the
   selected Lernbereich is imported. The AI may phrase questions and reference
   answers but must not introduce topics outside the selection (inherits the
   Studio's source-grounding principle).
4. **Idempotent re-import.** Re-selecting a topic reuses and links existing
   tokens instead of duplicating them, and cards retain their LehrplanPLUS
   provenance.
5. **Provider-agnostic core.** The wizard UI and the bridge contract know only
   the generic taxonomy shape (country → region → school type → grade → subject
   → topics). All provider-specific navigation and parsing lives behind a plugin
   interface.
6. **Keep the manual paths.** The wizard is an alternative to — not a
   replacement for — the existing paste / file / scan / URL import.

## Decision

### 1. A Curriculum Provider Plugin interface

Introduce a registry of **curriculum providers**. Each provider implements a
small navigation contract whose calls mirror the wizard's dependent steps: every
`list*` call returns the options for the *next* step, keyed by the selections
made so far.

```ts
// Illustrative shape — refined during Phase 1.
interface CurriculumProvider {
  id: string;                 // "lehrplanplus-bayern"
  country: string;            // ISO country: "DE"
  region: string;             // "BY" (Bayern)
  label: string;              // "LehrplanPLUS (Bayern)"

  listSchoolTypes(): TaxonomyNode[];                       // Realschule, Gymnasium, …
  listGrades(schoolType: string): TaxonomyNode[];          // 5 … 10
  listSubjects(schoolType: string, grade: string): TaxonomyNode[];
  listTopics(sel: SubjectSelection): TopicNode[];          // Lernbereiche / Kompetenzbereiche

  resolveTopic(topic: TopicNode): Promise<ResolvedSource>; // → { uri } | { text }, + provenance
}

interface TaxonomyNode { id: string; label: string; }
interface TopicNode extends TaxonomyNode { sourceRef: string; } // stable LehrplanPLUS URL/id
interface ResolvedSource { uri?: string; text?: string; provider: string; topicId: string; }
```

`Land` (step 1) and `Bundesland` (step 2) are resolved from the set of
registered providers (`country` / `region`), so adding a provider automatically
extends the top two levels. Today only **DE → Bayern → LehrplanPLUS** is
populated.

### 2. The wizard steps map 1:1 onto the contract

| Step | Choice | Populated by | Notes |
|------|--------|--------------|-------|
| 1 | Land | registered providers' `country` | today: only DE |
| 2 | Bundesland | providers filtered by country | may also offer a nationwide curriculum where one exists |
| 3 | Schulform | `listSchoolTypes()` | depends on the chosen provider |
| 4 | Jahrgang | `listGrades(schoolType)` | |
| 5 | Fach | `listSubjects(schoolType, grade)` | |
| 6 | Themen | `listTopics(selection)` | **multi-select, empty by default** |

Later steps stay disabled until the earlier ones are chosen. Step 6 is a
multi-select list of Lernbereiche so the learner adds only what the class has
reached, and can reopen the wizard later to add more.

### 3. Taxonomy acquisition — the central open question

How the provider learns the taxonomy (steps 3–6) is the key trade-off:

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A. Live-scrape** | Parse LehrplanPLUS navigation on demand at each step | Always current | Fragile to markup changes; slow; every step hits the network; hard to test |
| **B. Curated manifest** | Ship a static taxonomy + topic→URL map with ZAM | Fast, offline navigation, testable | Drifts from the site; needs a refresh story |
| **C. Hybrid (recommended)** | Bundled manifest for the taxonomy; live SSRF-safe fetch of the *selected topic's content* at import time | Stable navigation + fresh content; only fetches what the learner imports | Still needs manifest maintenance; two sources of truth |

**Recommendation: C.** The LehrplanPLUS structure (Schularten, Fächer,
Jahrgangsstufen, Lernbereiche) is comparatively stable and maps cleanly to a
versioned manifest, while the actual competency text is fetched only for the
handful of topics the learner selects, through the existing safe web adapter.

### 4. Reuse the existing import pipeline

`resolveTopic` yields a stable LehrplanPLUS URL, which flows straight into the
current pipeline — no bypass of review:

```
wizard selection
  → resolveTopic(topic)  → LehrplanPLUS URL
  → personal-source-import --type web --uri <url>     (SSRF-safe fetch + sources row)
  → personal-card-import-curriculum                   (text AI → atomic proposals)
  → learner reviews / edits proposals in the Studio
  → personal-source-confirm-import                    (dedup + token_sources link)
```

One selected topic = one `sources` row and one review batch. Several selected
topics run sequentially (or as one grouped review), each retaining its own
provenance. The `sources.uri` is the canonical LehrplanPLUS URL, so the 0.6.1
`source_link` fallback links every generated card back to its exact Lernbereich.

### 5. Bridge contract (JSON-only)

New machine-facing commands, all emitting JSON like the rest of `zam bridge`:

- `curriculum-list-providers` → `[{ id, country, region, label }]`
- `curriculum-list-level --provider <id> --level <schoolType|grade|subject|topics> --selection <json>`
  → `[{ id, label }]` (or `[{ id, label, sourceRef }]` for topics)
- `curriculum-resolve-topics --provider <id> --topics <json>` → `[{ topicId, uri }]`

The resolved URIs are then handed to the existing `personal-source-import` /
`personal-source-confirm-import` commands. No existing contract changes.

### 6. Where it lives

- Provider registry and the LehrplanPLUS plugin under a new
  `src/cli/curriculum/` module (peer to `src/cli/adapters/`), keeping the
  AI-agnostic kernel free of site-specific logic.
- The bundled taxonomy manifest ships as package data with a version/stamp.
- A new desktop wizard module plus a modal entry alongside the existing
  "Import Curriculum" action in `learning-content.ts`. Wizard **labels** are
  localized in all seven locales; imported **content stays in its source
  language** (German for Bayern).

## Decisions to resolve (before or during implementation)

1. **Taxonomy strategy** — confirm A vs. B vs. C (recommendation: C).
2. **Manifest freshness** — bundled-only with manual updates, a generator
   script, or a periodic CI refresh? Stamp the manifest with a captured-on date
   and the LehrplanPLUS revision it reflects.
3. **Terms of use & politeness** — LehrplanPLUS is public ISB content; confirm
   reuse terms, keep the existing polite `User-Agent`
   (`ZAM-Content-Studio/x.y`), throttle requests, and cache fetched pages.
4. **Multi-topic import** — one transaction per topic vs. one combined batch,
   and how partial failures surface to the learner.
5. **How much of a topic to send the AI** — full Lernbereich page vs.
   Kompetenzerwartungen only, weighed against the text model's token budget.
6. **"Add topics later"** — persist the learner's navigated path for quick
   re-entry, or re-navigate from the manifest each time.
7. **Provenance granularity** — encode `provider` + `topicId` in the
   `sources.uri` so the `source_link` fallback resolves to the precise topic.

## Scope and delivery plan

Implementation does **not** start now; this ADR reaches a PR for review and is
not yet merged.

- **Phase 0 — Decisions & contracts (this ADR).** Resolve the questions above;
  freeze the provider interface and the three bridge command shapes.
- **Phase 1 — Provider registry + navigation.** Implement the registry, the
  LehrplanPLUS provider backed by a bundled manifest, and the
  `curriculum-list-*` / `curriculum-resolve-topics` bridge commands. No live
  fetch yet — `resolveTopic` returns a URL.
- **Phase 2 — Desktop wizard.** The six-step UI wired to the navigation
  commands, feeding selected URLs into the existing review/confirm flow.
- **Phase 3 — Live content + provenance.** Fetch the selected topic through the
  safe web adapter, dedup and link provenance, and ship the repeatable
  "add topics later" flow.
- **Phase 4 (future) — Second provider.** Add another Bundesland or country to
  validate that the abstraction holds.

## Testing strategy

- **Kernel / bridge:** provider registry, level-by-level navigation against a
  fixture manifest, JSON contracts, dedup on re-import, and `source_link`
  provenance after a wizard-driven import.
- **Adapter:** reuse the `source-reader` suite; add LehrplanPLUS URL resolution
  and page parsing against **saved HTML fixtures** — tests never hit the live
  site.
- **Desktop:** step gating (later steps disabled until earlier chosen),
  multi-select topics, empty/loading/error states, seven-locale labels, and the
  Vite/TypeScript build.
- **Manual smoke test:** DE → Bayern → Realschule → 9 → Mathematik → pick one or
  two Lernbereiche → review → save → run a learning session; re-run the same
  selection to confirm dedup rather than duplication.

## Out of scope

- Curriculum providers beyond LehrplanPLUS / Bayern (future plugins).
- PDF or office-document extraction (inherits the Studio ADR).
- Imports without an explicit user action, and scheduled curriculum sync.
- Translating curriculum content — it stays in the source language.
- Editing a shared or global token catalog.

## Consequences

- Dramatically lowers the barrier to a learner's first meaningful content:
  "pick my school, grade, subject, topics" instead of "find and paste text."
- Establishes a **curriculum provider-plugin pattern** that mirrors the AI
  provider/harness direction of [2026-06-23](2026-06-23-pluggable-providers-and-agent-harnesses.md),
  making non-Bavarian curricula additive.
- Reuses the whole 0.6.0 import pipeline and 0.6.1 provenance fix; the net-new
  surface is navigation, a bundled manifest, and the wizard UI.
- Adds a maintenance surface — the taxonomy manifest — that will drift from the
  official site and needs an explicit refresh story.
- Couples ZAM to an external site's structure and terms of use; mitigated by the
  SSRF-safe fetch, caching, a bundled manifest, and a polite fetch policy.
