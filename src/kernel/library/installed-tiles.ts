/**
 * Provider tiles a library already holds (ADR 2026-11-25, Decision 7).
 *
 * In a team library a curator installs a private provider's package once.
 * A member then enrols from what the library holds — `installed_tiles` and
 * `tile_atoms` (M050) — without the tile's file, without a download and
 * without a token, and writes only their own learning state. Bundled and
 * public Academy tiles keep their own enrolment (`enrolBundledCell`), which
 * knows their in-scope atoms.
 */

import type { Database } from "../db/types.js";
import { reservedProviderIds } from "./academy-provider.js";
import { type KvtProgress, materialiseKvtCards } from "./kvt-attach.js";

export interface InstalledProviderTile {
  tileId: string;
  /** The tile-id prefix, i.e. the provider's id. */
  providerId: string;
  version: string;
  title: string;
  description: string;
  appUrl: string | null;
  preview: boolean;
  /** The atoms the tile owns (`tile_atoms`), sorted. */
  atoms: string[];
  /** Published items the tile's atoms hold: the most cards enrolment gives. */
  items: number;
  /** The learner holds at least one active card on the tile's atoms. */
  held: boolean;
  /**
   * Published items the learner holds no card for. After a curator installed
   * a newer version, enrolling again hands them out (within the usual
   * enrolment budget), as „Aktualisieren“ does for a personal library.
   */
  newItems: number;
}

export interface EnrolInstalledTileResult {
  success: true;
  cellId: string;
  version: string;
  cardsCreated: number;
  cardsReused: number;
  alreadyEnrolled: boolean;
}

function prefixOf(tileId: string): string {
  const colon = tileId.indexOf(":");
  return colon > 0 ? tileId.slice(0, colon) : "";
}

/** A tile id in a provider namespace: neither bundled nor the public Academy. */
export function isProviderTileId(tileId: string): boolean {
  const prefix = prefixOf(tileId);
  return prefix !== "" && !reservedProviderIds().has(prefix);
}

/**
 * Every provider tile the library holds, with the learner's state. `prefixes`
 * narrows the list to some providers.
 */
export async function listInstalledProviderTiles(
  db: Database,
  userId: string,
  prefixes?: readonly string[],
): Promise<InstalledProviderTile[]> {
  const rows = (await db
    .prepare(
      `SELECT tile_id, version, title, description, app_url, preview
         FROM installed_tiles
        WHERE version <> ''
        ORDER BY tile_id`,
    )
    .all()) as Array<{
    tile_id: string;
    version: string;
    title: string | null;
    description: string | null;
    app_url: string | null;
    preview: number | null;
  }>;
  const wanted = prefixes ? new Set(prefixes) : null;
  const out: InstalledProviderTile[] = [];
  for (const row of rows) {
    if (!isProviderTileId(row.tile_id)) continue;
    const providerId = prefixOf(row.tile_id);
    if (wanted && !wanted.has(providerId)) continue;
    const atoms = (await db
      .prepare(
        "SELECT atom_id FROM tile_atoms WHERE tile_id = ? ORDER BY atom_id",
      )
      .all(row.tile_id)) as Array<{ atom_id: string }>;
    const items = (await db
      .prepare(
        `SELECT COUNT(DISTINCT t.id) AS n
           FROM tokens t
           JOIN tile_atoms ta ON ta.atom_id = t.atom_id
          WHERE ta.tile_id = ?
            AND t.deprecated_at IS NULL
            AND t.editorial_state = 'published'`,
      )
      .get(row.tile_id)) as { n: number };
    const held = (await db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) AS n
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
           JOIN tile_atoms ta ON ta.atom_id = t.atom_id
          WHERE ta.tile_id = ?
            AND c.user_id = ?
            AND c.detached_at IS NULL`,
      )
      .get(row.tile_id, userId)) as { n: number };
    const missing = (await db
      .prepare(
        `SELECT COUNT(DISTINCT t.id) AS n
           FROM tokens t
           JOIN tile_atoms ta ON ta.atom_id = t.atom_id
          WHERE ta.tile_id = ?
            AND t.deprecated_at IS NULL
            AND t.editorial_state = 'published'
            AND NOT EXISTS (
              SELECT 1 FROM cards c WHERE c.token_id = t.id AND c.user_id = ?
            )`,
      )
      .get(row.tile_id, userId)) as { n: number };
    out.push({
      tileId: row.tile_id,
      providerId,
      version: row.version,
      title: row.title?.trim() || row.tile_id,
      description: row.description?.trim() ?? "",
      appUrl: row.app_url,
      preview: Number(row.preview ?? 0) === 1,
      atoms: atoms.map((atom) => atom.atom_id),
      items: Number(items.n),
      held: Number(held.n) > 0,
      newItems: Number(missing.n),
    });
  }
  return out;
}

/**
 * „Aufnehmen“ on a provider tile the library already holds: creates the
 * learner's own cards for the tile's atoms and nothing else.
 */
export async function enrolInstalledTile(
  db: Database,
  userId: string,
  tileId: string,
  options: { onProgress?: (progress: KvtProgress) => void } = {},
): Promise<EnrolInstalledTileResult> {
  if (!userId.trim()) {
    throw new Error("userId is required to enrol in a learning cell");
  }
  if (!isProviderTileId(tileId)) {
    throw new Error(
      `${tileId} is not a provider tile; bundled and Academy cells enrol with enrolBundledCell`,
    );
  }
  const installed = (await db
    .prepare(
      "SELECT version FROM installed_tiles WHERE tile_id = ? AND version <> ''",
    )
    .get(tileId)) as { version: string } | undefined;
  if (!installed) {
    throw new Error(`${tileId} is not installed in this library`);
  }
  const atoms = (await db
    .prepare(
      "SELECT atom_id FROM tile_atoms WHERE tile_id = ? ORDER BY atom_id",
    )
    .all(tileId)) as Array<{ atom_id: string }>;
  if (atoms.length === 0) {
    throw new Error(
      `${tileId} has no recorded atoms; its installer must install it again`,
    );
  }
  const result = await materialiseKvtCards(
    db,
    userId,
    atoms.map((row) => row.atom_id),
    { onProgress: options.onProgress },
  );
  return {
    success: true,
    cellId: tileId,
    version: installed.version,
    cardsCreated: result.cardsCreated,
    cardsReused: result.cardsReused,
    alreadyEnrolled: result.cardsCreated === 0 && result.cardsReused > 0,
  };
}

/**
 * The provider tile a practice item belongs to, with the version the library
 * holds, or null for an item of a bundled or Academy tile (or none). The
 * report link of ADR 2026-11-25 Decision 8 names exactly these.
 */
export async function providerTileForItem(
  db: Database,
  itemId: string,
): Promise<{ tileId: string; version: string } | null> {
  const rows = (await db
    .prepare(
      `SELECT ta.tile_id AS tile_id, it.version AS version
         FROM tokens t
         JOIN tile_atoms ta ON ta.atom_id = t.atom_id
         JOIN installed_tiles it ON it.tile_id = ta.tile_id
        WHERE t.id = ?
          AND it.version <> ''
        ORDER BY ta.tile_id`,
    )
    .all(itemId)) as Array<{ tile_id: string; version: string }>;
  const own = rows.find((row) => isProviderTileId(row.tile_id));
  return own ? { tileId: own.tile_id, version: own.version } : null;
}
