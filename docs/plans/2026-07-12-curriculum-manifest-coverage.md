# Curriculum manifest coverage & import completion

Implements GitHub Epic **#132**. Read `AGENTS.md` first and work on exactly
the next unchecked phase. Multi-phase work stays on one branch and uses one
focused commit per completed phase.

## Goal

Capture **everything the official curriculum portal actually offers** for all
15 providers: every school type, grade, subject, optional track, topic and
importable source. The previous non-Bavarian manifests are five-subject MINT
seeds; their current 20/40-path counts are inventory snapshots, not targets.

A provider is complete only when its official taxonomy is captured independently
from its topic payload. Do not infer offered subjects as the Cartesian product
of a school-wide subject union and every grade. Do not infer completeness from
the paths that already have topics.

## Status

- [x] **Phase 0 / #133 — coverage infrastructure** — explicit catalog paths,
  seed/complete status, empty-catalog failure, report-only progress mode
- [x] **Phase Import / #134 — strict selected-topic extraction** — no
  landing-page/label fallback, hard-fail on missing section, sibling isolation
  tests; per-provider real content URLs + live fixtures remain in Phases A–O
- [x] **Phase A / #135 — `bildungsplan-bremen` (Bremen)** — complete catalog
  **352** paths (Primar, Oberschule, Gymnasium Sek I, GyO); PDF content URLs;
  `pdftotext` import path
- [x] **Phase B / #136 — `bildungsplan-bw` (Baden-Württemberg)** — complete
  catalog **537** paths (GS, SEK1, Gymnasium, GMSO); HTML portal URLs
- [x] **Phase C / #137 — `bildungsplan-hamburg` (Hamburg)** — complete catalog
  **439** paths (GS, STS 5–11, Gym Sek I, Studienstufe); PDF Rahmenpläne
- [x] **Phase D / #138 — `fachanforderungen-sh` (Schleswig-Holstein)** —
  complete catalog **421** paths (GS, GemS, Gym Sek I, GyO); IQSH PDFs
- [ ] **Phase E / #139 — `kerncurriculum-hessen` (Hessen)**
- [ ] **Phase F / #140 — `kerncurriculum-niedersachsen` (Niedersachsen)**
- [ ] **Phase G / #141 — `kernlehrplan-nrw` (Nordrhein-Westfalen)**
- [ ] **Phase H / #142 — `lehrplaene-rp` (Rheinland-Pfalz)**
- [ ] **Phase I / #143 — `lehrplan-saarland` (Saarland)**
- [ ] **Phase J / #144 — `lehrplan-sachsen` (Sachsen)**
- [ ] **Phase K / #145 — `lehrplan-thueringen` (Thüringen)**
- [x] **Phase L / #146 — `lehrplanplus-bayern` (Bayern)**
- [ ] **Phase M / #147 — `rahmenlehrplan-berlin-brandenburg` (Berlin / Brandenburg)**
- [ ] **Phase N / #148 — `rahmenplan-mv` (Mecklenburg-Vorpommern)**
- [ ] **Phase O / #149 — `rahmenrichtlinien-st` (Sachsen-Anhalt)**

## Frozen scope and evidence rules

1. **All subjects, not MINT only.** Capture the complete official taxonomy for
   the active school year, including languages, humanities, arts, religion,
   vocational subjects and special-education branches where offered.
2. **Grade-scoped paths.** The source of truth is an explicit
   `schoolType|grade|subject[|track]` catalog. School-wide subject unions are
   display metadata only and must not create fictitious grade combinations.
3. **Two independent completeness dimensions.** `catalogStatus=complete`
   means the official taxonomy is exhaustive; topic coverage means every
   captured leaf has non-empty topics and a resolvable source.
4. **Official sources only.** Record school year and capture date. Never invent
   a path that the official portal does not offer.
5. **Strict extraction.** Resolve to the actual curriculum content, not a
   generic landing page. A selected topic that cannot be found must fail rather
   than fall back to unrelated page text or only its manifest label.
6. **Offline regression evidence.** Store representative real source fixtures;
   CI never fetches live ministry sites. If the official source is PDF, add a
   supported provider extraction path before marking it complete.
7. **E2E evidence.** For every captured school type × grade, navigate the
   desktop wizard and import one available topic with its dedicated test user.
