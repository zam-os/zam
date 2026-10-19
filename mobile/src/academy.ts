/**
 * The ZAM Academy on Mobile (ADR 2026-10-19, Decisions 4 and 5).
 *
 * Mobile has no Node, so it reads the catalog with the WebView's `fetch`,
 * under the same rules as the desktop CLI:
 * - only the origin constant;
 * - no redirects (`redirect: "error"`);
 * - size caps;
 * - a cell must match the SHA-256 in the catalog (`crypto.subtle`), and its
 *   tile id and version must match the entry.
 *
 * Only the learner's tap calls this. Fetched cells live for the session.
 */

import {
  ACADEMY_ORIGIN,
  type AcademyCatalog,
  type AcademyCatalogEntry,
  parseAcademyCatalog,
} from "../../src/kernel/library/academy-catalog.js";
import type { BundledTile } from "../../src/kernel/library/bundled-cells.js";

export const ACADEMY_CATALOG_URL = `${ACADEMY_ORIGIN}/catalog.json`;
const CATALOG_MAX_BYTES = 256 * 1024;
const CELL_MAX_BYTES = 2 * 1024 * 1024;

export type AcademyFetch = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

async function fetchBytes(
  url: string,
  maxBytes: number,
  fetchImpl: AcademyFetch,
): Promise<Uint8Array<ArrayBuffer>> {
  if (new URL(url).origin !== ACADEMY_ORIGIN) {
    throw new Error(`Academy content comes only from ${ACADEMY_ORIGIN}`);
  }
  const response = await fetchImpl(url, {
    redirect: "error",
    credentials: "omit",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (response.redirected) throw new Error(`${url}: redirected`);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error(`${url}: larger than ${maxBytes} bytes`);
  }
  return bytes;
}

export async function sha256Hex(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function fetchMobileAcademyCatalog(
  fetchImpl: AcademyFetch = fetch,
): Promise<AcademyCatalog> {
  const bytes = await fetchBytes(
    ACADEMY_CATALOG_URL,
    CATALOG_MAX_BYTES,
    fetchImpl,
  );
  return parseAcademyCatalog(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function fetchMobileAcademyCell(
  entry: AcademyCatalogEntry,
  fetchImpl: AcademyFetch = fetch,
): Promise<BundledTile> {
  const bytes = await fetchBytes(entry.cellUrl, CELL_MAX_BYTES, fetchImpl);
  if ((await sha256Hex(bytes)) !== entry.sha256) {
    throw new Error(
      `Academy cell ${entry.id}: hash does not match the catalog`,
    );
  }
  const tile = JSON.parse(new TextDecoder().decode(bytes)) as BundledTile;
  if (tile?.tile_id !== entry.id || String(tile.version) !== entry.version) {
    throw new Error(
      `Academy cell ${entry.id}: the file is ${tile?.tile_id} ${tile?.version}, the catalog says ${entry.version}`,
    );
  }
  return tile;
}
