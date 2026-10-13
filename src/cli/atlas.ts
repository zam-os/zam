/**
 * Bridge handlers for the knowledge atlas (ADR 2026-10-13, Decision 10).
 *
 * The CLI layer owns what the kernel must not: the machine-local alpha
 * switch, and whether this connection may write knowledge. PostgreSQL says
 * the latter through its grants (ADR 2026-09-04, Decision 7), so the check
 * asks the server instead of inventing a second notion of curator.
 */

import {
  type AtlasView,
  type Database,
  dialectOf,
  getSetting,
  type LensDefinition,
  type LensKind,
  readAtlas,
  SCHULE_LENS,
  type SettleResult,
  setSetting,
  settleLens,
  snapshotForRead,
  WELTWISSEN_LENS,
} from "../kernel/index.js";
import {
  getAtlasConfig,
  setAtlasConfig,
} from "../kernel/system/install-config.js";

/** Lenses the atlas offers so far: the world planet's two. */
export const ATLAS_LENSES: Readonly<Record<string, LensDefinition>> = {
  weltwissen: WELTWISSEN_LENS,
  schule: SCHULE_LENS,
};

export function atlasLens(kind: string | undefined): LensDefinition {
  const lens = ATLAS_LENSES[kind ?? "weltwissen"];
  if (!lens) {
    throw new Error(
      `Unknown atlas lens "${kind}". Choose ${Object.keys(ATLAS_LENSES).join(" or ")}.`,
    );
  }
  return lens;
}

const LENS_KEY = "atlas.lens";
const SHOW_NEW_KEY = "atlas.show_new";
const homeKey = (kind: LensKind) => `atlas.home.${kind}`;

/** Thrown when a write needs curator rights this connection lacks. */
export const NOT_CURATOR = "not-curator";

/**
 * Whether this connection may write the atlas's knowledge tables: always on
 * a library of its own, and on a team library only with the curator grants.
 */
export async function mayWriteKnowledge(db: Database): Promise<boolean> {
  if (dialectOf(db) !== "postgres") return true;
  const row = (await db
    .prepare(
      `SELECT has_table_privilege(current_user, 'atlas_land', 'INSERT') AS ok`,
    )
    .get()) as { ok: boolean | string | null } | undefined;
  return row?.ok === true || row?.ok === "t" || row?.ok === "true";
}

function isPermissionDenied(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "42501") return true;
  const message = error instanceof Error ? error.message : String(error);
  return /permission denied/i.test(message);
}

// ── atlas-feature ────────────────────────────────────────────────────────────

export function atlasFeature(opts: { enable?: boolean; disable?: boolean }): {
  success: true;
  enabled: boolean;
} {
  if (opts.enable && opts.disable) {
    throw new Error("Pass either --enable or --disable, not both.");
  }
  if (opts.enable || opts.disable) {
    setAtlasConfig({ enabled: Boolean(opts.enable) });
  }
  return { success: true, enabled: getAtlasConfig().enabled === true };
}

// ── atlas-prefs ──────────────────────────────────────────────────────────────

export interface AtlasPrefs {
  lens: LensKind;
  showNew: boolean;
  /** Stored home path per lens, root first. */
  home: Partial<Record<LensKind, string[]>>;
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
  const lens = (await getSetting(db, LENS_KEY)) ?? "weltwissen";
  const home: AtlasPrefs["home"] = {};
  for (const kind of Object.keys(ATLAS_LENSES) as LensKind[]) {
    const path = parsePath(await getSetting(db, homeKey(kind)));
    if (path.length > 0) home[kind] = path;
  }
  return {
    lens: (ATLAS_LENSES[lens] ? lens : "weltwissen") as LensKind,
    showNew: (await getSetting(db, SHOW_NEW_KEY)) === "true",
    home,
  };
}

/**
 * Change the learner's atlas preferences. `home` is a region key of `lens`
 * (or of the primary lens); it is stored as its path, so a later lens edit
 * that removes it falls back to the nearest surviving ancestor. An empty
 * string clears the home.
 */
export async function setAtlasPrefs(
  db: Database,
  opts: { lens?: string; home?: string; showNew?: string },
): Promise<AtlasPrefs> {
  if (opts.lens !== undefined) {
    await setSetting(db, LENS_KEY, atlasLens(opts.lens).kind);
  }
  if (opts.showNew !== undefined) {
    if (opts.showNew !== "on" && opts.showNew !== "off") {
      throw new Error("--show-new must be on or off.");
    }
    await setSetting(db, SHOW_NEW_KEY, String(opts.showNew === "on"));
  }
  if (opts.home !== undefined) {
    const prefs = await readAtlasPrefs(db);
    const lens = atlasLens(opts.lens ?? prefs.lens);
    let path: string[] = [];
    if (opts.home !== "") {
      path = await regionPath(db, lens, opts.home);
      if (path.length === 0) {
        throw new Error(`No region "${opts.home}" in the ${lens.name} lens.`);
      }
    }
    await setSetting(db, homeKey(lens.kind), JSON.stringify(path));
  }
  return readAtlasPrefs(db);
}

/** Root-first key path of a region, stored or derived; empty when unknown. */
async function regionPath(
  db: Database,
  lens: LensDefinition,
  key: string,
): Promise<string[]> {
  const { snapshot } = await snapshotForRead(db, lens);
  for (const placement of snapshot.placements) {
    const index = placement.path.findIndex((step) => step.key === key);
    if (index >= 0) {
      return placement.path.slice(0, index + 1).map((step) => step.key);
    }
  }
  const byKey = new Map(snapshot.rows.regions.map((r) => [r.key, r]));
  const byId = new Map(snapshot.rows.regions.map((r) => [r.id, r]));
  const path: string[] = [];
  let current = byKey.get(key);
  while (current && !path.includes(current.key)) {
    path.unshift(current.key);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

// ── atlas-read ───────────────────────────────────────────────────────────────

export async function atlasRead(
  db: Database,
  opts: { userId: string; lens?: string; planet?: string; now?: Date },
): Promise<AtlasView & { success: true }> {
  if (opts.planet !== undefined && opts.planet !== "welt") {
    throw new Error("Only the welt planet has lenses so far.");
  }
  const prefs = await readAtlasPrefs(db);
  const lens = atlasLens(opts.lens ?? prefs.lens);
  const view = await readAtlas(db, {
    userId: opts.userId,
    lens,
    now: opts.now,
    showNew: prefs.showNew,
    homePath: prefs.home[lens.kind],
    mayWrite: await mayWriteKnowledge(db),
  });
  return { success: true, ...view };
}

// ── atlas-settle ─────────────────────────────────────────────────────────────

export async function atlasSettle(
  db: Database,
  opts: { lens?: string },
): Promise<SettleResult & { success: true }> {
  const lens = atlasLens(opts.lens);
  if (!(await mayWriteKnowledge(db))) throw new Error(NOT_CURATOR);
  try {
    return { success: true, ...(await settleLens(db, lens)) };
  } catch (error) {
    if (isPermissionDenied(error)) throw new Error(NOT_CURATOR);
    throw error;
  }
}