8. **Profiles protected.** `thomas` and `test-user-0.6.2` stay untouched.

## Phase 0 / #133 — coverage infrastructure

- [x] Separate raw provider catalogs from the runtime content-filtered registry.
- [x] Add provider `catalogStatus` (`seed` or `complete`).
- [x] Let complete providers expose explicit verified catalog leaves.
- [x] Treat seed and empty catalogs as incomplete even if every known seed path
  has topics.
- [x] Keep `--report-only` for progress; the final CI gate requires complete
  catalogs and 100% topic/source coverage.
- [x] Bayern reference baseline: **2095/2095** live-captured paths for school
  year 2026/27; no subject×grade cross-product gaps.

## Phase Import / #134 — strict selected-topic extraction

- [x] Persist `provider` + `topic_id` and retain source-link fallback.
- [x] Confirm multi-topic card operations atomically.
- [x] Shared strict heading extractor (`heading-extract.ts`); seed providers
  no longer fall back to the first unrelated HTML section or the bare
  manifest label when a selected topic is absent.
- [x] Bridge `extractAndStoreCurriculumTopics` hard-fails when any selected
  topic has no matched section text (no whole-page fallback).
- [x] Offline multi-section fixtures + regression tests for partial selection,
  sibling isolation on a shared source, and non-matching documents.
- [x] Wizard copy describes selected-topic extraction (`wizard_topic_scope_note`).
- [ ] Per-provider: replace seed landing-page `contentUrls` with the actual
  curriculum content document (HTML/PDF) during Phases A–O.
- [ ] Per-provider: swap synthetic fixtures for live-captured source documents
  when each catalog is completed (Phases A–O; PDF path where required).

## Test user registry

| Region | User ID pattern | Example |
|--------|-----------------|---------|
| Bremen | `curriculum-bremen-<schulform>-klasse-<n>` | `curriculum-bremen-oberschule-klasse-7` |
| Baden-Württemberg | `curriculum-baden-wuerttemberg-<schulform>-klasse-<n>` | `curriculum-baden-wuerttemberg-gymnasium-klasse-9` |
| Hamburg | `curriculum-hamburg-<schulform>-klasse-<n>` | `curriculum-hamburg-stadtteilschule-klasse-7` |
| Schleswig-Holstein | `curriculum-schleswig-holstein-<schulform>-klasse-<n>` | `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7` |
| Hessen | `curriculum-hessen-<schulform>-klasse-<n>` | `curriculum-hessen-realschule-klasse-7` |
| Niedersachsen | `curriculum-niedersachsen-<schulform>-klasse-<n>` | `curriculum-niedersachsen-realschule-klasse-7` |
| Nordrhein-Westfalen | `curriculum-nordrhein-westfalen-<schulform>-klasse-<n>` | `curriculum-nordrhein-westfalen-realschule-klasse-7` |
| Rheinland-Pfalz | `curriculum-rheinland-pfalz-<schulform>-klasse-<n>` | `curriculum-rheinland-pfalz-realschule-plus-klasse-7` |
| Saarland | `curriculum-saarland-<schulform>-klasse-<n>` | `curriculum-saarland-gemeinschaftsschule-klasse-7` |
| Sachsen | `curriculum-sachsen-<schulform>-klasse-<n>` | `curriculum-sachsen-oberschule-klasse-7` |
| Thüringen | `curriculum-thueringen-<schulform>-klasse-<n>` | `curriculum-thueringen-regelschule-klasse-7` |
| Bayern | `curriculum-bayern-<schulform>-klasse-<n>` | `curriculum-bayern-bos-klasse-10` |
| Berlin / Brandenburg | `curriculum-berlin-brandenburg-<schulform>-klasse-<n>` | `curriculum-berlin-brandenburg-realschule-klasse-7` |
| Mecklenburg-Vorpommern | `curriculum-mecklenburg-vorpommern-<schulform>-klasse-<n>` | `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7` |
| Sachsen-Anhalt | `curriculum-sachsen-anhalt-<schulform>-klasse-<n>` | `curriculum-sachsen-anhalt-sekundarschule-klasse-7` |

## Provider-phase protocol

For every incomplete provider phase below:

1. Navigate the official portal and capture all school types, grades, offered
   subjects and tracks for the active school year.
