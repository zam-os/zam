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

- [ ] **Phase 0 — test infrastructure** (users, verification protocol)
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
2. **Test users:** `curriculum-<region>-<schulform>-<klasse>` in the shared
   Turso DB; `thomas` and `test-user-0.6.2` stay untouched.
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
- [ ] Add a bridge-level smoke script that asserts `curriculum-list-level
  --level topic` returns non-empty options for every manifest path (CI gate
  once manifests are complete).

### Test user registry

| Region | User ID pattern | Example |
|--------|-----------------|---------|
| Bremen (`HB`) | `curriculum-hb-<schulform>-<klasse>` | `curriculum-hb-oberschule-7` |
| Baden-Württemberg (`BW`) | `curriculum-bw-<schulform>-<klasse>` | `curriculum-bw-gymnasium-9` |
| Hamburg (`HH`) | `curriculum-hh-<schulform>-<klasse>` | `curriculum-hh-stadtteilschule-7` |
| Schleswig-Holstein (`SH`) | `curriculum-sh-<schulform>-<klasse>` | `curriculum-sh-gemeinschaftsschule-7` |
| Hessen (`HE`) | `curriculum-he-<schulform>-<klasse>` | `curriculum-he-realschule-7` |
| Niedersachsen (`NI`) | `curriculum-ni-<schulform>-<klasse>` | `curriculum-ni-realschule-7` |
| Nordrhein-Westfalen (`NW`) | `curriculum-nw-<schulform>-<klasse>` | `curriculum-nw-realschule-7` |
| Rheinland-Pfalz (`RP`) | `curriculum-rp-<schulform>-<klasse>` | `curriculum-rp-realschule-plus-7` |
| Saarland (`SL`) | `curriculum-sl-<schulform>-<klasse>` | `curriculum-sl-gemeinschaftsschule-7` |
| Sachsen (`SN`) | `curriculum-sn-<schulform>-<klasse>` | `curriculum-sn-oberschule-7` |
| Thüringen (`TH`) | `curriculum-th-<schulform>-<klasse>` | `curriculum-th-regelschule-7` |
| Bayern (`BY`) | `curriculum-by-<schulform>-<klasse>` | `curriculum-by-realschule-5` |
| Berlin / Brandenburg (`BE-BB`) | `curriculum-be-bb-<schulform>-<klasse>` | `curriculum-be-bb-realschule-7` |
| Mecklenburg-Vorpommern (`MV`) | `curriculum-mv-<schulform>-<klasse>` | `curriculum-mv-regionale-schule-7` |
| Sachsen-Anhalt (`ST`) | `curriculum-st-<schulform>-<klasse>` | `curriculum-st-sekundarschule-7` |

## End-to-end verification protocol (every path)

For path `<provider>|<schoolType>|<grade>|<subject>[|<track>]`:

1. `zam bridge database-select-user --user curriculum-<region>-<schulform>-<grade>`
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

- [ ] `oberschule|7|mathematik` — Oberschule 7. Kl. · Mathematik · user `curriculum-hb-oberschule-7`
- [ ] `oberschule|7|informatik` — Oberschule 7. Kl. · Informatik · user `curriculum-hb-oberschule-7`
- [ ] `oberschule|7|physik` — Oberschule 7. Kl. · Physik · user `curriculum-hb-oberschule-7`
- [ ] `oberschule|7|chemie` — Oberschule 7. Kl. · Chemie · user `curriculum-hb-oberschule-7`
- [ ] `oberschule|7|biologie` — Oberschule 7. Kl. · Biologie · user `curriculum-hb-oberschule-7`
- [ ] `oberschule|8|mathematik` — Oberschule 8. Kl. · Mathematik · user `curriculum-hb-oberschule-8`
- [ ] `oberschule|8|informatik` — Oberschule 8. Kl. · Informatik · user `curriculum-hb-oberschule-8`
- [ ] `oberschule|8|physik` — Oberschule 8. Kl. · Physik · user `curriculum-hb-oberschule-8`
- [ ] `oberschule|8|chemie` — Oberschule 8. Kl. · Chemie · user `curriculum-hb-oberschule-8`
- [ ] `oberschule|8|biologie` — Oberschule 8. Kl. · Biologie · user `curriculum-hb-oberschule-8`
- [ ] `oberschule|9|mathematik` — Oberschule 9. Kl. · Mathematik · user `curriculum-hb-oberschule-9`
- [x] `oberschule|9|informatik` — Oberschule 9. Kl. · Informatik · user `curriculum-hb-oberschule-9`
- [x] `oberschule|9|physik` — Oberschule 9. Kl. · Physik · user `curriculum-hb-oberschule-9`
- [x] `oberschule|9|chemie` — Oberschule 9. Kl. · Chemie · user `curriculum-hb-oberschule-9`
- [x] `oberschule|9|biologie` — Oberschule 9. Kl. · Biologie · user `curriculum-hb-oberschule-9`
- [x] `oberschule|10|mathematik` — Oberschule 10. Kl. · Mathematik · user `curriculum-hb-oberschule-10`
- [ ] `oberschule|10|informatik` — Oberschule 10. Kl. · Informatik · user `curriculum-hb-oberschule-10`
- [ ] `oberschule|10|physik` — Oberschule 10. Kl. · Physik · user `curriculum-hb-oberschule-10`
- [ ] `oberschule|10|chemie` — Oberschule 10. Kl. · Chemie · user `curriculum-hb-oberschule-10`
- [ ] `oberschule|10|biologie` — Oberschule 10. Kl. · Biologie · user `curriculum-hb-oberschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-hb-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-hb-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-hb-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-hb-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-hb-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-hb-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-hb-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-hb-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-hb-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-hb-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-hb-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-hb-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-hb-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-hb-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-hb-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-hb-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-hb-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-hb-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-hb-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-hb-gymnasium-10`

## Phase B — `bildungsplan-bw` (Baden-Württemberg)

