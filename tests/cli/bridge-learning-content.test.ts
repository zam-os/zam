import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  refusedStudioBridgeOption,
  STUDIO_BRIDGE_ALLOWED_COMMANDS,
} from "../../src/cli/commands/mcp.js";
import { upsertArticle } from "../../src/cli/okf/io.js";
import {
  createToken,
  ensureCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

const ARTICLE = "https://example.com/okf/container-images.md";

describe("zam bridge learning-content lists", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-lists-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-lists-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, "config.json"),
      JSON.stringify({
        activeWorkspaceId: "test-workspace",
        workspaces: [
          {
            id: "test-workspace",
            kind: "personal",
            path: tempCwd,
            label: "Test Workspace",
          },
        ],
      }),
      "utf8",
    );

    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    const held = await createToken(db, {
      slug: "held",
      concept: "A published card the learner holds",
      domain: "containers",
      source_link: `${ARTICLE}#held`,
    });
    await ensureCard(db, held.id, "thomas");
    const sketch = await createToken(db, {
      slug: "sketch",
      concept: "A draft the learner holds",
      domain: "notes",
      source_link: `${ARTICLE}#draft`,
      editorial_state: "draft",
    });
    await ensureCard(db, sketch.id, "thomas");
    await createToken(db, {
      slug: "loose",
      concept: "Published and not yet taken",
      domain: "notes",
    });
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runCliJson(args: string[]): any {
    return JSON.parse(
      execFileSync("node", [cliPath, ...args], {
        cwd: tempCwd,
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        input: "",
        encoding: "utf8",
      }),
    );
  }

  function runCliError(args: string[]): { status: number | null; body: any } {
    try {
      execFileSync("node", [cliPath, ...args], {
        cwd: tempCwd,
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        input: "",
        encoding: "utf8",
      });
      return { status: 0, body: null };
    } catch (err) {
      const failure = err as { stdout?: string; status?: number | null };
      return {
        status: failure.status ?? null,
        body: JSON.parse(String(failure.stdout ?? "")),
      };
    }
  }

  it("keeps drafts in the personal list unless --published-only is set", () => {
    const all = runCliJson(["bridge", "personal-card-list"]);
    expect(all.cards.map((card: { slug: string }) => card.slug).sort()).toEqual(
      ["held", "sketch"],
    );

    const published = runCliJson([
      "bridge",
      "personal-card-list",
      "--published-only",
    ]);
    expect(published.cards.map((card: { slug: string }) => card.slug)).toEqual([
      "held",
    ]);
  });

  it("returns the empty-key group for a token with no source", () => {
    const groups = runCliJson(["bridge", "unchosen-groups"]);
    expect(groups.groups).toEqual([
      { key: "", name: "", domain: "notes", itemCount: 1 },
    ]);

    const members = runCliJson(["bridge", "unchosen-members", "--key", ""]);
    expect(
      members.members.map((member: { slug: string }) => member.slug),
    ).toEqual(["loose"]);
  });

  it("refuses unchosen-members when --key is omitted", () => {
    const result = runCliError(["bridge", "unchosen-members"]);
    expect(result.status).not.toBe(0);
    expect(result.body.error).toContain("--key is required");
  });

  it("allows the Studio panel the lists and a workspace read, and nothing by path (D11)", () => {
    for (const command of [
      "personal-card-list",
      "list-drafts",
      "unchosen-groups",
      "unchosen-members",
      "personal-card-ensure",
      "learning-content-source",
      "learning-content-workspace",
      "knowledge-map-feature",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command), command).toBe(true);
    }
    for (const command of [
      "learning-content-browse",
      "knowledge-map",
      "knowledge-map-feedback",
      "curriculum-list-providers",
      "curriculum-list-level",
      "curriculum-get-last-selection",
      "curriculum-set-last-selection",
      "curriculum-topic-readiness",
      "curriculum-list-subtopics",
      "curriculum-preview-topic",
      "curriculum-confirm-topic",
      "curriculum-confirm-batch",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command), command).toBe(false);
    }
    expect(
      refusedStudioBridgeOption("learning-content-source", ["--path", "/x"]),
    ).toBe("--path");
    expect(
      refusedStudioBridgeOption("learning-content-source", ["--path=/x"]),
    ).toBe("--path=/x");
    expect(
      refusedStudioBridgeOption("knowledge-map-feature", ["--repo", "/x"]),
    ).toBe("--repo");
    expect(
      refusedStudioBridgeOption("knowledge-map-feature", ["--enable"]),
    ).toBeUndefined();
  });

  it("reads a workspace by id: its articles and map, and no other file (D11)", () => {
    const okf = join(tempCwd, "docs", "okf");
    mkdirSync(okf, { recursive: true });
    upsertArticle(
      okf,
      "hello.md",
      [
        "---",
        "type: concept",
        "title: Hello",
        "description: A test article.",
        "tags:",
        "  - test",
        'resource: "https://example.com/hello.md"',
        "timestamp: 2026-10-10T00:00:00Z",
        "---",
        "",
        "Hello body.",
        "",
      ].join("\n"),
    );
    writeFileSync(join(tempCwd, ".env"), "SECRET=1");
    mkdirSync(join(tempCwd, ".git"));
    writeFileSync(join(tempCwd, ".git", "config"), "[core]");
    const outsideDir = mkdtempSync(join(tmpdir(), "zam-outside-"));
    writeFileSync(join(outsideDir, "secret.md"), "outside secret");
    writeFileSync(join(outsideDir, "map.json"), "not json, outside secret");
    symlinkSync(join(outsideDir, "secret.md"), join(okf, "linked.md"));
    const workspace = [
      "bridge",
      "learning-content-workspace",
      "--workspace",
      "test-workspace",
    ];

    try {
      const catalog = runCliJson(workspace);
      expect(catalog.okf.found).toBe(true);
      expect(
        catalog.okf.articles.map((a: { file: string }) => a.file),
      ).toContain("hello.md");

      for (const target of ["hello.md", "docs/okf/hello.md"]) {
        const read = runCliJson([...workspace, "--target", target]);
        expect(read, target).toMatchObject({ opened: true, kind: "okf" });
        expect(read.body).toContain("Hello body.");
      }
      for (const target of [
        ".env",
        ".git/config",
        "docs/adr/x.md",
        "../x.md",
      ]) {
        const read = runCliJson([...workspace, "--target", target]);
        expect(read.opened, target).toBe(false);
        expect(read.reason, target).toBe("desktop");
        expect(read.body, target).toBeUndefined();
      }
      const linked = runCliJson([...workspace, "--target", "linked.md"]);
      expect(linked).toMatchObject({ opened: false, reason: "outside" });
      expect(JSON.stringify(linked)).not.toContain("outside secret");
      const absolute = runCliJson([
        ...workspace,
        "--target",
        join(tempCwd, ".env"),
      ]);
      expect(absolute).toMatchObject({ opened: false, reason: "outside" });

      expect(runCliJson([...workspace, "--map"])).toMatchObject({
        found: false,
        map: null,
      });
      mkdirSync(join(tempCwd, "docs", "knowledge-map"), { recursive: true });
      symlinkSync(
        join(outsideDir, "map.json"),
        join(tempCwd, "docs", "knowledge-map", "map.json"),
      );
      const map = runCliJson([...workspace, "--map"]);
      expect(map).toMatchObject({ found: false, map: null, issues: [] });
      expect(JSON.stringify(map)).not.toContain("outside secret");

      const unknown = runCliError([
        "bridge",
        "learning-content-workspace",
        "--workspace",
        "missing",
      ]);
      expect(unknown.status).not.toBe(0);
      expect(unknown.body.error).toContain("No configured workspace");
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  it("creates one card for a published token and refuses a draft", () => {
    const taken = runCliJson([
      "bridge",
      "personal-card-ensure",
      "--slug",
      "loose",
    ]);
    expect(taken).toMatchObject({
      success: true,
      slug: "loose",
      created: true,
    });

    const again = runCliJson([
      "bridge",
      "personal-card-ensure",
      "--slug",
      "loose",
    ]);
    expect(again.created).toBe(false);
    expect(again.cardId).toBe(taken.cardId);

    const published = runCliJson([
      "bridge",
      "personal-card-list",
      "--published-only",
    ]);
    expect(
      published.cards.map((card: { slug: string }) => card.slug).sort(),
    ).toEqual(["held", "loose"]);

    const draft = runCliError([
      "bridge",
      "personal-card-ensure",
      "--slug",
      "sketch",
    ]);
    expect(draft.status).not.toBe(0);
    expect(draft.body.error).toContain("Only a published token can be taken");

    const missing = runCliError([
      "bridge",
      "personal-card-ensure",
      "--slug",
      "missing",
    ]);
    expect(missing.status).not.toBe(0);
    expect(missing.body.error).toContain("Token not found");
  });

  it("remembers a folder Quelle and leaves the registry and knowledge map alone", () => {
    const configPath = join(tempHome, ".zam", "config.json");
    const before = JSON.parse(readFileSync(configPath, "utf8"));
    before.knowledgeMap = { enabled: true, repoPath: "/keep/me" };
    writeFileSync(configPath, JSON.stringify(before));

    const read = runCliJson(["bridge", "learning-content-source"]);
    expect(read.stored).toBeNull();
    expect(read.selection).toMatchObject({
      kind: "workspace",
      id: "test-workspace",
      missing: false,
    });
    expect(read.workspaces).toHaveLength(1);
    expect(
      JSON.parse(readFileSync(configPath, "utf8")).learningContent,
    ).toBeUndefined();

    const missingDir = join(tempHome, "not-a-workspace");
    const picked = runCliJson([
      "bridge",
      "learning-content-source",
      "--kind",
      "folder",
      "--path",
      missingDir,
    ]);
    expect(picked.selection).toMatchObject({
      kind: "folder",
      path: missingDir,
      missing: true,
    });
    expect(picked.workspaces).toEqual(read.workspaces);

    const saved = JSON.parse(readFileSync(configPath, "utf8"));
    expect(saved.workspaces).toHaveLength(1);
    expect(saved.knowledgeMap).toEqual({ enabled: true, repoPath: "/keep/me" });
    expect(saved.learningContent).toEqual({
      source: { kind: "folder", path: missingDir },
    });

    const unknown = runCliError([
      "bridge",
      "learning-content-source",
      "--kind",
      "workspace",
      "--id",
      "missing",
    ]);
    expect(unknown.status).not.toBe(0);
    expect(unknown.body.error).toContain("Workspace not found: missing");
    expect(
      JSON.parse(readFileSync(configPath, "utf8")).learningContent.source.kind,
    ).toBe("folder");
  });

  it("reads a file inside a Quelle and does not write the machine config", () => {
    const configPath = join(tempHome, ".zam", "config.json");
    const before = readFileSync(configPath, "utf8");
    writeFileSync(join(tempCwd, "note.txt"), "hello");
    const listed = runCliJson([
      "bridge",
      "learning-content-browse",
      "--repo",
      tempCwd,
    ]);
    expect(listed.okf).toEqual({ found: false });
    expect(listed.skillSource).toBe(false);
    const note = runCliJson([
      "bridge",
      "learning-content-browse",
      "--repo",
      tempCwd,
      "--target",
      "note.txt",
    ]);
    expect(note).toMatchObject({ opened: true, kind: "text", body: "hello" });
    const outside = runCliJson([
      "bridge",
      "learning-content-browse",
      "--repo",
      tempCwd,
      "--target",
      "../note.txt",
    ]);
    expect(outside.opened).toBe(false);
    expect(outside.body).toBeUndefined();
    expect(readFileSync(configPath, "utf8")).toBe(before);
  });
});
