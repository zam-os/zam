# Knowledge atlas — implementation plan

**Status:** Phases 1 to 8 done (2026-10-13), with the owner's decisions from
the first Studio check built between Phases 7 and 8. Phase 9 done
2026-10-14 (the own planet, typed threads, curated lenses and agent
tools), with the three deliveries of ADR 2026-10-14 (the topic import,
*Nachlesen*, world knowledge only and the source rules for agents). Phase 10
done 2026-10-14 except the map itself on Mobile, which the owner moved to its
own feature; Phase 11 done the same day. The ADR gained Decision 12 and the
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
  (D1–D3) — `37a5d637`; see "As built"
- [x] **Phase 4** — stored land: founding, reserved land, coast, drift (D8)
  — `03d7432a`; see "As built"
- [x] **Phase 5** — bridge: alpha switch, read, settle, preferences, region
  review (D3, D10) — `af4064f2`; see "As built"
- [x] **Phase 6** — Studio atlas view, read-only (D4, D5, D7 prerequisites,
  D10) — `99a9ffca`; see "As built"
- [x] **Phase 7** — import at a place, *Neue Inhalte zeigen*, taking content
  in, variants (D1, D9, D12) — `36832ac1`; see "As built"
- [x] **After Phase 7** — owner decisions from the first Studio check: the
  atlas always on in place of the 3D graph, a busy indicator, an honest
  region due count and going through a region again — `3beb9e5c`; see
  "Between Phases 7 and 8"
- [x] **Phase 8** — Sinnbilder (D6) — `1bfde677`; see "As built"
- [x] **After Phase 8** — second Studio check: a Fach's Sinnbild in every
  lens, feedback while a model reads notes, the goal import at a place —
  `01226f83`; see "Between Phases 8 and 9"
- [x] **Third Studio check** — a crash when a landlocked region grows, and
  draft-first as an option that is off — `ade655fa`; see "Between Phases 8
  and 9"
- [x] **Phase 9** — own planet, team lenses, typed threads, agent tools (D2,
  D3, D7, D10), in these commits:
  - [x] **9a** — the library's own planet, its lenses (Leben, Produkte,
    Unternehmen), a unit's kind and the planet invariants — `18c26264`;
    see "As built (9a)"
  - [x] **9b** — typed threads and portals — `211d0aa0`; see "As built
    (9b)"
  - [x] **Topic import, Delivery 1** ([ADR 2026-10-14](../adr/2026-10-14-topic-import-and-source-provenance.md)):
    the goal import becomes the topic import, with a context field and its
    own prompts, and writes no file; the first-run topic page follows only
    the topic path; world regions only in the atlas — `76396d32`, review
    round 1 `e158590b`
  - [x] **Topic import, Delivery 2** — *Nachlesen* for world units, and a
    topic import's units on the world planet — `99596cf9`; see "As built
    (Delivery 2)"
  - [x] **9c** — in two commits:
    - [x] **9c-1** — curated lens edits, a replacement a curator accepts,
      the staleness flag, the agent tools and live updates — `3ebbb007`;
      see "As built (9c-1)"
    - [x] **9c-2** — mixed imports (the kind per card), the rest of ADR
      2026-10-14's Decision 5 (the model flags a subtopic about a company
      or a person) and the source rules for agents (Decision 3), which is
      that ADR's Delivery 3 — `3b99f188`; see "As built (9c-2)"
- [x] **Phase 10** — Mobile and the MCP Apps panel (D10), in two commits:
  - [x] **10a** — the MCP Apps atlas panel, read only (`zam_show_atlas`) —
    `cdcff4d4`; see "10a" below
  - [x] **10b** — Mobile: the outline on the Fortschritt tab and the region
    review — `5d2ea178`; see "10b" below
  - **Moved out:** the map itself on Mobile, with touch pan and pinch, is its
    own feature and PR (owner decision, 2026-10-14)
- [x] **Phase 11** — documentation and handover; see "As built" under
  Phase 11

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

**As built.**

- **Schema.** M041 (schema version 41) adds `atlas_islands` and `atlas_land`
  from one `ATLAS_LAND_TABLES` constant, with the partial unique index
  `ux_atlas_land_unit`. Both tables are knowledge in `KNOWLEDGE_TABLES` and
  part of `SNAPSHOT_TABLES`.
- **Reserve.** Each leaf reserves `max(1, ceil(n / 6))` hexes instead of the
  planned `max(2, …)`.
  - The bundled tiles hold 404 Themen of mostly one or two units, so a
    minimum of two left over half the map empty: 1453 hexes for 654 units.
  - With one it is 1054 hexes. Growth beyond the reserve takes coast anyway.
- **Bearings are measured from a fixed anchor**, the first island's origin
  (0, 0), not from the moving constellation centre.
  - A new island therefore never changes another island's octant.
  - Drift moves an island outward along its bearing from the anchor, so its
    octant holds by construction. Rounding to a hex keeps the octant too.
  - The anchor island itself never drifts.
- **Drift that the cap cannot finish** continues on the next settle. Growth
  prefers coast that keeps the gap, so in practice drift rarely happens: the
  bundled content founds and grows without any.
- **A unit that leaves its region,** or the library, frees its hex as reserve
  of the old region. Its new hex follows the normal rules, and nobody else
  moves.
- **Reading order.** `PathStep` carries a `rank`:
  - a Thema ranks by the earliest grade of its binding, so foundations come
    first;
  - a new Gebiet ranks after the seeded ones;
  - Schule islands rank by grade, Fächer by their seed order;
  - ties break by key, with numeric collation, so 5 sorts before 10.
- **Settle** (`src/kernel/atlas/settle.ts`):
  - `snapshotLens` reads without writing, and `planForSnapshot` plans from
    the snapshot.
  - `applySettle` writes the missing derived regions, then islands, then
    land. Each changed hex is cleared before units are assigned, so the
    unique index never sees one unit twice.
  - `settleLens` does all three.
- **Measured** on all 654 bundled atoms: founding takes about 14 ms, and one
  more unit about 8 ms with a single write.
  - Weltwissen: 4 islands, 1054 hexes.
  - Schule: 16 grade islands, 1059 hexes.

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

**As built.**

- **Kernel.** `src/kernel/atlas/read.ts` provides three functions:
  - `snapshotForRead` reads only. Before the first settle it derives from
    the seed held in memory, so even a fresh library shows its whole map.
  - `readAtlas` returns the map for one learner.
  - `regionTokenIds` lists the tokens of a region's subtree.
