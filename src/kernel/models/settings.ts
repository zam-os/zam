/**
 * Settings — one API, three scopes (ADR 2026-09-04 Decision 4).
 *
 * `user_config` holds **library** keys: what the library is and the defaults
 * a curator sets for everyone. `user_settings` holds what a **person**
 * configures (locale, review method, study settings — follows the learner
 * to every device) and what a **machine** needs (local model endpoints,
 * observer policy, filesystem paths — keyed by an install id, never a
 * hostname). Resolution is machine row → person row → library row.
 *
 * Callers keep calling `getSetting(db, key)`; which scope a key belongs to
 * is decided here by the registry, and *whose* rows are meant comes from a
 * {@link SettingsScope} bound to the handle or produced by a registered
 * resolver (the CLI registers one; it knows the learner and the machine, the
 * kernel does not). Without a scope every call behaves exactly as before —
 * `user_config` only — which is what the mobile companion and embedded
 * callers get today.
 *
 * On a **personal** library (`shared: false`) person keys stay in
 * `user_config`: one person, so person and library are the same thing, and
 * nothing a learner already configured moves anywhere. Machine keys get
 * their own row per install and are mirrored to `user_config`, so an older
 * client or the mobile companion reading the old place still sees the last
 * value written. On the **team** library (`shared: true`) neither person nor
 * machine keys ever touch `user_config` — that table is a curator's, and a
 * member has no write on it (pilot plan phase 4/5).
 */

import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";

export interface UserSetting {
  key: string;
  value: string;
  updated_at: string;
}

export type SettingScope = "library" | "person" | "machine";

export interface SettingsScope {
  /** The learner whose person and machine rows are read and written. */
  userId: string;
  /**
   * This install's id — a ULID minted once per install (`machine.id` in
   * `~/.zam/config.json`). Empty when unknown: machine keys then follow the
   * person.
   */
  machineId: string;
  /**
   * True on the shared team library: person and machine keys never touch
   * `user_config`. False on a personal library: person keys stay in
   * `user_config` and machine writes are mirrored there.
   */
  shared: boolean;
}

export type SettingsScopeResolver = (
  db: Database,
) => Promise<SettingsScope | null>;

// ── Key registry ────────────────────────────────────────────────────────────

/** Library-wide keys: the library's identity and curator-set defaults. */
const LIBRARY_KEYS = new Set([
  "user.id",
  "search.suggest_min_similarity",
  "search.dedup_threshold",
]);

/** Person keys that would otherwise match a machine prefix below. */
const PERSON_KEYS = new Set([
  "system.locale",
  "system.timezone",
  "review_method",
  "monitor_method",
  "recall.quick_mode",
  "agent.default",
  // Shared provider records and role bindings are a person's choices; the
  // per-install variant already lives in `~/.zam/config.json`.
  "llm.providers",
  "llm.roles",
]);

const MACHINE_KEYS = new Set(["ai.models.cloud"]);

/**
 * Hardware and filesystem specifics: local model endpoints and their keys,
 * observer policy, harness executables, workspace and goal directories.
 */
const MACHINE_PREFIXES = ["llm.", "observer.", "repo.", "personal.", "agent."];

/** Which scope a key belongs to. Unknown keys follow the person. */
export function settingScopeOf(key: string): SettingScope {
  if (LIBRARY_KEYS.has(key)) return "library";
  if (PERSON_KEYS.has(key)) return "person";
  if (MACHINE_KEYS.has(key)) return "machine";
  if (MACHINE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return "machine";
  }
  return "person";
}

// ── Scope binding and resolution ────────────────────────────────────────────

let scopeResolver: SettingsScopeResolver | null = null;
/** Explicit per-handle scopes; `null` pins a handle to library-only reads. */
const boundScopes = new WeakMap<Database, SettingsScope | null>();
const resolvedScopes = new WeakMap<
  Database,
  { generation: number; scope: Promise<SettingsScope | null> }
>();
/** Bumped whenever `user.id` changes; every cached resolution is then stale. */
let scopeGeneration = 0;

/**
 * Register the function that says whose settings a handle reads. The CLI
 * registers one at bootstrap; a host without one (the mobile companion, a
 * test) keeps the library-only behaviour.
 */
export function registerSettingsScopeResolver(
  resolver: SettingsScopeResolver | null,
): void {
  scopeResolver = resolver;
  scopeGeneration += 1;
}

