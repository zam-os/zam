# Learning Content: Cards and Sources — implementation plan

**Status:** Accepted, not started.\
**Decision:** [ADR 2026-10-10 — Learning Content: Cards and Sources](../adr/2026-10-10-learning-content-sources.md).
Its decisions are cited here as D1–D11. Read the ADR first; this plan does not
repeat its reasons.\
**Branch:** `feat/learning-content-sources`, cut from `main` when
implementation starts. One branch, one PR, one commit per phase.

This document is harness-agnostic. Any harness can pick up the next unchecked
phase without any other context.

## Goal

The Learning Content page has two areas (D1).

- **Lern-Karten** lists personal cards, published tokens the learner has not
  taken, and unpublished tokens (D2), and opens the existing Wissensnetz (D3).
- **Quellen** looks at one source (D4): a connected workspace, a folder that
  is not a workspace (D5), or the curriculum (D9). A repository source shows
  its knowledge-map views and its OKF articles, and opens the cited files in
  the Studio (D6). The page never writes a source (D7). The ZAM skill source
  is recognised (D8). On the Studio panel a Quelle is a workspace id, and
  only its OKF articles and map are read (D11).

Building new cards from a region the learner has looked at is out of scope
(D10).

## Status

- [ ] **Phase 1** — kernel: the three lists
- [ ] **Phase 2** — bridge commands and the Studio-panel allowlist
- [ ] **Phase 3** — Lern-Karten in the Studio, including the Wissensnetz entry
- [ ] **Phase 4** — Quellen shell: switcher, folder pick, empty states
- [ ] **Phase 5** — map views, OKF list, in-Studio reader, skill source
- [ ] **Phase 6** — curriculum as a Quelle
- [ ] **Phase 7** — documentation

**Order.** 1 → 2 → 3, then 4 → 5 → 6, then 7. Phase 7 waits until the
behavior it describes is on the branch. Do not start Phase 4 before Phase 3
has landed: the page should not gain an empty second area while the card
lists are still one mixed list.

## Out of scope

- Creating tokens or cards from a selected statement, article passage, or
  curriculum section (D10). A later ADR covers that.
- Adding the picked folder to the workspace registry, linking skills, or
  running workspace repair (D5, D7).
- Writing `docs/okf` or `docs/knowledge-map/map.json` from this page (D7).
- Drawing every workspace into one picture (D4).
- A 3D view of the knowledge map. The 3D surface is the existing token graph
  (D3).
- Mobile.
- Curriculum commands on the Studio panel. That is a change to ADR
  2026-10-08b, not to this plan (D11).
- Removing the Library Topics button. Nicht gewählt covers the untaken
  groups; the button stays until a later cleanup.

## Phase 1 — kernel: the three lists

New module `src/kernel/library/learning-content.ts`, re-exported from
`src/kernel/index.ts`. No schema change.

- `listPersonalCards` gains an optional `publishedOnly`. Unset, the query is
  unchanged. Set, it keeps `editorial_state = 'published'` and the existing
  card join, including detached cards (D2).
- `listUnchosenGroups(db, userId)` — published, not deprecated, no card row
  for `userId`. Group by the library-topic key (`source_link` without the
  fragment; the helper in `src/kernel/library/topics.ts`). Tokens with no
  source link share one group whose key is `""`. Return
  `{ key, name, domain, itemCount }`, ordered by name then key. Include
  tokens in maintenance; return nothing that would hide them.
- `listUnchosenMembers(db, userId, key)` — the tokens of one group, same
  publication and no-card rules. An unknown key returns an empty list.
- Unpublished stays `listTokens` for `draft` and `in_review`, which
  `list-drafts` already calls. Do not add a second draft query.

Tests in `tests/kernel/learning-content-lists.test.ts` on SQLite, plus a
PostgreSQL block that skips without `POSTGRES_URL`:

- a published token with a card is personal, including when the card is
  detached;
- a published token with no card is unchosen, and a second learner with a
  card does not see it there;
- a draft with a card is in neither personal (when `publishedOnly`) nor
  unchosen;