2. Store the grade-scoped catalog independently from topics; set
   `catalogStatus` to `complete` only after this exhaustive pass.
3. Populate topics and exact content URLs for every captured leaf.
4. Add real offline fixtures and strict provider-owned extraction.
5. Regenerate this plan so the final verified path count replaces **TBD**.
6. Run the provider audit at 100%, bridge checks, and desktop E2E per school
   type × grade; record evidence and final counts in the linked issue.

Current seed counts below are diagnostic only. They must not be copied into
acceptance criteria as final totals.

## Phase A / #135 — `bildungsplan-bremen` (Bremen)

Provider: **Bildungsplan (Bremen)** · catalog: `complete` · **352** paths
(100% topic/source coverage) · school year **2025/2026** · captured
**2026-07-20** from LIS Bremen.

School types: Primarstufe (1–4), Oberschule (5–10), Gymnasium Sek I (5–10),
Gymnasiale Oberstufe (11–13). Content URLs are the published PDF Bildungspläne
(`lis.bremen.de/sixcms/media.php/13/…`), not the landing page. Dual vocational
KMK Rahmenlehrpläne and "in Bearbeitung" berufsbildend drafts are out of scope.

- [x] Capture all official school types, grades, subjects (portal listing).
- [x] Explicit grade-scoped `catalogPaths` + `catalogStatus=complete`.
- [x] Topics + exact PDF content URLs for every leaf.
- [x] Offline fixtures (Mathematik, Deutsch Oberschule) + strict extractTopics.
- [x] PDF text path via system `pdftotext` (bridge converts PDF → extractable HTML).
- [x] Complete-catalog + 100% topic/source audit (`npm run curriculum:topic-coverage -- --provider bildungsplan-bremen`).
- [ ] Desktop E2E per school type × grade (manual smoke with test users).
- [x] Regenerate via `npx tsx scripts/capture-bremen-bildungsplan.ts`.

## Phase B / #136 — `bildungsplan-bw` (Baden-Württemberg)

Provider: **Bildungsplan (Baden-Württemberg)** · catalog: `complete` ·
**537** paths (100% topic/source) · school year **2025/2026** · captured
**2026-07-20** from https://www.bildungsplaene-bw.de/.

School types: Grundschule (1–4), Gemeinsamer Bildungsplan Sek I (5–10),
Gymnasium (5–12), Oberstufe an Gemeinschaftsschulen (11–13). Content URLs are
subject pages on the official HTML portal. V2 rewrites, berufliche Schulen and
SBBZ archives are out of scope.

- [x] Capture official school types, grades and subjects (portal listing).
- [x] Explicit grade-scoped `catalogPaths` + `catalogStatus=complete`.
- [x] Topics + exact content URLs for every leaf.
- [x] Offline fixture (Mathematik Gym 9/10 Leitideen) + strict extractTopics.
- [x] Complete-catalog + 100% topic/source audit.
- [ ] Desktop E2E per school type × grade (manual smoke).

## Phase C / #137 — `bildungsplan-hamburg` (Hamburg)

Provider: **Bildungsplan (Hamburg)** · catalog: `complete` · **439** paths
(100% topic/source) · school year **2025/2026** · captured **2026-07-20**
from https://www.hamburg.de/bildungsplaene.

School types: Grundschule (1–4), Stadtteilschule (5–11), Gymnasium Sek I
(5–10), Studienstufe (11–13). Content URLs are Rahmenplan PDFs on
dokumente.hamburg.de. Cross-cutting Rahmenvorgaben (Sprachbildung, Teil C)
and Förderschwerpunkt geistige Entwicklung are out of scope.

- [x] Capture official school types, grades and subject Rahmenpläne.
- [x] Explicit grade-scoped `catalogPaths` + `catalogStatus=complete`.
- [x] Topics + exact PDF content URLs for every leaf.
- [x] Offline fixture (Mathematik STS) + strict extractTopics.
- [x] Complete-catalog + 100% topic/source audit.
- [ ] Desktop E2E per school type × grade (manual smoke).

## Phase D / #138 — `fachanforderungen-sh` (Schleswig-Holstein)

