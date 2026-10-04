import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import {
  appendKnowledgeMapFeedback,
  listKnowledgeMapFeedback,
  parseFeedbackInput,
} from "../../src/cli/knowledge-map/feedback.js";
import {
  loadKnowledgeMap,
  resolveRepoRootFromRoots,
  writeKnowledgeMap,
} from "../../src/cli/knowledge-map/load.js";
import {
  buildMapIndex,
  type KnowledgeMap,
  MAX_STATEMENT_LENGTH,
  validateKnowledgeMap,
} from "../../src/cli/knowledge-map/model.js";
import {
  getKnowledgeMapConfig,
  openDatabase,
  setKnowledgeMapConfig,
} from "../../src/kernel/index.js";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

function smallMap(): Record<string, unknown> {
  return {
    format: "zam-knowledge-map",
    version: 1,
    title: "Demo",
    focus_question: "How does the demo work?",
    root: "demo",
    statements: [
      { id: "demo", text: "The demo shows a map.", sources: ["README.md"] },
      {
        id: "store",
        parent: "demo",
        text: "Data lives in one file.",
        sources: ["README.md"],
      },
      {
        id: "no-db",
        parent: "store",
        text: "There is no database server.",
        sources: ["README.md#setup"],
      },
      {
        id: "db",
        parent: "no-db",
        text: "A server would need hosting.",
        sources: ["README.md"],
      },
      {
        id: "fast",
        parent: "demo",
        text: "Start-up takes one second.",
        sources: ["README.md"],
      },
    ],
    relations: [
      { from: "no-db", to: "db", kind: "instead_of" },
      { from: "fast", to: "store", kind: "because" },
    ],
  };
}

function errors(
  input: unknown,
  sourceExists?: (p: string) => boolean,
): string[] {
  return validateKnowledgeMap(input, { sourceExists })
    .issues.filter((issue) => issue.level === "error")
    .map((issue) => issue.message);
}

describe("knowledge map: ZAM's own map", () => {
  it("is valid and every source exists in the repository", () => {
    const loaded = loadKnowledgeMap(REPO_ROOT);
    expect(loaded.found).toBe(true);
    expect(loaded.issues).toEqual([]);
    expect(loaded.map?.statements.length).toBeGreaterThan(40);
  });
});

