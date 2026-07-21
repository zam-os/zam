/**
 * Mobile database provider — implements the kernel's async `Database`
 * contract (src/kernel/db/types.ts) over Tauri IPC.
 *
 * The WebView never links a database library: every call crosses the IPC
 * boundary into the Rust shell, which owns one libsql connection (local
 * file or offline-writable synced copy of the server database).
 *
 * Wire encoding, mirrored by src-tauri/src/db.rs and the test stub in
 * tests/helpers/tauri-invoke-stub.ts:
 * - string / number / null travel as JSON primitives
 * - bigint parameters are narrowed to safe-integer numbers (ZAM ids are
 *   TEXT ULIDs; bigints only appear as rowids)
 * - blobs travel as { "$blob": "<base64>" } in both directions
 * - undefined and booleans are rejected locally, matching better-sqlite3
 * - command errors arrive as strings and are rethrown as `Error`s
 */

import type {
  Database,
  DatabaseValue,
  RunResult,
  Statement,
} from "../../src/kernel/db/types.js";

export type InvokeFn = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

type WireValue = string | number | null | { $blob: string };

interface WireRunResult {
  changes: number;
  lastInsertRowid: number;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toWire(value: unknown, index: number): WireValue {
  if (value === null) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    const narrowed = Number(value);
    if (!Number.isSafeInteger(narrowed)) {
      throw new RangeError(
        `Parameter ${index + 1}: bigint ${value} exceeds the safe integer range`,
      );
    }
    return narrowed;
  }
  if (value instanceof Uint8Array) {
    return { $blob: encodeBase64(value) };
  }
  throw new TypeError(
    `Parameter ${index + 1}: cannot bind ${typeof value} to SQLite`,
  );
}

function fromWire(value: unknown): DatabaseValue {
  if (value !== null && typeof value === "object") {
    const blob = (value as { $blob?: unknown }).$blob;
    if (typeof blob === "string") {
      return decodeBase64(blob);
    }
  }
  return value as DatabaseValue;
}

function decodeRow(row: Record<string, unknown>): Record<string, unknown> {
  const decoded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    decoded[key] = fromWire(value);
  }
  return decoded;
}

/**
 * Wrap a Tauri `invoke` function into a kernel `Database`. The invoke
 * function is injected so tests can substitute an in-process stub.
 */
export function createTauriDatabase(invoke: InvokeFn): Database {
  const call = async <T>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<T> => {
    try {
      return (await invoke(command, args)) as T;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  const query = async (
    sql: string,
    params: unknown[],
  ): Promise<Record<string, unknown>[]> => {
    const rows = await call<Record<string, unknown>[]>("db_query", {
      sql,
      params: params.map(toWire),
    });
    return rows.map(decodeRow);
  };

  const execute = async (
    sql: string,
    params: unknown[],
  ): Promise<RunResult> => {
    const result = await call<WireRunResult>("db_execute", {
      sql,
      params: params.map(toWire),
    });
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  };

  // Transactions are serialized per connection; nested calls deadlock by
  // design (see the contract in src/kernel/db/types.ts).
  let transactionQueue: Promise<unknown> = Promise.resolve();

  const db: Database = {
    prepare(sql: string): Statement {
      return {
        run(...params: unknown[]): Promise<RunResult> {
          return execute(sql, params);
        },
        async get(...params: unknown[]): Promise<unknown> {
          const rows = await query(sql, params);
          return rows[0];
        },
        async all(...params: unknown[]): Promise<unknown[]> {
          return query(sql, params);
        },
      };
    },

    async exec(sql: string): Promise<void> {
      await call("db_execute_batch", { sql });
    },

    async pragma(source: string): Promise<unknown> {
      return query(`PRAGMA ${source}`, []);
    },

    transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
      const task = transactionQueue.then(async () => {
        await execute("BEGIN IMMEDIATE", []);
        try {
          const value = await fn(db);
          await execute("COMMIT", []);
          return value;
        } catch (error) {
          try {
            await execute("ROLLBACK", []);
          } catch {
            // Preserve the original failure; the connection owns cleanup.
          }
          throw error;
        }
      });
      transactionQueue = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },

    async sync(): Promise<void> {
      await call("db_sync");
    },

    async close(): Promise<void> {
      await call("db_close");
    },
  };

  return db;
}
