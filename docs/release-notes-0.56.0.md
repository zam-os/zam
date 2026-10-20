# ZAM 0.56.0: Datenbanken, Mathematik and Chemie 9 from the ZAM Academy

Three more ZAM Academy apps reach ZAM: Relationale Datenbanken und SQL,
Mathematik 9 and Chemie 9 for the Realschule. Each brings a cell that becomes
ZAM's cell for its curriculum position and replaces the earlier ones there.
When the new cell arrives, your learning history moves with you wherever an
old card and a new card ask the same thing.

## The ZAM Academy

- **Relationale Datenbanken und SQL.**
  [academy.zam-os.org/sql](https://academy.zam-os.org/sql/) teaches 18 lessons
  in German and English, each with a SQLite sandbox in the browser. It follows
  LehrplanPLUS Bayern IT 2.3.1/2.3.2 for the Realschule. The bundled cell has
  68 cards and replaces the Realschule 9 database cell; all eight old cards
  have a successor.
- **Mathematik 9 Realschule.**
  [academy.zam-os.org/mathematik-realschule-9](https://academy.zam-os.org/mathematik-realschule-9/)
  teaches 29 lessons in five stages with labs in which you drag points:
  - Rechtwinklige Dreiecke;
  - Kreis und Körper;
  - Systeme linearer Gleichungen;
  - Quadratische Funktionen (Zweig I);
  - Daten und Zufall.

  The bundled cell has 108 cards and replaces the five earlier Realschule 9
  mathematics cells. 45 of their 49 cards move to a successor. The other four
  were worked examples with fixed numbers or a double card. If you hold them,
  you keep them.
- **Chemie 9 Realschule.**
  [academy.zam-os.org/chemie-realschule-9](https://academy.zam-os.org/chemie-realschule-9/)
  teaches 35 lessons in seven stages, with a separate learning path of 22
  lessons for Zweig I and for Zweig II/III. The bundled cell has 77 cards and
  replaces the two earlier Realschule 9 chemistry cells:
  - 11 of their 16 cards move to a successor.
  - 5 old cards stated a rule too broadly (the Hauptgruppe rule without
    helium, fixed electronegativity limits, one ranking of all intermolecular
    forces). They leave your reviews; their history stays in your library.
    The corrected questions start fresh when you take the new cell.
- **Your history moves with you.** Every move follows an explicit mapping that
  was reviewed card by card and is kept next to each app in zam-os/zam-academy.
  ZAM never moves mastery on a guess.

## Curriculum

- **LehrplanPLUS Realschule Chemie 9** is now a curriculum position for
  Zweig I and Zweig II/III, with its Lernbereiche. Atombau belongs to
  Zweig II/III only.
- **A cell is found by the curriculum's own ids.** A position stored as
  Realschule 9 `it`, `bwl-rechnungswesen` or track `wpfg2-3` now finds cells
  that spell the subject `informatik` or `bwr`, or name a single group such as
  `II`. Before, such a position could fall back to the generic import although
  a cell covered it.

## Worth knowing

- **No schema change.**
- **Bundled cells:** five academy cells now (UML, Physik, SQL, Mathematik,
  Chemie). Eight de-by cells leave the bundle in this release: one database,
  five mathematics and two chemistry cells.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells), ADR 2026-08-14
  Decisions 9–10 (explicit successors, cells before generic import).
