/**
 * Planets (ADR 2026-10-13, Decision 2): the planet a library holds beside
 * world knowledge, the lenses it shows, and the planet each unit lives on —
 * its kind, by who protects the knowledge.
 *
 * - A unit's kind is the planet of the lenses it is placed in.
 * - A published unit (an atom) is world knowledge.
 * - An own unit nobody placed is world knowledge where a world rule covers
 *   it: a Weltwissen alias, a curriculum link, or a variant of a world unit.
 *   Otherwise it belongs to the own planet. Unsorted knowledge counts as
 *   protected until someone sorts it.
 *
 * Invariants, checked on every write:
 * - a lens's planet is welt or the library's own planet;
 * - a unit has members only in lenses of one planet, its kind;
 * - a published unit is world knowledge;
 * - nothing here changes a unit's status: own stays own until an editorial
 *   release publishes it.
 */

import { dialectOf } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { getSetting, OWN_PLANET_SETTING } from "../models/settings.js";
import {
  type BindingRow,
  type DerivedPlacement,
  deriveLens,
  deriveSchule,
  deriveWeltwissen,
  findLensId,
  LEBEN_LENS,
  type LensDefinition,
  type LensRows,
  lensRowsForRead,
  loadBindings,
  loadUnits,
  PRODUKTE_LENS,
  SCHULE_LENS,
  UNTERNEHMEN_LENS,
  type UnitRow,
  WELTWISSEN_LENS,
} from "./lenses.js";
import type { OwnPlanet, PlanetKind, UnitKey } from "./types.js";
import { libraryVariantUnits } from "./variants.js";

export type PlanetErrorCode = "other-planet" | "published-is-world";

/** A write that would break a planet invariant. */
export class PlanetError extends Error {
  constructor(
    readonly code: PlanetErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PlanetError";
  }
}

/** The lenses of each planet, the primary first (Decision 3). */
export const PLANET_LENSES: Readonly<
  Record<PlanetKind, readonly LensDefinition[]>
> = {
  welt: [WELTWISSEN_LENS, SCHULE_LENS],
  firma: [PRODUKTE_LENS, UNTERNEHMEN_LENS],
  privat: [LEBEN_LENS],
};

/** A planet's primary lens: where its unsorted units land. */
export function primaryLens(planet: PlanetKind): LensDefinition {
  return PLANET_LENSES[planet][0];
}

export function parseOwnPlanet(
  raw: string | null | undefined,
): OwnPlanet | null {
  return raw === "firma" || raw === "privat" ? raw : null;
}

/**
 * The library's own planet: the setting, else Firma on a team library and
 * Privat on a personal one.
 */
export async function ownPlanetOf(db: Database): Promise<OwnPlanet> {
  const stored = parseOwnPlanet(await getSetting(db, OWN_PLANET_SETTING));
  if (stored) return stored;
  return dialectOf(db) === "postgres" ? "firma" : "privat";
}

export function lensOnLibrary(lens: LensDefinition, own: OwnPlanet): boolean {
  return lens.planet === "welt" || lens.planet === own;
}

export function assertLensOnLibrary(
  lens: LensDefinition,
  own: OwnPlanet,
): void {
  if (lensOnLibrary(lens, own)) return;
  throw new PlanetError(
    "other-planet",
    `The ${lens.name} lens belongs to the ${lens.planet} planet; this library holds welt and ${own}.`,
  );
}

/**
 * The lenses this library shows: world knowledge's, then the own planet's.
 * Optional lenses (Unternehmen) show once a curator made them.
 */
export async function libraryLenses(
  db: Database,
  own?: OwnPlanet,
): Promise<LensDefinition[]> {
  const planet = own ?? (await ownPlanetOf(db));
  const lenses = [...PLANET_LENSES.welt];
  for (const lens of PLANET_LENSES[planet]) {
    if (
      lens === primaryLens(planet) ||
      (await findLensId(db, lens.planet, lens.kind))
    ) {
      lenses.push(lens);
    }
  }
  return lenses;
}

