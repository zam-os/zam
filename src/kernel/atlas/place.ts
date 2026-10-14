/**
 * Import at a place (ADR 2026-10-13, Decision 9): the units an import creates
 * go into the region the learner chose on the map, below it into the levels
 * the agent named, such as a Thema under a Gebiet.
 *
 * The kind follows the place and the status stays own (Decision 2): the
 * import writes tokens without an atom, and this module only records where
 * they sit, as `atlas_members` rows placed by "import". Settle gives them land
 * next time.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { directedThreadEnds, unitsHeldByThreads } from "./connections.js";
import {
  deriveLens,
  ensureLensRow,
  findLensId,
  LAST_RANK,
  type LensDefinition,
  type LensRows,
  loadBindings,
  loadLensRows,
  loadUnits,
  misspelledRegionName,
  type PathStep,
  slugSegment,
  type UnitRow,
} from "./lenses.js";
import {
  assertLensOnLibrary,
  dropOtherPlanetMembers,
  loadUnitPlanets,
  ownPlanetOf,
  PlanetError,
  primaryLens,
  variantUnits,
} from "./planets.js";
import { snapshotForRead } from "./read.js";
import type { LensKind, OwnPlanet, PlanetKind, UnitKey } from "./types.js";

/** Name of a level the agent left unnamed. */
export const UNNAMED_LEVEL = "Allgemein";
/** Longest region name an import may create. */
export const MAX_PLACE_NAME = 80;

export interface PlaceInfo {
  lens: LensKind;
  regionKey: string;
  /** From the island down to the region. */
  path: Array<{ key: string; name: string; level: number }>;
  /** Names of the levels below the region, outermost first: what an import names. */
  missingLevels: string[];
}

export interface PlacedUnit {
  unitKey: UnitKey;
  /** Names for the levels below the place, outermost first. */
  below: readonly string[];
}

/** The level names below a region of `level` (levels count from 0). */
export function missingLevels(lens: LensDefinition, level: number): string[] {
  return lens.levels.slice(level + 1);
}

