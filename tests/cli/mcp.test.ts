import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import { upsertArticle } from "../../src/cli/okf/io.js";
import type { Database } from "../../src/kernel/index.js";
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
    // Windows can hold file locks for a beat after the server/DB close —
    // retry instead of failing the whole suite on cleanup (issue #190).
    rmSync(tempDir, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 100,
    });
  });

  it("publishes unambiguous routing instructions for both knowledge surfaces", () => {
    expect(client.getInstructions()).toContain("zam_show_graph");
    expect(client.getInstructions()).toContain("learning tokens");
    expect(client.getInstructions()).toContain("zam_okf_visualize");
    expect(client.getInstructions()).toContain('view: "graph"');
  });

  it("lists all 28 tools with correct annotations", async () => {
    const response = await client.listTools();
    expect(response.tools).toHaveLength(28);

    const toolNames = response.tools.map((t) => t.name).sort();
    const expectedNames = [
      "zam_status",
      "zam_session_start",
      "zam_session_end",
      "zam_get_reviews",
      "zam_submit_review",
      "zam_review_action",
      "zam_add_token",
      "zam_publish_revision",
      "zam_find_tokens",
      "zam_suggest_foundations",
      "zam_link_prereq",
      "zam_monitor",
      "zam_open_studio",
      "zam_open_recall",
      "zam_show_graph",
      "zam_open_settings",
      "zam_studio_bridge",
      "zam_companion_context",
      "zam_companion_sample",
      "zam_okf_catalog",
      "zam_okf_read",
      "zam_okf_audit",
      "zam_okf_upsert",
      "zam_okf_read_citation",
      "zam_okf_visualize",
      "zam_okf_import",
      "zam_okf_focus",
      "zam_okf_focused",
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
    expect(content.text).toContain("recall-smart-feedback");
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

    // inputSchema accepts optional domain/user — neither is required.
    const schema = tool?.inputSchema as
      | { properties?: Record<string, unknown>; required?: string[] }
      | undefined;
    expect(schema?.properties).toHaveProperty("domain");
    expect(schema?.properties).toHaveProperty("user");
    expect(schema?.required ?? []).not.toContain("domain");
    expect(schema?.required ?? []).not.toContain("user");

    const res = await client.callTool({
      name: "zam_open_recall",
      arguments: {},
    });
    expect(res.isError).toBeUndefined();
    const structured = (res as any).structuredContent as {
      recall?: string;
      version?: string;
      user?: string | null;
      domain?: string | null;
      quickMode?: boolean;
      companionContext?: { user?: { currentId?: string; source?: string } };
    };
    expect(structured.recall).toBe("zam");
    expect(typeof structured.version).toBe("string");
    // Default user seeded in beforeEach via user_config.
    expect(structured.user).toBe("thomas");
    // No domain focus unless requested.
    expect(structured.domain).toBeNull();
    // Smart Recall is the default when the setting is absent.
    expect(structured.quickMode).toBe(false);
    // Resolved context for first paint (ADR §Decision 3) — the app must
    // never briefly render the wrong learner while waiting for a second call.
    expect(structured.companionContext?.user?.currentId).toBe("thomas");
    expect(structured.companionContext?.user?.source).toBe("default");

    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('recall.quick_mode', 'true')",
      )
      .run();

    const scopedRes = await client.callTool({
      name: "zam_open_recall",
      arguments: { domain: "rag" },
    });
    expect(scopedRes.isError).toBeUndefined();
    const scopedStructured = (scopedRes as any).structuredContent as {
      domain?: string | null;
      quickMode?: boolean;
    };
    expect(scopedStructured.domain).toBe("rag");
    expect(scopedStructured.quickMode).toBe(true);
  });

  it("reuses the persisted Companion learner for a menu-opened Recall instead of the database default", async () => {
    // Regression coverage for the ADR's motivating incident: a menu-opened
    // Recall (no explicit `user` argument) must not silently fall back to
    // the shared database default once a Companion learner was selected.
    const writeRes = await client.callTool({
      name: "zam_companion_context",
      arguments: {
        action: "write",
        surface: "recall",
        userId: "test-user-0.6.2",
      },
    });
    expect(writeRes.isError).toBeUndefined();

    const openRes = await client.callTool({
      name: "zam_open_recall",
      arguments: {},
    });
    expect(openRes.isError).toBeUndefined();
    const structured = (openRes as any).structuredContent as {
      user?: string | null;
    };
    expect(structured.user).toBe("test-user-0.6.2");

    // The shared database default must stay exactly as it was — switching
    // the Companion learner must never rewrite it.
    const userRow = await db
      .prepare("SELECT value FROM user_config WHERE key = 'user.id'")
      .get();
    expect((userRow as { value: string }).value).toBe("thomas");
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

    // Repo scope for the card's no-focus bootstrap: without client roots the
    // server falls back to docs/okf under its cwd — this checkout's own OKF
    // bundle, so the scope must name the repo and carry one source-link base
    // per article (resource URL, else resolved article path).
    const repoScope = (structured as any).repoScope as {
      label: string;
      bases: string[];
    };
    expect(typeof repoScope?.label).toBe("string");
    expect(repoScope.label.length).toBeGreaterThan(0);
    expect(Array.isArray(repoScope.bases)).toBe(true);
    expect(repoScope.bases.length).toBeGreaterThan(0);
    for (const base of repoScope.bases) {
      expect(typeof base).toBe("string");
    }

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
    expect(content.text).toContain(
      "Just show questions and answers for speed",
    );
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

  describe("open-tool resilience (finding: open tools could fail to open)", () => {
    function makeThrowingDb(): Database {
      const fail = () => {
        throw new Error("simulated DB outage");
      };
      return {
        prepare: fail,
        exec: async () => fail(),
        pragma: async () => fail(),
        transaction: async () => fail(),
        close: async () => {},
      } as unknown as Database;
    }

    it("never fails to open recall even when every DB read throws", async () => {
      const brokenDb = makeThrowingDb();
      const brokenServer = createMcpServer(brokenDb);
      const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
      const brokenClient = new Client(
        { name: "test-client-broken-db", version: "1.0.0" },
        { capabilities: {} },
      );
      await Promise.all([
        brokenClient.connect(cTrans),
        brokenServer.connect(sTrans),
      ]);

      try {
        const res = await brokenClient.callTool({
          name: "zam_open_recall",
          arguments: {},
        });
        expect(res.isError).toBeUndefined();
        const structured = (res as any).structuredContent as {
          recall?: string;
          user?: string | null;
          quickMode?: boolean;
          companionContext?: { evaluators?: unknown[] };
          companionContextDegraded?: boolean;
        };
        // The panel still "opens": a usable, non-error structured result,
        // not a rejected call.
        expect(structured.recall).toBe("zam");
        expect(structured.user).toBeNull();
        expect(structured.quickMode).toBe(false);
        expect(structured.companionContext?.evaluators?.length).toBeGreaterThan(
          0,
        );
        // The degradation is observable, never silent.
        expect(structured.companionContextDegraded).toBe(true);
      } finally {
        await brokenClient.close();
        await brokenServer.close();
      }
    });

    it("never fails to open studio, graph, or settings when every DB read throws", async () => {
      const brokenDb = makeThrowingDb();
      const brokenServer = createMcpServer(brokenDb);
      const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
      const brokenClient = new Client(
        { name: "test-client-broken-db-2", version: "1.0.0" },
        { capabilities: {} },
      );
      await Promise.all([
        brokenClient.connect(cTrans),
        brokenServer.connect(sTrans),
      ]);

      try {
        for (const name of [
          "zam_open_studio",
          "zam_show_graph",
          "zam_open_settings",
          "zam_okf_visualize",
        ]) {
          const res = await brokenClient.callTool({ name, arguments: {} });
          expect(res.isError).toBeUndefined();
          const structured = (res as any).structuredContent as {
            companionContextDegraded?: boolean;
          };
          expect(structured.companionContextDegraded).toBe(true);
        }
      } finally {
        await brokenClient.close();
        await brokenServer.close();
      }
    });
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
    // Wait for the child to actually die: it holds its database inside
    // tempDir, and on Windows an unawaited kill lets afterEach's rmSync
    // race the file locks of the exiting process (issue #190).
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve();
        return;
      }
      const fallback = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 5_000);
      child.once("exit", () => {
        clearTimeout(fallback);
        resolve();
      });
    });

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

      it("reads and writes the opt-in Recall quick-mode setting", async () => {
        const writeRes = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: {
            cmd: "setting-set",
            args: ["--key", "recall.quick_mode", "--value", "true"],
          },
        });
        expect(writeRes.isError).toBeUndefined();

        const readRes = await studioClient.callTool({
          name: "zam_studio_bridge",
          arguments: { cmd: "get-settings", args: [] },
        });
        expect(readRes.isError).toBeUndefined();
        const data = JSON.parse(readRes.content[0].text);
        expect(data.recall).toEqual({ quickMode: true });
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

  describe("zam_companion_context", () => {
    it("registers as an app-only tool, not exposed for direct model use", async () => {
      const response = await client.listTools();
      const tool = response.tools.find(
        (t) => t.name === "zam_companion_context",
      );
      expect(tool).toBeDefined();
      const meta = tool?._meta as
        | { ui?: { visibility?: string[] } }
        | undefined;
      expect(meta?.ui?.visibility).toEqual(["app"]);
    });

    it("reads the default context with no persisted preference", async () => {
      const res = await client.callTool({
        name: "zam_companion_context",
        arguments: { action: "read", surface: "recall" },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.surface).toBe("recall");
      expect(data.user).toEqual({
        currentId: "thomas",
        persistedId: undefined,
        source: "default",
      });
      expect(data.collapsed).toBe(false);
      expect(Array.isArray(data.profiles)).toBe(true);
      expect(Array.isArray(data.harnesses)).toBe(true);
      // Phase 2 does not yet broaden model routing — quick mode only.
      expect(data.activeEvaluatorId).toBe("quick-mode");
    });

    it("rejects an unknown evaluator id instead of persisting it", async () => {
      const res = await client.callTool({
        name: "zam_companion_context",
        arguments: {
          action: "write",
          surface: "recall",
          evaluatorId: "not-a-real-evaluator",
        },
      });
      expect(res.isError).toBe(true);
    });

    it("rejects a write request that changes nothing", async () => {
      const res = await client.callTool({
        name: "zam_companion_context",
        arguments: { action: "write", surface: "recall" },
      });
      expect(res.isError).toBe(true);
    });

    it("persists a manual learner selection and reports reloadRequired", async () => {
      const res = await client.callTool({
        name: "zam_companion_context",
        arguments: {
          action: "write",
          surface: "recall",
          userId: "test-user-0.6.2",
        },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.reloadRequired).toBe(true);
      expect(data.read.user.currentId).toBe("test-user-0.6.2");
      expect(data.read.user.source).toBe("persisted");

      const reread = await client.callTool({
        name: "zam_companion_context",
        arguments: { action: "read", surface: "graph" },
      });
      const rereadData = JSON.parse(reread.content[0].text);
      expect(rereadData.user.currentId).toBe("test-user-0.6.2");
    });

    it("does not require a reload for a collapsed-only write", async () => {
      const res = await client.callTool({
        name: "zam_companion_context",
        arguments: {
          action: "write",
          surface: "settings",
          collapsed: true,
        },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.reloadRequired).toBe(false);
      expect(data.read.collapsed).toBe(true);

      // Collapsed state is per-surface: an unrelated surface is unaffected.
      const otherSurface = await client.callTool({
        name: "zam_companion_context",
        arguments: { action: "read", surface: "recall" },
      });
      const otherData = JSON.parse(otherSurface.content[0].text);
      expect(otherData.collapsed).toBe(false);
    });
  });

  describe("zam_okf_read_citation and zam_okf_catalog include_log", () => {
    let repoRoot: string;
    let bundleDir: string;

    beforeEach(() => {
      // Shaped like a repo checkout: .git at the root, docs/okf as the
      // bundle, docs/adr holding a citation target outside the bundle.
      repoRoot = mkdtempSync(join(tmpdir(), "zam-okf-mcp-"));
      mkdirSync(join(repoRoot, ".git"));
      bundleDir = join(repoRoot, "docs", "okf");
      mkdirSync(bundleDir, { recursive: true });
      mkdirSync(join(repoRoot, "docs", "adr"), { recursive: true });
      writeFileSync(
        join(repoRoot, "docs", "adr", "2026-07-17-x.md"),
        "# Decision X\n",
      );
      upsertArticle(
        bundleDir,
        "fsrs-scheduling.md",
        [
          "---",
          "type: concept",
          "title: FSRS Scheduling",
          "description: How ZAM schedules reviews.",
          "tags:",
          "  - kernel",
          'resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"',
          "timestamp: 2026-07-17T00:00:00Z",
          "---",
          "",
          "FSRS-5 drives the queue.",
          "",
        ].join("\n"),
        "2026-07-17",
      );
    });

    afterEach(() => {
      rmSync(repoRoot, { recursive: true, force: true });
    });

    it("reads a citation target outside the bundle as a repo-relative, forward-slash path", async () => {
      const res = await client.callTool({
        name: "zam_okf_read_citation",
        arguments: {
          bundle_dir: bundleDir,
          target: "../adr/2026-07-17-x.md",
        },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.target).toBe("../adr/2026-07-17-x.md");
      expect(data.path).toBe("docs/adr/2026-07-17-x.md");
      expect(data.content).toBe("# Decision X\n");
    });

    it("rejects a traversal target with isError and an invalid citation target message", async () => {
      const res = await client.callTool({
        name: "zam_okf_read_citation",
        arguments: {
          bundle_dir: bundleDir,
          target: "../../../outside.md",
        },
      });
      expect(res.isError).toBe(true);
      const data = JSON.parse(res.content[0].text);
      expect(data.error).toContain("invalid citation target");
    });

    it("returns the raw log.md text from zam_okf_catalog when include_log is set", async () => {
      const res = await client.callTool({
        name: "zam_okf_catalog",
        arguments: { bundle_dir: bundleDir, include_log: true },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.log).toContain("FSRS Scheduling");
      expect(data.log).toContain("Creation");
    });

    it("omits log from zam_okf_catalog when include_log is absent", async () => {
      const res = await client.callTool({
        name: "zam_okf_catalog",
        arguments: { bundle_dir: bundleDir },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.log).toBeUndefined();
    });

    it("exposes zam_okf_audit as a read-only freshness hint", async () => {
      const tools = await client.listTools();
      const tool = tools.tools.find((entry) => entry.name === "zam_okf_audit");
      expect((tool as any).annotations).toEqual({
        openWorldHint: false,
        readOnlyHint: true,
      });

      const res = await client.callTool({
        name: "zam_okf_audit",
        arguments: { bundle_dir: bundleDir },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.dir).toBe(bundleDir);
      expect(data.gitAvailable).toBe(false);
      expect(data.summary).toEqual({
        current: 0,
        reviewRecommended: 0,
        unknown: 1,
      });
      expect(data.articles[0]).toEqual(
        expect.objectContaining({
          file: "fsrs-scheduling.md",
          status: "unknown",
          reason: "no-code-citations",
        }),
      );
    });

    it("returns an empty log string when log.md does not exist yet", async () => {
      const emptyBundleDir = join(repoRoot, "docs", "empty-okf");
      mkdirSync(emptyBundleDir, { recursive: true });
      const res = await client.callTool({
        name: "zam_okf_catalog",
        arguments: { bundle_dir: emptyBundleDir, include_log: true },
      });
      expect(res.isError).toBeUndefined();
      const data = JSON.parse(res.content[0].text);
      expect(data.log).toBe("");
    });
  });

  describe("zam_okf_focus / zam_okf_focused", () => {
    let previousFocusPath: string | undefined;

    beforeEach(() => {
      previousFocusPath = process.env.ZAM_OKF_FOCUS_PATH;
      process.env.ZAM_OKF_FOCUS_PATH = join(tempDir, "okf-focus.json");
    });

    afterEach(() => {
      if (previousFocusPath === undefined) {
        delete process.env.ZAM_OKF_FOCUS_PATH;
      } else {
        process.env.ZAM_OKF_FOCUS_PATH = previousFocusPath;
      }
    });

    it("marks the write side app-only and the read side read-only", async () => {
      const response = await client.listTools();
      const focus = response.tools.find((t) => t.name === "zam_okf_focus");
      const focusMeta = focus?._meta as
        | { ui?: { visibility?: string[] } }
        | undefined;
      expect(focusMeta?.ui?.visibility).toEqual(["app"]);

      const focused = response.tools.find((t) => t.name === "zam_okf_focused");
      expect((focused as any).annotations).toEqual({
        openWorldHint: false,
        readOnlyHint: true,
      });
    });

    it("round-trips the focused article and reports null before any focus", async () => {
      const before = await client.callTool({
        name: "zam_okf_focused",
        arguments: {},
      });
      expect(before.isError).toBeUndefined();
      expect(JSON.parse((before as any).content[0].text).focused).toBeNull();

      const write = await client.callTool({
        name: "zam_okf_focus",
        arguments: { file: "mcp-surfaces.md", bundle_dir: "C:/repo/docs/okf" },
      });
      expect(write.isError).toBeUndefined();

      const after = await client.callTool({
        name: "zam_okf_focused",
        arguments: {},
      });
      const focused = JSON.parse((after as any).content[0].text).focused;
      expect(focused.file).toBe("mcp-surfaces.md");
      expect(focused.bundle_dir).toBe("C:/repo/docs/okf");
      expect(typeof focused.updatedAt).toBe("string");
    });

    it("rejects article names with path separators", async () => {
      const res = await client.callTool({
        name: "zam_okf_focus",
        arguments: { file: "../evil.md" },
      });
      expect(res.isError).toBe(true);
    });
  });

  describe("zam_okf_visualize", () => {
    let repoRoot: string;
    let bundleDir: string;

    beforeEach(() => {
      // Shaped like a repo checkout: .git at the root, docs/okf as the
      // bundle — same fixture shape as the citation-read tests above.
      repoRoot = mkdtempSync(join(tmpdir(), "zam-okf-visualize-"));
      mkdirSync(join(repoRoot, ".git"));
      bundleDir = join(repoRoot, "docs", "okf");
      mkdirSync(bundleDir, { recursive: true });
      upsertArticle(
        bundleDir,
        "fsrs-scheduling.md",
        [
          "---",
          "type: concept",
          "title: FSRS Scheduling",
          "description: How ZAM schedules reviews.",
          "tags:",
          "  - kernel",
          "---",
          "",
          "FSRS-5 drives the queue.",
          "",
        ].join("\n"),
        "2026-07-17",
      );
    });

    afterEach(() => {
      rmSync(repoRoot, { recursive: true, force: true });
    });

    it("exposes the okf panel as an MCP Apps resource", async () => {
      const resources = await client.listResources();
      const okf = resources.resources.find((r) => r.uri === "ui://zam/okf");
      expect(okf).toBeDefined();

      const read = await client.readResource({ uri: "ui://zam/okf" });
      const content = read.contents[0] as { text: string; mimeType: string };
      expect(content.mimeType).toContain("text/html");
      // The bundled okf panel roots at <div id="zam-okf-panel">. The
      // no-build placeholder in loadPanelHtml uses a data-panel attribute
      // instead of this id, so this assertion only passes against a real
      // dist/ui/okf-panel.html build (CI builds before running tests).
      expect(content.text).toContain("zam-okf-panel");
    });

    it("links zam_okf_visualize to the okf panel resource and initializes the requested view", async () => {
      const response = await client.listTools();
      const tool = response.tools.find((t) => t.name === "zam_okf_visualize");
      expect(tool).toBeDefined();
      const meta = tool?._meta as
        | { ui?: { resourceUri?: string } }
        | undefined;
      expect(meta?.ui?.resourceUri).toBe("ui://zam/okf");
      expect((tool as any).annotations).toEqual({
        openWorldHint: false,
        readOnlyHint: true,
      });

      // Both the bundle and initial reader/graph/log view are optional.
      const schema = tool?.inputSchema as
        | { properties?: Record<string, unknown>; required?: string[] }
        | undefined;
      expect(schema?.properties).toHaveProperty("bundle_dir");
      expect(schema?.properties).toHaveProperty("view");
      expect(schema?.required ?? []).not.toContain("bundle_dir");
      expect(schema?.required ?? []).not.toContain("view");

      const res = await client.callTool({
        name: "zam_okf_visualize",
        arguments: { bundle_dir: bundleDir, view: "graph" },
      });
      expect(res.isError).toBeUndefined();
      const structured = (res as any).structuredContent as {
        okf?: string;
        version?: string;
        user?: string | null;
        bundleDir?: string;
        okfVersion?: string | null;
        view?: string;
        catalog?: Array<{ file: string }>;
        log?: string;
        problems?: string[];
        companionContext?: { surface?: string };
      };
      expect(structured.okf).toBe("zam");
      expect(typeof structured.version).toBe("string");
      // Default user seeded in beforeEach via user_config.
      expect(structured.user).toBe("thomas");
      expect(structured.bundleDir).toBe(bundleDir);
      // okf_version comes from the bundle's own index.md frontmatter
      // (renderIndex's default), not the zam package version.
      expect(structured.okfVersion).toBe("0.1");
      expect(structured.view).toBe("graph");
      expect(structured.catalog?.map((e) => e.file)).toEqual([
        "fsrs-scheduling.md",
      ]);
      expect(structured.problems).toEqual([]);
      // log.md was written by upsertArticle in beforeEach — returned eagerly,
      // with no separate zam_okf_catalog round-trip required.
      expect(structured.log).toContain("FSRS Scheduling");
      // Git inspection is fetched asynchronously by the panel through
      // zam_okf_audit so opening never waits for repository history.
      expect(structured).not.toHaveProperty("freshness");
      expect(structured.companionContext?.surface).toBe("okf");
    });

    it("returns an empty catalog and problems instead of erroring on a missing bundle directory", async () => {
      const missingDir = join(repoRoot, "docs", "does-not-exist");
      const res = await client.callTool({
        name: "zam_okf_visualize",
        arguments: { bundle_dir: missingDir },
      });
      expect(res.isError).toBeUndefined();
      const structured = (res as any).structuredContent as {
        catalog?: unknown[];
        problems?: string[];
        okfVersion?: string | null;
        bundleDir?: string;
        view?: string;
      };
      expect(structured.catalog).toEqual([]);
      expect(structured.problems?.length).toBeGreaterThan(0);
      expect(structured.okfVersion).toBeNull();
      expect(structured.bundleDir).toBe(missingDir);
      expect(structured.view).toBe("reader");
      expect(structured).not.toHaveProperty("freshness");
    });
  });
});
