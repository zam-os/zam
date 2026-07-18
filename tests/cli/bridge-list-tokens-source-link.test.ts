import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createToken, openDatabase, setSetting } from "../../src/kernel/index.js";

const BASE_A = "https://example.com/okf/output-contract";
const BASE_B = "https://example.com/okf/queue-design";

describe("zam bridge list-tokens --source-link-base", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-slb-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-slb-cwd-"));
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
    await createToken(db, {
      slug: "from-article-a",
      concept: "From article A",
      source_link: `${BASE_A}#json-only`,
    });
    await createToken(db, {
      slug: "from-article-b",
      concept: "From article B",
      source_link: BASE_B,
    });
    await createToken(db, { slug: "unrelated", concept: "Unrelated" });
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

  it("filters by one base and OR-s repeated flags", () => {
    const one = runCliJson([
      "bridge",
      "list-tokens",
      "--source-link-base",
      BASE_A,
    ]);
    expect(one.tokens.map((t: any) => t.slug)).toEqual(["from-article-a"]);

    const both = runCliJson([
      "bridge",
      "list-tokens",
      "--source-link-base",
      BASE_A,
      "--source-link-base",
      BASE_B,
    ]);
    expect(both.tokens.map((t: any) => t.slug).sort()).toEqual([
      "from-article-a",
      "from-article-b",
    ]);
  });

  it("omitting the flag keeps the unfiltered listing", () => {
    const all = runCliJson(["bridge", "list-tokens"]);
    expect(all.tokens.length).toBe(3);
  });
});
