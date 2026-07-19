# Bayern Wirtschaftsschule + FOS + BOS — Manifest-Coverage

Branch: `feat/bayern-ws-fos-bos-curriculum-coverage`  
Auslöser: Realschule und Gymnasium sind live-verifiziert vollständig (Plan
`2026-07-12-bayern-rs-gym-coverage-fix.md`). Die drei weiteren LehrplanPLUS-
Schularten im Wizard (Wirtschaftsschule, Fachoberschule, Berufsoberschule)
waren nur als leere `schoolTypes`-Einträge vorhanden — keine grades/subjects/
tracks/topics/contentUrls.

## Kontext (Repo-Stand 2026-07-19)

- Letzte 7 Tage: OKF knowledge base, Releases 0.12–0.15.4, Companion — kein
  offener Blocker für Curriculum-Arbeit.
- `lehrplanplus-bayern` Manifest: RS 144 OK-Pfade, Gym 341 OK-Pfade;
  WS/FOS/BOS: 0.
- ADR 2026-07-02: Manifest wird agent-navigiert gegen die Live-Site erfasst
  (kein CI-Live-Fetch); `capturedOn` markiert die Verifikation.

## Ziel

Wizard-Pfade für:

| Schulart | id | Jahrgangsstufen (LehrplanPLUS) |
|----------|-----|--------------------------------|
| Wirtschaftsschule | `wirtschaftsschule` | 5–11 |
| Fachoberschule | `fos` | 10–13 |
| Berufsoberschule | `bos` | 10, 12, 13 |

Jede live vorhandene Fach×Jg×Ausprägung-Kombination liefert auswählbare
Lernbereiche und eine `contentUrl`.

## Entscheidungen (gefroren)

1. **Gültigkeit (Schuljahr 2026/2027):** Tracks mit
   `_gueltig_ab_27_28` / `gueltig_ab_27_28` und abgelaufene
   `_gueltig_bis_2425` werden **nicht** aufgenommen. Tracks
   `gueltig_bis_26_27` und unversionierte (aktuelle) Ausprägungen **ja**.
2. **Ausprägungen:** Wirtschaftsschule nutzt oft
   `zweistufig` / `dreistufig` / `vierstufig`. FOS/BOS nutzen
   Ausbildungsrichtungs- und Wahl-/Additum-Tracks (z. B. `t`,
   `abu-g-s-w-gh-iw`, `Wahl-abu-…`). Labels kommen aus dem Link-Text bzw.
   `title` auf LehrplanPLUS.
3. **Leere Pfade:** Fach im Katalog, aber kein Fachlehrplan für die Jg. →
   kein `topics`/`contentUrls`-Eintrag (wie Chemie 5 RS).
4. **URL-Format:** identisch zu RS/Gym
   (`…/inhalt/fachlehrplaene` bzw. `?w_…&w_auspraegung=<id>`).
5. **Erfassung:** Capture-Skript einmalig gegen Live-Site; Ergebnis landet
   im gebündelten Manifest. CI bleibt offline.

## Status

- [x] **Phase 0 — Plan + Branch**
- [x] **Phase 1 — Capture-Skript** (`scripts/capture-bayern-ws-fos-bos.ts` + apply)
- [x] **Phase 2 — Manifest füllen** — 508 live topic paths (WS 166, FOS 202, BOS 140)
- [x] **Phase 3 — Audit/Probe** um `wirtschaftsschule` | `fos` | `bos` erweitert
- [x] **Phase 4 — Provider-Tests** für die drei Schularten
- [x] **Phase 5 — Verifikation** — 35 provider tests green; lint/typecheck clean;
  audit total OK 993 (RS+Gym+WS+FOS+BOS); catalog-gaps = expected empties

### Capture summary (2026-07-19)

| Schulart | Grades | Subjects | Track-Gruppen | Topic-Pfade |
|----------|--------|----------|---------------|-------------|
| Wirtschaftsschule | 5–11 | 30 | 40 | 166 |
| Fachoberschule | 10–13 | 48 | 49 | 202 |
| Berufsoberschule | 10, 12, 13 | 41 | 32 | 140 |

Audit-„Lücken“ (Fach×Jg. ohne `topics`) sind erwartete Leerstellen: Fach im
Katalog, aber kein aktueller Fachlehrplan für SJ 2026/27 auf LehrplanPLUS
(z. B. BOS Deutsch 12 nur `gueltig_ab_27_28`).

## Verifikation

```bash
npx tsx scripts/capture-bayern-ws-fos-bos.ts   # optional re-capture
npx tsx scripts/audit-bayern-manifest.ts
npx tsx scripts/probe-bayern-gaps.ts wirtschaftsschule
npx tsx scripts/probe-bayern-gaps.ts fos
npx tsx scripts/probe-bayern-gaps.ts bos
npm run test -- tests/cli/curriculum-lehrplanplus-bayern.test.ts
npm run format && npm run lint && npm run typecheck
```

## Nach dem Merge

Optional CI-Gate: Audit-Skript in Vitest einbinden (wie im RS/Gym-Plan
offen gelassen). Grundschule / Mittelschule / Förderschule bleiben separat.
