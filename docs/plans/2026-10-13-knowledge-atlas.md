# Knowledge atlas — implementation plan

**Status:** Phases 1 to 3 done (2026-10-13). The ADR gained Decision 12 and the
round-2 changes after this plan was first merged; the phases below include
them.\
**Decision:** [ADR 2026-10-13 — Knowledge Atlas](../adr/2026-10-13-knowledge-atlas.md).
Its decisions are cited here as D1–D11. Read the ADR first; this plan does not
repeat its reasons.\
**Branch:** create `feat/knowledge-atlas` from `main` after PR #406 (the ADR
and this plan) is merged. All phases go onto that one branch and one PR, with
one commit per phase.\
**Prototype:** `desktop/spikes/knowledge-atlas/` on branch
`spike/knowledge-world` (PR #405). It is not merged and will not be merged as
is. Read it with `git show zam-os/spike/knowledge-world:<path>` and port what
fits; never import from the spike directory.

This document is harness-agnostic. Claude Code, Antigravity, Codex or a human
can pick up the next unchecked phase without any other context.

## Goal

The Studio gains an alpha view, the knowledge atlas: a zoomable hex map of
what the learner knows.

- Each hex is one learning unit: an atom, or a token without an atom (D1).
- Regions nest like the C4 model. Zooming walks the levels of the chosen
  lens: Weltwissen (Bereich › Fach › Gebiet › Thema) or Schule (Klasse › Fach
  › Lernbereich) (D3, D5).
- Hue says where; texture says how well, computed from the learner's FSRS-6
  cards (D4).
- Red threads show prerequisites. Later they show the other UML-style kinds
  (D7).
- Positions are stored and shared. Islands grow and drift, but places never
  jump (D8).
- Import can start at a place on the map (D9).
- Later phases add Sinnbilder (D6), the company or private planet with curated
  lenses (D2, D3), agent tools (D10), Mobile and an MCP Apps panel.

## Status

- [x] **Phase 1** — kernel condition function (D4) — `3a1ae497`
- [x] **Phase 2** — shared colour language; the learning graph adopts hue and
  condition (D4) — `fca68618`; see "As built"
- [x] **Phase 3** — atlas schema and the derived lenses Weltwissen and Schule
  (D1–D3) — this commit; see "As built"
- [ ] **Phase 4** — stored land: founding, reserved land, coast, drift (D8)
- [ ] **Phase 5** — bridge: alpha switch, read, settle, preferences, region
  review (D3, D10)
- [ ] **Phase 6** — Studio atlas view, read-only (D4, D5, D7 prerequisites,
  D10)
- [ ] **Phase 7** — import at a place, *Neue Inhalte zeigen*, taking content
  in, variants (D1, D9, D12)
- [ ] **Phase 8** — Sinnbilder (D6)
- [ ] **Phase 9** — own planet, team lenses, typed threads, agent tools (D2,
  D3, D7, D10)
- [ ] **Phase 10** — Mobile and the MCP Apps panel (D10)
- [ ] **Phase 11** — documentation and handover

**Mapping to the ADR's delivery phases.**

| ADR phase | Plan phases |
|---|---|
| 0, shared look | 1, 2 |
| 1, read-only atlas | 3, 4, 5, 6 |
| 1b, import at a place | 7 |
| 2, Sinnbilder | 8 |
| 3, company planet, team lenses, typed threads | 9 |
| 4, Mobile and MCP Apps panel | 10 |

**Order.**

- Phase 1 comes first and stands alone. Phase 2 needs Phase 1.
- Phases 3 → 4 → 5 → 6 run strictly in that order.
- Phase 7 needs Phase 6.
- Phase 8 can start after Phase 5 for its kernel and bridge part. Its Studio
  part needs Phase 6.
- Phase 9 needs Phases 6 and 8.
- Phase 10 comes last. Plan its details when Phases 1–9 have shipped.
- **Field-test milestone:** Phases 1–6. A pupil uses the Schule lens for a
  week (ADR, Verification). Phase 7 adds the question whether they turn on
  *Neue Inhalte zeigen*.

## Ground rules for every phase

Repository conventions from `CLAUDE.md` / `AGENTS.md` that this feature
touches:

- **Kernel versus CLI.**
  - Learning logic lives in `src/kernel/atlas/`: condition, lens derivation,
    land, threads, the emblem validator.
  - No HTTP, no LLM calls and no file reading in the kernel.
- **Pure modules for every surface.** The Studio and Mobile import pure kernel
  modules directly; `desktop/src/` already imports
  `src/kernel/analytics/learning-clock.js`. So `condition.ts`, `palette.ts`,
  `hex.ts` and `emblem.ts` must not import Node built-ins or the database.
- **No new dependencies** (AGENTS.md).
  - The map is Canvas 2D, as in the spike: no map, graph or SVG library.
  - The emblem validator brings its own small tokenizer: no XML or DOM
    package.
- **Schema changes** go into BOTH `src/kernel/db/schema.ts` AND an idempotent
  numbered migration in `runMigrations` (`src/kernel/db/provision.ts`).
  - Increment `CURRENT_SCHEMA_VERSION`; it is 39 today, and the next
    migration is M040. `tests/kernel/provision.test.ts` guards it.
  - Migrations must run on SQLite and PostgreSQL; check with
    `npm run pg:test`.
- **Data classes on a team library** (ADR 2026-07-04, Decisions 6–7;
  ADR 2026-09-04, Decision 7).
  - Every new table is either knowledge or learning state, never both.
  - A learning-state table gets its row-level-security policy and grants in
    `src/cli/deploy/rls-policies.ts`, the way `user_settings` has them.
    `tests/kernel/postgres-rls.test.ts` must cover it.
  - Knowledge tables are curator-written.
- **Untrusted agents and content** (ADR 2026-10-08b).
  - No tool, bridge command reachable from MCP, or setting writes the alpha
    switch.
  - A Studio command that MCP can reach needs its entry in
    `STUDIO_BRIDGE_COMMANDS` (`src/cli/commands/mcp.ts`). It must list the
    options it refuses. `tests/cli/studio-bridge-review.test.ts` fails
    otherwise.
  - No new tool goes on `PRE_APPROVED_TOOLS` (`src/cli/agent-approval.ts`)
    without the owner's yes in the PR. Only the read tool is a candidate.
  - MCP results that carry titles, notes, SVG text or glyphs mark them
    `untrusted: true` (D7 of 2026-10-08b).
- **Nothing the atlas does changes scheduling** (D1). Only reviews do, and
  every rating submit declares its `answer_format` (ADR 2026-09-27).
- **Positions are engine-written** (D8). Only settle and a curator's lens
  edit write land and island offsets. No tool or bridge command takes
  coordinates.
- **Kind and status stay apart** (D2).
  - **Kind** is the planet: who protects the knowledge. It is the planet of
    the lenses a unit is placed in, so an import takes the kind of the
    region it starts at.
  - **Status** is published or own. A unit is published when it came from
    published content: it has an atom, or a curriculum `provider`.
    Everything the library writes is own and is drawn with the "eigene
    Einheit" marker.
  - Only status decides publishing and sync. Nothing on a device publishes,
    and a world sync never overwrites or removes an own unit.
- **No figures about other people** (ADR 2026-07-04, Decision 11). Region
  statistics count the caller's own cards. There are no coverage percentages
  (ADR 2026-08-14, Decision 6).
- **Bridge.** `zam bridge` emits JSON only, errors included.
  `src/bridge/protocol.ts` changes are additive and optional.
- **Optional surfaces stay lazy.** New MCP code lives in the lazily imported
  `src/cli/commands/mcp.ts` graph; nothing enters the eager CLI bootstrap
  (ADR 2026-07-07).
- **IDs** are ULIDs (`ulid()`).
- **i18n.**
  - New strings go into the `en` and `de` reference packs only:
    `desktop/src/i18n.ts` and, in Phase 10, `mobile/src/i18n.ts`.
  - Do not machine-fill the other languages; the owner reviews those.
- **Knowledge map.** A phase that adds a module worth a statement, or that
  makes a statement untrue, updates `docs/knowledge-map/map.json` (keep
  existing ids). Check it with
  `npm run dev -- knowledge-map validate --repo . --write`.
- **Commits** follow `<type>: <summary>` (`feat`, `fix`, `test`, `docs`,
  `refactor`, `chore`).
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

  - Schema phases add `npm run pg:test`.
  - Surface phases add `npm run build` and a manual check in the Studio
    (`npm --prefix desktop run dev`).

## Shared vocabulary

| Name | Where | Value |
|---|---|---|
| `Condition` | `src/kernel/atlas/condition.ts` | `"known" \| "due" \| "overdue" \| "decaying" \| "forgotten" \| "unpractised"` |
| `PlanetKind` | `src/kernel/atlas/types.ts` | `"welt" \| "firma" \| "privat"` |
| `LensKind` | same | `"weltwissen" \| "schule" \| "unternehmen" \| "produkte" \| "leben"` |
| `ThreadKind` | same | `"voraussetzung" \| "nutzt" \| "schnittstelle" \| "ist-ein" \| "verbindung"` |
| `UnitKey` | same | `` `atom:${atomId}` `` when the token has `atom_id`, else `` `token:${tokenId}` `` (D1) |
| `Hex` | `src/kernel/atlas/hex.ts` | `{ q: number; r: number }`, axial, pointy-top |
| region key | `atlas_regions.key` | a slug that is stable and unique within its lens, such as `natur.physik.mechanik` |
| person keys | `user_settings` / `user_config` | `atlas.lens`, `atlas.home.<lensKind>`, `atlas.show_new` (unknown keys follow the person; see `settingScopeOf` in `src/kernel/models/settings.ts`) |
| library key | same | `atlas.own_planet` = `firma` \| `privat` (Phase 9; add it to `LIBRARY_KEYS`) |
| machine config | `~/.zam/config.json` | `atlas: { enabled?: boolean }`, next to `knowledgeMap` |

**What a unit is.** A token with `atom_id` belongs to the unit of that atom.
All practice items of one atom are one hex. A token without `atom_id` is its
own unit.

**Which units the read shows.**

- By default, the units the learner holds a card for, where `cards.detached_at`
  is NULL.
- With *Neue Inhalte zeigen* (Phase 7), also the installed units without a
  card.
- Units whose cards are all detached ("Not for me", ADR 2026-07-04,
  Decision 10) count as declined. They stay blank either way.

**Which units the land holds.** Land is placed for every unit in the library,
not only the caller's, so everyone on a library shares the same map (D8). The
read then filters by the caller.

---

## Phase 1 — Kernel condition function (D4)

**Files.**

- `src/kernel/scheduler/fsrs.ts`: export the current retrievability.
- `src/kernel/atlas/condition.ts` (new, pure).
- `src/kernel/atlas/index.ts` (new): re-export.
- `src/kernel/index.ts`: export the atlas module.
- `tests/kernel/atlas-condition.test.ts` (new).

**Steps.**

1. **Export retrievability** from `fsrs.ts`. The internal
   `retrievability(w, elapsedDays, stability)` stays. Add a public wrapper
   that takes the card's `stability` and `last_review_at`:

   ```ts
   /** FSRS-6 recall probability now, under these parameters. Null for a card never reviewed. */
   export function currentRetrievability(
     card: { stability: number; lastReviewAt: string | null },
     now: Date,
     params?: Partial<FSRSParameters>,
   ): number | null;
   ```

2. **Write `condition.ts`.**

   ```ts
   export type Condition =
     | "known" | "due" | "overdue" | "decaying" | "forgotten" | "unpractised";

   /** Fractions of the request retention. At 0.9 they give the spike's 0.85 / 0.75 / 0.65. */
   export const CONDITION_BAND_RATIOS = {
     due: 0.85 / 0.9,
     overdue: 0.75 / 0.9,
     decaying: 0.65 / 0.9,
   } as const;
   /** A due card with this many lapses is at least "decaying" ("keeps lapsing"). */
   export const DECAY_LAPSES = 3;

   export interface ConditionCard {
     state: CardState; // "new" | "learning" | "review" | "relearning"
     stability: number;
     dueAt: string;
     lastReviewAt: string | null;
     lapses: number;
   }

   export function cardCondition(card: ConditionCard, now: Date, requestRetention?: number): Condition;
   /** Weakest condition among the unit's cards; null when it has none. */
   export function unitCondition(cards: readonly ConditionCard[], now: Date, requestRetention?: number): Condition | null;
   ```

**Rules.**

- **`cardCondition`:**
  1. `state === "new"`, or no `lastReviewAt` → `unpractised`.
  2. `learning` or `relearning` → `due` (short steps count as due), unless
     rule 5 applies.
  3. `review` and `dueAt > now` → `known`.
  4. Due: let R = `currentRetrievability` and RR = the request retention
     (default 0.9). R ≥ `due`·RR → `due`; ≥ `overdue`·RR → `overdue`;
     ≥ `decaying`·RR → `decaying`; otherwise `forgotten`.
  5. A due card with `lapses >= DECAY_LAPSES` is at least `decaying`.
- **`unitCondition`:**
  - Severity order: `known` < `due` < `overdue` < `decaying` < `forgotten`.
  - `unpractised` cards are ignored unless every card is unpractised, in
    which case the result is `unpractised`. A new sibling item must not make
    a known unit look never practised.
  - An empty list → `null`.
- Blocking, burying and maintenance do not change the condition. They are
  queue matters.

**Tests.**

- Boundaries at RR 0.9, just above and below each band, against the spike's
  values.
- The same boundaries scaled at RR 0.8.
- `learning` and `relearning` → `due`; `new` → `unpractised`.
- A due card with 3 lapses and high R → `decaying`. A not-due card with
  3 lapses → `known`.
- `unitCondition`: weakest wins; all new → `unpractised`; new plus known →
  `known`; empty → `null`.
- **Coherence with the scheduler.** Schedule a card with `createFSRS()`, then
  evaluate `currentRetrievability` at its `due_at`. It is within 0.02 of RR,
  because intervals are whole days.

**Done when** the tests pass and `cardCondition`, `unitCondition` and the
constants are exported from `src/kernel/index.ts`.

---

## Phase 2 — Shared colour language (D4)

**Files.**

- `src/kernel/atlas/palette.ts` (new, pure data):
  - `SUBJECT_HUES: Record<string, number>`, ported from the spike's
    `src/taxonomy.ts` (`hue` per Fach).
  - `hueFor(key: string): number`: a stable hash into the free hue range for
    unknown keys.
  - `CONDITION_STYLE: Record<Condition, { saturation: number; lightness: number; texture: "none" | "dust" | "dark" | "cracks" | "fog" | "parchment" }>`.
- `desktop/src/styles.css`: condition tokens such as `--condition-due-dust`
  for light and dark mode, next to the existing `--color-*` tokens.
- The learning graph:
  - the 3D graph in `desktop/src/main.ts` (section `3D KNOWLEDGE GRAPH`);
  - the 2D panel `desktop/src/panel/graph.ts`, with layout in
    `graph-layout.ts`.
- Bridge `get-neighborhood` in `src/cli/commands/bridge.ts`, and the MCP graph
  tool's data path if it builds nodes separately.

**Steps.**

1. Each graph node gains `condition`, from `unitCondition` over the caller's
   cards of that token, and `hueKey`.
   - `hueKey` is the first domain segment until Phase 3.
   - Phase 3 switches it to the Fach region the Weltwissen aliases give.
2. **3D graph.** The node colour comes from `hueFor(hueKey)`, and the
   material from `CONDITION_STYLE`: dust as lower saturation, dark as lower
   lightness, fog as transparency.
3. **2D panel.** The fill comes from the hue. The condition becomes a ring or
   texture, never colour alone: add a small text label in the node tooltip.
4. **Repo knowledge map.** It has no cards, so it takes the hue only (ADR
   2026-10-03). This is optional in this phase; skip it if its views do not
   group by subject.

**Tests.**

- `palette.ts`: every subject in the Weltwissen seed (Phase 3) has a hue, and
  `hueFor` is stable.
- The bridge test for `get-neighborhood` asserts the new fields.

**Done when** both graph views show subject hue and condition in light and
dark mode, and the condition reads as text in tooltips.

**As built.**

- `palette.ts` computes the colours (`conditionFill`, `CONDITION_TEXTURE`,
  `hueKeyForDomain`). That serves canvas, Three.js and SVG alike, so no CSS
  condition tokens were needed.
- The kernel's `getTokenNeighborhood` computes `condition` and `hue_key` per
  node. The bridge passes them on as `condition` and `hueKey`, along with
  `card.lapses`.
- **3D graph.** Every node is now coloured by subject hue and condition;
  before, only the centre was. The role stays in the shape and the edge
  colour, a blocked card stays red, and forgotten nodes are half
  see-through. The side panel names the condition in words, and the
  neighbour pills carry the colour on their edge.
- **2D panel.**
  - The fill is a hue tint and the border the condition colour. The
    condition's texture becomes a stroke pattern: dotted for dust, broken
    for cracks, dashed for parchment.
  - The node style lives in `graphNodeStyle` (`graph-layout.ts`, tested).
  - The Bloom colour scale gave way to the subject hue. The Bloom level now
    sits in the tooltip, next to the condition in words.
- The repo knowledge map is unchanged: its views do not group by subject.

---

## Phase 3 — Atlas schema and derived lenses (D1–D3)

**Migration M040** (schema.ts and provision.ts). All tables are knowledge.

```sql
CREATE TABLE IF NOT EXISTS atlas_lenses (
  id            TEXT PRIMARY KEY,
  planet        TEXT NOT NULL CHECK (planet IN ('welt', 'firma', 'privat')),
  kind          TEXT NOT NULL,          -- LensKind
  name          TEXT NOT NULL,
  level_names   TEXT NOT NULL,          -- JSON array, top level first
  colour_level  INTEGER NOT NULL,       -- 0-based index into level_names
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE (planet, kind)
);
CREATE TABLE IF NOT EXISTS atlas_regions (
  id            TEXT PRIMARY KEY,
  lens_id       TEXT NOT NULL REFERENCES atlas_lenses(id) ON DELETE CASCADE,
  parent_id     TEXT REFERENCES atlas_regions(id) ON DELETE CASCADE,
  level         INTEGER NOT NULL,
  key           TEXT NOT NULL,          -- stable slug; drives the hue on the colour level
  name          TEXT NOT NULL,
  rank          INTEGER NOT NULL DEFAULT 0,
  pattern       TEXT,
  ontology_ref  TEXT,
  UNIQUE (lens_id, key)
);
CREATE TABLE IF NOT EXISTS atlas_domain_aliases (
  lens_id       TEXT NOT NULL REFERENCES atlas_lenses(id) ON DELETE CASCADE,
  domain_prefix TEXT NOT NULL,          -- e.g. "mathematik/geometrie"
  region_id     TEXT NOT NULL REFERENCES atlas_regions(id) ON DELETE CASCADE,
  PRIMARY KEY (lens_id, domain_prefix)
);
CREATE TABLE IF NOT EXISTS atlas_members (
  lens_id       TEXT NOT NULL REFERENCES atlas_lenses(id) ON DELETE CASCADE,
  unit_key      TEXT NOT NULL,
  region_id     TEXT NOT NULL REFERENCES atlas_regions(id) ON DELETE CASCADE,
  placed_by     TEXT NOT NULL,          -- 'agent' | 'curator' | 'learner' | 'import'
  PRIMARY KEY (lens_id, unit_key)
);
```

- Timestamps follow the kernel's dialect helpers (ADR 2026-09-04,
  Decision 5). Copy how a recent migration writes them; do not use
  `datetime('now')` defaults in new Postgres paths.
