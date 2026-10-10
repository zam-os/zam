/**
 * ADR 2026-10-08b D4: ZAM never approves on the learner's behalf. Only a
 * reviewed list of tools may be pre-approved, `readOnlyHint` sits only on
 * tools that change nothing, and `zam agent connect` keeps a copy of every
 * harness file it changes.
 */

import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRE_APPROVED_TOOLS } from "../../src/cli/agent-approval.js";
import { writeHarnessConfig } from "../../src/cli/agent-connect.js";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import { type Database, openDatabase } from "../../src/kernel/index.js";

/** Arguments that name a file, folder or host. */
const PATH_OR_URL_ARGUMENT =
  /^(bundle_dir|file|files|target|repo_root|path|dir|url|sourceLink)$/;

/**
 * Tools that carry `readOnlyHint`, reviewed: none of them writes. The OKF
 * reads take a bundle directory, which D1 confines to trusted folders.
 */
const READ_ONLY_TOOLS = [
  "zam_bonus_candidates_list",
  "zam_bundled_cells_list",
  "zam_find_tokens",
  "zam_get_reviews",
  "zam_list_drafts",
  "zam_material_import_context",
  "zam_monitor",
  "zam_okf_audit",
  "zam_okf_catalog",
  "zam_okf_focused",
  "zam_okf_read",
  "zam_okf_read_citation",
  "zam_okf_visualize",
  "zam_open_recall",
  "zam_open_studio",
  "zam_preconditions_get",
  "zam_progress_stats",
  "zam_pull_forward_candidates",
  "zam_show_graph",
  "zam_status",
  "zam_suggest_foundations",
];

describe("pre-approval and read-only hints (ADR 2026-10-08b D4)", () => {
  let tempDir: string;
  let db: Database;
  let server: ReturnType<typeof createMcpServer>;
  let client: Client;
  const saved: Record<string, string | undefined> = {};

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-approval-"));
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

  it("pre-approves exactly the owner's reviewed list", () => {
    expect([...PRE_APPROVED_TOOLS].sort()).toEqual([
      "zam_find_tokens",
      "zam_get_reviews",
      "zam_progress_stats",
      "zam_status",
    ]);
  });

  it("pre-approves only read-only tools without a path or URL argument", async () => {
    const { tools } = await client.listTools();
    for (const name of PRE_APPROVED_TOOLS) {
      const tool = tools.find((t) => t.name === name);
      expect(tool, name).toBeDefined();
      expect(tool?.annotations?.readOnlyHint, name).toBe(true);
      const args = Object.keys(
        (tool?.inputSchema as { properties?: object }).properties ?? {},
      );
      expect(args.filter((arg) => PATH_OR_URL_ARGUMENT.test(arg)), name).toEqual(
        [],
      );
    }
  });

  it("keeps readOnlyHint on the reviewed tools only", async () => {
    const { tools } = await client.listTools();
    const readOnly = tools
      .filter((tool) => tool.annotations?.readOnlyHint === true)
      .map((tool) => tool.name)
      .sort();
    expect(readOnly).toEqual(READ_ONLY_TOOLS);
  });

  it("keeps a copy of a harness file before connect changes it", () => {
    const path = join(tempDir, "harness", "config.toml");
    writeHarnessConfig(path, "first\n");
    expect(readdirSync(join(tempDir, "harness"))).toEqual(["config.toml"]);

    writeFileSync(path, "learner's own line\n");
    writeHarnessConfig(path, "second\n", new Date("2026-10-10T12:00:00.000Z"));

    expect(readFileSync(path, "utf8")).toBe("second\n");
    expect(
      readFileSync(
        `${path}.zam-backup-2026-10-10T12-00-00-000Z`,
        "utf8",
      ),
    ).toBe("learner's own line\n");
  });
});
