/**
 * The world planet's lenses (ADR 2026-10-13, Decision 3).
 *
 * - **Weltwissen** (Bereich › Fach › Gebiet › Thema) orders units by their
 *   domain path through aliases. The Thema comes from the curriculum binding
 *   or the next domain segment.
 * - **Schule** (Klasse › Fach › Lernbereich) orders them by curriculum
 *   binding: a unit bound to several grades sits on the earliest.
 *
 * An explicit `atlas_members` row wins over every rule. Both derivations are
 * pure over loaded rows, so a read can place units without writing anything.
 * Regions the rules name but the database does not hold yet are simply new
 * paths; Phase 5's settle writes them.
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { hueKeyForDomain } from "./palette.js";
import {
  type BuiltInLensKind,
  type LensKind,
  type PlanetKind,
  type UnitKey,
  unitKeyFor,
} from "./types.js";
import {
  WELTWISSEN_SEED,
  WELTWISSEN_SUBJECT_ALIASES,
} from "./weltwissen-seed.js";

// ── Rows ─────────────────────────────────────────────────────────────────────

/** One learning unit of the library, with what the lenses need to place it. */
export interface UnitRow {
  key: UnitKey;
  title: string;
  domain: string;
  atomId: string | null;
  tokenIds: string[];
  /**
   * Status (Decision 2): true when the library wrote the unit itself. Only
   * published content arrives as atoms, so a unit without an atom is own.
   */
  own: boolean;
  /** First LehrplanPLUS link among the unit's tokens, for units without an atom. */
  curriculumLink: string | null;
}

export interface BindingRow {
  atomId: string;
  provider: string;
  schoolType: string;
  grade: number | null;
  track: string;
  subject: string;
  topicCode: string;
  topicTitle: string | null;
}

export interface RegionRow {
  id: string;
  key: string;
  name: string;
  level: number;
  parentId: string | null;
  rank: number;
}

export interface AliasRow {
  domainPrefix: string;
  regionId: string;
}

export interface MemberRow {
  unitKey: UnitKey;
  regionId: string;
}

/** Everything one lens stores, loaded once per read. */
export interface LensRows {
  regions: RegionRow[];
  aliases: AliasRow[];
  members: MemberRow[];
}

export interface PathStep {
  key: string;
  name: string;
  level: number;
  /** Reading order among siblings: lower first, ties by key. */
  rank: number;
}

/** Rank of regions that sort after every seeded or graded sibling. */
export const LAST_RANK = 1000;

export interface DerivedPlacement {
  unitKey: UnitKey;
  /** Island first, leaf last. */
  path: PathStep[];
  source: "member" | "alias" | "binding" | "unsorted";
}

// ── Lens definitions ─────────────────────────────────────────────────────────

export interface LensDefinition {
  planet: PlanetKind;
  kind: LensKind;
  name: string;
  levels: string[];
  colourLevel: number;
}

export const WELTWISSEN_LENS: LensDefinition = {
  planet: "welt",
  kind: "weltwissen",
  name: "Weltwissen",
  levels: ["Bereich", "Fach", "Gebiet", "Thema"],
  colourLevel: 1,
};

export const SCHULE_LENS: LensDefinition = {
  planet: "welt",
  kind: "schule",
  name: "Schule",
  levels: ["Klasse", "Fach", "Lernbereich"],
  colourLevel: 1,
};

/**
 * The Privat planet's lens on a personal library: the agent sorts by
 * domains, and until it does, a domain's first segment is the Bereich.
 */
export const LEBEN_LENS: LensDefinition = {
  planet: "privat",
  kind: "leben",
  name: "Leben",
  levels: ["Bereich", "Thema"],
  colourLevel: 0,
};

/** The Firma planet's default lens: the product landscape (Decision 3). */
export const PRODUKTE_LENS: LensDefinition = {
  planet: "firma",
  kind: "produkte",
  name: "Produkte",
  levels: ["Produktlinie", "Produkt", "Komponente"],
  colourLevel: 1,
};

