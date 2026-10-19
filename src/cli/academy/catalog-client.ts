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
  type BundledTile,
  parseAcademyCatalog,
} from "../../kernel/index.js";
import { CONTENT_USER_AGENT } from "../adapters/source-reader.js";
import { type SafeFetchOptions, safeFetch } from "../net/safe-fetch.js";
import { sha256Hex } from "./cache.js";

export const ACADEMY_CATALOG_URL = `${ACADEMY_ORIGIN}/catalog.json`;
const CATALOG_MAX_BYTES = 256 * 1024;
const CELL_MAX_BYTES = 2 * 1024 * 1024;

/** Test seams of `safeFetch`. Never a URL: the origin is fixed. */
export type AcademyFetchOptions = Pick<
  SafeFetchOptions,
  "transport" | "resolve"
>;

async function fetchBytes(
  url: string,
  maxBytes: number,
  options: AcademyFetchOptions,
): Promise<Buffer> {
  if (new URL(url).origin !== ACADEMY_ORIGIN) {
    throw new Error(`Academy content comes only from ${ACADEMY_ORIGIN}`);
  }
  const response = await safeFetch(url, {
    ...options,
    maxBytes,
    maxRedirects: 0,
    headers: { Accept: "application/json", "User-Agent": CONTENT_USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
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
