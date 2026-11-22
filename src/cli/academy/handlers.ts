/**
 * The learner's three academy actions (ADR 2026-10-19, Decisions 4 and 5),
 * behind `zam bridge academy-list | academy-enrol | academy-update`.
 *
 * Studio calls them when the learner opens the Academy list, clicks
 * „Aufnehmen“ or clicks „Aktualisieren“. They are the only code that
 * fetches academy content. They are neither MCP tools nor Studio-panel
 * bridge commands, because a model can drive both of those.
 *
 * Listing fetches only the lightweight `catalog.json` and `academy.json`
 * index files in parallel — never individual `cell.json` bundles. A cell
 * file is downloaded on demand only when the learner clicks „Aufnehmen“ or
 * „Aktualisieren“ (and skipped when this build already bundles that version
 * or newer).
 */

import {
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type AcademyCellFacet,
  type AcademyIndex,
  type AcademyTaxonomy,
  BUNDLED_TILES,
  type BundledTile,
  bundledCellInfoForTile,
  bundleStandsIn,
  compareTileVersions,
  type Database,
  type EnrolBundledCellProgress,
  enrichAcademyCells,
  enrolBundledCell,
  getBundledCellsWithStatus,
  installedTileVersion,
} from "../../kernel/index.js";
import { resolveHandlerUser } from "../bridge-handlers.js";
import {
  readCachedCatalog,
  readCachedCell,
  readCachedIndex,
  readCachedTileVersion,
  resolveCachedTile,
  writeCachedCatalog,
  writeCachedCell,
  writeCachedIndex,
} from "./cache.js";
import {
  type AcademyFetchOptions,
  fetchAcademyCatalog,
  fetchAcademyCell,
  fetchAcademyIndex,
} from "./catalog-client.js";

export interface AcademyCellRow {
  id: string;
  title: string;
  description: string;
  language: string | null;
  /** The version „Aufnehmen“ would install. */
  version: string;
  /** Cards the learner gets on enrolment. */
  items: number;
  /** The app on academy.zam-os.org, or null for a cell only bundled. */
  appUrl: string | null;
  /** This ZAM build ships the cell. */
  bundled: boolean;
  /** The learner holds cards from this cell. */
  held: boolean;
  /** The version the library holds, if any. */
  heldVersion: string | null;
  /** The catalog has a newer version than the library holds. */
  newer: boolean;
  /** No teacher has reviewed its content yet. */
  preview: boolean;
  /** School, grade, subject and topic metadata from `academy.json` (or fallback). */
  facet: AcademyCellFacet;
}

export interface AcademyHandlerParams {
  user?: string;
  /** Test seams; never a URL. */
  fetch?: AcademyFetchOptions;
  onProgress?: (progress: EnrolBundledCellProgress) => void;
}

/** A bundled academy cell: the build ships it under the academy namespace. */
function isAcademyTile(tile: BundledTile): boolean {
  return tile.tile_id.startsWith("zam-academy:");
}

function itemCount(tile: BundledTile): number {
  return tile.atoms.reduce((n, atom) => n + atom.practice_items.length, 0);
}

/**
 * Checks whether the learner holds at least one non-detached card pointing to
 * an academy app when the tile is installed in the library database (e.g.
 * synced from another device) but its `cell.json` is not cached locally.
 */
async function userHoldsAppCards(
  db: Database,
  userId: string,
  appUrl: string | null,
): Promise<boolean> {
  if (!appUrl) return true;
  const row = (await db
    .prepare(
      `SELECT 1 AS ok
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.user_id = ?
          AND c.detached_at IS NULL
          AND t.source_link LIKE ?
        LIMIT 1`,
    )
    .get(userId, `${appUrl}%`)) as { ok: number } | undefined;
  return Boolean(row);
}

/**
 * Reads `catalog.json` and `academy.json` in parallel, caches both, and
 * returns every academy cell enriched with school/grade/subject facets and
 * the learner's enrolment status. Writes nothing to the library and never
 * downloads individual `cell.json` files.
 * Without network it answers from the cache, or from the bundled cells.
 */
