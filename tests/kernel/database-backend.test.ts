import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/kernel/index.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("local database backend", () => {
  it("opens and persists a local SQLite database without libsql features", async () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-local-sqlite-"));
    tempDirs.push(dir);
    const dbPath = join(dir, "zam.db");

    const first = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    await first
      .prepare("INSERT INTO user_config (key, value) VALUES (?, ?)")
      .run("arm64.test", "ready");
    await first.close();

    const second = await openDatabase({
      dbPath,
      useConfiguredCloud: false,
    });
    const row = (await second
      .prepare("SELECT value FROM user_config WHERE key = ?")
      .get("arm64.test")) as { value: string };

    expect(row.value).toBe("ready");
    expect(await second.pragma("journal_mode")).toEqual([
      { journal_mode: "wal" },
    ]);
    await second.close();
  });
});