/** The Firma planet's optional lens: who is responsible, curated. */
export const UNTERNEHMEN_LENS: LensDefinition = {
  planet: "firma",
  kind: "unternehmen",
  name: "Unternehmen",
  levels: ["Organisation", "Bereich", "Team", "Verantwortung"],
  colourLevel: 2,
};

/** Every lens ZAM defines itself, by kind. */
export const LENSES: Readonly<Record<BuiltInLensKind, LensDefinition>> = {
  weltwissen: WELTWISSEN_LENS,
  schule: SCHULE_LENS,
  leben: LEBEN_LENS,
  produkte: PRODUKTE_LENS,
  unternehmen: UNTERNEHMEN_LENS,
};

export function isBuiltInLensKind(kind: string): kind is BuiltInLensKind {
  return Object.hasOwn(LENSES, kind);
}

/**
 * The form of a custom lens's kind: a slug that is its permanent id. Built-in
 * kinds have the same form, so a custom lens never takes one of their names.
 */
export const CUSTOM_LENS_KIND = /^[a-z][a-z0-9-]{1,39}$/;

interface LensRowFields {
  planet: string;
  kind: string;
  name: string;
  level_names: string;
  colour_level: number;
}

function customLensFrom(row: LensRowFields): LensDefinition | null {
  if (row.planet !== "firma" && row.planet !== "privat") return null;
  let levels: unknown;
  try {
    levels = JSON.parse(row.level_names);
  } catch {
    return null;
  }
  if (
    !Array.isArray(levels) ||
    levels.length === 0 ||
    !levels.every((level) => typeof level === "string")
  ) {
    return null;
  }
  return {
    planet: row.planet,
    kind: row.kind,
    name: row.name,
    levels: levels as string[],
    colourLevel: Math.min(Number(row.colour_level), levels.length - 1),
  };
}

/**
 * The custom lenses a library made on one planet (Decision 3), in the order
 * they were made. A built-in lens's row is never one of them.
 */
export async function loadCustomLenses(
  db: Database,
  planet: PlanetKind,
): Promise<LensDefinition[]> {
  const rows = (await db
    .prepare(
      `SELECT planet, kind, name, level_names, colour_level
         FROM atlas_lenses WHERE planet = ? ORDER BY created_at, kind`,
    )
    .all(planet)) as LensRowFields[];
  return rows
    .filter((row) => !isBuiltInLensKind(row.kind))
    .map(customLensFrom)
    .filter((lens): lens is LensDefinition => lens !== null);
}

/**
 * The lens of a kind: a built-in one, else the custom lens this library made
 * under that kind, else null. Whether the lens belongs to this library's
 * planets is the caller's to check.
 */
export async function resolveLensKind(
  db: Database,
  kind: string,
): Promise<LensDefinition | null> {
  if (isBuiltInLensKind(kind)) return LENSES[kind];
  if (!CUSTOM_LENS_KIND.test(kind)) return null;
  const row = (await db
    .prepare(
      `SELECT planet, kind, name, level_names, colour_level
         FROM atlas_lenses WHERE kind = ? AND planet IN ('firma', 'privat')`,
    )
    .get(kind)) as LensRowFields | undefined;
  return row ? customLensFrom(row) : null;
}

/** The island for units no Weltwissen rule covers. */
export const UNSORTED_KEY = "unsortiert";
/** The island for units without a curriculum binding. */
export const OUTSIDE_CURRICULUM_KEY = "ausserhalb";

// ── Loading ──────────────────────────────────────────────────────────────────

const LEHRPLANPLUS =
  /lehrplanplus\.bayern\.de\/fachlehrplan\/([a-z-]+)\/(\d{1,2})\/([a-z-]+)/i;

/** Tokens per `IN` list, well below every driver's parameter limit. */
const IN_CHUNK = 500;

/**
 * Every learning unit of the library, deprecated tokens left out. With
 * `tokenIds`, only the units of those tokens, each with only those tokens.
 */
