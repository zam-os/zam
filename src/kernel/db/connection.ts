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
    if (options.initialize) {
      await db.exec(SCHEMA);
    }
    await runMigrations(db);
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

    if (shouldInitialize) {
      await db.exec(SCHEMA);
    }

    await runMigrations(db);

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

  // M007: create sources and token_sources tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL CHECK (type IN ('file', 'web', 'scan')),
      uri         TEXT NOT NULL UNIQUE,
      content     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_sources (
      token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      source_id   TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      excerpt     TEXT NOT NULL DEFAULT '',
      page_number TEXT,
      PRIMARY KEY (token_id, source_id)
    )
  `);

  // M008: add provider and topic_id columns to tokens table
  if (tokenCols.length > 0) {
    if (!tokenCols.some((c) => c.name === "provider")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN provider TEXT`);
    }
    if (!tokenCols.some((c) => c.name === "topic_id")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN topic_id TEXT`);
    }
  }

  // M009: create token_embeddings table (semantic search, ADR 2026-07-03)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_embeddings (
      token_id     TEXT PRIMARY KEY REFERENCES tokens(id) ON DELETE CASCADE,
      embedding    BLOB NOT NULL,
      model        TEXT NOT NULL,
      dims         INTEGER NOT NULL,
      content_hash TEXT NOT NULL,
      embedded_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // M010: add title column to tokens for human-friendly graph display
  // (separate from slug; supports Unicode, no domain prefix, auto-generated)
  if (!tokenCols.some((c) => c.name === "title")) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN title TEXT NOT NULL DEFAULT ''`,
    );
  }

  // M011: add indexes for title search and domain prefix filtering
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tokens_title ON tokens(title)`);
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain)`,
  );

  // M012: create contexts and token_contexts tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contexts (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      label      TEXT,
      language   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_contexts (
      token_id   TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
      PRIMARY KEY (token_id, context_id)
    )
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_token_contexts_context ON token_contexts(context_id)
  `);

  // M013: add question provenance to tokens (ADR 2026-06-15 item 3).
  // The column default 'llm' doubles as the backfill: pre-provenance rows
  // (and rows from old snapshots, which INSERT without this column) count
  // as LLM-era content. Human-authored questions are marked 'manual' by the
  // API layer (createToken/updateToken) from now on.
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "question_source")
  ) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN question_source TEXT NOT NULL DEFAULT 'llm'`,
    );
  }

  // M014: token maintenance state (ADR 2026-07-18). NULL = healthy; a
  // timestamp marks the token as needing repair (stale source binding,
  // ambiguous re-import) — its cards leave the review queue until cleared.
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "maintenance_at")
  ) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN maintenance_at TEXT`);
    await db.exec(`ALTER TABLE tokens ADD COLUMN maintenance_reason TEXT`);
  }

  // M015: content versioning for curated libraries (ADR 2026-07-04 Decision 3).
  // A token carries the version of its *substance*; a card records which
  // version its owner actually learned. Only a curator's **material** change
  // bumps the token, so `card.learned_content_version < token.content_version`
  // means exactly "this learner has not been re-tested since the meaning
  // changed" — the card is set due and the next rating recalibrates FSRS.
  //
  // Both default to 1, which is the backfill: existing tokens and cards are in
  // sync on migration and nobody is re-tested for upgrading.
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "content_version")
  ) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN content_version INTEGER NOT NULL DEFAULT 1`,
    );
  }
  const cardCols = (await db.pragma("table_info(cards)")) as Array<{
    name: string;
  }>;
  if (
    cardCols.length > 0 &&
    !cardCols.some((c) => c.name === "learned_content_version")
  ) {
    await db.exec(
      `ALTER TABLE cards ADD COLUMN learned_content_version INTEGER NOT NULL DEFAULT 1`,
    );
  }

  // M016: provenance columns for published revisions (ADR 2026-07-04 Phase 1).
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "published_by")
  ) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN published_by TEXT`);
    await db.exec(`ALTER TABLE tokens ADD COLUMN published_at TEXT`);
  }

  // M017: editorial state for tokens (ADR 2026-07-04 Phase 3).
  if (
    tokenCols.length > 0 &&
    !tokenCols.some((c) => c.name === "editorial_state")
  ) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN editorial_state TEXT NOT NULL DEFAULT 'published'`,
    );
    await db.exec(
      `UPDATE tokens SET editorial_state = 'deprecated' WHERE deprecated_at IS NOT NULL`,
    );
  }

  // M018: knowledge assignments (ADR 2026-07-04 Decision 10).
  if (cardCols.length > 0 && !cardCols.some((c) => c.name === "assigned_by")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN assigned_by TEXT`);
    await db.exec(
      `ALTER TABLE cards ADD COLUMN assignment_id TEXT REFERENCES assignments(id) ON DELETE SET NULL`,
    );
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id           TEXT PRIMARY KEY,
      token_id     TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      assigner_id  TEXT NOT NULL,
      assignee_id  TEXT NOT NULL,
      due_date     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      withdrawn_at TEXT
    );
  `);
}
