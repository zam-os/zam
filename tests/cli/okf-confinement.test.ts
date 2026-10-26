/**
 * ADR 2026-10-08b D1 at the MCP surface: OKF and knowledge-map tools work only
 * inside the client's roots and the learner's trusted folders, and an article
 * write can never become an agent instruction file.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ListRootsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import { upsertArticle } from "../../src/cli/okf/io.js";
import {
  addTrustedFolder,
  type Database,
  getTrustedFolders,
  openDatabase,
  removeTrustedFolder,
} from "../../src/kernel/index.js";

function article(title: string): string {
  return [
    "---",
    "type: architecture",
    `title: ${title}`,
    "description: A test article.",
    "tags:",
    "  - test",
    "timestamp: 2026-10-10T00:00:00Z",
    "---",
    "",
    "Body.",
    "",
  ].join("\n");
}

describe("OKF tools stay inside allowed roots (ADR 2026-10-08b D1)", () => {
  let base: string;
  let repo: string;
  let bundle: string;
  let outsideDir: string;
  let db: Database;
  let server: ReturnType<typeof createMcpServer>;
  let client: Client;
  let reportedRoots: string[];
  const saved: Record<string, string | undefined> = {};

  beforeEach(async () => {
    base = realpathSync.native(mkdtempSync(join(tmpdir(), "zam-okf-d1-")));
    reportedRoots = [];
    saved.ZAM_CONFIG_PATH = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(base, "config.json");
    repo = join(base, "repo");
    bundle = join(repo, "docs", "okf");
    outsideDir = join(base, "outside");
    mkdirSync(join(repo, ".git"), { recursive: true });
    mkdirSync(join(repo, "src"), { recursive: true });
    mkdirSync(bundle, { recursive: true });
    mkdirSync(join(outsideDir, "docs", "okf"), { recursive: true });
    upsertArticle(bundle, "first.md", article("First"));
    upsertArticle(
      join(outsideDir, "docs", "okf"),
      "theirs.md",
      article("Theirs"),
    );
    writeFileSync(join(outsideDir, "secret.md"), "outside secret");

    db = await openDatabase({
      dbPath: join(base, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: { roots: { listChanged: true } } },
    );
    client.setRequestHandler(ListRootsRequestSchema, async () => ({
      roots: reportedRoots.map((root) => ({ uri: pathToFileURL(root).href })),
    }));
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
    rmSync(base, { recursive: true, force: true });
  });

  async function call(name: string, args: Record<string, unknown>) {
    const response = (await client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };
    return {
      isError: response.isError === true,
      text: response.content[0].text,
    };
  }

  function git(...args: string[]) {
    return execFileSync(
      "git",
      [
        "-c",
        "core.fsmonitor=false",
        "-c",
        `core.hooksPath=${join(base, "no-hooks")}`,
        "-c",
        "user.name=ZAM Test",
        "-c",
        "user.email=zam-test@example.invalid",
        "-C",
        repo,
        ...args,
      ],
      { stdio: "pipe" },
    );
  }

  it("upserts a client's registered worktree bundle under a hidden host directory", async () => {
    git("init", "-q");
    git("commit", "--allow-empty", "-qm", "seed");
    const linked = join(base, ".codex", "worktrees", "lesson");
    git("worktree", "add", "--detach", linked, "HEAD");
    reportedRoots = [repo];
    const linkedBundle = join(linked, "docs", "okf");
    const written = await call("zam_okf_upsert", {
      bundle_dir: linkedBundle,
      file: "worktree.md",
      markdown: article("Worktree"),
    });
    expect(written.isError, written.text).toBe(false);
    expect(readFileSync(join(linkedBundle, "worktree.md"), "utf8")).toContain(
      "title: Worktree",
    );
    const read = await call("zam_okf_read", {
      bundle_dir: linkedBundle,
      file: "worktree.md",
    });
    expect(read.isError, read.text).toBe(false);
    expect(getTrustedFolders()).toEqual([]);
    const refused = await call("zam_okf_upsert", {
      bundle_dir: join(outsideDir, "docs", "okf"),
      file: "worktree.md",
      markdown: article("Outside"),
    });
    expect(refused.isError).toBe(true);
    expect(existsSync(join(outsideDir, "docs", "okf", "worktree.md"))).toBe(
      false,
    );
  });

  it("sees a newly registered worktree in the same MCP connection without storing extra trust", async () => {
    git("init", "-q");
    git("commit", "--allow-empty", "-qm", "seed");
    addTrustedFolder(repo);
    const before = readFileSync(process.env.ZAM_CONFIG_PATH!, "utf8");
    expect((await call("zam_okf_catalog", {})).isError).toBe(false);
    const linked = join(base, "later-checkout");
    git("worktree", "add", "--detach", linked, "HEAD");
    const written = await call("zam_okf_upsert", {
      bundle_dir: join(linked, "docs", "okf"),
      file: "later.md",
      markdown: article("Later"),
    });
    expect(written.isError, written.text).toBe(false);
    expect(getTrustedFolders()).toEqual([repo]);
    expect(readFileSync(process.env.ZAM_CONFIG_PATH!, "utf8")).toBe(before);
  });

  it.each(["client", "trusted"])(
    "keeps the default bundle at the %s root when only a linked worktree has one",
    async (source) => {
      git("init", "-q");
      git("commit", "--allow-empty", "-qm", "seed");
      const linked = join(base, ".codex", "worktrees", "lesson");
      git("worktree", "add", "--detach", linked, "HEAD");
      const linkedBundle = join(linked, "docs", "okf");
      upsertArticle(linkedBundle, "linked.md", article("Linked"));
      rmSync(bundle, { recursive: true });
      if (source === "client") reportedRoots = [repo];
      else addTrustedFolder(repo);

      const missing = await call("zam_okf_catalog", {});
      expect(missing.isError, missing.text).toBe(true);
      expect(JSON.parse(missing.text).error).toContain(bundle);

      const written = await call("zam_okf_upsert", {
        file: "default.md",
        markdown: article("Default"),
      });
      expect(written.isError, written.text).toBe(false);
      expect(existsSync(join(bundle, "default.md"))).toBe(true);
      expect(existsSync(join(linkedBundle, "default.md"))).toBe(false);
      const catalog = await call("zam_okf_catalog", {});
      expect(catalog.isError, catalog.text).toBe(false);
      expect(JSON.parse(catalog.text).dir).toBe(bundle);

      const explicit = await call("zam_okf_catalog", {
        bundle_dir: linkedBundle,
      });
      expect(explicit.isError, explicit.text).toBe(false);
      expect(JSON.parse(explicit.text).dir).toBe(linkedBundle);

      if (source === "client") reportedRoots = [linked];
      else {
        removeTrustedFolder(repo);
        addTrustedFolder(linked);
      }
      const selected = await call("zam_okf_catalog", {});
      expect(selected.isError, selected.text).toBe(false);
      expect(JSON.parse(selected.text).dir).toBe(linkedBundle);
    },
  );

  it("refuses every bundle while nothing is trusted and no root is reported", async () => {
    const res = await call("zam_okf_catalog", {});
    expect(res.isError).toBe(true);
    expect(res.text).toMatch(/no workspace folder.*trust its folder/s);
  });

  it("reads and writes the trusted repository's bundle", async () => {
    addTrustedFolder(repo);
    const catalog = await call("zam_okf_catalog", {});
    expect(catalog.isError).toBe(false);
    expect(
      JSON.parse(catalog.text).articles ?? JSON.parse(catalog.text),
    ).toBeDefined();

    const written = await call("zam_okf_upsert", {
      file: "second.md",
      markdown: article("Second"),
    });
    expect(written.isError).toBe(false);
    expect(existsSync(join(bundle, "second.md"))).toBe(true);
  });

  it("refuses a bundle outside every root", async () => {
    addTrustedFolder(repo);
    const read = await call("zam_okf_read", {
      bundle_dir: join(outsideDir, "docs", "okf"),
      file: "theirs.md",
    });
    expect(read.isError).toBe(true);
    expect(read.text).toMatch(/outside the folders ZAM may read/);

    const write = await call("zam_okf_upsert", {
      bundle_dir: join(outsideDir, "docs", "okf"),
      file: "planted.md",
      markdown: article("Planted"),
    });
    expect(write.isError).toBe(true);
    expect(existsSync(join(outsideDir, "docs", "okf", "planted.md"))).toBe(
      false,
    );
  });

  it.each(["CLAUDE.md", "AGENTS.md", "gemini.md", "README.md"])(
    "never writes the instruction file %s",
    async (file) => {
      addTrustedFolder(repo);
      const res = await call("zam_okf_upsert", {
        file,
        markdown: article("Instructions"),
      });
      expect(res.isError).toBe(true);
      expect(existsSync(join(bundle, file))).toBe(false);
    },
  );

  it("never writes into a root itself or a folder that is no knowledge base", async () => {
    addTrustedFolder(repo);
    for (const dir of [repo, join(repo, "src")]) {
      const res = await call("zam_okf_upsert", {
        bundle_dir: dir,
        file: "note.md",
        markdown: article("Note"),
      });
      expect(res.isError, dir).toBe(true);
      expect(existsSync(join(dir, "note.md")), dir).toBe(false);
      expect(existsSync(join(dir, "index.md")), dir).toBe(false);
    }
  });

  it("starts a new knowledge base only at docs/okf under a root", async () => {
    const fresh = join(base, "fresh");
    mkdirSync(fresh);
    addTrustedFolder(fresh);
    const res = await call("zam_okf_upsert", {
      bundle_dir: join(fresh, "docs", "okf"),
      file: "start.md",
      markdown: article("Start"),
    });
    expect(res.isError).toBe(false);
    expect(existsSync(join(fresh, "docs", "okf", "start.md"))).toBe(true);
  });

  it("takes an existing Docs/okf for docs/okf where the volume ignores case", async () => {
    const fresh = join(base, "cased");
    mkdirSync(join(fresh, "Docs", "okf"), { recursive: true });
    // Only meaningful where `docs` and `Docs` are the same folder (default
    // APFS, NTFS); a case-sensitive volume has no such folder to confuse.
    if (!existsSync(join(fresh, "docs"))) return;
    addTrustedFolder(fresh);
    const res = await call("zam_okf_upsert", {
      bundle_dir: join(fresh, "docs", "okf"),
      file: "start.md",
      markdown: article("Start"),
    });
    expect(res.isError, res.text).toBe(false);
    expect(existsSync(join(fresh, "Docs", "okf", "start.md"))).toBe(true);
  });

  it("does not read an article that links out of the bundle", async () => {
    addTrustedFolder(repo);
    symlinkSync(join(outsideDir, "secret.md"), join(bundle, "linked.md"));
    const read = await call("zam_okf_read", { file: "linked.md" });
    expect(read.isError).toBe(true);
    expect(read.text).not.toContain("outside secret");
    const catalog = await call("zam_okf_catalog", {});
    expect(catalog.text).toContain(
      "linked.md: links to a file outside the bundle",
    );
    expect(catalog.text).not.toContain("outside secret");
  });

  it("keeps citations inside an allowed root", async () => {
    addTrustedFolder(bundle);
    // The repository root is above the trusted folder, so its ADRs are not
    // readable through a citation.
    mkdirSync(join(repo, "docs", "adr"));
    writeFileSync(join(repo, "docs", "adr", "x.md"), "adr text");
    const res = await call("zam_okf_read_citation", {
      bundle_dir: bundle,
      target: "../adr/x.md",
    });
    expect(res.isError).toBe(true);
    expect(res.text).not.toContain("adr text");
  });

  it("writes a knowledge map only inside an allowed root", async () => {
    addTrustedFolder(repo);
    const config = JSON.parse(
      readFileSync(process.env.ZAM_CONFIG_PATH!, "utf8"),
    );
    config.knowledgeMap = { enabled: true };
    writeFileSync(process.env.ZAM_CONFIG_PATH!, JSON.stringify(config));
    // A server started after the alpha switch registers the map tools.
    const alphaServer = createMcpServer(db);
    const [c, s] = InMemoryTransport.createLinkedPair();
    const alphaClient = new Client({ name: "alpha", version: "1.0.0" });
    await Promise.all([alphaClient.connect(c), alphaServer.connect(s)]);
    try {
      const tools = await alphaClient.listTools();
      expect(
        tools.tools.some((tool) => tool.name === "zam_knowledge_map_write"),
      ).toBe(true);
      const res = (await alphaClient.callTool({
        name: "zam_knowledge_map_write",
        arguments: { repo_root: outsideDir, map: {} },
      })) as { isError?: boolean; content: Array<{ text: string }> };
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toMatch(/outside the folders ZAM may read/);
      expect(existsSync(join(outsideDir, "docs", "knowledge-map"))).toBe(false);
    } finally {
      await alphaClient.close();
      await alphaServer.close();
    }
  });
});
