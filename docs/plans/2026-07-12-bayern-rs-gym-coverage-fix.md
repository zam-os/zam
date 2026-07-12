# Bayern Realschule + Gymnasium — Manifest-Coverage Fix

Branch: `fix/bayern-rs-gym-curriculum-coverage`  
Auslöser: Physik 9 Realschule lieferte im Wizard keine Themen (leeres `listTopics`).

Audit: `npx tsx scripts/audit-bayern-manifest.ts`

## Status

- [x] **Audit-Skript** — zählt OK-Pfade vs. Lücken im Manifest
- [x] **RS Physik 8–10** — Tracks `wpfg1` / `wpfg2-3`, Lernbereiche + `contentUrls`
- [ ] **RS übrige Lücken prüfen** — siehe Tabelle „erwartet leer“
- [ ] **Gymnasium Lücken prüfen** — Wahlpflichtfächer, viele erwartet leer
- [ ] **CI-Gate** (optional) — Audit in Tests einbinden

## Realschule — Checkliste (178 Pfade gesamt)

### Abgedeckt (144 OK nach Physik-Fix)

Alle Kernfächer mit Lehrplan auf LehrplanPLUS für die jeweilige Stufe, inkl.:

- Mathematik 5–10 mit `wpfg1` / `wpfg2-3`
- **Physik 7** (einheitlich) + **Physik 8–10** mit `wpfg1` / `wpfg2-3` ← neu
- Deutsch, Englisch, Biologie (wo angeboten), Chemie 8, …

### Manifest-Lücken — erwartet leer (37)

Fach steht im Katalog, aber **kein Fachlehrplan** auf LehrplanPLUS für diese
Jahrgangsstufe (Startseiten-Redirect). Verhalten wie Chemie 5 (bestehender Test).

| Pfad | Grund |
|------|-------|
| `realschule\|5\|*` (11 Fächer) | Wahlfächer / nicht in Jg. 5 unterrichtet |
| `realschule\|6\|*` (10 Fächer) | dito Jg. 6 |
| `realschule\|7\|*` (5 Fächer) | BWL, Chemie, EUG, PuG, Soziallehre, WiR — nicht Jg. 7 |
| `realschule\|8\|bwl-rechnungswesen`, `pug` | nicht Jg. 8 |
| `realschule\|9\|biologie`, `chemie`, `pug`, `wirtschaft-und-recht` | nicht Jg. 9 |
| `realschule\|10\|chemie`, `geographie`, `textiles-gestalten`, `wirtschaft-und-recht` | nicht Jg. 10 |

Kein Manifest-Eintrag nötig — Wizard soll leere Themenliste zeigen (ggf. Track-Auswahl bei Physik).

### Behoben in diesem Branch

| Pfad | Tracks | Lernbereiche |
|------|--------|--------------|
| `realschule\|8\|physik` | wpfg1 (4 LB), wpfg2-3 (3 LB) | live verifiziert 2026-07-12 |
| `realschule\|9\|physik` | wpfg1 (3 LB), wpfg2-3 (3 LB) | live verifiziert 2026-07-12 |
| `realschule\|10\|physik` | wpfg1 (4 LB), wpfg2-3 (4 LB) | live verifiziert 2026-07-12 |

## Gymnasium — Checkliste (500 Pfade gesamt)

### Abgedeckt (341 OK)

Kernfächer inkl. Deutsch, Englisch (mit Fremdsprachen-Tracks), Mathematik,
Physik/Chemie/Biologie wo unterrichtet, Geographie 5/7/10/11, NTG 5–7, …

### Manifest-Lücken (159) — überwiegend erwartet leer

Wahlpflichtfächer, Seminarfächer (`w-seminar`, `instrumentalensemble`, …),
`nt_gym` ab Jg. 8, `iu` in Oberstufe, etc. — im Fächerverzeichnis, aber kein
eigener Fachlehrplan für diese Kombination auf LehrplanPLUS.

**Nächster Schritt:** Stichproben mit alter URL-Form
`/schulart/gymnasium/jgs/{n}/fach/{fach}/inhalt/fachlehrplaene` — nur echte
Lücken (Live-Inhalt, kein Manifest) eintragen.

## Verifikation

```bash
npx tsx scripts/audit-bayern-manifest.ts
npm run test -- tests/cli/curriculum-lehrplanplus-bayern.test.ts
npm run dev -- bridge curriculum-list-level --provider lehrplanplus-bayern \
  --level track --selection '{"schoolType":"realschule","grade":"9","subject":"physik"}'
```