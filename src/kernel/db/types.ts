export type DatabaseValue = string | number | bigint | null | Uint8Array;

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Statement {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

/**
 * Synchronous database surface used by the learning kernel.
 *
 * Both better-sqlite3 and the optional libsql embedded-replica driver satisfy
 * this contract.
 */
export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  pragma(source: string): unknown;
  close(): void;
  sync?(): void;
}
