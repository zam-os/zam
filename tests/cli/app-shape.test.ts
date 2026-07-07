import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards ADR 2026-07-07 Decision 1: the MCP transport (and with it
// @modelcontextprotocol/sdk and zod) must never enter the eager module graph,
// and the bootstrap must stay dependency-free so it always loads.
describe("CLI module-graph shape", () => {
  const read = (...p: string[]) =>
    readFileSync(join(process.cwd(), ...p), "utf-8");

  it("app.ts imports the MCP command only lazily", () => {
    const app = read("src", "cli", "app.ts");
    expect(app).not.toMatch(/^import .*commands\/mcp\.js/m);
    expect(app).toContain('import("./commands/mcp.js")');
  });

  it("the bootstrap imports only Node builtins, ./app.js, and bootstrap logic", () => {
    const bootstrap = read("src", "cli", "index.ts");
    const specifiers = [
      ...bootstrap.matchAll(/from "([^"]+)"|import\("([^"]+)"\)/g),
    ]
      .map((m) => m[1] ?? m[2])
      .filter((s): s is string => Boolean(s));
    expect(specifiers.length).toBeGreaterThan(0);
    for (const s of specifiers) {
      expect(
        s.startsWith("node:") || s === "./app.js" || s.startsWith("./bootstrap/"),
        `unexpected bootstrap import: ${s}`,
      ).toBe(true);
    }
  });
});
