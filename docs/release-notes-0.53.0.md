# ZAM 0.53.0 — Formulas in cards, and lenses of your own

Cards can now carry formulas, images and spoken text. Formulas are typeset
in the Studio, on Mobile and in the recall panel, and read aloud the way a
teacher would say them. The knowledge atlas grows too: a library can add its
own lenses beside the built-in ones, and land that no card reaches any more
goes back to the sea.

## Formulas, images and spoken text

- **Typeset formulas everywhere.** A card's question, answer and fast-check
  options may hold formulas and images beside text. Formulas render as
  checked MathML in the Studio, on Mobile and in the recall panel.
- **Read aloud.** Every formula carries how it is spoken, so voice mode says
  it as a teacher would, and screen readers hear it through MathML's
  `alttext`.
- **School tiles with formulas.** The bundled school tiles show formulas
  instead of raw LaTeX. The change is cosmetic, so nobody relearns a card.
- **Written as checked segments.** AI models and agents write formulas as
  checked segments with their speech. Anki decks bring their formulas along,
  and older Anki imports gain theirs on the next re-import.
- **A card editor.** In the Studio a learner fixes a card in their own words
  ("Let the AI fix it") or inserts a formula; curators find the LaTeX behind
  a disclosure.

## The knowledge atlas

- **Lenses of your own.** Beside the built-in lenses, a library adds its own
  orders over the same knowledge on its own planet, each with its own level
  names: for example one island per repository with its projects below, next
  to *Produkte*'s product landscape and *Unternehmen*'s organisation. A
  curator, or the learner on a personal library, makes one through an
  assistant (`zam_atlas_lens_edit`) or `zam bridge atlas-lens-create`. It
  fills like any curated lens and can be removed again without touching
  another lens.
- **Empty land goes back to the sea.** When the last card of a region is
  gone, the region's land goes with it, and an island without cards
  disappears. Nothing that holds a card moves.
- **Tidy your world map.** A curator can remove a world region the library
  made itself; the published map stays as it is.

## For assistants and scripts

- **`zam_atlas_lens_edit`** gains `create` and `remove` for custom lenses, and
  every atlas tool's `lens` accepts a custom lens's kind. `zam_show_atlas`
  refuses a lens the library does not have.
- **Bridge:** `atlas-lens-create` and `atlas-lens-remove`. Settle results
  count `landRemoved` and `islandsRemoved` beside the land they wrote.
- **Card text:** a writer passes question, answer and options as segments;
  text from a model or an agent is checked before it is stored.

## Worth knowing

- **Schema version 48** (migration M048): the first start after the update
  adds the card-text segment columns and the record of installed tiles.
  Update every device that shares a library. A team library's administrator
  runs `zam team provision`, then `zam team reinstall-tiles`; members see
  "update required" until the migration has run. Custom lenses need no
  migration.
- **Embeddings:** run `zam token reembed` after the tile migration. Every
  changed card text dropped its embedding, so semantic search misses those
  cards until then.
- **Mobile's content-security policy** now allows the app's own `blob:` and
  `data:` images, `blob:` audio and local fonts.
- Design notes: ADR 2026-10-14b (Card text beyond plain strings) and ADR
  2026-10-13 (Knowledge atlas, Decision 3 amended for custom lenses).
