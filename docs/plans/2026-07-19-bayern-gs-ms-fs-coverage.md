# Bayern Grundschule + Mittelschule + Förderschule — Manifest-Coverage

Branch: `feat/bayern-ws-fos-bos-curriculum-coverage` (Fortsetzung nach WS/FOS/BOS)  
Vorarbeit: `2026-07-19-bayern-ws-fos-bos-coverage.md`

## Ziel

Die drei verbleibenden Schularten im LehrplanPLUS-Wizard befüllen:

| Schulart | id | Jahrgangsstufen (LehrplanPLUS) |
|----------|-----|--------------------------------|
| Grundschule | `grundschule` | 2–4 (kein Jg. 1 im Navigationsbaum) |
| Mittelschule | `mittelschule` | 5–10 |
| Förderschule | `foerderschule` | 2–12 |

## Status

- [x] **Phase 0 — Exploration** (grades/subjects/sample tracks)
- [x] **Phase 1 — Capture** — 1102 paths (GS 49, MS 168, FS 885); FS via
  `w_foerderschwerpunkt` tracks
- [x] **Phase 2 — Manifest merge**
- [x] **Phase 3 — Audit/Tests** — 44 provider tests green; audit 2095 OK
  across all 8 Bayern school types
- [x] **Phase 4 — Commit + push**

### Capture summary (2026-07-19)

| Schulart | Grades | Subjects | Track-Gruppen | Topic-Pfade |
|----------|--------|----------|---------------|-------------|
| Grundschule | 2–4 | 15 | 8 | 49 |
| Mittelschule | 5–10 | 24 | 51 | 168 |
| Förderschule | 2–12 | 43 | 252 | 885 |

Förderschule: Tracks = Förderschwerpunkte (`lernen`, `sehen`, `hoeren`,
`geistige-entwicklung`, `ese`, `kme`, `sprache`). URL-Param
`w_foerderschwerpunkt` (nicht `w_auspraegung`).

## Tools

```bash
npx tsx scripts/capture-bayern-school-types.ts grundschule mittelschule foerderschule
npx tsx scripts/apply-bayern-capture.ts \
  scripts/.cache/bayern-grundschule-mittelschule-foerderschule-capture.json
npx tsx scripts/audit-bayern-manifest.ts
npm run test -- tests/cli/curriculum-lehrplanplus-bayern.test.ts
```