- **Shape of the view.**
  - It also carries `lens.name`.
  - Units carry `inReach` (no card yet) instead of `declined`. A declined
    unit (all cards detached) is simply not listed, so its hex stays blank.
  - `own.dueByRegion` counts every ancestor as well, so a panel on any
    level reads its own number.
  - Regions that nothing sits on are left out.
- **The CLI layer** is `src/cli/atlas.ts`.
  - `mayWriteKnowledge` asks PostgreSQL
    `has_table_privilege(current_user, 'atlas_land', 'INSERT')` and is
    always true on SQLite. This is the grants' own answer, not a second list
    of curators.
  - `atlas-settle` refuses with `{"error":"not-curator"}` before writing, and
    also when PostgreSQL denies a write (SQLSTATE 42501).
- **Bridge.** `atlas-feature`, `atlas-read`, `atlas-settle` and `atlas-prefs`
  are all outside `STUDIO_BRIDGE_COMMANDS`, and a test asserts it.
- **Preferences.** `atlas-prefs --home <key>` stores the region's key path,
  computed from the lens; an empty value clears it. The person keys are
  `atlas.lens`, `atlas.show_new` and `atlas.home.<lens>`.
- **Region review.** `get-reviews --atlas-region <key> [--atlas-lens]` runs
  the workload queue with `maxNew` 0 and the region's `tokenIds`, whatever
  `--respect-workload` says. `ReviewQueueOptions.tokenIds` filters both
  queries, and an empty list returns an empty queue.
- **Wire types** live in `src/bridge/protocol.ts`: `AtlasReadResponse`,
  `AtlasSettleResponse`, `AtlasPrefsResponse` and `AtlasFeatureResponse`.
- **Tests.**
  - `tests/cli/bridge-atlas.test.ts`:
    - the read writes no row;
    - the provisional land equals what settle then writes;
    - preferences and the home fallback;
    - the region review returns only that region's due cards;
    - no atlas command is reachable from the panel.
  - `tests/kernel/postgres-atlas.test.ts`: a team library where a member
    gets `not-curator` but reads the whole provisional map, and a curator
    settles.

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

**As built.**

- **Files.** `desktop/src/atlas/` holds four modules. None imports
  `main.ts`, Tauri or Three.js, so the MCP Apps panel can reuse them
  (Phase 10); a test guards it.
  - `layout.ts` (pure) builds the map from `atlas-read`: cells at their
    island's offset, region paths, shapes and label points, borders per
    level, island centres, search and the panel questions.
  - `render.ts` is the canvas map, ported from the spike without portals,
    notes and Sinnbilder.
  - `outline.ts` is the outline view.
  - `view.ts` mounts the toolbar, the map, the outline and the panels, and
    handles the keys.
- **Levels count from 0**, as in the kernel: level 0 is the island, and
  `depth` (the number of levels) means single units. The spike counted from
  1.
- **Colour.**
  - `palette.ts` gained `regionShade` and an optional `shade` on
    `conditionFill`, so sibling Gebiete differ in shade. The default shade
    keeps Phase 2's colours unchanged.
  - Patterns go to the level below the colour level, by sibling rank, since
    the wire's `pattern` is still null.
  - The condition textures follow `CONDITION_TEXTURE`. Blank land gets
    neither texture nor name, but keeps its region's pattern.
- **The "eigene Einheit" mark** is a folded corner at the upper left of the
  hex: light with an ink rim, so it reads on bright and on dark land.
- **Sinnbild discs** carry the region's initials until Phase 8.
- **Region condition.** `weakestCondition` (new in `condition.ts`) applies a
  unit's card rule to the units of a region: the weakest wins, unpractised
  counts only when nothing is practised, and no card does not count. On a
  large region this is often "wohl vergessen"; the due count beside it says
  how much.
- **Region review.** `get-review` also takes `--atlas-region` and
  `--atlas-lens`, because the Studio fetches one card at a time. In a region
  review the Studio offers no new cards, skips the keep-going and bonus
  offers, and the summary leads back to the map, which re-reads on every
  visit.
- **Settings.** The card "Knowledge atlas (Alpha)" sits in the Advanced
  tier, next to the other alpha card. The knowledge map's alpha switch no
  longer exists: since the Studio redesign, Quellen shows the map.
- **Own unit titles.** `loadUnits` now names a token without a title by its
  concept, before falling back to its slug.
- **Small fixes found in the preview.**
  - Fitting a region zooms in to at most 64 px per hex.
  - Island titles that would overlap a larger island's are left out until
    you zoom closer.
  - Region discs fade once units are the focus.
- **Checked** in a temporary preview page (removed again) with every
  bundled tile installed: 433 units on 1049 hexes, the map opens home, zoom
  levels, search, lens switch with the selection kept, dark mode, and the
  outline by keyboard. One full-map draw takes about 10 ms.
- **Not yet checked in the Tauri app:** the nav entry, the Settings switch
  and a region review recolouring after ratings.
- **Tests.**
  - `tests/desktop/atlas-layout.test.ts` covers the geometry on real reads
    and the module boundaries.
  - `tests/cli/bridge-atlas.test.ts` covers `get-review --atlas-region`.
  - The palette, condition and lens tests cover shades, `weakestCondition`
    and concept titles.

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

**As built.**

- **Kernel.** Three new modules in `src/kernel/atlas/`:
  - `place.ts`: `resolvePlace` names a region's path and `missingLevels`,
    reading stored rows or, for a region that exists only by derivation (a
    Schule Lernbereich), the derived placements. `placeUnits` creates the
    path and the named levels and writes `atlas_members` rows. It opens no
    transaction of its own, so the material import's commit holds it.
  - `variants.ts`: `chooseVariant`, `undoVariant`, `setLibraryVariant`,
    `clearLibraryVariant` and `effectiveVariants`. `chooseVariantIn` is the
    transaction-free core for the commit.
  - `take.ts`: `takeUnits` for *Aufnehmen*.
- **No nested transactions.** SQLite's adapter queues a transaction behind
  the running one, so a transaction opened inside another waits for ever.
  The commit therefore calls `ensureWorldLenses` before its transaction and
  only transaction-free helpers inside it.
- **Migration M042** (schema version 42) adds `unit_variants` (knowledge,
  in `KNOWLEDGE_TABLES`) and `learner_variants` (learning state, with RLS
  and in `RLS_PROTECTED_TABLES`). Both are in the snapshot tables.
- **The material import.**
  - The set gains `place`, and a proposal gains `placeBelow` and
    `standsFor`; all are optional, so the contract stays at version 1.
  - The commit places only the units it wrote: a linked duplicate keeps its
    place. A level the producer left unnamed is called "Allgemein".
  - A Yes on a ticked "instead of" row calls `chooseVariantIn` in the same
    transaction.
