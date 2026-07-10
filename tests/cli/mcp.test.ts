import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import {
  createToken,
  ensureCard,
  getCard,
  getPrerequisites,
  getTokenBySlug,
  openDatabase,
} from "../../src/kernel/index.js";

describe("MCP stdio server tests", () => {
  const tsxImport = import.meta.resolve("tsx");
  let tempDir: string;
  let dbPath: string;
  let db: any;
  let server: any;
  let client: Client;
  let serverTransport: InMemoryTransport;
  let clientTransport: InMemoryTransport;
  let previousConfigPath: string | undefined;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mcp-test-"));
    dbPath = join(tempDir, "test.db");
    // Isolate from the developer's machine config (~/.zam/config.json) so an
    // active workspace knowledge context on the host cannot leak into tests.
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "machine-config.json");
    db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    // Set default user
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'thomas')",
      )
      .run();

    server = createMcpServer(db);

    const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
    clientTransport = cTrans;
    serverTransport = sTrans;

    client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    // Connect transports
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    if (client) {
      await client.close();
    }
    if (server) {
      await server.close();
    }
    if (db) {
      await db.close();
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all 16 tools with correct annotations", async () => {
    const response = await client.listTools();
    expect(response.tools).toHaveLength(16);

    const toolNames = response.tools.map((t) => t.name).sort();
    const expectedNames = [
      "zam_status",
      "zam_session_start",
      "zam_session_end",
      "zam_get_reviews",
      "zam_submit_review",
      "zam_review_action",
      "zam_add_token",
      "zam_find_tokens",
      "zam_suggest_foundations",
      "zam_link_prereq",
      "zam_monitor",
      "zam_open_studio",
      "zam_open_recall",
      "zam_show_graph",
      "zam_open_settings",
      "zam_studio_bridge",
    ].sort();
    expect(toolNames).toEqual(expectedNames);

    // Check specific annotations
    const statusTool = response.tools.find((t) => t.name === "zam_status")!;
    expect((statusTool as any).annotations).toEqual({
      openWorldHint: false,
      readOnlyHint: true,
    });

    const submitTool = response.tools.find(
      (t) => t.name === "zam_submit_review",
    )!;
    expect((submitTool as any).annotations).toEqual({
      openWorldHint: false,
      destructiveHint: false,
      idempotentHint: false,
    });

    const actionTool = response.tools.find(
      (t) => t.name === "zam_review_action",
    )!;
    expect((actionTool as any).annotations).toEqual({
      openWorldHint: false,
      destructiveHint: true,
    });

    const reviewsTool = response.tools.find(
      (t) => t.name === "zam_get_reviews",
    )!;
    expect((reviewsTool as any).annotations).toEqual({
      openWorldHint: true,
      readOnlyHint: true,
    });

    const addTokenTool = response.tools.find(
      (t) => t.name === "zam_add_token",
    )!;
    expect((addTokenTool as any).annotations).toEqual({
      openWorldHint: true,
      destructiveHint: false,
    });

    const studioBridgeTool = response.tools.find(
      (t) => t.name === "zam_studio_bridge",
    )!;
    expect((studioBridgeTool as any).annotations).toEqual({
      openWorldHint: false,
      destructiveHint: true,
    });
  });

  it("can query zam_status and submit review", async () => {
    const token = await createToken(db, {
      slug: "mcp-token-1",
      concept: "Concept 1",
      domain: "science",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");

    // Force due
    await db
      .prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'")
      .run();

    // Call zam_status
    const statusRes = await client.callTool({
      name: "zam_status",
      arguments: {
        user: "thomas",
      },
    });

    expect(statusRes.isError).toBeUndefined();
    const statusData = JSON.parse(statusRes.content[0].text);
    expect(statusData.dueCount).toBe(1);
    expect(statusData.userId).toBe("thomas");
    expect(statusData.stats.cardsInDeck).toBe(1);
    expect(statusData.database.kind).toBeDefined();

    // Call zam_submit_review
    const reviewRes = await client.callTool({
      name: "zam_submit_review",
      arguments: {
        user: "thomas",
        cardId: card.id,
        rating: 3,
      },
    });

    expect(reviewRes.isError).toBeUndefined();
    const reviewData = JSON.parse(reviewRes.content[0].text);
    expect(reviewData.success).toBe(true);
    expect(reviewData.rating).toBe(3);

    // Verify card was reviewed and scheduled
    const updatedCard = await getCard(db, token.id, "thomas");
    expect(updatedCard!.reps).toBe(1);
  });

  it("creates prerequisite edges through zam_add_token", async () => {
    const foundation = await createToken(db, {
      slug: "mcp-foundation",
      concept: "Foundation",
      domain: "science",
      bloom_level: 1,
    });

    const response = await client.callTool({
      name: "zam_add_token",
      arguments: {
        user: "thomas",
        slug: "mcp-advanced",
        concept: "Advanced",
        prerequisites: ["mcp-foundation"],
      },
    });

    expect(response.isError).toBeUndefined();
    const advanced = await getTokenBySlug(db, "mcp-advanced");
    expect(advanced).toBeDefined();
    const prerequisites = await getPrerequisites(db, advanced!.id);
    expect(prerequisites.map((edge) => edge.requires_id)).toEqual([
      foundation.id,
    ]);
  });

  it("returns a final summary and synthesis preview from zam_session_end", async () => {
    const startResponse = await client.callTool({
      name: "zam_session_start",
      arguments: { user: "thomas", task: "MCP practice" },
    });
    const started = JSON.parse(startResponse.content[0].text);

    const endResponse = await client.callTool({
      name: "zam_session_end",
      arguments: { session: started.id, synthesize: true },
    });

    expect(endResponse.isError).toBeUndefined();
    const ended = JSON.parse(endResponse.content[0].text);
    expect(ended.summary.session.id).toBe(started.id);
    expect(ended.synthesis.sessionId).toBe(started.id);
  });

  it("zam_review_action delete-token without confirm returns confirmation preview", async () => {
    const token = await createToken(db, {
      slug: "mcp-delete-token",
      concept: "Delete Me",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");

    const res = await client.callTool({
      name: "zam_review_action",
      arguments: {
        user: "thomas",
        cardId: card.id,
        action: "delete-token",
      },
    });

    expect(res.isError).toBeUndefined();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.preview).toBe(true);
    expect(data.requiresConfirmation).toBe(true);
    expect(data.impact).toBeDefined();
    expect(await getTokenBySlug(db, "mcp-delete-token")).toBeDefined();
  });

  it("exposes the studio panel as an MCP Apps resource", async () => {
    const resources = await client.listResources();
    const studio = resources.resources.find((r) => r.uri === "ui://zam/studio");
    expect(studio).toBeDefined();

    const read = await client.readResource({ uri: "ui://zam/studio" });
    const content = read.contents[0] as { text: string; mimeType: string };
    expect(content.mimeType).toContain("text/html");
    expect(content.text).toContain("zam-studio-panel");
    // The bundled studio panel roots at <div id="zam-studio-panel">. The
    // no-build placeholder in loadPanelHtml (src/cli/commands/mcp.ts) roots
    // at id="zam-panel-placeholder" with a data-panel="<fileName>" attribute
    // instead, so the assertion above already rules out the placeholder on
    // its own. "content-studio" is a class name from the actual Learning
    // Content Studio markup (desktop/src/panel/studio-panel.html) that the
    // placeholder never contains either — kept as a second, independent
    // guard that this is the real editor build, not just a stray root div.
    // Both assertions only pass once dist/ui/studio-panel.html was actually
    // built, which CI guarantees via the build step that runs before tests
    // (.github/workflows/ci.yml).
    expect(content.text).toContain("content-studio");
  });

  it("links zam_open_studio to the studio panel resource", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "zam_open_studio");
    expect(tool).toBeDefined();
    const meta = tool?._meta as { ui?: { resourceUri?: string } } | undefined;
    expect(meta?.ui?.resourceUri).toBe("ui://zam/studio");

    const res = await client.callTool({
      name: "zam_open_studio",
      arguments: {},
    });
    expect(res.isError).toBeUndefined();
  });

  it("exposes the recall panel as an MCP Apps resource", async () => {
    const resources = await client.listResources();
    const recall = resources.resources.find((r) => r.uri === "ui://zam/recall");
    expect(recall).toBeDefined();

    const read = await client.readResource({ uri: "ui://zam/recall" });
    const content = read.contents[0] as { text: string; mimeType: string };
    expect(content.mimeType).toContain("text/html");
    // The bundled recall panel roots at <div id="zam-recall-panel">. The
    // no-build placeholder in loadPanelHtml uses a data-panel attribute
    // instead of this id, so this assertion only passes against a real
    // dist/ui/recall-panel.html build (CI builds before running tests).
    expect(content.text).toContain("zam-recall-panel");
  });

  it("links zam_open_recall to the recall panel resource", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "zam_open_recall");
    expect(tool).toBeDefined();
    const meta = tool?._meta as { ui?: { resourceUri?: string } } | undefined;
    expect(meta?.ui?.resourceUri).toBe("ui://zam/recall");
    expect((tool as any).annotations).toEqual({
      openWorldHint: false,
      readOnlyHint: true,
    });

    const res = await client.callTool({
      name: "zam_open_recall",
      arguments: {},
    });
    expect(res.isError).toBeUndefined();
    const structured = (res as any).structuredContent as {
      recall?: string;
      version?: string;
      user?: string | null;
    };
    expect(structured.recall).toBe("zam");
    expect(typeof structured.version).toBe("string");
    // Default user seeded in beforeEach via user_config.
    expect(structured.user).toBe("thomas");
  });

  it("exposes the graph panel as an MCP Apps resource", async () => {
    const resources = await client.listResources();
    const graph = resources.resources.find((r) => r.uri === "ui://zam/graph");
    expect(graph).toBeDefined();

    const read = await client.readResource({ uri: "ui://zam/graph" });
    const content = read.contents[0] as { text: string; mimeType: string };
    expect(content.mimeType).toContain("text/html");
    // The bundled graph panel roots at <div id="zam-graph-panel">. The
    // no-build placeholder in loadPanelHtml uses a data-panel attribute
    // instead of this id, so this assertion only passes against a real
    // dist/ui/graph-panel.html build (CI builds before running tests).
    expect(content.text).toContain("zam-graph-panel");
  });

  it("links zam_show_graph to the graph panel resource", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "zam_show_graph");
    expect(tool).toBeDefined();
    const meta = tool?._meta as { ui?: { resourceUri?: string } } | undefined;
    expect(meta?.ui?.resourceUri).toBe("ui://zam/graph");
    expect((tool as any).annotations).toEqual({
      openWorldHint: false,
      readOnlyHint: true,
    });

    // inputSchema accepts optional focus/user — neither is required.
    const schema = tool?.inputSchema as
      | { properties?: Record<string, unknown>; required?: string[] }
      | undefined;
    expect(schema?.properties).toHaveProperty("focus");
    expect(schema?.properties).toHaveProperty("user");
    expect(schema?.required ?? []).not.toContain("focus");
    expect(schema?.required ?? []).not.toContain("user");

    const res = await client.callTool({
      name: "zam_show_graph",
      arguments: {},
    });
    expect(res.isError).toBeUndefined();
    const structured = (res as any).structuredContent as {
      graph?: string;
      focus?: string | null;
      version?: string;
      user?: string | null;
    };
    expect(structured.graph).toBe("zam");
    expect(structured.focus).toBeNull();
    expect(typeof structured.version).toBe("string");
    // Default user seeded in beforeEach via user_config.
    expect(structured.user).toBe("thomas");

    const focusedRes = await client.callTool({
      name: "zam_show_graph",
      arguments: { focus: "some-slug" },
    });
    expect(focusedRes.isError).toBeUndefined();
    const focusedStructured = (focusedRes as any).structuredContent as {
      focus?: string | null;
    };
    expect(focusedStructured.focus).toBe("some-slug");
  });

  it("exposes the settings panel as an MCP Apps resource", async () => {
    const resources = await client.listResources();
    const settings = resources.resources.find(
      (r) => r.uri === "ui://zam/settings",
    );
    expect(settings).toBeDefined();

    const read = await client.readResource({ uri: "ui://zam/settings" });
    const content = read.contents[0] as { text: string; mimeType: string };
    expect(content.mimeType).toContain("text/html");
    // The bundled settings panel roots at <div id="zam-settings-panel">. The
    // no-build placeholder in loadPanelHtml uses a data-panel attribute
    // instead of this id, so this assertion only passes against a real
    // dist/ui/settings-panel.html build (CI builds before running tests).
    expect(content.text).toContain("zam-settings-panel");
  });

  it("links zam_open_settings to the settings panel resource", async () => {
    const response = await client.listTools();
    const tool = response.tools.find((t) => t.name === "zam_open_settings");
    expect(tool).toBeDefined();
    const meta = tool?._meta as { ui?: { resourceUri?: string } } | undefined;
    expect(meta?.ui?.resourceUri).toBe("ui://zam/settings");
    // Unlike recall/graph, the Settings card can mutate (repair links, switch
    // knowledge context, write a backup) — no readOnlyHint.
    expect((tool as any).annotations).toEqual({
      openWorldHint: false,
    });

    const res = await client.callTool({
      name: "zam_open_settings",
      arguments: {},
    });
    expect(res.isError).toBeUndefined();
    const structured = (res as any).structuredContent as {
      settings?: string;
      version?: string;
      user?: string | null;
    };
    expect(structured.settings).toBe("zam");
    expect(typeof structured.version).toBe("string");
    // Default user seeded in beforeEach via user_config.
    expect(structured.user).toBe("thomas");
  });

  it("returns error result with isError: true on handler error", async () => {
    // Call zam_session_end with non-existent session
    const res = await client.callTool({
      name: "zam_session_end",
      arguments: {
        session: "non-existent-session-ulid",
      },
    });

    expect(res.isError).toBe(true);
    const data = JSON.parse(res.content[0].text);
    expect(data.error).toContain("Session not found");
  });

  it("smoke test: process running command mcp only outputs JSON-RPC frames on stdout", async () => {
    const cliPath = join(process.cwd(), "src", "cli", "index.ts");

    const child = spawn(
      process.execPath,
      ["--import", tsxImport, cliPath, "mcp"],
      {
        env: { ...process.env, HOME: tempDir, USERPROFILE: tempDir },
      },
    );

    let stdoutData = "";
    let stderrData = "";
    child.stdout.on("data", (chunk) => {
      stdoutData += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderrData += chunk;
    });

    const initMsg = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-smoke",
          version: "1.0.0",
        },
      },
    };

    child.stdin.write(JSON.stringify(initMsg) + "\n");

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(new Error("Timed out waiting for MCP initialize response")),
        5_000,
      );
      child.stdout.once("data", () => {
        clearTimeout(timeout);
        resolve();
      });
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    child.kill("SIGTERM");

    if (!stdoutData.includes("jsonrpc")) {
      console.error("Child stderr was:", stderrData);
      console.error("Child stdout was:", stdoutData);
    }

    expect(stdoutData).toContain("jsonrpc");
    // Assert it is valid JSON
    const parsed = JSON.parse(stdoutData.trim());
    expect(parsed.id).toBe(1);
    expect(parsed.result).toBeDefined();
    expect(parsed.result.protocolVersion).toBeDefined();
  });

  describe("zam_studio_bridge", () => {
    it("lists zam_studio_bridge as an app-only, destructive tool", async () => {
      const response = await client.listTools();
      const tool = response.tools.find((t) => t.name === "zam_studio_bridge");
      expect(tool).toBeDefined();
      expect((tool as any).annotations).toEqual({
        openWorldHint: false,
        destructiveHint: true,
      });

      // Marked app-only (not exposed to the chat model) — the Studio panel,
      // not the model, is the intended caller. See the ext-apps `visibility`
      // option on McpUiToolMeta.
      const meta = tool?._meta as
        | { ui?: { visibility?: string[] } }
        | undefined;
      expect(meta?.ui?.visibility).toEqual(["app"]);
    });

    it("rejects commands outside the allowlist, naming the command", async () => {
      const rejected = [
        "provider-status",
        "start-session",
        "observe-ui-watch",
        "serve",
        "backup-db",
        "no-such-cmd",
      ];
      for (const cmd of rejected) {
        const res = await client.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd, args: [] },
        });
        expect(res.isError).toBe(true);
        const data = JSON.parse(res.content[0].text);
        expect(data.error).toContain(cmd);
        expect(data.error).toContain("not allowed for the Studio panel");
      }
    });

    // The tests below actually execute an allowed command through
    // executeBridgeCommandJson, which — like `bridge serve` today — opens
    // its own database via the default openDatabase() resolution. That
    // resolution reads ~/.zam/zam.db and ~/.zam/credentials.json through
    // module-level constants in src/kernel/db/connection.ts and
    // src/kernel/credentials.ts, computed from os.homedir() the first time
    // those modules load in this process — which already happened via this
    // file's top-level imports, using the real developer home directory.
    // Overriding process.env.HOME/USERPROFILE later, in-process, cannot
    // change that. So — exactly like tests/integration/bridge-serve-mode.test.ts
    // does for `bridge serve`, and like this file's own smoke test above —
    // these tests spawn `zam mcp` as a real child process with HOME/USERPROFILE
    // pointed at a scratch directory, giving it a fresh module graph that
    // resolves those paths safely instead of touching real ZAM data.
    describe("allowed command execution (isolated subprocess)", () => {
      let studioHomeDir: string;
      let studioClient: Client;

      beforeEach(async () => {
        studioHomeDir = mkdtempSync(join(tmpdir(), "zam-studio-bridge-home-"));
        const cliPath = join(process.cwd(), "src", "cli", "index.ts");
        const transport = new StdioClientTransport({
          command: process.execPath,
          args: ["--import", tsxImport, cliPath, "mcp"],
          env: {
            ...process.env,
            HOME: studioHomeDir,
            USERPROFILE: studioHomeDir,
          },
        });
        studioClient = new Client(
          { name: "studio-bridge-test-client", version: "1.0.0" },
          { capabilities: {} },
        );
        await studioClient.connect(transport);
      });

      afterEach(async () => {
        await studioClient.close();
        rmSync(studioHomeDir, { recursive: true, force: true });
      });

      it("runs database-status end-to-end and returns parsed JSON", async () => {
        // Omits `args` entirely to exercise the schema's default: [].
        const res = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "database-status" },
        });
        expect(res.isError).toBeUndefined();
        const data = JSON.parse(res.content[0].text);
        expect(data.success).toBe(true);
        expect(data.connected).toBe(true);
      }, 15_000);

      it("runs list-knowledge-contexts end-to-end and returns parsed JSON", async () => {
        const res = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "list-knowledge-contexts", args: [] },
        });
        expect(res.isError).toBeUndefined();
        const data = JSON.parse(res.content[0].text);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.contexts)).toBe(true);
      }, 15_000);

      it("serializes concurrent calls without corrupting either response", async () => {
        const [resA, resB] = await Promise.all([
          studioClient.callTool({
            name: "zam_studio_bridge",
            arguments: { cmd: "database-status", args: [] },
          }),
          studioClient.callTool({
            name: "zam_studio_bridge",
            arguments: { cmd: "list-knowledge-contexts", args: [] },
          }),
        ]);
        expect(resA.isError).toBeUndefined();
        expect(resB.isError).toBeUndefined();
        const dataA = JSON.parse(resA.content[0].text);
        const dataB = JSON.parse(resB.content[0].text);
        expect(dataA.success).toBe(true);
        expect(dataA.connected).toBe(true);
        expect(dataB.success).toBe(true);
        expect(Array.isArray(dataB.contexts)).toBe(true);
      }, 15_000);

      it("returns a JSON error instead of crashing when an allowed command gets bad args", async () => {
        // get-neighborhood requires --focus. Commander must reject this by
        // throwing (exitOverride), never by calling process.exit and taking
        // the whole zam mcp server down under the Studio panel.
        const badRes = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "get-neighborhood", args: [] },
        });
        expect(badRes.isError).toBe(true);

        // The server must still be alive: a subsequent call still succeeds.
        const okRes = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "database-status", args: [] },
        });
        expect(okRes.isError).toBeUndefined();
      }, 15_000);

      it("runs update-check end-to-end with an injected --latest (deterministic)", async () => {
        const res = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: {
            cmd: "update-check",
            args: ["--latest", "0.0.1", "--channel", "developer"],
          },
        });
        expect(res.isError).toBeUndefined();
        const data = JSON.parse(res.content[0].text);
        // 0.0.1 is behind any real currentVersion, so no update is due.
        expect(data.updateAvailable).toBe(false);
        expect(data.latestVersion).toBe("0.0.1");
        expect(data.channel).toBe("developer");
      }, 15_000);

      it("runs backup-create end-to-end and writes a verifiable snapshot", async () => {
        const res = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "backup-create", args: [] },
        });
        expect(res.isError).toBeUndefined();
        const data = JSON.parse(res.content[0].text);
        expect(data.ok).toBe(true);
        expect(data.path.endsWith(".sql")).toBe(true);
        expect(data.tables).toBeDefined();
      }, 15_000);
    });
  });
});
