# ZAM 0.54.0: The ZAM Academy

Practise hands-on in a training app first, then keep it with ZAM. The first
app of the ZAM Academy teaches UML 2.5.1 at academy.zam-os.org. ZAM takes in
its cards with one click, and every card links back to the lesson where you
drew the element.

## The ZAM Academy

- **Learn hands-on, then keep it.** At
  [academy.zam-os.org/uml](https://academy.zam-os.org/uml/) you draw UML 2.5.1
  diagrams in six stages, from the use case diagram to the component
  diagram. ZAM bundles the matching cell, *UML 2.5.1 (ZAM Academy)*: 26 cards,
  one point each.
- **„Aus der ZAM Academy“ in the Studio and on Mobile.** The new entry lists
  the academy's cells, each with two buttons:
  - **„Üben ↗“** opens the app;
  - **„Aufnehmen“** takes in the cell with one click.

  Opening the list only reads the academy's catalog. Nothing in your library
  changes until you click.
- **Updates on request.** In Lern-Karten, a held academy cell offers „Auf
  Aktualisierung prüfen“, and then „Aktualisieren auf …“ when the academy has
  a newer version. ZAM never installs an older version over a newer one. A
  bundled cell can still be taken in without a connection.
- **Back to the lesson.** A card's web source is now a link: in the answer
  view, in the card editor and in the recall panel. One click opens it in
  your browser. The label shows the site and the path, and only `http` and
  `https` links open.
- **How new cards arrive.** New academy cards come through your daily
  queue, one card per stage a day. The atlas offers them for review once you
  have learned them.

## Recall feedback

- **No stray template text.** Some models occasionally leak text such as
  `]]` or a garbled role marker before their feedback. ZAM now removes it
  before the feedback is shown.

## For assistants and scripts

- **Agent tools.** `zam_bundled_cells_list` and `zam_bundled_cell_enrol` also
  cover the academy cells from the learner's last check, read from a local
  cache under `~/.zam/academy`. These tools never reach the network and never
  update a cell the learner already holds.
- **Bridge:** `academy-list`, `academy-enrol <cellId>` and
  `academy-update <cellId>`. These are the learner's own actions and are not
  on the MCP panel bridge.
- **KVT tiles:** atoms and practice items may carry a `source_link`. An item's
  link overrides its atom's.

## Worth knowing

- **No schema change.**
- **Only a learner's click reaches the academy.** The origin
  `https://academy.zam-os.org` is fixed, and redirects are refused. Every
  cell must match the SHA-256, id and version that the catalog lists.
- **Team libraries** get academy cells with ZAM releases, through
  `zam team reinstall-tiles`. The catalog serves personal libraries.
- **Reconcile no longer downgrades.** A tile that the academy installed at a
  newer version stays when an older ZAM build starts.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells).
