/**
 * The ZAM Academy catalog and index (ADR 2026-10-19, Decisions 2 and 4).
 *
 * `https://academy.zam-os.org/catalog.json` lists the published academy
 * cells with their hashes and card counts.
 * `https://academy.zam-os.org/academy.json` carries the lightweight index
 * (schools, knowledge areas, subjects, combined subjects, and per-package
 * grade/school/subject/topic metadata) used for fast multi-stage browsing
 * and search without downloading individual `cell.json` files.
 *
 * This module only parses and checks both JSON documents. Fetching, hashing
 * and the machine-local cache live in the CLI (`src/cli/academy/`); the
 * kernel has no HTTP. Mobile imports this module: no Node built-ins.
 */

import type { Database } from "../db/types.js";
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
  /**
   * A public preview: no teacher has reviewed its content yet. Every surface
   * that offers the cell says so.
   */
  preview: boolean;
}

export interface AcademyCatalog {
  schema: 1;
  cells: AcademyCatalogEntry[];
}

export interface AcademySchool {
  id: string;
  name: string;
  wo: string;
  short: string;
  from: number;
  to: number;
}

export interface AcademyBereich {
  id: string;
  name: string;
  glyph: string;
}

export interface AcademyFach {
  id: string;
  name: string;
  bereich: string;
  glyph: string;
  hue: number;
  from: number;
  to?: number;
}

export interface AcademyFachverbund {
  id: string;
  name: string;
  glyph: string;
  school: string;
  grades: number[];
  paths: string[];
  note?: string;
}

export interface AcademyPackageMeta {
  id: string;
  app: string;
  title: string;
  fach: string;
  grade: number | null;
  /** Effective grade list (sorted, unique); empty for cross-grade packages. */
  grades: number[];
  school: string | null;
  zweige: string | null;
  lessons: number | null;
  gebiete: string[];
  desc: string;
}

export interface AcademyIndex {
  schema: 1;
  goal: string;
  schulen: AcademySchool[];
  bereiche: AcademyBereich[];
  faecher: AcademyFach[];
  fachverbunde: AcademyFachverbund[];
  pakete: AcademyPackageMeta[];
}

const ID = /^[a-z0-9-]{1,40}:[a-z0-9-]{1,80}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
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
    const preview = value.preview === undefined ? false : value.preview;
    if (typeof preview !== "boolean") {
      throw new Error(`${where}: preview must be true or false`);
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
      preview,
    };
  });
  return { schema: 1, cells };
}

export interface ParseAcademyIndexOptions {
  /** Called when an individual malformed/duplicate package entry is skipped. */
  onSkip?: (reason: string) => void;
}

/**
 * Checks a parsed `academy.json` index (the metadata backbone of
 * `academy.zam-os.org`: schools, knowledge areas, subjects, combined
 * subjects and packages). Top-level structure and taxonomy arrays are
 * validated strictly; individual malformed or duplicate package entries
 * are skipped so one broken upstream package cannot drop facets for the
 * rest of the catalog.
 */