- grouping splits on the fragment and puts a missing `source_link` in the
  `""` group;
- a deprecated token is in none of the three.

## Phase 2 — bridge and allowlist

In `src/cli/commands/bridge.ts`:

- `personal-card-list` gains `--published-only`. Absent, the JSON is
  unchanged.
- `unchosen-groups` and `unchosen-members --key <key>`. JSON only. The user
  is the usual resolution. `--key ""` is the no-source group and must reach
  the handler; do not treat an empty option as missing.

`list-drafts` is unchanged.

Register the two new commands, and confirm `list-drafts` and
`personal-card-list`, in the reviewed `STUDIO_BRIDGE_COMMANDS` table in
`src/cli/commands/mcp.ts`, each with its `why` (ADR 2026-10-08b, D3).
They read only the library and the caller's cards. Taking a token from the
list (Phase 3) uses a command that writes only the caller's card; give it
its own entry and reason.

Tests: extend the bridge tests that already call `personal-card-list`.
Assert `--published-only` drops a draft, and that `unchosen-groups` returns
the `""` group. `tests/cli/studio-bridge-review.test.ts` lists every new
entry.

## Phase 3 — Lern-Karten in the Studio

`desktop/index.html`, `desktop/src/panel/studio-panel.html`, and
`desktop/src/learning-content.ts`. The panel and the Tauri window share that
module, so both markup copies gain the same controls.

- Two areas on the page (D1). The page opens on Lern-Karten. The existing
  header actions stay on that area.
- Three segments: Persönlich, Nicht gewählt, Unveröffentlicht. Persönlich
  calls `personal-card-list --published-only`. Nicht gewählt calls
  `unchosen-groups` and, on open, `unchosen-members`. Unveröffentlicht calls
  `list-drafts` and shows Entwurf / In Prüfung from `editorialState`.
- The existing search and category filter apply to the open segment.
- A row opens the existing editor. From Nicht gewählt, a group offers the
  existing start-topic action, and a single token offers the existing
  create-card action. No new write path.
- A button „Wissensnetz (3D)“ / „Knowledge Map (3D)“ opens `graph-view`.
  The dashboard button stays. `desktop/src/main.ts` remembers which view
  opened the graph; Back returns there (D3).
- i18n keys in all seven Studio locales (`en`, `de`, `es`, `fr`, `pt`,
  `zh`, `ja`). German: Lern-Karten, Persönlich, Nicht gewählt,
  Unveröffentlicht, Wissensnetz (3D).

## Phase 4 — Quellen shell

Still on the Learning Content page. No map is mounted in this phase.

- A **Quelle** switcher. Entries: every configured workspace, then Lehrplan
  (disabled until Phase 6, with its label already visible), then the picked
  folder when one exists.
- Default selection: the active workspace. Persist the selection in
  `~/.zam/config.json` under a new `learningContent` key
  (`{ kind: "workspace", id }`, `{ kind: "folder", path }`, or
  `{ kind: "curriculum" }`), through a getter/setter in
  `src/kernel/system/install-config.ts` and a bridge command
  `learning-content-source`. Do not write `knowledgeMap.repoPath`.
- The workspace entries come from a read of the registry. Do not call
  `workspace-repair`, and do not provision skills, on open or on change.
- „Ordner wählen …“ / „Choose folder…“ uses the existing folder dialog.
  The chosen path becomes the active Quelle and is not passed to
  `workspace add` (D5).
- Empty copy for a source that is not a curriculum: the path, and a line
  that its knowledge is loaded in the next phase. A missing directory names
  the path and leaves the switcher usable.

`learning-content-source` joins the reviewed panel table with
`refusedOptions: ["--path"]`: the panel may select a workspace by id, and
nothing else (D11). The panel's switcher lists the workspaces; a stored
folder or Lehrplan shows as the sentence that it opens in ZAM Desktop.
The Desktop window keeps the folder entry. Test that the panel bridge
refuses `--path` in both the `--path x` and `--path=x` forms.

## Phase 5 — map, OKF, reader, skill source

