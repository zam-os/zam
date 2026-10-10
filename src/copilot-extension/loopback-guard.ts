import { randomBytes } from "node:crypto";

/**
 * The checks in front of the Copilot extension's loopback server (ADR
 * 2026-10-08b D4). Any web page in the learner's browser and any local
 * process can reach a loopback port, and the server calls ZAM tools. So:
 *
 * - every path sits under a per-launch random token, which only the
 *   extension knows;
 * - `Host` must be `127.0.0.1:<port>`, which defeats DNS rebinding;
 * - a POST must come from the top-level host page (`Origin` equal to the
 *   server's own origin) and carry JSON. The app iframe is sandboxed with an
 *   opaque origin, so its `Origin: null` is refused, as is a foreign origin
 *   or a form post.
 */
export interface LoopbackRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

export type LoopbackDecision =
  | { ok: true; path: string }
  | { ok: false; status: 403 | 404 };

/** A fresh token for one launch of the server. */
export function newLoopbackToken(): string {
  return randomBytes(24).toString("base64url");
}

function header(request: LoopbackRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export function checkLoopbackRequest(
  request: LoopbackRequest,
  server: { token: string; port: number },
): LoopbackDecision {
  const origin = `127.0.0.1:${server.port}`;
  if (header(request, "host") !== origin) return { ok: false, status: 403 };

  const pathname = new URL(request.url || "/", `http://${origin}`).pathname;
  const prefix = `/${server.token}/`;
  if (!pathname.startsWith(prefix)) return { ok: false, status: 404 };
  const path = `/${pathname.slice(prefix.length)}`;

  if (request.method !== "GET") {
    if (request.method !== "POST") return { ok: false, status: 403 };
    if (header(request, "origin") !== `http://${origin}`) {
      return { ok: false, status: 403 };
    }
    const type = header(request, "content-type") ?? "";
    if (!/^application\/json\s*(;|$)/i.test(type)) {
      return { ok: false, status: 403 };
    }
  }
  return { ok: true, path };
}
