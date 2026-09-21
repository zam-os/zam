import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Runs the *built* MCP bundle. From source (tsx, one module graph) the defect
 * cannot show: only dist/cli/commands/mcp.js carries its own copy of the
 * kernel (no shared chunks, ADR 2026-07-07), which is where the token supplier
 * app.ts registered was missing (2026-09-21). Requires `npm run build`, like
 * the other bridge subprocess suites.
 */
describe("built MCP server on a team library", () => {
  let tempHome: string;
  let client: Client | null = null;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-mcp-dist-"));
    mkdirSync(join(tempHome, ".zam"), { recursive: true });
    mkdirSync(join(tempHome, "empty-bin"), { recursive: true });
    writeFileSync(
      join(tempHome, ".zam", "credentials.json"),
      JSON.stringify({
        postgres: {
          host: "team-library.invalid",
          database: "zam_team",
          username: "learner@example.org",
          auth: "entra-cli",
        },
      }),
    );
  });

  afterEach(async () => {
    await client?.close().catch(() => undefined);
    client = null;
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("reaches the Entra token supplier instead of calling it unregistered", async () => {
    // No `az` on PATH and an unresolvable host: once the supplier is
    // registered the pool builds and the connection dies at DNS, before any
    // token is requested. Unregistered, the pool refuses to build at all.
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined && key.toLowerCase() !== "path") env[key] = value;
    }
    env.HOME = tempHome;
    env.USERPROFILE = tempHome;
    env.ZAM_CONFIG_PATH = join(tempHome, "config.json");
    env.PATH = join(tempHome, "empty-bin");

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [join(process.cwd(), "dist", "cli", "index.js"), "mcp"],
      env,
      stderr: "ignore",
    });
    client = new Client({ name: "dist-probe", version: "0" }, { capabilities: {} });
    await client.connect(transport);

    const result = await client.callTool({ name: "zam_status", arguments: {} });
    const text = (result.content as Array<{ type: string; text?: string }>)
      .map((part) => part.text ?? "")
      .join("\n");

    expect(text).not.toMatch(/no entra-cli token source is registered/);
    expect(text).toMatch(/ENOTFOUND|EAI_AGAIN|getaddrinfo/);
  }, 90_000);
});
