/**
 * User settings — key/value store backed by the user_config table.
 */

import type { Database } from "better-sqlite3";

export interface UserSetting {
  key: string;
  value: string;
  updated_at: string;
}

/** Get a single setting by key. Returns undefined if not set. */
export function getSetting(db: Database, key: string): string | undefined {
  const row = db
    .prepare("SELECT value FROM user_config WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

/** Get all settings as a key-value map. */
export function getAllSettings(db: Database): Record<string, string> {
  const rows = db
    .prepare("SELECT key, value FROM user_config ORDER BY key")
    .all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

/** Get all settings with metadata. */
export function getAllSettingsDetailed(db: Database): UserSetting[] {
  return db
    .prepare("SELECT key, value, updated_at FROM user_config ORDER BY key")
    .all() as UserSetting[];
}

/** Set a setting (insert or update). */
export function setSetting(db: Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO user_config (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value);
}

/** Delete a setting. Returns true if it existed. */
export function deleteSetting(db: Database, key: string): boolean {
  const result = db.prepare("DELETE FROM user_config WHERE key = ?").run(key);
  return result.changes > 0;
}