export function parseAcademyIndex(
  raw: unknown,
  options?: ParseAcademyIndexOptions,
): AcademyIndex {
  if (
    !isRecord(raw) ||
    raw.schema !== 1 ||
    !Array.isArray(raw.schulen) ||
    !Array.isArray(raw.bereiche) ||
    !Array.isArray(raw.faecher) ||
    !Array.isArray(raw.pakete)
  ) {
    throw new Error(
      "Academy index: expected { schema: 1, schulen, bereiche, faecher, pakete }",
    );
  }
  const seenSchools = new Set<string>();
  const schulen = raw.schulen.map((value, index): AcademySchool => {
    const where = `Academy index school ${index}`;
    if (!isRecord(value)) throw new Error(`${where}: not an object`);
    const id = slug(value.id, `${where}: id`);
    if (seenSchools.has(id)) throw new Error(`${where}: duplicate id ${id}`);
    seenSchools.add(id);
    const name = text(value.name);
    if (!name) throw new Error(`${where}: name required`);
    const from = gradeInt(value.from, `${where}: from`);
    const to = gradeInt(value.to, `${where}: to`);
    return {
      id,
      name,
      wo: text(value.wo) || name,
      short: text(value.short) || name,
      from,
      to,
    };
  });

  const seenBereiche = new Set<string>();
  const bereiche = raw.bereiche.map((value, index): AcademyBereich => {
    const where = `Academy index bereich ${index}`;
    if (!isRecord(value)) throw new Error(`${where}: not an object`);
    const id = slug(value.id, `${where}: id`);
    if (seenBereiche.has(id)) throw new Error(`${where}: duplicate id ${id}`);
    seenBereiche.add(id);
    const name = text(value.name);
    if (!name) throw new Error(`${where}: name required`);
    return { id, name, glyph: text(value.glyph) || name.slice(0, 2) };
  });

  const seenFaecher = new Set<string>();
  const faecher = raw.faecher.map((value, index): AcademyFach => {
    const where = `Academy index fach ${index}`;
    if (!isRecord(value)) throw new Error(`${where}: not an object`);
    const id = slug(value.id, `${where}: id`);
    if (seenFaecher.has(id)) throw new Error(`${where}: duplicate id ${id}`);
    seenFaecher.add(id);
    const name = text(value.name);
    if (!name) throw new Error(`${where}: name required`);
    const bereich = slug(value.bereich, `${where}: bereich`);
    const hueRaw = value.hue;
    if (typeof hueRaw !== "number" || !Number.isFinite(hueRaw)) {
      throw new Error(`${where}: invalid hue`);
    }
    const hue = ((Math.round(hueRaw) % 360) + 360) % 360;
    const from = gradeInt(value.from, `${where}: from`);
    const to =
      value.to === undefined ? undefined : gradeInt(value.to, `${where}: to`);
    return {
      id,
      name,
      bereich,
      glyph: text(value.glyph) || name.slice(0, 2),
      hue,
      from,
      ...(to !== undefined ? { to } : {}),
    };
  });

  const fachverbundeRaw = raw.fachverbunde;
  if (fachverbundeRaw !== undefined && !Array.isArray(fachverbundeRaw)) {
    throw new Error("Academy index: fachverbunde must be an array");
  }
  const fachverbunde = (fachverbundeRaw ?? []).map(
    (value, index): AcademyFachverbund => {
      const where = `Academy index fachverbund ${index}`;
      if (!isRecord(value)) throw new Error(`${where}: not an object`);
      const id = slug(value.id, `${where}: id`);
      const name = text(value.name);
      if (!name) throw new Error(`${where}: name required`);
      const school = slug(value.school, `${where}: school`);
      if (!Array.isArray(value.grades)) {
        throw new Error(`${where}: grades must be an array`);
      }
      const grades = [
        ...new Set(value.grades.map((g) => gradeInt(g, `${where}: grade`))),
      ].sort((a, b) => a - b);
      if (!Array.isArray(value.paths)) {
        throw new Error(`${where}: paths must be an array`);
      }
      const paths = [
        ...new Set(value.paths.map((p) => slug(p, `${where}: path`))),
      ];
      const note = text(value.note);
      return {
        id,
        name,
        glyph: text(value.glyph) || name.slice(0, 3),
        school,
        grades,
        paths,
        ...(note ? { note } : {}),
      };
    },
  );

  const seenApps = new Set<string>();
  const pakete: AcademyPackageMeta[] = [];
  for (let index = 0; index < raw.pakete.length; index++) {
    const value = raw.pakete[index];
    const where = `Academy index package ${index}`;
    try {
      if (!isRecord(value)) throw new Error(`${where}: not an object`);
      const id = slug(value.id, `${where}: id`);
      const app = slug(value.app, `${where}: app`);
      if (seenApps.has(app)) throw new Error(`${where}: duplicate app ${app}`);
      const fach = slug(value.fach, `${where}: fach`);
      const grade =
        value.grade === null || value.grade === undefined
          ? null
          : gradeInt(value.grade, `${where}: grade`);
      let grades: number[];
      if (value.grades !== undefined) {
        if (!Array.isArray(value.grades)) {
          throw new Error(`${where}: grades must be an array`);
        }
        grades = [
          ...new Set(value.grades.map((g) => gradeInt(g, `${where}: grades`))),
        ].sort((a, b) => a - b);
      } else {
        grades = grade !== null ? [grade] : [];
      }
      const school =
        value.school === null || value.school === undefined
          ? null
          : slug(value.school, `${where}: school`);
      const lessonsRaw = value.lessons;
      const lessons =
        typeof lessonsRaw === "number" &&
        Number.isInteger(lessonsRaw) &&
        lessonsRaw >= 0
          ? lessonsRaw
          : null;
      const gebiete = Array.isArray(value.gebiete)
        ? value.gebiete
            .map((item) => text(item))
            .filter(Boolean)
            .slice(0, 30)
        : [];
      const zweige = text(value.zweige) || null;
      seenApps.add(app);
      pakete.push({
        id,
        app,
        title: text(value.title) || id,
        fach,
        grade,
        grades,
        school,
        zweige,
        lessons,
        gebiete,
        desc: text(value.desc),
      });
    } catch (err) {
      options?.onSkip?.(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    schema: 1,
    goal: text(raw.goal),
    schulen,
    bereiche,
    faecher,
    fachverbunde,
    pakete,
  };
}

/**
 * Extracts the app slug (`uml`, `biologie-realschule-8`, …) from an academy
 * app URL, catalog path, or tile id (`zam-academy:<slug>`).
 */
export function academyAppSlug(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("zam-academy:")) {
    return trimmed.slice("zam-academy:".length);
  }
  const stripped = trimmed
    .replace(ACADEMY_ORIGIN, "")
    .replace(/^\/+|\/+$/g, "");
  return stripped.split("/")[0] ?? "";
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

function slug(value: unknown, where: string): string {
  const s = text(value);
  if (!SLUG.test(s)) throw new Error(`${where}: invalid slug`);
  return s;
}

function gradeInt(value: unknown, where: string): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 13
  ) {
    throw new Error(`${where}: invalid grade`);
  }
  return value;
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

/**
 * Counts active (non-detached) cards a learner holds for an academy app URL
 * (e.g. `https://academy.zam-os.org/uml/#lesson=...`).
 *
 * Used by Desktop, CLI and Mobile when a catalog-only cell is installed in
 * `installed_tiles` (for instance after a restart or sync from another device)
 * without its `cell.json` loaded locally, so deleting or detaching all cards
 * clears the learner's held state instead of leaving "Taken" disabled.
 */
export async function countUserAcademyAppCards(
  db: Database,
  userId: string,
  appUrl: string | null | undefined,
): Promise<number> {
  const trimmed = appUrl?.trim();
  if (!trimmed) return 0;
  const prefix = trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  const bare = prefix.slice(0, -1);
  const escapedPrefix = prefix.replace(/[\\%_]/g, "\\$&");
  const row = (await db
    .prepare(
      `SELECT COUNT(DISTINCT c.id) AS n
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.user_id = ?
          AND c.detached_at IS NULL
          AND (
            t.source_link = ?
            OR t.source_link = ?
            OR t.source_link LIKE ? ESCAPE '\\'
          )`,
    )
    .get(userId, prefix, bare, `${escapedPrefix}%`)) as
    | { n: number }
    | undefined;
  return Number(row?.n ?? 0);
}

/**
 * Whether the learner holds at least one active (non-detached) card pointing
 * to an academy app URL.
 */
export async function userHoldsAcademyAppCards(
  db: Database,
  userId: string,
  appUrl: string | null | undefined,
): Promise<boolean> {
  return (await countUserAcademyAppCards(db, userId, appUrl)) > 0;
}