/** Whether a host has registered a resolver in this module graph. */
export function hasSettingsScopeResolver(): boolean {
  return scopeResolver !== null;
}

/**
 * Pin a handle to one scope, bypassing the resolver — for hosts that know
 * their learner, and for tests. `null` forces library-only behaviour.
 */
export function bindSettingsScope(
  db: Database,
  scope: SettingsScope | null,
): void {
  boundScopes.set(db, scope);
}

/** Drop a handle's binding and cached resolution. */
export function forgetSettingsScope(db: Database): void {
  boundScopes.delete(db);
  resolvedScopes.delete(db);
}

/** Handles whose resolver is running right now. */
const resolving = new WeakSet<Database>();

/**
 * The scope for `db`, or `null` for library-only behaviour. Library keys
 * never come here (see the public API), so a resolver that reads `user.id`
 * through `getSetting` does not re-enter; should one re-enter anyway, the
 * answer is "no scope" rather than a second resolution.
 */
async function scopeFor(db: Database): Promise<SettingsScope | null> {
  if (boundScopes.has(db)) return boundScopes.get(db) ?? null;
  if (!scopeResolver) return null;
  const cached = resolvedScopes.get(db);
  if (cached && cached.generation === scopeGeneration) return cached.scope;
  if (resolving.has(db)) return null;
  resolving.add(db);
  const generation = scopeGeneration;
  const resolver = scopeResolver;
  const scope = (async () => {
    try {
      return await resolver(db);
    } catch {
      // Not a member yet, no identity configured yet: read the library and
      // try again next time rather than lock the caller out of settings.
      return null;
    } finally {
      resolving.delete(db);
    }
  })();
  resolvedScopes.set(db, { generation, scope });
  const resolved = await scope;
  // Only a found scope is worth keeping: an identity that appears later
  // (first run, a mapping the administrator adds) must be picked up.
  if (resolved === null && resolvedScopes.get(db)?.scope === scope) {
    resolvedScopes.delete(db);
  }
  return resolved;
}

/**
 * Where a key is stored for this scope: `null` means `user_config`, else the
 * `machine_id` of the `user_settings` row that owns the writes.
 */
function storageFor(
  scope: SettingsScope,
  key: string,
): { machineId: string } | null {
  const cls = settingScopeOf(key);
  if (cls === "library") return null;
  if (cls === "person" && !scope.shared) return null;
  return { machineId: cls === "machine" ? scope.machineId : "" };
}

// ── Library rows (`user_config`) ────────────────────────────────────────────

async function readLibrary(
  db: Database,
  key: string,
): Promise<string | undefined> {
  const row = (await db
    .prepare("SELECT value FROM user_config WHERE key = ?")
    .get(key)) as { value: string } | undefined;
  return row?.value;
}

async function readLibraryMany(
  db: Database,
  keys: readonly string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (keys.length === 0) return map;
  const placeholders = keys.map(() => "?").join(", ");
  const rows = (await db
    .prepare(
      `SELECT key, value FROM user_config WHERE key IN (${placeholders})`,
    )
    .all(...keys)) as { key: string; value: string }[];
  for (const row of rows) map.set(row.key, row.value);
  return map;
}

async function writeLibrary(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_config (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value, nowIso());
}

async function deleteLibrary(db: Database, key: string): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM user_config WHERE key = ?")
    .run(key);
  return result.changes > 0;
}

// ── Scoped rows (`user_settings`) ───────────────────────────────────────────

interface ScopedRow {
  key: string;
  machine_id: string;
  value: string;
  updated_at: string;
}

/** Person and machine rows of one learner for `keys` (all keys when omitted). */
async function readScopedRows(
  db: Database,
  scope: SettingsScope,
  keys?: readonly string[],
): Promise<ScopedRow[]> {
  if (keys && keys.length === 0) return [];
  const keyFilter = keys
    ? ` AND key IN (${keys.map(() => "?").join(", ")})`
    : "";
  return (await db
    .prepare(
      `SELECT key, machine_id, value, updated_at FROM user_settings
        WHERE user_id = ? AND machine_id IN (?, '')${keyFilter}`,
    )
    .all(scope.userId, scope.machineId, ...(keys ?? []))) as ScopedRow[];
}

/** Machine row first, person row second. */
function pickScoped(
  rows: readonly ScopedRow[],
  scope: SettingsScope,
  key: string,
): ScopedRow | undefined {
  const mine = rows.filter((row) => row.key === key);
  return (
    (scope.machineId
      ? mine.find((row) => row.machine_id === scope.machineId)
      : undefined) ?? mine.find((row) => row.machine_id === "")
  );
}