- **Typed notes** go into the material import's own start dialog, beside
  photos and PDF, and not into the atlas dialog; they work without a place
  too.
  - `analyzeMaterialText` sends them to the first `text` row, as the
    request's text.
  - The set holds one file entry, `notes:<title>@<date>`, with the text's
    SHA-256; the text itself is in neither the staging file nor the library.
  - `material-import-models` now also names the text model.
- **Place in the prompt.** `materialPlaceLines` tells both producers the
  path, the levels to name and the learner's published units there.
  `zam_material_import_context` takes `place` and marks the returned names
  `untrusted: true`; `zam_material_import` takes `place`.
- **Cells for a place** (`atlas-place`).
  - **Schule:** the commonest binding of the region's atoms gives the
    scope. On an island (a grade) the subject is left out.
  - **Weltwissen:** a cell counts when its atoms' domains fall under an
    alias of the region or of a region below it (a Thema borrows its
    Gebiet's aliases), or when its atoms already sit in the region.
  - **Wizard:** offered on Schule where `needsGenericCurriculumImport`
    says so, and on Weltwissen where no cell is found.
- ***Neue Inhalte zeigen*** installs the cells of the learner's school year
  when it goes on, not only of the last subject chosen: the map shows the
  whole year.
- ***Aufnehmen*** uses the cell enrol's `materialiseKvtCards` for published
  units and `ensureCard` for own ones. It does not use `enrolBonusAtom`,
  which demands held hard prerequisites that an arbitrary sketched unit may
  lack. A declined unit, or one a variant stands in for, is skipped.
- **Variants on the map.**
  - A learner's own choice detaches the published unit's cards, so that unit
    is already blank. The variant takes its hex, and its own hex goes blank.
  - A library variant gets no land of its own; settle and the read skip it.
    While the learner still holds the published unit, that unit keeps its
    hex and offers the switch (`variantOffer`).
  - Threads of the published unit run to the variant.
  - A published unit a variant stands for is never offered as a bonus.
- **Bridge.**
  - New commands `atlas-place`, `atlas-take` and `atlas-variant`, none of
    them in `STUDIO_BRIDGE_COMMANDS`.
  - `atlas-prefs --show-new on` reports `cellsInstalled`.
  - `material-import-analyze` gains `--text`, `--title`, `--place-region` and
    `--place-lens`, and `material-import-confirm` gains `--variants`.
- **Studio.**
  - The toolbar gains *Neue Inhalte zeigen*. Sketched units get a dashed
    pencil outline and grey titles.
  - The region panel gains *Hier importieren …* and, where units are
    sketched, *Aufnehmen*.
  - The import dialog (`desktop/src/atlas/import.ts`) puts the material
    first and lists the cells below it, with "Aufnehmen" each.
  - The unit panel offers *Aufnehmen*, "Statt …" with its undo, and the
    library's offer to switch.
  - The material start dialog names the place and adds it to the harness
    request. The review list names the place and shows the "instead of"
    tick.
  - The breadcrumb stays on one line and takes its own toolbar row when
    the window is narrow.
- **Docs.** The OKF articles `material-import.md`, `bridge-protocol.md` and
  `mcp-surfaces.md` describe the new inputs. `bridge-protocol.md` now also
  lists the atlas commands of Phase 5.
  - They went through `upsertArticle` directly: the `zam_okf_upsert` tool
    refuses a bundle path with a hidden segment (`.claude/worktrees/…`), and
    its default bundle is the main checkout.
- **Checked** in a temporary preview page (removed again) with sketches, a
  chosen variant and real `atlas-place` output:
  - the toggle, the pencil sketches in both themes, the variant panel and
    its redirected thread;
  - the import dialog, the start dialog with the place and the notes field,
    and the arguments each action sends.
- **Tests.**
  - `tests/kernel/atlas-place.test.ts` covers the place and its levels, an
    import at a Weltwissen and at a derived Schule region, and no place
    without one. It also covers choosing and undoing a variant, and that
    undo re-attaches only what the variant detached. On the library side:
    a variant changes no card and gets no land, a member holding the
    published unit is offered the switch, and that unit is no bonus. Last,
    *Aufnehmen* and declined units, and own units surviving a re-install.
  - `tests/kernel/postgres-atlas.test.ts`: a member may not set a library
    variant; a curator's changes no member card; a member's own choice and
    undo work under RLS. `postgres-rls.test.ts` isolates `learner_variants`.
  - `tests/cli/bridge-atlas.test.ts` covers `atlas-place`, *Neue Inhalte
    zeigen* installing the year without enrolling, `atlas-take` and
    `atlas-variant`.
  - `tests/cli/bridge-material-import.test.ts` covers an import at a place
    end to end.
  - `tests/cli/material-analyze.test.ts` covers typed notes: a text request
    with the place, nothing of the text in the set or the staging file, and
    the refusals.
  - `tests/desktop/material-import-start.test.ts` and
    `material-review.test.ts` cover the place arguments, the harness text,
    the review's place line and `--variants`.
- **Not yet checked in the Tauri app:** the whole flow with a real model,
  from the import dialog through the review list to the cards on the map.

---

## Between Phases 7 and 8 — owner decisions from the Studio check

The owner tried Phases 1–7 in the Tauri app. Three findings, decided and
built before Phase 8.

**1. A region review that found nothing ended like a finished session.**

- **Why.** The map counted a region's cards by condition, and the queue
  serves fewer:
  - a card in short steps counts as due while it waits for its next step;
  - blocked and buried cards are left out of the queue;
  - an atom shows one item a day, so its other items wait once one was
    shown.
- **Count.** `readAtlas` now counts, per unit, the cards the queue would
  serve now, by the queue's own filters (`occupyingAtomCards`,
  `cardAllowedForAtom`); an atom unit counts at most one. The condition is
  unchanged: a waiting card still shows as due. `atlas-read` takes
  `--time-zone` for the learner's day.
- **Going through again.** When a region review finds nothing before any
  answer, the study view no longer shows the summary.
  - A small region (at most `REGION_PRACTICE_MAX_UNITS`, 30 practised
    units) asks "Nichts ist fällig. Möchtest du die Fragen trotzdem noch
    einmal durchgehen?".
  - On yes, `get-review --atlas-practice-since <iso>` serves the region's
    due cards first. When none is left, `nextPracticeCard` picks the
    practised card due soonest that was not answered since the run began,
    within the one-item-per-atom rule. `pullForwardCards` makes only that
    card due, so stopping half-way leaves the rest as they were. New cards
    never come.
  - A larger region, or nothing left, offers only the way back to the map.
  - The region panel's button stays active while such a run is possible.