Provider: **Bildungsplan (Baden-Württemberg)** · Region: `BW` · Paths: **20** · Topics today: **5** (25%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-bw-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-bw-gymnasium-9`
- [ ] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-bw-gymnasium-9`
- [ ] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-bw-gymnasium-9`
- [ ] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-bw-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-bw-gymnasium-10`
- [x] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-bw-gymnasium-10`
- [x] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-bw-gymnasium-10`
- [x] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-bw-gymnasium-10`
- [x] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-bw-gymnasium-10`
- [ ] `gymnasium|11|mathematik` — Gymnasium 11. Kl. · Mathematik · user `curriculum-bw-gymnasium-11`
- [ ] `gymnasium|11|informatik` — Gymnasium 11. Kl. · Informatik · user `curriculum-bw-gymnasium-11`
- [ ] `gymnasium|11|physik` — Gymnasium 11. Kl. · Physik · user `curriculum-bw-gymnasium-11`
- [ ] `gymnasium|11|chemie` — Gymnasium 11. Kl. · Chemie · user `curriculum-bw-gymnasium-11`
- [ ] `gymnasium|11|biologie` — Gymnasium 11. Kl. · Biologie · user `curriculum-bw-gymnasium-11`
- [ ] `gymnasium|12|mathematik` — Gymnasium 12. Kl. · Mathematik · user `curriculum-bw-gymnasium-12`
- [ ] `gymnasium|12|informatik` — Gymnasium 12. Kl. · Informatik · user `curriculum-bw-gymnasium-12`
- [ ] `gymnasium|12|physik` — Gymnasium 12. Kl. · Physik · user `curriculum-bw-gymnasium-12`
- [ ] `gymnasium|12|chemie` — Gymnasium 12. Kl. · Chemie · user `curriculum-bw-gymnasium-12`
- [ ] `gymnasium|12|biologie` — Gymnasium 12. Kl. · Biologie · user `curriculum-bw-gymnasium-12`

## Phase C — `bildungsplan-hamburg` (Hamburg)

Provider: **Bildungsplan (Hamburg)** · Region: `HH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `stadtteilschule|7|mathematik` — Stadtteilschule (Realschule) 7. Kl. · Mathematik · user `curriculum-hh-stadtteilschule-7`
- [ ] `stadtteilschule|7|informatik` — Stadtteilschule (Realschule) 7. Kl. · Informatik · user `curriculum-hh-stadtteilschule-7`
- [ ] `stadtteilschule|7|physik` — Stadtteilschule (Realschule) 7. Kl. · Physik · user `curriculum-hh-stadtteilschule-7`
- [ ] `stadtteilschule|7|chemie` — Stadtteilschule (Realschule) 7. Kl. · Chemie · user `curriculum-hh-stadtteilschule-7`
- [ ] `stadtteilschule|7|biologie` — Stadtteilschule (Realschule) 7. Kl. · Biologie · user `curriculum-hh-stadtteilschule-7`
- [ ] `stadtteilschule|8|mathematik` — Stadtteilschule (Realschule) 8. Kl. · Mathematik · user `curriculum-hh-stadtteilschule-8`
- [ ] `stadtteilschule|8|informatik` — Stadtteilschule (Realschule) 8. Kl. · Informatik · user `curriculum-hh-stadtteilschule-8`
- [ ] `stadtteilschule|8|physik` — Stadtteilschule (Realschule) 8. Kl. · Physik · user `curriculum-hh-stadtteilschule-8`
- [ ] `stadtteilschule|8|chemie` — Stadtteilschule (Realschule) 8. Kl. · Chemie · user `curriculum-hh-stadtteilschule-8`
- [ ] `stadtteilschule|8|biologie` — Stadtteilschule (Realschule) 8. Kl. · Biologie · user `curriculum-hh-stadtteilschule-8`
- [ ] `stadtteilschule|9|mathematik` — Stadtteilschule (Realschule) 9. Kl. · Mathematik · user `curriculum-hh-stadtteilschule-9`
- [ ] `stadtteilschule|9|informatik` — Stadtteilschule (Realschule) 9. Kl. · Informatik · user `curriculum-hh-stadtteilschule-9`
- [x] `stadtteilschule|9|physik` — Stadtteilschule (Realschule) 9. Kl. · Physik · user `curriculum-hh-stadtteilschule-9`
- [x] `stadtteilschule|9|chemie` — Stadtteilschule (Realschule) 9. Kl. · Chemie · user `curriculum-hh-stadtteilschule-9`
- [x] `stadtteilschule|9|biologie` — Stadtteilschule (Realschule) 9. Kl. · Biologie · user `curriculum-hh-stadtteilschule-9`
- [x] `stadtteilschule|10|mathematik` — Stadtteilschule (Realschule) 10. Kl. · Mathematik · user `curriculum-hh-stadtteilschule-10`
- [ ] `stadtteilschule|10|informatik` — Stadtteilschule (Realschule) 10. Kl. · Informatik · user `curriculum-hh-stadtteilschule-10`
- [ ] `stadtteilschule|10|physik` — Stadtteilschule (Realschule) 10. Kl. · Physik · user `curriculum-hh-stadtteilschule-10`
- [ ] `stadtteilschule|10|chemie` — Stadtteilschule (Realschule) 10. Kl. · Chemie · user `curriculum-hh-stadtteilschule-10`
- [ ] `stadtteilschule|10|biologie` — Stadtteilschule (Realschule) 10. Kl. · Biologie · user `curriculum-hh-stadtteilschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-hh-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-hh-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-hh-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-hh-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-hh-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-hh-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-hh-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-hh-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-hh-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-hh-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-hh-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-hh-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-hh-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-hh-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-hh-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-hh-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-hh-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-hh-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-hh-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-hh-gymnasium-10`

## Phase D — `fachanforderungen-sh` (Schleswig-Holstein)

Provider: **Fachanforderungen (Schleswig-Holstein)** · Region: `SH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gemeinschaftsschule|7|mathematik` — Gemeinschaftsschule 7. Kl. · Mathematik · user `curriculum-sh-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|informatik` — Gemeinschaftsschule 7. Kl. · Informatik · user `curriculum-sh-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|physik` — Gemeinschaftsschule 7. Kl. · Physik · user `curriculum-sh-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|chemie` — Gemeinschaftsschule 7. Kl. · Chemie · user `curriculum-sh-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|biologie` — Gemeinschaftsschule 7. Kl. · Biologie · user `curriculum-sh-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|8|mathematik` — Gemeinschaftsschule 8. Kl. · Mathematik · user `curriculum-sh-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|informatik` — Gemeinschaftsschule 8. Kl. · Informatik · user `curriculum-sh-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|physik` — Gemeinschaftsschule 8. Kl. · Physik · user `curriculum-sh-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|chemie` — Gemeinschaftsschule 8. Kl. · Chemie · user `curriculum-sh-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|biologie` — Gemeinschaftsschule 8. Kl. · Biologie · user `curriculum-sh-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|9|mathematik` — Gemeinschaftsschule 9. Kl. · Mathematik · user `curriculum-sh-gemeinschaftsschule-9`
- [ ] `gemeinschaftsschule|9|informatik` — Gemeinschaftsschule 9. Kl. · Informatik · user `curriculum-sh-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|physik` — Gemeinschaftsschule 9. Kl. · Physik · user `curriculum-sh-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|chemie` — Gemeinschaftsschule 9. Kl. · Chemie · user `curriculum-sh-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|biologie` — Gemeinschaftsschule 9. Kl. · Biologie · user `curriculum-sh-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|10|mathematik` — Gemeinschaftsschule 10. Kl. · Mathematik · user `curriculum-sh-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|informatik` — Gemeinschaftsschule 10. Kl. · Informatik · user `curriculum-sh-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|physik` — Gemeinschaftsschule 10. Kl. · Physik · user `curriculum-sh-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|chemie` — Gemeinschaftsschule 10. Kl. · Chemie · user `curriculum-sh-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|biologie` — Gemeinschaftsschule 10. Kl. · Biologie · user `curriculum-sh-gemeinschaftsschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-sh-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-sh-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-sh-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-sh-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-sh-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-sh-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-sh-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-sh-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-sh-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-sh-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-sh-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-sh-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-sh-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-sh-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-sh-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-sh-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-sh-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-sh-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-sh-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-sh-gymnasium-10`

## Phase E — `kerncurriculum-hessen` (Hessen)

Provider: **Kerncurriculum (Hessen)** · Region: `HE` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-he-realschule-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-he-realschule-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-he-realschule-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-he-realschule-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-he-realschule-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-he-realschule-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-he-realschule-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-he-realschule-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-he-realschule-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-he-realschule-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-he-realschule-9`
- [x] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-he-realschule-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-he-realschule-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-he-realschule-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-he-realschule-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-he-realschule-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-he-realschule-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-he-realschule-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-he-realschule-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-he-realschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-he-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-he-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-he-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-he-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-he-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-he-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-he-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-he-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-he-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-he-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-he-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-he-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-he-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-he-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-he-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-he-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-he-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-he-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-he-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-he-gymnasium-10`

## Phase F — `kerncurriculum-niedersachsen` (Niedersachsen)

Provider: **Kerncurriculum (Niedersachsen)** · Region: `NI` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-ni-realschule-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-ni-realschule-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-ni-realschule-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-ni-realschule-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-ni-realschule-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-ni-realschule-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-ni-realschule-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-ni-realschule-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-ni-realschule-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-ni-realschule-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-ni-realschule-9`
- [ ] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-ni-realschule-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-ni-realschule-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-ni-realschule-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-ni-realschule-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-ni-realschule-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-ni-realschule-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-ni-realschule-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-ni-realschule-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-ni-realschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-ni-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-ni-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-ni-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-ni-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-ni-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-ni-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-ni-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-ni-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-ni-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-ni-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-ni-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-ni-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-ni-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-ni-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-ni-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-ni-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-ni-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-ni-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-ni-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-ni-gymnasium-10`

## Phase G — `kernlehrplan-nrw` (Nordrhein-Westfalen)

Provider: **Kernlehrplan (Nordrhein-Westfalen)** · Region: `NW` · Paths: **40** · Topics today: **10** (25%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-nw-realschule-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-nw-realschule-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-nw-realschule-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-nw-realschule-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-nw-realschule-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-nw-realschule-8`
- [x] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-nw-realschule-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-nw-realschule-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-nw-realschule-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-nw-realschule-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-nw-realschule-9`
- [ ] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-nw-realschule-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-nw-realschule-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-nw-realschule-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-nw-realschule-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-nw-realschule-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-nw-realschule-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-nw-realschule-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-nw-realschule-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-nw-realschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-nw-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-nw-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-nw-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-nw-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-nw-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-nw-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-nw-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-nw-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-nw-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-nw-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-nw-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-nw-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-nw-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-nw-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-nw-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-nw-gymnasium-10`
- [x] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-nw-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-nw-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-nw-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-nw-gymnasium-10`

## Phase H — `lehrplaene-rp` (Rheinland-Pfalz)

Provider: **Lehrpläne (Rheinland-Pfalz)** · Region: `RP` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule-plus|7|mathematik` — Realschule plus 7. Kl. · Mathematik · user `curriculum-rp-realschule-plus-7`
- [ ] `realschule-plus|7|informatik` — Realschule plus 7. Kl. · Informatik · user `curriculum-rp-realschule-plus-7`
- [ ] `realschule-plus|7|physik` — Realschule plus 7. Kl. · Physik · user `curriculum-rp-realschule-plus-7`
- [ ] `realschule-plus|7|chemie` — Realschule plus 7. Kl. · Chemie · user `curriculum-rp-realschule-plus-7`
- [ ] `realschule-plus|7|biologie` — Realschule plus 7. Kl. · Biologie · user `curriculum-rp-realschule-plus-7`
- [ ] `realschule-plus|8|mathematik` — Realschule plus 8. Kl. · Mathematik · user `curriculum-rp-realschule-plus-8`
- [ ] `realschule-plus|8|informatik` — Realschule plus 8. Kl. · Informatik · user `curriculum-rp-realschule-plus-8`
- [ ] `realschule-plus|8|physik` — Realschule plus 8. Kl. · Physik · user `curriculum-rp-realschule-plus-8`
- [ ] `realschule-plus|8|chemie` — Realschule plus 8. Kl. · Chemie · user `curriculum-rp-realschule-plus-8`
- [ ] `realschule-plus|8|biologie` — Realschule plus 8. Kl. · Biologie · user `curriculum-rp-realschule-plus-8`
- [ ] `realschule-plus|9|mathematik` — Realschule plus 9. Kl. · Mathematik · user `curriculum-rp-realschule-plus-9`
- [ ] `realschule-plus|9|informatik` — Realschule plus 9. Kl. · Informatik · user `curriculum-rp-realschule-plus-9`
- [x] `realschule-plus|9|physik` — Realschule plus 9. Kl. · Physik · user `curriculum-rp-realschule-plus-9`
- [x] `realschule-plus|9|chemie` — Realschule plus 9. Kl. · Chemie · user `curriculum-rp-realschule-plus-9`
- [x] `realschule-plus|9|biologie` — Realschule plus 9. Kl. · Biologie · user `curriculum-rp-realschule-plus-9`
- [x] `realschule-plus|10|mathematik` — Realschule plus 10. Kl. · Mathematik · user `curriculum-rp-realschule-plus-10`
- [ ] `realschule-plus|10|informatik` — Realschule plus 10. Kl. · Informatik · user `curriculum-rp-realschule-plus-10`
- [ ] `realschule-plus|10|physik` — Realschule plus 10. Kl. · Physik · user `curriculum-rp-realschule-plus-10`
- [ ] `realschule-plus|10|chemie` — Realschule plus 10. Kl. · Chemie · user `curriculum-rp-realschule-plus-10`
- [ ] `realschule-plus|10|biologie` — Realschule plus 10. Kl. · Biologie · user `curriculum-rp-realschule-plus-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-rp-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-rp-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-rp-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-rp-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-rp-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-rp-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-rp-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-rp-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-rp-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-rp-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-rp-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-rp-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-rp-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-rp-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-rp-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-rp-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-rp-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-rp-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-rp-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-rp-gymnasium-10`

## Phase I — `lehrplan-saarland` (Saarland)

Provider: **Lehrplan (Saarland)** · Region: `SL` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `gemeinschaftsschule|7|mathematik` — Gemeinschaftsschule 7. Kl. · Mathematik · user `curriculum-sl-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|informatik` — Gemeinschaftsschule 7. Kl. · Informatik · user `curriculum-sl-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|physik` — Gemeinschaftsschule 7. Kl. · Physik · user `curriculum-sl-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|chemie` — Gemeinschaftsschule 7. Kl. · Chemie · user `curriculum-sl-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|7|biologie` — Gemeinschaftsschule 7. Kl. · Biologie · user `curriculum-sl-gemeinschaftsschule-7`
- [ ] `gemeinschaftsschule|8|mathematik` — Gemeinschaftsschule 8. Kl. · Mathematik · user `curriculum-sl-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|informatik` — Gemeinschaftsschule 8. Kl. · Informatik · user `curriculum-sl-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|physik` — Gemeinschaftsschule 8. Kl. · Physik · user `curriculum-sl-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|chemie` — Gemeinschaftsschule 8. Kl. · Chemie · user `curriculum-sl-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|8|biologie` — Gemeinschaftsschule 8. Kl. · Biologie · user `curriculum-sl-gemeinschaftsschule-8`
- [ ] `gemeinschaftsschule|9|mathematik` — Gemeinschaftsschule 9. Kl. · Mathematik · user `curriculum-sl-gemeinschaftsschule-9`
- [ ] `gemeinschaftsschule|9|informatik` — Gemeinschaftsschule 9. Kl. · Informatik · user `curriculum-sl-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|physik` — Gemeinschaftsschule 9. Kl. · Physik · user `curriculum-sl-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|chemie` — Gemeinschaftsschule 9. Kl. · Chemie · user `curriculum-sl-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|9|biologie` — Gemeinschaftsschule 9. Kl. · Biologie · user `curriculum-sl-gemeinschaftsschule-9`
- [x] `gemeinschaftsschule|10|mathematik` — Gemeinschaftsschule 10. Kl. · Mathematik · user `curriculum-sl-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|informatik` — Gemeinschaftsschule 10. Kl. · Informatik · user `curriculum-sl-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|physik` — Gemeinschaftsschule 10. Kl. · Physik · user `curriculum-sl-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|chemie` — Gemeinschaftsschule 10. Kl. · Chemie · user `curriculum-sl-gemeinschaftsschule-10`
- [ ] `gemeinschaftsschule|10|biologie` — Gemeinschaftsschule 10. Kl. · Biologie · user `curriculum-sl-gemeinschaftsschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-sl-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-sl-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-sl-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-sl-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-sl-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-sl-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-sl-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-sl-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-sl-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-sl-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-sl-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-sl-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-sl-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-sl-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-sl-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-sl-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-sl-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-sl-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-sl-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-sl-gymnasium-10`

## Phase J — `lehrplan-sachsen` (Sachsen)

Provider: **Lehrplan (Sachsen)** · Region: `SN` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `oberschule|7|mathematik` — Oberschule (Realschule) 7. Kl. · Mathematik · user `curriculum-sn-oberschule-7`
- [ ] `oberschule|7|informatik` — Oberschule (Realschule) 7. Kl. · Informatik · user `curriculum-sn-oberschule-7`
- [ ] `oberschule|7|physik` — Oberschule (Realschule) 7. Kl. · Physik · user `curriculum-sn-oberschule-7`
- [ ] `oberschule|7|chemie` — Oberschule (Realschule) 7. Kl. · Chemie · user `curriculum-sn-oberschule-7`
- [ ] `oberschule|7|biologie` — Oberschule (Realschule) 7. Kl. · Biologie · user `curriculum-sn-oberschule-7`
- [ ] `oberschule|8|mathematik` — Oberschule (Realschule) 8. Kl. · Mathematik · user `curriculum-sn-oberschule-8`
- [ ] `oberschule|8|informatik` — Oberschule (Realschule) 8. Kl. · Informatik · user `curriculum-sn-oberschule-8`
- [ ] `oberschule|8|physik` — Oberschule (Realschule) 8. Kl. · Physik · user `curriculum-sn-oberschule-8`
- [ ] `oberschule|8|chemie` — Oberschule (Realschule) 8. Kl. · Chemie · user `curriculum-sn-oberschule-8`
- [ ] `oberschule|8|biologie` — Oberschule (Realschule) 8. Kl. · Biologie · user `curriculum-sn-oberschule-8`
- [ ] `oberschule|9|mathematik` — Oberschule (Realschule) 9. Kl. · Mathematik · user `curriculum-sn-oberschule-9`
- [x] `oberschule|9|informatik` — Oberschule (Realschule) 9. Kl. · Informatik · user `curriculum-sn-oberschule-9`
- [x] `oberschule|9|physik` — Oberschule (Realschule) 9. Kl. · Physik · user `curriculum-sn-oberschule-9`
- [x] `oberschule|9|chemie` — Oberschule (Realschule) 9. Kl. · Chemie · user `curriculum-sn-oberschule-9`
- [x] `oberschule|9|biologie` — Oberschule (Realschule) 9. Kl. · Biologie · user `curriculum-sn-oberschule-9`
- [x] `oberschule|10|mathematik` — Oberschule (Realschule) 10. Kl. · Mathematik · user `curriculum-sn-oberschule-10`
- [ ] `oberschule|10|informatik` — Oberschule (Realschule) 10. Kl. · Informatik · user `curriculum-sn-oberschule-10`
- [ ] `oberschule|10|physik` — Oberschule (Realschule) 10. Kl. · Physik · user `curriculum-sn-oberschule-10`
- [ ] `oberschule|10|chemie` — Oberschule (Realschule) 10. Kl. · Chemie · user `curriculum-sn-oberschule-10`
- [ ] `oberschule|10|biologie` — Oberschule (Realschule) 10. Kl. · Biologie · user `curriculum-sn-oberschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-sn-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-sn-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-sn-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-sn-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-sn-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-sn-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-sn-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-sn-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-sn-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-sn-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-sn-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-sn-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-sn-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-sn-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-sn-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-sn-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-sn-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-sn-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-sn-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-sn-gymnasium-10`

## Phase K — `lehrplan-thueringen` (Thüringen)

Provider: **Lehrplan (Thüringen)** · Region: `TH` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `regelschule|7|mathematik` — Regelschule 7. Kl. · Mathematik · user `curriculum-th-regelschule-7`
- [ ] `regelschule|7|informatik` — Regelschule 7. Kl. · Informatik · user `curriculum-th-regelschule-7`
- [ ] `regelschule|7|physik` — Regelschule 7. Kl. · Physik · user `curriculum-th-regelschule-7`
- [ ] `regelschule|7|chemie` — Regelschule 7. Kl. · Chemie · user `curriculum-th-regelschule-7`
- [ ] `regelschule|7|biologie` — Regelschule 7. Kl. · Biologie · user `curriculum-th-regelschule-7`
- [ ] `regelschule|8|mathematik` — Regelschule 8. Kl. · Mathematik · user `curriculum-th-regelschule-8`
- [ ] `regelschule|8|informatik` — Regelschule 8. Kl. · Informatik · user `curriculum-th-regelschule-8`
- [ ] `regelschule|8|physik` — Regelschule 8. Kl. · Physik · user `curriculum-th-regelschule-8`
- [ ] `regelschule|8|chemie` — Regelschule 8. Kl. · Chemie · user `curriculum-th-regelschule-8`
- [ ] `regelschule|8|biologie` — Regelschule 8. Kl. · Biologie · user `curriculum-th-regelschule-8`
- [ ] `regelschule|9|mathematik` — Regelschule 9. Kl. · Mathematik · user `curriculum-th-regelschule-9`
- [ ] `regelschule|9|informatik` — Regelschule 9. Kl. · Informatik · user `curriculum-th-regelschule-9`
- [x] `regelschule|9|physik` — Regelschule 9. Kl. · Physik · user `curriculum-th-regelschule-9`
- [x] `regelschule|9|chemie` — Regelschule 9. Kl. · Chemie · user `curriculum-th-regelschule-9`
- [x] `regelschule|9|biologie` — Regelschule 9. Kl. · Biologie · user `curriculum-th-regelschule-9`
- [x] `regelschule|10|mathematik` — Regelschule 10. Kl. · Mathematik · user `curriculum-th-regelschule-10`
- [ ] `regelschule|10|informatik` — Regelschule 10. Kl. · Informatik · user `curriculum-th-regelschule-10`
- [ ] `regelschule|10|physik` — Regelschule 10. Kl. · Physik · user `curriculum-th-regelschule-10`
- [ ] `regelschule|10|chemie` — Regelschule 10. Kl. · Chemie · user `curriculum-th-regelschule-10`
- [ ] `regelschule|10|biologie` — Regelschule 10. Kl. · Biologie · user `curriculum-th-regelschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-th-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-th-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-th-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-th-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-th-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-th-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-th-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-th-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-th-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-th-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-th-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-th-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-th-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-th-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-th-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-th-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-th-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-th-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-th-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-th-gymnasium-10`

## Phase L — `lehrplanplus-bayern` (Bayern)

Provider: **LehrplanPLUS (Bayern)** · Region: `BY` · Paths: **169** · Topics today: **4** (2%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|5|bwl-rechnungswesen` — Realschule 5. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-5`
- [ ] `realschule|5|biologie` — Realschule 5. Kl. · Biologie · user `curriculum-by-realschule-5`
- [ ] `realschule|5|chemie` — Realschule 5. Kl. · Chemie · user `curriculum-by-realschule-5`
- [ ] `realschule|5|deutsch` — Realschule 5. Kl. · Deutsch · user `curriculum-by-realschule-5`
- [ ] `realschule|5|englisch` — Realschule 5. Kl. · Englisch · user `curriculum-by-realschule-5`
- [ ] `realschule|5|ernaehrung_und_gesundheit` — Realschule 5. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-5`
- [ ] `realschule|5|ethik` — Realschule 5. Kl. · Ethik · user `curriculum-by-realschule-5`
- [ ] `realschule|5|evangelische-religionslehre` — Realschule 5. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-5`
- [ ] `realschule|5|franzoesisch` — Realschule 5. Kl. · Französisch · user `curriculum-by-realschule-5`
- [ ] `realschule|5|geographie` — Realschule 5. Kl. · Geographie · user `curriculum-by-realschule-5`
- [ ] `realschule|5|geschichte` — Realschule 5. Kl. · Geschichte · user `curriculum-by-realschule-5`
- [ ] `realschule|5|it` — Realschule 5. Kl. · Informationstechnologie · user `curriculum-by-realschule-5`
- [ ] `realschule|5|iu` — Realschule 5. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-5`
- [ ] `realschule|5|ir` — Realschule 5. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-5`
- [ ] `realschule|5|katholische-religionslehre` — Realschule 5. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-5`
- [ ] `realschule|5|kunst` — Realschule 5. Kl. · Kunst · user `curriculum-by-realschule-5`
- [ ] `realschule|5|mathematik` — Realschule 5. Kl. · Mathematik · user `curriculum-by-realschule-5`
- [ ] `realschule|5|musik` — Realschule 5. Kl. · Musik · user `curriculum-by-realschule-5`
- [ ] `realschule|5|or` — Realschule 5. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-5`
- [ ] `realschule|5|physik` — Realschule 5. Kl. · Physik · user `curriculum-by-realschule-5`
- [ ] `realschule|5|pug` — Realschule 5. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-5`
- [ ] `realschule|5|soziallehre` — Realschule 5. Kl. · Soziallehre · user `curriculum-by-realschule-5`
- [ ] `realschule|5|sozialwesen` — Realschule 5. Kl. · Sozialwesen · user `curriculum-by-realschule-5`
- [ ] `realschule|5|spanisch` — Realschule 5. Kl. · Spanisch · user `curriculum-by-realschule-5`
- [ ] `realschule|5|sport` — Realschule 5. Kl. · Sport · user `curriculum-by-realschule-5`
- [ ] `realschule|5|textiles-gestalten` — Realschule 5. Kl. · Textiles Gestalten · user `curriculum-by-realschule-5`
- [ ] `realschule|5|werken` — Realschule 5. Kl. · Werken · user `curriculum-by-realschule-5`
- [ ] `realschule|5|wirtschaft-und-recht` — Realschule 5. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-5`
- [ ] `realschule|6|bwl-rechnungswesen` — Realschule 6. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-6`
- [ ] `realschule|6|biologie` — Realschule 6. Kl. · Biologie · user `curriculum-by-realschule-6`
- [ ] `realschule|6|chemie` — Realschule 6. Kl. · Chemie · user `curriculum-by-realschule-6`
- [ ] `realschule|6|deutsch` — Realschule 6. Kl. · Deutsch · user `curriculum-by-realschule-6`
- [ ] `realschule|6|englisch` — Realschule 6. Kl. · Englisch · user `curriculum-by-realschule-6`
- [ ] `realschule|6|ernaehrung_und_gesundheit` — Realschule 6. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-6`
- [ ] `realschule|6|ethik` — Realschule 6. Kl. · Ethik · user `curriculum-by-realschule-6`
- [ ] `realschule|6|evangelische-religionslehre` — Realschule 6. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-6`
- [ ] `realschule|6|franzoesisch` — Realschule 6. Kl. · Französisch · user `curriculum-by-realschule-6`
- [ ] `realschule|6|geographie` — Realschule 6. Kl. · Geographie · user `curriculum-by-realschule-6`
- [ ] `realschule|6|geschichte` — Realschule 6. Kl. · Geschichte · user `curriculum-by-realschule-6`
- [ ] `realschule|6|it` — Realschule 6. Kl. · Informationstechnologie · user `curriculum-by-realschule-6`
- [ ] `realschule|6|iu` — Realschule 6. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-6`
- [ ] `realschule|6|ir` — Realschule 6. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-6`
- [ ] `realschule|6|katholische-religionslehre` — Realschule 6. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-6`
- [ ] `realschule|6|kunst` — Realschule 6. Kl. · Kunst · user `curriculum-by-realschule-6`
- [ ] `realschule|6|mathematik` — Realschule 6. Kl. · Mathematik · user `curriculum-by-realschule-6`
- [ ] `realschule|6|musik` — Realschule 6. Kl. · Musik · user `curriculum-by-realschule-6`
- [ ] `realschule|6|or` — Realschule 6. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-6`
- [ ] `realschule|6|physik` — Realschule 6. Kl. · Physik · user `curriculum-by-realschule-6`
- [ ] `realschule|6|pug` — Realschule 6. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-6`
- [ ] `realschule|6|soziallehre` — Realschule 6. Kl. · Soziallehre · user `curriculum-by-realschule-6`
- [ ] `realschule|6|sozialwesen` — Realschule 6. Kl. · Sozialwesen · user `curriculum-by-realschule-6`
- [ ] `realschule|6|spanisch` — Realschule 6. Kl. · Spanisch · user `curriculum-by-realschule-6`
- [ ] `realschule|6|sport` — Realschule 6. Kl. · Sport · user `curriculum-by-realschule-6`
- [ ] `realschule|6|textiles-gestalten` — Realschule 6. Kl. · Textiles Gestalten · user `curriculum-by-realschule-6`
- [ ] `realschule|6|werken` — Realschule 6. Kl. · Werken · user `curriculum-by-realschule-6`
- [ ] `realschule|6|wirtschaft-und-recht` — Realschule 6. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-6`
- [ ] `realschule|7|bwl-rechnungswesen` — Realschule 7. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-by-realschule-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-by-realschule-7`
- [ ] `realschule|7|deutsch` — Realschule 7. Kl. · Deutsch · user `curriculum-by-realschule-7`
- [ ] `realschule|7|englisch` — Realschule 7. Kl. · Englisch · user `curriculum-by-realschule-7`
- [ ] `realschule|7|ernaehrung_und_gesundheit` — Realschule 7. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-7`
- [ ] `realschule|7|ethik` — Realschule 7. Kl. · Ethik · user `curriculum-by-realschule-7`
- [ ] `realschule|7|evangelische-religionslehre` — Realschule 7. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-7`
- [ ] `realschule|7|franzoesisch` — Realschule 7. Kl. · Französisch · user `curriculum-by-realschule-7`
- [ ] `realschule|7|geographie` — Realschule 7. Kl. · Geographie · user `curriculum-by-realschule-7`
- [ ] `realschule|7|geschichte` — Realschule 7. Kl. · Geschichte · user `curriculum-by-realschule-7`
- [ ] `realschule|7|it` — Realschule 7. Kl. · Informationstechnologie · user `curriculum-by-realschule-7`
- [ ] `realschule|7|iu` — Realschule 7. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-7`
- [ ] `realschule|7|ir` — Realschule 7. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-7`
- [ ] `realschule|7|katholische-religionslehre` — Realschule 7. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-7`
- [ ] `realschule|7|kunst` — Realschule 7. Kl. · Kunst · user `curriculum-by-realschule-7`
- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-by-realschule-7`
- [ ] `realschule|7|musik` — Realschule 7. Kl. · Musik · user `curriculum-by-realschule-7`
- [ ] `realschule|7|or` — Realschule 7. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-by-realschule-7`
- [ ] `realschule|7|pug` — Realschule 7. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-7`
- [ ] `realschule|7|soziallehre` — Realschule 7. Kl. · Soziallehre · user `curriculum-by-realschule-7`
- [ ] `realschule|7|sozialwesen` — Realschule 7. Kl. · Sozialwesen · user `curriculum-by-realschule-7`
- [ ] `realschule|7|spanisch` — Realschule 7. Kl. · Spanisch · user `curriculum-by-realschule-7`
- [ ] `realschule|7|sport` — Realschule 7. Kl. · Sport · user `curriculum-by-realschule-7`
- [ ] `realschule|7|textiles-gestalten` — Realschule 7. Kl. · Textiles Gestalten · user `curriculum-by-realschule-7`
- [ ] `realschule|7|werken` — Realschule 7. Kl. · Werken · user `curriculum-by-realschule-7`
- [ ] `realschule|7|wirtschaft-und-recht` — Realschule 7. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-7`
- [ ] `realschule|8|bwl-rechnungswesen` — Realschule 8. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-by-realschule-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-by-realschule-8`
- [ ] `realschule|8|deutsch` — Realschule 8. Kl. · Deutsch · user `curriculum-by-realschule-8`
- [ ] `realschule|8|englisch` — Realschule 8. Kl. · Englisch · user `curriculum-by-realschule-8`
- [ ] `realschule|8|ernaehrung_und_gesundheit` — Realschule 8. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-8`
- [ ] `realschule|8|ethik` — Realschule 8. Kl. · Ethik · user `curriculum-by-realschule-8`
- [ ] `realschule|8|evangelische-religionslehre` — Realschule 8. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-8`
- [ ] `realschule|8|franzoesisch` — Realschule 8. Kl. · Französisch · user `curriculum-by-realschule-8`
- [ ] `realschule|8|geographie` — Realschule 8. Kl. · Geographie · user `curriculum-by-realschule-8`
- [ ] `realschule|8|geschichte` — Realschule 8. Kl. · Geschichte · user `curriculum-by-realschule-8`
- [ ] `realschule|8|it` — Realschule 8. Kl. · Informationstechnologie · user `curriculum-by-realschule-8`
- [ ] `realschule|8|iu` — Realschule 8. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-8`
- [ ] `realschule|8|ir` — Realschule 8. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-8`
- [ ] `realschule|8|katholische-religionslehre` — Realschule 8. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-8`
- [ ] `realschule|8|kunst` — Realschule 8. Kl. · Kunst · user `curriculum-by-realschule-8`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-by-realschule-8`
- [ ] `realschule|8|musik` — Realschule 8. Kl. · Musik · user `curriculum-by-realschule-8`
- [ ] `realschule|8|or` — Realschule 8. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-by-realschule-8`
- [ ] `realschule|8|pug` — Realschule 8. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-8`
- [ ] `realschule|8|soziallehre` — Realschule 8. Kl. · Soziallehre · user `curriculum-by-realschule-8`
- [ ] `realschule|8|sozialwesen` — Realschule 8. Kl. · Sozialwesen · user `curriculum-by-realschule-8`
- [ ] `realschule|8|spanisch` — Realschule 8. Kl. · Spanisch · user `curriculum-by-realschule-8`
- [ ] `realschule|8|sport` — Realschule 8. Kl. · Sport · user `curriculum-by-realschule-8`
- [ ] `realschule|8|textiles-gestalten` — Realschule 8. Kl. · Textiles Gestalten · user `curriculum-by-realschule-8`
- [ ] `realschule|8|werken` — Realschule 8. Kl. · Werken · user `curriculum-by-realschule-8`
- [ ] `realschule|8|wirtschaft-und-recht` — Realschule 8. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-8`
- [ ] `realschule|9|bwl-rechnungswesen` — Realschule 9. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-9`
- [ ] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-by-realschule-9`
- [ ] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-by-realschule-9`
- [x] `realschule|9|deutsch` — Realschule 9. Kl. · Deutsch · user `curriculum-by-realschule-9`
- [x] `realschule|9|englisch` — Realschule 9. Kl. · Englisch · user `curriculum-by-realschule-9`
- [ ] `realschule|9|ernaehrung_und_gesundheit` — Realschule 9. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-9`
- [ ] `realschule|9|ethik` — Realschule 9. Kl. · Ethik · user `curriculum-by-realschule-9`
- [ ] `realschule|9|evangelische-religionslehre` — Realschule 9. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-9`
- [ ] `realschule|9|franzoesisch` — Realschule 9. Kl. · Französisch · user `curriculum-by-realschule-9`
- [ ] `realschule|9|geographie` — Realschule 9. Kl. · Geographie · user `curriculum-by-realschule-9`
- [ ] `realschule|9|geschichte` — Realschule 9. Kl. · Geschichte · user `curriculum-by-realschule-9`
- [ ] `realschule|9|it` — Realschule 9. Kl. · Informationstechnologie · user `curriculum-by-realschule-9`
- [ ] `realschule|9|iu` — Realschule 9. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-9`
- [ ] `realschule|9|ir` — Realschule 9. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-9`
- [ ] `realschule|9|katholische-religionslehre` — Realschule 9. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-9`
- [ ] `realschule|9|kunst` — Realschule 9. Kl. · Kunst · user `curriculum-by-realschule-9`
- [x] `realschule|9|mathematik|wpfg1` — Realschule 9. Kl. · Mathematik · Mathematik 9 (I) · user `curriculum-by-realschule-9`
- [x] `realschule|9|mathematik|wpfg2-3` — Realschule 9. Kl. · Mathematik · Mathematik 9 (II/III) · user `curriculum-by-realschule-9`
- [ ] `realschule|9|musik` — Realschule 9. Kl. · Musik · user `curriculum-by-realschule-9`
- [ ] `realschule|9|or` — Realschule 9. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-9`
- [ ] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-by-realschule-9`
- [ ] `realschule|9|pug` — Realschule 9. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-9`
- [ ] `realschule|9|soziallehre` — Realschule 9. Kl. · Soziallehre · user `curriculum-by-realschule-9`
- [ ] `realschule|9|sozialwesen` — Realschule 9. Kl. · Sozialwesen · user `curriculum-by-realschule-9`
- [ ] `realschule|9|spanisch` — Realschule 9. Kl. · Spanisch · user `curriculum-by-realschule-9`
- [ ] `realschule|9|sport` — Realschule 9. Kl. · Sport · user `curriculum-by-realschule-9`
- [ ] `realschule|9|textiles-gestalten` — Realschule 9. Kl. · Textiles Gestalten · user `curriculum-by-realschule-9`
- [ ] `realschule|9|werken` — Realschule 9. Kl. · Werken · user `curriculum-by-realschule-9`
- [ ] `realschule|9|wirtschaft-und-recht` — Realschule 9. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-9`
- [ ] `realschule|10|bwl-rechnungswesen` — Realschule 10. Kl. · Betriebswirtschaftslehre / Rechnungswesen · user `curriculum-by-realschule-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-by-realschule-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-by-realschule-10`
- [ ] `realschule|10|deutsch` — Realschule 10. Kl. · Deutsch · user `curriculum-by-realschule-10`
- [ ] `realschule|10|englisch` — Realschule 10. Kl. · Englisch · user `curriculum-by-realschule-10`
- [ ] `realschule|10|ernaehrung_und_gesundheit` — Realschule 10. Kl. · Ernährung und Gesundheit · user `curriculum-by-realschule-10`
- [ ] `realschule|10|ethik` — Realschule 10. Kl. · Ethik · user `curriculum-by-realschule-10`
- [ ] `realschule|10|evangelische-religionslehre` — Realschule 10. Kl. · Evangelische Religionslehre · user `curriculum-by-realschule-10`
- [ ] `realschule|10|franzoesisch` — Realschule 10. Kl. · Französisch · user `curriculum-by-realschule-10`
- [ ] `realschule|10|geographie` — Realschule 10. Kl. · Geographie · user `curriculum-by-realschule-10`
- [ ] `realschule|10|geschichte` — Realschule 10. Kl. · Geschichte · user `curriculum-by-realschule-10`
- [ ] `realschule|10|it` — Realschule 10. Kl. · Informationstechnologie · user `curriculum-by-realschule-10`
- [ ] `realschule|10|iu` — Realschule 10. Kl. · Islamischer Unterricht · user `curriculum-by-realschule-10`
- [ ] `realschule|10|ir` — Realschule 10. Kl. · Israelitische Religionslehre · user `curriculum-by-realschule-10`
- [ ] `realschule|10|katholische-religionslehre` — Realschule 10. Kl. · Katholische Religionslehre · user `curriculum-by-realschule-10`
- [ ] `realschule|10|kunst` — Realschule 10. Kl. · Kunst · user `curriculum-by-realschule-10`
- [ ] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-by-realschule-10`
- [ ] `realschule|10|musik` — Realschule 10. Kl. · Musik · user `curriculum-by-realschule-10`
- [ ] `realschule|10|or` — Realschule 10. Kl. · Orthodoxe Religionslehre · user `curriculum-by-realschule-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-by-realschule-10`
- [ ] `realschule|10|pug` — Realschule 10. Kl. · Politik und Gesellschaft · user `curriculum-by-realschule-10`
- [ ] `realschule|10|soziallehre` — Realschule 10. Kl. · Soziallehre · user `curriculum-by-realschule-10`
- [ ] `realschule|10|sozialwesen` — Realschule 10. Kl. · Sozialwesen · user `curriculum-by-realschule-10`
- [ ] `realschule|10|spanisch` — Realschule 10. Kl. · Spanisch · user `curriculum-by-realschule-10`
- [ ] `realschule|10|sport` — Realschule 10. Kl. · Sport · user `curriculum-by-realschule-10`
- [ ] `realschule|10|textiles-gestalten` — Realschule 10. Kl. · Textiles Gestalten · user `curriculum-by-realschule-10`
- [ ] `realschule|10|werken` — Realschule 10. Kl. · Werken · user `curriculum-by-realschule-10`
- [ ] `realschule|10|wirtschaft-und-recht` — Realschule 10. Kl. · Wirtschaft und Recht · user `curriculum-by-realschule-10`

## Phase M — `rahmenlehrplan-berlin-brandenburg` (Berlin / Brandenburg)

Provider: **Rahmenlehrplan (Berlin-Brandenburg)** · Region: `BE-BB` · Paths: **40** · Topics today: **9** (23%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `realschule|7|mathematik` — Realschule 7. Kl. · Mathematik · user `curriculum-be-bb-realschule-7`
- [ ] `realschule|7|informatik` — Realschule 7. Kl. · Informatik · user `curriculum-be-bb-realschule-7`
- [ ] `realschule|7|physik` — Realschule 7. Kl. · Physik · user `curriculum-be-bb-realschule-7`
- [ ] `realschule|7|chemie` — Realschule 7. Kl. · Chemie · user `curriculum-be-bb-realschule-7`
- [ ] `realschule|7|biologie` — Realschule 7. Kl. · Biologie · user `curriculum-be-bb-realschule-7`
- [ ] `realschule|8|mathematik` — Realschule 8. Kl. · Mathematik · user `curriculum-be-bb-realschule-8`
- [ ] `realschule|8|informatik` — Realschule 8. Kl. · Informatik · user `curriculum-be-bb-realschule-8`
- [ ] `realschule|8|physik` — Realschule 8. Kl. · Physik · user `curriculum-be-bb-realschule-8`
- [ ] `realschule|8|chemie` — Realschule 8. Kl. · Chemie · user `curriculum-be-bb-realschule-8`
- [ ] `realschule|8|biologie` — Realschule 8. Kl. · Biologie · user `curriculum-be-bb-realschule-8`
- [ ] `realschule|9|mathematik` — Realschule 9. Kl. · Mathematik · user `curriculum-be-bb-realschule-9`
- [x] `realschule|9|informatik` — Realschule 9. Kl. · Informatik · user `curriculum-be-bb-realschule-9`
- [x] `realschule|9|physik` — Realschule 9. Kl. · Physik · user `curriculum-be-bb-realschule-9`
- [x] `realschule|9|chemie` — Realschule 9. Kl. · Chemie · user `curriculum-be-bb-realschule-9`
- [x] `realschule|9|biologie` — Realschule 9. Kl. · Biologie · user `curriculum-be-bb-realschule-9`
- [x] `realschule|10|mathematik` — Realschule 10. Kl. · Mathematik · user `curriculum-be-bb-realschule-10`
- [ ] `realschule|10|informatik` — Realschule 10. Kl. · Informatik · user `curriculum-be-bb-realschule-10`
- [ ] `realschule|10|physik` — Realschule 10. Kl. · Physik · user `curriculum-be-bb-realschule-10`
- [ ] `realschule|10|chemie` — Realschule 10. Kl. · Chemie · user `curriculum-be-bb-realschule-10`
- [ ] `realschule|10|biologie` — Realschule 10. Kl. · Biologie · user `curriculum-be-bb-realschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-be-bb-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-be-bb-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-be-bb-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-be-bb-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-be-bb-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-be-bb-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-be-bb-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-be-bb-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-be-bb-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-be-bb-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-be-bb-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-be-bb-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-be-bb-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-be-bb-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-be-bb-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-be-bb-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-be-bb-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-be-bb-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-be-bb-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-be-bb-gymnasium-10`

## Phase N — `rahmenplan-mv` (Mecklenburg-Vorpommern)

Provider: **Rahmenplan (Mecklenburg-Vorpommern)** · Region: `MV` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `regionale-schule|7|mathematik` — Regionale Schule 7. Kl. · Mathematik · user `curriculum-mv-regionale-schule-7`
- [ ] `regionale-schule|7|informatik` — Regionale Schule 7. Kl. · Informatik · user `curriculum-mv-regionale-schule-7`
- [ ] `regionale-schule|7|physik` — Regionale Schule 7. Kl. · Physik · user `curriculum-mv-regionale-schule-7`
- [ ] `regionale-schule|7|chemie` — Regionale Schule 7. Kl. · Chemie · user `curriculum-mv-regionale-schule-7`
- [ ] `regionale-schule|7|biologie` — Regionale Schule 7. Kl. · Biologie · user `curriculum-mv-regionale-schule-7`
- [ ] `regionale-schule|8|mathematik` — Regionale Schule 8. Kl. · Mathematik · user `curriculum-mv-regionale-schule-8`
- [ ] `regionale-schule|8|informatik` — Regionale Schule 8. Kl. · Informatik · user `curriculum-mv-regionale-schule-8`
- [ ] `regionale-schule|8|physik` — Regionale Schule 8. Kl. · Physik · user `curriculum-mv-regionale-schule-8`
- [ ] `regionale-schule|8|chemie` — Regionale Schule 8. Kl. · Chemie · user `curriculum-mv-regionale-schule-8`
- [ ] `regionale-schule|8|biologie` — Regionale Schule 8. Kl. · Biologie · user `curriculum-mv-regionale-schule-8`
- [ ] `regionale-schule|9|mathematik` — Regionale Schule 9. Kl. · Mathematik · user `curriculum-mv-regionale-schule-9`
- [ ] `regionale-schule|9|informatik` — Regionale Schule 9. Kl. · Informatik · user `curriculum-mv-regionale-schule-9`
- [x] `regionale-schule|9|physik` — Regionale Schule 9. Kl. · Physik · user `curriculum-mv-regionale-schule-9`
- [x] `regionale-schule|9|chemie` — Regionale Schule 9. Kl. · Chemie · user `curriculum-mv-regionale-schule-9`
- [x] `regionale-schule|9|biologie` — Regionale Schule 9. Kl. · Biologie · user `curriculum-mv-regionale-schule-9`
- [x] `regionale-schule|10|mathematik` — Regionale Schule 10. Kl. · Mathematik · user `curriculum-mv-regionale-schule-10`
- [ ] `regionale-schule|10|informatik` — Regionale Schule 10. Kl. · Informatik · user `curriculum-mv-regionale-schule-10`
- [ ] `regionale-schule|10|physik` — Regionale Schule 10. Kl. · Physik · user `curriculum-mv-regionale-schule-10`
- [ ] `regionale-schule|10|chemie` — Regionale Schule 10. Kl. · Chemie · user `curriculum-mv-regionale-schule-10`
- [ ] `regionale-schule|10|biologie` — Regionale Schule 10. Kl. · Biologie · user `curriculum-mv-regionale-schule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-mv-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-mv-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-mv-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-mv-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-mv-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-mv-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-mv-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-mv-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-mv-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-mv-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-mv-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-mv-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-mv-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-mv-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-mv-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-mv-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-mv-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-mv-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-mv-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-mv-gymnasium-10`

## Phase O — `rahmenrichtlinien-st` (Sachsen-Anhalt)

Provider: **Rahmenrichtlinien (Sachsen-Anhalt)** · Region: `ST` · Paths: **40** · Topics today: **8** (20%)

Each line: manifest topics + `contentUrls` + HTML fixture + CLI topic check + desktop E2E import.

- [ ] `sekundarschule|7|mathematik` — Sekundarschule 7. Kl. · Mathematik · user `curriculum-st-sekundarschule-7`
- [ ] `sekundarschule|7|informatik` — Sekundarschule 7. Kl. · Informatik · user `curriculum-st-sekundarschule-7`
- [ ] `sekundarschule|7|physik` — Sekundarschule 7. Kl. · Physik · user `curriculum-st-sekundarschule-7`
- [ ] `sekundarschule|7|chemie` — Sekundarschule 7. Kl. · Chemie · user `curriculum-st-sekundarschule-7`
- [ ] `sekundarschule|7|biologie` — Sekundarschule 7. Kl. · Biologie · user `curriculum-st-sekundarschule-7`
- [ ] `sekundarschule|8|mathematik` — Sekundarschule 8. Kl. · Mathematik · user `curriculum-st-sekundarschule-8`
- [ ] `sekundarschule|8|informatik` — Sekundarschule 8. Kl. · Informatik · user `curriculum-st-sekundarschule-8`
- [ ] `sekundarschule|8|physik` — Sekundarschule 8. Kl. · Physik · user `curriculum-st-sekundarschule-8`
- [ ] `sekundarschule|8|chemie` — Sekundarschule 8. Kl. · Chemie · user `curriculum-st-sekundarschule-8`
- [ ] `sekundarschule|8|biologie` — Sekundarschule 8. Kl. · Biologie · user `curriculum-st-sekundarschule-8`
- [ ] `sekundarschule|9|mathematik` — Sekundarschule 9. Kl. · Mathematik · user `curriculum-st-sekundarschule-9`
- [ ] `sekundarschule|9|informatik` — Sekundarschule 9. Kl. · Informatik · user `curriculum-st-sekundarschule-9`
- [x] `sekundarschule|9|physik` — Sekundarschule 9. Kl. · Physik · user `curriculum-st-sekundarschule-9`
- [x] `sekundarschule|9|chemie` — Sekundarschule 9. Kl. · Chemie · user `curriculum-st-sekundarschule-9`
- [x] `sekundarschule|9|biologie` — Sekundarschule 9. Kl. · Biologie · user `curriculum-st-sekundarschule-9`
- [x] `sekundarschule|10|mathematik` — Sekundarschule 10. Kl. · Mathematik · user `curriculum-st-sekundarschule-10`
- [ ] `sekundarschule|10|informatik` — Sekundarschule 10. Kl. · Informatik · user `curriculum-st-sekundarschule-10`
- [ ] `sekundarschule|10|physik` — Sekundarschule 10. Kl. · Physik · user `curriculum-st-sekundarschule-10`
- [ ] `sekundarschule|10|chemie` — Sekundarschule 10. Kl. · Chemie · user `curriculum-st-sekundarschule-10`
- [ ] `sekundarschule|10|biologie` — Sekundarschule 10. Kl. · Biologie · user `curriculum-st-sekundarschule-10`
- [ ] `gymnasium|7|mathematik` — Gymnasium 7. Kl. · Mathematik · user `curriculum-st-gymnasium-7`
- [ ] `gymnasium|7|informatik` — Gymnasium 7. Kl. · Informatik · user `curriculum-st-gymnasium-7`
- [ ] `gymnasium|7|physik` — Gymnasium 7. Kl. · Physik · user `curriculum-st-gymnasium-7`
- [ ] `gymnasium|7|chemie` — Gymnasium 7. Kl. · Chemie · user `curriculum-st-gymnasium-7`
- [ ] `gymnasium|7|biologie` — Gymnasium 7. Kl. · Biologie · user `curriculum-st-gymnasium-7`
- [ ] `gymnasium|8|mathematik` — Gymnasium 8. Kl. · Mathematik · user `curriculum-st-gymnasium-8`
- [ ] `gymnasium|8|informatik` — Gymnasium 8. Kl. · Informatik · user `curriculum-st-gymnasium-8`
- [ ] `gymnasium|8|physik` — Gymnasium 8. Kl. · Physik · user `curriculum-st-gymnasium-8`
- [ ] `gymnasium|8|chemie` — Gymnasium 8. Kl. · Chemie · user `curriculum-st-gymnasium-8`
- [ ] `gymnasium|8|biologie` — Gymnasium 8. Kl. · Biologie · user `curriculum-st-gymnasium-8`
- [ ] `gymnasium|9|mathematik` — Gymnasium 9. Kl. · Mathematik · user `curriculum-st-gymnasium-9`
- [ ] `gymnasium|9|informatik` — Gymnasium 9. Kl. · Informatik · user `curriculum-st-gymnasium-9`
- [x] `gymnasium|9|physik` — Gymnasium 9. Kl. · Physik · user `curriculum-st-gymnasium-9`
- [x] `gymnasium|9|chemie` — Gymnasium 9. Kl. · Chemie · user `curriculum-st-gymnasium-9`
- [x] `gymnasium|9|biologie` — Gymnasium 9. Kl. · Biologie · user `curriculum-st-gymnasium-9`
- [x] `gymnasium|10|mathematik` — Gymnasium 10. Kl. · Mathematik · user `curriculum-st-gymnasium-10`
- [ ] `gymnasium|10|informatik` — Gymnasium 10. Kl. · Informatik · user `curriculum-st-gymnasium-10`
- [ ] `gymnasium|10|physik` — Gymnasium 10. Kl. · Physik · user `curriculum-st-gymnasium-10`
- [ ] `gymnasium|10|chemie` — Gymnasium 10. Kl. · Chemie · user `curriculum-st-gymnasium-10`
- [ ] `gymnasium|10|biologie` — Gymnasium 10. Kl. · Biologie · user `curriculum-st-gymnasium-10`

## Acceptance (Epic complete)

- Every checkbox above is checked.
- Phase B import pipeline acceptance from Phase 3 plan is met.
- `npm run format && npm run lint && npm run typecheck && npm run test && npm run build` green.
- No regression for `thomas` / `test-user-0.6.2` profiles.
