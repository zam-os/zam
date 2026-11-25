/**
 * The learner's actions on private Academy providers (ADR 2026-11-25,
 * Decisions 3–6), behind `zam bridge academy-provider-*` and `--provider` on
 * `academy-list | academy-enrol | academy-update`.
 *
 * Studio calls them on a click; `zam academy provider` calls the first four
 * from a terminal. Like the public Academy's handlers, they are neither MCP
 * tools nor Studio-panel bridge commands: adding a provider decides where a
 * login token goes, and only the learner may decide that.
 */

import {
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type AcademyCellFacet,
  type AcademyIndex,
  type AcademyProvider,
  type AcademyTaxonomy,
  type BundledTile,
  bundledCellInfoForTile,
  type ConfirmedAcademyProvider,
  compareTileVersions,
  confirmedProvider,
  confirmProvider,
  type Database,
  type EnrolBundledCellProgress,
  enrichAcademyCells,
  enrolBundledCell,
  getBundledCellsWithStatus,
  installedTileVersion,
  listConfirmedProviders,
  type ProviderChangedField,
  providerChange,
  removeConfirmedProvider,
  reservedProviderIds,
} from "../../kernel/index.js";
import { resolveHandlerUser } from "../bridge-handlers.js";
import {
  type ProviderCacheScope,
  readCachedCatalog,
  readCachedCell,
  readCachedIndex,
  readCachedTileVersion,
  removeProviderCache,
  resolveCachedTile,
  writeCachedCatalog,
  writeCachedCell,
  writeCachedIndex,
} from "./cache.js";
import type { AcademyFetchOptions } from "./catalog-client.js";
import {
  fetchProviderCatalog,
  fetchProviderCell,
  fetchProviderFile,
  fetchProviderIndex,
  type ProviderTokenSupplier,
  providerTokenSupplier,
} from "./provider-client.js";

/** What Studio shows about a provider before and after the learner confirms. */
export interface ProviderSummary {
  id: string;
  title: string;
  publisher: string;
  origin: string;
  /** The host in its ASCII (punycode) form. */
  host: string;
  auth: AcademyProvider["auth"]["kind"];
  /** The report link's host, or null without one. */
  feedbackHost: string | null;
}

export interface ProviderHandlerParams {
  /** Test seams; never a URL. */
  fetch?: AcademyFetchOptions;
  /** Test seam for the Azure CLI token. */
  getToken?: (tenant: string, api: string) => Promise<string>;
}

export interface ProviderCellRow {
  id: string;
  provider: string;
  title: string;
  description: string;
  language: string | null;
  version: string;
  items: number;
  appUrl: string | null;
  bundled: false;
  held: boolean;
  heldVersion: string | null;
  newer: boolean;
  preview: boolean;
  facet: AcademyCellFacet;
}

export function providerSummary(
  origin: string,
  provider: AcademyProvider,
): ProviderSummary {
  let feedbackHost: string | null = null;
  if (provider.feedback) {
    feedbackHost = new URL(
      provider.feedback.replace(/\{(tile|item|version)\}/g, "x"),
    ).hostname;
  }
  return {
    id: provider.id,
    title: provider.title,
    publisher: provider.publisher,
    origin,
    host: new URL(origin).hostname,
    auth: provider.auth.kind,
    feedbackHost,
  };
}

function requireProvider(id: string | undefined): ConfirmedAcademyProvider {
  const confirmed = id ? confirmedProvider(id) : undefined;
  if (!confirmed) {
    throw new Error(
      `PROVIDER_NOT_CONFIRMED: ${id ?? "(none)"} is not a provider added on this machine`,
    );
  }
  return confirmed;
}

function scopeOf(confirmed: ConfirmedAcademyProvider): ProviderCacheScope {
  return { providerId: confirmed.provider.id, origin: confirmed.origin };
}

/** Errors the learner must act on; everything else falls back to the cache. */
function mustSurface(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.startsWith("ENTRA_LOGIN_REQUIRED") ||
    message.startsWith("PROVIDER_ACCESS_DENIED")
  );
}

// ── Adding, listing and removing providers ─────────────────────────────────

/** Reads a provider file for the learner to confirm; writes nothing. */
export async function academyProviderCheckHandler(
  params: ProviderHandlerParams & { url: string },
) {
  const fetched = await fetchProviderFile(params.url, params.fetch);
  if (reservedProviderIds().has(fetched.provider.id)) {
    throw new Error(`Provider id ${fetched.provider.id} is reserved`);
  }
  const existing = listConfirmedProviders().find(
    (entry) => entry.origin === fetched.origin,
  );
  return {
    success: true as const,
    provider: providerSummary(fetched.origin, fetched.provider),
    sha256: fetched.sha256,
    alreadyConfirmed: existing !== undefined,
    changed: existing
      ? providerChange(existing.provider, fetched.provider)
      : ([] as ProviderChangedField[]),
  };
}

