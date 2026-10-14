/**
 * Bridge handlers for the knowledge atlas (ADR 2026-10-13, Decision 10).
 *
 * The CLI layer owns what the kernel must not: model calls (a Sinnbild
 * drawn by the text model), and whether this connection may write knowledge. PostgreSQL says
 * the latter through its grants (ADR 2026-09-04, Decision 7), so the check
 * asks the server instead of inventing a second notion of curator.
 */

import {
  type AtlasView,
  addConnection,
  assertLensOnLibrary,
  type BundledCellInfo,
  ConnectionError,
  type ConnectionScope,
  type CurriculumScope,
  chooseVariant,
  clearLibraryVariant,
  clearPersonalEmblem,
  clearSharedEmblem,
  type Database,
  dialectOf,
  type EmblemAuthor,
  EmblemError,
  type EmblemScope,
  ensureLensRow,
  ensureWorldLenses,
  findBundledCellsForScope,
  getBundledCellEnrolment,
  getBundledCellTile,
  getSetting,
  installKvtTile,
  isBundledCellInstalled,
  LENSES,
  type LensDefinition,
  type LensKind,
  libraryLenses,
  listBundledCells,
  loadBindings,
  type MovePlanetResult,
  moveUnitsToPlanet,
  needsGenericCurriculumImport,
  OWN_PLANET_SETTING,
  type OwnPlanet,
  ownPlanetOf,
  type PlaceInfo,
  type PlanetKind,
  parseEmblemSubject,
  parseOwnPlanet,
  placeUnits,
  readAtlas,
  removeConnection,
  resolvePlace,
  revalidateEmblems,
  type SettleResult,
  setEmblem,
  setLibraryVariant,
  setSetting,
  settleLens,
  snapshotForRead,
  subjectName,
  type TakeResult,
  type ThreadKind,
  takeUnits,
  type UnitKey,
  undoVariant,
  WELTWISSEN_LENS,
} from "../kernel/index.js";
import { drawEmblemViaLLM, type EmblemDrawDeps } from "./llm/emblem-draw.js";
import type { MaterialAnalyzePlace } from "./llm/material-analyze.js";
import { learnerScope } from "./material-import.js";

/** Every lens by kind; a library shows world's and its own planet's. */
export const ATLAS_LENSES: Readonly<Record<string, LensDefinition>> = LENSES;

export function atlasLens(kind: string | undefined): LensDefinition {
  const lens = ATLAS_LENSES[kind ?? "weltwissen"];
  if (!lens) {
    throw new Error(
      `Unknown atlas lens "${kind}". Choose ${Object.keys(ATLAS_LENSES).join(", ")}.`,
    );
  }
  return lens;
}

/**
 * A lens of this library: world knowledge's, or one of its own planet's. A
 * lens of the other planet is refused (ADR 2026-10-13, Decision 2).
 */
