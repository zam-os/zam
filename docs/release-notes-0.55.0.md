# ZAM 0.55.0: Physik 9 from the ZAM Academy

The ZAM Academy has a second app: Physik 9 for the Realschule, with an
interactive lab for every lesson. Its cell becomes ZAM's only cell for
Realschule 9 physics and replaces the four earlier ones. When you take it, your
learning history moves with you. The UML cell gets clearer answers that its
answer options can be checked against.

## The ZAM Academy

- **Physik 9 Realschule.** [academy.zam-os.org/physik-realschule-9](https://academy.zam-os.org/physik-realschule-9/)
  teaches 21 lessons in four stages, following LehrplanPLUS Bayern for
  Zweig I and II/III:
  - Druck in Flüssigkeiten und Gasen;
  - Mechanik und Energie;
  - Wärmelehre;
  - Elektrizitätslehre.

  Each lesson has a lab with sliders and tasks. ZAM bundles the matching cell,
  *Physik 9 Realschule (ZAM Academy)*: 70 cards, each linking back to its
  lesson.
- **One cell for Realschule 9 physics.** The academy cell replaces the four
  previous Realschule 9 physics cells, so the same content is never learned
  twice. At that curriculum position, ZAM now offers only the academy cell.
- **Your history moves with you.** When you take the new cell, every card on
  the old cells that asks the same thing moves to its academy successor,
  together with its reviews. This follows an explicit, reviewed mapping, card
  by card.
- **Ten old cards have no successor**, because they are grade 7/8 material:
  charge and current, series and parallel circuits, Hooke's law and Newton's
  axioms. If you hold them, you keep them.
- **Clearer UML answers.** The UML cell (version 2026.10.2) states each
  reference answer as the bare answer; the explanation is kept for authors.
  - Every answer option now passes ZAM's own checks, so choice mode can show
    them.
  - Your schedule stays as it is, and no card becomes due.

## Worth knowing

- **No schema change.**
- **For cell authors:** the academy's cell check fails a cell whose curated
  answer options ZAM would refuse. It runs zam-core's own `checkCandidate` and
  `checkShownSet`.
- **Releases:** the macOS job now retries stapling the notarization ticket
  until Apple serves it, so the hand-installable macOS zip is uploaded even
  when the ticket arrives late.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells).
