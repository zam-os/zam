/**
 * Reads the ZAM Academy catalog and its cells (ADR 2026-10-19 D4).
 *
 * Only a learner's action calls this: opening the Academy list, „Aufnehmen“
 * or „Aktualisieren“ in Studio. No MCP tool and no Studio-panel bridge
 * command imports it.
 *
 * - The origin is the kernel's constant. Catalog paths are resolved against
 *   it, so an entry cannot name another host.
 * - Any redirect fails (`maxRedirects: 0`).
 * - Responses are size-limited.
 * - A cell's bytes must match the SHA-256 in the catalog, and its tile id
 *   and version must match the entry.
 */

import {
  ACADEMY_ORIGIN,
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type AcademyIndex,
  type BundledTile,
  parseAcademyCatalog,
  parseAcademyIndex,
} from "../../kernel/index.js";
import { CONTENT_USER_AGENT } from "../adapters/source-reader.js";
import { type SafeFetchOptions, safeFetch } from "../net/safe-fetch.js";
import { sha256Hex } from "./cache.js";

export const ACADEMY_CATALOG_URL = `${ACADEMY_ORIGIN}/catalog.json`;
export const ACADEMY_INDEX_URL = `${ACADEMY_ORIGIN}/academy.json`;
export const CATALOG_MAX_BYTES = 256 * 1024;
export const INDEX_MAX_BYTES = 512 * 1024;
export const CELL_MAX_BYTES = 2 * 1024 * 1024;

/** Test seams of `safeFetch`. Never a URL: the origin is fixed. */
export type AcademyFetchOptions = Pick<
  SafeFetchOptions,
  "transport" | "resolve"
>;

/** The one origin a request may go to, and what it may carry. */
export interface OriginScope {
  origin: string;
  /** Extra headers, such as a provider's `Authorization`. */
  headers?: Record<string, string>;
  /** A private provider: 401 and 403 become `PROVIDER_ACCESS_DENIED`. */
  provider?: { title: string; publisher: string };
}

/**
 * GET `url` with the Academy rules: only on `scope.origin`, no redirect at
 * all, a size limit. Headers — a token included — therefore never leave
 * that origin (ADR 2026-11-25 Decision 4).
 */
export async function fetchOriginBytes(
  url: string,
  maxBytes: number,
  options: AcademyFetchOptions,
  scope: OriginScope,
): Promise<Buffer> {
  if (new URL(url).origin !== scope.origin) {
    throw new Error(`Academy content comes only from ${scope.origin}`);
  }
  const response = await safeFetch(url, {
    ...options,
    maxBytes,
    maxRedirects: 0,
    headers: {
      Accept: "application/json",
      "User-Agent": CONTENT_USER_AGENT,
      ...scope.headers,
    },
  });
  if (scope.provider && (response.status === 401 || response.status === 403)) {
    throw new Error(
      `PROVIDER_ACCESS_DENIED: ${scope.provider.title} did not let this account in (HTTP ${response.status}). Ask ${scope.provider.publisher} for access.`,
    );
  }
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function fetchBytes(
  url: string,
  maxBytes: number,
  options: AcademyFetchOptions,
): Promise<Buffer> {
  return fetchOriginBytes(url, maxBytes, options, { origin: ACADEMY_ORIGIN });
}

export async function fetchAcademyCatalog(
  options: AcademyFetchOptions = {},
): Promise<{ catalog: AcademyCatalog; bytes: Buffer }> {
  const bytes = await fetchBytes(
    ACADEMY_CATALOG_URL,
    CATALOG_MAX_BYTES,
    options,
  );
  const catalog = parseAcademyCatalog(JSON.parse(bytes.toString("utf8")));
  return { catalog, bytes };
}

export async function fetchAcademyIndex(
  options: AcademyFetchOptions = {},
): Promise<{ index: AcademyIndex; bytes: Buffer }> {
  const bytes = await fetchBytes(ACADEMY_INDEX_URL, INDEX_MAX_BYTES, options);
  const index = parseAcademyIndex(JSON.parse(bytes.toString("utf8")));
  return { index, bytes };
}

export async function fetchAcademyCell(
  entry: AcademyCatalogEntry,
  options: AcademyFetchOptions = {},
): Promise<{ tile: BundledTile; bytes: Buffer }> {
  const bytes = await fetchBytes(entry.cellUrl, CELL_MAX_BYTES, options);
  if (sha256Hex(bytes) !== entry.sha256) {
    throw new Error(
      `Academy cell ${entry.id}: hash does not match the catalog`,
    );
  }
  const tile = JSON.parse(bytes.toString("utf8")) as BundledTile;
  if (tile?.tile_id !== entry.id || String(tile.version) !== entry.version) {
    throw new Error(
      `Academy cell ${entry.id}: the file is ${tile?.tile_id} ${tile?.version}, the catalog says ${entry.version}`,
    );
  }
  return { tile, bytes };
}
