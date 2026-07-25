/**
 * PostgreSQL provider implementing the kernel's Database interface.
 *
 * Translates SQLite syntax defaults (e.g. parameter placeholders `?` -> `$n`,
 * `datetime('now')` -> `CURRENT_TIMESTAMP`, pragma table_info) so kernel code
 * and contract tests run transparently against PostgreSQL.
 */

import type { Pool, PoolClient } from "pg";
import type { Database, RunResult, Statement } from "./types.js";

export interface PostgresDatabaseOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  pool?: Pool;
}

/**
 * Replace `?` parameter placeholders with `$1, $2, ...` for PostgreSQL,
 * ignoring `?` inside single- or double-quoted string literals.
 */
export function translatePlaceholders(sql: string): string {
  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let result = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      result += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      result += char;
    } else if (char === "?" && !inSingleQuote && !inDoubleQuote) {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Translate SQLite-specific DDL syntax to PostgreSQL equivalents.
 */
export function translateSqlForPostgres(sql: string): string {
  return sql
    .replace(
      /DEFAULT\s*\(\s*datetime\s*\(\s*'now'\s*\)\s*\)/gi,
      "DEFAULT CURRENT_TIMESTAMP",
    )
    .replace(/datetime\s*\(\s*'now'\s*\)/gi, "CURRENT_TIMESTAMP")
    .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
    .replace(/\bBLOB\b/gi, "BYTEA")
    .replace(/\bREAL\b/gi, "DOUBLE PRECISION");
}

function checkAndNormalizeParams(params: unknown[]): unknown[] {
  for (const p of params) {
    if (p === undefined) {
      throw new Error("Cannot bind parameter undefined");
    }
    if (typeof p === "boolean") {
      throw new Error("Cannot bind parameter boolean");
    }
  }
  return params;
}

class PostgresStatement implements Statement {
  constructor(
    private client: Pool | PoolClient,
    private sql: string,
  ) {}

  async run(...params: unknown[]): Promise<RunResult> {
    const normalizedParams = checkAndNormalizeParams(params);
    let pgSql = translateSqlForPostgres(translatePlaceholders(this.sql));
    if (/^\s*INSERT\b/i.test(pgSql) && !/\bRETURNING\b/i.test(pgSql)) {
      pgSql += " RETURNING *";
    }
    const res = await this.client.query(pgSql, normalizedParams);
    let lastInsertRowid: number | bigint = 0;
    if (res.rows && res.rows.length > 0 && res.rows[0].id !== undefined) {
      const idVal = res.rows[0].id;
      if (typeof idVal === "number" || typeof idVal === "bigint") {
        lastInsertRowid = idVal;
      } else if (typeof idVal === "string" && /^\d+$/.test(idVal)) {
        lastInsertRowid = Number(idVal);
      }
    }
    return {
      changes: res.rowCount ?? 0,
      lastInsertRowid,
    };
  }

  async get(...params: unknown[]): Promise<unknown> {
    const normalizedParams = checkAndNormalizeParams(params);
    const pgSql = translateSqlForPostgres(translatePlaceholders(this.sql));
    const res = await this.client.query(pgSql, normalizedParams);
    if (!res.rows || res.rows.length === 0) return undefined;
    return res.rows[0];
  }

  async all(...params: unknown[]): Promise<unknown[]> {
    const normalizedParams = checkAndNormalizeParams(params);
    const pgSql = translateSqlForPostgres(translatePlaceholders(this.sql));
    const res = await this.client.query(pgSql, normalizedParams);
    return res.rows ?? [];
  }
}

export function openPostgresDatabase(
  options: PostgresDatabaseOptions,
): Database {
  let poolInstance: Pool | null = options.pool ?? null;

  async function getPool(): Promise<Pool> {
    if (poolInstance) return poolInstance;
    try {
      const pgModule = await import("pg");
      const PoolClass = pgModule.default?.Pool ?? pgModule.Pool;
      const pgTypes = pgModule.default?.types ?? pgModule.types;
      if (pgTypes && typeof pgTypes.setTypeParser === "function") {
        pgTypes.setTypeParser(20, (val: string) => {
          const num = Number(val);
          return Number.isSafeInteger(num) ? num : val;
        });
      }
      poolInstance = new PoolClass({
        connectionString: options.connectionString,
        host: options.host,
        port: options.port,
        database: options.database,
        user: options.user,
        password: options.password,
      });
      return poolInstance;
    } catch (err) {
      throw new Error(
        `Failed to load PostgreSQL driver 'pg'. Please install 'pg' to use PostgreSQL database provider: ${err}`,
      );
    }
  }

  let activeTxClient: PoolClient | null = null;
  let txMutex: Promise<void> = Promise.resolve();

  async function getActiveClient(): Promise<Pool | PoolClient> {
    if (activeTxClient) return activeTxClient;
    return getPool();
  }

  const db: Database = {
    prepare(sql: string): Statement {
      return {
        async run(...params: unknown[]): Promise<RunResult> {
          const client = await getActiveClient();
          const stmt = new PostgresStatement(client, sql);
          return stmt.run(...params);
        },
        async get(...params: unknown[]): Promise<unknown> {
          const client = await getActiveClient();
          const stmt = new PostgresStatement(client, sql);
          return stmt.get(...params);
        },
        async all(...params: unknown[]): Promise<unknown[]> {
          const client = await getActiveClient();
          const stmt = new PostgresStatement(client, sql);
          return stmt.all(...params);
        },
      };
    },

    async exec(sql: string): Promise<void> {
      const client = await getActiveClient();
      const translated = translateSqlForPostgres(sql);
      await client.query(translated);
    },

    async pragma(source: string): Promise<unknown> {
      const match = source.match(/table_info\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1].replace(/['"]/g, "").trim();
        const client = await getActiveClient();
        const res = await client.query(
          `SELECT column_name AS name
             FROM information_schema.columns
            WHERE table_name = $1
         ORDER BY ordinal_position`,
          [tableName],
        );
        return res.rows;
      }
      return [];
    },

    async transaction<T>(fn: (txDb: Database) => Promise<T>): Promise<T> {
      if (activeTxClient) {
        return fn(db);
      }

      const previousMutex = txMutex;
      let releaseMutex: () => void = () => {};
      txMutex = new Promise<void>((resolve) => {
        releaseMutex = resolve;
      });

      await previousMutex;

      try {
        const pool = await getPool();
        const client = await pool.connect();
        try {
          activeTxClient = client;
          await client.query("BEGIN");
          const result = await fn(db);
          await client.query("COMMIT");
          return result;
        } catch (err) {
          await client.query("ROLLBACK").catch(() => {});
          throw err;
        } finally {
          activeTxClient = null;
          client.release();
        }
      } finally {
        releaseMutex();
      }
    },

    async close(): Promise<void> {
      if (poolInstance) {
        await poolInstance.end();
        poolInstance = null;
      }
    },
  };

  return db;
}
