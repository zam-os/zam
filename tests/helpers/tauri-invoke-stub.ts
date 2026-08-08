/**
 * In-process stand-in for the mobile Tauri IPC boundary.
 *
 * Implements the same commands and wire encoding as the Rust shell
 * (mobile/src-tauri/src/db.rs) on top of better-sqlite3, so the mobile
 * provider (mobile/src/provider.ts) can run the full database contract
 * suite without a device. Errors are thrown as strings because Tauri
 * rejects invoke calls with the `Err(String)` payload, not an Error.
 */

import BetterSqlite3 from "better-sqlite3";

type Invoke = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

export interface TauriInvokeStub {
  invoke: Invoke;
  close(): void;
}

interface CommandArgs {
  sql: string;
  params?: unknown[];
}

function fromWire(value: unknown): unknown {
  if (value !== null && typeof value === "object") {
    const blob = (value as { $blob?: unknown }).$blob;
    if (typeof blob === "string") {
      return Buffer.from(blob, "base64");
    }
  }
  return value;
}

function toWire(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return { $blob: value.toString("base64") };
  }
  return value;
}

export function createTauriInvokeStub(path: string): TauriInvokeStub {
  const db = new BetterSqlite3(path);

  function query(sql: string, params: unknown[]): unknown[] {
    const statement = db.prepare(sql);
    if (!statement.reader) {
      statement.run(...params);
      return [];
    }
    return statement.all(...params).map((row) => {
      const wired: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        row as Record<string, unknown>,
      )) {
        wired[key] = toWire(value);
      }
      return wired;
    });
  }

  async function invoke(
    command: string,
    args: Record<string, unknown> = {},
  ): Promise<unknown> {
    const { sql, params = [] } = args as unknown as CommandArgs;
    const bound = params.map(fromWire);
    try {
      switch (command) {
        case "db_query":
          return query(sql, bound);
        case "db_execute": {
          const info = db.prepare(sql).run(...bound);
          return {
            changes: info.changes,
            lastInsertRowid: Number(info.lastInsertRowid),
          };
        }
        case "db_execute_batch":
          db.exec(sql);
          return null;
        case "db_sync":
          return null;
        case "db_describe":
          // The stub is always a local file, which is what a standalone
          // install runs on. `db_sync` refusing on a local database is the
          // Rust side's behaviour, not the stub's — nothing here calls it.
          return { mode: "local", location: path, sizeBytes: 0 };
        case "db_close":
          if (db.open) {
            db.close();
          }
          return null;
        default:
          throw new Error(`unknown command ${command}`);
      }
    } catch (error) {
      throw error instanceof Error ? error.message : String(error);
    }
  }

  return {
    invoke,
    close() {
      if (db.open) {
        db.close();
      }
    },
  };
}
