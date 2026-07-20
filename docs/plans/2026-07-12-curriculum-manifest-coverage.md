# Curriculum manifest coverage & import completion

Implements the Epic in GitHub issue **#132** (curriculum import incomplete for
German federal states). Read `AGENTS.md` and
[`2026-07-02-lehrplanplus-phase-3.md`](./2026-07-02-lehrplanplus-phase-3.md)
first. Work on exactly the next unchecked phase; one branch
(`feat/curriculum-manifest-coverage`), one focused commit per completed phase.

## Goal

Every navigable curriculum path (Land → Bundesland → Schulform → Klasse → Fach
[→ Ausprägung] → Themen/Lernbereiche) must offer selectable topics **and**
support end-to-end import of at least one selected topic into the learner's
queue. Today manifests are intentionally partial starter sets; the wizard shows
empty topic lists for most combinations (e.g. Bayern Realschule 9 Biologie).

## Status

- [x] **Phase 0 — test infrastructure** (users, verification protocol)
- [ ] **Phase Import — import pipeline (Phase 3 handoff)** — topic extraction,
  `topic_id` persistence, atomic multi-topic import
- [ ] **Phase A — `bildungsplan-bremen` (Bremen)**
- [ ] **Phase B — `bildungsplan-bw` (Baden-Württemberg)**
- [ ] **Phase C — `bildungsplan-hamburg` (Hamburg)**
- [ ] **Phase D — `fachanforderungen-sh` (Schleswig-Holstein)**
- [ ] **Phase E — `kerncurriculum-hessen` (Hessen)**
- [ ] **Phase F — `kerncurriculum-niedersachsen` (Niedersachsen)**
- [ ] **Phase G — `kernlehrplan-nrw` (Nordrhein-Westfalen)**
- [ ] **Phase H — `lehrplaene-rp` (Rheinland-Pfalz)**
- [ ] **Phase I — `lehrplan-saarland` (Saarland)**
- [ ] **Phase J — `lehrplan-sachsen` (Sachsen)**
- [ ] **Phase K — `lehrplan-thueringen` (Thüringen)**
- [ ] **Phase L — `lehrplanplus-bayern` (Bayern)**
- [ ] **Phase M — `rahmenlehrplan-berlin-brandenburg` (Berlin / Brandenburg)**
- [ ] **Phase N — `rahmenplan-mv` (Mecklenburg-Vorpommern)**
- [ ] **Phase O — `rahmenrichtlinien-st` (Sachsen-Anhalt)**

## Decisions (frozen)

1. **Scope:** Manifest taxonomy/topics **and** import pipeline Phase 3 (Epic C).
2. **Test users:** `curriculum-<bundesland>-<schulform>-klasse-<n>` in the
   shared Turso DB (readable Bundesland slug, explicit `klasse` segment);
   `thomas` and `test-user-0.6.2` stay untouched.
3. **Subjects:** All subjects listed in each provider manifest for the path —
   not a core-subject subset.
4. **Verification:** End-to-end per path — wizard topic selection **and**
   import of one topic into cards (see protocol below).
5. **Provider order:** Alphabetical by provider id (15 phases A–O).
6. **Manifest refresh:** Agent-navigated against live official sites once per
   school year (per ADR 2026-07-02); HTML fixtures for tests — no live-site
   dependency in CI.

## Phase 0 — test infrastructure

- [x] Provision `114` curriculum test users via
  `npx tsx scripts/provision-curriculum-test-users.ts` (shared anchor token
  `curriculum-test-profile-anchor`, one card each).
