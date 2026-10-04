import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
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
  rootDirsFromUris,
  writeKnowledgeMap,
} from "../../src/cli/knowledge-map/load.js";
import {
  buildMapIndex,
  C4_KINDS,
  c4HostOf,
  KNOWLEDGE_MAP_CONTEXT,
  KNOWLEDGE_MAP_SCHEMA_URL,
  type KnowledgeMap,
  type KnowledgeStatement,
  MAX_C4_NAME_LENGTH,
  MAX_CONCEPT_LABEL_LENGTH,
  MAX_CONCEPT_LABEL_WORDS,
  MAX_LINK_PHRASE_LENGTH,
  MAX_LINK_PHRASE_WORDS,
  MAX_STATEMENT_LENGTH,
  MAX_TECHNOLOGY_LENGTH,
  RELATION_KINDS,
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
      {
        id: "demo",
        label: "Demo",
        text: "The demo shows a map.",
        sources: ["README.md"],
      },
      {
        id: "store",
        parent: "demo",
        label: "One file",
        link: "keeps data in",
        text: "Data lives in one file.",
        sources: ["README.md"],
      },
      {
        id: "no-db",
        parent: "store",
        label: "No server",
        link: "needs",
        text: "There is no database server.",
        sources: ["README.md#setup"],
      },
      {
        id: "db",
        parent: "no-db",
        label: "Database server",
        link: "avoids a",
        text: "A server would need hosting.",
        sources: ["README.md"],
      },
      {
        id: "fast",
        parent: "demo",
        label: "Fast start",
        link: "has a",
        text: "Start-up takes one second.",
        sources: ["README.md"],
      },
    ],
    relations: [
      { from: "no-db", to: "db", kind: "instead_of", link: "replaces a" },
      { from: "fast", to: "store", kind: "because", link: "comes from" },
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
        label: `Extra ${i}`,
        link: "has",
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

/** A small system: a person, the system, two containers, a component. */
function c4Map(): Record<string, unknown> {
  return {
    format: "zam-knowledge-map",
    version: 1,
    title: "Shop",
    focus_question: "How does the shop work?",
    root: "shop",
    statements: [
      {
        id: "shop",
        label: "Shop",
        text: "The shop sells books online.",
        sources: ["README.md"],
        c4: { kind: "system", name: "Shop" },
      },
      {
        id: "buyer",
        label: "Buyer",
        link: "serves",
        parent: "shop",
        text: "A buyer orders books.",
        sources: ["README.md"],
        c4: { kind: "person", name: "Buyer" },
      },
      {
        id: "web",
        label: "Web app",
        link: "runs",
        parent: "shop",
        text: "A web app takes orders.",
        sources: ["README.md"],
        c4: { kind: "container", name: "Web app", technology: "React" },
      },
      {
        id: "db",
        label: "Orders",
        link: "stores in",
        parent: "web",
        text: "Orders are stored in PostgreSQL.",
        sources: ["README.md"],
        c4: { kind: "database", name: "Orders", technology: "PostgreSQL" },
      },
      {
        id: "checkout",
        label: "Checkout",
        link: "checks out with",
        parent: "shop",
        text: "Checkout validates the basket.",
        sources: ["README.md"],
        c4: { kind: "component", name: "Checkout", within: "web" },
      },
      {
        id: "pay",
        label: "Payments",
        link: "pays through",
        parent: "shop",
        text: "A payment provider charges the card.",
        sources: ["README.md"],
        c4: { kind: "system", name: "Payments", external: true },
      },
    ],
    relations: [
      { from: "buyer", to: "web", kind: "uses", link: "orders in" },
      {
        from: "checkout",
        to: "pay",
        kind: "uses",
        link: "charges via",
        technology: "HTTPS",
      },
      {
        from: "web",
        to: "db",
        kind: "uses",
        link: "stores orders in",
        technology: "SQL",
      },
    ],
  };
}

describe("knowledge map: C4 elements and links", () => {
  it("accepts C4 facets, uses links with labels, and resolves hosts", () => {
    const result = validateKnowledgeMap(c4Map(), { sourceExists: () => true });
    expect(result.issues).toEqual([]);
    const statements = new Map<string, KnowledgeStatement>(
      (result.map as KnowledgeMap).statements.map((s) => [s.id, s]),
    );
    expect(c4HostOf(statements, "web")).toBe("shop");
    // A database below a container still sits in the system, not the container.
    expect(c4HostOf(statements, "db")).toBe("shop");
    expect(c4HostOf(statements, "checkout")).toBe("web");
    expect(c4HostOf(statements, "pay")).toBeUndefined();
    expect(result.map?.relations[1]).toMatchObject({
      kind: "uses",
      link: "charges via",
      technology: "HTTPS",
    });
  });

  it("checks C4 kinds, names, technology and the external flag", () => {
    const map = c4Map();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[0].c4 = { kind: "robot", name: "Shop" };
    statements[1].c4 = {
      kind: "person",
      name: "x".repeat(MAX_C4_NAME_LENGTH + 1),
    };
    statements[2].c4 = {
      kind: "container",
      name: "Web",
      technology: "t".repeat(MAX_TECHNOLOGY_LENGTH + 1),
    };
    statements[5].c4 = { kind: "system", name: "Payments", external: "yes" };
    const messages = errors(map);
    expect(messages.some((m) => m.includes('"c4.kind"'))).toBe(true);
    expect(messages.some((m) => m.includes('"c4.name"'))).toBe(true);
    expect(messages.some((m) => m.includes('"c4.technology"'))).toBe(true);
    expect(messages.some((m) => m.includes('"c4.external"'))).toBe(true);
  });

  it("requires a place to sit for internal containers and components", () => {
    const map = c4Map();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[0].c4 = undefined;
    delete statements[0].c4;
    statements[4].c4 = { kind: "component", name: "Checkout", within: "pay" };
    statements[5].c4 = {
      kind: "system",
      name: "Payments",
      external: true,
      within: "shop",
    };
    const messages = errors(map);
    expect(messages.some((m) => m.includes("has no system to sit in"))).toBe(
      true,
    );
    expect(
      messages.some((m) => m.includes("must name a container or database")),
    ).toBe(true);
    expect(messages.some((m) => m.includes("only for containers"))).toBe(true);
  });

  it("checks relation links and technology", () => {
    const map = c4Map();
    map.relations = [
      {
        from: "buyer",
        to: "web",
        kind: "uses",
        link: "l".repeat(MAX_LINK_PHRASE_LENGTH + 1),
      },
      { from: "web", to: "db", kind: "uses", technology: "two\nlines" },
    ];
    const messages = errors(map);
    expect(messages.some((m) => m.includes("linking phrase"))).toBe(true);
    expect(messages.some((m) => m.includes("relation technology"))).toBe(true);
  });

  it("lets a C4 box take its name from the label", () => {
    const map = c4Map();
    const statements = map.statements as Array<Record<string, unknown>>;
    statements[2].c4 = { kind: "container", technology: "React" };
    expect(errors(map)).toEqual([]);
  });

  it("requires what every view draws: labels, links and uses phrases", () => {
    const map = c4Map();
    const statements = map.statements as Array<Record<string, unknown>>;
    delete statements[2].label;
    delete statements[1].link;
    const relations = map.relations as Array<Record<string, unknown>>;
    delete relations[0].link;
    const messages = errors(map);
    expect(messages.some((m) => m.includes('needs a "label"'))).toBe(true);
    expect(messages.some((m) => m.includes('needs a "link"'))).toBe(true);
    expect(messages.some((m) => m.includes('without a "link" phrase'))).toBe(
      true,
    );
    // The root needs no link, and a non-uses link without a phrase only warns.
    const fine = c4Map();
    (fine.relations as Array<Record<string, unknown>>).push({
      from: "buyer",
      to: "pay",
      kind: "because",
    });
    const result = validateKnowledgeMap(fine, { sourceExists: () => true });
    expect(result.map).not.toBeNull();
    expect(result.issues).toEqual([
      expect.objectContaining({ level: "warning", id: "buyer" }),
    ]);
  });
});

describe("knowledge map: JSON-LD and schema", () => {
  const schema = JSON.parse(
    readFileSync(join(REPO_ROOT, "docs/knowledge-map/map.schema.json"), "utf8"),
  );

  it("maps every field to RDF and keeps $schema out of the graph", () => {
    const context = KNOWLEDGE_MAP_CONTEXT as Record<string, unknown>;
    expect(context["@vocab"]).toMatch(/^https:\/\//);
    expect(context.$schema).toBeNull();
    expect(context.id).toBe("@id");
    for (const term of ["root", "parent", "within", "from", "to"]) {
      expect(context[term], term).toMatchObject({ "@type": "@id" });
    }
    expect(context.parent).toMatchObject({ "@id": "skos:broader" });
  });

  it("writes the context and schema link, and ZAM's map carries both", () => {
    const raw = JSON.parse(
      readFileSync(join(REPO_ROOT, "docs/knowledge-map/map.json"), "utf8"),
    );
    expect(raw.$schema).toBe(KNOWLEDGE_MAP_SCHEMA_URL);
    expect(raw["@context"]).toEqual(KNOWLEDGE_MAP_CONTEXT);
    expect(schema.$id).toBe(KNOWLEDGE_MAP_SCHEMA_URL);
  });

  it("keeps the published schema in step with the validator", () => {
    const defs = schema.$defs;
    expect(defs.relation.properties.kind.enum).toEqual([...RELATION_KINDS]);
    expect(defs.c4.properties.kind.enum).toEqual([...C4_KINDS]);
    expect(defs.statement.properties.text.maxLength).toBe(MAX_STATEMENT_LENGTH);
    expect(defs.c4.properties.name.maxLength).toBe(MAX_C4_NAME_LENGTH);
    expect(defs.c4.properties.technology.maxLength).toBe(MAX_TECHNOLOGY_LENGTH);
    expect(defs.relation.properties.link.maxLength).toBe(
      MAX_LINK_PHRASE_LENGTH,
    );
    expect(defs.statement.properties.label.maxLength).toBe(
      MAX_CONCEPT_LABEL_LENGTH,
    );
    expect(defs.statement.properties.link.maxLength).toBe(
      MAX_LINK_PHRASE_LENGTH,
    );
    const words = (n: number) => `^\\S+(\\s+\\S+){0,${n - 1}}$`;
    expect(defs.statement.properties.label.pattern).toBe(
      words(MAX_CONCEPT_LABEL_WORDS),
    );
    expect(defs.statement.properties.link.pattern).toBe(
      words(MAX_LINK_PHRASE_WORDS),
    );
    expect(defs.relation.properties.link.pattern).toBe(
      words(MAX_LINK_PHRASE_WORDS),
    );
    expect(defs.statement.required).toContain("label");
    expect(defs.statement.dependentRequired).toEqual({ parent: ["link"] });
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
    const onDisk = JSON.parse(readFileSync(written.path, "utf8"));
    expect(Object.keys(onDisk).slice(0, 2)).toEqual(["$schema", "@context"]);
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

  it("never falls back to the server's working directory", async () => {
    setKnowledgeMapConfig({ enabled: true });
    const { client, server } = await connect();
    // The test client reports no workspace roots.
    const guide = await client.callTool({
      name: "zam_knowledge_map_guide",
      arguments: {},
    });
    expect(guide.structuredContent).toMatchObject({ repo_root: null });

    const refused = await client.callTool({
      name: "zam_knowledge_map_write",
      arguments: { map: smallMap() },
    });
    expect(refused.isError).toBe(true);
    expect(
      existsSync(join(process.cwd(), "docs", "knowledge-map", "map.json")) &&
        readFileSync(
          join(process.cwd(), "docs", "knowledge-map", "map.json"),
          "utf8",
        ).includes('"demo"'),
    ).toBe(false);
    expect(getKnowledgeMapConfig().repoPath).toBeUndefined();

    // A relative repo_root is stored as an absolute path.
    const relativeRoot = relative(process.cwd(), dir);
    const written = await client.callTool({
      name: "zam_knowledge_map_write",
      arguments: { repo_root: relativeRoot, map: smallMap() },
    });
    expect(written.structuredContent).toMatchObject({ ok: true });
    expect(getKnowledgeMapConfig().repoPath).toBe(dir);

    await client.close();
    await server.close();
  });
});

describe("knowledge map: workspace roots", () => {
  it("lists file roots in the client's order and skips others", () => {
    const a = mkdtempSync(join(tmpdir(), "zam-km-a-"));
    const b = mkdtempSync(join(tmpdir(), "zam-km-b-"));
    try {
      expect(
        rootDirsFromUris([
          "https://example.com",
          pathToFileURL(a).href,
          pathToFileURL(b).href,
        ]),
      ).toEqual([a, b]);
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});