export async function academyListHandler(
  db: Database,
  params: AcademyHandlerParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);
  let catalog: AcademyCatalog | null = null;
  let index: AcademyIndex | null = null;
  let offline = false;
  let error: string | undefined;

  const [catalogResult, indexResult] = await Promise.allSettled([
    fetchAcademyCatalog(params.fetch),
    fetchAcademyIndex(params.fetch),
  ]);

  if (catalogResult.status === "fulfilled") {
    writeCachedCatalog(catalogResult.value.bytes);
    catalog = catalogResult.value.catalog;
  } else {
    offline = true;
    const err = catalogResult.reason;
    error = err instanceof Error ? err.message : String(err);
    catalog = readCachedCatalog();
  }

  if (indexResult.status === "fulfilled") {
    writeCachedIndex(indexResult.value.bytes);
    index = indexResult.value.index;
  } else {
    index = readCachedIndex();
  }

  const entries = new Map<string, AcademyCatalogEntry>(
    (catalog?.cells ?? []).map((entry) => [entry.id, entry]),
  );
  const ids = new Set<string>([
    ...Object.values(BUNDLED_TILES)
      .filter(isAcademyTile)
      .map((tile) => tile.tile_id),
    ...entries.keys(),
  ]);

  // Read installed tile versions in one query instead of one query per cell.
  const installedRows = (await db
    .prepare("SELECT tile_id, version FROM installed_tiles WHERE version <> ''")
    .all()) as Array<{ tile_id: string; version: string }>;
  const installedVersions = new Map(
    installedRows.map((row) => [row.tile_id, row.version]),
  );

  // Only inspect tiles that are already in memory (bundled) or already
  // installed and cached on disk — never touch disk for uninstalled cells.
  const localTiles = new Map<string, BundledTile>();
  for (const id of ids) {
    const bundled = BUNDLED_TILES[id];
    if (bundled) {
      localTiles.set(id, bundled);
      continue;
    }
    const installedVer = installedVersions.get(id);
    if (!installedVer) continue;
    const entry = entries.get(id);
    const cached =
      readCachedTileVersion(id, installedVer) ??
      (entry ? readCachedCell(entry) : undefined);
    if (cached) localTiles.set(id, cached);
  }

  const statuses = new Map(
    (
      await getBundledCellsWithStatus(
        db,
        userId,
        [...localTiles.values()].map(bundledCellInfoForTile),
        (id) => localTiles.get(id),
      )
    ).map((status) => [status.id, status]),
  );

  const rawCells: Array<Omit<AcademyCellRow, "facet">> = [];
  for (const id of [...ids].sort()) {
    const entry = entries.get(id);
    const tile = localTiles.get(id);
    const installedVer = installedVersions.get(id) ?? null;
    const held = tile
      ? (statuses.get(id)?.enrolled ?? false)
      : installedVer !== null &&
        (await userHoldsAppCards(db, userId, entry?.appUrl ?? null));
    const heldVersion = held ? installedVer : null;
    // The row shows what „Aufnehmen“ installs: the newer of catalog and
    // bundle.
    const bundled = BUNDLED_TILES[id];
    const bundleAhead =
      bundled !== undefined &&
      (entry === undefined ||
        compareTileVersions(String(bundled.version), entry.version) === 1);
    rawCells.push({
      id,
      title: entry?.title ?? tile?.title ?? id,
      description: entry?.description ?? tile?.description ?? "",
      language: entry?.language ?? null,
      version: bundleAhead
        ? String(bundled.version)
        : (entry?.version ?? String(tile?.version ?? "")),
      items: bundleAhead
        ? itemCount(bundled)
        : (entry?.items ?? (tile ? itemCount(tile) : 0)),
      appUrl: entry?.appUrl ?? null,
      bundled: Boolean(bundled),
      held,
      heldVersion,
      newer:
        held &&
        entry !== undefined &&
        compareTileVersions(entry.version, heldVersion) === 1,
      // Either source is enough: a label one release too long does no harm,
      // a missing one tells a child's parents the content was reviewed.
      preview: entry?.preview === true || statuses.get(id)?.preview === true,
    });
  }

  const { taxonomy, cells } = enrichAcademyCells(
    rawCells,
    index,
    (id) => BUNDLED_TILES[id] ?? localTiles.get(id),
  );

  return {
    success: true as const,
    offline,
    ...(error ? { error } : {}),
    taxonomy: taxonomy as AcademyTaxonomy,
    cells: cells as AcademyCellRow[],
  };
}

