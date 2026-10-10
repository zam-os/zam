/**
 * ADR 2026-10-08b D4: the Copilot extension's loopback server answers only
 * requests that carry its per-launch token and its own Host, and takes POSTs
 * only from its host page with a JSON body.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkLoopbackRequest,
  newLoopbackToken,
} from "../../src/copilot-extension/loopback-guard.js";

const server = { token: "tok_abc123", port: 41234 };
const host = "127.0.0.1:41234";
const origin = `http://${host}`;

function check(
  method: string,
  url: string,
  headers: Record<string, string> = {},
) {
  return checkLoopbackRequest({ method, url, headers }, server);
}

describe("Copilot loopback guard", () => {
  it("serves the host page and its API under the token", () => {
    expect(check("GET", "/tok_abc123/", { host })).toEqual({
      ok: true,
      path: "/",
    });
    expect(check("GET", "/tok_abc123/api/bootstrap", { host })).toEqual({
      ok: true,
      path: "/api/bootstrap",
    });
    expect(
      check("POST", "/tok_abc123/api/tool", {
        host,
        origin,
        "content-type": "application/json",
      }),
    ).toEqual({ ok: true, path: "/api/tool" });
  });

  it("refuses a request without the token", () => {
    expect(check("GET", "/", { host })).toEqual({ ok: false, status: 404 });
    expect(
      check("POST", "/api/tool", {
        host,
        origin,
        "content-type": "application/json",
      }),
    ).toEqual({ ok: false, status: 404 });
    expect(check("GET", "/other-token/api/bootstrap", { host })).toEqual({
      ok: false,
      status: 404,
    });
  });

  it("refuses a rebound or foreign Host", () => {
    expect(check("GET", "/tok_abc123/", { host: "evil.test:41234" })).toEqual(
      { ok: false, status: 403 },
    );
    expect(check("GET", "/tok_abc123/", { host: "localhost:41234" })).toEqual(
      { ok: false, status: 403 },
    );
    expect(check("GET", "/tok_abc123/", {})).toEqual({
      ok: false,
      status: 403,
    });
  });

  it("refuses POSTs from the sandboxed iframe, other pages and forms", () => {
    const post = (headers: Record<string, string>) =>
      check("POST", "/tok_abc123/api/tool", { host, ...headers });
    expect(
      post({ origin: "null", "content-type": "application/json" }),
    ).toEqual({ ok: false, status: 403 });
    expect(
      post({ origin: "https://evil.test", "content-type": "application/json" }),
    ).toEqual({ ok: false, status: 403 });
    expect(post({ "content-type": "application/json" })).toEqual({
      ok: false,
      status: 403,
    });
    expect(
      post({ origin, "content-type": "application/x-www-form-urlencoded" }),
    ).toEqual({ ok: false, status: 403 });
    expect(post({ origin, "content-type": "text/plain" })).toEqual({
      ok: false,
      status: 403,
    });
    expect(
      check("PUT", "/tok_abc123/api/tool", {
        host,
        origin,
        "content-type": "application/json",
      }),
    ).toEqual({ ok: false, status: 403 });
  });

  it("makes a new, unguessable token per launch", () => {
    const a = newLoopbackToken();
    const b = newLoopbackToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("is what the extension and its host page use", () => {
    const root = join(__dirname, "..", "..", "src", "copilot-extension");
    const extension = readFileSync(join(root, "extension.mjs"), "utf8");
    expect(extension).toContain("checkLoopbackRequest(request, { token, port })");
    expect(extension).toContain("url: `http://127.0.0.1:${port}/${token}/`");
    expect(extension).toContain('<script type="module" src="host.bundle.js">');
    const hostPage = readFileSync(join(root, "host.ts"), "utf8");
    // Relative paths keep every request under the token.
    expect(hostPage).not.toMatch(/["']\/(api|app)\b/);
  });
});
