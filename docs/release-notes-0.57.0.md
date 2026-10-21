# ZAM 0.57.0: Seven more apps from the ZAM Academy

Seven more ZAM Academy apps reach ZAM: Geographie 9, Geschichte 9 and BwR 9,
Biologie 10 and Physik 10 for the Realschule, and the two IT modules
Algorithmen und Programmieren and Datennetze und Internet. Each brings a cell
that becomes ZAM's cell for its curriculum position and replaces the earlier
ones there. When the new cell arrives, your learning history moves with you
wherever an old card and a new card ask the same thing.

## The ZAM Academy

- **Geographie 9 Realschule.**
  [academy.zam-os.org/geographie-realschule-9](https://academy.zam-os.org/geographie-realschule-9/)
  covers all seven required learning areas and the optional bilingual
  offer. The bundled cell has 91 cards and replaces the earlier climate and
  resources cell; 4 of its 8 cards move to a successor.
- **Geschichte 9 Realschule.**
  [academy.zam-os.org/geschichte-realschule-9](https://academy.zam-os.org/geschichte-realschule-9/)
  covers all seven required learning areas with a source workshop. The
  bundled cell has 78 cards, 8 of them optional in English, and replaces the
  earlier Weimar Republic and National Socialism cell; 4 of its 8 cards move.
- **BwR 9 Realschule (Zweig II).**
  [academy.zam-os.org/bwr-realschule-9](https://academy.zam-os.org/bwr-realschule-9/)
  teaches 44 lessons across all five learning areas, with calculation and
  booking tasks and four interactive models, plus two optional VAT
  refreshers. The bundled cell has 92 cards and replaces the earlier
  four-card cell; 2 of its 4 cards move.
- **Biologie 10 Realschule.**
  [academy.zam-os.org/biologie-realschule-10](https://academy.zam-os.org/biologie-realschule-10/)
  covers the grade-10 curriculum for all branches. The bundled cell has
  93 cards and replaces three earlier biology cells that sat in the wrong
  grade: genetics belongs to grade 10, the nervous system to grade 7 and
  evolution to grade 8. 11 of their 26 cards move. Refreshers on the nervous
  system and evolution carry no grade-10 curriculum binding.
- **Physik 10 Realschule.**
  [academy.zam-os.org/physik-realschule-10](https://academy.zam-os.org/physik-realschule-10/)
  covers mechanics, electricity, atomic and nuclear physics and energy supply
  for Zweig I and Zweig II/III. The bundled cell has 72 cards and replaces the
  two earlier Physik 10 cells, which covered two of the four learning areas;
  7 of their 16 cards move.
- **Algorithmen und Programmieren** and **Datennetze und Internet.**
  [academy.zam-os.org/algorithmen](https://academy.zam-os.org/algorithmen/)
  and [academy.zam-os.org/datennetze](https://academy.zam-os.org/datennetze/)
  teach LehrplanPLUS IT 2.6.1 and 2.5.1 in German and English. The two cells
  have 40 and 38 cards and together replace the earlier combined
  algorithms and networks cell; 5 of its 8 cards move.
- **Your history moves with you.** Every move follows an explicit mapping that
  was reviewed card by card and is kept next to each app in zam-os/zam-academy.
  An old card that was split or corrected leaves your reviews; its history
  stays in your library, and the new questions start fresh. ZAM never moves
  mastery on a guess.

## Curriculum

- **Realschule groups II, IIIa and IIIb stay apart.** A cell for group II
  alone, such as BwR 9, is no longer offered in IIIa or IIIb. A cell for
  II/III together still reaches all three. BwR 7 and 8 reach II and IIIa, as
  the Bavarian timetable teaches them there.
- **LehrplanPLUS BwR 9** is now a curriculum position for group II, with its
  five learning areas.
- **IT modules cover part of a year.** Algorithmen and Datennetze bind no
  grade, because the school chooses the year. They are offered at every
  Realschule IT position, and the generic import stays available next to
  them.

## Recall Studio and atlas

- **Delete what you have not taken.** Recall Studio and the atlas can delete
  tokens without a personal card, and whole areas at once. A preview shows
  the tokens, cards, reviews, steps and skills affected before you confirm.
  The bridge command `zam bridge personal-card-delete` also takes
  `--region`, `--group`, `--domain` and `--unit`.
- **A custom atlas lens shows its own name** in the lens bar, instead of a
  translation key.

## Worth knowing

- **No schema change.**
- **Bundled cells:** twelve academy cells now. Nine de-by cells leave the
  bundle in this release: one geography, one history, one BwR, three biology,
  two Physik 10 and one IT cell. The three de-by BwR 7 and 8 cells move to
  version 2026.10.1; libraries that hold them reinstall them.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells), ADR 2026-08-14
  Decisions 9–10 (explicit successors, cells before generic import).
