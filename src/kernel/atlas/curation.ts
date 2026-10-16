/**
 * Curated lenses (ADR 2026-10-13, Decision 3; plan Phase 9c).
 *
 * - **Edits.** A curator, or an agent working with a curator's rights, edits
 *   a lens: create, rename, reorder, move or remove regions, set and remove
 *   domain aliases, and place units. On a world lens only additions are
 *   allowed (a region, an alias for own knowledge, an own unit's place): one
 *   library never moves the published map.
 * - **Replacement.** For the own planet's lenses (Unternehmen, Produkte,
 *   Leben) the agent may propose a whole new order from one named source. It
 *   waits as the lens's one pending proposal until a curator accepts or
 *   rejects it; accepting replaces the lens, and no history is kept.
 * - **Staleness.** When the agent finds a lens no longer fits its source, it
 *   flags it; curators see it in the Studio.
 *
 * Positions stay engine-written (Decision 8): a move or a removal clears the
 * land of the regions it touches, and the next settle places their units
 * again. No edit takes coordinates.
 *
 * Every function here is transaction-free: the caller's write holds it.
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { directedThreadEnds, newWorldCrossing } from "./connections.js";
import {
  ensureLensRow,
  findLensId,
  type LensDefinition,
  type LensRows,
  loadBindings,
  loadLensRows,
  loadUnits,
  slugSegment,
  type UnitRow,
  weltwissenSeedRows,
} from "./lenses.js";
import { MAX_PLACE_NAME, type PlacedBy, placeUnits } from "./place.js";
import {
  assertLensOnLibrary,
  lensPlacements,
  loadUnitPlanets,
  ownPlanetOf,
  PlanetError,
} from "./planets.js";
import type { PlanetKind, UnitKey } from "./types.js";

export type LensEdit =
  | {
      op: "create-region";
      name: string;
      /** The parent's key; absent or null for a new island. */
      parent?: string | null;
      /** Defaults to the parent's key and the name's slug. */
      key?: string;
      rank?: number;
    }
  | { op: "rename-region"; key: string; name: string }
  | { op: "reorder-region"; key: string; rank: number }
  | { op: "move-region"; key: string; parent: string }
  | { op: "remove-region"; key: string }
  | { op: "set-alias"; domain: string; region: string }
  | { op: "remove-alias"; domain: string }
  | {
      op: "place";
      unit: string;
      region: string;
      /** Names for the levels below `region`, outermost first. */
      below?: string[];
    };

export type LensEditOp = LensEdit["op"];

export type LensEditErrorCode =
  | "bad-edit"
  | "unknown-region"
  | "too-deep"
  | "world-structure"
  | "published-unit"
  | "published-alias"
  | "bad-proposal"
  | "no-proposal"
  | "not-own-planet";

export class LensEditError extends Error {
  constructor(
    readonly code: LensEditErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LensEditError";
  }
}

/** Most edits one call may carry. */
export const MAX_LENS_EDITS = 200;
/** Most regions a proposed replacement may hold. */
export const MAX_PROPOSAL_REGIONS = 2000;
/** Longest named source or staleness note. */
export const MAX_CURATION_TEXT = 300;

const REGION_KEY = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const MAX_KEY = 300;
const MAX_DOMAIN = 200;

/**
 * Edits a world lens allows: additions, and removing a region the library
 * made itself (`assertOwnWorldRegion`). Nothing moves the published map.
 */
const WORLD_OPS: ReadonlySet<LensEditOp> = new Set([
  "create-region",
  "remove-region",
  "set-alias",
  "remove-alias",
  "place",
]);

export interface LensEditResult {
  created: number;
  renamed: number;
  reordered: number;
  moved: number;
  removed: number;
  aliases: number;
  placed: number;
}

function cleanName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_PLACE_NAME).trim();
}

function cleanText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_CURATION_TEXT).trim();
}

