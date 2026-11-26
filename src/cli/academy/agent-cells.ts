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
  assertAcademyProviderOrigin,
  type BundledCellEnrolResult,
  type BundledCellStatus,
  bundledCellInfoForTile,
  type Database,
  type EnrolBundledCellProgress,
  enrolBundledCell,
  enrolInstalledTile,
  type InstalledProviderTile,
  installedTileVersion,
  isProviderTileId,
  listConfirmedProviders,
  listInstalledProviderTiles,
} from "../../kernel/index.js";
import {
  type ProviderCacheScope,
  readCachedCatalog,
  readCachedCell,
} from "./cache.js";

function installedStatus(
  tile: InstalledProviderTile,
  provider: NonNullable<BundledCellStatus["provider"]>,
  teamLibrary: boolean,
): BundledCellStatus {
  return {
    id: tile.tileId,
    title: tile.title,
    gradeLabel: provider.title,
    description: tile.description,
    publisher: provider.title,
    publishedAt: tile.version,
    atomCount: tile.atoms.length,
    inScopeAtomIds: tile.atoms,
    curriculumScopes: [],
    preview: tile.preview,
    installed: true,
    enrolled: tile.held,
    cardCount: tile.cardCount,
    ...(teamLibrary
      ? { installedInLibrary: true, newItems: tile.newItems }
      : {}),
    provider,
  };
}

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
  const teamLibrary = db.dialect === "postgres";
  const installed = new Map(
    (await listInstalledProviderTiles(db, userId)).map((tile) => [
      tile.tileId,
      tile,
    ]),
  );
  const confirmedProviders = listConfirmedProviders();
  for (const confirmed of confirmedProviders) {
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
    for (const entry of catalog.cells) {
      if (known.has(entry.id)) continue;
      const libraryTile = installed.get(entry.id);
      if (libraryTile) {
        if (libraryTile.origin !== confirmed.origin) continue;
        out.push(installedStatus(libraryTile, provider, teamLibrary));
        known.add(entry.id);
        continue;
      }
      const tile = readCachedCell(entry, scope);
      const info = tile ? bundledCellInfoForTile(tile) : null;
      out.push({
        id: entry.id,
        title: entry.title,
        gradeLabel: confirmed.provider.title,
        description: entry.description,
        publisher: confirmed.provider.publisher,
        publishedAt: entry.version,
        atomCount: info?.atomCount ?? 0,
        inScopeAtomIds: info?.inScopeAtomIds ?? [],
        curriculumScopes: info?.curriculumScopes ?? [],
        preview: entry.preview,
        installed: false,
        enrolled: false,
        cardCount: 0,
        requiresLearnerEnrol: teamLibrary || !tile,
        provider,
      });
      known.add(entry.id);
    }
  }

  // What the library holds although no confirmed provider lists it here — in
  // a team library, every package a curator installed.
  for (const tile of installed.values()) {
    if (known.has(tile.tileId)) continue;
    const confirmed = confirmedProviders.find(
      (entry) =>
        entry.provider.id === tile.providerId && entry.origin === tile.origin,
    );
    out.push(
      installedStatus(
        tile,
        {
          id: tile.providerId,
          title: confirmed?.provider.title ?? tile.providerId,
        },
        teamLibrary,
      ),
    );
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
  const provider = { id: prefix, origin: scope.origin };
  await assertAcademyProviderOrigin(db, provider);
  return enrolBundledCell(db, userId, cellId, {
    resolveTile: () => tile,
    install: {
      provider,
      appUrl: entry.appUrl,
      preview: entry.preview,
    },
    onProgress,
  });
}
