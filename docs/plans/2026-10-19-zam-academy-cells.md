# ZAM Academy cells — implementation plan

**Status:** ADR proposed 2026-10-19, reviewed by Grok, Gemini and MiMo on
PR #418; not started.\
**Decision:** [ADR 2026-10-19 — ZAM Academy: Cells from academy.zam-os.org,
One-Click Enrolment, Links Back to the Lesson](../adr/2026-10-19-zam-academy-cells.md).
Its decisions are cited here as D1–D6. Read the ADR first; this plan does not
repeat its reasons.\
**Branches:**
- Phase 1 is in `zam-os/zam-academy`, on its own PR, after PR #417 is
  merged.
- Phases 2–8 go onto one branch, `feat/zam-academy-cells`, cut from `main`
  after PR #418 (the ADR and this plan) is merged. They form one PR, with
  one commit per phase.

This document is harness-agnostic. Claude Code, Antigravity, Codex or a human
can pick up the next unchecked phase without any other context.

## Goal

- **One place for both halves.** An academy topic's app and cell live
  together in `zam-os/zam-academy`, and are published at
  `https://academy.zam-os.org/<app>/` with a `catalog.json`.
- **One click into ZAM.** In Studio, a learner opens „Aus der ZAM Academy“,
  sees each cell with its card count and version, and takes it with one
  click. A held cell is updated only when the learner chooses
  „Aktualisieren“.
- **One click back.** Any card whose source is a web page links back to it,
  for an academy card straight to its lesson.
- **Agents never fetch.** They see only what the learner already checked.

## Status

- [ ] **Phase 1** — zam-academy: `uml/cell.json`, `catalog.json`, CI that
  validates the cell
- [ ] **Phase 2** — ZAM: clickable web source links (D6)
- [ ] **Phase 3** — kernel: reconcile never downgrades (D4)
- [ ] **Phase 4** — CLI and kernel: catalog read, cache, enrol, update (D4)
- [ ] **Phase 5** — Studio: the Academy list and update on a held cell (D5)
- [ ] **Phase 6** — release flow: sync script, lock file, generic label
- [ ] **Phase 7** — Mobile: the Academy list (D5)
- [ ] **Phase 8** — documentation and handover

**Order.**
- Phase 1 needs #417 merged.
- Phases 2 and 3 are independent of everything else.
- Phase 4 needs Phase 3, and Phase 5 needs Phase 4.
- Phase 6 needs Phase 1 live.
- Phase 7 needs Phase 4.
- Phase 8 comes last.

## Ground rules for every phase

Repository conventions from `CLAUDE.md` / `AGENTS.md` that this feature
touches:

- **Kernel versus CLI.**
  - Catalog types, parsing, path checks and version comparison live in
    `src/kernel/`.
  - The kernel has no HTTP and no `node:crypto` on the Mobile path.
  - Fetching, hashing and the cache live in `src/cli/`.
- **Trust model** (ADR 2026-10-08b, `docs/okf/agent-trust-model.md`):
  - **Only a learner's action goes to the network.** No MCP tool and no
    `STUDIO_BRIDGE_COMMANDS` entry fetches the catalog. The MCP Apps panel's
    bridge relay can be driven by the model, so the academy commands stay
    off it.
  - The origin `https://academy.zam-os.org` is a constant; no argument,
    setting or stored value changes it.
  - No stored string reaches `innerHTML`.
- **Machine-local state** goes under `~/.zam`, never into the library
  database (which may be shared through Turso). Tests get a throw-away
  home from `tests/setup/machine-config-sandbox.ts`.
- **Modules Mobile imports** must not use Node built-ins.
- **Bridge.** `zam bridge` emits JSON only, errors included.
  `src/bridge/protocol.ts` changes are additive.
- **i18n.** New strings go into the `en` and `de` reference packs only
  (`desktop/src/i18n.ts`, `mobile/src/i18n.ts`).
- **No new dependencies.**
- **Privacy.** Tests use synthetic cells and fake transports, never the live
  site. Never name the field-test learner.
- **Commits** follow `<type>: <summary>`.
- **Verification** for each phase, before its commit:

  ```bash
  npm run typecheck
  ```

  ```bash
  npm run lint
  ```

  ```bash
  npm run test
  ```

  Surface phases add `npm run build`. A phase that renames, moves or deletes
  a file cited by the knowledge map also runs:

  ```bash
  npm run dev -- knowledge-map validate --repo . --write
  ```

## Shared vocabulary

- **Origin:** `https://academy.zam-os.org`, exported once as
  `ACADEMY_ORIGIN`.
