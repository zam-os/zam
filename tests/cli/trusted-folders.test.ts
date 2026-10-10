/**
 * ADR 2026-10-08b D1: trusted folders for learners, and the upgrade check
 * that offers to trust the knowledge bases existing cards link into.
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import { upsertArticle } from "../../src/cli/okf/io.js";
import { suggestTrustedFolders } from "../../src/cli/trusted-folders.js";
import {
  addTrustedFolder,
  createToken,
  type Database,
  getTrustedFolders,
  openDatabase,
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

describe("trusted folders and the upgrade check", () => {
  let base: string;
  let repo: string;
  let plain: string;
  let db: Database;
  let previousConfigPath: string | undefined;

  beforeEach(async () => {
    base = realpathSync.native(mkdtempSync(join(tmpdir(), "zam-trust-cli-")));
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(base, "config.json");
    repo = join(base, "repo");
    plain = join(base, "plain");
    mkdirSync(join(repo, ".git"), { recursive: true });
    mkdirSync(plain);
    upsertArticle(join(repo, "docs", "okf"), "topic.md", article("Topic"));
    db = await openDatabase({
      dbPath: join(base, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const link = (slug: string, sourceLink: string) =>
      createToken(db, {
        slug,
        concept: `${slug} concept`,
        domain: "test",
        bloom_level: 2,
        source_link: sourceLink,
      });
    await link("a", `${join(repo, "docs", "okf", "topic.md")}#overview`);
    await link("b", pathToFileURL(join(repo, "docs", "okf", "topic.md")).href);
    // Not a knowledge base: a card pointing at an arbitrary file never turns
    // into an offer to trust its folder.
    await link("c", join(plain, "notes.md"));
    await link("d", "https://example.com/page");
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(base, { recursive: true, force: true });
  });

  it("offers the repositories whose knowledge bases cards link into", async () => {
    expect(await suggestTrustedFolders(db)).toEqual([
      { folder: repo, cards: 2 },
    ]);
    addTrustedFolder(repo);
    expect(await suggestTrustedFolders(db)).toEqual([]);
  });

  it("lets desktop Settings list, add, remove and accept the offer", async () => {
    const run = (cmd: string, args: string[] = []) =>
      executeBridgeCommandJson(cmd, args, { database: db });

    expect(await run("trusted-folders")).toEqual({
      folders: [],
      suggestions: [{ folder: repo, cards: 2 }],
    });
    expect(await run("trusted-folder-add-suggested")).toEqual({
      added: [repo],
    });
    expect(await run("trusted-folder-add", ["--dir", plain])).toEqual({
      folder: plain,
    });
    expect(getTrustedFolders()).toEqual([repo, plain]);
    expect(await run("trusted-folder-remove", ["--dir", plain])).toEqual({
      removed: true,
    });
    expect(await run("trusted-folders")).toEqual({
      folders: [repo],
      suggestions: [],
    });
  });

  it("refuses to trust the home folder through the bridge", async () => {
    await expect(
      executeBridgeCommandJson("trusted-folder-add", ["--dir", "/"], {
        database: db,
      }),
    ).rejects.toThrow(/does not trust/);
    expect(getTrustedFolders()).toEqual([]);
  });
});
