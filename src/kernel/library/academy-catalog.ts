/**
 * The ZAM Academy catalog (ADR 2026-10-19, Decisions 2 and 4).
 *
 * `https://academy.zam-os.org/catalog.json` lists the published academy
 * cells. This module only parses and checks it. Fetching, hashing and the
 * machine-local cache live in the CLI (`src/cli/academy/`); the kernel has
 * no HTTP. Mobile imports this module: no Node built-ins.
 */

import { compareTileVersions } from "./tile-version.js";

/** The one origin ZAM reads academy content from; nothing can change it. */
export const ACADEMY_ORIGIN = "https://academy.zam-os.org";

export interface AcademyCatalogEntry {
  /** The cell's tile id, e.g. `zam-academy:uml`. */
  id: string;
  title: string;
  description: string;
  language: string | null;
  /** Dotted number, e.g. `2026.10.1`. */
  version: string;
  /** Practice items, i.e. the cards a learner gets on enrolment. */
  items: number;
  /** The app, resolved against the origin. */
  appUrl: string;
  /** The cell file, resolved against the origin. */
  cellUrl: string;
  /** SHA-256 of the cell file's bytes, lowercase hex. */
  sha256: string;
}

export interface AcademyCatalog {
  schema: 1;
  cells: AcademyCatalogEntry[];
}

const ID = /^[a-z0-9-]{1,40}:[a-z0-9-]{1,80}$/;
const SHA256 = /^[0-9a-f]{64}$/;

/**
 * Checks a parsed `catalog.json` and resolves its paths against the origin.
 * Throws on anything unexpected: a catalog that is wrong in one place is
 * not trusted in the others.
 */
export function parseAcademyCatalog(raw: unknown): AcademyCatalog {
  if (!isRecord(raw) || raw.schema !== 1 || !Array.isArray(raw.cells)) {
    throw new Error("Academy catalog: expected { schema: 1, cells: [...] }");
  }
  const seen = new Set<string>();
  const cells = raw.cells.map((value, index): AcademyCatalogEntry => {
    const where = `Academy catalog entry ${index}`;
    if (!isRecord(value)) throw new Error(`${where}: not an object`);
    const id = text(value.id);
    if (!ID.test(id)) throw new Error(`${where}: invalid id`);
    if (seen.has(id)) throw new Error(`${where}: duplicate id ${id}`);
    seen.add(id);
    const version = text(value.version);
    if (compareTileVersions(version, version) !== 0) {
      throw new Error(`${where}: version must be a dotted number`);
    }
    const sha256 = text(value.sha256);
    if (!SHA256.test(sha256)) throw new Error(`${where}: invalid sha256`);
    const items = value.items;
    if (typeof items !== "number" || !Number.isInteger(items) || items < 0) {
      throw new Error(`${where}: invalid item count`);
    }
    const language = value.language;
    return {
      id,
      title: text(value.title) || id,
      description: text(value.description),
      language: typeof language === "string" ? language : null,
      version,
      items,
      appUrl: academyUrl(value.app, `${where}: app`),
      cellUrl: academyUrl(value.cell, `${where}: cell`),
      sha256,
    };
  });
  return { schema: 1, cells };
}

/**
 * A catalog path resolved against the origin. Only a plain absolute path
 * qualifies, so an entry can never point ZAM at another host.
 */
export function academyUrl(path: unknown, where = "Academy path"): string {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.length > 200 ||
    /[\\?#%@:\s]|\.\.|\/\//.test(path)
  ) {
    throw new Error(`${where}: must be a plain path on ${ACADEMY_ORIGIN}`);
  }
  const url = new URL(path, ACADEMY_ORIGIN);
  if (url.origin !== ACADEMY_ORIGIN) {
    throw new Error(`${where}: must be a plain path on ${ACADEMY_ORIGIN}`);
  }
  return url.href;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Whether a bundled tile may stand in when the cell of a catalog entry
 * cannot be downloaded: only at the same version or newer. A learner who
 * takes the version the catalog showed never quietly gets an older one.
 */
export function bundleStandsIn(
  entry: AcademyCatalogEntry,
  bundledVersion: string | number | undefined,
): boolean {
  if (bundledVersion === undefined) return false;
  const order = compareTileVersions(String(bundledVersion), entry.version);
  return order === 0 || order === 1;
}
