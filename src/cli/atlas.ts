/**
 * Bridge handlers for the knowledge atlas (ADR 2026-10-13, Decision 10).
 *
 * The CLI layer owns what the kernel must not: the machine-local alpha
 * switch, and whether this connection may write knowledge. PostgreSQL says
 * the latter through its grants (ADR 2026-09-04, Decision 7), so the check
 * asks the server instead of inventing a second notion of curator.
 */

import {
  type AtlasView,
  type BundledCellInfo,
  type CurriculumScope,
  chooseVariant,
  clearLibraryVariant,
  type Database,
  dialectOf,
  findBundledCellsForScope,
  getBundledCellEnrolment,
  getBundledCellTile,
  getSetting,
  installKvtTile,
  isBundledCellInstalled,
  type LensDefinition,
  type LensKind,
  listBundledCells,
  loadBindings,
  needsGenericCurriculumImport,
  type PlaceInfo,
  readAtlas,
  resolvePlace,
  SCHULE_LENS,
  type SettleResult,
  setLibraryVariant,
  setSetting,
  settleLens,
  snapshotForRead,
  type TakeResult,
  takeUnits,
  type UnitKey,
  undoVariant,
  WELTWISSEN_LENS,
} from "../kernel/index.js";
import {
  getAtlasConfig,
  setAtlasConfig,
} from "../kernel/system/install-config.js";
import type { MaterialAnalyzePlace } from "./llm/material-analyze.js";
import { learnerScope } from "./material-import.js";

/** Lenses the atlas offers so far: the world planet's two. */
export const ATLAS_LENSES: Readonly<Record<string, LensDefinition>> = {
  weltwissen: WELTWISSEN_LENS,
  schule: SCHULE_LENS,
};

export function atlasLens(kind: string | undefined): LensDefinition {
  const lens = ATLAS_LENSES[kind ?? "weltwissen"];
  if (!lens) {
    throw new Error(
      `Unknown atlas lens "${kind}". Choose ${Object.keys(ATLAS_LENSES).join(" or ")}.`,
    );
  }
  return lens;
}

const LENS_KEY = "atlas.lens";
const SHOW_NEW_KEY = "atlas.show_new";
const homeKey = (kind: LensKind) => `atlas.home.${kind}`;

/** Thrown when a write needs curator rights this connection lacks. */
export const NOT_CURATOR = "not-curator";

/**
 * Whether this connection may write the atlas's knowledge tables: always on
 * a library of its own, and on a team library only with the curator grants.
 */
export async function mayWriteKnowledge(db: Database): Promise<boolean> {
  if (dialectOf(db) !== "postgres") return true;
  const row = (await db
    .prepare(
      `SELECT has_table_privilege(current_user, 'atlas_land', 'INSERT') AS ok`,
    )
    .get()) as { ok: boolean | string | null } | undefined;
  return row?.ok === true || row?.ok === "t" || row?.ok === "true";
}

function isPermissionDenied(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "42501") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /permission denied/i.test(message);
}

// ── atlas-feature ────────────────────────────────────────────────────────────

export function atlasFeature(opts: { enable?: boolean; disable?: boolean }): {
  success: true;
  enabled: boolean;
} {
  if (opts.enable && opts.disable) {
    throw new Error("Pass either --enable or --disable, not both.");
  }
  if (opts.enable || opts.disable) {
    setAtlasConfig({ enabled: Boolean(opts.enable) });
  }
  return { success: true, enabled: getAtlasConfig().enabled === true };
}

// ── atlas-prefs ──────────────────────────────────────────────────────────────

export interface AtlasPrefs {
  lens: LensKind;
  showNew: boolean;
  /** Stored home path per lens, root first. */
  home: Partial<Record<LensKind, string[]>>;
}

function parsePath(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) && value.every((v) => typeof v === "string")
      ? value
      : [];
  } catch {
    return [];
  }
}

