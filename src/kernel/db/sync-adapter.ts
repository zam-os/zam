/**
 * Adapter that lifts a synchronous SQLite driver (better-sqlite3 or the
 * optional libsql embedded replica) into the async `Database` contract.
 *
 * Statements execute synchronously under the hood, so per-statement atomicity
 * is unchanged. Transactions are serialized through a promise queue because
 * an async callback can yield between statements, and two interleaved
 * BEGIN IMMEDIATE blocks on one connection would otherwise corrupt each
 * other's boundaries.
 */

import type { Database, SyncDatabase } from "./types.js";

export function wrapSyncDatabase(driver: SyncDatabase): Database {
  let txTail: Promise<unknown> = Promise.resolve();

  const db: Database = {
    prepare(sql: string) {
      return {
        async run(...params: unknown[]) {
          return driver.prepare(sql).run(...params);
        },
        async get(...params: unknown[]) {
          return driver.prepare(sql).get(...params);
        },
        async all(...params: unknown[]) {
          return driver.prepare(sql).all(...params);
        },
      };
    },

    async exec(sql: string) {
      driver.exec(sql);
    },

    async pragma(source: string) {
      return driver.pragma(source);
    },

    transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
      const run = txTail.then(async () => {
        driver.exec("BEGIN IMMEDIATE");
        try {
          const result = await fn(db);
          driver.exec("COMMIT");
          return result;
        } catch (err) {
          driver.exec("ROLLBACK");
          throw err;
        }
      });
      txTail = run.catch(() => {});
      return run;
    },

    ...(driver.sync
      ? {
          async sync() {
            driver.sync?.();
          },
        }
      : {}),

    async close() {
      driver.close();
    },
  };

  return db;
}
