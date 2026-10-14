import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentSourceError,
  checkAgentSource,
} from "../../src/cli/agent-source.js";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import {
  canonicalRoots,
  type Database,
  getTokenBySlug,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * An agent creates a token only from a source it read (ADR 2026-10-14,
 * Decision 3): a file or folder in a trusted folder, or a public web page.
 */

describe("an agent's source", () => {
  let dir: string;
  let roots: string[];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-agent-source-"));
    mkdirSync(join(dir, "repo", "docs", "okf"), { recursive: true });
    writeFileSync(join(dir, "repo", "docs", "okf", "atlas.md"), "# Atlas\n");
    writeFileSync(join(dir, "elsewhere.md"), "# Not trusted\n");
    roots = canonicalRoots([join(dir, "repo")]);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function refusal(link: string | null | undefined): string {
    try {
      checkAgentSource(link, { roots });
    } catch (error) {
      expect(error).toBeInstanceOf(AgentSourceError);
      return (error as AgentSourceError).code;
    }
    return "accepted";
  }

  it("takes a public web page", () => {
    expect(
      checkAgentSource("https://example.org/scrum#rollen", { roots }),
    ).toEqual({ kind: "url", link: "https://example.org/scrum#rollen" });
    expect(refusal("http://de.wikipedia.org/wiki/Scrum")).toBe("accepted");
  });

  it("refuses a page that is not public, or carries credentials", () => {
    for (const link of [
      "http://localhost:8080/notes",
      "https://10.0.0.7/wiki",
      "https://[::1]/x",
      "https://intranet.internal/x",
      "https://user:secret@example.org/x",
      "ftp://example.org/file",
    ]) {
      expect(refusal(link)).toBe("unsafe-url");
    }
  });

  it("takes a file or the repository root in a trusted folder, anchors too", () => {
    expect(refusal("docs/okf/atlas.md")).toBe("accepted");
    expect(refusal("docs/okf/atlas.md#rendering")).toBe("accepted");
    expect(refusal(join(dir, "repo"))).toBe("accepted");
  });

  it("refuses no source, and paths outside the trusted folders", () => {
    expect(refusal(undefined)).toBe("no-source");
    expect(refusal("   ")).toBe("no-source");
    expect(refusal(join(dir, "elsewhere.md"))).toBe(
      "path-outside-trusted-folders",
    );
    expect(refusal("docs/okf/missing.md")).toBe("path-outside-trusted-folders");
    expect(refusal("javascript:alert(1)")).toBe("path-outside-trusted-folders");
  });
});

describe("zam_add_token and its source", () => {
  let dir: string;
  let db: Database;
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;
  let previousConfig: string | undefined;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-agent-source-mcp-"));
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "1.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(dir, { recursive: true, force: true, maxRetries: 8 });
  });

  it("creates no token without a source it can check", async () => {
    const missing = await client.callTool({
      name: "zam_add_token",
      arguments: { user: "thomas", slug: "ohne-quelle", concept: "Nichts" },
    });
    expect(missing.isError).toBe(true);
    const local = await client.callTool({
      name: "zam_add_token",
      arguments: {
        user: "thomas",
        slug: "lokaler-server",
        concept: "Ein Dienst",
        sourceLink: "http://localhost:3000/wiki",
      },
    });
    expect(local.isError).toBe(true);
    expect(await getTokenBySlug(db, "ohne-quelle")).toBeUndefined();
    expect(await getTokenBySlug(db, "lokaler-server")).toBeUndefined();

    const page = await client.callTool({
      name: "zam_add_token",
      arguments: {
        user: "thomas",
        slug: "scrum-rollen",
        concept: "Product Owner, Scrum Master und Developers.",
        sourceLink: "https://scrumguides.org/scrum-guide.html",
      },
    });
    expect(page.isError).toBeUndefined();
    expect((await getTokenBySlug(db, "scrum-rollen"))?.source_link).toBe(
      "https://scrumguides.org/scrum-guide.html",
    );
  });
});