export async function readAtlasPrefs(db: Database): Promise<AtlasPrefs> {
  const lens = (await getSetting(db, LENS_KEY)) ?? "weltwissen";
  const home: AtlasPrefs["home"] = {};
  for (const kind of Object.keys(ATLAS_LENSES) as LensKind[]) {
    const path = parsePath(await getSetting(db, homeKey(kind)));
    if (path.length > 0) home[kind] = path;
  }
  return {
    lens: (ATLAS_LENSES[lens] ? lens : "weltwissen") as LensKind,
    showNew: (await getSetting(db, SHOW_NEW_KEY)) === "true",
    home,
  };
}

/**
 * Change the learner's atlas preferences. `home` is a region key of `lens`
 * (or of the primary lens); it is stored as its path, so a later lens edit
 * that removes it falls back to the nearest surviving ancestor. An empty
 * string clears the home.
 */
export async function setAtlasPrefs(
  db: Database,
  opts: { lens?: string; home?: string; showNew?: string },
): Promise<AtlasPrefs> {
  if (opts.lens !== undefined) {
    await setSetting(db, LENS_KEY, atlasLens(opts.lens).kind);
  }
  if (opts.showNew !== undefined) {
    if (opts.showNew !== "on" && opts.showNew !== "off") {
      throw new Error("--show-new must be on or off.");
    }
    await setSetting(db, SHOW_NEW_KEY, String(opts.showNew === "on"));
  }
  if (opts.home !== undefined) {
    const prefs = await readAtlasPrefs(db);
    const lens = atlasLens(opts.lens ?? prefs.lens);
    let path: string[] = [];
    if (opts.home !== "") {
      path = await regionPath(db, lens, opts.home);
      if (path.length === 0) {
        throw new Error(`No region "${opts.home}" in the ${lens.name} lens.`);
      }
    }
    await setSetting(db, homeKey(lens.kind), JSON.stringify(path));
  }
  return readAtlasPrefs(db);
}

/** Root-first key path of a region, stored or derived; empty when unknown. */
async function regionPath(
  db: Database,
  lens: LensDefinition,
  key: string,
): Promise<string[]> {
  const place = await resolvePlace(db, lens, key);
  return place ? place.path.map((step) => step.key) : [];
}

/** Whether a region lies in `regionKey`'s subtree, the region itself included. */
function inSubtree(
  view: AtlasView,
  region: string,
  regionKey: string,
): boolean {
  const parentOf = new Map(view.regions.map((r) => [r.key, r.parentKey]));
  let current: string | null | undefined = region;
  while (current) {
    if (current === regionKey) return true;
    current = parentOf.get(current);
  }
  return false;
}

// ── Neue Inhalte zeigen: the cells of the learner's year ─────────────────────

/**
 * Install the bundled cells of the learner's school year that are not
 * installed yet, so *Neue Inhalte zeigen* can sketch them (ADR 2026-10-13,
 * Decision 1). The subject of the last curriculum choice is left out: the
 * map shows the whole year. Installing enrols nobody (ADR 2026-08-14,
 * Decision 3). Without a known position, or without the right to write
 * knowledge, nothing is installed.
 */
export async function installScopeCells(db: Database): Promise<string[]> {
  const scope = await learnerScope(db);
  if (!scope || !(await mayWriteKnowledge(db))) return [];
  const { subject: _subject, ...year } = scope;
  const installed: string[] = [];
  for (const cell of findBundledCellsForScope(year)) {
    if (await isBundledCellInstalled(db, cell.id)) continue;
    const tile = getBundledCellTile(cell.id);
    if (!tile) continue;
    await installKvtTile(db, tile);
    installed.push(cell.id);
  }
  return installed;
}

// ── atlas-place: what an import at a region needs ────────────────────────────

export interface AtlasPlaceCell {
  id: string;
  title: string;
  gradeLabel: string;
  installed: boolean;
  enrolled: boolean;
  cardCount: number;
}

