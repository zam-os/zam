# ZAM 0.15.5 — Bayern LehrplanPLUS complete

Every Bavarian school type in the curriculum import wizard now has a
live-captured Fachlehrplan taxonomy. Learners can walk Land → Bayern →
Schulform → Klasse → Fach (→ Ausprägung / Förderschwerpunkt) → Lernbereich
for **all eight** school types published on LehrplanPLUS — not only
Realschule and Gymnasium.

## Highlights

- **Full LehrplanPLUS (Bayern) coverage**
  ([#194](https://github.com/zam-os/zam/pull/194)). The bundled manifest
  now holds **2095** navigable topic paths with content URLs for school
  year 2026/2027:

  | Schulart | Grades | Topic paths |
  |----------|--------|-------------|
  | Grundschule | 2–4 | 49 |
  | Mittelschule | 5–10 | 168 |
  | Förderschule | 2–12 | 885 |
  | Realschule | 5–10 | 144 (already complete) |
  | Gymnasium | 5–13 | 341 (already complete) |
  | Wirtschaftsschule | 5–11 | 166 |
  | Fachoberschule | 10–13 | 202 |
  | Berufsoberschule | 10, 12, 13 | 140 |

- **Förderschule tracks are Förderschwerpunkte** (`lernen`, `sehen`,
  `hören`, `geistige-entwicklung`, …) resolved via
  `w_foerderschwerpunkt` — the same Ausprägung step in the wizard, the
  official site's second dimension under the hood.
- **Capture/apply tooling for school-year refreshes** —
  `scripts/capture-bayern-school-types.ts` and
  `scripts/apply-bayern-capture.ts`, plus audit/probe coverage for all
  eight school types.

## Also in this release

- **OKF import contract: judged display titles**
  ([#193](https://github.com/zam-os/zam/pull/193)). Skill and tool docs
  now require *judged* card titles on knowledge-to-learning import, not
  raw article headings.

## Notes

- Catalog “gaps” (a subject listed for a grade with no Fachlehrplan on
  LehrplanPLUS for that year) still show an empty topic list —
  intentional, same as Chemie in Realschule 5.
- Future-dated editions (e.g. `gueltig_ab_27_28`) are not included for
  2026/27; re-run capture after the next school-year switch.
