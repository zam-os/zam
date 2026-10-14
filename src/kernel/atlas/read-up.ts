/**
 * Reading up (ADR 2026-10-14, Decision 4): the learner's function to read a
 * world unit up, never a source.
 *
 * - A unit from a web source opens that page: its source is the place to
 *   read it up.
 * - Any other world unit opens a reference work's search, Wikipedia first,
 *   for its lookup term: the article name the model proposed in a topic
 *   import, else the unit's title. The surface builds the search in the
 *   learner's language and opens it on a click; nothing here fetches.
 * - Firma and Privat units get nothing: their titles never go to a
 *   reference work on the web.
 *
 * The search is no `source_link`: it forms no library topic and no review
 * reads it.
 */

import type { Database } from "../db/types.js";
import { loadBindings, loadUnits, type UnitRow } from "./lenses.js";
import { loadUnitPlanets, ownPlanetOf } from "./planets.js";
import type { UnitKey } from "./types.js";

export type ReadUp =
  | { kind: "source"; url: string }
  | {
      kind: "search";
      term: string;
      /** The unit's language when it names one; else the learner's. */
      language: string | null;
    };

/**
 * A curriculum page names what a subject covers, not the knowledge itself:
 * it is no place to read a unit up.
 */
const CURRICULUM_HOST = /(^|\.)lehrplanplus\.bayern\.de$/i;

/**
 * A host on the public web, by its name: never this machine or the local
 * network. An address instead of a name, IPv4 or IPv6, does not count either:
 * reading up then searches instead.
 */
function publicWebHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || host.includes(":") || host.startsWith("[")) {
    return false;
  }
  if (/^\d+(\.\d+){3}$/.test(host)) return false;
  return !/(^|\.)(localhost|local|internal|lan|home\.arpa)$/.test(host);
}

/** The page a source link names, when it is one to read on the web. */
export function webSourceUrl(link: string | null | undefined): string | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!publicWebHost(url.hostname)) return null;
  if (CURRICULUM_HOST.test(url.hostname)) return null;
  return url.toString();
}

/** What reading up opens, from what a unit's tokens carry. Pure. */
export function readUpFor(input: {
  title: string;
  sourceLinks: ReadonlyArray<string | null>;
  lookupTerms: ReadonlyArray<string | null>;
  languages: ReadonlyArray<string | null>;
}): ReadUp | null {
  for (const link of input.sourceLinks) {
    const url = webSourceUrl(link);
    if (url) return { kind: "source", url };
  }
  const term =
    input.lookupTerms.map((t) => t?.trim()).find(Boolean) ?? input.title.trim();
  if (!term) return null;
  const language = input.languages.map((l) => l?.trim()).find(Boolean) ?? null;
  return { kind: "search", term, language };
}

/** Tokens per `IN` list, well below every driver's parameter limit. */
const IN_CHUNK = 500;

/**
 * Reading up for units already known to be world knowledge, such as those of
 * a world lens. Reads only.
 */
export async function readUpForUnits(
  db: Database,
  units: readonly UnitRow[],
): Promise<Map<UnitKey, ReadUp>> {
  const ids = units.flatMap((unit) => unit.tokenIds);
  const rows = new Map<
    string,
    {
      source_link: string | null;
      lookup_term: string | null;
      language: string | null;
    }
  >();
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK);
    const found = (await db
      .prepare(
        `SELECT id, source_link, lookup_term, language FROM tokens
          WHERE id IN (${chunk.map(() => "?").join(", ")})`,
      )
      .all(...chunk)) as Array<{
      id: string;
      source_link: string | null;
      lookup_term: string | null;
      language: string | null;
    }>;
    for (const row of found) rows.set(row.id, row);
  }
  const result = new Map<UnitKey, ReadUp>();
  for (const unit of units) {
    const tokens = unit.tokenIds
      .map((id) => rows.get(id))
      .filter((row) => row !== undefined);
    const readUp = readUpFor({
      title: unit.title,
      sourceLinks: tokens.map((row) => row.source_link),
      lookupTerms: tokens.map((row) => row.lookup_term),
      languages: tokens.map((row) => row.language),
    });
    if (readUp) result.set(unit.key, readUp);
  }
  return result;
}

/**
 * Reading up per token, for the world units among them; tokens of Firma or
 * Privat units are left out. Reads only.
 */
export async function readUpForTokens(
  db: Database,
  tokenIds: readonly string[],
): Promise<Map<string, ReadUp>> {
  const result = new Map<string, ReadUp>();
  if (tokenIds.length === 0) return result;
  const units = await loadUnits(db, { tokenIds });
  const planets = await loadUnitPlanets(
    db,
    units,
    await loadBindings(db),
    await ownPlanetOf(db),
  );
  const world = units.filter((unit) => planets.get(unit.key) === "welt");
  const byUnit = await readUpForUnits(db, world);
  for (const unit of world) {
    const readUp = byUnit.get(unit.key);
    if (!readUp) continue;
    for (const id of unit.tokenIds) result.set(id, readUp);
  }
  return result;
}
