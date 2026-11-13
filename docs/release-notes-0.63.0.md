# ZAM 0.63.0: Mittelschule, Physik & Biologie 11, Deutsch 5 RS, and retired school cells

Eleven more ZAM Academy subjects join the ZAM bundle — including the first eight
cells for the Bavarian Mittelschule (Deutsch and Mathematik in grades 5–8),
Physik 11 and Biologie 11 (Einführungsklasse) at the Gymnasium, and Deutsch 5 at
the Realschule — alongside an updated Mathematik 7 Realschule cell. Thirty-three
superseded `de-by:` school cells leave the active bundle.

## The ZAM Academy: Mittelschule (Deutsch and Mathematik 5–8)

- **Deutsch 5 Mittelschule.**
  [academy.zam-os.org/deutsch-mittelschule-5](https://academy.zam-os.org/deutsch-mittelschule-5/)
  brings 51 lessons and 102 cards.
- **Deutsch 6 Mittelschule.**
  [academy.zam-os.org/deutsch-mittelschule-6](https://academy.zam-os.org/deutsch-mittelschule-6/)
  brings 52 lessons and 104 cards.
- **Deutsch 7 Mittelschule.**
  [academy.zam-os.org/deutsch-mittelschule-7](https://academy.zam-os.org/deutsch-mittelschule-7/)
  brings 37 lessons and 74 cards across Regelklasse (`R`) and
  Mittlere-Reife-Klasse (`M`).
- **Deutsch 8 Mittelschule.**
  [academy.zam-os.org/deutsch-mittelschule-8](https://academy.zam-os.org/deutsch-mittelschule-8/)
  brings 37 lessons and 74 cards across Regelklasse (`R`) and
  Mittlere-Reife-Klasse (`M`).
- **Mathematik 5 Mittelschule.**
  [academy.zam-os.org/mathematik-mittelschule-5](https://academy.zam-os.org/mathematik-mittelschule-5/)
  brings 32 lessons and 64 cards.
- **Mathematik 6 Mittelschule.**
  [academy.zam-os.org/mathematik-mittelschule-6](https://academy.zam-os.org/mathematik-mittelschule-6/)
  brings 35 lessons and 70 cards.
- **Mathematik 7 Mittelschule.**
  [academy.zam-os.org/mathematik-mittelschule-7](https://academy.zam-os.org/mathematik-mittelschule-7/)
  brings 32 lessons and 96 cards across Regelklasse (`R`) and
  Mittlere-Reife-Klasse (`M`).
- **Mathematik 8 Mittelschule.**
  [academy.zam-os.org/mathematik-mittelschule-8](https://academy.zam-os.org/mathematik-mittelschule-8/)
  brings 31 lessons and 93 cards across Regelklasse (`R`) and
  Mittlere-Reife-Klasse (`M`).

## The ZAM Academy: Gymnasium 11 and Realschule

- **Physik 11 Gymnasium.**
  [academy.zam-os.org/physik-gymnasium-11](https://academy.zam-os.org/physik-gymnasium-11/)
  brings 34 lessons and 102 cards. Three earlier cards move with their review
  histories, and the three existing Physik 11 school cells stay active.
- **Biologie 11 Gymnasium · Einführungsklasse (preview).**
  [academy.zam-os.org/biologie-gymnasium-11](https://academy.zam-os.org/biologie-gymnasium-11/)
  (`2026.11.3`) brings 28 lessons and 84 cards for the Einführungsklasse. ZAM
  labels it `Vorschau · noch nicht von einer Lehrkraft geprüft`. One earlier card
  moves with its review history, and the two existing Biologie 11 school cells
  stay active.
- **Deutsch 5 Realschule (preview).**
  [academy.zam-os.org/deutsch-realschule-5](https://academy.zam-os.org/deutsch-realschule-5/)
  (`2026.11.2`) brings 37 lessons and 77 cards, labeled
  `Vorschau · noch nicht von einer Lehrkraft geprüft`. Eight earlier cards move
  with their review histories, and the two superseded Deutsch 5 school cells leave
  the bundle.
- **Mathematik 7 Realschule (`2026.11.1`).**
  [academy.zam-os.org/mathematik-realschule-7](https://academy.zam-os.org/mathematik-realschule-7/)
  updates to 42 lessons and 126 cards with approved mappings: seven earlier
  cards move with their review histories, and the four superseded Mathematik 7
  school cells leave the bundle.

## Superseded school cells retired

With Thomas's mapping approvals in place, 33 superseded `de-by:` school cells
move out of the active bundle to `tests/fixtures/legacy/`:

- **14 Gymnasium Mathematik cells** (`Mathematik 5`, `6`, `11`, `12`, `13`).
- **19 Realschule cells** (`Mathematik 5`, `6`, `7`, `Englisch 5`, `10`,
  `Deutsch 5`, `8`, `10`, `Biologie 8`, `Französisch 8`, `Geographie 8`,
  `Geschichte 8`).

If you already enrolled cards from any of those school cells, your cards and
review histories stay in your personal library; enrolling the matching Academy
cell transfers approved successor cards (`replaces`) along with their FSRS
state without creating duplicates.

## Worth knowing

- **Mittelschule track normalization.** `curriculumTrackMembers` now maps
  `regelklasse` <-> `R` and `mittlere-reife-klasse` <-> `M` so Mittelschule grade
  7 and 8 Academy cells match both Lehrplan spellings and learner profiles.
- **58 Academy cells and 153 school cells** (211 total tiles, including 6
  Academy previews) now ship with ZAM.
- **No schema change.** `CURRENT_SCHEMA_VERSION` is unchanged.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells), ADR 2026-08-14
  Decisions 9–10 (explicit successors, cells before generic import).
