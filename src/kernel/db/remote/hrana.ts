/**
 * Minimal Hrana v3 over HTTP transport for Turso/libsql servers.
 *
 * Implements exactly the subset ZAM needs — execute, sequence, close, and
 * baton-scoped streams for transactions — over plain `fetch`, so it runs on
 * every architecture Node.js supports (including Windows ARM64, which has no
 * native libsql binding).
 *
 * Protocol reference: https://github.com/tursodatabase/libsql/blob/main/docs/HRANA_3_SPEC.md
 */

export interface HranaTransportOptions {
  /** Database URL (libsql://, https:// or http://). */
  url: string;
  /** Turso auth token; omitted for unauthenticated local servers. */
  authToken?: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
  /**
   * Total attempts for requests that failed at the transport level before a
   * response was received. Stateful stream requests (open batons) are never
   * retried.
   */
  maxAttempts?: number;
}

export type HranaValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "float"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

export interface HranaStmt {
  sql: string;
  args?: HranaValue[];
  want_rows: boolean;
}

export type HranaRequest =
  | { type: "execute"; stmt: HranaStmt }
  | { type: "sequence"; sql: string }
  | { type: "close" };

export interface HranaStmtResult {
  cols: Array<{ name: string | null }>;
  rows: HranaValue[][];
  affected_row_count: number;
  last_insert_rowid: string | null;
}

interface HranaPipelineResponse {
  baton: string | null;
  base_url: string | null;
  results: Array<
    | { type: "ok"; response: { type: string; result?: HranaStmtResult } }
    | { type: "error"; error: { message: string; code?: string | null } }
  >;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_ATTEMPTS = 2;

/** Convert libsql:// and ws(s):// URLs to their HTTP equivalents. */
export function toHttpUrl(url: string): string {
  return url
    .replace(/^libsql:\/\//i, "https://")
    .replace(/^wss:\/\//i, "https://")
    .replace(/^ws:\/\//i, "http://")
    .replace(/\/+$/, "");
}

export function encodeValue(param: unknown): HranaValue {
  if (param === null) return { type: "null" };
  if (typeof param === "string") return { type: "text", value: param };
  if (typeof param === "bigint") {
    return { type: "integer", value: param.toString() };
  }
  if (typeof param === "number") {
    if (Number.isSafeInteger(param)) {
      return { type: "integer", value: param.toString() };
    }
    return { type: "float", value: param };
  }
  if (param instanceof Uint8Array) {
    return { type: "blob", base64: Buffer.from(param).toString("base64") };
  }
  throw new TypeError(
    `Cannot bind a value of type ${typeof param} to a SQL parameter`,
  );
}

export function decodeValue(value: HranaValue): unknown {
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
      return new Uint8Array(Buffer.from(value.base64, "base64"));
  }
}

export function rowsToObjects(
  result: HranaStmtResult,
): Record<string, unknown>[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((value, i) => {
      obj[result.cols[i]?.name ?? `col${i}`] = decodeValue(value);
    });
    return obj;
  });
}

/**
 * Only failures that provably happened before the server could have seen the
 * request are retried; anything else (timeouts, resets mid-response) might
 * have executed the statement already, and retrying could duplicate a write.
 */
function isRetryableTransportError(err: unknown): boolean {
  if (!(err instanceof Error) || err.name === "HranaResponseError") {
    return false;
  }
  const code = (err.cause as { code?: string } | undefined)?.code;
  return (
    code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN"
  );
}

class HranaResponseError extends Error {
  override name = "HranaResponseError";
}

/**
 * A Hrana stream. Stateless requests use a fresh stream per call (the
 * pipeline ends with `close`); transactions keep the stream open via the
 * baton returned by the server.
 */
export class HranaTransport {
  private readonly pipelineUrl: string;
  private readonly authToken?: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;

  constructor(options: HranaTransportOptions) {
    this.pipelineUrl = `${toHttpUrl(options.url)}/v3/pipeline`;
    this.authToken = options.authToken;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  }

  /**
   * POST one pipeline of requests. Returns the server results plus the baton
   * for continuing an open stream. Retries transport-level failures only for
   * stateless pipelines (no baton involved on either side).
   */
  async pipeline(
    requests: HranaRequest[],
    baton?: string | null,
    baseUrl?: string | null,
  ): Promise<HranaPipelineResponse> {
    const url = baseUrl
      ? `${toHttpUrl(baseUrl)}/v3/pipeline`
      : this.pipelineUrl;
    const keepsState =
      baton != null || !requests.some((r) => r.type === "close");
    const attempts = keepsState ? 1 : this.maxAttempts;

    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.post(url, { baton: baton ?? null, requests });
      } catch (err) {
        lastError = err;
        if (!isRetryableTransportError(err) || attempt === attempts) {
          throw this.offline(err);
        }
      }
    }
    throw this.offline(lastError);
  }

  private async post(
    url: string,
    body: unknown,
  ): Promise<HranaPipelineResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.authToken
            ? { authorization: `Bearer ${this.authToken}` }
            : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401 || response.status === 403) {
      throw new HranaResponseError(
        `Turso rejected the configured credentials (HTTP ${response.status}). ` +
          "Refresh the token with: zam connector setup turso",
      );
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new HranaResponseError(
        `Turso request failed with HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      );
    }
    return (await response.json()) as HranaPipelineResponse;
  }

  private offline(err: unknown): Error {
    if (err instanceof HranaResponseError) return err;
    const cause =
      err instanceof Error
        ? ((err.cause as Error | undefined)?.message ?? err.message)
        : String(err);
    return new HranaResponseError(
      `Cannot reach the Turso database at ${this.pipelineUrl}: ${cause}. ` +
        "Check your network connection, or switch to the local provider " +
        "(ZAM_DB_PROVIDER=local).",
    );
  }
}

/** Unwrap a single pipeline result entry, throwing on stream-level errors. */
export function unwrapResult(
  response: HranaPipelineResponse,
  index: number,
): HranaStmtResult | undefined {
  const entry = response.results[index];
  if (!entry) {
    throw new HranaResponseError(`Turso response is missing result #${index}`);
  }
  if (entry.type === "error") {
    throw new Error(entry.error.message);
  }
  return entry.response.result;
}