- [x] Document user ↔ path mapping in issue checklist (GitHub #132).
- [x] Add a bridge-level smoke script that asserts `curriculum-list-level
  --level topic` returns non-empty options for every manifest path (CI gate
  once manifests are complete):
  - Library: `src/cli/curriculum/topic-coverage.ts` (raw-catalog walk)
  - CLI: `npx tsx scripts/curriculum-topic-coverage-smoke.ts`
    (`npm run curriculum:topic-coverage`)
  - Raw providers: `RAW_CURRICULUM_PROVIDERS` / `getRawCurriculumProvider`
  - Use `--report-only` while coverage is incomplete; drop it (default
    `--min-coverage 1`) as the hard CI gate when Phases A–O are done.
  - Tests: `tests/cli/curriculum-topic-coverage.test.ts`

### Test user registry

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
| Bayern | `curriculum-bayern-<schulform>-klasse-<n>` | `curriculum-bayern-realschule-klasse-5` |
| Berlin / Brandenburg | `curriculum-berlin-brandenburg-<schulform>-klasse-<n>` | `curriculum-berlin-brandenburg-realschule-klasse-7` |
| Mecklenburg-Vorpommern | `curriculum-mecklenburg-vorpommern-<schulform>-klasse-<n>` | `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7` |
| Sachsen-Anhalt | `curriculum-sachsen-anhalt-<schulform>-klasse-<n>` | `curriculum-sachsen-anhalt-sekundarschule-klasse-7` |

## End-to-end verification protocol (every path)

For path `<provider>|<schoolType>|<grade>|<subject>[|<track>]`:

1. `zam bridge database-select-user --user curriculum-<bundesland>-<schulform>-klasse-<n>`
2. Desktop → Curriculum import wizard: select Land, Bundesland, Schulform,
   Klasse, Fach [, Ausprägung].
3. **Topic step must list ≥1 Lernbereich/Thema** (not an empty list).
4. Select **one** topic → run import → confirm ≥1 card lands in the user's queue.
5. Card metadata must reference `provider` and `topic_id` once Phase B is done.
6. Record `capturedOn` in the manifest when refreshing from the live site.

CLI pre-check (before desktop):

```bash
npx tsx src/cli/index.ts bridge curriculum-list-level \
  --provider <id> --level topic \
  --selection '{"schoolType":"...","grade":"...","subject":"...","track":"..."}'
```

## Phase Import — import pipeline (Phase 3 handoff)

From [`2026-07-02-lehrplanplus-phase-3.md`](./2026-07-02-lehrplanplus-phase-3.md):

- [ ] Saved HTML fixtures per provider (never hit live sites in tests).
- [ ] Provider-owned `extractTopics(html, topicIds)` returning per-topic text.
- [ ] Persist `provider` + `topic_id` on imported cards (migration + fallback).
- [ ] Atomic multi-topic import with dedup; failure rolls back entire batch.
- [ ] Remove Phase-2 whole-page notice in wizard when extraction is precise.
- [ ] Regression tests: partial selection, sibling pages, re-import, all locales.

---

## Phase A — `bildungsplan-bremen` (Bremen)

Provider: **Bildungsplan (Bremen)** · Region: `HB` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `oberschule|7|mathematik` — Oberschule 7. Kl. · Mathematik · user `curriculum-bremen-oberschule-klasse-7`
- [ ] `oberschule|7|informatik` — Oberschule 7. Kl. · Informatik · user `curriculum-bremen-oberschule-klasse-7`
- [ ] `oberschule|7|physik` — Oberschule 7. Kl. · Physik · user `curriculum-bremen-oberschule-klasse-7`
- [ ] `oberschule|7|chemie` — Oberschule 7. Kl. · Chemie · user `curriculum-bremen-oberschule-klasse-7`
- [ ] `oberschule|7|biologie` — Oberschule 7. Kl. · Biologie · user `curriculum-bremen-oberschule-klasse-7`
- [ ] `oberschule|8|mathematik` — Oberschule 8. Kl. · Mathematik · user `curriculum-bremen-oberschule-klasse-8`
- [ ] `oberschule|8|informatik` — Oberschule 8. Kl. · Informatik · user `curriculum-bremen-oberschule-klasse-8`
- [ ] `oberschule|8|physik` — Oberschule 8. Kl. · Physik · user `curriculum-bremen-oberschule-klasse-8`
- [ ] `oberschule|8|chemie` — Oberschule 8. Kl. · Chemie · user `curriculum-bremen-oberschule-klasse-8`
- [ ] `oberschule|8|biologie` — Oberschule 8. Kl. · Biologie · user `curriculum-bremen-oberschule-klasse-8`
- [ ] `oberschule|9|mathematik` — Oberschule 9. Kl. · Mathematik · user `curriculum-bremen-oberschule-klasse-9`
- [x] `oberschule|9|informatik` — Oberschule 9. Kl. · Informatik · user `curriculum-bremen-oberschule-klasse-9`
- [x] `oberschule|9|physik` — Oberschule 9. Kl. · Physik · user `curriculum-bremen-oberschule-klasse-9`
- [x] `oberschule|9|chemie` — Oberschule 9. Kl. · Chemie · user `curriculum-bremen-oberschule-klasse-9`
- [x] `oberschule|9|biologie` — Oberschule 9. Kl. · Biologie · user `curriculum-bremen-oberschule-klasse-9`
- [x] `oberschule|10|mathematik` — Oberschule 10. Kl. · Mathematik · user `curriculum-bremen-oberschule-klasse-10`
- [ ] `oberschule|10|informatik` — Oberschule 10. Kl. · Informatik · user `curriculum-bremen-oberschule-klasse-10`
- [ ] `oberschule|10|physik` — Oberschule 10. Kl. · Physik · user `curriculum-bremen-oberschule-klasse-10`
- [ ] `oberschule|10|chemie` — Oberschule 10. Kl. · Chemie · user `curriculum-bremen-oberschule-klasse-10`
- [ ] `oberschule|10|biologie` — Oberschule 10. Kl. · Biologie · user `curriculum-bremen-oberschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-bremen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-bremen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-bremen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-bremen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-bremen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-bremen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-bremen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-bremen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-bremen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-bremen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-bremen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-bremen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-bremen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-bremen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-bremen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-bremen-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-bremen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-bremen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-bremen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-bremen-gymnasium-klasse-10`

## Phase B — `bildungsplan-bw` (Baden-Württemberg)

Provider: **Bildungsplan (Baden-Württemberg)** · Region: `BW` · Paths: **20** · Topics today: **5** (25%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-9`
- [ ] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-9`
- [ ] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-9`
- [ ] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-10`
- [x] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-10`
- [x] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-10`
- [x] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-10`
- [x] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-10`
- [ ] `gymnasium|11|mathematik` — Gymnasium 11. Kl. · Mathematik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-11`
- [ ] `gymnasium|11|informatik` — Gymnasium 11. Kl. · Informatik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-11`
- [ ] `gymnasium|11|physik` — Gymnasium 11. Kl. · Physik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-11`
- [ ] `gymnasium|11|chemie` — Gymnasium 11. Kl. · Chemie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-11`
- [ ] `gymnasium|11|biologie` — Gymnasium 11. Kl. · Biologie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-11`
- [ ] `gymnasium|12|mathematik` — Gymnasium 12. Kl. · Mathematik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-12`
- [ ] `gymnasium|12|informatik` — Gymnasium 12. Kl. · Informatik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-12`
- [ ] `gymnasium|12|physik` — Gymnasium 12. Kl. · Physik · user `curriculum-baden-wuerttemberg-gymnasium-klasse-12`
- [ ] `gymnasium|12|chemie` — Gymnasium 12. Kl. · Chemie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-12`
- [ ] `gymnasium|12|biologie` — Gymnasium 12. Kl. · Biologie · user `curriculum-baden-wuerttemberg-gymnasium-klasse-12`

## Phase C — `bildungsplan-hamburg` (Hamburg)

Provider: **Bildungsplan (Hamburg)** · Region: `HH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `stadtteilschule|7|mathematik` — Stadtteilschule (Realschule) 7. Kl. · Mathematik · user `curriculum-hamburg-stadtteilschule-klasse-7`
- [ ] `stadtteilschule|7|informatik` — Stadtteilschule (Realschule) 7. Kl. · Informatik · user `curriculum-hamburg-stadtteilschule-klasse-7`
- [ ] `stadtteilschule|7|physik` — Stadtteilschule (Realschule) 7. Kl. · Physik · user `curriculum-hamburg-stadtteilschule-klasse-7`
- [ ] `stadtteilschule|7|chemie` — Stadtteilschule (Realschule) 7. Kl. · Chemie · user `curriculum-hamburg-stadtteilschule-klasse-7`
- [ ] `stadtteilschule|7|biologie` — Stadtteilschule (Realschule) 7. Kl. · Biologie · user `curriculum-hamburg-stadtteilschule-klasse-7`
- [ ] `stadtteilschule|8|mathematik` — Stadtteilschule (Realschule) 8. Kl. · Mathematik · user `curriculum-hamburg-stadtteilschule-klasse-8`
- [ ] `stadtteilschule|8|informatik` — Stadtteilschule (Realschule) 8. Kl. · Informatik · user `curriculum-hamburg-stadtteilschule-klasse-8`
- [ ] `stadtteilschule|8|physik` — Stadtteilschule (Realschule) 8. Kl. · Physik · user `curriculum-hamburg-stadtteilschule-klasse-8`
- [ ] `stadtteilschule|8|chemie` — Stadtteilschule (Realschule) 8. Kl. · Chemie · user `curriculum-hamburg-stadtteilschule-klasse-8`
- [ ] `stadtteilschule|8|biologie` — Stadtteilschule (Realschule) 8. Kl. · Biologie · user `curriculum-hamburg-stadtteilschule-klasse-8`
- [ ] `stadtteilschule|9|mathematik` — Stadtteilschule (Realschule) 9. Kl. · Mathematik · user `curriculum-hamburg-stadtteilschule-klasse-9`
- [ ] `stadtteilschule|9|informatik` — Stadtteilschule (Realschule) 9. Kl. · Informatik · user `curriculum-hamburg-stadtteilschule-klasse-9`
- [x] `stadtteilschule|9|physik` — Stadtteilschule (Realschule) 9. Kl. · Physik · user `curriculum-hamburg-stadtteilschule-klasse-9`
- [x] `stadtteilschule|9|chemie` — Stadtteilschule (Realschule) 9. Kl. · Chemie · user `curriculum-hamburg-stadtteilschule-klasse-9`
- [x] `stadtteilschule|9|biologie` — Stadtteilschule (Realschule) 9. Kl. · Biologie · user `curriculum-hamburg-stadtteilschule-klasse-9`
- [x] `stadtteilschule|10|mathematik` — Stadtteilschule (Realschule) 10. Kl. · Mathematik · user `curriculum-hamburg-stadtteilschule-klasse-10`
- [ ] `stadtteilschule|10|informatik` — Stadtteilschule (Realschule) 10. Kl. · Informatik · user `curriculum-hamburg-stadtteilschule-klasse-10`
- [ ] `stadtteilschule|10|physik` — Stadtteilschule (Realschule) 10. Kl. · Physik · user `curriculum-hamburg-stadtteilschule-klasse-10`
- [ ] `stadtteilschule|10|chemie` — Stadtteilschule (Realschule) 10. Kl. · Chemie · user `curriculum-hamburg-stadtteilschule-klasse-10`
- [ ] `stadtteilschule|10|biologie` — Stadtteilschule (Realschule) 10. Kl. · Biologie · user `curriculum-hamburg-stadtteilschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-hamburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-hamburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-hamburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-hamburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-hamburg-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-hamburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-hamburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-hamburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-hamburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-hamburg-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-hamburg-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-hamburg-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-hamburg-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-hamburg-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-hamburg-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-hamburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-hamburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-hamburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-hamburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-hamburg-gymnasium-klasse-10`

## Phase D — `fachanforderungen-sh` (Schleswig-Holstein)

Provider: **Fachanforderungen (Schleswig-Holstein)** · Region: `SH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gemeinschaftsschule|7|mathematik` — Gemeinschaftsschule 7. Kl. · Mathematik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|informatik` — Gemeinschaftsschule 7. Kl. · Informatik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|physik` — Gemeinschaftsschule 7. Kl. · Physik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|chemie` — Gemeinschaftsschule 7. Kl. · Chemie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|biologie` — Gemeinschaftsschule 7. Kl. · Biologie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|8|mathematik` — Gemeinschaftsschule 8. Kl. · Mathematik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|informatik` — Gemeinschaftsschule 8. Kl. · Informatik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|physik` — Gemeinschaftsschule 8. Kl. · Physik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|chemie` — Gemeinschaftsschule 8. Kl. · Chemie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|biologie` — Gemeinschaftsschule 8. Kl. · Biologie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|9|mathematik` — Gemeinschaftsschule 9. Kl. · Mathematik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-9`
- [ ] `gemeinschaftsschule|9|informatik` — Gemeinschaftsschule 9. Kl. · Informatik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|physik` — Gemeinschaftsschule 9. Kl. · Physik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|chemie` — Gemeinschaftsschule 9. Kl. · Chemie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|biologie` — Gemeinschaftsschule 9. Kl. · Biologie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|10|mathematik` — Gemeinschaftsschule 10. Kl. · Mathematik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|informatik` — Gemeinschaftsschule 10. Kl. · Informatik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|physik` — Gemeinschaftsschule 10. Kl. · Physik · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|chemie` — Gemeinschaftsschule 10. Kl. · Chemie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|biologie` — Gemeinschaftsschule 10. Kl. · Biologie · user `curriculum-schleswig-holstein-gemeinschaftsschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-schleswig-holstein-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-schleswig-holstein-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-schleswig-holstein-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-schleswig-holstein-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-schleswig-holstein-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-schleswig-holstein-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-schleswig-holstein-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-schleswig-holstein-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-schleswig-holstein-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-schleswig-holstein-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-schleswig-holstein-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-schleswig-holstein-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-schleswig-holstein-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-schleswig-holstein-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-schleswig-holstein-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-schleswig-holstein-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-schleswig-holstein-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-schleswig-holstein-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-schleswig-holstein-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-schleswig-holstein-gymnasium-klasse-10`

## Phase E — `kerncurriculum-hessen` (Hessen)

Provider: **Kerncurriculum (Hessen)** · Region: `HE` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-hessen-realschule-klasse-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-hessen-realschule-klasse-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-hessen-realschule-klasse-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-hessen-realschule-klasse-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-hessen-realschule-klasse-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-hessen-realschule-klasse-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-hessen-realschule-klasse-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-hessen-realschule-klasse-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-hessen-realschule-klasse-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-hessen-realschule-klasse-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-hessen-realschule-klasse-9`
- [x] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-hessen-realschule-klasse-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-hessen-realschule-klasse-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-hessen-realschule-klasse-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-hessen-realschule-klasse-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-hessen-realschule-klasse-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-hessen-realschule-klasse-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-hessen-realschule-klasse-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-hessen-realschule-klasse-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-hessen-realschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-hessen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-hessen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-hessen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-hessen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-hessen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-hessen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-hessen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-hessen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-hessen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-hessen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-hessen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-hessen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-hessen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-hessen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-hessen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-hessen-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-hessen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-hessen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-hessen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-hessen-gymnasium-klasse-10`

## Phase F — `kerncurriculum-niedersachsen` (Niedersachsen)

Provider: **Kerncurriculum (Niedersachsen)** · Region: `NI` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-niedersachsen-realschule-klasse-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-niedersachsen-realschule-klasse-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-niedersachsen-realschule-klasse-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-niedersachsen-realschule-klasse-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-niedersachsen-realschule-klasse-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-niedersachsen-realschule-klasse-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-niedersachsen-realschule-klasse-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-niedersachsen-realschule-klasse-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-niedersachsen-realschule-klasse-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-niedersachsen-realschule-klasse-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-niedersachsen-realschule-klasse-9`
- [ ] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-niedersachsen-realschule-klasse-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-niedersachsen-realschule-klasse-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-niedersachsen-realschule-klasse-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-niedersachsen-realschule-klasse-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-niedersachsen-realschule-klasse-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-niedersachsen-realschule-klasse-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-niedersachsen-realschule-klasse-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-niedersachsen-realschule-klasse-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-niedersachsen-realschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-niedersachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-niedersachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-niedersachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-niedersachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-niedersachsen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-niedersachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-niedersachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-niedersachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-niedersachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-niedersachsen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-niedersachsen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-niedersachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-niedersachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-niedersachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-niedersachsen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-niedersachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-niedersachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-niedersachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-niedersachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-niedersachsen-gymnasium-klasse-10`

## Phase G — `kernlehrplan-nrw` (Nordrhein-Westfalen)

Provider: **Kernlehrplan (Nordrhein-Westfalen)** · Region: `NW` · Paths: **40** · Topics today: **10** (25%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-realschule-klasse-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-nordrhein-westfalen-realschule-klasse-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-nordrhein-westfalen-realschule-klasse-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-nordrhein-westfalen-realschule-klasse-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-nordrhein-westfalen-realschule-klasse-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-realschule-klasse-8`
- [x] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-nordrhein-westfalen-realschule-klasse-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-nordrhein-westfalen-realschule-klasse-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-nordrhein-westfalen-realschule-klasse-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-nordrhein-westfalen-realschule-klasse-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-realschule-klasse-9`
- [ ] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-nordrhein-westfalen-realschule-klasse-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-nordrhein-westfalen-realschule-klasse-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-nordrhein-westfalen-realschule-klasse-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-nordrhein-westfalen-realschule-klasse-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-realschule-klasse-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-nordrhein-westfalen-realschule-klasse-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-nordrhein-westfalen-realschule-klasse-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-nordrhein-westfalen-realschule-klasse-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-nordrhein-westfalen-realschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-10`
- [x] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-nordrhein-westfalen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-nordrhein-westfalen-gymnasium-klasse-10`

## Phase H — `lehrplaene-rp` (Rheinland-Pfalz)

Provider: **Lehrpläne (Rheinland-Pfalz)** · Region: `RP` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule-plus|7|mathematik` — Realschule plus 7. Kl. · Mathematik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-7`
- [ ] `realschule-plus|7|informatik` — Realschule plus 7. Kl. · Informatik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-7`
- [ ] `realschule-plus|7|physik` — Realschule plus 7. Kl. · Physik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-7`
- [ ] `realschule-plus|7|chemie` — Realschule plus 7. Kl. · Chemie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-7`
- [ ] `realschule-plus|7|biologie` — Realschule plus 7. Kl. · Biologie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-7`
- [ ] `realschule-plus|8|mathematik` — Realschule plus 8. Kl. · Mathematik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-8`
- [ ] `realschule-plus|8|informatik` — Realschule plus 8. Kl. · Informatik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-8`
- [ ] `realschule-plus|8|physik` — Realschule plus 8. Kl. · Physik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-8`
- [ ] `realschule-plus|8|chemie` — Realschule plus 8. Kl. · Chemie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-8`
- [ ] `realschule-plus|8|biologie` — Realschule plus 8. Kl. · Biologie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-8`
- [ ] `realschule-plus|9|mathematik` — Realschule plus 9. Kl. · Mathematik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-9`
- [ ] `realschule-plus|9|informatik` — Realschule plus 9. Kl. · Informatik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-9`
- [x] `realschule-plus|9|physik` — Realschule plus 9. Kl. · Physik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-9`
- [x] `realschule-plus|9|chemie` — Realschule plus 9. Kl. · Chemie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-9`
- [x] `realschule-plus|9|biologie` — Realschule plus 9. Kl. · Biologie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-9`
- [x] `realschule-plus|10|mathematik` — Realschule plus 10. Kl. · Mathematik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-10`
- [ ] `realschule-plus|10|informatik` — Realschule plus 10. Kl. · Informatik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-10`
- [ ] `realschule-plus|10|physik` — Realschule plus 10. Kl. · Physik · user `curriculum-rheinland-pfalz-realschule-plus-klasse-10`
- [ ] `realschule-plus|10|chemie` — Realschule plus 10. Kl. · Chemie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-10`
- [ ] `realschule-plus|10|biologie` — Realschule plus 10. Kl. · Biologie · user `curriculum-rheinland-pfalz-realschule-plus-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-rheinland-pfalz-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-rheinland-pfalz-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-rheinland-pfalz-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-rheinland-pfalz-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-rheinland-pfalz-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-rheinland-pfalz-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-rheinland-pfalz-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-rheinland-pfalz-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-rheinland-pfalz-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-rheinland-pfalz-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-rheinland-pfalz-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-rheinland-pfalz-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-rheinland-pfalz-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-rheinland-pfalz-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-rheinland-pfalz-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-rheinland-pfalz-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-rheinland-pfalz-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-rheinland-pfalz-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-rheinland-pfalz-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-rheinland-pfalz-gymnasium-klasse-10`

## Phase I — `lehrplan-saarland` (Saarland)

Provider: **Lehrplan (Saarland)** · Region: `SL` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gemeinschaftsschule|7|mathematik` — Gemeinschaftsschule 7. Kl. · Mathematik · user `curriculum-saarland-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|informatik` — Gemeinschaftsschule 7. Kl. · Informatik · user `curriculum-saarland-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|physik` — Gemeinschaftsschule 7. Kl. · Physik · user `curriculum-saarland-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|chemie` — Gemeinschaftsschule 7. Kl. · Chemie · user `curriculum-saarland-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|7|biologie` — Gemeinschaftsschule 7. Kl. · Biologie · user `curriculum-saarland-gemeinschaftsschule-klasse-7`
- [ ] `gemeinschaftsschule|8|mathematik` — Gemeinschaftsschule 8. Kl. · Mathematik · user `curriculum-saarland-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|informatik` — Gemeinschaftsschule 8. Kl. · Informatik · user `curriculum-saarland-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|physik` — Gemeinschaftsschule 8. Kl. · Physik · user `curriculum-saarland-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|chemie` — Gemeinschaftsschule 8. Kl. · Chemie · user `curriculum-saarland-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|8|biologie` — Gemeinschaftsschule 8. Kl. · Biologie · user `curriculum-saarland-gemeinschaftsschule-klasse-8`
- [ ] `gemeinschaftsschule|9|mathematik` — Gemeinschaftsschule 9. Kl. · Mathematik · user `curriculum-saarland-gemeinschaftsschule-klasse-9`
- [ ] `gemeinschaftsschule|9|informatik` — Gemeinschaftsschule 9. Kl. · Informatik · user `curriculum-saarland-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|physik` — Gemeinschaftsschule 9. Kl. · Physik · user `curriculum-saarland-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|chemie` — Gemeinschaftsschule 9. Kl. · Chemie · user `curriculum-saarland-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|9|biologie` — Gemeinschaftsschule 9. Kl. · Biologie · user `curriculum-saarland-gemeinschaftsschule-klasse-9`
- [x] `gemeinschaftsschule|10|mathematik` — Gemeinschaftsschule 10. Kl. · Mathematik · user `curriculum-saarland-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|informatik` — Gemeinschaftsschule 10. Kl. · Informatik · user `curriculum-saarland-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|physik` — Gemeinschaftsschule 10. Kl. · Physik · user `curriculum-saarland-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|chemie` — Gemeinschaftsschule 10. Kl. · Chemie · user `curriculum-saarland-gemeinschaftsschule-klasse-10`
- [ ] `gemeinschaftsschule|10|biologie` — Gemeinschaftsschule 10. Kl. · Biologie · user `curriculum-saarland-gemeinschaftsschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-saarland-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-saarland-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-saarland-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-saarland-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-saarland-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-saarland-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-saarland-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-saarland-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-saarland-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-saarland-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-saarland-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-saarland-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-saarland-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-saarland-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-saarland-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-saarland-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-saarland-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-saarland-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-saarland-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-saarland-gymnasium-klasse-10`

## Phase J — `lehrplan-sachsen` (Sachsen)

Provider: **Lehrplan (Sachsen)** · Region: `SN` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `oberschule|7|mathematik` — Oberschule (Realschule) 7. Kl. · Mathematik · user `curriculum-sachsen-oberschule-klasse-7`
- [ ] `oberschule|7|informatik` — Oberschule (Realschule) 7. Kl. · Informatik · user `curriculum-sachsen-oberschule-klasse-7`
- [ ] `oberschule|7|physik` — Oberschule (Realschule) 7. Kl. · Physik · user `curriculum-sachsen-oberschule-klasse-7`
- [ ] `oberschule|7|chemie` — Oberschule (Realschule) 7. Kl. · Chemie · user `curriculum-sachsen-oberschule-klasse-7`
- [ ] `oberschule|7|biologie` — Oberschule (Realschule) 7. Kl. · Biologie · user `curriculum-sachsen-oberschule-klasse-7`
- [ ] `oberschule|8|mathematik` — Oberschule (Realschule) 8. Kl. · Mathematik · user `curriculum-sachsen-oberschule-klasse-8`
- [ ] `oberschule|8|informatik` — Oberschule (Realschule) 8. Kl. · Informatik · user `curriculum-sachsen-oberschule-klasse-8`
- [ ] `oberschule|8|physik` — Oberschule (Realschule) 8. Kl. · Physik · user `curriculum-sachsen-oberschule-klasse-8`
- [ ] `oberschule|8|chemie` — Oberschule (Realschule) 8. Kl. · Chemie · user `curriculum-sachsen-oberschule-klasse-8`
- [ ] `oberschule|8|biologie` — Oberschule (Realschule) 8. Kl. · Biologie · user `curriculum-sachsen-oberschule-klasse-8`
- [ ] `oberschule|9|mathematik` — Oberschule (Realschule) 9. Kl. · Mathematik · user `curriculum-sachsen-oberschule-klasse-9`
- [x] `oberschule|9|informatik` — Oberschule (Realschule) 9. Kl. · Informatik · user `curriculum-sachsen-oberschule-klasse-9`
- [x] `oberschule|9|physik` — Oberschule (Realschule) 9. Kl. · Physik · user `curriculum-sachsen-oberschule-klasse-9`
- [x] `oberschule|9|chemie` — Oberschule (Realschule) 9. Kl. · Chemie · user `curriculum-sachsen-oberschule-klasse-9`
- [x] `oberschule|9|biologie` — Oberschule (Realschule) 9. Kl. · Biologie · user `curriculum-sachsen-oberschule-klasse-9`
- [x] `oberschule|10|mathematik` — Oberschule (Realschule) 10. Kl. · Mathematik · user `curriculum-sachsen-oberschule-klasse-10`
- [ ] `oberschule|10|informatik` — Oberschule (Realschule) 10. Kl. · Informatik · user `curriculum-sachsen-oberschule-klasse-10`
- [ ] `oberschule|10|physik` — Oberschule (Realschule) 10. Kl. · Physik · user `curriculum-sachsen-oberschule-klasse-10`
- [ ] `oberschule|10|chemie` — Oberschule (Realschule) 10. Kl. · Chemie · user `curriculum-sachsen-oberschule-klasse-10`
- [ ] `oberschule|10|biologie` — Oberschule (Realschule) 10. Kl. · Biologie · user `curriculum-sachsen-oberschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-sachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-sachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-sachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-sachsen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-sachsen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-sachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-sachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-sachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-sachsen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-sachsen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-sachsen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-sachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-sachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-sachsen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-sachsen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-sachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-sachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-sachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-sachsen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-sachsen-gymnasium-klasse-10`

## Phase K — `lehrplan-thueringen` (Thüringen)

Provider: **Lehrplan (Thüringen)** · Region: `TH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `regelschule|7|mathematik` — Regelschule 7. Kl. · Mathematik · user `curriculum-thueringen-regelschule-klasse-7`
- [ ] `regelschule|7|informatik` — Regelschule 7. Kl. · Informatik · user `curriculum-thueringen-regelschule-klasse-7`
- [ ] `regelschule|7|physik` — Regelschule 7. Kl. · Physik · user `curriculum-thueringen-regelschule-klasse-7`
- [ ] `regelschule|7|chemie` — Regelschule 7. Kl. · Chemie · user `curriculum-thueringen-regelschule-klasse-7`
- [ ] `regelschule|7|biologie` — Regelschule 7. Kl. · Biologie · user `curriculum-thueringen-regelschule-klasse-7`
- [ ] `regelschule|8|mathematik` — Regelschule 8. Kl. · Mathematik · user `curriculum-thueringen-regelschule-klasse-8`
- [ ] `regelschule|8|informatik` — Regelschule 8. Kl. · Informatik · user `curriculum-thueringen-regelschule-klasse-8`
- [ ] `regelschule|8|physik` — Regelschule 8. Kl. · Physik · user `curriculum-thueringen-regelschule-klasse-8`
- [ ] `regelschule|8|chemie` — Regelschule 8. Kl. · Chemie · user `curriculum-thueringen-regelschule-klasse-8`
- [ ] `regelschule|8|biologie` — Regelschule 8. Kl. · Biologie · user `curriculum-thueringen-regelschule-klasse-8`
- [ ] `regelschule|9|mathematik` — Regelschule 9. Kl. · Mathematik · user `curriculum-thueringen-regelschule-klasse-9`
- [ ] `regelschule|9|informatik` — Regelschule 9. Kl. · Informatik · user `curriculum-thueringen-regelschule-klasse-9`
- [x] `regelschule|9|physik` — Regelschule 9. Kl. · Physik · user `curriculum-thueringen-regelschule-klasse-9`
- [x] `regelschule|9|chemie` — Regelschule 9. Kl. · Chemie · user `curriculum-thueringen-regelschule-klasse-9`
- [x] `regelschule|9|biologie` — Regelschule 9. Kl. · Biologie · user `curriculum-thueringen-regelschule-klasse-9`
- [x] `regelschule|10|mathematik` — Regelschule 10. Kl. · Mathematik · user `curriculum-thueringen-regelschule-klasse-10`
- [ ] `regelschule|10|informatik` — Regelschule 10. Kl. · Informatik · user `curriculum-thueringen-regelschule-klasse-10`
- [ ] `regelschule|10|physik` — Regelschule 10. Kl. · Physik · user `curriculum-thueringen-regelschule-klasse-10`
- [ ] `regelschule|10|chemie` — Regelschule 10. Kl. · Chemie · user `curriculum-thueringen-regelschule-klasse-10`
- [ ] `regelschule|10|biologie` — Regelschule 10. Kl. · Biologie · user `curriculum-thueringen-regelschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-thueringen-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-thueringen-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-thueringen-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-thueringen-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-thueringen-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-thueringen-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-thueringen-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-thueringen-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-thueringen-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-thueringen-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-thueringen-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-thueringen-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-thueringen-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-thueringen-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-thueringen-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-thueringen-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-thueringen-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-thueringen-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-thueringen-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-thueringen-gymnasium-klasse-10`

## Phase L — `lehrplanplus-bayern` (Bayern)

Provider: **LehrplanPLUS (Bayern)** · Region: `BY` · Paths: **678** · Topics today: **479** (71%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|5|bwl-rechnungswesen` — Realschule 5. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|biologie` — Realschule 5. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|chemie` — Realschule 5. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|deutsch` — Realschule 5. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|englisch` — Realschule 5. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|ernaehrung_und_gesundheit` — Realschule 5. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|ethik` — Realschule 5. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|evangelische-religionslehre` — Realschule 5. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|franzoesisch` — Realschule 5. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|geographie` — Realschule 5. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|geschichte` — Realschule 5. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|it` — Realschule 5. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|iu` — Realschule 5. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|ir` — Realschule 5. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|katholische-religionslehre` — Realschule 5. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|kunst` — Realschule 5. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|mathematik` — Realschule 5. Kl. · Mathematik · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|musik` — Realschule 5. Kl. · Musik · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|or` — Realschule 5. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|physik` — Realschule 5. Kl. · Physik · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|pug` — Realschule 5. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|soziallehre` — Realschule 5. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|sozialwesen` — Realschule 5. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|spanisch` — Realschule 5. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|sport|basis_sport` — Realschule 5. Kl. · Sport · Basissport 5 · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|sport|diff_sport` — Realschule 5. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|textiles-gestalten` — Realschule 5. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-5`
- [x] `realschule|5|werken` — Realschule 5. Kl. · Werken · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|5|wirtschaft-und-recht` — Realschule 5. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-5`
- [ ] `realschule|6|bwl-rechnungswesen` — Realschule 6. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|biologie` — Realschule 6. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|chemie` — Realschule 6. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|deutsch` — Realschule 6. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|englisch` — Realschule 6. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|ernaehrung_und_gesundheit` — Realschule 6. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|ethik` — Realschule 6. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|evangelische-religionslehre` — Realschule 6. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|franzoesisch` — Realschule 6. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|geographie` — Realschule 6. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|geschichte` — Realschule 6. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|it` — Realschule 6. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|iu` — Realschule 6. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|ir` — Realschule 6. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|katholische-religionslehre` — Realschule 6. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|kunst` — Realschule 6. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|mathematik` — Realschule 6. Kl. · Mathematik · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|musik` — Realschule 6. Kl. · Musik · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|or` — Realschule 6. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|physik` — Realschule 6. Kl. · Physik · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|pug` — Realschule 6. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|soziallehre` — Realschule 6. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|sozialwesen` — Realschule 6. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|spanisch` — Realschule 6. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|sport|basis_sport` — Realschule 6. Kl. · Sport · Basissport 6 · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|sport|diff_sport` — Realschule 6. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|textiles-gestalten` — Realschule 6. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-6`
- [x] `realschule|6|werken` — Realschule 6. Kl. · Werken · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|6|wirtschaft-und-recht` — Realschule 6. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-6`
- [ ] `realschule|7|bwl-rechnungswesen` — Realschule 7. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|deutsch` — Realschule 7. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|englisch` — Realschule 7. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|7|ernaehrung_und_gesundheit` — Realschule 7. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|ethik` — Realschule 7. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|evangelische-religionslehre` — Realschule 7. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|franzoesisch` — Realschule 7. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|geographie` — Realschule 7. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|geschichte` — Realschule 7. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|it` — Realschule 7. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|iu` — Realschule 7. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|ir` — Realschule 7. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|katholische-religionslehre` — Realschule 7. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|kunst` — Realschule 7. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|mathematik|wpfg1` — Realschule 7. Kl. · Mathematik · Mathematik 7 (I) · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|mathematik|wpfg2-3` — Realschule 7. Kl. · Mathematik · Mathematik 7 (II/III) · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|musik` — Realschule 7. Kl. · Musik · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|or` — Realschule 7. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|7|pug` — Realschule 7. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|7|soziallehre` — Realschule 7. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|sozialwesen` — Realschule 7. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|spanisch` — Realschule 7. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|sport|basis_sport` — Realschule 7. Kl. · Sport · Basissport 7 · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|sport|diff_sport` — Realschule 7. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|textiles-gestalten` — Realschule 7. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-7`
- [x] `realschule|7|werken` — Realschule 7. Kl. · Werken · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|7|wirtschaft-und-recht` — Realschule 7. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-7`
- [ ] `realschule|8|bwl-rechnungswesen` — Realschule 8. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|deutsch` — Realschule 8. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|englisch` — Realschule 8. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|ernaehrung_und_gesundheit` — Realschule 8. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|ethik` — Realschule 8. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|evangelische-religionslehre` — Realschule 8. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|franzoesisch` — Realschule 8. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|geographie` — Realschule 8. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|geschichte` — Realschule 8. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|it` — Realschule 8. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|iu` — Realschule 8. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|ir` — Realschule 8. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|katholische-religionslehre` — Realschule 8. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|kunst` — Realschule 8. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|mathematik|wpfg1` — Realschule 8. Kl. · Mathematik · Mathematik 8 (I) · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|mathematik|wpfg2-3` — Realschule 8. Kl. · Mathematik · Mathematik 8 (II/III) · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|musik` — Realschule 8. Kl. · Musik · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|or` — Realschule 8. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-bayern-realschule-klasse-8`
- [ ] `realschule|8|pug` — Realschule 8. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|soziallehre` — Realschule 8. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|sozialwesen` — Realschule 8. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|spanisch` — Realschule 8. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|sport|basis_sport` — Realschule 8. Kl. · Sport · Basissport 8 · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|sport|diff_sport` — Realschule 8. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|textiles-gestalten` — Realschule 8. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|werken` — Realschule 8. Kl. · Werken · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|8|wirtschaft-und-recht` — Realschule 8. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-8`
- [x] `realschule|9|bwl-rechnungswesen` — Realschule 9. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-9`
- [ ] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-9`
- [ ] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|deutsch` — Realschule 9. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|englisch` — Realschule 9. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|ernaehrung_und_gesundheit` — Realschule 9. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|ethik` — Realschule 9. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|evangelische-religionslehre` — Realschule 9. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|franzoesisch` — Realschule 9. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|geographie` — Realschule 9. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|geschichte` — Realschule 9. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|it` — Realschule 9. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|iu` — Realschule 9. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|ir` — Realschule 9. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|katholische-religionslehre` — Realschule 9. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|kunst` — Realschule 9. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|mathematik|wpfg1` — Realschule 9. Kl. · Mathematik · Mathematik 9 (I) · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|mathematik|wpfg2-3` — Realschule 9. Kl. · Mathematik · Mathematik 9 (II/III) · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|musik` — Realschule 9. Kl. · Musik · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|or` — Realschule 9. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-9`
- [ ] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-bayern-realschule-klasse-9`
- [ ] `realschule|9|pug` — Realschule 9. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|soziallehre` — Realschule 9. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|sozialwesen` — Realschule 9. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|spanisch` — Realschule 9. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|sport|basis_sport` — Realschule 9. Kl. · Sport · Basissport 9 · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|sport|diff_sport` — Realschule 9. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|textiles-gestalten` — Realschule 9. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|9|werken` — Realschule 9. Kl. · Werken · user `curriculum-bayern-realschule-klasse-9`
- [ ] `realschule|9|wirtschaft-und-recht` — Realschule 9. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-9`
- [x] `realschule|10|bwl-rechnungswesen` — Realschule 10. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-bayern-realschule-klasse-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|deutsch` — Realschule 10. Kl. · Deutsch · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|englisch` — Realschule 10. Kl. · Englisch · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|ernaehrung_und_gesundheit` — Realschule 10. Kl. · Ernährung und Gesundheit · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|ethik` — Realschule 10. Kl. · Ethik · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|evangelische-religionslehre` — Realschule 10. Kl. · Evangelische Religionslehre · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|franzoesisch` — Realschule 10. Kl. · Französisch · user `curriculum-bayern-realschule-klasse-10`
- [ ] `realschule|10|geographie` — Realschule 10. Kl. · Geographie · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|geschichte` — Realschule 10. Kl. · Geschichte · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|it` — Realschule 10. Kl. · Informationstechnologie · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|iu` — Realschule 10. Kl. · Islamischer Unterricht · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|ir` — Realschule 10. Kl. · Israelitische Religionslehre · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|katholische-religionslehre` — Realschule 10. Kl. · Katholische Religionslehre · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|kunst` — Realschule 10. Kl. · Kunst · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|mathematik|wpfg1` — Realschule 10. Kl. · Mathematik · Mathematik 10 (I) · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|mathematik|wpfg2-3` — Realschule 10. Kl. · Mathematik · Mathematik 10 (II/III) · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|musik` — Realschule 10. Kl. · Musik · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|or` — Realschule 10. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-realschule-klasse-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|pug` — Realschule 10. Kl. · Politik und Gesellschaft · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|soziallehre` — Realschule 10. Kl. · Soziallehre · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|sozialwesen` — Realschule 10. Kl. · Sozialwesen · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|spanisch` — Realschule 10. Kl. · Spanisch · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|sport|basis_sport` — Realschule 10. Kl. · Sport · Basissport 10 · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|sport|diff_sport` — Realschule 10. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-realschule-klasse-10`
- [ ] `realschule|10|textiles-gestalten` — Realschule 10. Kl. · Textiles Gestalten · user `curriculum-bayern-realschule-klasse-10`
- [x] `realschule|10|werken` — Realschule 10. Kl. · Werken · user `curriculum-bayern-realschule-klasse-10`
- [ ] `realschule|10|wirtschaft-und-recht` — Realschule 10. Kl. · Wirtschaft und Recht · user `curriculum-bayern-realschule-klasse-10`
- [ ] `gymnasium|5|biologie` — Gymnasium 5. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|deutsch` — Gymnasium 5. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|englisch` — Gymnasium 5. Kl. · Englisch · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|ethik` — Gymnasium 5. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|evangelische-religionslehre` — Gymnasium 5. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|franzoesisch` — Gymnasium 5. Kl. · Französisch · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|geographie` — Gymnasium 5. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|informatik` — Gymnasium 5. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|iu` — Gymnasium 5. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|ir` — Gymnasium 5. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|katholische-religionslehre` — Gymnasium 5. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|kunst` — Gymnasium 5. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|latein` — Gymnasium 5. Kl. · Latein · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|mathematik` — Gymnasium 5. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|musik` — Gymnasium 5. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|nt_gym` — Gymnasium 5. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|or` — Gymnasium 5. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|sport|basis_sport` — Gymnasium 5. Kl. · Sport · Basissport 5 · user `curriculum-bayern-gymnasium-klasse-5`
- [x] `gymnasium|5|sport|diff_sport` — Gymnasium 5. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|geschichte` — Gymnasium 5. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|physik` — Gymnasium 5. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|chemie` — Gymnasium 5. Kl. · Chemie · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|chi` — Gymnasium 5. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|griechisch` — Gymnasium 5. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|italienisch` — Gymnasium 5. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|pug` — Gymnasium 5. Kl. · Politik und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|russisch` — Gymnasium 5. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|spanisch` — Gymnasium 5. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|wirtschaft-und-recht` — Gymnasium 5. Kl. · Wirtschaft und Recht · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|wirtschaftsinformatik` — Gymnasium 5. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|berufliche_orientierung` — Gymnasium 5. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|sozialpraktische-grundbildung` — Gymnasium 5. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|biolog-chem-praktikum` — Gymnasium 5. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|pln` — Gymnasium 5. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|sozialwissenschaftl-arbeitsfelder` — Gymnasium 5. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|tsh` — Gymnasium 5. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|tr` — Gymnasium 5. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|ar` — Gymnasium 5. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|instrumentalensemble` — Gymnasium 5. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|ps` — Gymnasium 5. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|sug` — Gymnasium 5. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|stb` — Gymnasium 5. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|tuf` — Gymnasium 5. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|vokalensemble` — Gymnasium 5. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|w-seminar` — Gymnasium 5. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|5|geol` — Gymnasium 5. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-5`
- [ ] `gymnasium|6|biologie` — Gymnasium 6. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|deutsch` — Gymnasium 6. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|englisch|1-fremdsprache` — Gymnasium 6. Kl. · Englisch · Englisch 6 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|englisch|2-fremdsprache` — Gymnasium 6. Kl. · Englisch · Englisch 6 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|ethik` — Gymnasium 6. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|evangelische-religionslehre` — Gymnasium 6. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|franzoesisch|1-fremdsprache` — Gymnasium 6. Kl. · Französisch · Französisch 6 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|franzoesisch|2-fremdsprache` — Gymnasium 6. Kl. · Französisch · Französisch 6 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|geographie` — Gymnasium 6. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|informatik` — Gymnasium 6. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|iu` — Gymnasium 6. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|ir` — Gymnasium 6. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|katholische-religionslehre` — Gymnasium 6. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|kunst` — Gymnasium 6. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|latein|1-fremdsprache` — Gymnasium 6. Kl. · Latein · Latein 6 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|latein|2-fremdsprache` — Gymnasium 6. Kl. · Latein · Latein 6 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|mathematik` — Gymnasium 6. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|musik` — Gymnasium 6. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|nt_gym` — Gymnasium 6. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|or` — Gymnasium 6. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|sport|basis_sport` — Gymnasium 6. Kl. · Sport · Basissport 6 · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|sport|diff_sport` — Gymnasium 6. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-6`
- [x] `gymnasium|6|geschichte` — Gymnasium 6. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|physik` — Gymnasium 6. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|chemie` — Gymnasium 6. Kl. · Chemie · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|chi` — Gymnasium 6. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|griechisch` — Gymnasium 6. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|italienisch` — Gymnasium 6. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|pug` — Gymnasium 6. Kl. · Politik und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|russisch` — Gymnasium 6. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|spanisch` — Gymnasium 6. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|wirtschaft-und-recht` — Gymnasium 6. Kl. · Wirtschaft und Recht · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|wirtschaftsinformatik` — Gymnasium 6. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|berufliche_orientierung` — Gymnasium 6. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|sozialpraktische-grundbildung` — Gymnasium 6. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|biolog-chem-praktikum` — Gymnasium 6. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|pln` — Gymnasium 6. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|sozialwissenschaftl-arbeitsfelder` — Gymnasium 6. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|tsh` — Gymnasium 6. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|tr` — Gymnasium 6. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|ar` — Gymnasium 6. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|instrumentalensemble` — Gymnasium 6. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|ps` — Gymnasium 6. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|sug` — Gymnasium 6. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|stb` — Gymnasium 6. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|tuf` — Gymnasium 6. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|vokalensemble` — Gymnasium 6. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|w-seminar` — Gymnasium 6. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|6|geol` — Gymnasium 6. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-6`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|deutsch` — Gymnasium 7. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|englisch|1-fremdsprache` — Gymnasium 7. Kl. · Englisch · Englisch 7 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|englisch|2-fremdsprache` — Gymnasium 7. Kl. · Englisch · Englisch 7 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|ethik` — Gymnasium 7. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|evangelische-religionslehre` — Gymnasium 7. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|franzoesisch|1-fremdsprache` — Gymnasium 7. Kl. · Französisch · Französisch 7 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|franzoesisch|2-fremdsprache` — Gymnasium 7. Kl. · Französisch · Französisch 7 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|geographie` — Gymnasium 7. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|iu` — Gymnasium 7. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|ir` — Gymnasium 7. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|katholische-religionslehre` — Gymnasium 7. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|kunst` — Gymnasium 7. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|latein|1-fremdsprache` — Gymnasium 7. Kl. · Latein · Latein 7 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|latein|2-fremdsprache` — Gymnasium 7. Kl. · Latein · Latein 7 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|musik` — Gymnasium 7. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|nt_gym` — Gymnasium 7. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|or` — Gymnasium 7. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|sport|basis_sport` — Gymnasium 7. Kl. · Sport · Basissport 7 · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|sport|diff_sport` — Gymnasium 7. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|7|geschichte` — Gymnasium 7. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|chi` — Gymnasium 7. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|griechisch` — Gymnasium 7. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|italienisch` — Gymnasium 7. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|pug` — Gymnasium 7. Kl. · Politik und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|russisch` — Gymnasium 7. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|spanisch` — Gymnasium 7. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|wirtschaft-und-recht` — Gymnasium 7. Kl. · Wirtschaft und Recht · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|wirtschaftsinformatik` — Gymnasium 7. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|berufliche_orientierung` — Gymnasium 7. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|sozialpraktische-grundbildung` — Gymnasium 7. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|biolog-chem-praktikum` — Gymnasium 7. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|pln` — Gymnasium 7. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|sozialwissenschaftl-arbeitsfelder` — Gymnasium 7. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|tsh` — Gymnasium 7. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|tr` — Gymnasium 7. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|ar` — Gymnasium 7. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|instrumentalensemble` — Gymnasium 7. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|ps` — Gymnasium 7. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|sug` — Gymnasium 7. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|stb` — Gymnasium 7. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|tuf` — Gymnasium 7. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|vokalensemble` — Gymnasium 7. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|w-seminar` — Gymnasium 7. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-7`
- [ ] `gymnasium|7|geol` — Gymnasium 7. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-7`
- [x] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|deutsch` — Gymnasium 8. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|englisch|1-fremdsprache` — Gymnasium 8. Kl. · Englisch · Englisch 8 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|englisch|2-fremdsprache` — Gymnasium 8. Kl. · Englisch · Englisch 8 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|ethik` — Gymnasium 8. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|evangelische-religionslehre` — Gymnasium 8. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|franzoesisch|1fs` — Gymnasium 8. Kl. · Französisch · Französisch 8 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|franzoesisch|2fs` — Gymnasium 8. Kl. · Französisch · Französisch 8 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|franzoesisch|3-fremdsprache` — Gymnasium 8. Kl. · Französisch · Französisch 8 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|geographie` — Gymnasium 8. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|iu` — Gymnasium 8. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|ir` — Gymnasium 8. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|katholische-religionslehre` — Gymnasium 8. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|kunst` — Gymnasium 8. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|latein|1-fremdsprache` — Gymnasium 8. Kl. · Latein · Latein 8 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|latein|2-fremdsprache` — Gymnasium 8. Kl. · Latein · Latein 8 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|musik` — Gymnasium 8. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|nt_gym` — Gymnasium 8. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|or` — Gymnasium 8. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|sport|basis_sport` — Gymnasium 8. Kl. · Sport · Basissport 8 · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|sport|diff_sport` — Gymnasium 8. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|geschichte` — Gymnasium 8. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|chi` — Gymnasium 8. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|griechisch` — Gymnasium 8. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|italienisch` — Gymnasium 8. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|pug` — Gymnasium 8. Kl. · Politik und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|russisch` — Gymnasium 8. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|spanisch` — Gymnasium 8. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|8|wirtschaft-und-recht` — Gymnasium 8. Kl. · Wirtschaft und Recht · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|wirtschaftsinformatik` — Gymnasium 8. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|berufliche_orientierung` — Gymnasium 8. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|sozialpraktische-grundbildung` — Gymnasium 8. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|biolog-chem-praktikum` — Gymnasium 8. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|pln` — Gymnasium 8. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|sozialwissenschaftl-arbeitsfelder` — Gymnasium 8. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|tsh` — Gymnasium 8. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|tr` — Gymnasium 8. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|ar` — Gymnasium 8. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|instrumentalensemble` — Gymnasium 8. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|ps` — Gymnasium 8. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|sug` — Gymnasium 8. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|stb` — Gymnasium 8. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|tuf` — Gymnasium 8. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|vokalensemble` — Gymnasium 8. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|w-seminar` — Gymnasium 8. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-8`
- [ ] `gymnasium|8|geol` — Gymnasium 8. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-8`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|deutsch` — Gymnasium 9. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|englisch|1-fremdsprache` — Gymnasium 9. Kl. · Englisch · Englisch 9 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|englisch|2-fremdsprache` — Gymnasium 9. Kl. · Englisch · Englisch 9 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|ethik` — Gymnasium 9. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|evangelische-religionslehre` — Gymnasium 9. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|franzoesisch|1-fremdsprache` — Gymnasium 9. Kl. · Französisch · Französisch 9 (1. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|franzoesisch|2-fremdsprache` — Gymnasium 9. Kl. · Französisch · Französisch 9 (2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|franzoesisch|3-fremdsprache` — Gymnasium 9. Kl. · Französisch · Französisch 9 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|geographie` — Gymnasium 9. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|iu` — Gymnasium 9. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|ir` — Gymnasium 9. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|katholische-religionslehre` — Gymnasium 9. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|kunst` — Gymnasium 9. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|latein` — Gymnasium 9. Kl. · Latein · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|musik` — Gymnasium 9. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|nt_gym` — Gymnasium 9. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|or` — Gymnasium 9. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|sport|basis_sport` — Gymnasium 9. Kl. · Sport · Basissport 9 · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|sport|diff_sport` — Gymnasium 9. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|geschichte` — Gymnasium 9. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie|ch` — Gymnasium 9. Kl. · Chemie · Chemie 9 (HG, SG, MuG, WWG, SWG) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie|ch-ntg` — Gymnasium 9. Kl. · Chemie · Chemie 9 (NTG) · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|chi` — Gymnasium 9. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|griechisch` — Gymnasium 9. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|italienisch` — Gymnasium 9. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|pug` — Gymnasium 9. Kl. · Politik und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|russisch` — Gymnasium 9. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|spanisch` — Gymnasium 9. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|wirtschaft-und-recht` — Gymnasium 9. Kl. · Wirtschaft und Recht · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|wirtschaftsinformatik` — Gymnasium 9. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|berufliche_orientierung` — Gymnasium 9. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|9|sozialpraktische-grundbildung` — Gymnasium 9. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|biolog-chem-praktikum` — Gymnasium 9. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|pln` — Gymnasium 9. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|sozialwissenschaftl-arbeitsfelder` — Gymnasium 9. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|tsh` — Gymnasium 9. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|tr` — Gymnasium 9. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|ar` — Gymnasium 9. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|instrumentalensemble` — Gymnasium 9. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|ps` — Gymnasium 9. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|sug` — Gymnasium 9. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|stb` — Gymnasium 9. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|tuf` — Gymnasium 9. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|vokalensemble` — Gymnasium 9. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|w-seminar` — Gymnasium 9. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-9`
- [ ] `gymnasium|9|geol` — Gymnasium 9. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-9`
- [x] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|deutsch` — Gymnasium 10. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|englisch` — Gymnasium 10. Kl. · Englisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|ethik` — Gymnasium 10. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|evangelische-religionslehre` — Gymnasium 10. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|franzoesisch|1-2-fremdsprache` — Gymnasium 10. Kl. · Französisch · Französisch 10 (1. und 2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|franzoesisch|3-fremdsprache` — Gymnasium 10. Kl. · Französisch · Französisch 10 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|geographie` — Gymnasium 10. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|iu` — Gymnasium 10. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|ir` — Gymnasium 10. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|katholische-religionslehre` — Gymnasium 10. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|kunst` — Gymnasium 10. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|latein` — Gymnasium 10. Kl. · Latein · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|musik` — Gymnasium 10. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|nt_gym` — Gymnasium 10. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|or` — Gymnasium 10. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|sport|basis_sport` — Gymnasium 10. Kl. · Sport · Basissport 10 · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|sport|diff_sport` — Gymnasium 10. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|geschichte` — Gymnasium 10. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|chemie|ch` — Gymnasium 10. Kl. · Chemie · Chemie 10 (HG, SG, MuG, WWG, SWG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|chemie|ch-ntg` — Gymnasium 10. Kl. · Chemie · Chemie 10 (NTG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|chi` — Gymnasium 10. Kl. · Chinesisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|griechisch` — Gymnasium 10. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|italienisch` — Gymnasium 10. Kl. · Italienisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|pug|einstuendig` — Gymnasium 10. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 10 (HG, SG, NTG, MuG, WWG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|pug|zweistuendig` — Gymnasium 10. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 10 (SWG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|russisch` — Gymnasium 10. Kl. · Russisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|spanisch` — Gymnasium 10. Kl. · Spanisch · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|wirtschaft-und-recht|andere` — Gymnasium 10. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 10 (HG, SG, NTG, MuG, SWG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|wirtschaft-und-recht|wwg` — Gymnasium 10. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 10 (WWG) · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|wirtschaftsinformatik` — Gymnasium 10. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|berufliche_orientierung` — Gymnasium 10. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-10`
- [x] `gymnasium|10|sozialpraktische-grundbildung` — Gymnasium 10. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|biolog-chem-praktikum` — Gymnasium 10. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|pln` — Gymnasium 10. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|sozialwissenschaftl-arbeitsfelder` — Gymnasium 10. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|tsh` — Gymnasium 10. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|tr` — Gymnasium 10. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|ar` — Gymnasium 10. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|instrumentalensemble` — Gymnasium 10. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|ps` — Gymnasium 10. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|sug` — Gymnasium 10. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|stb` — Gymnasium 10. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|tuf` — Gymnasium 10. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|vokalensemble` — Gymnasium 10. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|w-seminar` — Gymnasium 10. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|10|geol` — Gymnasium 10. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-10`
- [ ] `gymnasium|11|biologie` — Gymnasium 11. Kl. · Biologie · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|deutsch` — Gymnasium 11. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|englisch` — Gymnasium 11. Kl. · Englisch · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|ethik` — Gymnasium 11. Kl. · Ethik · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|evangelische-religionslehre` — Gymnasium 11. Kl. · Evangelische Religionslehre · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|franzoesisch|1-2-fremdsprache` — Gymnasium 11. Kl. · Französisch · Französisch 11 (1. und 2. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|franzoesisch|3-fremdsprache` — Gymnasium 11. Kl. · Französisch · Französisch 11 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|franzoesisch|spaet-fremdsprache` — Gymnasium 11. Kl. · Französisch · Französisch 11 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|geographie` — Gymnasium 11. Kl. · Geographie · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|informatik|ntg` — Gymnasium 11. Kl. · Informatik · Informatik 11 (NTG) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|informatik|mug_swg_sg` — Gymnasium 11. Kl. · Informatik · spät beginnende Informatik 11 (HG, SG, MuG, SWG) · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|iu` — Gymnasium 11. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|ir` — Gymnasium 11. Kl. · Israelitische Religionslehre · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|katholische-religionslehre` — Gymnasium 11. Kl. · Katholische Religionslehre · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|kunst` — Gymnasium 11. Kl. · Kunst · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|latein` — Gymnasium 11. Kl. · Latein · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|mathematik` — Gymnasium 11. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|musik` — Gymnasium 11. Kl. · Musik · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|nt_gym` — Gymnasium 11. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|or` — Gymnasium 11. Kl. · Orthodoxe Religionslehre · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|sport|basis_sport` — Gymnasium 11. Kl. · Sport · Basissport 11 · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|sport|diff_sport` — Gymnasium 11. Kl. · Sport · Differenzierter Sport · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|geschichte` — Gymnasium 11. Kl. · Geschichte · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|physik` — Gymnasium 11. Kl. · Physik · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|chemie` — Gymnasium 11. Kl. · Chemie · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|chi|fs3` — Gymnasium 11. Kl. · Chinesisch · Chinesisch 11 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|chi|spaet` — Gymnasium 11. Kl. · Chinesisch · Chinesisch 11 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|griechisch` — Gymnasium 11. Kl. · Griechisch · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|italienisch|3-fremdsprache` — Gymnasium 11. Kl. · Italienisch · Italienisch 11 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|italienisch|spaet-fremdsprache` — Gymnasium 11. Kl. · Italienisch · Italienisch 11 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|pug|zweistuendig` — Gymnasium 11. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 11 (HG, SG, NTG, MuG, WWG) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|pug|dreistuendig` — Gymnasium 11. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 11 (SWG) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|russisch|3-fremdsprache` — Gymnasium 11. Kl. · Russisch · Russisch 11 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|russisch|spaet-fremdsprache` — Gymnasium 11. Kl. · Russisch · Russisch 11 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|spanisch|3-fremdsprache` — Gymnasium 11. Kl. · Spanisch · Spanisch 11 (3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|spanisch|spaet-fremdsprache` — Gymnasium 11. Kl. · Spanisch · Spanisch 11 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|wirtschaft-und-recht|andere` — Gymnasium 11. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 11 (HG, SG, NTG, MuG, SWG) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|wirtschaft-und-recht|wwg` — Gymnasium 11. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 11 (WWG) · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|wirtschaftsinformatik` — Gymnasium 11. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|berufliche_orientierung` — Gymnasium 11. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|sozialpraktische-grundbildung` — Gymnasium 11. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|biolog-chem-praktikum` — Gymnasium 11. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|pln` — Gymnasium 11. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|sozialwissenschaftl-arbeitsfelder` — Gymnasium 11. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|tsh` — Gymnasium 11. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|11|tr` — Gymnasium 11. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|ar` — Gymnasium 11. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|instrumentalensemble` — Gymnasium 11. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|ps` — Gymnasium 11. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|sug` — Gymnasium 11. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|stb` — Gymnasium 11. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|tuf` — Gymnasium 11. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|vokalensemble` — Gymnasium 11. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|w-seminar` — Gymnasium 11. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-11`
- [ ] `gymnasium|11|geol` — Gymnasium 11. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-11`
- [x] `gymnasium|12|biologie|grundlegend` — Gymnasium 12. Kl. · Biologie · Biologie 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|biologie|erhoeht` — Gymnasium 12. Kl. · Biologie · Biologie 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|deutsch|regulaer` — Gymnasium 12. Kl. · Deutsch · Deutsch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|deutsch|vertieft` — Gymnasium 12. Kl. · Deutsch · Deutsch 12 (Vertiefungskurs) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|englisch|grundlegend` — Gymnasium 12. Kl. · Englisch · Englisch 12/13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|englisch|erhoeht` — Gymnasium 12. Kl. · Englisch · Englisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ethik|grundlegend` — Gymnasium 12. Kl. · Ethik · Ethik 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ethik|erhoeht` — Gymnasium 12. Kl. · Ethik · Ethik 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|evangelische-religionslehre|grundlegend` — Gymnasium 12. Kl. · Evangelische Religionslehre · Evangelische Religionslehre 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|evangelische-religionslehre|erhoeht` — Gymnasium 12. Kl. · Evangelische Religionslehre · Evangelische Religionslehre 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|franzoesisch|grundlegend-1-2-3` — Gymnasium 12. Kl. · Französisch · Französisch 12/13 (grundlegendes Anforderungsniveau, 1., 2. und 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|franzoesisch|grundlegend-spaet` — Gymnasium 12. Kl. · Französisch · Französisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|franzoesisch|erhoeht` — Gymnasium 12. Kl. · Französisch · Französisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|geographie|grundlegend` — Gymnasium 12. Kl. · Geographie · Geographie 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|geographie|erhoeht` — Gymnasium 12. Kl. · Geographie · Geographie 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|informatik|grundlegend` — Gymnasium 12. Kl. · Informatik · Informatik 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|informatik|erhoeht` — Gymnasium 12. Kl. · Informatik · Informatik 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|informatik|grundlegend-spaet` — Gymnasium 12. Kl. · Informatik · spät beginnende Informatik 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [ ] `gymnasium|12|iu` — Gymnasium 12. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ir|grundlegend` — Gymnasium 12. Kl. · Israelitische Religionslehre · Israelitische Religionslehre 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ir|erhoeht` — Gymnasium 12. Kl. · Israelitische Religionslehre · Israelitische Religionslehre 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|katholische-religionslehre|grundlegend` — Gymnasium 12. Kl. · Katholische Religionslehre · Katholische Religionslehre 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|katholische-religionslehre|erhoeht` — Gymnasium 12. Kl. · Katholische Religionslehre · Katholische Religionslehre 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|kunst|grundlegend` — Gymnasium 12. Kl. · Kunst · Kunst 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|kunst|erhoeht` — Gymnasium 12. Kl. · Kunst · Kunst 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|latein|grundlegend` — Gymnasium 12. Kl. · Latein · Latein 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|latein|erhoeht` — Gymnasium 12. Kl. · Latein · Latein 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|mathematik|regulaer` — Gymnasium 12. Kl. · Mathematik · Mathematik 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|mathematik|vertieft` — Gymnasium 12. Kl. · Mathematik · Mathematik 12 (Vertiefungskurs) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|musik|grundlegend` — Gymnasium 12. Kl. · Musik · Musik 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|musik|erhoeht` — Gymnasium 12. Kl. · Musik · Musik 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [ ] `gymnasium|12|nt_gym` — Gymnasium 12. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|or|grundlegend` — Gymnasium 12. Kl. · Orthodoxe Religionslehre · Orthodoxe Religionslehre 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|or|erhoeht` — Gymnasium 12. Kl. · Orthodoxe Religionslehre · Orthodoxe Religionslehre 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|sport|basissport` — Gymnasium 12. Kl. · Sport · Sport 12/13 · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|sport|sporttheorie` — Gymnasium 12. Kl. · Sport · Sporttheorie 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|geschichte|grundlegend` — Gymnasium 12. Kl. · Geschichte · Geschichte 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|geschichte|erhoeht` — Gymnasium 12. Kl. · Geschichte · Geschichte 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|physik|grundlegend` — Gymnasium 12. Kl. · Physik · Physik 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|physik|grundlegend-bio` — Gymnasium 12. Kl. · Physik · Physik 12 (grundlegendes Anforderungsniveau, Biophysik) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|physik|erhoeht` — Gymnasium 12. Kl. · Physik · Physik 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|chemie|grundlegend` — Gymnasium 12. Kl. · Chemie · Chemie 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|chemie|erhoeht` — Gymnasium 12. Kl. · Chemie · Chemie 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|chi|grundlegend-spaet` — Gymnasium 12. Kl. · Chinesisch · Chinesisch 12 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|chi|grundlegend-3` — Gymnasium 12. Kl. · Chinesisch · Chinesisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|griechisch|grundlegend` — Gymnasium 12. Kl. · Griechisch · Griechisch 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|griechisch|erhoeht` — Gymnasium 12. Kl. · Griechisch · Griechisch 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|italienisch|grundlegend-3` — Gymnasium 12. Kl. · Italienisch · Italienisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|italienisch|grundlegend-spaet` — Gymnasium 12. Kl. · Italienisch · Italienisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|italienisch|erhoeht` — Gymnasium 12. Kl. · Italienisch · Italienisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|pug|grundlegend` — Gymnasium 12. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|pug|erhoeht` — Gymnasium 12. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|russisch|grundlegend-3` — Gymnasium 12. Kl. · Russisch · Russisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|russisch|grundlegend-spaet` — Gymnasium 12. Kl. · Russisch · Russisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|russisch|erhoeht` — Gymnasium 12. Kl. · Russisch · Russisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|spanisch|grundlegend-3` — Gymnasium 12. Kl. · Spanisch · Spanisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|spanisch|grundlegend-spaet` — Gymnasium 12. Kl. · Spanisch · Spanisch 12 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|spanisch|erhoeht` — Gymnasium 12. Kl. · Spanisch · Spanisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|wirtschaft-und-recht|grundlegend` — Gymnasium 12. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 12 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|wirtschaft-und-recht|erhoeht` — Gymnasium 12. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 12 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|wirtschaftsinformatik` — Gymnasium 12. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|berufliche_orientierung` — Gymnasium 12. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-12`
- [ ] `gymnasium|12|sozialpraktische-grundbildung` — Gymnasium 12. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|biolog-chem-praktikum` — Gymnasium 12. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|pln` — Gymnasium 12. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|sozialwissenschaftl-arbeitsfelder` — Gymnasium 12. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|tsh` — Gymnasium 12. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|tr` — Gymnasium 12. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ar` — Gymnasium 12. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|instrumentalensemble` — Gymnasium 12. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|ps` — Gymnasium 12. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|sug` — Gymnasium 12. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|stb` — Gymnasium 12. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|tuf` — Gymnasium 12. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|vokalensemble` — Gymnasium 12. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|12|w-seminar` — Gymnasium 12. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-12`
- [ ] `gymnasium|12|geol` — Gymnasium 12. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-12`
- [x] `gymnasium|13|biologie|grundlegend` — Gymnasium 13. Kl. · Biologie · Biologie 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|biologie|erhoeht` — Gymnasium 13. Kl. · Biologie · Biologie 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|deutsch` — Gymnasium 13. Kl. · Deutsch · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|englisch|grundlegend` — Gymnasium 13. Kl. · Englisch · Englisch 12/13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|englisch|erhoeht` — Gymnasium 13. Kl. · Englisch · Englisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ethik|grundlegend` — Gymnasium 13. Kl. · Ethik · Ethik 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ethik|erhoeht` — Gymnasium 13. Kl. · Ethik · Ethik 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|evangelische-religionslehre|grundlegend` — Gymnasium 13. Kl. · Evangelische Religionslehre · Evangelische Religionslehre 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|evangelische-religionslehre|erhoeht` — Gymnasium 13. Kl. · Evangelische Religionslehre · Evangelische Religionslehre 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|franzoesisch|grundlegend-1-2-3` — Gymnasium 13. Kl. · Französisch · Französisch 12/13 (grundlegendes Anforderungsniveau, 1., 2. und 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|franzoesisch|grundlegend-spaet` — Gymnasium 13. Kl. · Französisch · Französisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|franzoesisch|erhoeht` — Gymnasium 13. Kl. · Französisch · Französisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|geographie|grundlegend` — Gymnasium 13. Kl. · Geographie · Geographie 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|geographie|erhoeht` — Gymnasium 13. Kl. · Geographie · Geographie 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|informatik|grundlegend` — Gymnasium 13. Kl. · Informatik · Informatik 13 und spät beginnende Informatik 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|informatik|erhoeht` — Gymnasium 13. Kl. · Informatik · Informatik 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [ ] `gymnasium|13|iu` — Gymnasium 13. Kl. · Islamischer Unterricht · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ir|grundlegend` — Gymnasium 13. Kl. · Israelitische Religionslehre · Israelitische Religionslehre 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ir|erhoeht` — Gymnasium 13. Kl. · Israelitische Religionslehre · Israelitische Religionslehre 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|katholische-religionslehre|grundlegend` — Gymnasium 13. Kl. · Katholische Religionslehre · Katholische Religionslehre 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|katholische-religionslehre|erhoeht` — Gymnasium 13. Kl. · Katholische Religionslehre · Katholische Religionslehre 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|kunst|grundlegend` — Gymnasium 13. Kl. · Kunst · Kunst 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|kunst|erhoeht` — Gymnasium 13. Kl. · Kunst · Kunst 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|latein|grundlegend` — Gymnasium 13. Kl. · Latein · Latein 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|latein|erhoeht` — Gymnasium 13. Kl. · Latein · Latein 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|mathematik` — Gymnasium 13. Kl. · Mathematik · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|musik|grundlegend` — Gymnasium 13. Kl. · Musik · Musik 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|musik|erhoeht` — Gymnasium 13. Kl. · Musik · Musik 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [ ] `gymnasium|13|nt_gym` — Gymnasium 13. Kl. · Natur und Technik (Gym) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|or|grundlegend` — Gymnasium 13. Kl. · Orthodoxe Religionslehre · Orthodoxe Religionslehre 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|or|erhoeht` — Gymnasium 13. Kl. · Orthodoxe Religionslehre · Orthodoxe Religionslehre 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|sport|basissport` — Gymnasium 13. Kl. · Sport · Sport 12/13 · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|sport|sporttheorie` — Gymnasium 13. Kl. · Sport · Sporttheorie 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|geschichte|grundlegend` — Gymnasium 13. Kl. · Geschichte · Geschichte 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|geschichte|erhoeht` — Gymnasium 13. Kl. · Geschichte · Geschichte 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|physik|grundlegend` — Gymnasium 13. Kl. · Physik · Physik 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|physik|grundlegend-astro` — Gymnasium 13. Kl. · Physik · Physik 13 (grundlegendes Anforderungsniveau, Astrophysik) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|physik|erhoeht` — Gymnasium 13. Kl. · Physik · Physik 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|chemie|grundlegend` — Gymnasium 13. Kl. · Chemie · Chemie 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|chemie|erhoeht` — Gymnasium 13. Kl. · Chemie · Chemie 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|chi|grundlegend-3` — Gymnasium 13. Kl. · Chinesisch · Chinesisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|chi|grundlegend-spaet` — Gymnasium 13. Kl. · Chinesisch · Chinesisch 13 (spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|griechisch|grundlegend` — Gymnasium 13. Kl. · Griechisch · Griechisch 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|griechisch|erhoeht` — Gymnasium 13. Kl. · Griechisch · Griechisch 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|italienisch|grundlegend-3` — Gymnasium 13. Kl. · Italienisch · Italienisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|italienisch|grundlegend-spaet` — Gymnasium 13. Kl. · Italienisch · Italienisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|italienisch|erhoeht` — Gymnasium 13. Kl. · Italienisch · Italienisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|pug|grundlegend` — Gymnasium 13. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|pug|erhoeht` — Gymnasium 13. Kl. · Politik und Gesellschaft · Politik und Gesellschaft 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|russisch|grundlegend-3` — Gymnasium 13. Kl. · Russisch · Russisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|russisch|grundlegend-spaet` — Gymnasium 13. Kl. · Russisch · Russisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|russisch|erhoeht` — Gymnasium 13. Kl. · Russisch · Russisch 12/13 (erhöhtes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|spanisch|grundlegend-3` — Gymnasium 13. Kl. · Spanisch · Spanisch 12/13 (grundlegendes Anforderungsniveau, 3. Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|spanisch|grundlegend-spaet` — Gymnasium 13. Kl. · Spanisch · Spanisch 13 (grundlegendes Anforderungsniveau, spät beginnende Fremdsprache) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|spanisch|erhoeht` — Gymnasium 13. Kl. · Spanisch · Spanisch 12/13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|wirtschaft-und-recht|grundlegend` — Gymnasium 13. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 13 (grundlegendes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|wirtschaft-und-recht|erhoeht` — Gymnasium 13. Kl. · Wirtschaft und Recht · Wirtschaft und Recht 13 (erhöhtes Anforderungsniveau) · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|wirtschaftsinformatik` — Gymnasium 13. Kl. · Wirtschaftsinformatik · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|berufliche_orientierung` — Gymnasium 13. Kl. · Berufliche Orientierung · user `curriculum-bayern-gymnasium-klasse-13`
- [ ] `gymnasium|13|sozialpraktische-grundbildung` — Gymnasium 13. Kl. · Sozialpraktische Grundbildung · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|biolog-chem-praktikum` — Gymnasium 13. Kl. · Biologisch-chemisches Praktikum · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|pln` — Gymnasium 13. Kl. · Polnisch · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|sozialwissenschaftl-arbeitsfelder` — Gymnasium 13. Kl. · Sozialwissenschaftliche Arbeitsfelder · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|tsh` — Gymnasium 13. Kl. · Tschechisch · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|tr` — Gymnasium 13. Kl. · Türkisch · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ar` — Gymnasium 13. Kl. · Archäologie · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|instrumentalensemble` — Gymnasium 13. Kl. · Instrumentalensemble · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|ps` — Gymnasium 13. Kl. · Psychologie · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|sug` — Gymnasium 13. Kl. · Sport und Gesellschaft · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|stb` — Gymnasium 13. Kl. · Tanz- und Bewegungskünstetheater · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|tuf` — Gymnasium 13. Kl. · Theater und Film · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|vokalensemble` — Gymnasium 13. Kl. · Vokalensemble · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|w-seminar` — Gymnasium 13. Kl. · Wissenschaftspropädeutisches Seminar · user `curriculum-bayern-gymnasium-klasse-13`
- [x] `gymnasium|13|geol` — Gymnasium 13. Kl. · Geologie · user `curriculum-bayern-gymnasium-klasse-13`

## Phase M — `rahmenlehrplan-berlin-brandenburg` (Berlin / Brandenburg)

Provider: **Rahmenlehrplan (Berlin-Brandenburg)** · Region: `BE-BB` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-berlin-brandenburg-realschule-klasse-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-berlin-brandenburg-realschule-klasse-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-berlin-brandenburg-realschule-klasse-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-berlin-brandenburg-realschule-klasse-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-berlin-brandenburg-realschule-klasse-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-berlin-brandenburg-realschule-klasse-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-berlin-brandenburg-realschule-klasse-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-berlin-brandenburg-realschule-klasse-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-berlin-brandenburg-realschule-klasse-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-berlin-brandenburg-realschule-klasse-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-berlin-brandenburg-realschule-klasse-9`
- [x] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-berlin-brandenburg-realschule-klasse-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-berlin-brandenburg-realschule-klasse-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-berlin-brandenburg-realschule-klasse-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-berlin-brandenburg-realschule-klasse-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-berlin-brandenburg-realschule-klasse-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-berlin-brandenburg-realschule-klasse-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-berlin-brandenburg-realschule-klasse-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-berlin-brandenburg-realschule-klasse-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-berlin-brandenburg-realschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-berlin-brandenburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-berlin-brandenburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-berlin-brandenburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-berlin-brandenburg-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-berlin-brandenburg-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-berlin-brandenburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-berlin-brandenburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-berlin-brandenburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-berlin-brandenburg-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-berlin-brandenburg-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-berlin-brandenburg-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-berlin-brandenburg-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-berlin-brandenburg-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-berlin-brandenburg-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-berlin-brandenburg-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-berlin-brandenburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-berlin-brandenburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-berlin-brandenburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-berlin-brandenburg-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-berlin-brandenburg-gymnasium-klasse-10`

## Phase N — `rahmenplan-mv` (Mecklenburg-Vorpommern)

Provider: **Rahmenplan (Mecklenburg-Vorpommern)** · Region: `MV` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `regionale-schule|7|mathematik` — Regionale Schule 7. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7`
- [ ] `regionale-schule|7|informatik` — Regionale Schule 7. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7`
- [ ] `regionale-schule|7|physik` — Regionale Schule 7. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7`
- [ ] `regionale-schule|7|chemie` — Regionale Schule 7. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7`
- [ ] `regionale-schule|7|biologie` — Regionale Schule 7. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-7`
- [ ] `regionale-schule|8|mathematik` — Regionale Schule 8. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-8`
- [ ] `regionale-schule|8|informatik` — Regionale Schule 8. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-8`
- [ ] `regionale-schule|8|physik` — Regionale Schule 8. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-8`
- [ ] `regionale-schule|8|chemie` — Regionale Schule 8. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-8`
- [ ] `regionale-schule|8|biologie` — Regionale Schule 8. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-8`
- [ ] `regionale-schule|9|mathematik` — Regionale Schule 9. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-9`
- [ ] `regionale-schule|9|informatik` — Regionale Schule 9. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-9`
- [x] `regionale-schule|9|physik` — Regionale Schule 9. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-9`
- [x] `regionale-schule|9|chemie` — Regionale Schule 9. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-9`
- [x] `regionale-schule|9|biologie` — Regionale Schule 9. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-9`
- [x] `regionale-schule|10|mathematik` — Regionale Schule 10. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-10`
- [ ] `regionale-schule|10|informatik` — Regionale Schule 10. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-10`
- [ ] `regionale-schule|10|physik` — Regionale Schule 10. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-10`
- [ ] `regionale-schule|10|chemie` — Regionale Schule 10. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-10`
- [ ] `regionale-schule|10|biologie` — Regionale Schule 10. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-regionale-schule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-mecklenburg-vorpommern-gymnasium-klasse-10`

## Phase O — `rahmenrichtlinien-st` (Sachsen-Anhalt)

Provider: **Rahmenrichtlinien (Sachsen-Anhalt)** · Region: `ST` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `sekundarschule|7|mathematik` — Sekundarschule 7. Kl. · Mathematik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-7`
- [ ] `sekundarschule|7|informatik` — Sekundarschule 7. Kl. · Informatik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-7`
- [ ] `sekundarschule|7|physik` — Sekundarschule 7. Kl. · Physik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-7`
- [ ] `sekundarschule|7|chemie` — Sekundarschule 7. Kl. · Chemie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-7`
- [ ] `sekundarschule|7|biologie` — Sekundarschule 7. Kl. · Biologie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-7`
- [ ] `sekundarschule|8|mathematik` — Sekundarschule 8. Kl. · Mathematik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-8`
- [ ] `sekundarschule|8|informatik` — Sekundarschule 8. Kl. · Informatik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-8`
- [ ] `sekundarschule|8|physik` — Sekundarschule 8. Kl. · Physik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-8`
- [ ] `sekundarschule|8|chemie` — Sekundarschule 8. Kl. · Chemie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-8`
- [ ] `sekundarschule|8|biologie` — Sekundarschule 8. Kl. · Biologie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-8`
- [ ] `sekundarschule|9|mathematik` — Sekundarschule 9. Kl. · Mathematik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-9`
- [ ] `sekundarschule|9|informatik` — Sekundarschule 9. Kl. · Informatik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-9`
- [x] `sekundarschule|9|physik` — Sekundarschule 9. Kl. · Physik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-9`
- [x] `sekundarschule|9|chemie` — Sekundarschule 9. Kl. · Chemie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-9`
- [x] `sekundarschule|9|biologie` — Sekundarschule 9. Kl. · Biologie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-9`
- [x] `sekundarschule|10|mathematik` — Sekundarschule 10. Kl. · Mathematik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-10`
- [ ] `sekundarschule|10|informatik` — Sekundarschule 10. Kl. · Informatik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-10`
- [ ] `sekundarschule|10|physik` — Sekundarschule 10. Kl. · Physik · user `curriculum-sachsen-anhalt-sekundarschule-klasse-10`
- [ ] `sekundarschule|10|chemie` — Sekundarschule 10. Kl. · Chemie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-10`
- [ ] `sekundarschule|10|biologie` — Sekundarschule 10. Kl. · Biologie · user `curriculum-sachsen-anhalt-sekundarschule-klasse-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-sachsen-anhalt-gymnasium-klasse-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-sachsen-anhalt-gymnasium-klasse-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-sachsen-anhalt-gymnasium-klasse-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-sachsen-anhalt-gymnasium-klasse-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-sachsen-anhalt-gymnasium-klasse-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-sachsen-anhalt-gymnasium-klasse-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-sachsen-anhalt-gymnasium-klasse-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-sachsen-anhalt-gymnasium-klasse-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-sachsen-anhalt-gymnasium-klasse-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-sachsen-anhalt-gymnasium-klasse-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-sachsen-anhalt-gymnasium-klasse-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-sachsen-anhalt-gymnasium-klasse-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-sachsen-anhalt-gymnasium-klasse-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-sachsen-anhalt-gymnasium-klasse-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-sachsen-anhalt-gymnasium-klasse-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-sachsen-anhalt-gymnasium-klasse-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-sachsen-anhalt-gymnasium-klasse-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-sachsen-anhalt-gymnasium-klasse-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-sachsen-anhalt-gymnasium-klasse-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-sachsen-anhalt-gymnasium-klasse-10`

## Acceptance (Epic complete)

- Every checkbox above is checked.
- Phase B import pipeline acceptance from Phase 3 plan is met.
- `npm run format && npm run lint && npm run typecheck && npm run test && npm run build` green.
- No regression for `thomas` / `test-user-0.6.2` profiles.
