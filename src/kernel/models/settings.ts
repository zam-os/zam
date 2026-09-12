/**
 * User settings — key/value store backed by the user_config table.
 */

import type { Database } from "../db/types.js";

export interface UserSetting {
  key: string;
  value: string;
  updated_at: string;
}

/** Get a single setting by key. Returns undefined if not set. */
export async function getSetting(
  db: Database,
  key: string,
): Promise<string | undefined> {
  const row = (await db
    .prepare("SELECT value FROM user_config WHERE key = ?")
    .get(key)) as { value: string } | undefined;
  return row?.value;
}

/**
 * Get several settings in one read.
 *
 * Callers that need a fixed set of keys used to issue one `getSetting` per
 * key; on a remote provider each of those is a network round trip, so the
 * bootstrap path batches them instead. Absent keys are simply missing from
 * the returned map — the same `undefined` a per-key read would produce.
 *
 * Generic over the requested key literals, so a caller reading a key it did
 * not ask for is a type error rather than a silent `undefined`.
 */
export async function getSettings<K extends string>(
  db: Database,
  keys: readonly K[],
): Promise<Record<K, string | undefined>> {
  if (keys.length === 0) return {} as Record<K, string | undefined>;
  const placeholders = keys.map(() => "?").join(", ");
  const rows = (await db
    .prepare(
      `SELECT key, value FROM user_config WHERE key IN (${placeholders})`,
    )
    .all(...keys)) as { key: string; value: string }[];
  const map = {} as Record<K, string | undefined>;
  for (const key of keys) map[key] = undefined;
  for (const row of rows) {
    map[row.key as K] = row.value;
  }
  return map;
}

/** Get all settings as a key-value map. */
export async function getAllSettings(
  db: Database,
): Promise<Record<string, string>> {
  const rows = (await db
    .prepare("SELECT key, value FROM user_config ORDER BY key")
    .all()) as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

/** Get all settings with metadata. */
export async function getAllSettingsDetailed(
  db: Database,
): Promise<UserSetting[]> {
  return (await db
    .prepare("SELECT key, value, updated_at FROM user_config ORDER BY key")
    .all()) as UserSetting[];
}

/** Set a setting (insert or update). */
export async function setSetting(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_config (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value);
}

/** Delete a setting. Returns true if it existed. */
export async function deleteSetting(
  db: Database,
  key: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM user_config WHERE key = ?")
    .run(key);
  return result.changes > 0;
}