export async function loadUnits(
  db: Database,
  opts: { tokenIds?: readonly string[] } = {},
): Promise<UnitRow[]> {
  const select = `SELECT t.id, t.slug, t.title, t.concept, t.domain, t.atom_id, t.source_link,
              a.title AS atom_title, a.domain AS atom_domain
         FROM tokens t
         LEFT JOIN learning_atoms a ON a.id = t.atom_id
        WHERE t.deprecated_at IS NULL`;
  let found: unknown[];
  if (opts.tokenIds) {
    found = [];
    const ids = [...new Set(opts.tokenIds)];
    for (let i = 0; i < ids.length; i += IN_CHUNK) {
      const chunk = ids.slice(i, i + IN_CHUNK);
      found.push(
        ...(await db
          .prepare(`${select} AND t.id IN (${chunk.map(() => "?").join(", ")})`)
          .all(...chunk)),
      );
    }
    // In id order, as the unfiltered query returns them.
    const idOf = (row: unknown) => (row as { id: string }).id;
    found.sort((a, b) => (idOf(a) < idOf(b) ? -1 : idOf(a) > idOf(b) ? 1 : 0));
  } else {
    found = await db.prepare(`${select} ORDER BY t.id`).all();
  }
  const rows = found as Array<{
    id: string;
    slug: string;
    title: string | null;
    concept: string | null;
    domain: string;
    atom_id: string | null;
    source_link: string | null;
    atom_title: string | null;
    atom_domain: string | null;
  }>;

  const units = new Map<UnitKey, UnitRow>();
  for (const row of rows) {
    // A dangling atom_id (atom row gone) falls back to the token itself.
    const atomId = row.atom_id && row.atom_title !== null ? row.atom_id : null;
    const key = unitKeyFor(row.id, atomId);
    const existing = units.get(key);
    const link =
      row.source_link && LEHRPLANPLUS.test(row.source_link)
        ? row.source_link
        : null;
    if (existing) {
      existing.tokenIds.push(row.id);
      existing.curriculumLink ??= link;
      continue;
    }
    units.set(key, {
      key,
      title: atomId
        ? (row.atom_title as string)
        : row.title?.trim() || row.concept?.trim() || row.slug,
      domain: (atomId ? row.atom_domain : row.domain) ?? row.domain,
      atomId,
      tokenIds: [row.id],
      own: atomId === null,
      curriculumLink: link,
    });
  }
  return [...units.values()];
}

export async function loadBindings(db: Database): Promise<BindingRow[]> {
  const rows = (await db
    .prepare(
      `SELECT atom_id, provider, school_type, grade, track, subject,
              topic_code, topic_title
         FROM atom_curriculum_bindings`,
    )
    .all()) as Array<{
    atom_id: string;
    provider: string;
    school_type: string;
    grade: number | null;
    track: string;
    subject: string;
    topic_code: string;
    topic_title: string | null;
  }>;
  return rows.map((row) => ({
    atomId: row.atom_id,
    provider: row.provider,
    schoolType: row.school_type,
    grade: row.grade === null ? null : Number(row.grade),
    track: row.track,
    subject: row.subject,
    topicCode: row.topic_code,
    topicTitle: row.topic_title,
  }));
}

/** The lens row's id, or null when it was never created. */
export async function findLensId(
  db: Database,
  planet: PlanetKind,
  kind: LensKind,
): Promise<string | null> {
  const row = (await db
    .prepare(`SELECT id FROM atlas_lenses WHERE planet = ? AND kind = ?`)
    .get(planet, kind)) as { id: string } | undefined;
  return row?.id ?? null;
}

/**
 * The lens row's id, created without regions where it is missing. World
 * lenses are seeded by `ensureWorldLenses`; this is for the own planet's.
 */
