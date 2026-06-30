import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ghRepoCreateArgs,
  gitRemoteArgs,
} from "../../src/cli/commands/workspace.js";
import { backupDatabaseTo } from "../../src/cli/workspaces/backup.js";
import {
  createToken,
  getTokenBySlug,
  openDatabase,
} from "../../src/kernel/index.js";

const dirs: string[] = [];
function tmp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("workspace publish command arguments", () => {
  it("passes gh repo creation inputs as argv segments", () => {
    expect(ghRepoCreateArgs("name; touch nope", "--private")).toEqual([
      "repo",
      "create",
      "name; touch nope",
      "--private",
      "--source=.",
      "--push",
    ]);
  });

  it("passes remote URLs as a single git argv segment", () => {
    expect(
      gitRemoteArgs("git@github.com:user/repo.git; touch nope", false),
    ).toEqual([
      "remote",
      "add",
      "origin",
      "git@github.com:user/repo.git; touch nope",
    ]);
    expect(gitRemoteArgs("git@github.com:user/repo.git", true)).toEqual([
      "remote",
      "set-url",
      "origin",
      "git@github.com:user/repo.git",
    ]);
  });
});

describe("workspace database backup", () => {
  it("writes a VACUUM INTO snapshot in zam-backups/ that contains the data", async () => {
    const srcDir = tmp("zam-bk-src-");
    const wsDir = tmp("zam-bk-ws-");

    const db = await openDatabase({
      dbPath: join(srcDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const slug = `bk-${Date.now()}`;
    await createToken(db, {
      slug,
      concept: "Backup test concept",
      domain: "ops",
      bloom_level: 2,
    });

    const dest = await backupDatabaseTo(db, wsDir);
    await db.close();

    expect(dest.startsWith(join(wsDir, "zam-backups"))).toBe(true);
    expect(existsSync(dest)).toBe(true);

    // The backup is a standalone, valid SQLite DB holding the seeded token.
    const restored = await openDatabase({
      dbPath: dest,
      useConfiguredCloud: false,
    });
    try {
      const token = await getTokenBySlug(restored, slug);
      expect(token?.concept).toBe("Backup test concept");
    } finally {
      await restored.close();
    }
  });
});
