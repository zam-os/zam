/**
 * Reads a private Academy provider (ADR 2026-11-25, Decisions 2 and 4).
 *
 * Only a learner's action calls this — adding a provider, opening its list,
 * „Aufnehmen“, „Aktualisieren“ — never an MCP tool or a Studio-panel bridge
 * command. The rules are the Academy's, per provider:
 *
 * - every request goes to the confirmed origin and nowhere else;
 * - any redirect fails, so the token cannot follow one;
 * - responses are size-limited;
 * - a cell must match the SHA-256, tile id and version in the catalog, and
 *   the catalog may only list tiles in the provider's namespace.
 *
 * The provider file itself is read without a token: it says which token to
 * ask for.
 */

import {
  ACADEMY_PROVIDER_FILE,
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type AcademyIndex,
  type AcademyProvider,
  type BundledTile,
  type ConfirmedAcademyProvider,
  parseAcademyCatalog,
  parseAcademyIndex,
  parseAcademyProvider,
  providerOrigin,
} from "../../kernel/index.js";
import { entraCliApiToken } from "../db/entra-cli.js";
import { sha256Hex } from "./cache.js";
import {
  type AcademyFetchOptions,
  CATALOG_MAX_BYTES,
  CELL_MAX_BYTES,
  fetchOriginBytes,
  INDEX_MAX_BYTES,
} from "./catalog-client.js";

const PROVIDER_FILE_MAX_BYTES = 16 * 1024;

/** A token for one learner action, or null for a provider without login. */
export type ProviderTokenSupplier = () => Promise<string | null>;

/**
 * Asks the Azure CLI at most once per learner action, and only for a provider
 * whose confirmed file says `entra-cli`.
 */
export function providerTokenSupplier(
  confirmed: ConfirmedAcademyProvider,
  getToken: (tenant: string, api: string) => Promise<string> = entraCliApiToken,
): ProviderTokenSupplier {
  let pending: Promise<string | null> | null = null;
  return () => {
    if (!pending) {
      const auth = confirmed.provider.auth;
      pending =
        auth.kind === "entra-cli"
          ? getToken(auth.tenant, auth.api)
          : Promise.resolve(null);
      // A failed attempt may be retried on the next call.
      pending.catch(() => {
        pending = null;
      });
    }
    return pending;
  };
}

export interface FetchedProviderFile {
  origin: string;
  provider: AcademyProvider;
  bytes: Buffer;
  sha256: string;
}

/**
 * Reads `<origin>/zam-provider.json` for an address the learner pasted. Only
 * the address's origin is used; its path, query and fragment are dropped.
 */
export async function fetchProviderFile(
  address: string,
  options: AcademyFetchOptions = {},
): Promise<FetchedProviderFile> {
  let url: URL;
  try {
    url = new URL(address.trim());
  } catch {
    throw new Error("Provider address must be an https URL");
  }
  const origin = providerOrigin(url.origin);
  const bytes = await fetchOriginBytes(
    `${origin}${ACADEMY_PROVIDER_FILE}`,
    PROVIDER_FILE_MAX_BYTES,
    options,
    { origin },
  );
  let raw: unknown;
  try {
    raw = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Provider file: not JSON");
  }
  return {
    origin,
    provider: parseAcademyProvider(raw),
    bytes,
    sha256: sha256Hex(bytes),
  };
}

async function providerScope(
  confirmed: ConfirmedAcademyProvider,
  token: ProviderTokenSupplier,
) {
  const value = await token();
  return {
    origin: confirmed.origin,
    headers: value ? { Authorization: `Bearer ${value}` } : undefined,
    provider: {
      title: confirmed.provider.title,
      publisher: confirmed.provider.publisher,
    },
  };
}

export async function fetchProviderCatalog(
  confirmed: ConfirmedAcademyProvider,
  token: ProviderTokenSupplier,
  options: AcademyFetchOptions = {},
): Promise<{ catalog: AcademyCatalog; bytes: Buffer }> {
  const bytes = await fetchOriginBytes(
    `${confirmed.origin}/catalog.json`,
    CATALOG_MAX_BYTES,
    options,
    await providerScope(confirmed, token),
  );
  const catalog = parseAcademyCatalog(JSON.parse(bytes.toString("utf8")), {
    origin: confirmed.origin,
    prefix: confirmed.provider.id,
  });
  return { catalog, bytes };
}

export async function fetchProviderIndex(
  confirmed: ConfirmedAcademyProvider,
  token: ProviderTokenSupplier,
  options: AcademyFetchOptions = {},
): Promise<{ index: AcademyIndex; bytes: Buffer }> {
  const bytes = await fetchOriginBytes(
    `${confirmed.origin}/academy.json`,
    INDEX_MAX_BYTES,
    options,
    await providerScope(confirmed, token),
  );
  const index = parseAcademyIndex(JSON.parse(bytes.toString("utf8")));
  return { index, bytes };
}

export async function fetchProviderCell(
  confirmed: ConfirmedAcademyProvider,
  entry: AcademyCatalogEntry,
  token: ProviderTokenSupplier,
  options: AcademyFetchOptions = {},
): Promise<{ tile: BundledTile; bytes: Buffer }> {
  if (!entry.id.startsWith(`${confirmed.provider.id}:`)) {
    throw new Error(
      `${entry.id} is outside the namespace ${confirmed.provider.id}:`,
    );
  }
  const bytes = await fetchOriginBytes(
    entry.cellUrl,
    CELL_MAX_BYTES,
    options,
    await providerScope(confirmed, token),
  );
  if (sha256Hex(bytes) !== entry.sha256) {
    throw new Error(
      `Provider cell ${entry.id}: hash does not match the catalog`,
    );
  }
  const tile = JSON.parse(bytes.toString("utf8")) as BundledTile;
  if (tile?.tile_id !== entry.id || String(tile.version) !== entry.version) {
    throw new Error(
      `Provider cell ${entry.id}: the file is ${tile?.tile_id} ${tile?.version}, the catalog says ${entry.version}`,
    );
  }
  return { tile, bytes };
}