describe("knowledge map: validator", () => {
  it("accepts a well-formed map", () => {
    const result = validateKnowledgeMap(smallMap(), {
      sourceExists: () => true,
    });
    expect(result.issues).toEqual([]);
    expect(result.map?.statements).toHaveLength(5);
  });

  it("keeps a short concept label and rejects a sentence used as one", () => {
    const map = smallMap();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[0].label = "ZAM";
    const kept = validateKnowledgeMap(map, { sourceExists: () => true });
    expect(kept.issues).toEqual([]);
    expect(kept.map?.statements[0]?.label).toBe("ZAM");
    statements[0].label = "This label is a whole sentence about the repository";
    expect(
      errors(map).some((message) => message.includes("concept label")),
    ).toBe(true);
    statements[0].label = "ZAM";
    statements[1].link = "rests on";
    const linked = validateKnowledgeMap(map, { sourceExists: () => true });
    expect(linked.map?.statements[1]?.link).toBe("rests on");
  });

  it("rejects a wrong format, version and missing focus question", () => {
    const map = {
      ...smallMap(),
      format: "other",
      version: 2,
      focus_question: "",
    };
    const messages = errors(map);
    expect(messages.some((m) => m.includes('"format"'))).toBe(true);
    expect(messages.some((m) => m.includes('"version"'))).toBe(true);
    expect(messages.some((m) => m.includes("focus_question"))).toBe(true);
  });

  it("limits a statement to one line of at most 140 characters", () => {
    const map = smallMap();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[1].text = "x".repeat(MAX_STATEMENT_LENGTH + 1);
    statements[2].text = "two\nlines";
    const messages = errors(map);
    expect(messages.some((m) => m.includes("the limit is 140"))).toBe(true);
    expect(messages.some((m) => m.includes("several lines"))).toBe(true);
  });

  it("requires repository-relative sources that exist", () => {
    const map = smallMap();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[1].sources = [];
    statements[2].sources = ["https://example.com/a.md"];
    statements[3].sources = ["../outside.md"];
    statements[4].sources = ["missing.md"];
    const messages = errors(map, (path) => path === "README.md");
    expect(messages.some((m) => m.includes("at least one source"))).toBe(true);
    expect(messages.some((m) => m.includes("not a URL"))).toBe(true);
    expect(messages.some((m) => m.includes("must not leave"))).toBe(true);
    expect(messages.some((m) => m.includes("does not exist"))).toBe(true);
  });

  it("checks ids, the root and the parent tree", () => {
    const map = smallMap();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements.push({
      id: "Bad Id",
      parent: "demo",
      text: "x.",
      sources: ["README.md"],
    });
    statements.push({
      id: "store",
      parent: "demo",
      text: "dup.",
      sources: ["README.md"],
    });
    statements.push({
      id: "orphan",
      parent: "ghost",
      text: "x.",
      sources: ["README.md"],
    });
    statements.push({
      id: "loop-a",
      parent: "loop-b",
      text: "a.",
      sources: ["README.md"],
    });
    statements.push({
      id: "loop-b",
      parent: "loop-a",
      text: "b.",
      sources: ["README.md"],
    });
    const messages = errors(map);
    expect(messages.some((m) => m.includes("lowercase slug"))).toBe(true);
    expect(messages.some((m) => m.includes("used twice"))).toBe(true);
    expect(messages.some((m) => m.includes('Parent "ghost"'))).toBe(true);
    expect(messages.some((m) => m.includes("cannot be reached"))).toBe(true);

    const rooted = smallMap();
    (rooted.statements as Array<Record<string, unknown>>)[0].parent = "store";
    expect(
      errors(rooted).some((m) => m.includes("root statement must not")),
    ).toBe(true);
  });

  it("checks relation ends, kinds and duplicates", () => {
    const map = smallMap();
    map.relations = [
      { from: "demo", to: "ghost", kind: "because" },
      { from: "demo", to: "demo", kind: "because" },
      { from: "demo", to: "fast", kind: "causes" },
      { from: "store", to: "fast", kind: "because" },
      { from: "fast", to: "store", kind: "requires" },
    ];
    const messages = errors(map);
    expect(messages.some((m) => m.includes('target "ghost"'))).toBe(true);
    expect(messages.some((m) => m.includes("two different statements"))).toBe(
      true,
    );
    expect(messages.some((m) => m.includes('"causes"'))).toBe(true);
    expect(messages.some((m) => m.includes("joined twice"))).toBe(true);
  });

  it("only warns when a statement has more than seven details", () => {
    const map = smallMap();
    const statements = map.statements as Array<Record<string, unknown>>;
    for (let i = 0; i < 7; i++) {
      statements.push({
        id: `extra-${i}`,
        parent: "demo",
        text: "x.",
        sources: ["README.md"],
      });
    }
    const result = validateKnowledgeMap(map);
    expect(result.map).not.toBeNull();
    expect(result.issues).toEqual([
      expect.objectContaining({ level: "warning", id: "demo" }),
    ]);
  });
});

describe("knowledge map: navigation index", () => {
  const index = buildMapIndex(
    validateKnowledgeMap(smallMap()).map as KnowledgeMap,
  );

  it("orients every edge away from the statement in focus", () => {
    expect(index.neighbors("store")).toEqual([
      { id: "demo", kind: "elaborates", direction: "in", tree: "parent" },
      { id: "no-db", kind: "elaborates", direction: "out", tree: "child" },
      { id: "fast", kind: "because", direction: "in", tree: null },
    ]);
  });

  it("lets a cross-link name the tree edge it shares", () => {
    expect(index.neighbors("no-db")).toContainEqual({
      id: "db",
      kind: "instead_of",
      direction: "out",
      tree: "child",
    });
    expect(index.neighbors("db")).toEqual([
      { id: "no-db", kind: "instead_of", direction: "in", tree: "parent" },
    ]);
  });

  it("knows paths, depths and the depth-first order", () => {
    expect(index.pathTo("db")).toEqual(["demo", "store", "no-db", "db"]);
    expect(index.depth("db")).toBe(3);
    expect(index.order()).toEqual(["demo", "store", "no-db", "db", "fast"]);
    expect(index.sourceUrl("README.md")).toBeNull();
  });
});

