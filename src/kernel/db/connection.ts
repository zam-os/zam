import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { getTursoCredentials } from "../credentials.js";
import { openRemoteDatabase } from "./remote/provider.js";
import { SCHEMA } from "./schema.js";
import { wrapSyncDatabase } from "./sync-adapter.js";
import type { Database, SyncDatabase } from "./types.js";

const DEFAULT_DB_DIR = join(homedir(), ".zam");
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, "zam.db");
const require = createRequire(import.meta.url);

type LibsqlConstructor = new (
  path: string,
  options?: Record<string, unknown>,
) => SyncDatabase;

/**
 * - `local`: better-sqlite3 file database (default without cloud credentials)
 * - `native`: legacy native libsql driver (remote URLs and embedded replicas)
 * - `remote`: Turso over HTTP, no native bindings (works on Windows ARM64)
 */
export type DatabaseProvider = "local" | "native" | "remote";

export interface ConnectionOptions {
  /** Path to the SQLite database file. Defaults to ~/.zam/zam.db */
  dbPath?: string;
  /** If true, run the schema even when the database already exists. */
  initialize?: boolean;
  /** Turso sync URL for embedded replica mode (e.g. libsql://db-name.turso.io) */
  syncUrl?: string;
  /** Turso auth token for direct remote or embedded replica access */
  authToken?: string;
  /** If false, ignore ~/.zam/credentials.json and force the local/default database. */
  useConfiguredCloud?: boolean;
  /** Explicit provider; overrides ZAM_DB_PROVIDER and the credentials mode. */
  provider?: DatabaseProvider;
}

function isRemoteDatabasePath(dbPath: string): boolean {
  return /^(libsql|https?|wss?):\/\//i.test(dbPath);
}

function isDatabaseProvider(value: unknown): value is DatabaseProvider {
  return value === "local" || value === "native" || value === "remote";
}

function openLocalSqlite(dbPath: string): SyncDatabase {
  // Loaded lazily (not as a top-level import) so that remote/HTTP Turso users
  // never trigger the native better-sqlite3 binding. A failure to load that
  // binding inside the packaged desktop app would otherwise crash the whole
  // CLI at startup — before any provider selection or error handling runs.
  const mod = require("better-sqlite3") as
    | (new (
        path: string,
      ) => unknown)
    | { default: new (path: string) => unknown };
  const BetterSqlite3 = ("default" in mod ? mod.default : mod) as new (
    path: string,
  ) => unknown;
  return new BetterSqlite3(dbPath) as unknown as SyncDatabase;
}

function loadLibsql(): LibsqlConstructor {
  try {
    const module = require("libsql") as
      | LibsqlConstructor
      | { default: LibsqlConstructor };
    return "default" in module ? module.default : module;
  } catch (err) {
    const detail = err instanceof Error ? ` ${err.message}` : "";
    throw new Error(
      "Turso sync requires the optional native libsql backend, which is not " +
        `available for ${process.platform}/${process.arch}. Switch to the ` +
        "HTTP provider instead: zam connector setup turso --mode remote " +
        `(or set ZAM_DB_PROVIDER=remote).${detail}`,
    );
  }
}

/**
 * Open (or create) the ZAM database.
 * Uses configured Turso credentials for the default database when present.
 * Falls back to local SQLite and WAL mode when no cloud credentials exist.
 * When syncUrl is provided explicitly, enables embedded replica sync with Turso.
 */