Provider: **Fachanforderungen (Schleswig-Holstein)** · catalog: `complete` ·
**421** paths (100% topic/source) · school year **2025/2026** · captured
**2026-07-20** from https://fachportal.lernnetz.de/sh/fachanforderungen.html.

School types: Grundschule (1–4), Gemeinschaftsschule (5–10), Gymnasium Sek I
(5–10), Gymnasiale Oberstufe (11–13). Bio/Chemie/Physik use current 2026
Fachanforderungen PDFs; other subjects use the portal’s downloadable Lehrplan
PDFs. Anhörungsfassungen and superseded editions out of scope.

- [x] Capture official school types, grades and subject PDFs from IQSH portal.
- [x] Explicit grade-scoped `catalogPaths` + `catalogStatus=complete`.
- [x] Topics + exact PDF content URLs for every leaf.
- [x] Offline fixture (Mathematik Sek I) + strict extractTopics.
- [x] Complete-catalog + 100% topic/source audit.
- [ ] Desktop E2E per school type × grade (manual smoke).

## Phase E / #139 — `kerncurriculum-hessen` (Hessen)

Provider: **Kerncurriculum (Hessen)** · catalog: `seed` · current
inventory: **40 paths / 9 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #139 with final counts, capture date and evidence.

## Phase F / #140 — `kerncurriculum-niedersachsen` (Niedersachsen)

Provider: **Kerncurriculum (Niedersachsen)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #140 with final counts, capture date and evidence.

## Phase G / #141 — `kernlehrplan-nrw` (Nordrhein-Westfalen)

Provider: **Kernlehrplan (Nordrhein-Westfalen)** · catalog: `seed` · current
inventory: **40 paths / 10 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #141 with final counts, capture date and evidence.

## Phase H / #142 — `lehrplaene-rp` (Rheinland-Pfalz)

Provider: **Lehrpläne (Rheinland-Pfalz)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #142 with final counts, capture date and evidence.

## Phase I / #143 — `lehrplan-saarland` (Saarland)

Provider: **Lehrplan (Saarland)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #143 with final counts, capture date and evidence.

## Phase J / #144 — `lehrplan-sachsen` (Sachsen)

Provider: **Lehrplan (Sachsen)** · catalog: `seed` · current
inventory: **40 paths / 9 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #144 with final counts, capture date and evidence.

## Phase K / #145 — `lehrplan-thueringen` (Thüringen)

Provider: **Lehrplan (Thüringen)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #145 with final counts, capture date and evidence.

## Phase L / #146 — `lehrplanplus-bayern` (Bayern)

Provider: **LehrplanPLUS (Bayern)** · catalog: `complete` · current
inventory: **2095 paths / 2095 with topics**

- [x] Complete official taxonomy captured for the active school year.
- [x] Explicit grade-scoped catalog contains 2095 verified leaves.
- [x] Every catalog leaf has topics and an exact content URL (2095/2095).
- [x] Provider issue records capture and verification evidence.

## Phase M / #147 — `rahmenlehrplan-berlin-brandenburg` (Berlin / Brandenburg)

Provider: **Rahmenlehrplan (Berlin-Brandenburg)** · catalog: `seed` · current
inventory: **40 paths / 9 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #147 with final counts, capture date and evidence.

## Phase N / #148 — `rahmenplan-mv` (Mecklenburg-Vorpommern)

Provider: **Rahmenplan (Mecklenburg-Vorpommern)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #148 with final counts, capture date and evidence.

## Phase O / #149 — `rahmenrichtlinien-st` (Sachsen-Anhalt)

Provider: **Rahmenrichtlinien (Sachsen-Anhalt)** · catalog: `seed` · current
inventory: **40 paths / 8 with topics**

Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set `catalogStatus=complete`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #149 with final counts, capture date and evidence.

## Acceptance — Epic #132 complete

- Every provider reports `catalogStatus=complete` and a non-empty explicit
  official catalog for the same active school year.
- Every captured leaf has non-empty topics, an exact importable source and
  strict selected-topic extraction; the global smoke exits 0 without
  `--report-only`.
- All provider issues contain final (not seed) path counts and E2E evidence.
- Phase Import acceptance is complete for every runtime provider.
- `npm run format && npm run lint && npm run typecheck && npm run test && npm run build` is green.
- No regression for `thomas` / `test-user-0.6.2`.
