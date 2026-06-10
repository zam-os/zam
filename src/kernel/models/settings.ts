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