export async function openDatabase(
  options: ConnectionOptions = {},
): Promise<Database> {
  const configuredCloud =
    options.useConfiguredCloud !== false && !options.dbPath && !options.syncUrl
      ? getTursoCredentials()
      : null;

  let requiresTurso = false;
  try {
    const configPath = join(process.cwd(), ".zam", "config.yaml");
    if (existsSync(configPath)) {
      const configText = readFileSync(configPath, "utf-8");
      if (/[\s\S]*turso:[\s\S]*url:/m.test(configText)) {
        requiresTurso = true;
      }
    }
  } catch (_e) {}

  if (
    requiresTurso &&
    !configuredCloud &&
    options.useConfiguredCloud !== false &&
    !options.dbPath &&
    !options.syncUrl
  ) {
    throw new Error(
      "Turso cloud database is configured in .zam/config.yaml but missing local credentials. Run: zam connector setup turso",
    );
  }
  const dbPath = configuredCloud?.url ?? options.dbPath ?? DEFAULT_DB_PATH;
  const isRemote = isRemoteDatabasePath(dbPath);
  const isEmbeddedReplica = Boolean(options.syncUrl);
  const provider = resolveProvider(options, configuredCloud?.mode, isRemote);
  const shouldInitialize =
    options.initialize === true ||
    (!isRemote && !isEmbeddedReplica && !existsSync(dbPath));

  if (provider === "remote") {
    const url = isRemote ? dbPath : options.syncUrl;
    if (!url) {
      throw new Error(
        "The remote database provider is selected but no Turso URL is " +
          "configured. Run: zam connector setup turso",
      );
    }
    const db = openRemoteDatabase({
      url,
      authToken: configuredCloud?.token ?? options.authToken,
    });
    if (options.initialize) {
      await db.exec(SCHEMA);
    }
    await runMigrations(db);
    return db;
  }

  if (shouldInitialize && !isRemote) {
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Build constructor options for the optional libsql cloud/sync backend.
  const dbOpts: Record<string, unknown> = {};
  if (options.syncUrl) {
    dbOpts.syncUrl = options.syncUrl;

    // When syncUrl is provided, the db must be a libsql embedded replica (not
    // plain SQLite). The presence of a companion .meta (or -info) file proves
    // it was created by libsql.
    //
    // If the db exists WITHOUT metadata, it was created before Turso was
    // configured — delete it so libsql can sync fresh from cloud.
    //
    // If metadata exists WITHOUT the db, libsql throws InvalidLocalState —
    // delete the metadata so it can start fresh.
    const metaPath = `${dbPath}.meta`;
    const infoPath = `${dbPath}-info`;

    if (existsSync(dbPath) && !existsSync(metaPath) && !existsSync(infoPath)) {
      for (const suffix of ["", "-wal", "-shm"]) {
        const f = `${dbPath}${suffix}`;
        if (existsSync(f)) rmSync(f, { force: true });
      }
    } else if (
      !existsSync(dbPath) &&
      (existsSync(metaPath) || existsSync(infoPath))
    ) {
      if (existsSync(metaPath)) rmSync(metaPath);
      if (existsSync(infoPath)) rmSync(infoPath);
    }
  }
  const authToken = configuredCloud?.token ?? options.authToken;
  if (authToken) {
    dbOpts.authToken = authToken;
  }

  let driver: SyncDatabase;
  if (isRemote || isEmbeddedReplica) {
    try {
      const LibsqlDatabase = loadLibsql();
      try {
        driver = new LibsqlDatabase(dbPath, dbOpts);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("InvalidLocalState") && options.syncUrl) {
          // Last-ditch recovery: metadata is corrupt or mismatched
          const metaPath = `${dbPath}.meta`;
          const infoPath = `${dbPath}-info`;
          if (existsSync(metaPath)) rmSync(metaPath);
          if (existsSync(infoPath)) rmSync(infoPath);
          driver = new LibsqlDatabase(dbPath, dbOpts);
        } else {
          throw err;
        }
      }
    } catch (nativeErr) {
      // The native libsql driver is unavailable or failed to initialise — a
      // failure mode that can occur inside the packaged desktop app. For a pure
      // remote database we transparently fall back to the HTTP provider, which
      // needs no native bindings. Embedded replicas require the native driver,
      // so those still surface the original error.
      const fallbackUrl = isRemote ? dbPath : options.syncUrl;
      if (isRemote && !isEmbeddedReplica && fallbackUrl) {
        const db = openRemoteDatabase({
          url: fallbackUrl,
          authToken: configuredCloud?.token ?? options.authToken,
        });
        if (options.initialize) {
          await db.exec(SCHEMA);
        }
        await runMigrations(db);
        return db;
      }
      throw nativeErr;
    }
  } else {
    driver = openLocalSqlite(dbPath);
  }

  // Enable WAL mode and foreign keys for local SQLite.
  // Remote Turso databases and embedded replicas manage their own journaling.
  if (!isRemote && !isEmbeddedReplica) {
    driver.pragma("journal_mode = WAL");
  }
  driver.pragma("foreign_keys = ON");
  if (!isRemote) {
    driver.pragma("busy_timeout = 5000");
  }

  const db = wrapSyncDatabase(driver);

  // For embedded replicas: sync from cloud FIRST so the local file has the
  // primary's schema before we try to run migrations or create tables.
  if (isEmbeddedReplica) {
    await db.sync?.();
  }

  if (shouldInitialize) {
    await db.exec(SCHEMA);
  }

  await runMigrations(db);

  return db;
}

