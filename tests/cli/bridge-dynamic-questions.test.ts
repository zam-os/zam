import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, setSetting } from "../../src/kernel/index.js";

/**
 * `llm.dynamic_questions` has gated the per-review question rewrite since
 * ADR 2026-06-15, but nothing could write it: it was missing from the bridge's
 * allowlist, so the only way to turn it off was editing the database row by
 * hand. `get-settings` did not report it either, so no surface could show its
 * state. These tests pin both halves of the round trip.
 */
describe("bridge dynamic-question setting", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let dbPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-dq-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-dq-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    dbPath = join(dataDir, "zam.db");
    const db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "test-user");
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): { recall?: { dynamicQuestions?: boolean } } {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: "utf8",
    });
    return JSON.parse(output);
  }

  it("reports the rewrite as on when nothing is stored", () => {
    // Absent must read as on, matching ensureHighQualityQuestion's `!== "false"`.
    expect(runBridge(["get-settings"]).recall?.dynamicQuestions).toBe(true);
  });

  it("turns the rewrite off and reports it back", () => {
    runBridge(["setting-set", "--key", "llm.dynamic_questions", "--value", "false"]);
    expect(runBridge(["get-settings"]).recall?.dynamicQuestions).toBe(false);
  });

  it("turns it back on again", () => {
    runBridge(["setting-set", "--key", "llm.dynamic_questions", "--value", "false"]);
    runBridge(["setting-set", "--key", "llm.dynamic_questions", "--value", "true"]);
    expect(runBridge(["get-settings"]).recall?.dynamicQuestions).toBe(true);
  });

  it("still refuses settings that are not on the allowlist", () => {
    // Widening the allowlist must not have turned it into a general escape
    // hatch — secrets and structured provider config keep their own commands.
    expect(() =>
      runBridge(["setting-set", "--key", "llm.api_key", "--value", "sk-leak"]),
    ).toThrow();
  });
});