export interface AtlasPlaceResult {
  place: PlaceInfo;
  /** Published units the learner holds there: what a variant may stand in for. */
  units: Array<{ key: UnitKey; title: string }>;
  /** Bundled cells for the region, best first (the cell has precedence). */
  cells: AtlasPlaceCell[];
  /** The curriculum position of a Schule region; null on Weltwissen. */
  scope: CurriculumScope | null;
  /** Offer the generic curriculum wizard: no cell covers the position. */
  wizard: boolean;
}

/** The commonest binding of the atoms in a Schule region, as a scope. */
async function schuleScope(
  db: Database,
  atomIds: Set<string>,
  level: number,
): Promise<CurriculumScope | null> {
  const counts = new Map<string, { scope: CurriculumScope; n: number }>();
  for (const binding of await loadBindings(db)) {
    if (!atomIds.has(binding.atomId)) continue;
    const scope: CurriculumScope = {
      provider: binding.provider,
      schoolType: binding.schoolType || undefined,
      grade: binding.grade ?? undefined,
      // On the island (a grade) every subject belongs.
      subject: level >= 1 ? binding.subject || undefined : undefined,
    };
    const key = JSON.stringify(scope);
    const entry = counts.get(key) ?? { scope, n: 0 };
    entry.n++;
    counts.set(key, entry);
  }
  const best = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  return best?.scope ?? null;
}

/** Cells whose atoms fall into a Weltwissen region, by alias or by place. */
async function weltwissenCells(
  db: Database,
  regionKey: string,
  atomIds: Set<string>,
): Promise<BundledCellInfo[]> {
  const { snapshot } = await snapshotForRead(db, WELTWISSEN_LENS);
  const keyOf = new Map(snapshot.rows.regions.map((r) => [r.id, r.key]));
  const prefixesFor = (key: string) =>
    snapshot.rows.aliases
      .filter((alias) => {
        const target = keyOf.get(alias.regionId) ?? "";
        return target === key || target.startsWith(`${key}.`);
      })
      .map((alias) => alias.domainPrefix.toLowerCase());
  // A derived Thema has no aliases of its own: its Gebiet's stand in.
  let key = regionKey;
  let prefixes = prefixesFor(key);
  while (prefixes.length === 0 && key.includes(".")) {
    key = key.slice(0, key.lastIndexOf("."));
    prefixes = prefixesFor(key);
  }
  const matches = (domain: string) => {
    const lower = domain.toLowerCase();
    return prefixes.some((p) => lower === p || lower.startsWith(`${p}/`));
  };
  return listBundledCells().filter((cell) =>
    cell.atoms.some(
      (atom) => atomIds.has(atom.id) || matches(atom.domain ?? ""),
    ),
  );
}

export async function atlasPlace(
  db: Database,
  opts: { userId: string; lens?: string; region: string },
): Promise<AtlasPlaceResult & { success: true }> {
  const lens = atlasLens(opts.lens);
  const place = await resolvePlace(db, lens, opts.region);
  if (!place) {
    throw new Error(`No region "${opts.region}" in the ${lens.name} lens.`);
  }
  const view = await readAtlas(db, { userId: opts.userId, lens });
  const units = view.units
    .filter(
      (unit) =>
        !unit.own &&
        unit.cards > 0 &&
        inSubtree(view, unit.region, opts.region),
    )
    .map((unit) => ({ key: unit.key, title: unit.title }));

  const { snapshot } = await snapshotForRead(db, lens);
  const atomIds = new Set(
    snapshot.placements
      .filter((p) => p.path.some((step) => step.key === opts.region))
      .map((p) => p.unitKey)
      .filter((key) => key.startsWith("atom:"))
      .map((key) => key.slice("atom:".length)),
  );
  const level = place.path[place.path.length - 1].level;
  let scope: CurriculumScope | null = null;
  let found: BundledCellInfo[];
  if (lens.kind === "schule") {
    scope = await schuleScope(db, atomIds, level);
    found = scope ? findBundledCellsForScope(scope) : [];
  } else {
    found = await weltwissenCells(db, opts.region, atomIds);
  }
  const cells: AtlasPlaceCell[] = [];
  for (const cell of found.slice(0, 40)) {
    const status = await getBundledCellEnrolment(db, opts.userId, cell.id);
    cells.push({
      id: cell.id,
      title: cell.title,
      gradeLabel: cell.gradeLabel,
      ...status,
    });
  }
  return {
    success: true,
    place,
    units,
    cells,
    scope,
    wizard: scope ? needsGenericCurriculumImport(scope) : cells.length === 0,
  };
}