/**
 * Saves the provider the learner confirmed. The file is read again and must
 * still hash to what the learner saw, so a provider cannot swap it between
 * the check and the click.
 */
export async function academyProviderAddHandler(
  params: ProviderHandlerParams & { url: string; sha256: string },
) {
  const fetched = await fetchProviderFile(params.url, params.fetch);
  if (fetched.sha256 !== params.sha256?.trim().toLowerCase()) {
    throw new Error(
      "PROVIDER_CHANGED: the provider file changed since it was checked; check it again",
    );
  }
  const confirmed = confirmProvider({
    origin: fetched.origin,
    provider: fetched.provider,
    sha256: fetched.sha256,
  });
  return {
    success: true as const,
    provider: providerSummary(confirmed.origin, confirmed.provider),
  };
}

/** Forgets a provider and its cache; the learner's cards stay. */
export function academyProviderRemoveHandler(params: { id: string }) {
  const id = params.id?.trim() ?? "";
  const removed = removeConfirmedProvider(id);
  if (removed) removeProviderCache(id);
  return { success: true as const, id, removed };
}

export function academyProviderListHandler() {
  return {
    success: true as const,
    providers: listConfirmedProviders().map((entry) =>
      providerSummary(entry.origin, entry.provider),
    ),
  };
}

// ── A provider's packages ──────────────────────────────────────────────────

/**
 * The provider's catalog with the learner's state, like the Academy list.
 * Reads the provider file too (without a token) and reports a changed
 * `id`, `auth` or `feedback`; the confirmed copy stays in use.
 */
