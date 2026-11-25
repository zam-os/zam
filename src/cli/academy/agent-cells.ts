/**
 * Private Academy providers for agent tools (ADR 2026-11-25 Decision 9).
 *
 * `zam_bundled_cells_list` and `zam_bundled_cell_enrol` see a provider's
 * cells from the cache of the learner's last check, and the provider
 * packages the library already holds. Like the public Academy's agent path
 * (ADR 2026-10-19 D4), nothing here reaches the network: this module imports
 * no fetching code, and a cell the learner never downloaded stays a pointer
 * to their own „Aufnehmen“.
 */

import {
  type BundledCellEnrolResult,
  type BundledCellStatus,
  type BundledTile,
  bundledCellInfoForTile,
  type Database,
  type EnrolBundledCellProgress,
  enrolBundledCell,
  enrolInstalledTile,
  getBundledCellsWithStatus,
  installedTileVersion,
  isProviderTileId,
  listConfirmedProviders,
  listInstalledProviderTiles,
} from "../../kernel/index.js";
import {
  type ProviderCacheScope,
  readCachedCatalog,
  readCachedCell,
  readCachedTileVersion,
  resolveCachedTile,
} from "./cache.js";

/**
 * Provider cells an agent may list, beside the bundled and Academy cells
 * already in `known` (whose ids it extends).
 */
export async function providerCellsForAgents(
  db: Database,
  userId: string,
  known: Set<string>,
): Promise<BundledCellStatus[]> {
  const out: BundledCellStatus[] = [];
  for (const confirmed of listConfirmedProviders()) {
    const provider = {
      id: confirmed.provider.id,
      title: confirmed.provider.title,
    };
    const scope: ProviderCacheScope = {
      providerId: confirmed.provider.id,
      origin: confirmed.origin,
    };
    const catalog = readCachedCatalog(scope);
    if (!catalog) continue;
    const local = new Map<string, BundledTile>();
    const uncached = [];
    for (const entry of catalog.cells) {
      if (known.has(entry.id)) continue;
      const installed = await installedTileVersion(db, entry.id);
      const tile =
        (installed
          ? readCachedTileVersion(entry.id, installed, scope)
          : undefined) ?? readCachedCell(entry, scope);
      if (tile) local.set(entry.id, tile);
      else uncached.push(entry);
    }
    const previews = new Set(
      catalog.cells.filter((entry) => entry.preview).map((entry) => entry.id),
    );
    const statuses = await getBundledCellsWithStatus(
      db,
      userId,
      [...local.values()].map((tile) => ({
        ...bundledCellInfoForTile(tile),
        publisher: confirmed.provider.publisher,
        preview: previews.has(tile.tile_id),
      })),
      (id) => local.get(id),
    );
    for (const status of statuses) {
      out.push({ ...status, provider });
      known.add(status.id);
    }
    for (const entry of uncached) {
      const installed = (await installedTileVersion(db, entry.id)) !== null;
      out.push({
        id: entry.id,
        title: entry.title,
        gradeLabel: confirmed.provider.title,
        description: entry.description,
        publisher: confirmed.provider.publisher,
        publishedAt: entry.version,
        atomCount: 0,
        inScopeAtomIds: [],
        curriculumScopes: [],
        preview: entry.preview,
        installed,
        enrolled: false,
        cardCount: 0,
        requiresLearnerEnrol: !installed,
        provider,
        ...(installed ? { installedInLibrary: true } : {}),
      });
      known.add(entry.id);
    }
  }

  // What the library holds although no confirmed provider lists it here — in
  // a team library, every package a curator installed.
  for (const tile of await listInstalledProviderTiles(db, userId)) {
    if (known.has(tile.tileId)) continue;
    out.push({
      id: tile.tileId,
      title: tile.title,
      gradeLabel: tile.providerId,
      description: tile.description,
      publisher: tile.providerId,
      publishedAt: tile.version,
      atomCount: 0,
      inScopeAtomIds: [],
      curriculumScopes: [],
      preview: tile.preview,
      installed: true,
      enrolled: tile.held,
      cardCount: Math.max(0, tile.items - tile.newItems),
      installedInLibrary: true,
      provider: { id: tile.providerId, title: tile.providerId },
    });
    known.add(tile.tileId);
  }
  return out;
}

/**
 * An agent enrols the learner in a provider cell: from the library when it
 * holds the tile, else from the cache of the learner's last check (personal
 * library only). Never a download, never an update of a held cell.
 */
export async function enrolProviderCellForAgent(
  db: Database,
  userId: string,
  cellId: string,
  onProgress?: (progress: EnrolBundledCellProgress) => void,
): Promise<BundledCellEnrolResult> {
  if (!isProviderTileId(cellId)) {
    throw new Error(`${cellId} is not a provider package`);
  }
  if ((await installedTileVersion(db, cellId)) !== null) {
    const result = await enrolInstalledTile(db, userId, cellId, {
      onProgress: onProgress
        ? (progress) => onProgress({ phase: "enrolling", ...progress })
        : undefined,
    });
    return {
      success: true,
      cellId,
      installed: true,
      cardsCreated: result.cardsCreated,
      cardsReused: result.cardsReused,
      alreadyEnrolled: result.alreadyEnrolled,
    };
  }
  const prefix = cellId.slice(0, cellId.indexOf(":"));
  const confirmed = listConfirmedProviders().find(
    (entry) => entry.provider.id === prefix,
  );
  const scope: ProviderCacheScope | null = confirmed
    ? { providerId: confirmed.provider.id, origin: confirmed.origin }
    : null;
  const entry = scope
    ? readCachedCatalog(scope)?.cells.find((cell) => cell.id === cellId)
    : undefined;
  const tile = scope && entry ? readCachedCell(entry, scope) : undefined;
  if (!scope || !entry || !tile || db.dialect === "postgres") {
    throw new Error(
      db.dialect === "postgres"
        ? `Provider package "${cellId}" is not in this team library yet. A curator installs it first („Für die Bibliothek installieren“).`
        : `Provider package "${cellId}" is not downloaded locally yet. Ask the learner to open it in ZAM Academy and click „Aufnehmen“.`,
    );
  }
  return enrolBundledCell(db, userId, cellId, {
    resolveTile: (id) => resolveCachedTile(id, scope),
    install: {
      namespace: prefix,
      appUrl: entry.appUrl,
      preview: entry.preview,
    },
    onProgress,
  });
}
