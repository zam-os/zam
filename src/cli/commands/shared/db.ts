/**
 * Shared database helpers for CLI commands.
 *
 * Every command needs the same openDatabase → execute → close → handle errors
 * pattern.  These wrappers keep command files focused on their domain logic.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Database } from "../../../kernel/index.js";
import {
  isTransientRemoteDatabaseError,
  openDatabase,
} from "../../../kernel/index.js";

type ErrorHandler = (message: string) => void;

/**
 * Process-lifetime owner for hosts such as `zam mcp` and `bridge serve`.
 *
 * `database` is a lazy proxy for consumers that already speak the kernel's
 * Database contract. `getDatabase` lets command wrappers distinguish a failed
 * open (and preserve `withOptionalDb`'s null fallback) from a query failure.
 */
export interface PersistentDatabaseHost {
  readonly database: Database;
  getDatabase(): Promise<Database>;
  /**
   * Drop the cached handle so the next caller opens a fresh one.
   *
   * A standalone command reopened the database every time, so a dropped
   * network connection healed itself on the next invocation. A host holds one
   * handle for hours, and the default provider for a Turso URL is the stateful
   * native driver — without this, one lost connection would poison every later
   * command until the process restarts.
   */
  invalidate(): void;
  close(): Promise<void>;
}

export type DatabaseSource = Database | PersistentDatabaseHost;

const databaseContext = new AsyncLocalStorage<DatabaseSource>();

function isPersistentDatabaseHost(
  source: DatabaseSource,
): source is PersistentDatabaseHost {
  return typeof (source as PersistentDatabaseHost).getDatabase === "function";
}

async function resolveDatabase(source: DatabaseSource): Promise<Database> {
  return isPersistentDatabaseHost(source)
    ? source.getDatabase()
    : Promise.resolve(source);
}

/** Run one command with a host-owned database, without transferring ownership. */
export function runWithDatabase<T>(
  source: DatabaseSource,
  fn: () => Promise<T>,
): Promise<T> {
  return databaseContext.run(source, fn);
}

/**
 * Create a lazy, retryable database owner for one long-lived host process.
 * Concurrent first users share the same open attempt; a rejected attempt is
 * forgotten so the next request can recover. Closing never opens the database
 * and closes a successful handle at most once.
 */
export function createPersistentDatabaseHost(
  openFn: () => Promise<Database>,
): PersistentDatabaseHost {
  let databasePromise: Promise<Database> | null = null;
  let closePromise: Promise<void> | null = null;
  let closed = false;

  const getDatabase = (): Promise<Database> => {
    if (closed) {
      return Promise.reject(new Error("Persistent database host is closed."));
    }
    if (!databasePromise) {
      const attempt = Promise.resolve().then(openFn);
      const guarded = attempt.catch((error) => {
        if (databasePromise === guarded) databasePromise = null;
        throw error;
      });
      databasePromise = guarded;
    }
    return databasePromise;
  };

  const invalidate = (): void => {
    if (closed || !databasePromise) return;
    const stale = databasePromise;
    databasePromise = null;
    // Detached and best-effort: a connection that just died mid-query is
    // unlikely to close cleanly, and no caller is waiting on that outcome.
    void stale.then(
      (database) => database.close().catch(() => {}),
      () => {},
    );
  };

  const close = (): Promise<void> => {
    if (closePromise) return closePromise;
    closed = true;
    const pendingDatabase = databasePromise;
    closePromise = (async () => {
      if (!pendingDatabase) return;
      try {
        const database = await pendingDatabase;
        await database.close();
      } catch {
        // A failed open has no live handle to close. Hosts already treat
        // shutdown as best-effort and must not replace the original error.
      }
    })();
    return closePromise;
  };

  const database: Database = {
    prepare(sql) {
      return {
        async run(...params: unknown[]) {
          const opened = await getDatabase();
          return opened.prepare(sql).run(...params);
        },
        async get(...params: unknown[]) {
          const opened = await getDatabase();
          return opened.prepare(sql).get(...params);
        },
        async all(...params: unknown[]) {
          const opened = await getDatabase();
          return opened.prepare(sql).all(...params);
        },
      };
    },
    async exec(sql) {
      const opened = await getDatabase();
      return opened.exec(sql);
    },
    async pragma(source) {
      const opened = await getDatabase();
      return opened.pragma(source);
    },
    async transaction<T>(fn: (transactionDatabase: Database) => Promise<T>) {
      const opened = await getDatabase();
      return opened.transaction(fn);
    },
    async sync() {
      const opened = await getDatabase();
      await opened.sync?.();
    },
    close,
  };

  return {
    database,
    getDatabase,
    invalidate,
    close,
  };
}

/** Backward-compatible Database-only view used by existing MCP tests/callers. */
export function createLazyDatabase(openFn: () => Promise<Database>): Database {
  return createPersistentDatabaseHost(openFn).database;
}

/**
 * Retire a host handle after a failure that says nothing about the SQL — a
 * dropped socket, a 5xx, an unreachable host. Real SQL errors never match, so
 * a failing query keeps the connection it is failing on.
 */
function invalidateOnTransientFailure(
  source: DatabaseSource,
  error: unknown,
): void {
  if (isPersistentDatabaseHost(source) && isTransientRemoteDatabaseError(error))
    source.invalidate();
}

function defaultErrorHandler(message: string): void {
  console.error("Error:", message);
  process.exit(1);
}

/** Opens the DB, awaits fn, closes the DB, handles errors. */
export async function withDb(
  fn: (db: Database) => void | Promise<void>,
  onError: ErrorHandler = defaultErrorHandler,
): Promise<void> {
  const injected = databaseContext.getStore();
  let db: Database | undefined;
  try {
    db = injected ? await resolveDatabase(injected) : await openDatabase();
    await fn(db);
  } catch (err) {
    if (injected) invalidateOnTransientFailure(injected, err);
    onError((err as Error).message);
  } finally {
    if (!injected) await db?.close();
  }
}

/**
 * Like `withDb`, but for commands whose data is machine-local (workspaces,
 * active knowledge context): when the database cannot be opened — e.g. the
 * configured cloud database is unreachable — fn receives `null` and must
 * degrade gracefully instead of failing the whole command (issue #162).
 */
export async function withOptionalDb(
  fn: (db: Database | null) => void | Promise<void>,
  onError: ErrorHandler = defaultErrorHandler,
): Promise<void> {
  const injected = databaseContext.getStore();
  let db: Database | null = null;
  try {
    db = injected ? await resolveDatabase(injected) : await openDatabase();
  } catch {
    db = null;
  }
  try {
    await fn(db);
  } catch (err) {
    if (injected) invalidateOnTransientFailure(injected, err);
    onError((err as Error).message);
  } finally {
    if (!injected) await db?.close();
  }
}

/**
 * JSON output helper — used by commands that support --json.
 */
export function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