- **Session size.** The study bar and the summary counted the whole queue's
  due cards in a region review. They now use the region's count, or its
  practised units in a run.

**2. The atlas replaces the 3D graph.**

- The atlas is always shown. Its nav entry takes the 3D graph's place, and
  the Lern-Karten button that opened the 3D graph opens the atlas.
- The 3D graph is an alpha: `graph3d-feature [--enable|--disable]`
  (machine-local `graph3d.enabled` in `~/.zam/config.json`, off by default)
  shows its nav entry. Only the Settings card writes it; the command is not
  in `STUDIO_BRIDGE_COMMANDS`.
- `atlas-feature` and the `atlas` config key are gone.

**3. Building the world needs feedback.** The atlas view lays a busy veil
over the map, naming the step: loading, building a view, updating,
building the world (settle), drawing, and fetching new content for
*Neue Inhalte zeigen*. It fades in after a quarter second, so a quick
re-read does not flash it.

**Tests.** `tests/cli/atlas-region-practice.test.ts` covers the due count
(one item per atom, a waiting short step, a blocked card) and the run
(earliest due first, one card pulled forward at a time, nothing answered
since the start and no new card again). `atlas-layout.test.ts` covers when
the run is offered, and `bridge-atlas.test.ts` the 3D graph's switch.

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

**As built.**

- **Migration M043** (schema version 43) adds `emblems` (knowledge, in
  `KNOWLEDGE_TABLES`) and `learner_emblems` (learning state, with RLS like
  `user_settings` and in `RLS_PROTECTED_TABLES`). Both are in the snapshot
  tables.
- **Subject keys** for regions are `region:<lens kind>:<region key>`, not the
  lens's ULID as planned. A lens kind belongs to exactly one planet, so the
  key is just as unique. It also works before the lens is stored, survives a
  rebuild of the lens rows, and an agent can read it.
- **The validator** (`src/kernel/atlas/emblem.ts`) is as planned, with these
  details:
  - A leading XML declaration is dropped.
  - Attribute values may hold only `A–Z a–z 0–9 space . , # % ( ) + -`. That
    rules out quotes, `:` and `/`, so no URL of any kind.
  - Text is allowed only inside `text` and `tspan`.
  - At most 400 elements, nested at most 24 deep.
  - `glyphEmblemSvg` turns a glyph alone into a Sinnbild. That is the
    Studio's "Eigenes Kurzzeichen …", and it keeps `svg NOT NULL`.
- **Storage** (`src/kernel/atlas/emblems.ts`):
  - `setEmblem`, `clearPersonalEmblem` and `clearSharedEmblem` (curator only;
    added so a bad shared Sinnbild can go).
  - `resolveEmblems` resolves in bulk, `resolveEmblem` one subject.
  - `revalidateEmblems` re-checks older rows. The bridge runs it before every
    write. Reads re-check older rows in memory, so a row that fails today's
    rules is never shown, even before it is dropped.
- **The seed** (`src/kernel/atlas/weltwissen-emblems.ts`) is the spike's 76
  Sinnbilder, ported as they were: Bereiche, Fächer, Gebiete and one
  chalkboard per grade. `seedEmblem` maps a Weltwissen or Schule region key
  to them. A Schule Fach reuses the Weltwissen Fach's Sinnbild. Themen and
  Lernbereiche have none of their own, so as leaves they show their first
  unit's.
- **The read.** `readAtlas` returns each Sinnbild once in `emblems`, and
  regions and units point to it with `emblem`. The leaf rule follows land
  order.
- **Bridge.**
  - `atlas-emblem-set` takes an SVG or a glyph; `--from-studio` records the
    author as a person.
  - `atlas-emblem-clear`.
  - `atlas-emblem-draw` (added): the first text model draws a Sinnbild from
    the subject's title and path. It runs through
    `src/cli/llm/emblem-draw.ts`, and a refused drawing goes back to the
    model once with the validator's reason. Without it, a learner without an
    agent would have no way to a Sinnbild beyond typing a sign (Studio
    first).
  - None of the three is in `STUDIO_BRIDGE_COMMANDS`.
  - `get-review --media` returns the unit's Sinnbild.
- **MCP.**
  - `zam_atlas_missing_emblems` carries `readOnlyHint` and is not
    pre-approved. It returns `untrusted: true` and the drawing rules.
  - `zam_atlas_set_emblem` writes, so the host asks. The canonical form it
    returns is marked `untrusted`.
- **Studio.**
  - Region discs show their Sinnbild, and keep the initials where there is
    none.
  - A unit with a Sinnbild shows it on a light disc in place of its title
    until the hex is 70 px; closer in, the title sits below it. A sketched
    unit's Sinnbild is faint.
  - The region and unit panels show the Sinnbild with its glyph and where it
    comes from: own, the library's, the seed's, or the first unit's. They
    offer *Sinnbild zeichnen lassen*, *Eigenes Kurzzeichen …* and *Eigenes
    entfernen*.
  - Search results carry a small Sinnbild.
  - The review card shows the unit's Sinnbild only with the answer, after
    reveal. A glyph such as "a² + b² = c²" would give the answer away before
    it.
- **Not done:**
  - Learning-graph nodes: the 3D graph is an alpha since the Studio check,
    and the 2D graph lives in the MCP Apps panel (Phase 10).
  - The outline view stays text only.
- **Checked** in a temporary preview page (removed again) with real
  `readAtlas` output:
  - the seed Sinnbilder on the region discs;
  - units with drawn and glyph Sinnbilder at both zooms, in light and dark;
  - the panel's Sinnbild section, the refusal without a text model, the
    glyph form, and Sinnbilder in search results.
- **Tests.**
  - `tests/kernel/atlas-emblem.test.ts`:
    - every seed Sinnbild validates, and every seed region has one;
    - the rejection list, the limits and the canonical form (fixed order,
      idempotent, input never stored);
    - the scopes, personal winning, the seed fallback, `revalidateEmblems`,
      and the atlas read with the leaf rule.
  - `tests/cli/emblem-draw.test.ts`: the draw path with a mocked model,
    including the correction round.
  - `tests/cli/bridge-atlas.test.ts`: the three commands end to end, the
    review card's Sinnbild, and the draw refusal by code.
  - `tests/kernel/postgres-atlas.test.ts`: a member's first Sinnbild is
    personal, shared refuses, and the curator's is shared.
    `postgres-rls.test.ts` isolates `learner_emblems`.

---

## Between Phases 8 and 9 — second Studio check