function resolveProvider(
  options: ConnectionOptions,
  credentialsMode: string | undefined,
  isRemote: boolean,
): DatabaseProvider {
  if (options.provider) return options.provider;
  const env = process.env.ZAM_DB_PROVIDER;
  if (isDatabaseProvider(env)) return env;
  if (isDatabaseProvider(credentialsMode) && (isRemote || options.syncUrl)) {
    return credentialsMode;
  }
  // Legacy default: cloud URLs and embedded replicas use the native driver.
  if (isRemote || options.syncUrl) return "native";
  return "local";
}

/**
 * Open the database with Turso cloud credentials auto-detected.
 * Credentials live in ~/.zam/credentials.json (NOT in the db), so a fresh
 * machine only has to collect missing secrets instead of bootstrapping local
 * state first.
 */
export async function openDatabaseWithSync(
  options: Omit<ConnectionOptions, "syncUrl" | "authToken"> = {},
): Promise<Database> {
  return openDatabase(options);
}

/** Get the default database path */
export function getDefaultDbPath(): string {
  return DEFAULT_DB_PATH;
}

/**
 * Run incremental schema migrations on every open.
 * Each migration is idempotent — safe to run repeatedly.
 */
async function runMigrations(db: Database): Promise<void> {
  // M001: add execution_context to sessions
  const sessionCols = (await db.pragma("table_info(sessions)")) as Array<{
    name: string;
  }>;
  if (
    sessionCols.length > 0 &&
    !sessionCols.some((c) => c.name === "execution_context")
  ) {
    await db.exec(
      `ALTER TABLE sessions ADD COLUMN execution_context TEXT NOT NULL DEFAULT 'shell'`,
    );
  }

  // M002: add deprecated_at to tokens
  const tokenCols = (await db.pragma("table_info(tokens)")) as Array<{
    name: string;
  }>;
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "deprecated_at")
  ) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN deprecated_at TEXT`);
  }

  // M004: add source_link to tokens
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "source_link")
  ) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN source_link TEXT`);
  }

  // M005: add question to tokens
  if (tokenCols.length > 0 && !tokenCols.some((c) => c.name === "question")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN question TEXT`);
  }

  // M003: create agent_skills table (idempotent via IF NOT EXISTS in SCHEMA,
  // but also needed for databases that skipped the init path)
  await db.exec(`
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

  // M006: persist confirmed monitor-derived ratings for audit and idempotence.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_syntheses (
      session_id       TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      token_id         TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      card_id          TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      inferred_rating  INTEGER NOT NULL CHECK (inferred_rating BETWEEN 1 AND 4),
      confirmed_rating INTEGER NOT NULL CHECK (confirmed_rating BETWEEN 1 AND 4),
      confidence       TEXT NOT NULL CHECK (confidence IN ('medium', 'high')),
      evidence         TEXT NOT NULL DEFAULT '{}',
      review_log_id    TEXT NOT NULL REFERENCES review_logs(id) ON DELETE CASCADE,
      session_step_id  TEXT NOT NULL REFERENCES session_steps(id) ON DELETE CASCADE,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (session_id, token_id)
    )
  `);
}