/** The place as a material import's producer is told about it. */
export async function materialPlace(
  db: Database,
  opts: { userId: string; lens?: string; region: string },
): Promise<MaterialAnalyzePlace> {
  const result = await atlasPlace(db, opts);
  return {
    lens: result.place.lens === "schule" ? "schule" : "weltwissen",
    regionKey: result.place.regionKey,
    path: result.place.path.map((step) => step.name),
    missingLevels: result.place.missingLevels,
    units: result.units,
  };
}

// ── atlas-take: Aufnehmen ────────────────────────────────────────────────────

/**
 * Take sketched units in: the named ones, or every unit in reach in a
 * region. Only on the learner's click.
 */
export async function atlasTake(
  db: Database,
  opts: {
    userId: string;
    units?: string[];
    lens?: string;
    region?: string;
  },
): Promise<TakeResult & { success: true }> {
  const keys = new Set<UnitKey>();
  for (const key of opts.units ?? []) keys.add(key as UnitKey);
  if (opts.region) {
    const lens = atlasLens(opts.lens);
    const view = await readAtlas(db, {
      userId: opts.userId,
      lens,
      showNew: true,
    });
    for (const unit of view.units) {
      if (unit.inReach && inSubtree(view, unit.region, opts.region)) {
        keys.add(unit.key);
      }
    }
  }
  if (keys.size === 0) throw new Error("Name units or a region to take in.");
  return { success: true, ...(await takeUnits(db, opts.userId, [...keys])) };
}

// ── atlas-variant ────────────────────────────────────────────────────────────

export async function atlasVariant(
  db: Database,
  opts: {
    userId: string;
    standsFor: string;
    variant?: string;
    undo?: boolean;
    library?: boolean;
  },
): Promise<{ success: true; detached?: number; reattached?: number }> {
  const standsFor = opts.standsFor as UnitKey;
  if (opts.library) {
    if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
    if (opts.variant) {
      await setLibraryVariant(db, {
        variant: opts.variant as UnitKey,
        standsFor,
        curatorId: opts.userId,
      });
    } else {
      await clearLibraryVariant(db, standsFor);
    }
    return { success: true };
  }
  if (opts.undo) {
    return {
      success: true,
      ...(await undoVariant(db, { userId: opts.userId, standsFor })),
    };
  }
  if (!opts.variant) throw new Error("Name the --variant that stands in.");
  return {
    success: true,
    ...(await chooseVariant(db, {
      userId: opts.userId,
      variant: opts.variant as UnitKey,
      standsFor,
    })),
  };
}

// ── atlas-read ───────────────────────────────────────────────────────────────

export async function atlasRead(
  db: Database,
  opts: { userId: string; lens?: string; planet?: string; now?: Date },
): Promise<AtlasView & { success: true }> {
  if (opts.planet !== undefined && opts.planet !== "welt") {
    throw new Error("Only the welt planet has lenses so far.");
  }
  const prefs = await readAtlasPrefs(db);
  const lens = atlasLens(opts.lens ?? prefs.lens);
  const view = await readAtlas(db, {
    userId: opts.userId,
    lens,
    now: opts.now,
    showNew: prefs.showNew,
    homePath: prefs.home[lens.kind],
    mayWrite: await mayWriteKnowledge(db),
  });
  return { success: true, ...view };
}

// ── atlas-settle ─────────────────────────────────────────────────────────────

export async function atlasSettle(
  db: Database,
  opts: { lens?: string },
): Promise<SettleResult & { success: true }> {
  const lens = atlasLens(opts.lens);
  if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
  try {
    return { success: true, ...(await settleLens(db, lens)) };
  } catch (error) {
    if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
    throw error;
  }
}
