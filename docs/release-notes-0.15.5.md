# ZAM 0.15.5 — Bayern LehrplanPLUS complete

Every Bavarian school type in the curriculum import wizard now has a
live-captured Fachlehrplan taxonomy. Learners can walk Land → Bayern →
Schulform → Klasse → Fach (→ Ausprägung / Förderschwerpunkt) → Lernbereich
for **all eight** school types published on LehrplanPLUS.

## Added

- **Full LehrplanPLUS (Bayern) coverage for the remaining school types**
  ([#194](https://github.com/zam-os/zam/pull/194)):
  - Wirtschaftsschule (grades 5–11)
  - Fachoberschule (10–13)
  - Berufsoberschule (10, 12, 13)
  - Grundschule (2–4)
  - Mittelschule (5–10)
  - Förderschule (2–12), with **Förderschwerpunkte** as tracks
    (`lernen`, `sehen`, `hören`, …)
  - Realschule and Gymnasium were already complete; the bundled manifest
    now holds **2095** navigable topic paths with content URLs for school
    year 2026/2027.
- Capture/apply tooling for future school-year refreshes
  (`scripts/capture-bayern-school-types.ts`,
  `scripts/apply-bayern-capture.ts`) plus extended audit/probe scripts.

## Changed

- OKF import contract: display titles on generated learning cards must be
  *judged* (not raw headings) — docs/skill wording aligned with the import
  tools ([#193](https://github.com/zam-os/zam/pull/193)).

## Notes

- Catalog “gaps” (a subject listed for a grade that has no Fachlehrplan on
  LehrplanPLUS for that year) still show an empty topic list — intentional,
  same as Chemie in Realschule 5.
- Future-dated editions (e.g. `gueltig_ab_27_28`) are not included for
  2026/27; re-run capture after the next school-year switch.
