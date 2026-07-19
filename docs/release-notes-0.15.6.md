# ZAM 0.15.6 — Curriculum wizard clarity

The import wizard now only offers choices that actually lead to importable
content, and it explains Bavaria's Ausprägung options in learner language —
no more guessing what "Mathematik 9 (I)" means or clicking into subjects
that end in an empty topic list.

## Highlights

- **No dead ends in the curriculum wizard**
  ([#197](https://github.com/zam-os/zam/pull/197)). Every registered
  curriculum provider is wrapped in a content filter: school types, grades,
  subjects, and Ausprägungen only appear when they can reach at least one
  importable Lernbereich. For LehrplanPLUS (Bayern) alone this hides the
  **635** subject×grade combinations without a published Fachlehrplan
  (e.g. FOS 10/11 Informatik, Realschule 5 Chemie) while keeping all
  **1125** importable ones; the sparse seed manifests of the other Länder
  are pruned the same way. A registry-wide conformance test now guards the
  invariant that every listed option leads to a resolvable source URL.

- **Ausprägungen explained** ([#197](https://github.com/zam-os/zam/pull/197)).
  Track options carry a plain-German description beneath the label, and the
  Ausprägung step shows a general explainer ("… im Zweifel hilft dein
  Stundenplan oder deine Lehrkraft"). Covered families:

  | Schulart | Explained variants |
  |----------|--------------------|
  | Realschule | Wahlpflichtfächergruppen I / II·III |
  | Gymnasium | erhöhtes/grundlegendes Anforderungsniveau, Fremdsprachenfolge, spät beginnende Fächer, Zweige (NTG, HG, SG, MuG, WWG, SWG), Vertiefungskurse |
  | Mittelschule | Regelklasse (R) vs. M-Klasse |
  | Wirtschaftsschule | zwei-/drei-/vierstufige Form mit Einstiegsjahrgang |
  | FOS/BOS | Ausbildungsrichtungen (ABU, G, GH, IW, S, T, W), AHR, Vorklasse/Vorkurs, Grund-/Aufbaukurse, fpA |
  | Alle | Basissport vs. Differenzierter Sport, Wochenstunden-Fassungen, "gültig ab/bis Schuljahr …" |

## Notes

- This supersedes the 0.15.5 note that catalog gaps "still show an empty
  topic list — intentional": such combinations are now hidden outright.
  Nothing was removed from the manifests — a school-year re-capture that
  adds topics makes a combination reappear automatically.
- Option descriptions are curriculum data and stay German by design; the
  step explainer ships in English and German, other UI languages fall back
  to English until the pack review.
