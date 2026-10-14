/**
 * Settling a lens (ADR 2026-10-13, Decision 8): derive where every unit of
 * the library belongs, plan the land, and write it in one transaction.
 *
 * Settle places every unit of the library, not only one learner's, so
 * everyone on a library shares the same map; a read filters by learner.
 * Only settle and a curator's lens edit write land. No tool takes
 * coordinates.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import {
  type IslandPlace,
  type LandHex,
  type LandState,
  planSettle,
  type RegionInfo,
  type SettlePlan,
} from "./land.js";
import {
  type DerivedPlacement,
  ensureLensRow,
  ensureWorldLenses,
  findLensId,
  type LensDefinition,
  type LensRows,
  loadLensRows,
  misspelledRegionName,
} from "./lenses.js";
import { assertLensOnLibrary, lensPlacements, ownPlanetOf } from "./planets.js";
import type { UnitKey } from "./types.js";

export interface LensSnapshot {
  lensId: string;
  rows: LensRows;
  placements: DerivedPlacement[];
  state: LandState;
}

/** The stored land of a lens, addressed by region keys. */
export async function loadLandState(
  db: Database,
  lensId: string,
  rows: LensRows,
): Promise<LandState> {
  const keyOf = new Map(rows.regions.map((r) => [r.id, r.key]));
  const islandRows = (await db
    .prepare(
      `SELECT region_id, dq, dr, founded_dq, founded_dr
         FROM atlas_islands WHERE lens_id = ?`,
    )
    .all(lensId)) as Array<{
    region_id: string;
    dq: number;
    dr: number;
    founded_dq: number;
    founded_dr: number;
  }>;
  const landRows = (await db
    .prepare(
      `SELECT island_id, q, r, region_id, unit_key
         FROM atlas_land WHERE lens_id = ?`,
    )
    .all(lensId)) as Array<{
    island_id: string;
    q: number;
    r: number;
    region_id: string;
    unit_key: string | null;
  }>;
  const islands: IslandPlace[] = [];
  for (const row of islandRows) {
    const island = keyOf.get(row.region_id);
    if (!island) continue;
    islands.push({
      island,
      dq: Number(row.dq),
      dr: Number(row.dr),
      foundedDq: Number(row.founded_dq),
      foundedDr: Number(row.founded_dr),
    });
  }
  const land: LandHex[] = [];
  for (const row of landRows) {
    const island = keyOf.get(row.island_id);
    const region = keyOf.get(row.region_id);
    if (!island || !region) continue;
    land.push({
      island,
      q: Number(row.q),
      r: Number(row.r),
      region,
      unit: (row.unit_key as UnitKey | null) ?? null,
    });
  }
  return { islands, land };
}

/**
 * Everything a plan needs for one lens, read without writing: the units of
 * the lens's planet only.
 */
export async function snapshotLens(
  db: Database,
  lens: LensDefinition,
): Promise<LensSnapshot | null> {
  const lensId = await findLensId(db, lens.planet, lens.kind);
  if (!lensId) return null;
  const rows = await loadLensRows(db, lensId);
  const { placements } = await lensPlacements(db, lens, rows);
  const state = await loadLandState(db, lensId, rows);
  return { lensId, rows, placements, state };
}

function regionInfos(rows: LensRows): RegionInfo[] {
  const keyOf = new Map(rows.regions.map((r) => [r.id, r.key]));
  return rows.regions.map((r) => ({
    key: r.key,
    parentKey: r.parentId ? (keyOf.get(r.parentId) ?? null) : null,
    rank: r.rank,
  }));
}

/** The plan for a snapshot; writes nothing. */
export function planForSnapshot(snapshot: LensSnapshot): SettlePlan {
  return planSettle({
    placements: snapshot.placements,
    regions: regionInfos(snapshot.rows),
    state: snapshot.state,
  });
}

export interface SettleResult {
  regionsCreated: number;
  islandsWritten: number;
  landWritten: number;
}

/**
 * Write a plan: the regions the placements name but the lens lacks, then the
 * islands, then the land. Units leave their old hexes before they take new
 * ones, so no moment holds a unit twice. A region an earlier `prettify`
 * misspelled takes the placement's name.
 */
export async function applySettle(
  db: Database,
  snapshot: LensSnapshot,
  plan: SettlePlan,
): Promise<SettleResult> {
  return db.transaction(async (tx) => {
    const { lensId } = snapshot;
    const idOf = new Map(snapshot.rows.regions.map((r) => [r.key, r.id]));
    const nameOf = new Map(snapshot.rows.regions.map((r) => [r.key, r.name]));
    let regionsCreated = 0;
    for (const placement of snapshot.placements) {
      let parentId: string | null = null;
      for (const step of placement.path) {
        let id = idOf.get(step.key);
        if (id && misspelledRegionName(nameOf.get(step.key) ?? "", step.name)) {
          await tx
            .prepare(`UPDATE atlas_regions SET name = ? WHERE id = ?`)
            .run(step.name, id);
          nameOf.set(step.key, step.name);
        }
        if (!id) {
          id = ulid();
          await tx
            .prepare(
              `INSERT INTO atlas_regions (id, lens_id, parent_id, level, key, name, rank)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              id,
              lensId,
              parentId,
              step.level,
              step.key,
              step.name,
              step.rank,
            );
          idOf.set(step.key, id);
          regionsCreated++;
        }
        parentId = id;
      }
    }

    const regionId = (key: string): string => {
      const id = idOf.get(key);
      if (!id) throw new Error(`Atlas region ${key} has no row`);
      return id;
    };

    for (const island of plan.islands) {
      await tx
        .prepare(
          `INSERT INTO atlas_islands (lens_id, region_id, dq, dr, founded_dq, founded_dr)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (lens_id, region_id) DO UPDATE SET dq = excluded.dq, dr = excluded.dr`,
        )
        .run(
          lensId,
          regionId(island.island),
          island.dq,
          island.dr,
          island.foundedDq,
          island.foundedDr,
        );
    }

    const upsertLand = async (hex: LandHex, unit: UnitKey | null) => {
      await tx
        .prepare(
          `INSERT INTO atlas_land (lens_id, island_id, q, r, region_id, unit_key)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (lens_id, island_id, q, r)
           DO UPDATE SET region_id = excluded.region_id, unit_key = excluded.unit_key`,
        )
        .run(
          lensId,
          regionId(hex.island),
          hex.q,
          hex.r,
          regionId(hex.region),
          unit,
        );
    };
    // First every changed hex without its unit, then the units.
    for (const hex of plan.land) await upsertLand(hex, null);
    for (const hex of plan.land) {
      if (hex.unit) await upsertLand(hex, hex.unit);
    }

    return {
      regionsCreated,
      islandsWritten: plan.islands.length,
      landWritten: plan.land.length,
    };
  });
}

/**
 * Settle one lens of the library: create or seed it if needed, plan, write.
 * Idempotent: a second run plans nothing. A lens of a planet this library
 * does not hold is refused (Decision 2).
 */
export async function settleLens(
  db: Database,
  lens: LensDefinition,
): Promise<SettleResult> {
  assertLensOnLibrary(lens, await ownPlanetOf(db));
  if (lens.planet === "welt") await ensureWorldLenses(db);
  else await ensureLensRow(db, lens);
  const snapshot = await snapshotLens(db, lens);
  if (!snapshot) throw new Error(`Atlas lens ${lens.kind} is missing`);
  const plan = planForSnapshot(snapshot);
  return applySettle(db, snapshot, plan);
}