**1. A Sinnbild drawn for "Github" in the Schule lens did not show in
Weltwissen.**

- **Cause.** Region Sinnbilder were keyed per lens. The Fach is
  `ausserhalb.github` in Schule and `unsortiert.github` in Weltwissen.
- **Fix.**
  - A region on the colour level (the Fach) keys its Sinnbild by its subject,
    `subject:<hue key>`. All lenses share it, and so do all grades:
    Mathematik of the 9th grade and Weltwissen's Mathematik show one
    Sinnbild.
  - Other regions keep `region:<lens>:<key>`.
  - `readAtlas` gives every region an `emblemSubject`, where the Studio
    writes. It resolves a Fach by the subject first, then by its old region
    key, so an older row still shows in its lens.
  - The seed resolves subjects too (`seedSubjectEmblem`).
- **Migration M044** (schema version 44) moves rows written under a Fach's
  region key to the subject. A Fach's region key has two segments in both
  lenses. Where the subject already has a row, the old one goes.

**2. Typed notes seemed to do nothing.** The model reads for a minute or
two, and the dialog showed only a small line of text.

- The status now shows a turning ring and the time since the start, and it
  says that the dialog may be closed: the review list opens by itself.
- A refusal or failure that arrives after the dialog was closed opens it
  again with the reason. The same applies to photos and PDFs.