- **Catalog:** `<origin>/catalog.json`, shaped like this:

  ```json
  {
    "schema": 1,
    "cells": [
      {
        "id": "zam-academy:uml",
        "title": "UML 2.5.1 (ZAM Academy)",
        "description": "…",
        "language": "de",
        "version": "2026.10.1",
        "items": 26,
        "app": "/uml/",
        "cell": "/uml/cell.json",
        "sha256": "<64 hex>"
      }
    ]
  }
  ```

  `app` and `cell` are paths, never URLs. A path must start with `/`, and
  must not contain `//`, `..`, `\`, `?` or `#`.
- **Cell:** a KVT tile, published byte for byte as `<app>/cell.json`.
- **Cache:** `~/.zam/academy/catalog.json` plus
  `~/.zam/academy/cells/<id with ":" as "_">@<version>.json`. It holds the
  learner's last check and the cells fetched with it.
- **Held cell:** a cell the learner is enrolled in.
- **Version:** a dotted number such as `2026.10.1`, compared part by part as
  integers.

## Phase 1 — zam-academy: `uml/cell.json`, `catalog.json`, CI

Repository `zam-os/zam-academy` (local checkout `/Users/thomas/src/zam-academy`).

1. Copy `tests/fixtures/curriculum/zam-academy-uml-kvt.json` from `zam-os/zam`
   `main` to `uml/cell.json` byte for byte. From now on, `uml/cell.json` is
   the source; ZAM gets copies (Phase 6).
2. `scripts/build-catalog.mjs` (root, plain Node):
   - for every `<app>/cell.json`, read the bytes and compute their SHA-256;
   - take `tile_id`, `title`, `description`, `version`, the language of the
     first item, and the item count;
   - write `site/catalog.json` in the shape above, sorted by id.
3. `.github/workflows/pages.yml`: copy each `<app>/cell.json` to
   `site/<app>/cell.json` and run `build-catalog.mjs` before the upload.
4. **Join test** in `uml/tests/uml-learning-app.test.ts`: every `source_link`
   in `../cell.json` (atoms and items) has the form
   `https://academy.zam-os.org/uml/#lesson=<id>`, and `<id>` is a lesson of
   `getAllLessons("de")`.
5. **Cell validation** — `scripts/validate-cells.mjs` and a `cells` job in
   `.github/workflows/ci.yml`:
   - install `zam-core` at a pinned exact version
     (`npm i --no-save zam-core@<x.y.z>`);
   - open a throw-away database with `openDatabase`;
   - run `installKvtTile` on every cell;
   - fail on any throw.
6. README: cells live here now. The "How an app and its ZAM cell fit
   together" section points to the ADR.

**Done when:** CI is green, and `https://academy.zam-os.org/catalog.json`
and `/uml/cell.json` are live. The catalog hash also matches
`shasum -a 256 uml/cell.json`.

## Phase 2 — ZAM: clickable web source links (D6)

1. **Shared helper** `desktop/src/source-link.ts`, with no Node built-ins, so
   Mobile can import it. It exports
   `webSourceLink(raw, t): { href, label, title } | null`.
   - It returns `null` unless `new URL(raw)` has protocol `http:` or
     `https:`.
   - `label` is the host plus the path:
     - The host is `URL.hostname`, which is already ASCII/punycode for an
       IDN host. Never decode it.
     - The path is decoded for display and shortened in the middle past 48
       characters.
     - The label ends in „↗“.
     - On `academy.zam-os.org` the label is `t("source_open_lesson")`
       („Lektion öffnen ↗“).
   - `title` is the full `href`.
2. **Desktop review.** In `desktop/src/main.ts`, the reveal row
   `addRevealRow("source", …)` (around line 7026) becomes a button-styled
   link when `webSourceLink` returns one. Clicking it calls `openUrl` from
   `@tauri-apps/plugin-opener`. Otherwise the row keeps today's code text.
3. **Card editor.** `desktop/src/learning-content.ts`, next to
   `fieldSourceLink`: an „öffnen ↗“ button, enabled while the field holds a
   web link. It opens through the existing `setLearningContentExternalOpener`.
4. **MCP recall panel.** `desktop/src/panel/recall.ts` renders the link
   after reveal when `app.getHostCapabilities()?.openLinks`, and opens it
   with `app.openLink({ url })`. Otherwise it shows the label as text.
5. **Mobile.** `mobile/src/main.ts`: `externalSourceUrl` and the
   `review-source` label (around lines 2128 and 3184) use `webSourceLink` for
   the label and title.
