/**
 * Reading the atlas for one learner (ADR 2026-10-13, Decisions 1, 3, 4, 10).
 *
 * The read writes nothing. Land the library has not settled yet is planned
 * in memory and marked provisional, so a learner who may not write knowledge
 * still sees a whole map. The coast covers every unit of the library; the
 * units a learner does not hold stay blank (Decision 1). Counts are the
 * caller's own; no figure says anything about other people.
 */

import type { Database } from "../db/types.js";
import {
  type Condition,
  type ConditionCard,
  cardCondition,
  unitCondition,
} from "./condition.js";
import { islandDrift } from "./land.js";
import {
  type DerivedPlacement,
  deriveSchule,
  deriveWeltwissen,
  findLensId,
  type LensDefinition,
  type LensRows,
  loadBindings,
  loadLensRows,
  loadUnits,
  type UnitRow,
  weltwissenSeedRows,
} from "./lenses.js";
import { hueKeyForDomain } from "./palette.js";
import { type LensSnapshot, loadLandState, planForSnapshot } from "./settle.js";
import type { LensKind, PlanetKind, UnitKey } from "./types.js";

export interface AtlasRegionView {
  key: string;
  name: string;
  level: number;
  parentKey: string | null;
  rank: number;
  /** Key the hue comes from; empty above the colour level. */
  hueKey: string;
  pattern: string | null;
  /** Not stored yet: the next settle writes it. */
  provisional: boolean;
}

export interface AtlasUnitView {
  key: UnitKey;
  title: string;
  /** Leaf region key. */
  region: string;
  condition: Condition | null;
  /** The caller's cards of this unit that are due or worse. */
  due: number;
  cards: number;
  /** Status (Decision 2): written in this library, not published. */
  own: boolean;
  /** No card yet; shown only with *Neue Inhalte zeigen*. */
  inReach: boolean;
}

export interface AtlasView {
  lens: {
    kind: LensKind;
    planet: PlanetKind;
    name: string;
    levels: string[];
    colourLevel: number;
  };
  regions: AtlasRegionView[];
  islands: Array<{
    key: string;
    dq: number;
    dr: number;
    drift: number;
    provisional: boolean;
  }>;
  land: Array<{
    island: string;
    q: number;
    r: number;
    region: string;
    /** Null: reserved land, or a unit the caller does not see. */
    unit: UnitKey | null;
  }>;
  units: AtlasUnitView[];
  /** `from` builds on `to`. */
  threads: Array<{ from: UnitKey; to: UnitKey; kind: "voraussetzung" }>;
  own: { dueByRegion: Record<string, number> };
  settle: { pending: number; mayWrite: boolean };
  /** The resolved home region key, after the fallback; null = whole lens. */
  home: string | null;
}

export interface ReadAtlasOptions {
  userId: string;
  lens: LensDefinition;
  now?: Date;
  /** *Neue Inhalte zeigen*: also units without a card (Decision 1). */
  showNew?: boolean;
  /** Stored home path, root first; the deepest key that still exists wins. */
  homePath?: readonly string[];
  /** Whether this connection may write knowledge (settle). */
  mayWrite?: boolean;
}

interface CardRow {
  token_id: string;
  state: ConditionCard["state"];
  stability: number;
  due_at: string;
  last_review_at: string | null;
  lapses: number;
  detached_at: string | null;
}

/** Lens rows to read with: stored ones, or the seed when none are stored yet. */
async function rowsForRead(
  db: Database,
  lens: LensDefinition,
): Promise<{ lensId: string | null; rows: LensRows }> {
  const lensId = await findLensId(db, lens.planet, lens.kind);
  if (lensId) return { lensId, rows: await loadLensRows(db, lensId) };
  if (lens.kind !== "weltwissen") {
    return { lensId: null, rows: { regions: [], aliases: [], members: [] } };
  }
  const seed = weltwissenSeedRows();
  return {
    lensId: null,
    rows: {
      regions: seed.regions.map((r) => ({
        id: r.key,
        key: r.key,
        name: r.name,
        level: r.level,
        parentId: r.parentKey,
        rank: r.rank,
      })),
      aliases: seed.aliases.map((a) => ({
        domainPrefix: a.domainPrefix,
        regionId: a.regionKey,
      })),
      members: [],
    },
  };
}

