/**
 * One learner's atlas as every surface reads it (ADR 2026-10-13, Decisions
 * 2, 3 and 10): the lens they chose or the library's default, its map, and
 * the lenses the library shows. The Studio's bridge and Mobile share it, so
 * both open the same lens and count the same due cards. Reads only; whether
 * this connection may write knowledge is the caller's to say.
 */

import type { Database } from "../db/types.js";
import { getSetting } from "../models/settings.js";
import { LENSES, type LensDefinition } from "./lenses.js";
import { assertLensOnLibrary, libraryLenses, ownPlanetOf } from "./planets.js";
import { type AtlasView, readAtlas } from "./read.js";
import type { LensKind, OwnPlanet, PlanetKind } from "./types.js";

/** The lens the learner opens the atlas with. */
export const ATLAS_LENS_SETTING = "atlas.lens";
/** *Neue Inhalte zeigen* (Decision 1). */
export const ATLAS_SHOW_NEW_SETTING = "atlas.show_new";
/** A lens's home region, stored as its path of region keys, root first. */
export function atlasHomeSetting(kind: LensKind): string {
  return `atlas.home.${kind}`;
}

/** Every lens by kind; a library shows world's and its own planet's. */
export const ATLAS_LENSES: Readonly<Record<string, LensDefinition>> = LENSES;

export function atlasLens(kind: string | undefined): LensDefinition {
  const lens = ATLAS_LENSES[kind ?? "weltwissen"];
  if (!lens) {
    throw new Error(
      `Unknown atlas lens "${kind}". Choose ${Object.keys(ATLAS_LENSES).join(", ")}.`,
    );
  }
  return lens;
}

/**
 * A lens of this library: world knowledge's, or one of its own planet's. A
 * lens of the other planet is refused (Decision 2).
 */
export async function libraryLens(
  db: Database,
  kind: string | undefined,
): Promise<LensDefinition> {
  const lens = atlasLens(kind);
  assertLensOnLibrary(lens, await ownPlanetOf(db));
  return lens;
}

/** A lens as a surface lists it. */
export interface AtlasLensInfo {
  kind: LensKind;
  planet: PlanetKind;
  name: string;
}

/** The library's own planet and the lenses it shows, world's first. */
export async function atlasLensInfo(
  db: Database,
): Promise<{ own: OwnPlanet; lenses: AtlasLensInfo[] }> {
  const own = await ownPlanetOf(db);
  return {
    own,
    lenses: (await libraryLenses(db, own)).map((lens) => ({
      kind: lens.kind,
      planet: lens.planet,
      name: lens.name,
    })),
  };
}

export interface AtlasPrefs {
  lens: LensKind;
  showNew: boolean;
  /** Stored home path per lens, root first. */
  home: Partial<Record<LensKind, string[]>>;
}

/** The lens the atlas opens with before the learner chose one (Decision 3). */
export function defaultAtlasLens(own: OwnPlanet): LensKind {
  return own === "firma" ? "produkte" : "weltwissen";
}

function parsePath(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) && value.every((v) => typeof v === "string")
      ? value
      : [];
  } catch {
    return [];
  }
}

export async function readAtlasPrefs(db: Database): Promise<AtlasPrefs> {
  const own = await ownPlanetOf(db);
  const lenses = await libraryLenses(db, own);
  const stored = await getSetting(db, ATLAS_LENS_SETTING);
  const home: AtlasPrefs["home"] = {};
  for (const lens of lenses) {
    const path = parsePath(await getSetting(db, atlasHomeSetting(lens.kind)));
    if (path.length > 0) home[lens.kind] = path;
  }
  return {
    lens:
      lenses.find((lens) => lens.kind === stored)?.kind ??
      defaultAtlasLens(own),
    showNew: (await getSetting(db, ATLAS_SHOW_NEW_SETTING)) === "true",
    home,
  };
}

export interface LearnerAtlas extends AtlasView {
  /** The library's own planet and the lenses it shows (Decision 2). */
  ownPlanet: OwnPlanet;
  lenses: AtlasLensInfo[];
}

/**
 * One lens of the learner's atlas: the named one, a planet's last or primary
 * one, else the learner's. Writes nothing; unstored land stays planned in
 * memory.
 */
export async function readLearnerAtlas(
  db: Database,
  opts: {
    userId: string;
    lens?: string;
    planet?: string;
    /** Whether this connection may write knowledge (settle), the caller's to say. */
    mayWrite: boolean;
    now?: Date;
    timeZone?: string;
  },
): Promise<LearnerAtlas> {
  const prefs = await readAtlasPrefs(db);
  const info = await atlasLensInfo(db);
  let kind = opts.lens;
  if (kind === undefined && opts.planet !== undefined) {
    // A planet alone opens its lens the learner last chose, else its primary.
    const planet = opts.planet;
    if (planet !== "welt" && planet !== info.own) {
      throw new Error(`This library holds the welt and ${info.own} planets.`);
    }
    const onPlanet = info.lenses.filter((lens) => lens.planet === planet);
    kind = (onPlanet.find((lens) => lens.kind === prefs.lens) ?? onPlanet[0])
      ?.kind;
  }
  const lens = await libraryLens(db, kind ?? prefs.lens);
  if (opts.planet !== undefined && lens.planet !== opts.planet) {
    throw new Error(`The ${lens.name} lens is on the ${lens.planet} planet.`);
  }
  const view = await readAtlas(db, {
    userId: opts.userId,
    lens,
    now: opts.now,
    showNew: prefs.showNew,
    homePath: prefs.home[lens.kind],
    mayWrite: opts.mayWrite,
    timeZone: opts.timeZone,
  });
  return { ...view, ownPlanet: info.own, lenses: info.lenses };
}
