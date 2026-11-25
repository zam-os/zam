/**
 * The machine-local cache of the ZAM Academy catalog (ADR 2026-10-19 D4).
 *
 * It holds the catalog from the learner's last check and the cells fetched
 * with it, under `~/.zam/academy`. Like other machine-local state, it lives
 * outside the library database, which may be shared.
 *
 * A private provider (ADR 2026-11-25 D4) gets its own folder,
 * `~/.zam/academy/providers/<id>/`, with the same layout. Every function takes
 * an optional provider scope; without one it is the public Academy's cache,
 * exactly as before.
 *
 * Agent tools read only this cache: a tool call is not the learner's
 * action, so it never reaches the network. This module therefore imports
 * nothing that fetches.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type AcademyIndex,
  type BundledTile,
  parseAcademyCatalog,
  parseAcademyIndex,
} from "../../kernel/index.js";

/** Which provider's cache: its id (the tile prefix) and confirmed origin. */
export interface ProviderCacheScope {
  providerId: string;
  origin: string;
}

const PROVIDER_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

function providerDir(providerId: string): string {
  // The id is a checked slug already; checked again because it names a folder.
  if (!PROVIDER_ID.test(providerId)) {
    throw new Error(`Invalid provider id ${providerId}`);
  }
  return join(homedir(), ".zam", "academy", "providers", providerId);
}

export function academyCacheDir(scope?: ProviderCacheScope): string {
  return scope
    ? providerDir(scope.providerId)
    : join(homedir(), ".zam", "academy");
}

function cellsDir(scope?: ProviderCacheScope): string {
  return join(academyCacheDir(scope), "cells");
}

/** Deletes a provider's whole cache folder. */
export function removeProviderCache(providerId: string): void {
  rmSync(providerDir(providerId), { recursive: true, force: true });
}

/** `zam-academy:uml` 2026.10.1 → `zam-academy_uml@2026.10.1.json`. */
function cellFileName(id: string, version: string): string {
  return `${id.replace(":", "_")}@${version}.json`;
}

function writeAtomically(path: string, bytes: Buffer | string): void {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, bytes);
  renameSync(temp, path);
}

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Stores a catalog that already passed `parseAcademyCatalog`. */
export function writeCachedCatalog(
  bytes: Buffer,
  scope?: ProviderCacheScope,
): void {
  mkdirSync(academyCacheDir(scope), { recursive: true });
  writeAtomically(join(academyCacheDir(scope), "catalog.json"), bytes);
}

/** The catalog of the learner's last check, or null. */
export function readCachedCatalog(
  scope?: ProviderCacheScope,
): AcademyCatalog | null {
  const path = join(academyCacheDir(scope), "catalog.json");
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return scope
      ? parseAcademyCatalog(raw, {
          origin: scope.origin,
          prefix: scope.providerId,
        })
      : parseAcademyCatalog(raw);
  } catch {
    return null;
  }
}

/** Stores an index (`academy.json`) that already passed `parseAcademyIndex`. */
export function writeCachedIndex(
  bytes: Buffer,
  scope?: ProviderCacheScope,
): void {
  mkdirSync(academyCacheDir(scope), { recursive: true });
  writeAtomically(join(academyCacheDir(scope), "academy.json"), bytes);
}

/** The index (`academy.json`) of the learner's last check, or null. */
export function readCachedIndex(
  scope?: ProviderCacheScope,
): AcademyIndex | null {
  const path = join(academyCacheDir(scope), "academy.json");
  if (!existsSync(path)) return null;
  try {
    return parseAcademyIndex(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
}

/** Stores a cell whose bytes already matched its catalog entry. */
export function writeCachedCell(
  entry: AcademyCatalogEntry,
  bytes: Buffer,
  scope?: ProviderCacheScope,
): void {
  if (sha256Hex(bytes) !== entry.sha256) {
    throw new Error(
      `Academy cell ${entry.id}: hash does not match the catalog`,
    );
  }
  mkdirSync(cellsDir(scope), { recursive: true });
  writeAtomically(
    join(cellsDir(scope), cellFileName(entry.id, entry.version)),
    bytes,
  );
}

/** The cached cell for this catalog entry, if its bytes still match. */
export function readCachedCell(
  entry: AcademyCatalogEntry,
  scope?: ProviderCacheScope,
): BundledTile | undefined {
  const path = join(cellsDir(scope), cellFileName(entry.id, entry.version));
  if (!existsSync(path)) return undefined;
  const bytes = readFileSync(path);
  if (sha256Hex(bytes) !== entry.sha256) return undefined;
  return parseCell(bytes, entry.id);
}

/**
 * The cached cell of the version the last catalog lists, with its hash
 * checked. A build the catalog no longer lists is never resolved, even if
 * an earlier check cached it.
 */
export function resolveCachedTile(
  id: string,
  scope?: ProviderCacheScope,
): BundledTile | undefined {
  const entry = readCachedCatalog(scope)?.cells.find((cell) => cell.id === id);
  return entry ? readCachedCell(entry, scope) : undefined;
}

/** The cached cell of exactly this version, if a check fetched it. */
export function readCachedTileVersion(
  id: string,
  version: string,
  scope?: ProviderCacheScope,
): BundledTile | undefined {
  const path = join(cellsDir(scope), cellFileName(id, version));
  if (!existsSync(path)) return undefined;
  const tile = parseCell(readFileSync(path), id);
  return tile && String(tile.version) === version ? tile : undefined;
}

/** Every cached cell the last catalog lists, newest version each. */
export function cachedCatalogTiles(scope?: ProviderCacheScope): BundledTile[] {
  const catalog = readCachedCatalog(scope);
  if (!catalog) return [];
  return catalog.cells
    .map((entry) => readCachedCell(entry, scope))
    .filter((tile): tile is BundledTile => tile !== undefined);
}

function parseCell(bytes: Buffer, id: string): BundledTile | undefined {
  try {
    const tile = JSON.parse(bytes.toString("utf8")) as BundledTile;
    return tile?.tile_id === id && Array.isArray(tile.atoms) ? tile : undefined;
  } catch {
    return undefined;
  }
}
