/**
 * ADR 2026-10-08b D3: app-only is a hint, not a boundary. Every command the
 * Studio panel may run through `zam_studio_bridge` is reviewed as if a model
 * calls it, and the list changes only together with this test.
 */

import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import {
  createMcpServer,
  refusedStudioBridgeOption,
  STUDIO_BRIDGE_ALLOWED_COMMANDS,
  STUDIO_BRIDGE_COMMANDS,
} from "../../src/cli/commands/mcp.js";
import { type Database, openDatabase } from "../../src/kernel/index.js";

/**
 * The reviewed list. Adding a command to the Studio bridge means adding it
 * here as well, after checking it against the trust model: no file or host
 * the caller names, no stored secret, no security switch.
 */
const REVIEWED = [
  "agent-list",
  "backup-create",
  "bonus-atom-enrol",
  "bonus-candidates-list",
  "bundled-cell-enrol",
  "bundled-cells-list",
  "database-status",
  "get-active-knowledge-context",
  "get-neighborhood",
  "get-settings",
  "library-topic-start",
  "library-topics-list",
  "list-drafts",
  "list-knowledge-contexts",
  "list-tokens",
  "model-list",
  "model-remove",
  "model-reprobe",
  "model-upsert",
  "personal-card-create",
  "personal-card-create-assignment",
  "personal-card-delete",
  "personal-card-list",
  "personal-card-list-assignments",
  "personal-card-publish-revision",
  "personal-card-remove",
  "personal-card-revision-preview",
  "personal-card-update",
  "personal-card-withdraw-assignment",
  "precondition-assess",
  "preconditions-get",
  "pull-forward-candidates",
  "pull-forward-execute",
  "set-active-knowledge-context",
  "setting-set",
  "study-learning-get",
  "study-learning-set",
  "update-check",
  "workspace-list",
  "workspace-repair-links",
];

describe("Studio bridge review (ADR 2026-10-08b D3)", () => {
  it("changes only together with the reviewed list", () => {
    expect([...STUDIO_BRIDGE_ALLOWED_COMMANDS].sort()).toEqual(REVIEWED);
  });

  it("records why each command is safe for a model to call", () => {
    for (const [command, review] of Object.entries(STUDIO_BRIDGE_COMMANDS)) {
      expect(review.why.trim().length, command).toBeGreaterThan(10);
    }
  });

  it("keeps security switches off the bridge", () => {
    for (const command of STUDIO_BRIDGE_ALLOWED_COMMANDS) {
      expect(command).not.toMatch(
        /(^|-)(trust|secret|credential|bitwarden|vault|pair|pairing|policy|observation|observer|capture|monitor)(-|$)/,
      );
    }
  });

  it("refuses a caller-named backup folder in both option forms", () => {
    expect(refusedStudioBridgeOption("backup-create", ["--dir", "/tmp/x"])).toBe(
      "--dir",
    );
    expect(refusedStudioBridgeOption("backup-create", ["--dir=/tmp/x"])).toBe(
      "--dir=/tmp/x",
    );
    expect(refusedStudioBridgeOption("backup-create", [])).toBeUndefined();
    expect(
      refusedStudioBridgeOption("list-tokens", ["--dir", "/tmp/x"]),
    ).toBeUndefined();
  });

  it("does not let setting-set write a security switch", async () => {
    for (const key of [
      "observation.screen",
      "observer.scope",
      "llm.api_key",
      "secrets.backend",
      "mobile.pairing",
    ]) {
      await expect(
        executeBridgeCommandJson("setting-set", [
          "--key",
          key,
          "--value",
          "true",
        ]),
        key,
      ).rejects.toThrow(/not writable via setting-set/);
    }
  });
});

describe("zam_studio_bridge refuses reviewed options", () => {
  let tempDir: string;
  let db: Database;
  let server: ReturnType<typeof createMcpServer>;
  let client: Client;
  const saved: Record<string, string | undefined> = {};

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-studio-review-"));
    saved.ZAM_CONFIG_PATH = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "config.json");
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client?.close();
    await server?.close();
    await db?.close();
    if (saved.ZAM_CONFIG_PATH === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = saved.ZAM_CONFIG_PATH;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes no backup into a folder the caller names", async () => {
    const target = join(tempDir, "elsewhere");
    const response = (await client.callTool({
      name: "zam_studio_bridge",
      arguments: { cmd: "backup-create", args: ["--dir", target] },
    })) as { isError?: boolean; content: Array<{ text: string }> };

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toMatch(
      /Option not allowed for the Studio panel: backup-create --dir/,
    );
    expect(existsSync(target) ? readdirSync(target) : []).toEqual([]);
  });
});
