import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

const ARTICLE = "https://example.com/okf/container-images.md";

describe("zam bridge library-topics-list / library-topic-start", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-topics-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-topics-cwd-"));
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
      slug: "image-layer",
      concept: "An image is a stack of read-only layers",
      domain: "containers",
      source_link: `${ARTICLE}#layers`,
    });
    await createToken(db, {
      slug: "image-tag",
      concept: "A tag is a movable name for an image digest",
      domain: "containers",
      source_link: `${ARTICLE}#tags`,
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

  it("lists a topic, starts it, and reports the learner's own coverage", () => {
    const before = runCliJson(["bridge", "library-topics-list"]);
    expect(before).toEqual({
      success: true,
      topics: [
        {
          key: ARTICLE,
          name: "Container images",
          domain: "containers",
          itemCount: 2,
          heldCount: 0,
          setAsideCount: 0,
        },
      ],
    });

    const started = runCliJson([
      "bridge",
      "library-topic-start",
      "--key",
      ARTICLE,
    ]);
    expect(started).toEqual({
      success: true,
      key: ARTICLE,
      name: "Container images",
      itemCount: 2,
      created: 2,
      alreadyHeld: 0,
      setAside: 0,
    });

    const after = runCliJson(["bridge", "library-topics-list"]);
    expect(after.topics[0]).toMatchObject({ itemCount: 2, heldCount: 2 });
  });

  it("answers an unknown topic with a JSON error", () => {
    let output = "";
    let status: number | null = 0;
    try {
      execFileSync(
        "node",
        [
          cliPath,
          "bridge",
          "library-topic-start",
          "--key",
          "https://example.com/none",
        ],
        {
          cwd: tempCwd,
          env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
          input: "",
          encoding: "utf8",
        },
      );
    } catch (err) {
      const failure = err as { stdout?: string; status?: number | null };
      output = String(failure.stdout ?? "");
      status = failure.status ?? null;
    }
    expect(status).not.toBe(0);
    expect(JSON.parse(output).error).toContain("Library topic not found");
  });
});