/** A cell's catalog entry, from the last check or read now. */
async function catalogEntry(
  cellId: string,
  fetch: AcademyFetchOptions | undefined,
  refreshCatalog: boolean,
): Promise<AcademyCatalogEntry | undefined> {
  let catalog = refreshCatalog ? null : readCachedCatalog();
  if (!catalog) {
    const fetched = await fetchAcademyCatalog(fetch);
    writeCachedCatalog(fetched.bytes);
    catalog = fetched.catalog;
  }
  return catalog.cells.find((cell) => cell.id === cellId);
}

/** Makes sure the cell of exactly this entry is cached. */
async function cacheEntryCell(
  entry: AcademyCatalogEntry,
  fetch: AcademyFetchOptions | undefined,
): Promise<void> {
  if (readCachedCell(entry)) return;
  const { bytes } = await fetchAcademyCell(entry, fetch);
  writeCachedCell(entry, bytes);
}

/** „Aufnehmen“: enrols in the newest version known of an academy cell. */
export async function academyEnrolHandler(
  db: Database,
  params: AcademyHandlerParams & { cellId: string },
) {
  const cellId = params.cellId?.trim();
  if (!cellId) throw new Error("cellId is required");
  const userId = await resolveHandlerUser(db, params.user);
  const bundledVersion = BUNDLED_TILES[cellId]?.version;
  let entry: AcademyCatalogEntry | undefined;
  try {
    entry = await catalogEntry(cellId, params.fetch, false);
  } catch (err) {
    // Without the catalog, a bundled cell still enrols.
    if (bundledVersion === undefined) throw err;
  }
  if (entry && !bundleStandsIn(entry, bundledVersion)) {
    // Download only the one requested cell on demand. If the download fails,
    // never silently fall back to an older bundled version.
    await cacheEntryCell(entry, params.fetch);
  }
  const result = await enrolBundledCell(db, userId, cellId, {
    resolveTile: resolveCachedTile,
    onProgress: params.onProgress,
  });
  return { ...result, version: await installedTileVersion(db, cellId) };
}

/** „Aktualisieren“: installs a newer catalog version of one held cell. */
export async function academyUpdateHandler(
  db: Database,
  params: AcademyHandlerParams & { cellId: string },
) {
  const cellId = params.cellId?.trim();
  if (!cellId) throw new Error("cellId is required");
  const userId = await resolveHandlerUser(db, params.user);
  const from = await installedTileVersion(db, cellId);
  if (!from) throw new Error(`Not enrolled in ${cellId}`);
  const entry = await catalogEntry(cellId, params.fetch, true);
  if (!entry || compareTileVersions(entry.version, from) !== 1) {
    return {
      success: true as const,
      cellId,
      updated: false,
      version: from,
    };
  }
  await cacheEntryCell(entry, params.fetch);
  // Installing the newer tile is a revision like any bundled update, and
  // re-enrolling hands out its new items within the usual budget.
  const result = await enrolBundledCell(db, userId, cellId, {
    resolveTile: resolveCachedTile,
    onProgress: params.onProgress,
  });
  return {
    success: true as const,
    cellId,
    updated: true,
    from,
    version: await installedTileVersion(db, cellId),
    cardsCreated: result.cardsCreated,
  };
}