- **Two tables for the ADR's `atlas_positions`.** Phase 4 adds them, so this
  migration stays small.

**Files.**

- `src/kernel/atlas/types.ts`: the vocabulary above.
- `src/kernel/atlas/weltwissen-seed.ts` (pure data): Bereiche › Fächer ›
  Gebiete with `key`, `name` and `from` (raw area slugs). Port it from the
  spike's `src/taxonomy.ts`, including the `informatik/softwaretechnik` area.
  In the product this seed stands in for regions published with the content
  (D3) until the central service ships them.
- `src/kernel/atlas/lenses.ts`:

  ```ts
  /** Idempotent: creates the welt lenses, seed regions and aliases that are missing. Never renames or moves existing rows. */
  export async function ensureWorldLenses(db: Database): Promise<void>;
  export interface DerivedPlacement { unitKey: UnitKey; path: { key: string; name: string; level: number }[]; source: "member" | "alias" | "binding" | "unsorted"; }
  /** Pure over loaded rows: where each unit sits in this lens. Explicit atlas_members rows win. */
  export function deriveWeltwissen(units: UnitRow[], aliases: AliasRow[], bindings: BindingRow[], members: MemberRow[]): DerivedPlacement[];
  export function deriveSchule(units: UnitRow[], bindings: BindingRow[], members: MemberRow[]): DerivedPlacement[];
  export async function loadUnits(db: Database): Promise<UnitRow[]>; // every unit in the library: key, title, domain, atom_id, token ids, provider/topic_id
  ```

