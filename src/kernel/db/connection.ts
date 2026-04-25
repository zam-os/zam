import Database, { type Database as DatabaseType } from "libsql";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { SCHEMA } from "./schema.js";
import { getTursoCredentials } from "../credentials.js";

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

    // When syncUrl is provided, the db must be a libsql embedded replica (not
    // plain SQLite). The presence of a companion .meta (or -info) file proves
    // it was created by libsql. 
    //
    // If the db exists WITHOUT metadata, it was created before Turso was 
    // configured â€” delete it so libsql can sync fresh from cloud.
    //
    // If metadata exists WITHOUT the db, libsql throws InvalidLocalState â€”
    // delete the metadata so it can start fresh.
    const metaPath = `${dbPath}.meta`;
    const infoPath = `${dbPath}-info`;

    if (existsSync(dbPath) && !existsSync(metaPath) && !existsSync(infoPath)) {
      for (const suffix of ["", "-wal", "-shm"]) {
        const f = `${dbPath}${suffix}`;
        if (existsSync(f)) rmSync(f, { force: true });
      }
    } else if (!existsSync(dbPath) && (existsSync(metaPath) || existsSync(infoPath))) {
      if (existsSync(metaPath)) rmSync(metaPath);
      if (existsSync(infoPath)) rmSync(infoPath);
    }
  }
  if (options.authToken) {
    dbOpts.authToken = options.authToken;
  }

  let db: DatabaseType;
  try {
    db = new Database(dbPath, dbOpts as Database.Options);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("InvalidLocalState") && options.syncUrl) {
      // Last-ditch recovery: metadata is corrupt or mismatched
      const metaPath = `${dbPath}.meta`;
      const infoPath = `${dbPath}-info`;
      if (existsSync(metaPath)) rmSync(metaPath);
      if (existsSync(infoPath)) rmSync(infoPath);
      db = new Database(dbPath, dbOpts as Database.Options);
    } else {
      throw err;
    }
  }

  // Enable WAL mode and foreign keys.
  // libsql embedded replicas manage their own WAL â€” skip journal_mode when syncing.
  if (!options.syncUrl) {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  // For embedded replicas: sync from cloud FIRST so the local file has the
  // primary's schema before we try to run migrations or create tables.
  if (options.syncUrl) {
    (db as unknown as { sync: () => void }).sync();
  }

  if (options.initialize) {
    db.exec(SCHEMA);
  }

  runMigrations(db);

  return db;
}

/**
 * Open the database with Turso cloud sync auto-detected from credentials file.
 * Reads turso.url and turso.token from ~/.zam/credentials.json (NOT from the db).
 * This avoids opening the db twice and eliminates the Windows file-lock issue
 * when migrating from plain SQLite to a libsql embedded replica.
 */
export function openDatabaseWithSync(options: Omit<ConnectionOptions, "syncUrl" | "authToken"> = {}): DatabaseType {
  const turso = getTursoCredentials();
  if (turso) {
    return openDatabase({ ...options, syncUrl: turso.url, authToken: turso.token });
  }
  return openDatabase(options);
}

/** Get the default database path */
export function getDefaultDbPath(): string {
  return DEFAULT_DB_PATH;
}

/**
 * Run incremental schema migrations on every open.
 * Each migration is idempotent â€” safe to run repeatedly.
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