describe("knowledge map: files, roots and feedback", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-km-"));
    writeFileSync(join(dir, "README.md"), "# Demo\n");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes a map only when it is valid", () => {
    const bad = { ...smallMap(), root: "ghost" };
    const refused = writeKnowledgeMap(dir, bad);
    expect(refused.ok).toBe(false);
    expect(existsSync(refused.path)).toBe(false);

    const written = writeKnowledgeMap(dir, smallMap());
    expect(written).toMatchObject({ ok: true, statements: 5, relations: 2 });
    expect(loadKnowledgeMap(dir).map?.root).toBe("demo");
  });

  it("reports a broken file instead of throwing", () => {
    mkdirSync(join(dir, "docs", "knowledge-map"), { recursive: true });
    writeFileSync(join(dir, "docs", "knowledge-map", "map.json"), "{ nope");
    const loaded = loadKnowledgeMap(dir);
    expect(loaded.found).toBe(true);
    expect(loaded.map).toBeNull();
    expect(loaded.issues[0].message).toContain("not valid JSON");
  });

  it("picks the MCP root that already has a map", () => {
    const other = mkdtempSync(join(tmpdir(), "zam-km-other-"));
    try {
      writeKnowledgeMap(dir, smallMap());
      const roots = [pathToFileURL(other).href, pathToFileURL(dir).href];
      expect(resolveRepoRootFromRoots(roots, "/fallback")).toBe(dir);
      expect(resolveRepoRootFromRoots([pathToFileURL(other).href], "/fb")).toBe(
        other,
      );
      expect(resolveRepoRootFromRoots(["https://x"], "/fb")).toBe("/fb");
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("validates and keeps feedback on this machine", () => {
    const path = join(dir, "feedback.json");
    expect(() => parseFeedbackInput({ view: "focus", helpful: 0 })).toThrow();
    expect(() =>
      parseFeedbackInput({ view: "focus", helpful: 3, found: "maybe" }),
    ).toThrow();
    const entry = parseFeedbackInput({
      view: "levels",
      helpful: "5",
      found: "yes",
      comment: " ok ",
    });
    expect(entry).toMatchObject({
      view: "levels",
      helpful: 5,
      found: "yes",
      comment: "ok",
    });
    appendKnowledgeMapFeedback(entry, path);
    appendKnowledgeMapFeedback(
      parseFeedbackInput({ view: "focus", helpful: 2 }),
      path,
    );
    expect(listKnowledgeMapFeedback(path).map((e) => e.view)).toEqual([
      "levels",
      "focus",
    ]);
  });

  it("stores the alpha settings machine-locally and merges patches", () => {
    const path = join(dir, "config.json");
    expect(getKnowledgeMapConfig(path)).toEqual({});
    setKnowledgeMapConfig({ enabled: true, view: "outline" }, path);
    setKnowledgeMapConfig({ enabled: false }, path);
    setKnowledgeMapConfig({ repoPath: dir }, path);
    expect(getKnowledgeMapConfig(path)).toEqual({
      enabled: false,
      view: "outline",
      repoPath: dir,
    });
  });
});

describe("knowledge map: MCP tools", () => {
  let dir: string;
  let previousConfigPath: string | undefined;
  let db: Awaited<ReturnType<typeof openDatabase>>;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-km-mcp-"));
    writeFileSync(join(dir, "README.md"), "# Demo\n");
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: join(dir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(dir, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 100,
    });
  });

  async function connect() {
    const server = createMcpServer(db);
    const client = new Client(
      { name: "test", version: "1.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
    return { client, server };
  }

  it("stays out of the tool list while the alpha is off", async () => {
    const { client, server } = await connect();
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).not.toContain("zam_knowledge_map_guide");
    expect(names).not.toContain("zam_knowledge_map_write");
    await client.close();
    await server.close();
  });

  it("guides, validates and writes a map once the alpha is on", async () => {
    setKnowledgeMapConfig({ enabled: true });
    const { client, server } = await connect();
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).toContain("zam_knowledge_map_guide");
    expect(names).toContain("zam_knowledge_map_write");

    const guide = await client.callTool({
      name: "zam_knowledge_map_guide",
      arguments: { repo_root: dir },
    });
    const guideText = (guide.content as Array<{ text: string }>)[0].text;
    expect(guideText).toContain("zam_knowledge_map_write");
    expect(guide.structuredContent).toMatchObject({
      exists: false,
      repo_root: dir,
    });

    const refused = await client.callTool({
      name: "zam_knowledge_map_write",
      arguments: { repo_root: dir, map: { ...smallMap(), root: "ghost" } },
    });
    expect(refused.structuredContent).toMatchObject({ ok: false });

    const written = await client.callTool({
      name: "zam_knowledge_map_write",
      arguments: { repo_root: dir, map: smallMap() },
    });
    expect(written.structuredContent).toMatchObject({
      ok: true,
      statements: 5,
    });
    const saved = JSON.parse(
      readFileSync(join(dir, "docs", "knowledge-map", "map.json"), "utf8"),
    );
    expect(saved.root).toBe("demo");
    expect(getKnowledgeMapConfig().repoPath).toBe(dir);

    await client.close();
    await server.close();
  });
});
