import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getSetting,
  getSettings,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

describe("getSettings (batched read)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-user-settings-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://localhost:11434");
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns present values and omits absent ones", async () => {
    const values = await getSettings(db, [
      "llm.enabled",
      "llm.url",
      "llm.model",
      "system.locale",
    ]);
    expect(values).toEqual({
      "llm.enabled": "true",
      "llm.url": "http://localhost:11434",
      "llm.model": undefined,
      "system.locale": undefined,
    });
  });

  it("agrees with getSetting for every requested key", async () => {
    const keys = ["llm.enabled", "llm.model", "missing.key"];
    const batched = await getSettings(db, keys);
    for (const key of keys) {
      expect(batched[key]).toBe(await getSetting(db, key));
    }
  });

  it("handles an empty key list without a query", async () => {
    expect(await getSettings(db, [])).toEqual({});
  });
});