**3. The goal import at a place** ("ein fehlendes Wissen beschreiben, nicht
Notizen aus dem Unterricht").

- *Hier importieren …* now offers *Fehlendes Wissen beschreiben* first. It
  opens the goal import dialog with the place.
- The model is told the place along with the goal's description.
- Each drafted card carries `placeBelow` = [goal, topic].
  `personal-source-confirm-import --place-region/--place-lens` puts the
  units the import created there. `fitBelow` gives the last names to the
  deepest levels: the topic becomes the Thema, the goal the level above.
- `applySourceProposals` returns the token per proposal, so that only
  created units are placed. A failure to place keeps the cards and is
  reported as `placeError`.

**Tests.**

- `atlas-emblem.test.ts`: a Fach drawn in Schule shows in Weltwissen, and
  M044 moves a Fach row and leaves a Gebiet row.
- `bridge-atlas.test.ts`: `fitBelow`, and a goal import placed under a new
  Thema.
- `goal-topic-cards.test.ts`: the place in the description, the place
  arguments and `placeBelow`.
- `material-import-start.test.ts`: the elapsed time.

**Third Studio check.**

- **The atlas stopped loading** ("Cannot read properties of undefined
  (reading 'h')") after a goal import added units below "Github".
  - Cause: growth looked for free coast only beside the region, or beside
    the first ancestor that had land. Github lay inside its island, ringed
    by other Fächer, so there was none, and the empty candidate list was
    read.
  - `planSettle` now tries the region, then each ancestor, then the whole
    island, and takes the first with free coast. A layout that worked
    before stays the same.
  - `atlas-land.test.ts` grows a region ringed by other land.
- **Draft-first becomes an option, off by default** (owner decision). Goal
  import, file and source import, curriculum import, splits, foundations,
  `add-token` and `zam token register` used to create drafts, which stay
  out of every queue and, unpractised, out of view.
  - `newTokenEditorialState` reads the library setting `content.draft_first`.
    Without it, new content is published and learnable at once.
  - Studio Settings → Advanced has the switch "Neue Karten zuerst als
    Entwurf".
  - `zam_add_token`'s description, the zam skill and the OKF article
    `mcp-surfaces` say so.

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

**As built (9a).**

- **The own planet.** `atlas.own_planet` is a library key
  (`OWN_PLANET_SETTING`). `ownPlanetOf` reads it, else takes Firma on
  PostgreSQL (the team library) and Privat otherwise. `atlas-planet [--own]`
  reads and sets it; setting needs `mayWriteKnowledge`. It is not in
  `STUDIO_BRIDGE_COMMANDS`, and no tool writes it. Settings → Advanced has
  "Diese Bibliothek gehört zu einer Firma", locked for whoever may not
  write knowledge.
- **Switching the planet keeps everything.** Lenses of the other planet stay
  stored but are no longer shown, and their placements no longer count, so
  switching back restores them. (The plan left this open; nothing is
  deleted.)
- **Lenses.** `LEBEN_LENS` (Bereich › Thema, colour level 0),
  `PRODUKTE_LENS` and `UNTERNEHMEN_LENS` beside the world's two, with
  `PLANET_LENSES` (primary first) and `libraryLenses`: world's, then the own
  planet's primary, then Unternehmen once its lens row exists (a curator
  makes it in 9c).
  - `deriveDomainLens` places by explicit member, then the longest domain
    alias, filling the levels below it from the next domain segments.
    Without an alias, Produkte and Unternehmen use the unsorted island.
    Leben makes a domain's first segment the Bereich instead, so a private
    map has structure before the agent sorts it.
  - Produkte is the default lens of a Firma library (`readAtlasPrefs`).
- **A unit's kind** (`src/kernel/atlas/planets.ts`).
  - A published unit is world knowledge.
  - An own unit takes the planet of its explicit placements; one placed on
    both (an older row) counts as protected.
  - An own unit nobody placed is world knowledge where a world rule covers
    it: a Weltwissen alias, a LehrplanPLUS link, or a variant of a world
    unit. Otherwise it belongs to the own planet.
  - `lensPlacements` derives only the units of the lens's planet. So own
    units that sat on Weltwissen's unsorted island, and on Schule's
    "Außerhalb des Lehrplans", move to the own planet at the next settle.
    Their old hexes become reserve.
- **Invariants.**
  - `settleLens`, `placeUnits` and the bridge's `libraryLens` refuse a lens
    of the other planet (`PlanetError` `other-planet`).
  - `placeUnits` refuses to put a published unit on the own planet
    (`published-is-world`).
  - Every placement drops the unit's placements on other planets
    (`dropOtherPlanetMembers`).
  - Nothing touches `atom_id`, so a unit's status never changes.
- **Changing a unit's kind.**
  - `moveUnitsToPlanet` places units where the target planet's primary lens
    puts them, as explicit members, and skips published units.
  - `atlas-move-planet` takes units or a region and needs
    `mayWriteKnowledge`: the learner on a library of their own, a curator on
    a team library.
  - In the Studio, a unit's panel and a region's panel offer *Ins
    Weltwissen*, or *Nach Privat* / *Zur Firma* on the world planet. The
    region panel counts the own units there.
- **The Studio.**
  - The lens buttons come from `atlas-read`'s `lenses`. They are grouped by
    planet, and the planet is named only when the library shows two.
  - `L` cycles through all lenses.
  - Each planet has its own colour of sea, ported from the spike.
  - Import at a place works on the own planet's lenses: no cells and no
    curriculum wizard there. The place's lens types widen to every lens
    kind (`MaterialPlace`, the MCP `place` enums).
- **A Fach's shared Sinnbild key** (`subject:<hue key>`) applies to world
  lenses only. A Produkt or a private Bereich keeps
  `region:<lens>:<key>`.
- **Tests.** `tests/cli/atlas-planets.test.ts` covers:
  - the default planet and the lens list;
  - `unitPlanetsFrom` for every rule;
  - private units leaving the world lenses;
  - refusals for the other planet;
  - moving a unit back and forth, keeping one planet and its own status;
  - published units staying world knowledge;
  - a region move through the bridge;
  - switching to Firma.

  `atlas-goal-place.test.ts` now covers a goal import at a derived Fach on
  all three lenses, moving the units to world knowledge first for
  Weltwissen and Schule.

**Notes for 9b** (worked out before the hand-over).

- **Migration M045**, schema version 45: `connections` and
  `learner_connections` as sketched above. `learner_connections` gets RLS
  in `src/cli/deploy/rls-policies.ts`, like `learner_emblems`, and a case
  in `tests/kernel/postgres-rls.test.ts`.
- **Direction.**
  - `a` is always the dependent end: a builds on b, a uses b, a consumes
    the interface b provides, a is a b.
  - The planet rule then reads: if a is world knowledge, b must be too.
  - A Verbindung has no direction, so `addConnection` swaps its ends
    instead of refusing.
  - A shared Voraussetzung is refused in `connections`: it belongs in the
    prerequisite tables (`zam_link_prereq`).
- **Ends** (ADR Decision 7 table). Every head sits at the end that is
  depended upon:
  - Voraussetzung: arrowhead at b, the foundation;
  - nutzt: open head at b;
  - ist ein: hollow triangle at b;
  - Schnittstelle: ball at b, the provider, and socket at a.

  The Studio has drawn the prerequisite arrowhead at the dependent end
  since Phase 6. Turn it around to match the ADR.
- **Read.**
  - `threads` gains `kind`, `scope`, `id` and `note`.
  - A thread whose other end lies on the other planet keeps that end. A new
    `portals: Record<UnitKey, {title, planet}>` names those ends.
  - `snapshotForRead` passes `planetOf` through for this.
  - Prerequisite threads across planets become portals too.
- **Render.**
  - Port the spike's `bundledThreads` (leading kind by priority),
    `drawMarkers`, `drawPortal` (a globe disc, since the product has no
    planet Sinnbilder), `drawNote` and the portal hit test.
  - Clicking a portal opens a lens of that planet at the unit.
  - The kind's words show at the closest zoom and on lit bundles.
- **Blocking.** A test rates the foundation of a personal Voraussetzung
  thread 1 and shows that the dependent stays unblocked.

**As built (9b).** The notes above held; what they left open:

- **Storage** (`src/kernel/atlas/connections.ts`). M045 at schema version
  45, with `UNIQUE (a_key, b_key, kind)` per table (per learner in
  `learner_connections`). `connections` is in `KNOWLEDGE_TABLES`,
  `learner_connections` under RLS, and both are part of backup and restore.
  - `addConnection` validates the kind, both ends (a token of an atom names
    the atom's unit), `a !== b`, a note of at most 280 characters, the
    planet direction, the shared Voraussetzung and the right to write
    knowledge. It keeps the atom_uri of published ends.
  - The same thread again is not stored twice; a new note replaces the old
    one. A Verbindung on one side of the planet line is stored in key order,
    so one pair is one Verbindung.
  - `removeConnection` cuts the learner's own, or the library's with the
    right to write knowledge.
- **Read.** `threads` carries `kind`, `scope`, and for a connection `id` and
  `note`. Prerequisites come first, then the library's connections, then the
  learner's own, so a personal copy of a shared thread is drawn once.
  Portals work from both sides: the world map names private ends too. A
  portal needs a unit the learner would see on its own planet.
- **Bridge.** `atlas-connect` and `atlas-disconnect`, neither on the Studio
  panel bridge. MCP tools stay in 9c.
- **Render.**
  - The spike placed an island's portal by the bearing of each local end but
    keyed it once per island, so a second portal on the same island was
    never drawn. Now an island's portal sits on its lower left coast, and up
    close there is one portal per unit and planet. A click opens the first
    thread's far unit; the unit panel lists every one.
  - Unlit prerequisites still hide up close; the other kinds stay, as they
    are rarer. Notes show on a lit single thread. Portal labels fit one
    line.
- **Studio.**
  - The unit panel lists threads by kind and direction ("Nutzt", "Wird
    genutzt von", "Sonderfälle", …), with portal ends, the learner's mark,
    the note, and × to cut one the caller may cut.
  - *Faden spannen*: pick the other end on the map, in search or in the
    outline; a region click zooms in. The panel then offers every kind as a
    sentence with both titles, *Richtung tauschen* and a note. The Studio
    writes personal threads only. Esc cancels.
  - A thread to the other planet cannot be picked in the Studio yet; the
    bridge (and the agent tools of 9c) can spin it.
- **Tests.** `tests/kernel/atlas-connections.test.ts` covers direction,
  validation, rights, dedupe, the read with scopes, notes and portals, and a
  personal Voraussetzung that never blocks (both ends rated 1). PostgreSQL:
  `learner_connections` under RLS, and a member refused a shared thread
  while a curator writes one.

**As built (Delivery 2 of ADR 2026-10-14).**

- **The term.** `tokens.lookup_term`, M046 at schema version 46: knowledge,
  part of the token's revision (`RevisionChanges.lookupTerm`, also in
  `zam_publish_revision`), stored trimmed and at most 200 characters.
- **Where it comes from.**
  - `topic-outline` asks the model for each subtopic's `article`, the exact
    title of the Wikipedia article in the content language, and returns it
    as `lookupTerm`.
  - The Studio hands it on in `topic-cards --topic`. Every card of the
    subtopic then carries `lookup_term`, and the confirm stores it.
  - A published atom without a term uses its title.
- **What reading up opens** (`src/kernel/atlas/read-up.ts`).
  - A world unit with a web `source_link` opens that page. A LehrplanPLUS
    page does not count: a curriculum names a subject's scope, not the
    knowledge. Nor does a link with credentials.
  - Every other world unit gets `{kind: "search", term, language}`. The
    Studio builds the search (`desktop/src/read-up.ts`), in the unit's
    language, else the learner's.
  - Firma and Privat units get nothing, since `readUpForTokens` decides the
    planet first.
- **Surfaces.**
  - `atlas-read` units on world lenses, `get-review --media` and
    `personal-card-list` carry `readUp`.
  - The *Nachlesen* button sits in the atlas unit panel, beside the
    revealed answer (next to the Sinnbild), and in Lern-Karten's card
    editor. Each opens in the system browser through the host's opener;
    without a host (the panel) the button stays away.
- **One bullet of Decision 5 moved forward.**
  - The topic import's confirm without `--place-region` puts its new units
    on the world planet (`placeOnWorldPlanet`), so they read up even where
    no world rule covers their domain.
  - On a team library this needs the right to write knowledge. Without it
    the cards stay and the rules decide.
  - The model flagging a subtopic about a company or a person stays in 9c.
- **Tests.**
  - `tests/kernel/atlas-read-up.test.ts`: link rules, the order of
    preference, the term's storage and revision, world against private,
    atoms by title, the world map only, and an import keeping the term.
  - `tests/desktop/read-up.test.ts`: the URLs.
  - The parser keeps the article.
  - The Studio hands the term on per subtopic.
  - `bridge-atlas.test.ts`: a topic import without a place lands on the
    world planet with its `readUp` in `atlas-read` and
    `personal-card-list`.

**As built (9c-1).**

- **Storage.** M047 at schema version 47 adds seven columns to
  `atlas_lenses`:
  - `source`;
  - `stale_at` and `stale_note`;
  - one pending `proposal` (JSON), with `proposal_source`, `proposed_at`
    and `proposed_by`.

  They are knowledge, written only with the right to write it.
- **Edits** (`src/kernel/atlas/curation.ts`, `applyLensEdits`).
  - The ops: `create-region`, `rename-region`, `reorder-region`,
    `move-region`, `remove-region`, `set-alias`, `remove-alias` and `place`.
    They are applied in order inside the caller's transaction, so a refused
    edit rolls the batch back.
  - `move-region` goes only below a region of the same level as the old
    parent, so levels stay consistent. It clears the land of the moved
    subtree.
  - `remove-region` cascades to children, placements, aliases, land and an
    island. Its units fall back to the lens's rules.
  - The CLI settles right after an edit, so everyone sees the same map.
- **World lenses take additions only.** The plan left this open.
  - Allowed: create, alias and place. Rename, reorder, move and remove are
    refused (`world-structure`): one library never moves the published map.
  - An alias may not cover a seed prefix or a published atom's domain
    (`published-alias`).
  - `place` refuses atoms (`published-unit`).
- **Replacement** for the own planet's lenses only.
  - `validateLensProposal` checks keys, order (parents first), depth,
    duplicates, and own units as members.
  - Accepting deletes the lens's regions, so placements, aliases, land and
    islands cascade. It writes the proposal's order and sets `source`,
    which clears staleness.
  - Rejecting drops the proposal and nothing else.
  - `atlas-lens-accept` is a bridge command for the Studio. No tool
    accepts.
- **Staleness.** `atlas-lens-stale --stale on|off [--note]` and
  `markLensStale`. `atlas-read` returns `curation`. Curators see a bar
  above the map: "Diese Linse passt nicht mehr zu ihrer Quelle …" and a
  waiting proposal with *Übernehmen* and *Verwerfen*.
- **Agent tools.**
  - `zam_atlas_read` is read-only and in the reviewed read-only list, not
    in `PRE_APPROVED_TOOLS`; the owner decides that in the PR. It takes
    `region` and `limit`.
  - `zam_atlas_place` (`atlasSortUnits`) skips published units and a
    person's placements (`placed_by` curator or learner).
  - `zam_atlas_connect` wraps `atlasConnect`.
  - `zam_atlas_lens_edit` takes exactly one of `edits`, `propose` or
    `stale`.
  - The MCP tool count is now 48. The zam skill lists the four tools in all
    four copies.
- **Live updates.** Nothing existing fitted: material review refreshes only
  on window focus. `atlas-revision` returns one SQL statement's
  fingerprint: counts and latest times over the atlas tables, the caller's
  threads and Sinnbilder, tokens and the caller's cards.
  - The Studio reads it before each `atlas-read`.
  - It polls every 10 s while the map is on screen, and on focus.
  - On a change it reads the map again quietly: no veil, and the camera
    stays.
  - It skips the poll while a thread is being spun.
- **Tests.**
  - `tests/kernel/atlas-curation.test.ts`: edits, refusals and rollback, a
    removal's fallback, aliases, the world lens's rules, proposal, accept,
    reject and staleness, and proposal validation.
  - `tests/cli/atlas-agent-tools.test.ts` drives the four tools through an
    MCP client: the read changes nothing, sorting skips, a refused thread
    direction, no accept tool, none pre-approved, and the revision moves.
  - PostgreSQL: a member is refused lens edits and proposals, and a
    curator edits, proposes and accepts.

**As built (9c-2, and Delivery 3 of ADR 2026-10-14).**

- **Mixed imports.** A material proposal may carry
  `kind: welt | firma | privat`. Either of the last two means the library's
  own planet.
  - The producer's rules say to set it only when the material mixes both,
    for example how Scrum works (welt) against how one team runs it
    (firma).
  - The review list shows only those cards a switch, *Gehört zu:
    Weltwissen*, which a tap turns to the own planet and back.
  - `material-import-confirm --kinds` takes the learner's choices.
  - At commit, a new unit whose kind differs from the place's planet goes
    to that planet's primary lens (`moveUnitsToPlanet`) instead of the
    place. So does a unit with a kind and no place.
  - `result.kinds` counts both directions. Every unit stays own.
- **Fixed on the way:** the review list named a place on Leben, Produkte
  or Unternehmen through the wrong lens (`placeNames` knew only Weltwissen
  and Schule).
- **Protected subtopics** (Decision 5).
  - `topic-outline` asks for `protected`: a short reason when a subtopic is
    one company's or one person's own knowledge. It comes back as
    `protectedReason`.
  - The Studio shows such a subtopic unticked and locked, with no
    drill-down. The note says to import it from its source.
- **Source first** (Decision 3).
  - `checkAgentSource` (`src/cli/agent-source.ts`) accepts a file or folder
    in the trusted folders (an `#anchor` is allowed) or an http(s) URL to a
    public host without credentials. It uses `safeFetch`'s locality and
    address rules and fetches nothing.
  - `zam_add_token` now requires `sourceLink`, and `bridge add-token` (an
    agent transport only) checks it too.
  - The handler stays open for the learner's own cards.
  - The zam skill (all four copies) states the rule, and the tool
    description repeats it.
- **Tests.**
  - `tests/cli/agent-source.test.ts` covers the rules and the MCP refusal
    without a source.
  - `atlas-place.test.ts` covers a mixed import with a flipped card, every
    unit own, and an invalid kind.
  - The parser keeps a protected reason.
  - The review list's kind switch and its `--kinds`.
  - The bridge and MCP tests that added tokens without a source now pass
    one.

---

## Phase 10 — Mobile and the MCP Apps panel (D10)

Planned in detail after Phases 1–9 shipped. Two commits; both surfaces only
read: neither writes knowledge, land or preferences.

### 10a — MCP Apps panel

- **Tool.** `zam_show_atlas` opens `ui://zam/atlas`, read-only like
  `zam_show_graph`, with an optional `lens`, an optional `region` to open at,
  and `user`. It returns the opening Companion context.
- **Panel.** `desktop/src/panel/atlas-panel.html` mounts the Studio's own atlas
  view (`showAtlasView`) in a read-only mode, `AtlasViewDeps.readOnly`. The
  bridge transport goes through `zam_studio_bridge`, so the panel can reach
  nothing the allowlist does not name.
- **Read-only mode** hides everything that writes: *Faden spannen* and ×,
  Sinnbild edits, *Hier importieren*, *Ins Weltwissen* / *Nach Privat*,
  *Aufnehmen*, the variant switch, *Als Heimat*, *Neue Inhalte zeigen* (it
  installs cells), a curator's accept, and settle. The lens switch stays and is
  not stored. *Wiederholen* is not offered: the panel names ZAM Desktop for a
  region review. *Nachlesen* opens through the host.
- **Allowlist.** `atlas-read` and `atlas-revision` read. `atlas-prefs` reads
  the stored lens and home, and refuses `--lens`, `--home` and `--show-new`.
  `tests/cli/studio-bridge-review.test.ts` records the review.
- **Styles.** The design tokens and the atlas rules move out of `styles.css`
  into `tokens.css` and `atlas/atlas.css`, which the Studio and the panel both
  import. The panel brings the few shared controls it needs and no web fonts.
- **Docs.** `mcp-surfaces` (the tool and its panel), `bridge-protocol` (three
  atlas commands on the panel bridge), the knowledge map.
- **Verification.** Unit tests for the allowlist and the tool; the panel in
  the real host, VS Code with an isolated profile (Companion e2e), in light and
  dark.
- **As built.** The tool also names where to open (`lens`, `region`), and
  the panel opens there once. The Companion knows the surface `atlas`, but no
  UI intent opens the panel in the Companion yet. Checked in a local MCP Apps
  host built on the SDK's `AppBridge`, driving this branch's `zam mcp` on an
  isolated library: only the three reads were called, no control that writes
  showed, *Nachlesen* went through `openLink`, the lens switch stored nothing,
  and light, dark and opening at a region worked. VS Code Copilot Chat is
  still to check by hand.

### 10b — Mobile

- **Kernel read.** The composition behind `atlas-read`, `atlas-prefs` (read)
  and `atlas-revision` moves into the kernel, so Mobile calls it on its own
  database and the CLI keeps only the bridge wrapper.
- **Screen.** A *Wissensatlas* screen in Mobile's navigation, outline first:
  the Studio's outline renderer, regions with their condition in words and the
  learner's own due counts, and the library's lenses to switch between.
- **Region review.** *Wiederholen* starts Mobile's review session on the
  region's due cards (`regionTokenIds`), each submit declaring its
  `answer_format`.
- **Moved out of this plan:** the map itself on Mobile, with touch pan and
  pinch, sharing `render.ts` and `layout.ts`. The owner moved it to its own
  feature and PR (2026-10-14).
- **Verification.** Mobile tests over the Tauri invoke stub and `npm run build`
  in `mobile/`.
- **As built.**
  - `readLearnerAtlas`, `readAtlasPrefs`, `libraryLens` and the setting keys
    live in `src/kernel/atlas/learner.ts`; `atlas-read` is that read plus the
    lens's curation.
  - The atlas sits on the Fortschritt tab under the statistics, so Mobile
    keeps its four tabs (ADR 2026-08-08b). A segmented control switches the
    library's lenses; nothing is stored.
  - `mobile/src/atlas.ts` reads through a small source (`kernelAtlasSource`
    on Mobile's database), renders the Studio's outline, and shows the chosen
    region or unit in a card. *Wiederholen* starts `MobileReviewSession` with
    the region's token ids, without new cards.
  - Checked in the Mobile vite preview with real `atlas-read` output, in a
    phone viewport, light and dark, German.
  - The owner finds both Fortschritt and Inhalte fitting places for the
    atlas; it stays on Fortschritt.

---

## Phase 11 — Documentation and handover

- **Public docs show only what works today** (owner rule). The atlas is a
  regular view now; the 3D graph's alpha switch is described where Settings
  help describes the knowledge-map alpha, and nowhere on the landing page.
- **Knowledge map.** Add statements for `src/kernel/atlas/` and
  `desktop/src/atlas/`, then validate.
- **OKF.** If an article describes the learning graph's colours or the Studio
  views, update it through `zam_okf_upsert` in the same PR.
- **ADR status.** Set "Partially implemented" or "Implemented" with a delivery
  note, and add a status-history row.
- **This plan.** Tick the phases with their commit hashes. Delete the plan
  before the release that ships the last phase (plans lifecycle).
- **As built.**
  - **Public docs.** The README's Studio section (en, de) names the
    knowledge atlas in place of the knowledge graph. The 3D graph's alpha
    switch was already described in Settings, and the repository has no
    landing page that names it.
  - **Knowledge map.** New statements: `atlas-condition`, `atlas-land`,
    `atlas-planets`, `atlas-outline`, and below `atlas-land` the statements
    `atlas-variants` and `atlas-import-place`. `atlas-mobile` moves below
    `atlas-outline`, so no statement spells out more than seven others.
  - **OKF.** `mcp-surfaces` gives the learning graph's colours (hue and
    condition, the texture as a stroke, the condition in words in the
    tooltip). `mobile-standalone-libraries` describes the atlas on
    Fortschritt. `kernel-architecture` describes which atlas modules are pure
    and which run on the `Database` contract. The other atlas articles were
    updated with their phases.
  - **ADRs.** ADR 2026-10-13 is *Partially implemented*, with a delivery
    note: the map itself on Mobile is open, and so is the field test.
    ADR 2026-10-14 is *Implemented*; its open question 1 stays open.
  - **This plan** stays until the release that ships PR #407, which deletes
    it. The map on Mobile gets its own plan.

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
