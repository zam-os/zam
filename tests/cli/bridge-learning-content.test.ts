import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STUDIO_BRIDGE_ALLOWED_COMMANDS } from "../../src/cli/commands/mcp.js";
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

  it("allows the Studio panel to read the three lists", () => {
    for (const command of [
      "personal-card-list",
      "list-drafts",
      "unchosen-groups",
      "unchosen-members",
      "personal-card-ensure",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command)).toBe(true);
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
});
