/**
 * RemoteTursoProvider — implements the async `Database` contract directly
 * against a Turso/libsql server over HTTP (Hrana v3).
 *
 * No native bindings and no extra runtime dependencies, so this provider is
 * the cloud path for architectures without a native libsql artifact (for
 * example Windows ARM64). Under ZAM's online-first assumption it is suitable
 * for interactive sessions: the per-review LLM call dominates latency.
 */

import type { Database, RunResult, Statement } from "../types.js";
import {
  encodeValue,
  HranaTransport,
  type HranaRequest,
  type HranaStmtResult,
  type HranaTransportOptions,
  rowsToObjects,
  unwrapResult,
} from "./hrana.js";

const TABLE_INFO_PRAGMA = /^\s*table_info\s*\(\s*['"]?(\w+)['"]?\s*\)\s*$/i;

function toRunResult(result: HranaStmtResult | undefined): RunResult {
  return {
    changes: result?.affected_row_count ?? 0,
    lastInsertRowid:
      result?.last_insert_rowid != null ? Number(result.last_insert_rowid) : 0,
  };
}

/** A pipeline executor; stateless by default, baton-scoped in transactions. */
type RunPipeline = (
  requests: HranaRequest[],
) => Promise<{ results: Array<HranaStmtResult | undefined> }>;

function makeStatement(sql: string, run: RunPipeline): Statement {
  const execute = async (params: unknown[], wantRows: boolean) => {
    const { results } = await run([
      {
        type: "execute",
        stmt: { sql, args: params.map(encodeValue), want_rows: wantRows },
      },
    ]);
    return results[0];
  };

  return {
    async run(...params: unknown[]) {
      return toRunResult(await execute(params, false));
    },
    async get(...params: unknown[]) {
      const result = await execute(params, true);
      return result ? rowsToObjects(result)[0] : undefined;
    },
    async all(...params: unknown[]) {
      const result = await execute(params, true);
      return result ? rowsToObjects(result) : [];
    },
  };
}

function makeDatabase(run: RunPipeline, transport: HranaTransport): Database {
  let txTail: Promise<unknown> = Promise.resolve();

  const db: Database = {
    prepare(sql: string) {
      return makeStatement(sql, run);
    },

    async exec(sql: string) {
      await run([{ type: "sequence", sql }]);
    },

    async pragma(source: string) {
      const tableInfo = TABLE_INFO_PRAGMA.exec(source);
      const sql = tableInfo
        ? `SELECT * FROM pragma_table_info('${tableInfo[1]}')`
        : `PRAGMA ${source}`;
      return db.prepare(sql).all();
    },

    transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
      const next = txTail.then(async () => {
        const stream = openStream(transport);
        try {
          await stream.run([
            { type: "execute", stmt: { sql: "BEGIN IMMEDIATE", want_rows: false } },
          ]);
          const result = await fn(makeDatabase(stream.run, transport));
          await stream.run(
            [{ type: "execute", stmt: { sql: "COMMIT", want_rows: false } }],
            true,
          );
          return result;
        } catch (err) {
          await stream
            .run(
              [{ type: "execute", stmt: { sql: "ROLLBACK", want_rows: false } }],
              true,
            )
            .catch(() => {});
          throw err;
        }
      });
      txTail = next.catch(() => {});
      return next;
    },

    async close() {
      // Stateless transport: nothing to release.
    },
  };

  return db;
}

interface Stream {
  run(requests: HranaRequest[], close?: boolean): ReturnType<RunPipeline>;
}

/** Open a baton-scoped stream that threads server state between pipelines. */
function openStream(transport: HranaTransport): Stream {
  let baton: string | null = null;
  let baseUrl: string | null = null;

  return {
    async run(requests: HranaRequest[], close = false) {
      const sent: HranaRequest[] = close
        ? [...requests, { type: "close" }]
        : requests;
      const response = await transport.pipeline(sent, baton, baseUrl);
      baton = response.baton;
      baseUrl = response.base_url ?? baseUrl;
      return {
        results: requests.map((_, i) => unwrapResult(response, i)),
      };
    },
  };
}

export type RemoteDatabaseOptions = HranaTransportOptions;

/** Open a remote Turso database over HTTP. */
export function openRemoteDatabase(options: RemoteDatabaseOptions): Database {
  const transport = new HranaTransport(options);

  const statelessRun: RunPipeline = async (requests) => {
    const response = await transport.pipeline([
      ...requests,
      { type: "close" },
    ]);
    return { results: requests.map((_, i) => unwrapResult(response, i)) };
  };

  return makeDatabase(statelessRun, transport);
}
