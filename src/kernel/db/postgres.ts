/**
 * PostgreSQL provider implementing the kernel's Database interface.
 *
 * Translates SQLite syntax defaults (parameter placeholders `?` -> `$n`,
 * `datetime('now')` -> an ISO-8601 UTC text expression, `AUTOINCREMENT`,
 * `BLOB`/`REAL` column types, pragma table_info) so kernel code and contract
 * tests run transparently against PostgreSQL.
 */

import type { Pool, PoolClient } from "pg";
import { POSTGRES_ISO_NOW_SQL } from "./sql.js";
import type { Database, RunResult, Statement } from "./types.js";

/**
 * Supplies the password for one new pooled connection. A function is called
 * per connection, which is how a short-lived Entra access token becomes the
 * password without any refresh loop: an open session is never
 * re-authenticated, a new one simply fetches a fresh token (ADR 2026-09-04
 * Decision 3). The provider only sees a function returning a string; what
 * spawns the Azure CLI lives in the CLI layer.
 */
export type PostgresPasswordSupplier = () => Promise<string>;

export interface PostgresDatabaseOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string | PostgresPasswordSupplier;
  /** TLS: `true` verifies the server certificate against the system roots. */
  ssl?: boolean;
  /** Reported to the server as `application_name`. */
  applicationName?: string;
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
 * Split SQL into code and quoted segments: single-quoted string literals,
 * double-quoted identifiers and dollar-quoted bodies (`$$ … $$`, `$tag$ … $tag$`)
 * are returned verbatim so no rewrite ever touches them.
 */
function splitQuotedSegments(
  sql: string,
): Array<{ code: boolean; text: string }> {
  const segments: Array<{ code: boolean; text: string }> = [];
  let code = "";
  let i = 0;
  const flushCode = () => {
    if (code) segments.push({ code: true, text: code });
    code = "";
  };
  while (i < sql.length) {
    const ch = sql[i];
    // Comments are neither code nor quoted text — an apostrophe in
    // `-- the learner's cards` must not open a string that swallows the DDL.
    if (ch === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const stop = end === -1 ? sql.length : end;
      flushCode();
      segments.push({ code: false, text: sql.slice(i, stop) });
      i = stop;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      flushCode();
      segments.push({ code: false, text: sql.slice(i, stop) });
      i = stop;
      continue;
    }
    if (ch === "'" || ch === '"') {
      // Doubled quotes inside the literal/identifier escape themselves.
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) {
            j += 2;
            continue;
          }
          break;
        }
        j += 1;
      }
      flushCode();
      segments.push({ code: false, text: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (ch === "$") {
      const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (tag) {
        const close = sql.indexOf(tag[0], i + tag[0].length);
        const end = close === -1 ? sql.length : close + tag[0].length;
        flushCode();
        segments.push({ code: false, text: sql.slice(i, end) });
        i = end;
        continue;
      }
    }
    code += ch;
    i += 1;
  }
  flushCode();
  return segments;
}

/**
 * Translate SQLite-specific DDL syntax to PostgreSQL equivalents.
 *
 * `datetime('now')` becomes an expression that yields the same ISO-8601 UTC
 * text JavaScript writes (ADR 2026-09-04 Decision 5), not `CURRENT_TIMESTAMP`:
 * a `timestamptz` default cast into a `TEXT` column produced
 * `2026-09-18 14:00:00.123456+00`, which neither sorts nor compares against
 * `2026-09-18T14:00:00.123Z`. Kernel queries no longer contain the call at
 * all; this keeps schema defaults (and any straggler) honest.
 *
 * The type and keyword rewrites apply to SQL code only, never inside quoted
 * strings, quoted identifiers or `$$` bodies: a role named
 * `"isabel.real@example.org"` or a literal `'blob'` must survive a `GRANT`
 * or `INSERT` untouched.
 */
export function translateSqlForPostgres(sql: string): string {
  const withIsoNow = sql
    .replace(
      /DEFAULT\s*\(\s*datetime\s*\(\s*'now'\s*\)\s*\)/gi,
      `DEFAULT (${POSTGRES_ISO_NOW_SQL})`,
    )
    .replace(/datetime\s*\(\s*'now'\s*\)/gi, POSTGRES_ISO_NOW_SQL);
  return splitQuotedSegments(withIsoNow)
    .map((segment) =>
      segment.code
        ? segment.text
            .replace(
              /INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi,
              "SERIAL PRIMARY KEY",
            )
            .replace(/\bBLOB\b/gi, "BYTEA")
            .replace(/\bREAL\b/gi, "DOUBLE PRECISION")
        : segment.text,
    )
    .join("");
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
  let parsersInstalled = false;

  async function getPool(): Promise<Pool> {
    let pgModule: typeof import("pg");
    try {
      pgModule = await import("pg");
    } catch (err) {
      throw new Error(
        `Failed to load PostgreSQL driver 'pg'. Please install 'pg' to use PostgreSQL database provider: ${err}`,
      );
    }
    // COUNT(*) and SUM over integers are bigint (OID 20); the kernel compares
    // those as numbers. Installed for injected pools too — the parser is
    // global to the driver, not to the pool that happened to load it.
    if (!parsersInstalled) {
      const pgTypes = pgModule.default?.types ?? pgModule.types;
      if (pgTypes && typeof pgTypes.setTypeParser === "function") {
        pgTypes.setTypeParser(20, (val: string) => {
          const num = Number(val);
          return Number.isSafeInteger(num) ? num : val;
        });
      }
      parsersInstalled = true;
    }
    if (poolInstance) return poolInstance;

    const PoolClass = pgModule.default?.Pool ?? pgModule.Pool;
    const pool = new PoolClass({
      connectionString: options.connectionString,
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      ...(options.ssl === true ? { ssl: { rejectUnauthorized: true } } : {}),
      ...(options.ssl === false ? { ssl: false } : {}),
      ...(options.applicationName
        ? { application_name: options.applicationName }
        : {}),
    });
    // An idle pooled client that the server drops (network change, sleep,
    // Azure's idle timeout) is re-emitted on the pool; without a listener
    // Node treats it as an uncaught exception and a long-lived host such as
    // `zam mcp` or `bridge serve` dies. The next query simply takes a fresh
    // client, so the event is only worth a diagnostic line.
    pool.on("error", (err: Error) => {
      process.stderr.write(
        `zam: PostgreSQL connection dropped while idle: ${err.message}\n`,
      );
    });
    poolInstance = pool;
    return poolInstance;
  }

  let activeTxClient: PoolClient | null = null;
  let txMutex: Promise<void> = Promise.resolve();

  async function getActiveClient(): Promise<Pool | PoolClient> {
    if (activeTxClient) return activeTxClient;
    return getPool();
  }

  const db: Database = {
    dialect: "postgres",
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
