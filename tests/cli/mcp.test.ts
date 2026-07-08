import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  openDatabase,
  createToken,
  ensureCard,
  getCard,
  getPrerequisites,
  getTokenBySlug,
} from "../../src/kernel/index.js";
import { createMcpServer } from "../../src/cli/commands/mcp.js";

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

  it("lists all 12 tools with correct annotations", async () => {
    const response = await client.listTools();
    expect(response.tools).toHaveLength(12);

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
});