export async function libraryLens(
  db: Database,
  kind: string | undefined,
): Promise<LensDefinition> {
  const lens = atlasLens(kind);
  assertLensOnLibrary(lens, await ownPlanetOf(db));
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

// ── atlas-planet: the library's own planet (Decision 2) ──────────────────────

export interface AtlasPlanetInfo {
  /** The planet beside world knowledge. */
  own: OwnPlanet;
  /** Set explicitly; otherwise the default for this kind of library. */
  explicit: boolean;
  /** Whether this connection may change it: the library's owner or a curator. */
  mayChange: boolean;
  /** The lenses the library shows, world's first. */
  lenses: Array<{ kind: LensKind; planet: PlanetKind; name: string }>;
}

export async function atlasPlanetInfo(db: Database): Promise<AtlasPlanetInfo> {
  const own = await ownPlanetOf(db);
  return {
    own,
    explicit: parseOwnPlanet(await getSetting(db, OWN_PLANET_SETTING)) !== null,
    mayChange: await mayWriteKnowledge(db),
    lenses: (await libraryLenses(db, own)).map((lens) => ({
      kind: lens.kind,
      planet: lens.planet,
      name: lens.name,
    })),
  };
}

/**
 * `atlas-planet --own firma|privat`: "Diese Bibliothek gehört zu einer
 * Firma". Only the library's owner or a curator may change it; no tool does.
 * Lenses of the other planet stay stored but are no longer shown.
 */
export async function setAtlasOwnPlanet(
  db: Database,
  planet: string,
): Promise<AtlasPlanetInfo & { success: true }> {
  const own = parseOwnPlanet(planet);
  if (!own) throw new Error("--own must be firma or privat.");
  if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
  try {
    await setSetting(db, OWN_PLANET_SETTING, own);
  } catch (error) {
    if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
    throw error;
  }
  return { success: true, ...(await atlasPlanetInfo(db)) };
}

// ── atlas-move-planet: a unit's kind (Decision 2) ────────────────────────────

/**
 * Move own units to world knowledge or to the library's own planet: the
 * named ones, or those of a region. Published units stay world knowledge.
 * The learner does this on a library of their own, a curator on a team
 * library.
 */
export async function atlasMovePlanet(
  db: Database,
  opts: {
    planet: string;
    units?: string[];
    lens?: string;
    region?: string;
  },
): Promise<MovePlanetResult & { success: true }> {
  const own = await ownPlanetOf(db);
  const planet = opts.planet === "welt" ? "welt" : parseOwnPlanet(opts.planet);
  if (!planet || (planet !== "welt" && planet !== own)) {
    throw new Error(`--planet must be welt or ${own}.`);
  }
  if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
  const keys = new Set<UnitKey>();
  for (const key of opts.units ?? []) keys.add(key as UnitKey);
  if (opts.region) {
    const lens = await libraryLens(db, opts.lens);
    const { snapshot } = await snapshotForRead(db, lens);
    for (const placement of snapshot.placements) {
      if (placement.path.some((step) => step.key === opts.region)) {
        keys.add(placement.unitKey);
      }
    }
  }
  if (keys.size === 0) throw new Error("Name units or a region to move.");
  await ensureWorldLenses(db);
  const placedBy = dialectOf(db) === "postgres" ? "curator" : "learner";
  try {
    const result = await db.transaction((tx) =>
      moveUnitsToPlanet(tx, { units: [...keys], planet, placedBy }),
    );
    return { success: true, ...result };
  } catch (error) {
    if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
    throw error;
  }
}

// ── atlas-prefs ──────────────────────────────────────────────────────────────

export interface AtlasPrefs {
  lens: LensKind;
  showNew: boolean;
  /** Stored home path per lens, root first. */
  home: Partial<Record<LensKind, string[]>>;
}

/** The lens the atlas opens with before the learner chose one (Decision 3). */
function defaultLens(own: OwnPlanet): LensKind {
  return own === "firma" ? "produkte" : "weltwissen";
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
  const own = await ownPlanetOf(db);
  const lenses = await libraryLenses(db, own);
  const stored = await getSetting(db, LENS_KEY);
  const home: AtlasPrefs["home"] = {};
  for (const lens of lenses) {
    const path = parsePath(await getSetting(db, homeKey(lens.kind)));
    if (path.length > 0) home[lens.kind] = path;
  }
  return {
    lens: lenses.find((lens) => lens.kind === stored)?.kind ?? defaultLens(own),
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
    await setSetting(db, LENS_KEY, (await libraryLens(db, opts.lens)).kind);
  }
  if (opts.showNew !== undefined) {
    if (opts.showNew !== "on" && opts.showNew !== "off") {
      throw new Error("--show-new must be on or off.");
    }
    await setSetting(db, SHOW_NEW_KEY, String(opts.showNew === "on"));
  }
  if (opts.home !== undefined) {
    const prefs = await readAtlasPrefs(db);
    const lens = await libraryLens(db, opts.lens ?? prefs.lens);
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
  const lens = await libraryLens(db, opts.lens);
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
  let found: BundledCellInfo[] = [];
  if (lens.kind === "schule") {
    scope = await schuleScope(db, atomIds, level);
    found = scope ? findBundledCellsForScope(scope) : [];
  } else if (lens.kind === "weltwissen") {
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
    // Curriculum belongs to world knowledge: the own planet has none.
    wizard:
      lens.planet !== "welt"
        ? false
        : scope
          ? needsGenericCurriculumImport(scope)
          : cells.length === 0,
  };
}

/** The place as a material import's producer is told about it. */
export async function materialPlace(
  db: Database,
  opts: { userId: string; lens?: string; region: string },
): Promise<MaterialAnalyzePlace> {
  const result = await atlasPlace(db, opts);
  return {
    lens: result.place.lens,
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
    const lens = await libraryLens(db, opts.lens);
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

export interface AtlasReadResult extends AtlasView {
  success: true;
  /** The library's own planet and the lenses it shows (Decision 2). */
  ownPlanet: OwnPlanet;
  lenses: AtlasPlanetInfo["lenses"];
}

export async function atlasRead(
  db: Database,
  opts: {
    userId: string;
    lens?: string;
    planet?: string;
    now?: Date;
    timeZone?: string;
  },
): Promise<AtlasReadResult> {
  const prefs = await readAtlasPrefs(db);
  const info = await atlasPlanetInfo(db);
  let kind = opts.lens;
  if (kind === undefined && opts.planet !== undefined) {
    // A planet alone opens its lens the learner last chose, else its primary.
    const planet = opts.planet;
    if (planet !== "welt" && planet !== info.own) {
      throw new Error(`This library holds the welt and ${info.own} planets.`);
    }
    const onPlanet = info.lenses.filter((lens) => lens.planet === planet);
    kind = (onPlanet.find((lens) => lens.kind === prefs.lens) ?? onPlanet[0])
      ?.kind;
  }
  const lens = await libraryLens(db, kind ?? prefs.lens);
  if (opts.planet !== undefined && lens.planet !== opts.planet) {
    throw new Error(`The ${lens.name} lens is on the ${lens.planet} planet.`);
  }
  const view = await readAtlas(db, {
    userId: opts.userId,
    lens,
    now: opts.now,
    showNew: prefs.showNew,
    homePath: prefs.home[lens.kind],
    mayWrite: info.mayChange,
    timeZone: opts.timeZone,
  });
  return { success: true, ...view, ownPlanet: info.own, lenses: info.lenses };
}

// ── atlas-settle ─────────────────────────────────────────────────────────────

export async function atlasSettle(
  db: Database,
  opts: { lens?: string },
): Promise<SettleResult & { success: true }> {
  const lens = await libraryLens(db, opts.lens);
  if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
  try {
    return { success: true, ...(await settleLens(db, lens)) };
  } catch (error) {
    if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
    throw error;
  }
}

// ── Placing imported units (Decision 9) ──────────────────────────────────────

/**
 * Names for the levels below a place, fitted to how many it has: the last
 * names land on the deepest levels (a goal's topic becomes the Thema, the
 * goal itself the level above), and levels left over are "Allgemein".
 */
export function fitBelow(names: readonly string[], levels: number): string[] {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (levels <= 0) return [];
  const fitted = clean.slice(Math.max(0, clean.length - levels));
  return [...Array(levels - fitted.length).fill(""), ...fitted];
}

/**
 * Put the units an import created on the world planet, where Weltwissen's
 * rules sort them (ADR 2026-10-14, Decision 5: a topic import writes world
 * knowledge). Units a world rule already covers stay as they are. Without
 * the right to write knowledge nothing is placed: the cards stay, and the
 * unit keeps where the rules put it.
 */
export async function placeOnWorldPlanet(
  db: Database,
  tokenIds: readonly string[],
): Promise<number> {
  if (tokenIds.length === 0 || !(await mayWriteKnowledge(db))) return 0;
  await ensureWorldLenses(db);
  const result = await db.transaction((tx) =>
    moveUnitsToPlanet(tx, {
      units: tokenIds.map((id) => `token:${id}` as UnitKey),
      planet: "welt",
      placedBy: "import",
    }),
  );
  return result.moved.length + result.unchanged.length;
}

/**
 * Put units an import created at an atlas region (`placeUnits`), with the
 * names each brings for the levels below it. A linked duplicate keeps its
 * own place, as in the material import.
 */
export async function placeImportedUnits(
  db: Database,
  opts: {
    lens?: string;
    region: string;
    units: ReadonlyArray<{ tokenId: string; names: readonly string[] }>;
  },
): Promise<number> {
  if (opts.units.length === 0) return 0;
  const lens = await libraryLens(db, opts.lens);
  if (lens.planet === "welt") await ensureWorldLenses(db);
  else await ensureLensRow(db, lens);
  const place = await resolvePlace(db, lens, opts.region);
  if (!place)
    throw new Error(`No region "${opts.region}" in the ${lens.name} lens.`);
  const levels = place.missingLevels.length;
  return db.transaction((tx) =>
    placeUnits(
      tx,
      lens,
      opts.region,
      opts.units.map((unit) => ({
        unitKey: `token:${unit.tokenId}` as UnitKey,
        below: fitBelow(unit.names, levels),
      })),
    ),
  );
}

// ── Sinnbilder (Decision 6) ──────────────────────────────────────────────────

export interface AtlasEmblemResult {
  success: true;
  scope: "personal" | "shared";
  subjectKey: string;
  emblem: { svg: string; glyph: string | null; source: "personal" | "shared" };
}

function emblemScope(scope: string | undefined): EmblemScope {
  if (scope === undefined || scope === "auto") return "auto";
  if (scope === "personal" || scope === "shared") return scope;
  throw new Error("--scope is auto, personal or shared.");
}

/** Kernel refusals as the bridge reports them: `not-curator` stays a code. */
function emblemFailure(error: unknown): never {
  if (error instanceof EmblemError) {
    throw new Error(error.code === "not-curator" ? NOT_CURATOR : error.message);
  }
  if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
  throw error;
}

async function storeEmblem(
  db: Database,
  opts: {
    userId: string;
    subject: string;
    svg?: string;
    glyph?: string;
    scope?: string;
    author: EmblemAuthor;
  },
): Promise<AtlasEmblemResult> {
  const mayWrite = await mayWriteKnowledge(db);
  try {
    // Rows an older validator wrote are re-checked before a new one lands.
    await revalidateEmblems(db, { userId: opts.userId, shared: mayWrite });
    const stored = await setEmblem(db, {
      subjectKey: opts.subject,
      svg: opts.svg,
      glyph: opts.glyph,
      userId: opts.userId,
      mayWriteKnowledge: mayWrite,
      scope: emblemScope(opts.scope),
      author: opts.author,
    });
    return {
      success: true,
      scope: stored.scope,
      subjectKey: stored.subjectKey,
      emblem: { svg: stored.svg, glyph: stored.glyph, source: stored.scope },
    };
  } catch (error) {
    emblemFailure(error);
  }
}

/** `atlas-emblem-set`: an SVG (an agent's) or a glyph alone (the Studio's). */
export function atlasEmblemSet(
  db: Database,
  opts: {
    userId: string;
    subject: string;
    svg?: string;
    glyph?: string;
    scope?: string;
    author?: EmblemAuthor;
  },
): Promise<AtlasEmblemResult> {
  return storeEmblem(db, { ...opts, author: opts.author ?? "agent" });
}

/** `atlas-emblem-clear`: the learner's own, or with `shared` the library's. */
export async function atlasEmblemClear(
  db: Database,
  opts: { userId: string; subject: string; shared?: boolean },
): Promise<{ success: true; cleared: boolean }> {
  try {
    const cleared = opts.shared
      ? await clearSharedEmblem(db, opts.subject, await mayWriteKnowledge(db))
      : await clearPersonalEmblem(db, opts.userId, opts.subject);
    return { success: true, cleared };
  } catch (error) {
    emblemFailure(error);
  }
}

/** A subject's title and the path above it, as a drawing request names them. */
export async function emblemSubjectInfo(
  db: Database,
  subjectKey: string,
): Promise<{ title: string; path: string[] }> {
  const subject = parseEmblemSubject(subjectKey);
  if (!subject) {
    throw new Error(
      `"${subjectKey}" names no unit or region. Use atom:<id>, token:<id>, subject:<fach> or region:<lens>:<key>.`,
    );
  }
  if (subject.kind === "subject") {
    return { title: subjectName(subject.key), path: [] };
  }
  if (subject.kind === "region") {
    const place = await resolvePlace(
      db,
      await libraryLens(db, subject.lens),
      subject.regionKey,
    );
    if (!place) throw new Error(`No region ${subject.regionKey} in this lens.`);
    const names = place.path.map((step) => step.name);
    return {
      title: names[names.length - 1] ?? subject.regionKey,
      path: names.slice(0, -1),
    };
  }
  const row = (await db
    .prepare(
      subject.kind === "atom"
        ? "SELECT title, domain FROM learning_atoms WHERE id = ?"
        : "SELECT COALESCE(NULLIF(TRIM(title), ''), NULLIF(TRIM(concept), ''), slug) AS title, domain FROM tokens WHERE id = ?",
    )
    .get(subject.id)) as
    | { title: string | null; domain: string | null }
    | undefined;
  if (!row) throw new Error(`No unit ${subjectKey} in this library.`);
  return {
    title: row.title ?? subjectKey,
    path: (row.domain ?? "").split("/").filter(Boolean),
  };
}

/** `atlas-emblem-draw`: the first text model draws one; it is stored like any other. */
export async function atlasEmblemDraw(
  db: Database,
  opts: { userId: string; subject: string; scope?: string },
  deps: EmblemDrawDeps = {},
): Promise<AtlasEmblemResult & { model: string }> {
  const info = await emblemSubjectInfo(db, opts.subject);
  const drawing = await drawEmblemViaLLM(db, info, deps);
  const stored = await storeEmblem(db, {
    userId: opts.userId,
    subject: opts.subject,
    svg: drawing.svg,
    glyph: drawing.glyph ?? undefined,
    scope: opts.scope,
    author: "agent",
  });
  return { ...stored, model: drawing.model };
}

export interface MissingEmblem {
  subject: string;
  kind: "region" | "unit";
  title: string;
  /** Names from the island down, for context. */
  path: string[];
}

/**
 * Regions and the learner's units of a lens that show no Sinnbild yet, for
 * an agent to draw. A leaf region that borrows its first unit's counts as
 * missing too: it deserves its own.
 */
export async function atlasMissingEmblems(
  db: Database,
  opts: { userId: string; lens?: string; limit?: number },
): Promise<{
  success: true;
  lens: LensKind;
  missing: MissingEmblem[];
  total: number;
}> {
  const view = await atlasRead(db, { userId: opts.userId, lens: opts.lens });
  const regionByKey = new Map(view.regions.map((r) => [r.key, r]));
  const pathOf = (key: string | null): string[] => {
    const names: string[] = [];
    let current = key ? regionByKey.get(key) : undefined;
    while (current) {
      names.unshift(current.name);
      current = current.parentKey
        ? regionByKey.get(current.parentKey)
        : undefined;
    }
    return names;
  };
  const missing: MissingEmblem[] = [];
  // A region that borrows its first unit's Sinnbild still deserves its own;
  // a Fach in several grades is one subject and is listed once.
  const listed = new Set<string>();
  for (const region of view.regions) {
    const borrowed = !region.emblem || /^(atom|token):/.test(region.emblem);
    if (!borrowed || listed.has(region.emblemSubject)) continue;
    listed.add(region.emblemSubject);
    missing.push({
      subject: region.emblemSubject,
      kind: "region",
      title: region.name,
      path: pathOf(region.parentKey),
    });
  }
  for (const unit of view.units) {
    if (unit.emblem || unit.inReach) continue;
    missing.push({
      subject: unit.key,
      kind: "unit",
      title: unit.title,
      path: pathOf(unit.region),
    });
  }
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  return {
    success: true,
    lens: view.lens.kind,
    missing: missing.slice(0, limit),
    total: missing.length,
  };
}

// ── Red threads (Decision 7) ─────────────────────────────────────────────────

export interface AtlasConnectResult {
  success: true;
  id: string;
  scope: ConnectionScope;
  /** The dependent end, as stored. */
  from: UnitKey;
  to: UnitKey;
  kind: ThreadKind;
  note: string | null;
  /** A Verbindung was turned around. */
  swapped: boolean;
  /** False when the same thread was there already. */
  created: boolean;
}

function connectionScope(scope: string | undefined): ConnectionScope {
  if (scope === undefined || scope === "personal") return "personal";
  if (scope === "shared") return scope;
  throw new Error("--scope is personal or shared.");
}

/**
 * Kernel refusals as the bridge reports them: each keeps its code, so a
 * surface can explain it; `not-curator` is its own message too.
 */
function connectionFailure(error: unknown): never {
  if (error instanceof ConnectionError) {
    if (error.code !== "not-curator") throw error;
    throw new ConnectionError("not-curator", NOT_CURATOR);
  }
  if (isPermissionDenied(error)) {
    throw new ConnectionError("not-curator", NOT_CURATOR);
  }
  throw error;
}

/** `atlas-connect`: the learner's own thread, or with `shared` the library's. */
export async function atlasConnect(
  db: Database,
  opts: {
    userId: string;
    from: string;
    to: string;
    kind: string;
    note?: string;
    scope?: string;
    author?: "agent" | "curator";
  },
): Promise<AtlasConnectResult> {
  const scope = connectionScope(opts.scope);
  try {
    const stored = await addConnection(db, {
      a: opts.from,
      b: opts.to,
      kind: opts.kind,
      note: opts.note,
      scope,
      userId: opts.userId,
      mayWriteKnowledge: await mayWriteKnowledge(db),
      author: opts.author ?? "agent",
    });
    return {
      success: true,
      id: stored.id,
      scope: stored.scope,
      from: stored.a,
      to: stored.b,
      kind: stored.kind,
      note: stored.note,
      swapped: stored.swapped,
      created: stored.created,
    };
  } catch (error) {
    connectionFailure(error);
  }
}

/** `atlas-disconnect`: cut the learner's own thread, or a curator the library's. */
export async function atlasDisconnect(
  db: Database,
  opts: { userId: string; id: string },
): Promise<{ success: true; scope: ConnectionScope }> {
  try {
    const removed = await removeConnection(db, {
      id: opts.id,
      userId: opts.userId,
      mayWriteKnowledge: await mayWriteKnowledge(db),
    });
    return { success: true, scope: removed.scope };
  } catch (error) {
    connectionFailure(error);
  }
}