function assertKey(key: unknown): string {
  if (
    typeof key !== "string" ||
    key.length > MAX_KEY ||
    !REGION_KEY.test(key)
  ) {
    throw new LensEditError(
      "bad-edit",
      `"${String(key)}" is no region key: lower-case segments joined by dots.`,
    );
  }
  return key;
}

/** A domain prefix as aliases hold it: lower case, `/`-separated, trimmed. */
export function normalizeDomainPrefix(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new LensEditError("bad-edit", "An alias needs a domain prefix.");
  }
  const prefix = raw
    .trim()
    .toLowerCase()
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
  if (!prefix || prefix.length > MAX_DOMAIN || /\s/.test(prefix)) {
    throw new LensEditError("bad-edit", `"${raw}" is no domain prefix.`);
  }
  return prefix;
}

/** The lens's id, created for the own planet; world lenses must exist. */
async function lensIdFor(db: Database, lens: LensDefinition): Promise<string> {
  assertLensOnLibrary(lens, await ownPlanetOf(db));
  if (lens.planet !== "welt") return ensureLensRow(db, lens);
  const id = await findLensId(db, lens.planet, lens.kind);
  if (!id) throw new Error(`Atlas lens ${lens.kind} is missing`);
  return id;
}

/** Keys of a region and everything below it. */
function subtreeIds(rows: LensRows, regionId: string): string[] {
  const children = new Map<string, string[]>();
  for (const region of rows.regions) {
    if (!region.parentId) continue;
    const list = children.get(region.parentId) ?? [];
    list.push(region.id);
    children.set(region.parentId, list);
  }
  const out: string[] = [];
  const stack = [regionId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (out.includes(id)) continue;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/** Clear the land of these regions; the next settle lays it out again. */
async function clearLand(
  db: Database,
  lensId: string,
  regionIds: readonly string[],
): Promise<void> {
  for (let i = 0; i < regionIds.length; i += 500) {
    const chunk = regionIds.slice(i, i + 500);
    await db
      .prepare(
        `DELETE FROM atlas_land WHERE lens_id = ? AND region_id IN (${chunk
          .map(() => "?")
          .join(", ")})`,
      )
      .run(lensId, ...chunk);
  }
}

/** Domain prefixes that published content uses or the seed maps. */
async function assertAliasForOwnKnowledge(
  db: Database,
  prefix: string,
): Promise<void> {
  if (weltwissenSeedRows().aliases.some((a) => a.domainPrefix === prefix)) {
    throw new LensEditError(
      "published-alias",
      `"${prefix}" is part of the published map; a library adds aliases for its own units only.`,
    );
  }
  const atom = await db
    .prepare(
      `SELECT 1 FROM learning_atoms
        WHERE lower(domain) = ? OR lower(domain) LIKE ?
        LIMIT 1`,
    )
    .get(prefix, `${prefix}/%`);
  if (atom) {
    throw new LensEditError(
      "published-alias",
      `Published units use "${prefix}"; a library adds aliases for its own units only.`,
    );
  }
}

/**
 * A world region the library may remove: one it made itself. A region of the
 * published map (the Weltwissen seed, until the central service ships it) or
 * one a published unit sits in stays where it is.
 */
async function assertOwnWorldRegion(
  db: Database,
  lens: LensDefinition,
  rows: LensRows,
  regionIds: readonly string[],
): Promise<void> {
  const ids = new Set(regionIds);
  const keys = new Set(
    rows.regions.filter((r) => ids.has(r.id)).map((r) => r.key),
  );
  const seed = new Set(weltwissenSeedRows().regions.map((r) => r.key));
  const seeded = [...keys].find((key) => seed.has(key));
  if (seeded) {
    throw new LensEditError(
      "world-structure",
      `"${seeded}" is part of the published map; a library removes only regions it made itself.`,
    );
  }
  const { placements } = await lensPlacements(db, lens, rows);
  const published = placements.find(
    (p) =>
      p.unitKey.startsWith("atom:") &&
      p.path.some((step) => keys.has(step.key)),
  );
  if (published) {
    throw new LensEditError(
      "published-unit",
      `${published.unitKey} is published and sits in this region; it keeps the published map's place.`,
    );
  }
}

/**
 * Edits that can change a unit's planet without placing it: a removed region
 * takes its placements along, and an alias decides what a world rule covers.
 */
const PLANET_EDITS: ReadonlySet<string> = new Set([
  "remove-region",
  "set-alias",
  "remove-alias",
]);

async function unitPlanetsNow(
  db: Database,
): Promise<{ units: UnitRow[]; planets: Map<UnitKey, PlanetKind> }> {
  const units = await loadUnits(db);
  const planets = await loadUnitPlanets(
    db,
    units,
    await loadBindings(db),
    await ownPlanetOf(db),
  );
  return { units, planets };
}

/**
 * Refuse edits after which world knowledge would depend on a Firma or Privat
 * unit through a thread or a prerequisite that did not cross before
 * (Decision 2). Called inside the edit's transaction, so a refusal undoes it.
 */
async function assertNoNewCrossing(
  db: Database,
  before: ReadonlyMap<UnitKey, PlanetKind>,
): Promise<void> {
  const { units, planets: after } = await unitPlanetsNow(db);
  const crossing = newWorldCrossing(
    await directedThreadEnds(db, units),
    before,
    after,
  );
  if (!crossing) return;
  const { a, b } = crossing;
  const unit = before.get(a) !== after.get(a) ? a : b;
  throw new PlanetError(
    "held-by-thread",
    `The edit would put ${unit} on the ${after.get(unit)} planet, and a thread or prerequisite between ${a} and ${b} would let world knowledge depend on a Firma or Privat unit.`,
  );
}

/**
 * Apply edits to one lens, in order. A world lens keeps the published map: it
 * takes additions, removes only regions the library made itself, and places
 * own units only (a published unit keeps the published map's place).
 * Edits that would let world knowledge depend on a Firma or Privat unit are
 * refused (`PlanetError`); the caller's transaction undoes the batch.
 */
export async function applyLensEdits(
  db: Database,
  lens: LensDefinition,
  edits: readonly LensEdit[],
  opts: { placedBy: PlacedBy },
): Promise<LensEditResult> {
  if (edits.length > MAX_LENS_EDITS) {
    throw new LensEditError(
      "bad-edit",
      `At most ${MAX_LENS_EDITS} edits per call.`,
    );
  }
  const lensId = await lensIdFor(db, lens);
  const world = lens.planet === "welt";
  const depth = lens.levels.length;
  const result: LensEditResult = {
    created: 0,
    renamed: 0,
    reordered: 0,
    moved: 0,
    removed: 0,
    aliases: 0,
    placed: 0,
  };
  const planetsBefore = edits.some((edit) => PLANET_EDITS.has(edit.op))
    ? (await unitPlanetsNow(db)).planets
    : null;

  for (const edit of edits) {
    if (world && !WORLD_OPS.has(edit.op)) {
      throw new LensEditError(
        "world-structure",
        `A world lens keeps the published map; "${edit.op}" would move it. It takes additions and removes only regions the library made itself.`,
      );
    }
    const rows = await loadLensRows(db, lensId);
    const byKey = new Map(rows.regions.map((r) => [r.key, r]));
    const region = (key: unknown) => {
      const found = byKey.get(assertKey(key));
      if (!found) {
        throw new LensEditError(
          "unknown-region",
          `No region "${String(key)}" in the ${lens.name} lens.`,
        );
      }
      return found;
    };

    switch (edit.op) {
      case "create-region": {
        const name = cleanName(edit.name);
        if (!name)
          throw new LensEditError("bad-edit", "A region needs a name.");
        const parent =
          edit.parent === undefined || edit.parent === null
            ? null
            : region(edit.parent);
        const level = parent ? parent.level + 1 : 0;
        if (level >= depth) {
          throw new LensEditError(
            "too-deep",
            `The ${lens.name} lens has ${depth} levels; "${name}" would be below its last.`,
          );
        }
        const key = assertKey(
          edit.key ??
            (parent ? `${parent.key}.${slugSegment(name)}` : slugSegment(name)),
        );
        const existing = byKey.get(key);
        if (existing) {
          if (existing.parentId !== (parent?.id ?? null)) {
            throw new LensEditError(
              "bad-edit",
              `"${key}" already sits elsewhere in the ${lens.name} lens.`,
            );
          }
          break;
        }
        await db
          .prepare(
            `INSERT INTO atlas_regions (id, lens_id, parent_id, level, key, name, rank)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            ulid(),
            lensId,
            parent?.id ?? null,
            level,
            key,
            name,
            Number.isInteger(edit.rank) ? edit.rank : 0,
          );
        result.created++;
        break;
      }
      case "rename-region": {
        const target = region(edit.key);
        const name = cleanName(edit.name);
        if (!name)
          throw new LensEditError("bad-edit", "A region needs a name.");
        await db
          .prepare(`UPDATE atlas_regions SET name = ? WHERE id = ?`)
          .run(name, target.id);
        result.renamed++;
        break;
      }
      case "reorder-region": {
        const target = region(edit.key);
        if (!Number.isInteger(edit.rank)) {
          throw new LensEditError("bad-edit", "A rank is a whole number.");
        }
        await db
          .prepare(`UPDATE atlas_regions SET rank = ? WHERE id = ?`)
          .run(edit.rank, target.id);
        result.reordered++;
        break;
      }
      case "move-region": {
        const target = region(edit.key);
        const parent = region(edit.parent);
        if (target.level !== parent.level + 1) {
          throw new LensEditError(
            "bad-edit",
            `"${target.key}" can move only below a region of level ${target.level - 1}.`,
          );
        }
        const moved = subtreeIds(rows, target.id);
        if (moved.includes(parent.id)) {
          throw new LensEditError(
            "bad-edit",
            `"${target.key}" cannot move below itself.`,
          );
        }
        if (target.parentId === parent.id) break;
        await db
          .prepare(`UPDATE atlas_regions SET parent_id = ? WHERE id = ?`)
          .run(parent.id, target.id);
        await clearLand(db, lensId, moved);
        result.moved++;
        break;
      }
      case "remove-region": {
        const target = region(edit.key);
        const subtree = subtreeIds(rows, target.id);
        if (world) await assertOwnWorldRegion(db, lens, rows, subtree);
        // Children, placements, aliases, land and an island go with it; the
        // units fall back to the lens's rules at the next settle.
        await clearLand(db, lensId, subtree);
        await db
          .prepare(`DELETE FROM atlas_regions WHERE id = ?`)
          .run(target.id);
        result.removed++;
        break;
      }
      case "set-alias": {
        const prefix = normalizeDomainPrefix(edit.domain);
        const target = region(edit.region);
        if (world) await assertAliasForOwnKnowledge(db, prefix);
        await db
          .prepare(
            `INSERT INTO atlas_domain_aliases (lens_id, domain_prefix, region_id)
             VALUES (?, ?, ?)
             ON CONFLICT (lens_id, domain_prefix) DO UPDATE SET region_id = excluded.region_id`,
          )
          .run(lensId, prefix, target.id);
        result.aliases++;
        break;
      }
      case "remove-alias": {
        const prefix = normalizeDomainPrefix(edit.domain);
        if (world) await assertAliasForOwnKnowledge(db, prefix);
        await db
          .prepare(
            `DELETE FROM atlas_domain_aliases WHERE lens_id = ? AND domain_prefix = ?`,
          )
          .run(lensId, prefix);
        result.aliases++;
        break;
      }
      case "place": {
        const unit = String(edit.unit);
        if (!/^(atom|token):[A-Za-z0-9_-]+$/.test(unit)) {
          throw new LensEditError("bad-edit", `"${unit}" names no unit.`);
        }
        if (world && unit.startsWith("atom:")) {
          throw new LensEditError(
            "published-unit",
            `${unit} is published: it keeps the published map's place.`,
          );
        }
        if (
          unit.startsWith("token:") &&
          !(await db
            .prepare(`SELECT 1 FROM tokens WHERE id = ? AND atom_id IS NULL`)
            .get(unit.slice("token:".length)))
        ) {
          throw new LensEditError(
            "bad-edit",
            `"${unit}" is no unit of this library.`,
          );
        }
        region(edit.region);
        await placeUnits(
          db,
          lens,
          edit.region,
          [
            {
              unitKey: unit as UnitKey,
              below: Array.isArray(edit.below) ? edit.below.map(String) : [],
            },
          ],
          opts.placedBy,
        );
        result.placed++;
        break;
      }
      default:
        throw new LensEditError(
          "bad-edit",
          `Unknown edit "${String((edit as { op?: unknown }).op)}".`,
        );
    }
  }
  if (planetsBefore) await assertNoNewCrossing(db, planetsBefore);
  if (edits.length > 0) {
    await db
      .prepare(`UPDATE atlas_lenses SET updated_at = ? WHERE id = ?`)
      .run(nowIso(), lensId);
  }
  return result;
}

// ── Replacement and staleness ────────────────────────────────────────────────

export interface LensProposal {
  /** The one named source the order comes from, such as "Teamliste 2026-10". */
  source: string;
  /** Parents before their children; `parent` null for an island. */
  regions: Array<{
    key: string;
    name: string;
    parent: string | null;
    rank?: number;
  }>;
  aliases?: Array<{ domain: string; region: string }>;
  members?: Array<{ unit: string; region: string }>;
}

export interface LensCuration {
  /** The source the lens follows, once a replacement was accepted. */
  source: string | null;
  stale: { at: string; note: string | null } | null;
  proposal: {
    source: string;
    at: string;
    by: string | null;
    regions: number;
    members: number;
  } | null;
}

/** Validate a proposal against a lens; throws `bad-proposal`. Pure. */
export function validateLensProposal(
  lens: LensDefinition,
  raw: unknown,
): LensProposal {
  const fail = (message: string): never => {
    throw new LensEditError("bad-proposal", message);
  };
  if (!raw || typeof raw !== "object") fail("A proposal is an object.");
  const input = raw as Record<string, unknown>;
  const source = cleanText(input.source);
  if (!source) fail("A proposal names its one source.");
  if (!Array.isArray(input.regions) || input.regions.length === 0) {
    fail("A proposal holds the whole order: its regions.");
  }
  const regionsIn = input.regions as unknown[];
  if (regionsIn.length > MAX_PROPOSAL_REGIONS) {
    fail(`At most ${MAX_PROPOSAL_REGIONS} regions.`);
  }
  const levelOf = new Map<string, number>();
  const regions: LensProposal["regions"] = [];
  for (const item of regionsIn) {
    const r = (item ?? {}) as Record<string, unknown>;
    const key = typeof r.key === "string" ? r.key : "";
    if (!REGION_KEY.test(key) || key.length > MAX_KEY) {
      fail(`"${key}" is no region key.`);
    }
    if (levelOf.has(key)) fail(`"${key}" appears twice.`);
    const name = cleanName(r.name);
    if (!name) fail(`"${key}" needs a name.`);
    const parent =
      r.parent === null || r.parent === undefined ? null : String(r.parent);
    let level = 0;
    if (parent !== null) {
      const parentLevel = levelOf.get(parent);
      if (parentLevel === undefined) {
        fail(`"${key}" names parent "${parent}" before it is listed.`);
      }
      level = (parentLevel as number) + 1;
    }
    if (level >= lens.levels.length) {
      fail(`"${key}" lies below the ${lens.name} lens's last level.`);
    }
    levelOf.set(key, level);
    regions.push({
      key,
      name,
      parent,
      ...(Number.isInteger(r.rank) ? { rank: r.rank as number } : {}),
    });
  }
  const aliases: NonNullable<LensProposal["aliases"]> = [];
  for (const item of Array.isArray(input.aliases) ? input.aliases : []) {
    const a = (item ?? {}) as Record<string, unknown>;
    const domain = normalizeDomainPrefix(a.domain);
    const region = String(a.region ?? "");
    if (!levelOf.has(region)) fail(`Alias "${domain}" names no region.`);
    aliases.push({ domain, region });
  }
  const members: NonNullable<LensProposal["members"]> = [];
  for (const item of Array.isArray(input.members) ? input.members : []) {
    const m = (item ?? {}) as Record<string, unknown>;
    const unit = String(m.unit ?? "");
    if (!/^token:[A-Za-z0-9_-]+$/.test(unit)) {
      fail(`"${unit}" is no own unit: only own units sit on the own planet.`);
    }
    const region = String(m.region ?? "");
    if (!levelOf.has(region)) fail(`"${unit}" names no region.`);
    members.push({ unit, region });
  }
  return { source, regions, aliases, members };
}

async function ownLensId(db: Database, lens: LensDefinition): Promise<string> {
  if (lens.planet === "welt") {
    throw new LensEditError(
      "not-own-planet",
      "Only the own planet's lenses follow a source; the world's comes with published content.",
    );
  }
  return lensIdFor(db, lens);
}

/**
 * Store a proposed replacement as the lens's one pending proposal; a newer
 * one replaces an older. Nothing changes on the map until a curator accepts.
 */
export async function proposeLensReplacement(
  db: Database,
  lens: LensDefinition,
  raw: unknown,
  by: string,
): Promise<LensCuration> {
  const proposal = validateLensProposal(lens, raw);
  const lensId = await ownLensId(db, lens);
  await db
    .prepare(
      `UPDATE atlas_lenses
          SET proposal = ?, proposal_source = ?, proposed_at = ?, proposed_by = ?
        WHERE id = ?`,
    )
    .run(JSON.stringify(proposal), proposal.source, nowIso(), by, lensId);
  return (await lensCuration(db, lens)) as LensCuration;
}

/**
 * Accept the pending proposal: the lens's regions, aliases, placements and
 * land are replaced by the proposal's, and the lens follows its source.
 * Rejecting only drops the proposal. A replacement after which world
 * knowledge would depend on a Firma or Privat unit is refused
 * (`held-by-thread`); run it in a transaction, so a refusal changes nothing.
 */
export async function acceptLensProposal(
  db: Database,
  lens: LensDefinition,
  opts: { reject?: boolean } = {},
): Promise<{ accepted: boolean; regions: number; members: number }> {
  const lensId = await ownLensId(db, lens);
  const row = (await db
    .prepare(`SELECT proposal FROM atlas_lenses WHERE id = ?`)
    .get(lensId)) as { proposal: string | null } | undefined;
  if (!row?.proposal) {
    throw new LensEditError(
      "no-proposal",
      `No proposal waits for ${lens.name}.`,
    );
  }
  const clear = async (source?: string) => {
    await db
      .prepare(
        `UPDATE atlas_lenses
            SET proposal = NULL, proposal_source = NULL, proposed_at = NULL,
                proposed_by = NULL${source !== undefined ? ", source = ?, stale_at = NULL, stale_note = NULL, updated_at = ?" : ""}
          WHERE id = ?`,
      )
      .run(...(source !== undefined ? [source, nowIso()] : []), lensId);
  };
  if (opts.reject) {
    await clear();
    return { accepted: false, regions: 0, members: 0 };
  }
  // Validated again: a stored row may predate a tighter rule.
  const proposal = validateLensProposal(lens, JSON.parse(row.proposal));
  // A unit the new order leaves out falls back to the rules, maybe onto the
  // world planet: checked over the whole replacement, below.
  const planetsBefore = (await unitPlanetsNow(db)).planets;
  // Regions cascade to their placements, aliases, land and islands.
  await db.prepare(`DELETE FROM atlas_regions WHERE lens_id = ?`).run(lensId);
  const idOf = new Map<string, string>();
  const levelOf = new Map<string, number>();
  for (const region of proposal.regions) {
    const id = ulid();
    const level = region.parent ? (levelOf.get(region.parent) ?? 0) + 1 : 0;
    await db
      .prepare(
        `INSERT INTO atlas_regions (id, lens_id, parent_id, level, key, name, rank)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        lensId,
        region.parent ? (idOf.get(region.parent) ?? null) : null,
        level,
        region.key,
        region.name,
        region.rank ?? 0,
      );
    idOf.set(region.key, id);
    levelOf.set(region.key, level);
  }
  for (const alias of proposal.aliases ?? []) {
    await db
      .prepare(
        `INSERT INTO atlas_domain_aliases (lens_id, domain_prefix, region_id)
         VALUES (?, ?, ?)
         ON CONFLICT (lens_id, domain_prefix) DO UPDATE SET region_id = excluded.region_id`,
      )
      .run(lensId, alias.domain, idOf.get(alias.region) as string);
  }
  let members = 0;
  for (const member of proposal.members ?? []) {
    const exists = await db
      .prepare(`SELECT 1 FROM tokens WHERE id = ? AND atom_id IS NULL`)
      .get(member.unit.slice("token:".length));
    if (!exists) continue;
    try {
      await placeUnits(
        db,
        lens,
        member.region,
        [{ unitKey: member.unit as UnitKey, below: [] }],
        "curator",
      );
    } catch (error) {
      // A thread or a variant keeps the unit where it is; the rest of the
      // order still holds. The refusal comes before any write.
      if (
        error instanceof PlanetError &&
        (error.code === "held-by-thread" || error.code === "variant-is-world")
      ) {
        continue;
      }
      throw error;
    }
    members++;
  }
  // Refused, the caller's transaction keeps the old order and the proposal.
  await assertNoNewCrossing(db, planetsBefore);
  await clear(proposal.source);
  return { accepted: true, regions: proposal.regions.length, members };
}

/** The agent's verdict on whether a lens still fits its source. */
export async function markLensStale(
  db: Database,
  lens: LensDefinition,
  opts: { stale: boolean; note?: string },
): Promise<LensCuration> {
  // A world lens has no source to fall behind (review round 2).
  const lensId = await ownLensId(db, lens);
  const note = cleanText(opts.note) || null;
  await db
    .prepare(
      `UPDATE atlas_lenses SET stale_at = ?, stale_note = ? WHERE id = ?`,
    )
    .run(opts.stale ? nowIso() : null, opts.stale ? note : null, lensId);
  return (await lensCuration(db, lens)) as LensCuration;
}

/** What curators see of a lens's curation; null when the lens is not stored. */
export async function lensCuration(
  db: Database,
  lens: LensDefinition,
): Promise<LensCuration | null> {
  const lensId = await findLensId(db, lens.planet, lens.kind);
  if (!lensId) return null;
  const row = (await db
    .prepare(
      `SELECT source, stale_at, stale_note, proposal, proposal_source,
              proposed_at, proposed_by
         FROM atlas_lenses WHERE id = ?`,
    )
    .get(lensId)) as
    | {
        source: string | null;
        stale_at: string | null;
        stale_note: string | null;
        proposal: string | null;
        proposal_source: string | null;
        proposed_at: string | null;
        proposed_by: string | null;
      }
    | undefined;
  if (!row) return null;
  let proposal: LensCuration["proposal"] = null;
  if (row.proposal) {
    try {
      const parsed = JSON.parse(row.proposal) as LensProposal;
      proposal = {
        source: row.proposal_source ?? parsed.source,
        at: row.proposed_at ?? "",
        by: row.proposed_by,
        regions: parsed.regions?.length ?? 0,
        members: parsed.members?.length ?? 0,
      };
    } catch {
      proposal = null;
    }
  }
  return {
    source: row.source,
    stale: row.stale_at ? { at: row.stale_at, note: row.stale_note } : null,
    proposal,
  };
}
