/**
 * The machine-local cache of the ZAM Academy catalog (ADR 2026-10-19 D4).
 *
 * It holds the catalog from the learner's last check and the cells fetched
 * with it, under `~/.zam/academy`. Like other machine-local state, it lives
 * outside the library database, which may be shared.
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
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  type AcademyCatalog,
  type AcademyCatalogEntry,
  type BundledTile,
  parseAcademyCatalog,
} from "../../kernel/index.js";

export function academyCacheDir(): string {
  return join(homedir(), ".zam", "academy");
}

function cellsDir(): string {
  return join(academyCacheDir(), "cells");
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
export function writeCachedCatalog(bytes: Buffer): void {
  mkdirSync(academyCacheDir(), { recursive: true });
  writeAtomically(join(academyCacheDir(), "catalog.json"), bytes);
}

/** The catalog of the learner's last check, or null. */
export function readCachedCatalog(): AcademyCatalog | null {
  const path = join(academyCacheDir(), "catalog.json");
  if (!existsSync(path)) return null;
  try {
    return parseAcademyCatalog(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
}

/** Stores a cell whose bytes already matched its catalog entry. */
export function writeCachedCell(
  entry: AcademyCatalogEntry,
  bytes: Buffer,
): void {
  if (sha256Hex(bytes) !== entry.sha256) {
    throw new Error(
      `Academy cell ${entry.id}: hash does not match the catalog`,
    );
  }
  mkdirSync(cellsDir(), { recursive: true });
  writeAtomically(
    join(cellsDir(), cellFileName(entry.id, entry.version)),
    bytes,
  );
}

/** The cached cell for this catalog entry, if its bytes still match. */
export function readCachedCell(
  entry: AcademyCatalogEntry,
): BundledTile | undefined {
  const path = join(cellsDir(), cellFileName(entry.id, entry.version));
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
export function resolveCachedTile(id: string): BundledTile | undefined {
  const entry = readCachedCatalog()?.cells.find((cell) => cell.id === id);
  return entry ? readCachedCell(entry) : undefined;
}

/** The cached cell of exactly this version, if a check fetched it. */
export function readCachedTileVersion(
  id: string,
  version: string,
): BundledTile | undefined {
  const path = join(cellsDir(), cellFileName(id, version));
  if (!existsSync(path)) return undefined;
  const tile = parseCell(readFileSync(path), id);
  return tile && String(tile.version) === version ? tile : undefined;
}

/** Every cached cell the last catalog lists, newest version each. */
export function cachedCatalogTiles(): BundledTile[] {
  const catalog = readCachedCatalog();
  if (!catalog) return [];
  return catalog.cells
    .map((entry) => resolveCachedTile(entry.id))
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
