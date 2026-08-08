import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  getTursoCredentials,
  tursoVaultAccessPending,
} from "../credentials.js";
import { applySchemaAndMigrations, runMigrations } from "./provision.js";
import { openRemoteDatabase } from "./remote/provider.js";
import { wrapSyncDatabase } from "./sync-adapter.js";
import type { Database, SyncDatabase } from "./types.js";

const DEFAULT_DB_DIR = join(homedir(), ".zam");
const DEFAULT_DB_PATH = join(DEFAULT_DB_DIR, "zam.db");

/**
 * Lazy CommonJS `require` for the optional native drivers. Deliberately NOT a
 * module-scope `createRequire(import.meta.url)`: this module is re-exported
 * by the kernel public API, which the VS Code Companion bundles as CJS —
 * there `import.meta.url` compiles to `undefined` and a module-scope call
 * crashed the whole extension at activation (0.10.11 live test). Lazy + the
 * `__filename` guard works in both module systems, and no driver code runs
 * unless a database is actually opened.
 */
let nodeRequire: NodeRequire | undefined;
function require(id: string): unknown {
  if (!nodeRequire) {
    nodeRequire = createRequire(
      typeof __filename === "string" ? __filename : import.meta.url,
    );
  }
  return nodeRequire(id);
}

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

export interface DatabaseTargetInfo {
  /** User-facing category of database target selected for this connection. */
  kind: "local" | "turso-native" | "turso-remote" | "turso-replica";
  /** Driver/provider that will be used for the selected target. */
  provider: DatabaseProvider;
  /** Local filesystem path or remote URL selected as the database target. */
  location: string;
  /** Turso primary URL when the selected target is an embedded replica. */
  syncUrl?: string;
}

interface ResolvedDatabaseTarget {
  dbPath: string;
  provider: DatabaseProvider;
  isRemote: boolean;
  isEmbeddedReplica: boolean;
  configuredCloud: ReturnType<typeof getTursoCredentials>;
}

function isRemoteDatabasePath(dbPath: string): boolean {
  return /^(libsql|https?|wss?):\/\//i.test(dbPath);
}

function isDatabaseProvider(value: unknown): value is DatabaseProvider {
  return value === "local" || value === "native" || value === "remote";
}

function cwdRequiresTursoCredentials(): boolean {
  try {
    const configPath = join(process.cwd(), ".zam", "config.yaml");
    if (existsSync(configPath)) {
      const configText = readFileSync(configPath, "utf-8");
      return /[\s\S]*turso:[\s\S]*url:/m.test(configText);
    }
  } catch (_e) {}
  return false;
}

function resolveDatabaseTarget(
  options: ConnectionOptions = {},
): ResolvedDatabaseTarget {
  const configuredCloud =
    options.useConfiguredCloud !== false && !options.dbPath && !options.syncUrl
      ? getTursoCredentials()
      : null;

  // Vault-backed Turso token configured but not resolved: never silently fall
  // back to an empty local DB — the UI must assure Bitwarden login/unlock first.
  if (
    !configuredCloud &&
    options.useConfiguredCloud !== false &&
    !options.dbPath &&
    !options.syncUrl &&
    tursoVaultAccessPending()
  ) {
    throw new Error(
      "BITWARDEN_REQUIRED: Server database token is in Bitwarden. Unlock or log in to Bitwarden to continue.",
    );
  }

  if (
    cwdRequiresTursoCredentials() &&
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

  return {
    dbPath,
    provider,
    isRemote,
    isEmbeddedReplica,
    configuredCloud,
  };
}

export function getDatabaseTargetInfo(
  options: ConnectionOptions = {},
): DatabaseTargetInfo {
  const target = resolveDatabaseTarget(options);

  if (target.isEmbeddedReplica) {
    return {
      kind: "turso-replica",
      provider: target.provider,
      location: target.dbPath,
      syncUrl: options.syncUrl,
    };
  }

  if (target.provider === "remote" && target.isRemote) {
    return {
      kind: "turso-remote",
      provider: target.provider,
      location: target.dbPath,
    };
  }

  if (target.isRemote) {
    return {
      kind: "turso-native",
      provider: target.provider,
      location: target.dbPath,
    };
  }

  return {
    kind: "local",
    provider: target.provider,
    location: target.dbPath,
  };
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

const TRANSIENT_REMOTE_ERROR_PATTERNS = [
  /status=5\d\d/i,
  /websocket/i,
  /stream closed/i,
  /connection (?:closed|reset|refused)/i,
  /fetch failed/i,
  /\b(?:ETIMEDOUT|ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|EPIPE)\b/,
];

/**
 * True for server/network failures that say nothing about the SQL itself —
 * e.g. Turso's intermittent `Hrana(Api("status=502 ...upstream forward
 * failed"))` on the websocket path. These justify retrying the connection
 * over the HTTP provider (issue #163); real SQL errors never match.
 */
export function isTransientRemoteDatabaseError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return TRANSIENT_REMOTE_ERROR_PATTERNS.some((pattern) =>
    pattern.test(message),
  );
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
  const { dbPath, provider, isRemote, isEmbeddedReplica, configuredCloud } =
    resolveDatabaseTarget(options);
  const shouldInitialize =
    options.initialize === true ||
    (!isRemote && !isEmbeddedReplica && !existsSync(dbPath));

  const openViaHttpProvider = async (url: string): Promise<Database> => {
    const db = openRemoteDatabase({
      url,
      authToken: configuredCloud?.token ?? options.authToken,
    });
    // Always provision. A fresh Turso/sqld database has no tables;
    // openDatabase() is used without initialize by withDb/check-due, which
    // otherwise surfaces "no such table: tokens".
    await applySchemaAndMigrations(db);
    return db;
  };

  if (provider === "remote") {
    const url = isRemote ? dbPath : options.syncUrl;
    if (!url) {
      throw new Error(
        "The remote database provider is selected but no Turso URL is " +
          "configured. Run: zam connector setup turso",
      );
    }
    return openViaHttpProvider(url);
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
      if (isRemote && !isEmbeddedReplica) {
        return openViaHttpProvider(dbPath);
      }
      throw nativeErr;
    }
  } else {
    driver = openLocalSqlite(dbPath);
  }

  const finishOpen = async (): Promise<Database> => {
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

    // Local brand-new files need the schema; remote empties do too. Every
    // statement is IF NOT EXISTS, so re-running on a full library is a no-op.
    // Previously remote opens skipped the schema unless initialize:true, which
    // left empty cloud DBs broken for the dashboard (no such table: tokens).
    // An existing local file only needs the migration chain — its tables are
    // already there and its indexes were created when it was provisioned.
    if (shouldInitialize || isRemote || isEmbeddedReplica) {
      await applySchemaAndMigrations(db);
    } else {
      await runMigrations(db);
    }

    return db;
  };

  if (isRemote && !isEmbeddedReplica) {
    try {
      return await finishOpen();
    } catch (err) {
      // Autorepair (issue #163): the native websocket path can hit transient
      // Turso failures (e.g. status=502 "upstream forward failed") that the
      // HTTP path does not share. Retry over the HTTP provider before
      // surfacing the error.
      if (isTransientRemoteDatabaseError(err)) {
        return openViaHttpProvider(dbPath);
      }
      throw err;
    }
  }

  return finishOpen();
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
