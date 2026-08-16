# ZAM 0.34.0 — Curriculum on every device

The curriculum walk that used to exist only on Desktop now runs on Android and
iPadOS too. A learner picks state, school type, grade, subject and track on
whatever device they have, and ZAM answers the same way everywhere: where a
reviewed learning cell covers that position, the cell is the offer; only a
position no cell reaches falls back to a generic import.

## Curriculum navigator on Mobile

- **The same taxonomy as Desktop.** Region → school type → grade → subject →
  optional track → topic, from the shared provider registry. Providers without
  a track level skip that step instead of showing an empty screen.
- **Cell precedence at the surface** (ADR 2026-08-14 Decision 10). The
  completed position is resolved against bundled-cell curriculum scopes before
  any generic import is offered. Reviewed cells install and enrol with no model
  and no network.
- **Grounded fallback import.** Where no cell covers the position, the official
  source must pass the deterministic readiness check first; the native shell
  then performs a bounded HTTPS fetch (https only, capped size, checked content
  type) on both Android and iOS, and a connected cloud text model produces card
  drafts. Every draft keeps `source_link`, provider and stable topic id, and
  goes through the editable multi-draft confirmation before it becomes a card.

## No more 228-cell wall

- Desktop and Mobile now list **active learning paths** plus one guided
  "choose curriculum" action, instead of rendering the whole bundled catalog.
- Cell status is computed with a handful of bulk queries over atoms, practice
  items and cards, replacing two to three IPC round trips per cell — the
  difference between four pilot cells and 228.
- Bavarian Realschule track aliases (`I` / `wpfg1`, `II-III` / `wpfg2-3`) are
  normalized, so a manifest spelling and a published tile spelling resolve to
  the same position.

## Upgrades & compatibility

- Existing cards, review logs and FSRS schedules are unchanged. No cell ids
  moved and no `replaces` mapping was added.
- `bundled-cells-list` keeps its contract: unscoped it is the plain catalogue,
  scoped it returns the covering cells plus the `needsGenericImport` verdict.
  It now reads status only for the cells it returns.
- Mobile Rust: `reqwest` and `url` are built for iOS as well as Android, and
  `vision_request` is available on both.