**Derivation rules.**

- **Weltwissen.**
  1. An `atlas_members` row wins.
  2. Otherwise the longest `domain_prefix` alias gives the Gebiet. The port of
     the spike's `placeForDomain` defines what a raw domain looks like.
  3. The Thema below the Gebiet is the atom's binding `topic_title`, if any.
     Otherwise it is the next domain segment, turned into a readable name.
  4. A unit no alias covers goes to the island `unsortiert` ("Noch nicht
     eingeordnet").
- **Schule.**
  - Klasse is `<school_type>-<grade>`, with the name "9. Klasse"; Fach is the
    binding subject; Lernbereich is `topic_title`, else `topic_code`.
  - A unit bound to several grades sits on the earliest grade (D3).
  - A token without an atom uses the legacy `provider`/`topic_id` projection
    if it resolves to a grade. Check how `src/kernel/models/token.ts` fills
    `provider = "lehrplanplus-bayern"`.
  - Everything else goes to the island `ausserhalb` ("Außerhalb des
    Lehrplans").
- **Region names and keys** for derived regions are deterministic functions
  of the path. A read can therefore name regions that do not exist yet; it
  marks them `provisional`, and Phase 5's settle writes them.
- **Status.** `UnitRow` carries `own: boolean`: true when the unit has no
  atom and no curriculum `provider`.
  - Own units are placed by the same rules, so a pupil's own chemistry cards
    land under Chemie as own world knowledge, with the marker.
  - Until Phase 9 only the welt lenses exist, so an own unit no rule covers
    lands on `unsortiert`.
- **Tile install is still a spike.** `src/kernel/library/kvt-attach.ts`
  carries a header saying not to build learner features on it. The atlas only
  *reads* atoms and bindings, which is acceptable. Do not write through it.

**Tests** (`tests/kernel/atlas-lenses.test.ts`).

- `ensureWorldLenses` is idempotent and keeps ids on a second run.
- Weltwissen places tokens from several bundled cells into the expected
  Fach and Gebiet.
- An unknown domain lands on `unsortiert`.
- Two units with the same title stay two units (D1).
- An explicit member row wins over the alias.
- In Schule, a unit bound to grades 7 and 9 sits on the grade-7 island.
- An unbound unit lands on `ausserhalb`.

**Done when** the tests pass on SQLite, `npm run pg:test` passes, and the
schema version is 40.

**As built.**

- **Schema.** `ATLAS_TABLES` in `schema.ts` is shared by `SCHEMA_TABLES` and
  M040, so the two cannot drift. `placed_by` has a CHECK.
- **Every place that lists tables** now names the four atlas tables:
  - `KNOWLEDGE_TABLES` in `src/cli/deploy/team-provision.ts`, so curators
    write and members read;
  - `SNAPSHOT_TABLES` in `src/kernel/db/snapshot.ts`, so backup and restore
    keep placements. Regions export ordered by level, parents first.
- **Status.** `own` is simply "no atom": published content always arrives as
  atoms.
  - Tokens from the older generic curriculum importer carry a `provider` but
    were written by the learner's own model, so they count as own.
  - The Schule lens still places them, reading school type, grade and
    subject from their LehrplanPLUS link
    (`/fachlehrplan/realschule/9/mathematik`).
- **Weltwissen paths.**
  - A bare subject domain ("chemie") reads as its `allgemein` area, as in
    the spike.
  - An unknown area under a known subject becomes a new Gebiet under that
    Fach.
  - The unsorted island is grouped by raw domain, so it keeps structure.
- **Schule naming.** Grades are named by school type only when the library
  holds more than one. A binding without a grade lands on
  `<school type>-ohne-klasse`.
- **Coverage.** All 654 atoms of the 228 bundled tiles land in a seed Gebiet
  (none on a new or unsorted one), across 404 Themen.
- **Tests.** `tests/kernel/atlas-lenses.test.ts` covers SQLite;
  `tests/kernel/postgres-atlas.test.ts` is added to `npm run pg:test`, and CI
  runs it through `POSTGRES_URL`.

---

## Phase 4 — Stored land (D8)

**Migration M041.** Both tables are knowledge.

```sql
CREATE TABLE IF NOT EXISTS atlas_islands (
  lens_id    TEXT NOT NULL REFERENCES atlas_lenses(id) ON DELETE CASCADE,
  region_id  TEXT NOT NULL REFERENCES atlas_regions(id) ON DELETE CASCADE, -- a top-level region
  dq         INTEGER NOT NULL,          -- island offset on the sea, axial
  dr         INTEGER NOT NULL,
  founded_dq INTEGER NOT NULL,          -- offset at founding: total drift = distance to (dq, dr)
  founded_dr INTEGER NOT NULL,
  PRIMARY KEY (lens_id, region_id)
);
CREATE TABLE IF NOT EXISTS atlas_land (
  lens_id    TEXT NOT NULL REFERENCES atlas_lenses(id) ON DELETE CASCADE,
  island_id  TEXT NOT NULL REFERENCES atlas_regions(id) ON DELETE CASCADE,
  q          INTEGER NOT NULL,          -- island-local axial
  r          INTEGER NOT NULL,
  region_id  TEXT NOT NULL REFERENCES atlas_regions(id) ON DELETE CASCADE, -- the leaf region owning this hex
  unit_key   TEXT,                      -- NULL = reserved land
  PRIMARY KEY (lens_id, island_id, q, r)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_atlas_land_unit
  ON atlas_land (lens_id, unit_key) WHERE unit_key IS NOT NULL;
```

**Files.**

- `src/kernel/atlas/hex.ts` (pure): axial helpers (`neighbours`, `distance`,
  `ring`, `toPixel`, `fromPixel`), plus the Gosper curve generator.
  - Port the spike's `gosper()` from `src/layout.ts`. Use the L-system with
    axiom `FX`, `X → X+YF++YF-FX--FXFX-YF+`,
    `Y → -FX+YFYF++YF+FX--FX-Y` and 60° turns.
  - Do **not** use the AB variant: it revisits hexes from order 3 on.
  - The test asserts 2402 unique hexes at the order the spike used.
- `src/kernel/atlas/land.ts` (pure): placement over in-memory land.
- `src/kernel/atlas/settle.ts`: loads, plans and writes in one transaction.

**Placement rules.**

- **Founding an island.**
  1. Lay out the island's regions in reading order (rank, then key) along a
     Gosper curve of the smallest order that holds all its units plus
     reserve.
  2. Each leaf region reserves `max(2, ceil(n / 6))` hexes after its units.
  3. Centre the island once, at founding.
- **Never recompute an existing island's curve,** never recentre it, and
  never move a hex that holds a unit.
- **A new unit in an existing region** takes, in this order:
  1. the region's free reserved hex with the lowest curve index;
  2. otherwise the nearest free coast hex adjacent to the region's land, which
     becomes new land of that region.

  Break ties by distance to the region's centroid, then `q`, then `r`.
  Prefer coast hexes that do not shrink the gap to a neighbouring island
  below `ISLAND_GAP` (4, from the spike).
- **A new leaf region in an existing island** takes coast next to its parent
  region's land, else next to the island.
- **A new island** is placed in reading order of the top-level rank, on the
  first free spot of the rings around the existing constellation. It must
  keep every existing island in its octant as seen from the constellation
  centre (D8).
- **Drift is only the fallback,** when growth cannot avoid a neighbour.
  - The neighbour moves outward along its existing bearing, from the
    constellation centre to its own centre.
  - It moves by the smallest amount that restores `ISLAND_GAP`, capped at
    `MAX_DRIFT_PER_SETTLE` (3 hexes).
  - If the cap is not enough, the growing region takes coast on another side
    instead.
- **Named constants.** `ISLAND_GAP` (4) and `MAX_DRIFT_PER_SETTLE` (3) are
  exported from `land.ts` and tested like the condition bands. The read
  reports each island's total drift, the hex distance from its founding
  offset, so curators can see it.
- **Settle is deterministic.** The same rows in give the same land out.
  `planSettle` returns the writes without touching the database. The read
  uses it to show provisional land; `applySettle` writes it.
- **No relayout.** With coast growth a region never runs out of land, so this
  plan builds no relayout. If one is ever needed, it becomes an explicit
  curator command with a notice to the library (D8).

**Tests** (`tests/kernel/atlas-land.test.ts`).

- Founding is deterministic.
- **Adding a unit moves no other unit** in its island (the ADR's
  Verification line). Check this over 50 random additions.
- A new region gets contiguous land.
- A new island keeps every other island's octant.
- Drift keeps the bearing and respects the cap.
- `planSettle` followed by `applySettle` equals a fresh `planSettle` with no
  writes.
- The Gosper generator yields unique hexes.

---

## Phase 5 — Bridge: switch, read, settle, preferences, region review (D3, D10)

**Files.**

- `src/kernel/system/install-config.ts`: `MachineAtlasConfig { enabled?: boolean }`
  plus `getAtlasConfig`/`setAtlasConfig`. Mirror `getKnowledgeMapConfig` /
  `setKnowledgeMapConfig`.
- `src/kernel/atlas/read.ts`:
  `readAtlas(db, { userId, planet, lensKind, now, showNew }) → AtlasView`.
- `src/kernel/scheduler/queue.ts`: add `tokenIds?: readonly string[]` to
  `ReviewQueueOptions`, filtering both the due and the new query.
- `src/cli/commands/bridge.ts` (or `src/cli/bridge-handlers.ts`, wherever
  similar commands live): the commands below.

**Bridge commands.**

| Command | Does | Writes |
|---|---|---|
| `atlas-feature [--enable\|--disable]` | reads or sets the machine-local alpha switch | `~/.zam/config.json` only |
| `atlas-read --lens <kind> [--planet welt] [--user <id>]` | returns `AtlasView` (below) | nothing |
| `atlas-settle --lens <kind>` | applies `planSettle`; refuses with `{ error: "not-curator" }` where the connection may not write knowledge | atlas knowledge tables |
| `atlas-prefs [--lens <kind>] [--home <regionKey>] [--show-new on\|off]` | reads or sets the person keys | `user_settings` / `user_config` |
| `get-reviews … --atlas-lens <kind> --atlas-region <regionKey>` | the due queue of that region's subtree (`tokenIds`, `maxNew` 0) | nothing |

- **No tool may write the atlas switch** (D10). This is stricter than the
  knowledge map: `knowledge-map-feature` sits in `STUDIO_BRIDGE_COMMANDS` and
  refuses only `--repo`, so a model can switch the knowledge map on.
  - Leave `atlas-feature` out of `STUDIO_BRIDGE_COMMANDS`.
  - If a panel later needs to read the switch, add it there with
    `refusedOptions: ["--enable", "--disable"]`.
  - The Studio's own Settings call it through the desktop bridge transport,
    which is not MCP.
- `atlas-read` and `atlas-prefs` may enter `STUDIO_BRIDGE_COMMANDS` later
  (Phase 10). Leave them out for now.
- Whether the connection may write knowledge: on a personal library always;
  on a team library only a curator. Look up how existing curator-only writes
  check the role before writing; do not invent a second check.

**`AtlasView` shape** (extend `src/bridge/protocol.ts` additively):

```ts
interface AtlasView {
  lens: { kind: LensKind; planet: PlanetKind; levels: string[]; colourLevel: number };
  regions: { key: string; name: string; level: number; parentKey: string | null; rank: number; hueKey: string; pattern: string | null; provisional: boolean }[];
  islands: { key: string; dq: number; dr: number; drift: number; provisional: boolean }[];
  land: { island: string; q: number; r: number; region: string; unit: UnitKey | null }[];
  units: { key: UnitKey; title: string; region: string; condition: Condition | null; due: number; cards: number; declined: boolean; own: boolean }[];
  threads: { from: UnitKey; to: UnitKey; kind: "voraussetzung" }[]; // from builds on to
  own: { dueByRegion: Record<string, number> }; // the caller's own counts only
  settle: { pending: number; mayWrite: boolean };
  home: string | null; // resolved home region key, after the fallback below
}
```

- **The home region and its fallback.** `atlas.home.<lensKind>` stores the
  home as its key path, root first, as a JSON array. A curated region's key
  says nothing about its ancestors, so the path is kept. On read, the
  deepest key on that path that still exists is the home. If none exists,
  the home is the whole lens (`null`).

- `units` lists only the units the caller sees (see "Which units the read
  shows").
- `land` covers the whole library, so the coast is the same for everyone.
  Land holding a unit the caller does not see is sent with `unit: null` and
  drawn blank.
- `threads` come from `atom_prerequisites`, and from `prerequisites` for
  tokens without atoms. Send only threads whose two ends are visible units.

**Tests.**

- **Bridge JSON contract.** Errors are JSON too; `atlas-read` writes nothing
  (compare the row counts before and after).
- A non-curator on a team library gets `not-curator` from `atlas-settle`. Use
  the Postgres test harness.
- `get-reviews --atlas-region` returns only cards in that subtree and no new
  cards.
- No MCP tool can set the switch. Assert that `atlas-feature` is absent from
  `STUDIO_BRIDGE_COMMANDS`, or present only with `--enable` and `--disable`
  refused.

---

## Phase 6 — Studio atlas view, read-only (D4, D5, D7, D10)

**Files.**

- `desktop/src/atlas/view.ts`: mount and unmount, data loading through the
  existing bridge transport, panels.
- `desktop/src/atlas/render.ts`: the Canvas 2D renderer, ported from the
  spike's `render.ts`:
  - semantic zoom via region screen radius (`focusLevel`, `UNIT_PX` 40);
  - screen-space patterns; condition textures; fog clouds;
  - thread bundling per level; portals come later.
  - Leave the Sinnbild discs empty until Phase 8.
- `desktop/src/atlas/outline.ts`: the outline view, a nested list per lens.
  - Each entry shows its name, the caller's own counts and its condition as
    words ("fällig", "lange überfällig", "wohl vergessen"), never only as a
    texture.
  - It is fully keyboard-operable and works with a screen reader.
- `desktop/src/main.ts`:
  - `AppView` gains `"atlas-view"`.
  - Add a nav entry, visible only while `atlas-feature` reports `enabled`.
  - Add a Settings section "Wissensatlas (Alpha)" with the switch, next to the
    knowledge-map alpha.
- `desktop/src/i18n.ts`: `en` and `de` strings.

**Behaviour** (D3, D5).

- **Opening.**
  - The map opens on the home region of the primary lens (`atlas-prefs`),
    with the neighbouring islands in view.
  - Without a home it opens on the whole lens. Port `fitHome` from the spike.
  - When `settle.pending > 0` and `settle.mayWrite`, call `atlas-settle` once,
    then re-read.
- **Navigation.**
  - A click selects on the level in view. A double click zooms in.
  - Esc goes up one level. The breadcrumb jumps.
  - `/` opens search; a result shows its region path for repeated titles.
  - `0` goes home, and `L` switches the lens; the selected unit stays
    selected (D3).
  - `F` cycles threads: all, selection only, off.
- **Region panel.**
  - It shows the name, the caller's own "n fällig" and the children.
  - *Wiederholen* opens the study view with `--atlas-region`.
  - *Als Heimat* sets the home region.
- **Unit panel.**
  - It shows the title, the breadcrumb, and the condition in words.
  - It lists prerequisites in both directions, labelled "baut auf" and
    "Grundlage für".
- **Textures and colour.**
  - Use Phase 2's palette and condition tokens.
  - Below the colour level, regions get a shade plus a pattern.
  - Blank land (`unit: null`, or a declined unit) gets no texture and no
    name.
  - An own unit in a world lens carries the "eigene Einheit" marker: a small
    corner mark on the hex, and the words in the unit panel.
  - Islands show their total drift to curators in the region panel.
- **Dark mode** uses the existing theme tokens. Sinnbild discs stay light in
  both modes (spike lesson).
- **Live refresh.** After a review session, re-read when the view becomes
  visible again.

**Manual check.** Start the Studio dev build with all bundled Realschule cells
enrolled, then check each of these:

- With the switch off, there is no nav entry.
- With it on, the map opens home, and every zoom level reads.
- Switching lens keeps the selection.
- A region review recolours the region after rating.
- Dark mode works.
- The outline view works by keyboard alone.
- Panning and zooming stay smooth with all cells enrolled.

---

## Phase 7 — Import at a place, *Neue Inhalte zeigen*, taking content in (D1, D9)

**Import at a place.** The region panel gains *Hier importieren …*.

- **Aus dem Lehrplan.**
  1. Build the region's curriculum scope.
     - On a Schule region it is exact: school type, grade and subject.
     - On a Weltwissen region, list the bundled cells whose atoms' domains
       alias into the region.
  2. Cells go first: use `findBundledCellsForScope` and `enrolBundledCell`
     (`src/kernel/library/bundled-cells.ts`).
  3. Offer the generic curriculum wizard only where
     `needsGenericCurriculumImport(scope)` is true (ADR 2026-08-14,
     Decision 10).
- **Mitschrift oder Material.** Open the existing material import (ADR
  2026-10-05) with a place.
  - The proposal set gains an optional
    `place?: { lens: LensKind; regionKey: string }`.
    - It goes on `MaterialProposalSet` in
      `src/kernel/import/material-import.ts`. Since it is optional, the
      contract version stays 1.
    - It travels through the staging store and the MCP context tool, so the
      harness path keeps it too.
  - `zam_material_import_context` returns the place and
    `missingLevels(lens, regionKey)`: the level names below the region. The
    agent then proposes only those, such as a Thema under a Gebiet.
  - The learner's Yes writes the cards as today. In the same transaction it
    adds `atlas_members` rows (`placed_by: "import"`) in that region.
  - Nothing of the material is stored (ADR 2026-10-05, Decision 9).
  - The ADR's sketched `import_requests` table is not needed. The material
    import's staging and its `sources` row already carry the import id and
    the source link. Add the table only if a later harness path needs
    requests an agent can list.
- **Typed or pasted notes.** The material import reads photos and PDFs today.
  Pasted text is new input to it: the same model request with the text in
  place of a file, the same place and the same review list. The text goes to
  the model and is not stored.
  - `src/kernel/import/text-import.ts` is the Anki/CSV/TSV importer and is not
    this path.
- **Kind follows the place, status stays own** (D2).
  - Every unit an import creates is own.
  - Its kind is the planet of the region chosen. A pupil's notes under
    *Physik › Mechanik* are own world knowledge, drawn with the marker.
  - The agent may propose another kind per unit, such as Firma for a note
    that names a customer. It shows beside the card in the review list, and
    the learner decides; on a team library a curator does. In Phase 7 only
    world regions exist, so this choice arrives with Phase 9.
  - Nothing is published.

**Variants: one goal, one method (D12).** Add a migration with the next free
M-number.

```sql
CREATE TABLE IF NOT EXISTS unit_variants (      -- knowledge: for every member of the library
  variant_key  TEXT NOT NULL,                   -- an own UnitKey
  stands_for   TEXT NOT NULL,                   -- a published UnitKey
  decided_by   TEXT NOT NULL,                   -- the curator
  created_at   TEXT NOT NULL,
  PRIMARY KEY (stands_for)
);
CREATE TABLE IF NOT EXISTS learner_variants (   -- learning state
  user_id      TEXT NOT NULL,
  variant_key  TEXT NOT NULL,
  stands_for   TEXT NOT NULL,
  detached_card_ids TEXT NOT NULL,              -- JSON array: the cards this choice detached
  created_at   TEXT NOT NULL,
  PRIMARY KEY (user_id, stands_for)
);
```

- `learner_variants` gets RLS and grants like `user_settings`.
- **`src/kernel/atlas/variants.ts`.**
  - `chooseVariant(db, { userId, variant, standsFor })`, for a learner:
    1. Check that `standsFor` is published and `variant` is a different
       unit. The variant may be own or published.
    2. Detach the learner's cards on `standsFor`'s tokens: set `detached_at`,
       the existing "Not for me" mechanism.
    3. Record their ids.
  - `undoVariant(db, { userId, standsFor })` re-attaches exactly the
    recorded cards and deletes the row.
  - `setLibraryVariant(db, { variant, standsFor, curatorId })` is
    curator-only.
    - It never touches members' cards; their cards are their own learning
      state.
    - A member who already holds cards on `standsFor` sees a one-time hint
      in the unit panel and decides for themselves.
- **Read and land.**
  - While a variant stands in, it is drawn on `standsFor`'s hex and gets no
    land of its own in that lens: settle skips it.
  - `standsFor` is not in reach, not offered as bonus, and not proposed by
    the agent for that learner.
  - Threads to and from `standsFor` are drawn to the variant.
- **From class notes.** A material proposal may carry an optional
  `standsFor?: UnitKey`.
  - The agent sets it when the notes teach another method for a unit the
    learner already has in that region.
  - The review list shows it beside the card: "Statt *<title>*: das Verfahren
    deiner Schule". The learner ticks it or not.
  - A Yes with the tick calls `chooseVariant` in the same transaction.
- **Not in this plan:** a school-specific *tile* that declares variants for
  its units. It needs the tile release contract, and `kvt-attach.ts` is still
  a spike. Methods that a state's curriculum prescribes already come as
  their own published units, bound to that curriculum.

***Neue Inhalte zeigen.***

- This is a person setting (`atlas.show_new`) and a toggle in the atlas
  toolbar. It is off by default; the field test checks that default.
- When it is on, the read also returns installed units without a card for
  this learner, flagged `inReach: true`. The renderer draws them as pencil
  sketches, with title and, from Phase 8, Sinnbild. Not started and never
  meant to be started look the same.
- **Bundled cells.** If the learner's curriculum scope is known (check what
  the curriculum wizard or the persona stores), turning the switch on installs
  the cells of that scope that are not yet installed. Then it settles.
  - Installing enrols nobody (ADR 2026-08-14, Decision 3). Use
    `installKvtTile(db, getBundledCellTile(cellId))`, the first step of
    `enrolBundledCell`, without `materialiseKvtCards`.
  - Without a known scope, only installed content shows.
- **Declined units** (all cards detached) stay blank even with the switch on.
- There is no counter and no percentage anywhere.

**Taking content in.**

- A sketched unit or region offers *Aufnehmen*. It creates the cards for
  those atoms through the existing bonus or cell enrol path:
  `enrolBonusAtom` in `src/kernel/library/bonus.ts`, or the cell enrol.
- It happens only on the learner's click, never automatically.

**Tests.**

- **Place.**
  - A material import with a place puts its units in that region.
  - `missingLevels` returns only the levels below the region.
  - Without a place, the import works exactly as before (the atlas switch is
    off).
- **Cells and staging.**
  - The cell path wins where a cell covers the scope.
  - No material text reaches the staging files or the database (extend the
    existing privacy test).
- **Neue Inhalte zeigen.**
  - `atlas-read` with `show_new` returns units in reach.
  - A declined unit is never in reach.
  - *Aufnehmen* creates cards only for the chosen units.
- **Kind and status.**
  - An import at a world region creates own units of the world kind.
  - A world sync (re-installing a tile) never overwrites or removes an own
    unit.
- **Variants.**
  - A variant takes the published unit's hex.
  - The published unit is not in reach.
  - Its cards are detached, not deleted and not moved; `undoVariant`
    re-attaches exactly those cards.
  - A library variant changes no member's cards (Postgres harness).

---

## Phase 8 — Sinnbilder (D6)

**Migration** (the next free M-number; M042 or later, depending on whether
Phase 7 landed first).

```sql
CREATE TABLE IF NOT EXISTS emblems (          -- knowledge: no learner column
  subject_key TEXT PRIMARY KEY,               -- UnitKey, or `region:${lensId}:${regionKey}`
  svg         TEXT NOT NULL,                  -- the canonical form only
  validator_version INTEGER NOT NULL,
  glyph       TEXT,
  author      TEXT NOT NULL,                  -- 'agent' | 'curator' | 'seed'
  updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS learner_emblems (  -- learning state
  user_id     TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  svg         TEXT NOT NULL,                  -- the canonical form only
  validator_version INTEGER NOT NULL,
  glyph       TEXT,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, subject_key)
);
```

- `learner_emblems` gets RLS and grants like `user_settings`.
- **Every path that stores an SVG validates.** That covers `setEmblem`, the
  seed and any later tile or migration that carries Sinnbilder.
  `revalidateEmblems(db)` re-checks rows with an older `validator_version`.
  It drops rows that no longer pass; they fall back to the next source in
  `resolveEmblem`.
- **A library's shared Sinnbild on a world unit stays in that library.**
  There is no upload path, and none may be added (D6).

**Files.**

- `src/kernel/atlas/emblem.ts` (pure): the validator.
  - `validateEmblem(svg: string, glyph?: string): { ok: true; canonical: string } | { ok: false; error: string }`
  - `EMBLEM_VALIDATOR_VERSION`, a number raised whenever the rules tighten.
  - `emblemDataUrl(canonical: string): string`, giving
    `data:image/svg+xml;base64,…` of the canonical form.
  - The validator tokenizes the SVG into a tree with its own small tokenizer
    and checks it against an allowlist. A regular expression over the source
    is not enough (review round 1, Grok F4).
  - **Canonical form** (review round 2, MiMo F3).
    - `canonical` is the validator's own re-serialisation of the allowed
      tree, with attributes in a fixed order and text escaped.
    - It is what gets stored and shown, never the input text, so a
      difference between the validator's parser and the browser's cannot
      slip through.
- **Elements:** `svg`, `g`, `path`, `circle`, `ellipse`, `rect`, `line`,
  `polyline`, `polygon`, `text`, `tspan`.
- **Attributes:** geometry (`d`, `cx`, `cy`, `r`, `rx`, `ry`, `x`, `y`, `x1`,
  `y1`, `x2`, `y2`, `width`, `height`, `points`, `transform`); paint (`fill`,
  `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `opacity`,
  `fill-opacity`, `stroke-opacity`); text (`font-size`, `font-weight`,
  `text-anchor`); and on the root only `viewBox` and `xmlns`.
- **Rejected:**
  - any other element or attribute, explicitly including `use`, `a`,
    `foreignObject`, `image`, `style`, `script`, the `animate*` and `set`
    elements, every `on*` attribute, `href` and `xlink:href`;
  - `<!` (doctype, entities, CDATA), and `&` other than `&amp;`, `&lt;`,
    `&gt;` and `&quot;`;
  - `url(`, `data:` and `javascript:` in any value.
- **Required:** the root `viewBox="0 0 64 64"`. `width`/`height` on the root
  are absent or at most 64.
- **Limits:** at most 6000 characters. The glyph is at most 16 characters,
  plain text, and contains no `<`.
- `src/kernel/atlas/emblems.ts`: the database layer.
  - `setEmblem(db, { subjectKey, svg, glyph, userId, mayWriteKnowledge, scope })`
    with `scope` = `auto` (the default), `personal` or `shared`.
    - With `auto`, it writes shared when no shared Sinnbild exists and
      `mayWriteKnowledge` is true; otherwise it writes personal (D6).
    - `shared` without the right refuses.
  - `clearPersonalEmblem`.
  - `resolveEmblem(subjectKey, userId)` looks in order at the personal row,
    the shared row, the seed, and finally the first unit's emblem for a leaf
    region without its own.
- `src/kernel/atlas/weltwissen-emblems.ts` (pure data): the region Sinnbilder
  of the Weltwissen seed, ported from the spike's `src/sample-emblems.ts`.
  They ship with the seed and are never written into `emblems`.
- **Bridge:** `atlas-emblem-set` and `atlas-emblem-clear` (Studio).
- **MCP** (lazy graph):
  - `zam_atlas_set_emblem` writes, so the host asks; it is not pre-approved.
  - `zam_atlas_missing_emblems` is read-only. It lists the regions and units
    of a lens that have none; titles are marked `untrusted: true`.
  - Both return SVG, glyphs and titles marked `untrusted: true`.
- **Surfaces.**
  - Atlas discs, which stay light in dark mode.
  - The review card in the study view, the graph nodes of Phase 2, and
    search results.
  - Always `<img src=emblemDataUrl(canonical)>` or Canvas `drawImage` of
    such an image. Never `innerHTML`, `<object>`, `<embed>` or `<iframe>`. The glyph
    goes in through `textContent`.

**Tests.**

- **Accepted:** every seed Sinnbild validates.
- **Rejected:**
  - a script, `onload`, `style`, `href`, `xlink:href`, `<image>` and
    `<foreignObject>`;
  - entities, `url(`, `data:`, and a missing or other `viewBox`;
  - more than 6000 characters, and a glyph with markup.
  - `use`, `a`, `animate`, `set`, and an event attribute on any element.
- **Canonical form.**
  - What is stored equals `canonical`, never the input.
  - Validating the canonical form again returns it unchanged.
  - Two inputs that differ only in attribute order or whitespace give the
    same canonical form.
  - A row with an older `validator_version` that fails the new rules is
    dropped by `revalidateEmblems`.
- **Writes and resolution.**
  - `auto` writes shared only with the right. A non-curator on a team
    library writes personal (Postgres harness).
  - The personal row wins in `resolveEmblem`.

---

## Phase 9 — Own planet, team lenses, typed threads, agent tools (D2, D3, D7, D10)

**The library's own planet.**

- **The library key `atlas.own_planet`.**
  - Add it to `LIBRARY_KEYS` in `src/kernel/models/settings.ts`.
  - It defaults to `firma` on a shared team library
    (`SettingsScope.shared`) and to `privat` otherwise.
  - A company library kept as a local file on a company machine sets `firma`
    explicitly (D2). Add a Settings row, "Diese Bibliothek gehört zu einer
    Firma", which only the library's owner or a curator can change.
- **Kernel invariants**, checked on every write and tested:
  - a lens's planet is `welt` or the own planet;
  - a unit has members only in lenses of one planet, its kind;
  - a unit's status never changes on a device: own stays own until an
    editorial release publishes it (D2);
  - a thread never runs from a world unit to a Firma or Privat unit. Firma
    and Privat can never meet, because they never share a database.
- **Kind of own units.**
  - An own unit takes the kind of the region it was placed in.
  - An own unit with no placement and no rule lands on the own planet's
    `unsortiert` island. Own units that sat on the world lenses'
    `unsortiert` island move there.
  - Changing a unit's kind moves its membership to a lens of the other
    planet. The learner does that, or a curator on a team library.
  - **Mixed imports.** The agent proposes the kind per unit (D2): Scrum's
    basics are world, how a team runs Scrum is Firma. Test that a mixed
    import keeps every unit own and applies the confirmed kinds.
- **Own-planet lenses.**
  - On `privat`: `leben` (Bereich › Thema), derived from domain segments.
  - On `firma`: `produkte` (Produktlinie › Produkt › Komponente), the
    default primary lens on a team library (D3). Also an optional
    `unternehmen` (Organisation › Bereich › Team › Verantwortung).
- **Curated lenses.**
  - `applyLensEdit(db, lensId, edit)` can create, rename, reorder or reparent
    regions, set aliases and place members. It is curator-only on a team
    library.
  - **Unternehmen replacement.** The agent proposes a whole replacement from
    one named source, stored as a pending proposal. A curator accepts it
    (`atlas-lens-accept`) and the map shows the new current view. Keep no
    history.
  - **Staleness.** When the agent's comparison with that source fails, it
    sets the lens's `stale` flag. `atlas-read` returns it, and the Studio
    shows curators "this lens no longer fits its source".
  - A lens edit that removes regions leaves home paths alone. The read's
    fallback (Phase 5) takes care of them.
  - Produkte proposals may come from the repo knowledge map's C4 model
    (`docs/knowledge-map/map.json`, ADR 2026-10-03, Decision 8).

**Threads.** Migration: the next free M-number.

```sql
CREATE TABLE IF NOT EXISTS connections (           -- knowledge
  id TEXT PRIMARY KEY,
  a_key TEXT NOT NULL, b_key TEXT NOT NULL,        -- UnitKey
  a_uri TEXT, b_uri TEXT,                          -- atom_uri of a published end, for rebuild remapping
  kind TEXT NOT NULL CHECK (kind IN ('nutzt', 'schnittstelle', 'ist-ein', 'verbindung')),
  note TEXT, author TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS learner_connections (   -- learning state
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  a_key TEXT NOT NULL, b_key TEXT NOT NULL, a_uri TEXT, b_uri TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('voraussetzung', 'nutzt', 'schnittstelle', 'ist-ein', 'verbindung')),
  note TEXT, created_at TEXT NOT NULL
);
```

- Shared Voraussetzung threads stay in the existing prerequisite tables (D7).
  A learner's own threads, of any kind, never feed blocking
  (`src/kernel/scheduler/blocker.ts` must not read them).
- `addConnection(db, { a, b, kind, note, scope, userId, mayWriteKnowledge })`
  validates the kind, the planet direction and `a !== b`. An "ist ein" thread
  never dedupes and never moves learning state.
- **Rendering.** Port the spike's `drawMarkers` (UML ends) and `drawPortal`.
  Add the kind's words beside the line at the closest zoom, on hover and in
  the unit panel: "baut auf", "nutzt", "Schnittstelle", "ist ein" (D7).
- **Portals.** A thread from an own-planet unit to a world unit ends at a
  portal on the coast, or beside the unit at unit zoom. A click switches to
  the welt planet at that unit.

**Agent tools** (MCP, lazy graph). Each must be safe when a host approves it
automatically (ADR 2026-10-08b).

| Tool | Writes | Notes |
|---|---|---|
| `zam_atlas_read` | nothing | lens tree, own counts and threads, with titles and notes `untrusted: true`. The only candidate for `PRE_APPROVED_TOOLS`; ask the owner in the PR. |
| `zam_atlas_place` | `atlas_members` | sorts an unplaced unit into a region. Curator-only on a team library. Takes a region key, never coordinates. |
| `zam_atlas_connect` | `learner_connections`, or `connections` with `scope: "shared"` and curator rights | personal by default |
| `zam_atlas_lens_edit` | lens tables | curator-only |
| `zam_atlas_set_emblem` | Phase 8 | personal by default |

- The tools take no library URL and no path. They act on the connected
  library and return one planet per call.
- **Live updates.**
  - Reuse whatever the Studio already uses to notice agent writes (check how
    it refreshes after `zam_material_import`).
  - If nothing fits, add a cheap `atlas-revision` bridge call: the maximum
    `updated_at` over the atlas tables. Poll it every 10 s while the atlas is
    visible, and on window focus.

**Tests.**

- The planet invariants.
- Connection validation per kind and direction; a personal thread never
  blocks.
- A non-curator cannot place, connect shared or edit a lens.
- `zam_atlas_read` changes nothing.
- The new tools are absent from `PRE_APPROVED_TOOLS` unless the owner
  approved.

---

## Phase 10 — Mobile and the MCP Apps panel (D10)

Plan this phase in detail once Phases 1–9 have shipped. Scope as known now:

- **Mobile.** A read-only atlas with the outline view first. The renderer and
  the pure kernel modules are shared; the region review goes through Mobile's
  existing study flow.
- **MCP Apps panel.** A read-only atlas panel, built like the existing panels
  in `desktop/src/panel/`.
  - It needs `atlas-read` (and `atlas-prefs` read) in
    `STUDIO_BRIDGE_COMMANDS`, with their refused options.
  - `atlas-feature` may appear there only with `--enable` and `--disable`
    refused. No write command goes there.

---

## Phase 11 — Documentation and handover

- **Public docs show only what works today** (owner rule). The alpha switch is
  described where Settings help describes the knowledge-map alpha, and
  nowhere on the landing page.
- **Knowledge map.** Add statements for `src/kernel/atlas/` and
  `desktop/src/atlas/`, then validate.
- **OKF.** If an article describes the learning graph's colours or the Studio
  views, update it through `zam_okf_upsert` in the same PR.
- **ADR status.** Set "Partially implemented" or "Implemented" with a delivery
  note, and add a status-history row.
- **This plan.** Tick the phases with their commit hashes. Delete the plan
  before the release that ships the last phase (plans lifecycle).

## Risks and pitfalls

- **Placing all of a library's units, not only the caller's,** is what makes
  the map shared. A read that settles only the caller's units would give
  every learner a different map.
- **Recomputing the Gosper curve** for an existing island moves units. The
  spike does exactly that on every change; do not port that part.
- **Request retention.** Today it is the default 0.9 everywhere. If a
  per-learner retention arrives, condition must take it from the same place
  the scheduler does.
- **Performance.** The spike draws a few hundred units at ease. A team library
  may hold thousands. Cull by viewport, bundle threads by level and thin
  labels before optimising anything else.
- **The tile install is a spike** (`kvt-attach.ts`). The atlas reads atoms and
  bindings but must not grow a dependency on install details that the release
  contract will change.