/** Pure: the planet of every unit (see the module comment). */
export function unitPlanetsFrom(input: {
  units: readonly UnitRow[];
  /** Planets of the lenses each unit has an explicit placement in. */
  memberPlanets: ReadonlyMap<UnitKey, ReadonlySet<PlanetKind>>;
  /** Own units a world rule covers. */
  worldCovered: ReadonlySet<UnitKey>;
  own: OwnPlanet;
}): Map<UnitKey, PlanetKind> {
  const planets = new Map<UnitKey, PlanetKind>();
  for (const unit of input.units) {
    if (unit.atomId) {
      planets.set(unit.key, "welt");
      continue;
    }
    const placed = input.memberPlanets.get(unit.key);
    // A unit placed on both (an older row) is treated as protected.
    if (placed?.has(input.own)) planets.set(unit.key, input.own);
    else if (placed?.has("welt")) planets.set(unit.key, "welt");
    else if (input.worldCovered.has(unit.key)) planets.set(unit.key, "welt");
    else planets.set(unit.key, input.own);
  }
  return planets;
}

/** Own units that a world rule places: an alias, a curriculum link, a variant. */
async function worldCoveredUnits(
  db: Database,
  units: UnitRow[],
  bindings: BindingRow[],
): Promise<Set<UnitKey>> {
  const covered = new Set<UnitKey>();
  if (units.length === 0) return covered;
  const { rows } = await lensRowsForRead(db, WELTWISSEN_LENS);
  const rules: LensRows = { ...rows, members: [] };
  for (const p of deriveWeltwissen(units, rules, bindings)) {
    if (p.source === "alias") covered.add(p.unitKey);
  }
  const none: LensRows = { regions: [], aliases: [], members: [] };
  for (const p of deriveSchule(units, none, bindings)) {
    if (p.source === "binding") covered.add(p.unitKey);
  }
  // A method standing in for a world unit is world knowledge (Decision 12).
  const variants = (await db
    .prepare(
      `SELECT variant_key FROM unit_variants
       UNION SELECT variant_key FROM learner_variants`,
    )
    .all()) as Array<{ variant_key: string }>;
  for (const row of variants) covered.add(row.variant_key as UnitKey);
  return covered;
}

/** The planet of every unit of the library. Reads only. */
export async function loadUnitPlanets(
  db: Database,
  units: UnitRow[],
  bindings: BindingRow[],
  own: OwnPlanet,
): Promise<Map<UnitKey, PlanetKind>> {
  const rows = (await db
    .prepare(
      `SELECT m.unit_key, l.planet
         FROM atlas_members m
         JOIN atlas_lenses l ON l.id = m.lens_id`,
    )
    .all()) as Array<{ unit_key: string; planet: PlanetKind }>;
  const memberPlanets = new Map<UnitKey, Set<PlanetKind>>();
  for (const row of rows) {
    const key = row.unit_key as UnitKey;
    const set = memberPlanets.get(key) ?? new Set<PlanetKind>();
    set.add(row.planet);
    memberPlanets.set(key, set);
  }
  const open = units.filter((u) => !u.atomId && !memberPlanets.has(u.key));
  return unitPlanetsFrom({
    units,
    memberPlanets,
    worldCovered: await worldCoveredUnits(db, open, bindings),
    own,
  });
}

export interface LensPlacements {
  /** Every unit of the library. */
  units: UnitRow[];
  /** Where the units of the lens's planet sit; variants the library sets left out. */
  placements: DerivedPlacement[];
  planetOf: Map<UnitKey, PlanetKind>;
  own: OwnPlanet;
}

/** The units of a lens's planet and where they sit in it. Reads only. */
export async function lensPlacements(
  db: Database,
  lens: LensDefinition,
  rows: LensRows,
): Promise<LensPlacements> {
  const own = await ownPlanetOf(db);
  const units = await loadUnits(db);
  const bindings = await loadBindings(db);
  const planetOf = await loadUnitPlanets(db, units, bindings, own);
  // A variant the library sets stands on its published unit's hex and gets
  // no land of its own (Decision 12).
  const skip = await libraryVariantUnits(db);
  const onPlanet = units.filter((u) => planetOf.get(u.key) === lens.planet);
  const placements = deriveLens(lens, onPlanet, rows, bindings).filter(
    (placement) => !skip.has(placement.unitKey),
  );
  return { units, placements, planetOf, own };
}

/**
 * A unit lives on one planet: drop its placements in lenses of any other.
 * Transaction-free; the caller's write holds it.
 */
export async function dropOtherPlanetMembers(
  db: Database,
  unitKey: UnitKey,
  planet: PlanetKind,
): Promise<void> {
  await db
    .prepare(
      `DELETE FROM atlas_members
        WHERE unit_key = ?
          AND lens_id IN (SELECT id FROM atlas_lenses WHERE planet <> ?)`,
    )
    .run(unitKey, planet);
}