/**
 * Overlay scoped rows on library rows: person rows override the library,
 * machine rows override both.
 */
function overlay<T extends { key: string }>(
  library: Map<string, T>,
  rows: readonly ScopedRow[],
  scope: SettingsScope,
  toEntry: (row: ScopedRow) => T,
): Map<string, T> {
  const merged = new Map(library);
  for (const row of rows) {
    if (row.machine_id === "") merged.set(row.key, toEntry(row));
  }
  if (scope.machineId) {
    for (const row of rows) {
      if (row.machine_id === scope.machineId) {
        merged.set(row.key, toEntry(row));
      }
    }
  }
  return merged;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Get a single setting by key. Returns undefined if not set. */
export async function getSetting(
  db: Database,
  key: string,
): Promise<string | undefined> {
  // A library key needs no scope — and `user.id` is what the resolver reads.
  if (settingScopeOf(key) === "library") return readLibrary(db, key);
  const scope = await scopeFor(db);
  if (!scope || storageFor(scope, key) === null) return readLibrary(db, key);
  const own = pickScoped(await readScopedRows(db, scope, [key]), scope, key);
  // The library row is the transitional read-through for a personal key
  // nobody moved yet, and the curator's default on the team library.
  return own?.value ?? readLibrary(db, key);
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
  const map = {} as Record<K, string | undefined>;
  if (keys.length === 0) return map;
  const scope = await scopeFor(db);
  const library = await readLibraryMany(db, keys);
  const scopedKeys = scope
    ? keys.filter((key) => storageFor(scope, key) !== null)
    : [];
  const rows =
    scope && scopedKeys.length > 0
      ? await readScopedRows(db, scope, scopedKeys)
      : [];
  for (const key of keys) {
    const own = scope ? pickScoped(rows, scope, key) : undefined;
    map[key] = own?.value ?? library.get(key);
  }
  return map;
}

/** Get all settings as a key-value map — the values in effect for this scope. */
export async function getAllSettings(
  db: Database,
): Promise<Record<string, string>> {
  const detailed = await getAllSettingsDetailed(db);
  const map: Record<string, string> = {};
  for (const row of detailed) map[row.key] = row.value;
  return map;
}

/** Get all settings with metadata — the values in effect for this scope. */
export async function getAllSettingsDetailed(
  db: Database,
): Promise<UserSetting[]> {
  const library = (await db
    .prepare("SELECT key, value, updated_at FROM user_config ORDER BY key")
    .all()) as UserSetting[];
  const scope = await scopeFor(db);
  if (!scope) return library;
  const merged = overlay(
    new Map(library.map((row) => [row.key, row])),
    await readScopedRows(db, scope),
    scope,
    (row) => ({ key: row.key, value: row.value, updated_at: row.updated_at }),
  );
  return [...merged.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Set a setting (insert or update) in the scope the key belongs to. */
export async function setSetting(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  if (key === "user.id") scopeGeneration += 1;
  if (settingScopeOf(key) === "library") return writeLibrary(db, key, value);
  const scope = await scopeFor(db);
  const storage = scope ? storageFor(scope, key) : null;
  if (!scope || storage === null) return writeLibrary(db, key, value);
  await db
    .prepare(
      `INSERT INTO user_settings (user_id, machine_id, key, value, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, machine_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(scope.userId, storage.machineId, key, value, nowIso());
  // Personal library: keep the old place current for older clients and the
  // mobile companion. Never on the team library — a member may not write it.
  if (!scope.shared) await writeLibrary(db, key, value);
}

/** Delete a setting from the scope the key belongs to. Returns true if it existed. */
export async function deleteSetting(
  db: Database,
  key: string,
): Promise<boolean> {
  if (key === "user.id") scopeGeneration += 1;
  if (settingScopeOf(key) === "library") return deleteLibrary(db, key);
  const scope = await scopeFor(db);
  const storage = scope ? storageFor(scope, key) : null;
  if (!scope || storage === null) return deleteLibrary(db, key);
  const result = await db
    .prepare(
      "DELETE FROM user_settings WHERE user_id = ? AND machine_id = ? AND key = ?",
    )
    .run(scope.userId, storage.machineId, key);
  const mirrored = scope.shared ? false : await deleteLibrary(db, key);
  return result.changes > 0 || mirrored;
}