export async function ensureLensRow(
  db: Database,
  lens: LensDefinition,
): Promise<string> {
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO atlas_lenses
         (id, planet, kind, name, level_names, colour_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (planet, kind) DO NOTHING`,
    )
    .run(
      ulid(),
      lens.planet,
      lens.kind,
      lens.name,
      JSON.stringify(lens.levels),
      lens.colourLevel,
      now,
      now,
    );
  return (await findLensId(db, lens.planet, lens.kind)) as string;
}

/** Lens rows to read with: stored ones, or Weltwissen's seed before it is stored. */
export async function lensRowsForRead(
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

export async function loadLensRows(
  db: Database,
  lensId: string | null,
): Promise<LensRows> {
  if (!lensId) return { regions: [], aliases: [], members: [] };
  const regions = (await db
    .prepare(
      `SELECT id, key, name, level, parent_id, rank
         FROM atlas_regions WHERE lens_id = ?`,
    )
    .all(lensId)) as Array<{
    id: string;
    key: string;
    name: string;
    level: number;
    parent_id: string | null;
    rank: number;
  }>;
  const aliases = (await db
    .prepare(
      `SELECT domain_prefix, region_id FROM atlas_domain_aliases WHERE lens_id = ?`,
    )
    .all(lensId)) as Array<{ domain_prefix: string; region_id: string }>;
  const members = (await db
    .prepare(`SELECT unit_key, region_id FROM atlas_members WHERE lens_id = ?`)
    .all(lensId)) as Array<{ unit_key: string; region_id: string }>;
  return {
    regions: regions.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      level: Number(r.level),
      parentId: r.parent_id,
      rank: Number(r.rank),
    })),
    aliases: aliases.map((a) => ({
      domainPrefix: a.domain_prefix,
      regionId: a.region_id,
    })),
    members: members.map((m) => ({
      unitKey: m.unit_key as UnitKey,
      regionId: m.region_id,
    })),
  };
}

// ── Seeding ──────────────────────────────────────────────────────────────────

interface SeedRegion {
  key: string;
  name: string;
  level: number;
  parentKey: string | null;
  rank: number;
}

/** Seed regions of Weltwissen (Bereich, Fach, Gebiet) and their aliases. */
export function weltwissenSeedRows(): {
  regions: SeedRegion[];
  aliases: Array<{ domainPrefix: string; regionKey: string }>;
} {
  const regions: SeedRegion[] = [];
  const aliases: Array<{ domainPrefix: string; regionKey: string }> = [];
  const add = (prefix: string, regionKey: string) => {
    if (!aliases.some((a) => a.domainPrefix === prefix)) {
      aliases.push({ domainPrefix: prefix, regionKey });
    }
  };

  WELTWISSEN_SEED.forEach((bereich, bi) => {
    regions.push({
      key: bereich.key,
      name: bereich.name,
      level: 0,
      parentKey: null,
      rank: bi,
    });
    bereich.subjects.forEach((subject, si) => {
      const subjectKey = `${bereich.key}.${subject.key}`;
      regions.push({
        key: subjectKey,
        name: subject.name,
        level: 1,
        parentKey: bereich.key,
        rank: si,
      });
      const prefixes = [
        subject.key,
        ...Object.entries(WELTWISSEN_SUBJECT_ALIASES)
          .filter(([, alias]) => alias.subject === subject.key && !alias.area)
          .map(([raw]) => raw),
      ];
      subject.areas.forEach((area, ai) => {
        const areaKey = `${subjectKey}.${area.key}`;
        regions.push({
          key: areaKey,
          name: area.name,
          level: 2,
          parentKey: subjectKey,
          rank: ai,
        });
        for (const prefix of prefixes) {
          for (const raw of [area.key, ...area.from]) {
            add(`${prefix}/${raw}`, areaKey);
          }
        }
      });
      for (const prefix of prefixes) add(prefix, subjectKey);
      for (const [raw, alias] of Object.entries(WELTWISSEN_SUBJECT_ALIASES)) {
        if (alias.subject === subject.key && alias.area) {
          add(raw, `${subjectKey}.${alias.area}`);
        }
      }
    });
  });
  return { regions, aliases };
}

/**
 * Idempotent: creates the world planet's lenses, the Weltwissen seed regions
 * and their aliases where missing. Never renames, moves or deletes a row, so
 * a curator's later edits survive every run.
 */
export async function ensureWorldLenses(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const now = nowIso();
    const lensIds = new Map<LensKind, string>();
    for (const lens of [WELTWISSEN_LENS, SCHULE_LENS]) {
      let id = await findLensId(tx, lens.planet, lens.kind);
      if (!id) {
        id = ulid();
        await tx
          .prepare(
            `INSERT INTO atlas_lenses
               (id, planet, kind, name, level_names, colour_level, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            lens.planet,
            lens.kind,
            lens.name,
            JSON.stringify(lens.levels),
            lens.colourLevel,
            now,
            now,
          );
      }
      lensIds.set(lens.kind, id);
    }

    const lensId = lensIds.get("weltwissen") as string;
    const existing = await loadLensRows(tx, lensId);
    const idByKey = new Map(existing.regions.map((r) => [r.key, r.id]));
    const seed = weltwissenSeedRows();
    for (const region of seed.regions) {
      if (idByKey.has(region.key)) continue;
      const id = ulid();
      const parentId = region.parentKey
        ? (idByKey.get(region.parentKey) ?? null)
        : null;
      await tx
        .prepare(
          `INSERT INTO atlas_regions (id, lens_id, parent_id, level, key, name, rank)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          lensId,
          parentId,
          region.level,
          region.key,
          region.name,
          region.rank,
        );
      idByKey.set(region.key, id);
    }
    const aliased = new Set(existing.aliases.map((a) => a.domainPrefix));
    for (const alias of seed.aliases) {
      if (aliased.has(alias.domainPrefix)) continue;
      await tx
        .prepare(
          `INSERT INTO atlas_domain_aliases (lens_id, domain_prefix, region_id)
           VALUES (?, ?, ?)`,
        )
        .run(
          lensId,
          alias.domainPrefix,
          idByKey.get(alias.regionKey) as string,
        );
    }
  });
}

// ── Derivation ───────────────────────────────────────────────────────────────

/**
 * "elektrische-ladung" → "Elektrische ladung". Letters stay as written: a
 * spelled-out "ue" may be an umlaut ("uebung") or not ("feuer", "aktuell",
 * "value"), so guessing would misspell names.
 */
export function prettify(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * True when a stored region name is what an earlier `prettify` made of the
 * name derived today: it turned every "ae", "oe" and "ue" into an umlaut, so
 * "feuerwehr" was stored as "Feürwehr". Placing and settling rename such a
 * region; a curator's own name never matches.
 */
export function misspelledRegionName(stored: string, derived: string): boolean {
  const lower = derived.charAt(0).toLowerCase() + derived.slice(1);
  const umlauts = lower
    .replace(/ae/g, "ä")
    .replace(/oe/g, "ö")
    .replace(/ue/g, "ü");
  const old = umlauts.charAt(0).toUpperCase() + umlauts.slice(1);
  return old !== derived && stored === old;
}

/** A key segment: lower case, umlauts spelled out, no dots or spaces. */
export function slugSegment(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "allgemein";
}

/**
 * A Thema name from a curriculum topic: without "Mathematik 9:" and without a
 * leading "Geometrie – " that only repeats the Gebiet or Fach.
 */
export function cleanTopic(
  topic: string,
  subjectName: string,
  areaName: string,
): string {
  let text = topic
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/^[^:]{2,40}\s\d+:\s*/, "")
    .trim();
  const dash = /^(.{2,30}?)\s+[–-]\s+(.+)$/.exec(text);
  if (dash) {
    const head = dash[1].toLowerCase();
    const repeats = [subjectName, areaName]
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean)
      .some((name) => name.includes(head) || head.includes(name));
    if (repeats) text = dash[2];
  }
  return text || topic.trim();
}

/** Bindings of each atom, earliest grade first (Decision 3). */
function bindingsByAtom(bindings: BindingRow[]): Map<string, BindingRow[]> {
  const byAtom = new Map<string, BindingRow[]>();
  for (const binding of bindings) {
    const list = byAtom.get(binding.atomId) ?? [];
    list.push(binding);
    byAtom.set(binding.atomId, list);
  }
  for (const list of byAtom.values()) {
    list.sort(
      (a, b) =>
        (a.grade ?? Number.MAX_SAFE_INTEGER) -
          (b.grade ?? Number.MAX_SAFE_INTEGER) ||
        a.schoolType.localeCompare(b.schoolType) ||
        a.topicCode.localeCompare(b.topicCode),
    );
  }
  return byAtom;
}

/** Path of a stored region, island first. */
function storedPath(
  regionId: string,
  byId: Map<string, RegionRow>,
): PathStep[] | null {
  const path: PathStep[] = [];
  let current = byId.get(regionId);
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) return null;
    seen.add(current.id);
    path.unshift({
      key: current.key,
      name: current.name,
      level: current.level,
      rank: current.rank,
    });
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path.length > 0 ? path : null;
}

function memberPlacement(
  unit: UnitRow,
  members: Map<UnitKey, string>,
  byId: Map<string, RegionRow>,
): DerivedPlacement | null {
  const regionId = members.get(unit.key);
  if (!regionId) return null;
  const path = storedPath(regionId, byId);
  return path ? { unitKey: unit.key, path, source: "member" } : null;
}

/** Weltwissen: Bereich › Fach › Gebiet › Thema. */
export function deriveWeltwissen(
  units: UnitRow[],
  rows: LensRows,
  bindings: BindingRow[],
): DerivedPlacement[] {
  const byId = new Map(rows.regions.map((r) => [r.id, r]));
  const aliasRegion = new Map(
    rows.aliases.map((a) => [a.domainPrefix.toLowerCase(), a.regionId]),
  );
  const members = new Map(rows.members.map((m) => [m.unitKey, m.regionId]));
  const byAtom = bindingsByAtom(bindings);

  return units.map((unit) => {
    const explicit = memberPlacement(unit, members, byId);
    if (explicit) return explicit;

    const segments = unit.domain
      .trim()
      .toLowerCase()
      .split("/")
      .filter(Boolean);
    if (segments[0] === "schule" && segments.length > 1) segments.shift();

    // Longest alias over whole segments: "physik/kinematik", then "physik".
    // A bare subject reads as its "allgemein" area, as the tiles mean it.
    const candidates: Array<[string, number]> =
      segments.length >= 2
        ? [
            [`${segments[0]}/${segments[1]}`, 2],
            [segments[0], 1],
          ]
        : segments.length === 1
          ? [
              [`${segments[0]}/allgemein`, 1],
              [segments[0], 1],
            ]
          : [];
    let hitPath: PathStep[] | null = null;
    let used = 0;
    for (const [prefix, n] of candidates) {
      const regionId = aliasRegion.get(prefix);
      if (!regionId) continue;
      hitPath = storedPath(regionId, byId);
      used = n;
      if (hitPath) break;
    }

    if (!hitPath) {
      // Grouped by raw domain, so the unsorted island still has structure.
      const root = segments[0] ?? "allgemein";
      const area = segments[1] ?? "allgemein";
      const thema = segments[2] ?? "allgemein";
      const fachKey = `${UNSORTED_KEY}.${slugSegment(root)}`;
      const gebietKey = `${fachKey}.${slugSegment(area)}`;
      return {
        unitKey: unit.key,
        path: [
          {
            key: UNSORTED_KEY,
            name: "Noch nicht eingeordnet",
            level: 0,
            rank: LAST_RANK,
          },
          { key: fachKey, name: prettify(root), level: 1, rank: 0 },
          { key: gebietKey, name: prettify(area), level: 2, rank: 0 },
          {
            key: `${gebietKey}.${slugSegment(thema)}`,
            name: prettify(thema),
            level: 3,
            rank: 0,
          },
        ],
        source: "unsorted",
      };
    }

    const path = [...hitPath];
    let rest = segments.slice(used);
    if (path.length === 2) {
      // The alias named only the Fach: the next segment is a new Gebiet.
      const area = rest[0] ?? "allgemein";
      path.push({
        key: `${path[1].key}.${slugSegment(area)}`,
        name: prettify(area),
        level: 2,
        rank: LAST_RANK,
      });
      rest = rest.slice(1);
    }

    const gebiet = path[path.length - 1];
    const binding = unit.atomId ? byAtom.get(unit.atomId)?.[0] : undefined;
    const themaName = binding?.topicTitle
      ? cleanTopic(binding.topicTitle, path[1]?.name ?? "", gebiet.name)
      : prettify(rest[0] ?? "allgemein");
    // Foundations first: a Thema taught in an earlier grade comes earlier.
    path.push({
      key: `${gebiet.key}.${slugSegment(themaName)}`,
      name: themaName,
      level: 3,
      rank: binding?.grade ?? LAST_RANK,
    });
    return {
      unitKey: unit.key,
      path: path.slice(0, 4),
      source: "alias",
    };
  });
}

const SCHOOL_TYPE_NAMES: Readonly<Record<string, string>> = {
  grundschule: "Grundschule",
  mittelschule: "Mittelschule",
  realschule: "Realschule",
  gymnasium: "Gymnasium",
  fachoberschule: "Fachoberschule",
  berufsoberschule: "Berufsoberschule",
  wirtschaftsschule: "Wirtschaftsschule",
};

/** A subject's name: the Weltwissen seed's, else its key made readable. */
export function subjectName(subject: string): string {
  const key = hueKeyForDomain(subject);
  for (const bereich of WELTWISSEN_SEED) {
    for (const s of bereich.subjects) if (s.key === key) return s.name;
  }
  return prettify(subject);
}

/** A subject's position in the seed, so every grade lists subjects alike. */
function subjectRank(subject: string): number {
  const key = hueKeyForDomain(subject);
  const order = WELTWISSEN_SEED.flatMap((bereich) =>
    bereich.subjects.map((s) => s.key),
  );
  const index = order.indexOf(key);
  return index < 0 ? LAST_RANK : index;
}

interface SchoolPlace {
  schoolType: string;
  grade: number | null;
  subject: string;
  lernbereich: string;
}

/** Schule: Klasse › Fach › Lernbereich. */
export function deriveSchule(
  units: UnitRow[],
  rows: LensRows,
  bindings: BindingRow[],
): DerivedPlacement[] {
  const byId = new Map(rows.regions.map((r) => [r.id, r]));
  const members = new Map(rows.members.map((m) => [m.unitKey, m.regionId]));
  const byAtom = bindingsByAtom(bindings);

  const places = new Map<UnitKey, SchoolPlace | null>();
  for (const unit of units) {
    const binding = unit.atomId ? byAtom.get(unit.atomId)?.[0] : undefined;
    if (binding) {
      const name = subjectName(binding.subject);
      places.set(unit.key, {
        schoolType: binding.schoolType,
        grade: binding.grade,
        subject: binding.subject,
        lernbereich: binding.topicTitle
          ? cleanTopic(binding.topicTitle, name, "")
          : binding.topicCode,
      });
      continue;
    }
    const link = unit.curriculumLink
      ? LEHRPLANPLUS.exec(unit.curriculumLink)
      : null;
    if (link) {
      const segments = unit.domain.split("/").filter(Boolean);
      places.set(unit.key, {
        schoolType: link[1].toLowerCase(),
        grade: Number(link[2]),
        subject: link[3].toLowerCase(),
        lernbereich: prettify(segments[1] ?? "allgemein"),
      });
      continue;
    }
    places.set(unit.key, null);
  }

  // Name grades by school type only when the library holds more than one.
  const schoolTypes = new Set(
    [...places.values()].filter((p) => p !== null).map((p) => p?.schoolType),
  );
  const several = schoolTypes.size > 1;

  return units.map((unit) => {
    const explicit = memberPlacement(unit, members, byId);
    if (explicit) return explicit;

    const place = places.get(unit.key);
    if (!place) {
      const segments = unit.domain.split("/").filter(Boolean);
      const root = segments[0] === "schule" ? segments[1] : segments[0];
      const fachKey = `${OUTSIDE_CURRICULUM_KEY}.${slugSegment(root ?? "allgemein")}`;
      return {
        unitKey: unit.key,
        path: [
          {
            key: OUTSIDE_CURRICULUM_KEY,
            name: "Außerhalb des Lehrplans",
            level: 0,
            rank: LAST_RANK,
          },
          {
            key: fachKey,
            name: subjectName(root ?? "allgemein"),
            level: 1,
            rank: subjectRank(root ?? ""),
          },
          {
            key: `${fachKey}.allgemein`,
            name: "Allgemein",
            level: 2,
            rank: 0,
          },
        ],
        source: "unsorted",
      };
    }

    const typeName =
      SCHOOL_TYPE_NAMES[place.schoolType] ?? prettify(place.schoolType);
    const islandKey =
      place.grade === null
        ? `${slugSegment(place.schoolType)}-ohne-klasse`
        : `${slugSegment(place.schoolType)}-${place.grade}`;
    const islandName =
      place.grade === null
        ? `${typeName}: ohne Klasse`
        : several
          ? `${place.grade}. Klasse ${typeName}`
          : `${place.grade}. Klasse`;
    const fachKey = `${islandKey}.${slugSegment(hueKeyForDomain(place.subject))}`;
    return {
      unitKey: unit.key,
      path: [
        {
          key: islandKey,
          name: islandName,
          level: 0,
          rank: place.grade ?? LAST_RANK - 1,
        },
        {
          key: fachKey,
          name: subjectName(place.subject),
          level: 1,
          rank: subjectRank(place.subject),
        },
        {
          key: `${fachKey}.${slugSegment(place.lernbereich)}`,
          name: place.lernbereich,
          level: 2,
          rank: 0,
        },
      ],
      source: "binding",
    };
  });
}

/** A domain's segments as the lenses read them, without a leading "schule". */
function domainSegments(domain: string): string[] {
  const segments = domain.trim().toLowerCase().split("/").filter(Boolean);
  if (segments[0] === "schule" && segments.length > 1) segments.shift();
  return segments;
}

/** Steps below `above` down to the lens's leaf, named by the next segments. */
function fillLevels(
  above: PathStep[],
  segments: readonly string[],
  depth: number,
  rank: number,
): PathStep[] {
  const path = [...above];
  let i = 0;
  while (path.length < depth) {
    const raw = segments[i++] ?? "allgemein";
    const parent = path[path.length - 1];
    const slug = slugSegment(raw);
    path.push({
      key: parent ? `${parent.key}.${slug}` : slug,
      name: prettify(raw),
      level: path.length,
      rank,
    });
  }
  return path;
}

/**
 * The own planet's lenses (Leben, Produkte, Unternehmen): an explicit
 * placement, else the longest domain alias, with the levels below it named
 * by the next domain segments. What no alias covers lands on the unsorted
 * island; in Leben a domain's first segment is the Bereich until the agent
 * sorts it.
 */
export function deriveDomainLens(
  units: UnitRow[],
  rows: LensRows,
  lens: LensDefinition,
): DerivedPlacement[] {
  const byId = new Map(rows.regions.map((r) => [r.id, r]));
  const aliasRegion = new Map(
    rows.aliases.map((a) => [a.domainPrefix.toLowerCase(), a.regionId]),
  );
  const members = new Map(rows.members.map((m) => [m.unitKey, m.regionId]));
  const depth = lens.levels.length;

  return units.map((unit) => {
    const explicit = memberPlacement(unit, members, byId);
    if (explicit) return explicit;
    const segments = domainSegments(unit.domain);
    for (let n = segments.length; n >= 1; n--) {
      const regionId = aliasRegion.get(segments.slice(0, n).join("/"));
      const hit = regionId ? storedPath(regionId, byId) : null;
      if (!hit || hit.length > depth) continue;
      return {
        unitKey: unit.key,
        path: fillLevels(hit, segments.slice(n), depth, LAST_RANK),
        source: "alias",
      };
    }
    if (lens.kind === "leben" && segments.length > 0) {
      return {
        unitKey: unit.key,
        path: fillLevels([], segments, depth, 0),
        source: "unsorted",
      };
    }
    const unsorted: PathStep = {
      key: UNSORTED_KEY,
      name: "Noch nicht eingeordnet",
      level: 0,
      rank: LAST_RANK,
    };
    return {
      unitKey: unit.key,
      path: fillLevels([unsorted], segments, depth, 0),
      source: "unsorted",
    };
  });
}

/** Where every given unit sits in a lens, by that lens's rules. Pure. */
export function deriveLens(
  lens: LensDefinition,
  units: UnitRow[],
  rows: LensRows,
  bindings: BindingRow[],
): DerivedPlacement[] {
  if (lens.kind === "weltwissen") {
    return deriveWeltwissen(units, rows, bindings);
  }
  if (lens.kind === "schule") return deriveSchule(units, rows, bindings);
  return deriveDomainLens(units, rows, lens);
}