/** Root-first steps to a region: from a placement, else from stored rows. */
async function regionSteps(
  db: Database,
  lens: LensDefinition,
  regionKey: string,
): Promise<PathStep[] | null> {
  const { snapshot } = await snapshotForRead(db, lens);
  for (const placement of snapshot.placements) {
    const index = placement.path.findIndex((step) => step.key === regionKey);
    if (index >= 0) return placement.path.slice(0, index + 1);
  }
  // A stored region nothing sits on yet, such as an empty seed Gebiet.
  const byKey = new Map(snapshot.rows.regions.map((r) => [r.key, r]));
  const byId = new Map(snapshot.rows.regions.map((r) => [r.id, r]));
  const steps: PathStep[] = [];
  let current = byKey.get(regionKey);
  while (current && !steps.some((step) => step.key === current?.key)) {
    steps.unshift({
      key: current.key,
      name: current.name,
      level: current.level,
      rank: current.rank,
    });
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return steps.length > 0 ? steps : null;
}

/** Where a region sits and what an import there names. Reads only. */
export async function resolvePlace(
  db: Database,
  lens: LensDefinition,
  regionKey: string,
): Promise<PlaceInfo | null> {
  const steps = await regionSteps(db, lens, regionKey);
  if (!steps) return null;
  const level = steps[steps.length - 1].level;
  return {
    lens: lens.kind,
    regionKey,
    path: steps.map((step) => ({
      key: step.key,
      name: step.name,
      level: step.level,
    })),
    missingLevels: missingLevels(lens, level),
  };
}

function cleanName(name: string | undefined): string {
  const text = (name ?? "").replace(/\s+/g, " ").trim();
  return text.slice(0, MAX_PLACE_NAME).trim();
}

/** Who placed a unit (`atlas_members.placed_by`). */
export type PlacedBy = "agent" | "curator" | "learner" | "import";

/**
 * Creates the regions of a lens a path names but the lens lacks, and gives
 * back each step's region id, island first. A known region an earlier
 * `prettify` misspelled takes the path's name. Transaction-free.
 */
function regionMaker(db: Database, lensId: string, rows: LensRows) {
  const idOf = new Map(rows.regions.map((r) => [r.key, r.id]));
  const nameOf = new Map(rows.regions.map((r) => [r.key, r.name]));
  return async (step: PathStep, parentId: string | null): Promise<string> => {
    const known = idOf.get(step.key);
    if (known) {
      const stored = nameOf.get(step.key) ?? "";
      if (misspelledRegionName(stored, step.name)) {
        await db
          .prepare(`UPDATE atlas_regions SET name = ? WHERE id = ?`)
          .run(step.name, known);
        nameOf.set(step.key, step.name);
      }
      return known;
    }
    const id = ulid();
    await db
      .prepare(
        `INSERT INTO atlas_regions (id, lens_id, parent_id, level, key, name, rank)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, lensId, parentId, step.level, step.key, step.name, step.rank);
    idOf.set(step.key, id);
    return id;
  };
}

/**
 * Record a unit in a leaf region. A unit lives on one planet, so its
 * placements on any other go (Decision 2).
 */
async function writeMember(
  db: Database,
  lens: LensDefinition,
  lensId: string,
  unitKey: UnitKey,
  regionId: string,
  placedBy: PlacedBy,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO atlas_members (lens_id, unit_key, region_id, placed_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (lens_id, unit_key) DO UPDATE SET
         region_id = excluded.region_id, placed_by = excluded.placed_by`,
    )
    .run(lensId, unitKey, regionId, placedBy);
  await dropOtherPlanetMembers(db, unitKey, lens.planet);
}

/** The planet checks every placement makes (Decision 2). */
function assertPlaceable(
  lens: LensDefinition,
  own: OwnPlanet,
  unitKey: UnitKey,
): void {
  assertLensOnLibrary(lens, own);
  if (lens.planet !== "welt" && unitKey.startsWith("atom:")) {
    throw new PlanetError(
      "published-is-world",
      `${unitKey} is published world knowledge; it cannot move to the ${lens.planet} planet.`,
    );
  }
}

/**
 * The checks a placement makes that need the library (Decision 2): a variant
 * stays world knowledge (Decision 12), and a unit that changes planet must
 * not leave world knowledge depending on a Firma or Privat unit. Reads only.
 */
async function assertMayChangePlanet(
  db: Database,
  lens: LensDefinition,
  own: OwnPlanet,
  unitKeys: readonly UnitKey[],
): Promise<void> {
  if (lens.planet !== "welt") {
    const variants = await variantUnits(db);
    const variant = unitKeys.find((key) => variants.has(key));
    if (variant) {
      throw new PlanetError(
        "variant-is-world",
        `${variant} stands in for a published unit, so it is world knowledge; it cannot move to the ${lens.planet} planet.`,
      );
    }
  }
  const units = await loadUnits(db);
  const planetOf = await loadUnitPlanets(
    db,
    units,
    await loadBindings(db),
    own,
  );
  const moving = new Set(
    unitKeys.filter(
      (key) => planetOf.has(key) && planetOf.get(key) !== lens.planet,
    ),
  );
  if (moving.size === 0) return;
  const held = unitsHeldByThreads(
    await directedThreadEnds(db, units),
    moving,
    lens.planet,
    planetOf,
  );
  const [first] = held;
  if (first) {
    const [unit, by] = first;
    throw new PlanetError(
      "held-by-thread",
      `${unit} stays on the ${planetOf.get(unit)} planet: a thread or prerequisite with ${by} would let world knowledge depend on a Firma or Privat unit.`,
    );
  }
}

/**
 * Put units into a region: create the region's path where the lens has no
 * rows for it yet, then one region per level below it, named by the import
 * (`UNNAMED_LEVEL` where it named none), and record each unit there. The
 * units take the region's planet as their kind; their status stays own. A
 * placement that breaks a planet invariant is refused before anything is
 * written (`PlanetError`).
 *
 * Opens no transaction of its own: the caller's commit holds it, so the
 * cards and their place are written together. The lens must exist
 * (`ensureWorldLenses`, `ensureLensRow`).
 */
export async function placeUnits(
  db: Database,
  lens: LensDefinition,
  regionKey: string,
  units: readonly PlacedUnit[],
  placedBy: PlacedBy = "import",
): Promise<number> {
  if (units.length === 0) return 0;
  const own = await ownPlanetOf(db);
  for (const unit of units) assertPlaceable(lens, own, unit.unitKey);
  await assertMayChangePlanet(
    db,
    lens,
    own,
    units.map((unit) => unit.unitKey),
  );
  const lensId = await findLensId(db, lens.planet, lens.kind);
  if (!lensId) throw new Error(`Atlas lens ${lens.kind} is missing`);
  const steps = await regionSteps(db, lens, regionKey);
  if (!steps) {
    throw new Error(`No region "${regionKey}" in the ${lens.name} lens.`);
  }
  const ensure = regionMaker(db, lensId, await loadLensRows(db, lensId));

  let placeId: string | null = null;
  for (const step of steps) placeId = await ensure(step, placeId);
  const place = steps[steps.length - 1];
  const below = missingLevels(lens, place.level).length;

  for (const unit of units) {
    let key = place.key;
    let level = place.level;
    let regionId = placeId as string;
    for (let i = 0; i < below; i++) {
      const name = cleanName(unit.below[i]) || UNNAMED_LEVEL;
      key = `${key}.${slugSegment(name) || "allgemein"}`;
      level += 1;
      regionId = await ensure({ key, name, level, rank: LAST_RANK }, regionId);
    }
    await writeMember(db, lens, lensId, unit.unitKey, regionId, placedBy);
  }
  return units.length;
}

export interface MovePlanetResult {
  /** Units that now live on the target planet. */
  moved: UnitKey[];
  /** Already there. */
  unchanged: UnitKey[];
  /**
   * Published units and variants, which stay world knowledge, and unknown
   * keys.
   */
  skipped: UnitKey[];
  /**
   * Units a thread or prerequisite keeps on their planet: moved, world
   * knowledge would depend on a Firma or Privat unit. `by` is the unit at
   * that thread's other end.
   */
  held: Array<{ unit: UnitKey; by: UnitKey }>;
}

/**
 * Change units' kind (Decision 2): each moves to the target planet's primary
 * lens, where that lens's rules put it (its unsorted island, or a domain
 * alias), as an explicit placement; its placements on the other planet go.
 * Published units and variants stay world knowledge, and a unit stays where
 * a thread or prerequisite holds it (`held`): world knowledge never depends
 * on a Firma or Privat unit. Nothing changes a unit's status.
 *
 * Transaction-free; the caller's write holds it. World lenses must exist
 * (`ensureWorldLenses`); the own planet's primary lens is created here.
 */
export async function moveUnitsToPlanet(
  db: Database,
  opts: { units: readonly UnitKey[]; planet: PlanetKind; placedBy: PlacedBy },
): Promise<MovePlanetResult> {
  const own = await ownPlanetOf(db);
  const lens = primaryLens(opts.planet);
  assertLensOnLibrary(lens, own);
  const lensId =
    opts.planet === "welt"
      ? await findLensId(db, lens.planet, lens.kind)
      : await ensureLensRow(db, lens);
  if (!lensId) throw new Error(`Atlas lens ${lens.kind} is missing`);

  const units = await loadUnits(db);
  const bindings = await loadBindings(db);
  const planetOf = await loadUnitPlanets(db, units, bindings, own);
  const byKey = new Map(units.map((u) => [u.key, u]));
  const rows = await loadLensRows(db, lensId);
  const ensure = regionMaker(db, lensId, rows);
  const result: MovePlanetResult = {
    moved: [],
    unchanged: [],
    skipped: [],
    held: [],
  };

  const variants =
    opts.planet === "welt" ? new Set<UnitKey>() : await variantUnits(db);
  const moving: UnitRow[] = [];
  for (const key of new Set(opts.units)) {
    const unit = byKey.get(key);
    const world = unit?.atomId || variants.has(key);
    if (!unit || (world && opts.planet !== "welt")) {
      result.skipped.push(key);
      continue;
    }
    if (planetOf.get(key) === opts.planet) {
      result.unchanged.push(key);
      continue;
    }
    moving.push(unit);
  }
  // No thread may run from world knowledge to an own planet afterwards.
  const held = unitsHeldByThreads(
    await directedThreadEnds(db, units),
    new Set(moving.map((unit) => unit.key)),
    opts.planet,
    planetOf,
  );
  for (const unit of moving) {
    const key = unit.key;
    const by = held.get(key);
    if (by) {
      result.held.push({ unit: key, by });
      continue;
    }
    const [placement] = deriveLens(lens, [unit], rows, bindings);
    let regionId: string | null = null;
    for (const step of placement.path) regionId = await ensure(step, regionId);
    await writeMember(db, lens, lensId, key, regionId as string, opts.placedBy);
    result.moved.push(key);
  }
  return result;
}