`desktop/src/knowledge-map/studio.ts` gains a way to mount into the Quellen
area for a given repository root, reusing `mountKnowledgeMap` and the view
selected in Settings. The module stays lazy: it loads when the learner opens
Quellen and the alpha switch is on.

- Alpha off (D6): do not load view code. Show the switcher, the OKF list,
  and one button that turns the existing knowledge-map switch on and then
  mounts the views. No view switcher on the page.
- Alpha on, map present: draw it. Alpha on, map missing or invalid, source
  is not the skill source: ZAM's map as an example, with the notice the map
  page already uses.
- OKF list from `docs/okf` of that root, using the existing bundle catalog
  loader in the CLI. A missing bundle is one sentence.
- Reader pane on the page. OKF articles render with the shared renderer in
  `desktop/src/panel/okf-render.ts`; the OKF reader panel itself is a
  separate MCP App and is not mounted here. Opening a citation does not
  call the OS opener.
- Two bridge forms (D11). The Desktop window reads by path: the catalog,
  an OKF article, and any other cited file inside the root as text,
  refused when it leaves the root. The panel reads by `--workspace <id>`
  only: the bridge resolves the root from the registry, returns the
  catalog, one article whose real path is a non-reserved `*.md` inside
  `docs/okf`, and the map from `knowledge-map` as validated map and issues.
  On the panel a path argument is refused, and a cited file that is not
  an OKF article is the sentence that it opens in ZAM Desktop.
- Panel table entries: the read command, `knowledge-map` with
  `refusedOptions: ["--repo"]` plus the workspace form, and
  `knowledge-map-feature` with `refusedOptions: ["--repo"]`. Each with its
  `why`.
- Skill source (D8): real path of the Quelle equals the real path of the
  package root that holds the ZAM skill (the root
  `src/cli/provisioning/index.ts` already resolves). The switcher adds the
  label „Skillquelle“ / „Skill source“. Skip the example-map fallback and
  show this root's map or its validation errors.
- Remove the top-nav button `nav-knowledge-map` and stop routing a nav
  click to `knowledge-map-view`. Settings keeps the alpha card and the view
  list (ADR 2026-10-03).
- The mount must not call repair, skill provisioning, OKF upsert, or
  knowledge-map write (D7).

Tests: a desktop test that the skill-source path skips the example fallback,
and that a citation outside the root is not opened. Through
`zam_studio_bridge`: a path argument is refused; an unknown workspace id
is refused; `.env`, `.git/config` and a symlink out of `docs/okf` are not
read for a configured workspace; an OKF article is. The i18n completeness
test covers the new keys.

## Phase 6 — curriculum as a Quelle

Enable the Lehrplan entry in the Desktop window. It hosts the existing
curriculum browser from `desktop/src/curriculum-wizard.ts`: the same steps,
the same import and enrol actions, the same labels (D9).

No `curriculum-*` command joins the Studio panel table (D11). On the panel,
Lehrplan is the sentence that it opens in ZAM Desktop.

Remove `btn-content-curriculum-wizard` from the Lern-Karten header in
`desktop/index.html` (the panel never had it) once the Quelle opens that
browser. Onboarding text that points at the header button points at
Quellen → Lehrplan instead.

No change to what import writes.

## Phase 7 — documentation

After the behavior is in:

- Update the OKF article that describes the Learning Content page, through
  `zam_okf_upsert`. Name the two areas, the three lists, and Quellen. Leave
  the decomposition rule of ADR 2026-07-18 in place.
- If a statement in `docs/knowledge-map/map.json` is no longer true, update
  it in the same change and run
  `npm run dev -- knowledge-map validate --repo . --write`.
- Set this ADR's status from the phases that landed, and update its row in
  `docs/adr/README.md`.

## Verification

Each phase, before its commit:

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

Phase 3 and Phase 5 also need the changed Studio flow exercised: the three
segments, opening the graph and coming back, switching Quelle, and opening
an OKF article in the reader. A missing map, a missing bundle, and the skill
source are the edge states for Phase 5.