/** Everything a read needs, without writing. */
export async function snapshotForRead(
  db: Database,
  lens: LensDefinition,
): Promise<{ snapshot: LensSnapshot; units: UnitRow[]; stored: boolean }> {
  const { lensId, rows } = await rowsForRead(db, lens);
  const units = await loadUnits(db);
  const bindings = await loadBindings(db);
  const placements =
    lens.kind === "schule"
      ? deriveSchule(units, rows, bindings)
      : deriveWeltwissen(units, rows, bindings);
  const state = lensId
    ? await loadLandState(db, lensId, rows)
    : { islands: [], land: [] };
  return {
    snapshot: { lensId: lensId ?? "", rows, placements, state },
    units,
    stored: lensId !== null,
  };
}

/** Token ids of every unit in a region's subtree, for a region review. */
export async function regionTokenIds(
  db: Database,
  lens: LensDefinition,
  regionKey: string,
): Promise<string[]> {
  const { snapshot, units } = await snapshotForRead(db, lens);
  const inRegion = new Set(
    snapshot.placements
      .filter((p) => p.path.some((step) => step.key === regionKey))
      .map((p) => p.unitKey),
  );
  return units.filter((u) => inRegion.has(u.key)).flatMap((u) => u.tokenIds);
}

const DUE_CONDITIONS = new Set<Condition>([
  "due",
  "overdue",
  "decaying",
  "forgotten",
]);

