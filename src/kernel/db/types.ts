export type DatabaseValue = string | number | bigint | null | Uint8Array;

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

/**
 * Asynchronous database contract used by the learning kernel.
 *
 * Every provider (local SQLite, optional libsql embedded replica, remote
 * Turso over HTTP) implements this interface; no kernel or public API type
 * depends on a concrete database package.
 */
export interface Statement {
  run(...params: unknown[]): Promise<RunResult>;
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
}

export interface Database {
  prepare(sql: string): Statement;
  /** Execute one or more SQL statements without reading results. */
  exec(sql: string): Promise<void>;
  /**
   * Run a PRAGMA. Local providers support the full pragma surface; the
   * remote provider only supports read pragmas that have a table-valued
   * function equivalent (e.g. `table_info(...)`).
   */
  pragma(source: string): Promise<unknown>;
  /**
   * Run `fn` inside a BEGIN IMMEDIATE … COMMIT/ROLLBACK transaction.
   * Transactions are serialized per connection; nested calls deadlock by
   * design rather than silently interleaving writes.
   */
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
  /** Pull changes from the cloud primary (embedded replicas only). */
  sync?(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Synchronous driver surface satisfied by better-sqlite3 and the optional
 * libsql embedded-replica package. Internal: kernel code must use the async
 * `Database` contract instead.
 */
export interface SyncStatement {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface SyncDatabase {
  prepare(sql: string): SyncStatement;
  exec(sql: string): void;
  pragma(source: string): unknown;
  close(): void;
  sync?(): void;
}
