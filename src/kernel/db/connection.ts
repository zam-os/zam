import Database, { type Database as DatabaseType } from "better-sqlite3";
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
}

/**
 * Open (or create) the ZAM database.
 * Uses WAL mode for concurrent access from AI CLI and user CLI.
 */
export function openDatabase(options: ConnectionOptions = {}): DatabaseType {
  const dbPath = options.dbPath ?? DEFAULT_DB_PATH;

  if (options.initialize) {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Enable WAL mode and foreign keys
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  if (options.initialize) {
    db.exec(SCHEMA);
  }

  return db;
}

/** Get the default database path */
export function getDefaultDbPath(): string {
  return DEFAULT_DB_PATH;
}