export async function providerListHandler(
  db: Database,
  params: ProviderHandlerParams & { provider: string; user?: string },
) {
  const confirmed = requireProvider(params.provider);
  const scope = scopeOf(confirmed);
  const userId = await resolveHandlerUser(db, params.user);
  const token = providerTokenSupplier(confirmed, params.getToken);

  let providerChanged:
    | {
        fields: ProviderChangedField[];
        served: ProviderSummary;
        sha256: string;
      }
    | undefined;
  try {
    const served = await fetchProviderFile(confirmed.origin, params.fetch);
    const fields = providerChange(confirmed.provider, served.provider);
    if (fields.length > 0) {
      providerChanged = {
        fields,
        served: providerSummary(served.origin, served.provider),
        sha256: served.sha256,
      };
    }
  } catch {
    // Offline or unreadable: the confirmed copy is what counts anyway.
  }

  let catalog: AcademyCatalog | null = null;
  let index: AcademyIndex | null = null;
  let offline = false;
  let error: string | undefined;
  const [catalogResult, indexResult] = await Promise.allSettled([
    fetchProviderCatalog(confirmed, token, params.fetch),
    fetchProviderIndex(confirmed, token, params.fetch),
  ]);
  if (catalogResult.status === "fulfilled") {
    writeCachedCatalog(catalogResult.value.bytes, scope);
    catalog = catalogResult.value.catalog;
  } else {
    if (mustSurface(catalogResult.reason)) throw catalogResult.reason;
    offline = true;
    const err = catalogResult.reason;
    error = err instanceof Error ? err.message : String(err);
    catalog = readCachedCatalog(scope);
  }
  if (indexResult.status === "fulfilled") {
    writeCachedIndex(indexResult.value.bytes, scope);
    index = indexResult.value.index;
  } else {
    index = readCachedIndex(scope);
  }

  const entries = catalog?.cells ?? [];
  const installedRows = (await db
    .prepare("SELECT tile_id, version FROM installed_tiles WHERE version <> ''")
    .all()) as Array<{ tile_id: string; version: string }>;
  const installedVersions = new Map(
    installedRows.map((row) => [row.tile_id, row.version]),
  );
  const localTiles = new Map<string, BundledTile>();
  for (const entry of entries) {
    const installed = installedVersions.get(entry.id);
    if (!installed) continue;
    const cached =
      readCachedTileVersion(entry.id, installed, scope) ??
      readCachedCell(entry, scope);
    if (cached) localTiles.set(entry.id, cached);
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

  const rawCells: Array<Omit<ProviderCellRow, "facet">> = entries.map(
    (entry) => {
      const installed = installedVersions.get(entry.id) ?? null;
      const held = statuses.get(entry.id)?.enrolled ?? false;
      const heldVersion = held ? installed : null;
      return {
        id: entry.id,
        provider: confirmed.provider.id,
        title: entry.title,
        description: entry.description,
        language: entry.language,
        version: entry.version,
        items: entry.items,
        appUrl: entry.appUrl,
        bundled: false,
        held,
        heldVersion,
        newer: held && compareTileVersions(entry.version, heldVersion) === 1,
        preview: entry.preview,
      };
    },
  );
  const { taxonomy, cells } = enrichAcademyCells(rawCells, index, (id) =>
    localTiles.get(id),
  );
  return {
    success: true as const,
    offline,
    ...(error ? { error } : {}),
    provider: providerSummary(confirmed.origin, confirmed.provider),
    ...(providerChanged ? { providerChanged } : {}),
    taxonomy: taxonomy as AcademyTaxonomy,
    cells: cells as ProviderCellRow[],
  };
}

async function providerEntry(
  confirmed: ConfirmedAcademyProvider,
  cellId: string,
  token: ProviderTokenSupplier,
  fetch: AcademyFetchOptions | undefined,
  refresh: boolean,
): Promise<AcademyCatalogEntry | undefined> {
  const scope = scopeOf(confirmed);
  let catalog = refresh ? null : readCachedCatalog(scope);
  if (!catalog) {
    const fetched = await fetchProviderCatalog(confirmed, token, fetch);
    writeCachedCatalog(fetched.bytes, scope);
    catalog = fetched.catalog;
  }
  return catalog.cells.find((cell) => cell.id === cellId);
}

async function installProviderCell(
  db: Database,
  userId: string,
  confirmed: ConfirmedAcademyProvider,
  entry: AcademyCatalogEntry,
  token: ProviderTokenSupplier,
  params: ProviderHandlerParams & {
    onProgress?: (progress: EnrolBundledCellProgress) => void;
  },
) {
  const scope = scopeOf(confirmed);
  if (!readCachedCell(entry, scope)) {
    const { bytes } = await fetchProviderCell(
      confirmed,
      entry,
      token,
      params.fetch,
    );
    writeCachedCell(entry, bytes, scope);
  }
  return enrolBundledCell(db, userId, entry.id, {
    resolveTile: (id) => resolveCachedTile(id, scope),
    install: {
      namespace: confirmed.provider.id,
      appUrl: entry.appUrl,
      preview: entry.preview,
    },
    onProgress: params.onProgress,
  });
}

function refuseTeamLibrary(db: Database): void {
  if (db.dialect === "postgres") {
    throw new Error(
      "A team library gets provider packages from a curator: zam team install-cell <id>",
    );
  }
}

/** „Aufnehmen“ on a provider's package. */
export async function providerEnrolHandler(
  db: Database,
  params: ProviderHandlerParams & {
    provider: string;
    cellId: string;
    user?: string;
    onProgress?: (progress: EnrolBundledCellProgress) => void;
  },
) {
  const confirmed = requireProvider(params.provider);
  const cellId = params.cellId?.trim() ?? "";
  if (!cellId.startsWith(`${confirmed.provider.id}:`)) {
    throw new Error(`${cellId} is not a package of ${confirmed.provider.id}`);
  }
  refuseTeamLibrary(db);
  const userId = await resolveHandlerUser(db, params.user);
  const token = providerTokenSupplier(confirmed, params.getToken);
  const entry = await providerEntry(
    confirmed,
    cellId,
    token,
    params.fetch,
    false,
  );
  if (!entry) throw new Error(`${cellId} is not in the provider's catalog`);
  const result = await installProviderCell(
    db,
    userId,
    confirmed,
    entry,
    token,
    params,
  );
  return { ...result, version: await installedTileVersion(db, cellId) };
}

/** „Aktualisieren“ on a held provider package. */
export async function providerUpdateHandler(
  db: Database,
  params: ProviderHandlerParams & {
    provider: string;
    cellId: string;
    user?: string;
    onProgress?: (progress: EnrolBundledCellProgress) => void;
  },
) {
  const confirmed = requireProvider(params.provider);
  const cellId = params.cellId?.trim() ?? "";
  if (!cellId.startsWith(`${confirmed.provider.id}:`)) {
    throw new Error(`${cellId} is not a package of ${confirmed.provider.id}`);
  }
  refuseTeamLibrary(db);
  const userId = await resolveHandlerUser(db, params.user);
  const from = await installedTileVersion(db, cellId);
  if (!from) throw new Error(`Not enrolled in ${cellId}`);
  const token = providerTokenSupplier(confirmed, params.getToken);
  const entry = await providerEntry(
    confirmed,
    cellId,
    token,
    params.fetch,
    true,
  );
  if (!entry || compareTileVersions(entry.version, from) !== 1) {
    return { success: true as const, cellId, updated: false, version: from };
  }
  const result = await installProviderCell(
    db,
    userId,
    confirmed,
    entry,
    token,
    params,
  );
  return {
    success: true as const,
    cellId,
    updated: true,
    from,
    version: await installedTileVersion(db, cellId),
    cardsCreated: result.cardsCreated,
  };
}
