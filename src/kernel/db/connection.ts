import Database, { type Database as DatabaseType } from "libsql";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { SCHEMA } from "./schema.js";

const DEFAULT_DB_DIR = join(homedir(), ".zam");
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, "zam.db");

export interface ConnectionOptions {
  /** Path to the SQLite database file. Defaults to ~/.zam/zam.db */
  dbPath?: string;
  /** If true, create the directory and run schema migrations on open */
  initialize?: boolean;
  /** Turso sync URL for cloud replication (e.g. libsql://db-name.turso.io) */
  syncUrl?: string;
  /** Turso auth token for cloud replication */
  authToken?: string;
}

/**
 * Open (or create) the ZAM database.
 * Uses WAL mode for concurrent access from AI CLI and user CLI.
 * When syncUrl is provided, enables embedded replica sync with Turso.
 */
export function openDatabase(options: ConnectionOptions = {}): DatabaseType {
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  if (options.initialize) {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Build constructor options for libsql
  const dbOpts: Record<string, unknown> = {};
  if (options.syncUrl) {
    dbOpts.syncUrl = options.syncUrl;
  }
  if (options.authToken) {
    dbOpts.authToken = options.authToken;
  }

  const db = new Database(dbPath, dbOpts as Database.Options);

  // Enable WAL mode and foreign keys
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  if (options.initialize) {
    db.exec(SCHEMA);
  }

  runMigrations(db);

  // Sync after migrations if cloud is configured
  if (options.syncUrl) {
    (db as unknown as { sync: () => void }).sync();
  }

  return db;
}

/**
 * Open the database with Turso cloud sync auto-detected from stored settings.
 * Reads turso.url and turso.token from user_config. If present, reopens
 * the database with embedded replica sync enabled.
 */
export function openDatabaseWithSync(options: Omit<ConnectionOptions, "syncUrl" | "authToken"> = {}): DatabaseType {
  // First open locally to read settings
  const db = openDatabase(options);
  const syncUrl = db.prepare("SELECT value FROM user_config WHERE key = ?").get("turso.url") as { value: string } | undefined;
  const authToken = db.prepare("SELECT value FROM user_config WHERE key = ?").get("turso.token") as { value: string } | undefined;

  if (!syncUrl || !authToken) return db;

  // Reopen with sync enabled
  db.close();
  return openDatabase({ ...options, syncUrl: syncUrl.value, authToken: authToken.value });
}

/** Get the default database path */
export function getDefaultDbPath(): string {
  return DEFAULT_DB_PATH;
}

/**
 * Run incremental schema migrations on every open.
 * Each migration is idempotent — safe to run repeatedly.
 */
function runMigrations(db: DatabaseType): void {
  // M001: add execution_context to sessions
  const sessionCols = db.pragma("table_info(sessions)") as Array<{ name: string }>;
  if (sessionCols.length > 0 && !sessionCols.some((c) => c.name === "execution_context")) {
    db.exec(
      `ALTER TABLE sessions ADD COLUMN execution_context TEXT NOT NULL DEFAULT 'shell'`,
    );
  }

  // M002: add deprecated_at to tokens
  const tokenCols = db.pragma("table_info(tokens)") as Array<{ name: string }>;
  if (tokenCols.length > 0 && !tokenCols.some((c) => c.name === "deprecated_at")) {
    db.exec(`ALTER TABLE tokens ADD COLUMN deprecated_at TEXT`);
  }

  // M003: create agent_skills table (idempotent via IF NOT EXISTS in SCHEMA,
  // but also needed for databases that skipped the init path)
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_skills (
      id          TEXT PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      steps       TEXT NOT NULL DEFAULT '[]',
      token_slugs TEXT NOT NULL DEFAULT '[]',
      source      TEXT NOT NULL DEFAULT 'learned',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