export async function readAtlas(
  db: Database,
  options: ReadAtlasOptions,
): Promise<AtlasView> {
  const now = options.now ?? new Date();
  const { lens } = options;
  const { snapshot, units, stored } = await snapshotForRead(db, lens);
  const plan = planForSnapshot(snapshot);

  // ── Regions: stored, plus those the placements name ───────────────────────
  const storedKeys = new Set(snapshot.rows.regions.map((r) => r.key));
  const keyOfId = new Map(snapshot.rows.regions.map((r) => [r.id, r.key]));
  const regions = new Map<string, AtlasRegionView>();
  for (const r of snapshot.rows.regions) {
    regions.set(r.key, {
      key: r.key,
      name: r.name,
      level: r.level,
      parentKey: r.parentId ? (keyOfId.get(r.parentId) ?? null) : null,
      rank: r.rank,
      hueKey: "",
      pattern: null,
      provisional: !stored,
    });
  }
  for (const placement of snapshot.placements) {
    placement.path.forEach((step, i) => {
      if (regions.has(step.key)) return;
      regions.set(step.key, {
        key: step.key,
        name: step.name,
        level: step.level,
        parentKey: i > 0 ? placement.path[i - 1].key : null,
        rank: step.rank,
        hueKey: "",
        pattern: null,
        provisional: true,
      });
    });
  }
  // The hue comes from the region on the colour level, for it and below.
  const colourKey = (key: string): string => {
    let region = regions.get(key);
    while (region && region.level > lens.colourLevel) {
      region = region.parentKey ? regions.get(region.parentKey) : undefined;
    }
    if (!region || region.level !== lens.colourLevel) return "";
    const last = region.key.split(".").pop() ?? region.key;
    return hueKeyForDomain(last);
  };
  for (const region of regions.values()) region.hueKey = colourKey(region.key);
  // Regions with nothing on the map (no placement, no land) are left out.
  const used = new Set<string>();
  const markUsed = (key: string) => {
    let current: string | null = key;
    while (current && !used.has(current)) {
      used.add(current);
      current = regions.get(current)?.parentKey ?? null;
    }
  };
  for (const placement of snapshot.placements) {
    markUsed(placement.path[placement.path.length - 1].key);
  }
  for (const hex of plan.next.land) markUsed(hex.region);

  // ── The caller's cards ────────────────────────────────────────────────────
  const cardRows = (await db
    .prepare(
      `SELECT token_id, state, stability, due_at, last_review_at, lapses, detached_at
         FROM cards WHERE user_id = ?`,
    )
    .all(options.userId)) as CardRow[];
  const cardsByToken = new Map<string, CardRow>();
  for (const row of cardRows) cardsByToken.set(row.token_id, row);

  const leafOf = new Map<UnitKey, string>(
    snapshot.placements.map((p: DerivedPlacement) => [
      p.unitKey,
      p.path[p.path.length - 1].key,
    ]),
  );

  const unitViews: AtlasUnitView[] = [];
  const dueByRegion: Record<string, number> = {};
  for (const unit of units) {
    const region = leafOf.get(unit.key);
    if (!region) continue;
    const rows = unit.tokenIds
      .map((id) => cardsByToken.get(id))
      .filter((row): row is CardRow => row !== undefined);
    const attached = rows.filter((row) => row.detached_at === null);
    const declined = rows.length > 0 && attached.length === 0;
    if (declined) continue; // blank, even with Neue Inhalte zeigen
    if (attached.length === 0 && !options.showNew) continue;
    const conditionCards: ConditionCard[] = attached.map((row) => ({
      state: row.state,
      stability: Number(row.stability),
      dueAt: row.due_at,
      lastReviewAt: row.last_review_at,
      lapses: Number(row.lapses),
    }));
    const due = conditionCards.filter((card) =>
      DUE_CONDITIONS.has(cardCondition(card, now)),
    ).length;
    unitViews.push({
      key: unit.key,
      title: unit.title,
      region,
      condition: unitCondition(conditionCards, now),
      due,
      cards: attached.length,
      own: unit.own,
      inReach: attached.length === 0,
    });
    if (due > 0) {
      let current: string | null = region;
      while (current) {
        dueByRegion[current] = (dueByRegion[current] ?? 0) + due;
        current = regions.get(current)?.parentKey ?? null;
      }
    }
  }
  const visible = new Set(unitViews.map((u) => u.key));

  // ── Prerequisite threads between visible units ────────────────────────────
  const unitOfToken = new Map<string, UnitKey>();
  for (const unit of units) {
    for (const id of unit.tokenIds) unitOfToken.set(id, unit.key);
  }
  const threadKeys = new Set<string>();
  const threads: AtlasView["threads"] = [];
  const addThread = (from: UnitKey | undefined, to: UnitKey | undefined) => {
    if (!from || !to || from === to) return;
    if (!visible.has(from) || !visible.has(to)) return;
    const key = `${from}>${to}`;
    if (threadKeys.has(key)) return;
    threadKeys.add(key);
    threads.push({ from, to, kind: "voraussetzung" });
  };
  const atomEdges = (await db
    .prepare(`SELECT atom_id, requires_id FROM atom_prerequisites`)
    .all()) as Array<{ atom_id: string; requires_id: string }>;
  for (const edge of atomEdges) {
    addThread(`atom:${edge.atom_id}`, `atom:${edge.requires_id}`);
  }
  const tokenEdges = (await db
    .prepare(`SELECT token_id, requires_id FROM prerequisites`)
    .all()) as Array<{ token_id: string; requires_id: string }>;
  for (const edge of tokenEdges) {
    addThread(
      unitOfToken.get(edge.token_id),
      unitOfToken.get(edge.requires_id),
    );
  }

  // ── Land and islands, as planned ──────────────────────────────────────────
  const storedIslands = new Map(
    snapshot.state.islands.map((i) => [i.island, i]),
  );
  const islands = plan.next.islands.map((island) => {
    const before = storedIslands.get(island.island);
    return {
      key: island.island,
      dq: island.dq,
      dr: island.dr,
      drift: islandDrift(island),
      provisional:
        !before || before.dq !== island.dq || before.dr !== island.dr,
    };
  });
  const land = plan.next.land.map((hex) => ({
    island: hex.island,
    q: hex.q,
    r: hex.r,
    region: hex.region,
    unit: hex.unit && visible.has(hex.unit) ? hex.unit : null,
  }));

  // ── Home: the deepest stored step that still exists ───────────────────────
  let home: string | null = null;
  for (const key of options.homePath ?? []) {
    if (regions.has(key) && used.has(key)) home = key;
    else break;
  }

  const missingRegions = [...regions.values()].filter(
    (r) => used.has(r.key) && !storedKeys.has(r.key),
  ).length;
  return {
    lens: {
      kind: lens.kind,
      planet: lens.planet,
      name: lens.name,
      levels: [...lens.levels],
      colourLevel: lens.colourLevel,
    },
    regions: [...regions.values()].filter((r) => used.has(r.key)),
    islands,
    land,
    units: unitViews,
    threads,
    own: { dueByRegion },
    settle: {
      pending:
        (stored ? 0 : 1) +
        missingRegions +
        plan.islands.length +
        plan.land.length,
      mayWrite: options.mayWrite ?? false,
    },
    home,
  };
}