6. i18n: `source_open_lesson` and `source_open` in `en` and `de`.

**Tests:** `tests/desktop/source-link.test.ts`:
- `javascript:`, `file:`, `data:` and relative paths give `null`;
- an IDN host shows as `xn--…`;
- the academy label;
- a long path is shortened, and the title stays the full URL.

The existing Desktop and Mobile render tests are extended for the link.

## Phase 3 — kernel: reconcile never downgrades (D4)

1. `compareTileVersions(a, b): -1 | 0 | 1 | null` in
   `src/kernel/library/tile-version.ts`. It returns `null` when either value
   is not a dotted number.
2. `reconcileInstalledBundledTiles` (`src/kernel/library/bundled-cells.ts`,
   the filter around line 1783) reinstalls a tile when:
   - no version is recorded;
   - the last install failed;
   - `compareTileVersions(recorded, compiled)` is `-1`;
   - the comparison is `null` and the strings differ (today's behaviour).

   A recorded version ahead of the compiled one stays.
3. Export it from `src/kernel/index.ts`.

**Tests:**
- `tests/kernel/tile-version.test.ts`: `2026.10.10 > 2026.10.9`, equal, and
  non-numeric values.
- `tests/kernel/bundled-cells.test.ts`: a recorded `2099.1.1` survives
  reconcile; a recorded older version is reinstalled.

## Phase 4 — catalog read, cache, enrol, update (D4)

**Kernel** (`src/kernel/library/academy-catalog.ts`, pure, Mobile-safe):

- `ACADEMY_ORIGIN`, plus the catalog and entry types.
- `parseAcademyCatalog(json): AcademyCatalog`:
  - it validates `schema`, ids, dotted versions, 64-hex hashes, and the path
    rules from the vocabulary;
  - it resolves `app` and `cell` against `ACADEMY_ORIGIN`;
  - it throws on anything else.
- `enrolBundledCell(db, userId, cellId, options?)` gains
  `options.resolveTile?: (id) => BundledTile | undefined`. A compiled tile
  comes first, then the resolver. A resolved tile is installed with
  `installKvtTile`, then cards are materialised for its in-scope atoms,
  exactly as for a bundled cell. The "not found" error stays for an id
  neither knows.
- On PostgreSQL (a team library), installing a tile that is not compiled in
  refuses with: "A team library gets academy cells with ZAM releases."

**CLI** (`src/cli/academy/`):

- `catalog-client.ts`:
  - `fetchAcademyCatalog()` and `fetchAcademyCell(entry)` go through
    `safeFetch` with `maxRedirects: 0`, so any redirect fails.
  - Size caps: the catalog `maxBytes` is 256 KiB; a cell keeps the default
    2 MiB.
  - A cell's SHA-256 (`node:crypto`) must equal `entry.sha256`, and the
    parsed tile's `tile_id` and `version` must equal the entry.
- `cache.ts`: read and write the cache, and `resolveCachedTile(id)` for the
  newest cached version of an id.
- **Bridge commands** (`src/cli/commands/bridge.ts`, typed in
  `src/bridge/protocol.ts`). These are learner actions, called by Studio
  only:
  - `academy-list`: fetch the catalog, write the cache, and return each cell
    with `bundled`, `held`, `heldVersion`, `newer`, `items`, `version` and
    `appUrl`. On a network failure it returns the cache, or the bundled
    cells, with `offline: true`.
  - `academy-enrol <cellId>`: use the newest of the bundled tile and the
    cached or freshly fetched cell, then enrol.
  - `academy-update <cellId>`: for a held cell with a newer catalog version,
    fetch if needed, then `installKvtTile`. New items then reach the learner
    through the normal enrolment budget.

  None of these goes into `STUDIO_BRIDGE_COMMANDS`.
- **MCP** (`src/cli/commands/mcp.ts`):
  - `zam_bundled_cells_list` adds the cached cells;
  - `zam_bundled_cell_enrol` passes `resolveCachedTile` as `resolveTile`;
  - neither imports the catalog client.
- **Policy key.** `academy.catalog` is only documented (Phase 8), not read.

**Tests:**
- `tests/kernel/academy-catalog.test.ts`:
  - parse rules;
  - an absolute or `//host` path is refused;
  - `..` is refused.
- `tests/cli/academy-catalog-client.test.ts`, with a fake `transport`:
  - a redirect fails;
  - a hash mismatch fails;
  - a `tile_id` or version mismatch fails;
  - the cache is written only after the checks pass.
- `tests/cli/academy-bridge.test.ts`:
  - list, enrol and update;
  - offline falls back to the cache;
  - a team library refuses a catalog-only cell.
- `tests/cli/mcp-academy.test.ts`: both tools work from the cache with a
  transport that fails the test if called.

## Phase 5 — Studio: the Academy list (D5)

1. **Import menu.** `desktop/index.html` gets the entry
   `.import-menu-item` „Aus der ZAM Academy“ (id `btn-academy-open`);
   `desktop/src/content-import-menu.ts` needs no change.
2. **The list.** New `desktop/src/academy-list.ts`, a dialog fed by
   `academy-list`. Each row shows:
   - the title and one line of description;
   - „26 Karten · Version 2026.10.1“;
   - „Üben ↗“, which opens `appUrl` with `openUrl`;
   - „Aufnehmen“ (or „Aufgenommen“, disabled, when held), which calls
     `academy-enrol`. The button flips to „Aufgenommen“ at once and goes
     back on error.

   When the list is offline, a note says that only bundled cells are shown.
3. **Lern-Karten.** In `renderBundledCells` (`desktop/src/learning-content.ts`),
   a held `zam-academy` cell gets „Auf Aktualisierung prüfen“, which calls
   `academy-list`. When it reports `newer`, the row shows
   „Aktualisieren auf <version>“, which calls `academy-update`.
4. i18n in `en` and `de`.

**Tests:** `tests/desktop/academy-list.test.ts`, with a fake `runBridge`:
- the row text;
- the button flip and its rollback;
- offline mode;
- the update button only when `newer`.

## Phase 6 — release flow

1. `scripts/sync-academy-cells.mjs` (npm script `academy:sync`):
   - fetch the catalog with Node `https` and no redirects;
   - for each cell, download it, check its hash, and write the bytes
     unchanged to `tests/fixtures/curriculum/zam-academy-<app>-kvt.json`,
     where `<app>` is the last segment of `entry.app`;
   - write `tests/fixtures/curriculum/zam-academy-cells.lock.json`
     (`[{ id, version, sha256, file }]`);
   - run `scripts/update-bundled-cells-imports.mjs`.
2. **Generic label.** In `formatGradeLabel` (`bundled-cells.ts`), a binding
   without `school_type` and `grade` is not a school place, so the label is
   the tile's `publisher`. The `zam-academy:uml` entry in `PILOT_OVERRIDES`
   is then removed, and new academy cells need no override.
3. **Test** `tests/kernel/academy-cells-lock.test.ts`: for each lock entry,
   the fixture's SHA-256 and `version` equal the lock. It never compares
   with the live catalog.
4. **Release step:** the release PR runs `npm run academy:sync` and commits
   the result. Add it to the release checklist.

## Phase 7 — Mobile: the Academy list (D5)

- Mobile has no Node. It fetches the catalog and cells through its existing
  web fetch path, with the same rules: the origin constant, no redirects
  (`redirect: "error"`), size caps, and a SHA-256 through
  `crypto.subtle.digest`.
- It parses with `parseAcademyCatalog` and enrols with `enrolBundledCell`
  plus a resolver.
- UI: an entry next to Mobile's existing cell enrol action
  (`mobile/src/main.ts`, around line 4604), with the same row as Studio.

**Tests:** `tests/mobile/academy.test.ts` with a fake fetch:
- a redirect fails;
- a hash mismatch fails;
- enrol from a fetched cell succeeds.

## Phase 8 — documentation and handover

- **OKF articles**, written through `zam_okf_upsert` (or `upsertArticle` via
  tsx in a `.claude/` worktree):
  - `token-card-model.md`: academy cells, the catalog, reconcile without
    downgrade, and enrolment from the cache.
  - `agent-trust-model.md`: only learner actions fetch; agent tools read the
    cache; the origin is pinned; no redirects.
  - `bridge-protocol.md`: the three academy commands.
- **ADR 2026-10-08b**, D6 table: add the row `academy.catalog` |
  `denied`, `allowed` | academy catalog off | `denied`.
- **`CLAUDE.md` and `AGENTS.md`**, one convention line each:
  - academy cells are maintained in `zam-os/zam-academy`;
  - ZAM's copies come from `npm run academy:sync`;
  - only learner actions fetch `academy.zam-os.org`.
- **Knowledge map:** validate, and add a statement for
  `src/kernel/library/academy-catalog.ts`.
- **ADR status:** ADR 2026-10-19 → Implemented, with the PR number in its
  status history. Update the row in `docs/adr/README.md`.
- Delete this plan before the release that ships it, if no open tasks
  remain.
