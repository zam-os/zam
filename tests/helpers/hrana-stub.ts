/**
 * In-process Hrana v3 HTTP stub backed by a real better-sqlite3 database.
 *
 * Lets the remote provider's full encode/transport/decode path run against
 * genuine SQLite semantics in tests, without Turso credentials or network
 * access. Implements the protocol subset ZAM uses: execute, sequence, close,
 * and baton-scoped streams.
 */

import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import BetterSqlite3 from "better-sqlite3";

interface HranaValue {
  type: "null" | "integer" | "float" | "text" | "blob";
  value?: string | number;
  base64?: string;
}

interface HranaRequestBody {
  baton: string | null;
  requests: Array<{
    type: "execute" | "sequence" | "close";
    stmt?: { sql: string; args?: HranaValue[]; want_rows?: boolean };
    sql?: string;
  }>;
}

function decodeArg(value: HranaValue): unknown {
  switch (value.type) {
    case "null":
      return null;
    case "integer":
      return Number(value.value);
    case "float":
      return value.value;
    case "text":
      return value.value;
    case "blob":
      return Buffer.from(value.base64 ?? "", "base64");
  }
}

function encodeCell(value: unknown): HranaValue {
  if (value === null || value === undefined) return { type: "null" };
  if (typeof value === "bigint") {
    return { type: "integer", value: value.toString() };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { type: "integer", value: value.toString() }
      : { type: "float", value };
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { type: "blob", base64: Buffer.from(value).toString("base64") };
  }
  return { type: "text", value: String(value) };
}

export interface HranaStub {
  url: string;
  /** Auth tokens accepted; empty set accepts everything. */
  close(): Promise<void>;
}

export async function startHranaStub(options?: {
  /** Require this bearer token and answer 401 otherwise. */
  authToken?: string;
  /** Delay every response (for timeout tests). */
  delayMs?: number;
}): Promise<HranaStub> {
  const db = new BetterSqlite3(":memory:");
  const openBatons = new Set<string>();

  const handle = (body: HranaRequestBody) => {
    const results: unknown[] = [];
    let closed = false;

    for (const request of body.requests) {
      try {
        if (request.type === "execute" && request.stmt) {
          const stmt = db.prepare(request.stmt.sql);
          const args = (request.stmt.args ?? []).map(decodeArg);
          if (stmt.reader) {
            const rows = stmt.raw(true).all(...args) as unknown[][];
            results.push({
              type: "ok",
              response: {
                type: "execute",
                result: {
                  cols: stmt.columns().map((c) => ({ name: c.name })),
                  rows: rows.map((row) => row.map(encodeCell)),
                  affected_row_count: 0,
                  last_insert_rowid: null,
                },
              },
            });
          } else {
            const info = stmt.run(...args);
            results.push({
              type: "ok",
              response: {
                type: "execute",
                result: {
                  cols: [],
                  rows: [],
                  affected_row_count: info.changes,
                  last_insert_rowid: String(info.lastInsertRowid),
                },
              },
            });
          }
        } else if (request.type === "sequence") {
          db.exec(request.sql ?? "");
          results.push({ type: "ok", response: { type: "sequence" } });
        } else {
          closed = true;
          results.push({ type: "ok", response: { type: "close" } });
        }
      } catch (err) {
        results.push({
          type: "error",
          error: { message: (err as Error).message },
        });
      }
    }

    if (body.baton) openBatons.delete(body.baton);
    let baton: string | null = null;
    if (!closed) {
      baton = randomUUID();
      openBatons.add(baton);
    }
    return { baton, base_url: null, results };
  };

  const server: Server = createServer((req, res) => {
    const respond = () => {
      if (
        options?.authToken &&
        req.headers.authorization !== `Bearer ${options.authToken}`
      ) {
        res.writeHead(401).end("unauthorized");
        return;
      }
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk as Buffer));
      req.on("end", () => {
        const body = JSON.parse(
          Buffer.concat(chunks).toString(),
        ) as HranaRequestBody;
        res
          .writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify(handle(body)));
      });
    };
    if (options?.delayMs) {
      setTimeout(respond, options.delayMs);
    } else {
      respond();
    }
  });

  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", resolve),
  );
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Failed to bind hrana stub server");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      db.close();
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}
