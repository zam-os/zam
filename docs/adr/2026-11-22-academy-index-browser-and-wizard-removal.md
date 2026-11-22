# ZAM Academy Index Browser and Removal of the Curriculum Wizard

**Status:** Implemented — PR #496 (2026-11-22)\
**Date:** 2026-11-22\
**Deciders:** Thomas (project owner)\
**Supersedes:**
[2026-07-02](2026-07-02-lehrplanplus-import-wizard.md) (Curriculum Import
Wizard) · the manifest-driven fallback in
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decision 10)\
**Amends:**
[2026-10-19](2026-10-19-zam-academy-cells.md) (Decisions 4 and 5: lazy
`cell.json` downloads via `academy.json` index, and the agent enrolment
contract for uncached catalog-only cells)

---

## Context

Two operational issues converged as the ZAM Academy catalog grew toward ~100
published packages:

1. **Slow Academy listing.** Opening ZAM Academy fetched `catalog.json` and
   then downloaded every non-bundled or newer `cell.json` upfront before the
   list became usable, and presented all packages as one flat alphabetical
   scroll list. Meanwhile, `https://academy.zam-os.org/academy.json` already
   publishes a lightweight metadata index (schools, knowledge areas, subjects,
   combined subjects, grades, lesson counts, and topics) suitable for fast
   multi-stage browsing, filtering, and search.
2. **Broken and unmaintainable curriculum wizard.** The manifest-driven
   curriculum importer (ADR 2026-07-02) carried over 160,000 lines of static
   German federal-state curriculum manifests across 16 Länder, yet most
   Länder lacked usable or reliable online curriculum pages, leaving the
   wizard largely ineffective in practice. ZAM Academy has grown into the
   curated replacement with interactive lessons, reviewed cards, and fast
   checks, while Free Import (text, URLs, photos, PDFs — ADR 2026-10-05)
   handles arbitrary personal learning material.

---

## Decisions

### 1. Fast index-backed Academy browser with on-demand `cell.json` downloads

Amends [ADR 2026-10-19](2026-10-19-zam-academy-cells.md) Decisions 4 and 5:

- **Listing never downloads `cell.json` files.** `zam bridge academy-list`
  (Desktop/CLI) and Mobile fetch only `catalog.json` and `academy.json` in
  parallel from the pinned `https://academy.zam-os.org` origin and cache both
  locally (`~/.zam/academy/catalog.json` and `~/.zam/academy/academy.json` on
  Desktop/CLI).
- **Single-cell lazy download.** Individual `cell.json` files are downloaded
  and SHA-256 verified only when the learner explicitly clicks „Aufnehmen“
  (`academy-enrol`) or „Aktualisieren“ (`academy-update`), and skipped when
  the current build already bundles that version or newer.
- **Multi-stage browsing, filtering, and live search.** Both Desktop Studio
  and Mobile present the catalog using the `academy.json` taxonomy:
  - *Schulsicht* (School view): School chips → Grade → Subject → Packages.
  - *Weltwissen* (Knowledge view): Knowledge area → Subject → Grade filter →
    Packages.
  - Direct list filters (school, grade, subject) and live text search across
    title, description, subject, area, school, and topics.
- **Per-learner enrolment check without a local tile.** When an Academy tile
  is recorded in `installed_tiles` (e.g. after a restart or sync) without its
  `cell.json` loaded locally, both Desktop and Mobile check active
  non-detached cards pointing to the app URL (`userHoldsAcademyAppCards`)
  instead of assuming `installed_tiles` means the learner still holds cards.

### 2. Agent discovery vs. enrolment for uncached catalog-only Academy cells

Amends [ADR 2026-10-19](2026-10-19-zam-academy-cells.md) Decisions 4 and 5:

- Agents still **never reach the network** (ADR 2026-10-08b).
- **`zam_bundled_cells_list`** surfaces bundled cells, locally cached
  Academy cells, *and* uncached catalog-only entries from the learner's last
  cached `catalog.json` / `academy.json` check (marked with
  `requiresLearnerEnrol: true`).
- **`zam_bundled_cell_enrol`** enrols bundled cells and locally cached cells
  offline as before, and still refuses to upgrade a held cell. If an agent
  attempts to enrol a catalog-only Academy cell whose `cell.json` is not
  cached locally yet, it fails with a clear instruction asking the learner to
  open ZAM Academy and click „Aufnehmen“ to download and enrol it.

### 3. Removal of the manifest-driven curriculum wizard

Supersedes [ADR 2026-07-02](2026-07-02-lehrplanplus-import-wizard.md) and the
generic-importer fallback of
[ADR 2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) Decision
10:

- The curriculum wizard UI (Desktop & Mobile), its `curriculum-*` bridge
  commands, its 16-state manifest providers (`src/cli/curriculum/providers/`),
  and its capture/smoke scripts are removed.
- All learner-facing content entry points (Lerninhalte, First-Run Onboarding /
  Free Mode, Knowledge Atlas import, Mobile) route to **ZAM Academy** and
  **Free Import** (text, URL, photos, PDFs).
- **Retained deliberately:**
  - `personal-card-import-curriculum` (free text/URL card import).
  - `src/cli/curriculum/breadcrumb.ts` (used by material import and MCP).
  - `findBundledCellsForScope` / `needsGenericCurriculumImport` and the Atlas
    `wizard: boolean` wire field (retained for contract stability; surfaces
    now offer ZAM Academy where the wizard used to be).

### 4. Remaining bundled `de-by:` school cells stay off the learner UI

- As of ZAM 0.67.0, 127 active bundled `de-by:` school cells remain alongside
  93 bundled Academy cells while migration continues
  (`docs/plans/2026-11-08-academy-cell-integration.md`).
- **Deliberate product decision:** Learners are no longer offered first-time
  enrolment in legacy `de-by:` school cells in Desktop Studio or Mobile UI.
  New learner enrolment flows exclusively through **ZAM Academy** (and Free
  Import). Existing learners keep their cards and review history, `replaces`
  migrations continue to move history onto incoming Academy cells, and agent
  tools (`zam_bundled_cells_list` / `zam_bundled_cell_enrol`) still see all
  bundled cells.

---

## Consequences

- **Faster Academy UX:** Opening ZAM Academy performs two small JSON requests
  instead of downloading up to dozens of `cell.json` bundles, and lets
  learners narrow by school, grade, subject, or search immediately.
- **Smaller, maintainable codebase:** Removes ~166k lines of brittle static
  curriculum manifests and wizard code across Desktop, Mobile, CLI, and tests.
- **Explicit coverage trade-off:** ZAM Academy currently targets Bavarian
  curricula (*Klassen 5 bis 13 in Bayern*) plus cross-grade computer science
  topics. Learners in the other 15 German Länder no longer have a
  manifest-driven curriculum wizard; their path is **Free Import** (photos,
  PDFs, text, URLs) until Academy coverage expands.
- **One extra learner click for brand-new catalog-only cells asked via agent:**
  An agent can discover a newly published Academy cell immediately after the
  learner opened ZAM Academy once, and tells the learner to click „Aufnehmen“
  once so ZAM downloads and verifies `cell.json` on the learner's action.
