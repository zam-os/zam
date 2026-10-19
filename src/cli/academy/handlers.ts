/**
 * The learner's three academy actions (ADR 2026-10-19, Decisions 4 and 5),
 * behind `zam bridge academy-list | academy-enrol | academy-update`.
 *
 * Studio calls them when the learner opens the Academy list, clicks
 * „Aufnehmen“ or clicks „Aktualisieren“. They are the only code that
 * fetches academy content. They are neither MCP tools nor Studio-panel
 * bridge commands, because a model can drive both of those.
 */

import {
  type AcademyCatalog,
  type AcademyCatalogEntry,
  BUNDLED_TILES,
  type BundledTile,
  bundledCellInfoForTile,
  compareTileVersions,
  type Database,
  enrolBundledCell,
  getBundledCellsWithStatus,
  installedTileVersion,
} from "../../kernel/index.js";
import { resolveHandlerUser } from "../bridge-handlers.js";
import {
  readCachedCatalog,
  readCachedCell,
  resolveCachedTile,
  writeCachedCatalog,
  writeCachedCell,
} from "./cache.js";
import {
  type AcademyFetchOptions,
  fetchAcademyCatalog,
  fetchAcademyCell,
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
}

export interface AcademyHandlerParams {
  user?: string;
  /** Test seams; never a URL. */
  fetch?: AcademyFetchOptions;
}

/** A bundled academy cell: the build ships it under the academy namespace. */
function isAcademyTile(tile: BundledTile): boolean {
  return tile.tile_id.startsWith("zam-academy:");
}

function itemCount(tile: BundledTile): number {
  return tile.atoms.reduce((n, atom) => n + atom.practice_items.length, 0);
}

/**
 * Reads the catalog, caches it and the cells it lists, and returns every
 * academy cell with the learner's status. The library is not written.
 * Without network it answers from the cache, or from the bundled cells.
 */
export async function academyListHandler(
  db: Database,
  params: AcademyHandlerParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);
  let catalog: AcademyCatalog | null = null;
  let offline = false;
  let error: string | undefined;
  try {
    const fetched = await fetchAcademyCatalog(params.fetch);
    writeCachedCatalog(fetched.bytes);
    catalog = fetched.catalog;
    for (const entry of catalog.cells) {
      if (readCachedCell(entry)) continue;
      try {
        const { bytes } = await fetchAcademyCell(entry, params.fetch);
        writeCachedCell(entry, bytes);
      } catch {
        // Listed anyway; „Aufnehmen“ fetches it again.
      }
    }
  } catch (err) {
    offline = true;
    error = (err as Error).message || String(err);
    catalog = readCachedCatalog();
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
  const tileOf = (id: string) => BUNDLED_TILES[id] ?? resolveCachedTile(id);
  const tiles = [...ids]
    .map((id) => tileOf(id))
    .filter((tile): tile is BundledTile => tile !== undefined);
  const statuses = new Map(
    (
      await getBundledCellsWithStatus(
        db,
        userId,
        tiles.map(bundledCellInfoForTile),
        tileOf,
      )
    ).map((status) => [status.id, status]),
  );

  const cells: AcademyCellRow[] = [];
  for (const id of [...ids].sort()) {
    const entry = entries.get(id);
    const tile = tileOf(id);
    const held = statuses.get(id)?.enrolled ?? false;
    const heldVersion = held ? await installedTileVersion(db, id) : null;
    cells.push({
      id,
      title: entry?.title ?? tile?.title ?? id,
      description: entry?.description ?? tile?.description ?? "",
      language: entry?.language ?? null,
      version: entry?.version ?? String(tile?.version ?? ""),
      items: entry?.items ?? (tile ? itemCount(tile) : 0),
      appUrl: entry?.appUrl ?? null,
      bundled: Boolean(BUNDLED_TILES[id]),
      held,
      heldVersion,
      newer:
        held &&
        entry !== undefined &&
        compareTileVersions(entry.version, heldVersion) === 1,
    });
  }
  return {
    success: true as const,
    offline,
    ...(error ? { error } : {}),
    cells,
  };
}

/** Makes sure the newest catalog version of a cell is cached, if listed. */
async function cacheNewestCell(
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
  const entry = catalog.cells.find((cell) => cell.id === cellId);
  if (entry && !readCachedCell(entry)) {
    const { bytes } = await fetchAcademyCell(entry, fetch);
    writeCachedCell(entry, bytes);
  }
  return entry;
}

/** „Aufnehmen“: enrols in the newest version known of an academy cell. */
export async function academyEnrolHandler(
  db: Database,
  params: AcademyHandlerParams & { cellId: string },
) {
  const cellId = params.cellId?.trim();
  if (!cellId) throw new Error("cellId is required");
  const userId = await resolveHandlerUser(db, params.user);
  try {
    await cacheNewestCell(cellId, params.fetch, false);
  } catch (err) {
    // A bundled cell still enrols without network.
    if (!BUNDLED_TILES[cellId]) throw err;
  }
  const result = await enrolBundledCell(db, userId, cellId, {
    resolveTile: resolveCachedTile,
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
  const entry = await cacheNewestCell(cellId, params.fetch, true);
  if (!entry || compareTileVersions(entry.version, from) !== 1) {
    return {
      success: true as const,
      cellId,
      updated: false,
      version: from,
    };
  }
  // Installing the newer tile is a revision like any bundled update, and
  // re-enrolling hands out its new items within the usual budget.
  const result = await enrolBundledCell(db, userId, cellId, {
    resolveTile: resolveCachedTile,
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
