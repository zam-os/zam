import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/kernel/index.js";

describe("curriculum bridge import helpers", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-curriculum-import-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-curriculum-import-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    mkdirSync(join(tempHome, ".zam"), { recursive: true });

    const db = await openDatabase({
      dbPath: join(tempHome, ".zam", "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'test-user')",
      )
      .run();
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  });

  function runBridge(args: string[]): unknown {
    const env = { ...process.env, USERPROFILE: tempHome, HOME: tempHome };
    const out = execFileSync("node", [cliPath, "bridge", ...args], {
      env,
      cwd: tempCwd,
      encoding: "utf-8",
    });
    return JSON.parse(out);
  }

  function runBridgeExpectError(args: string[]): string {
    const env = { ...process.env, USERPROFILE: tempHome, HOME: tempHome };
    try {
      execFileSync("node", [cliPath, "bridge", ...args], {
        env,
        cwd: tempCwd,
        encoding: "utf-8",
      });
      throw new Error("Expected bridge command to fail");
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      return e.stdout || e.stderr || e.message || String(err);
    }
  }

  it("personal-card-import-curriculum rejects missing text and sourceId", () => {
    const output = runBridgeExpectError([
      "personal-card-import-curriculum",
      "--domain",
      "Mathematik",
    ]);
    expect(output).toMatch(/text is required/i);
  });

  it("personal-card-import-curriculum reports missing source rows", () => {
    const output = runBridgeExpectError([
      "personal-card-import-curriculum",
      "--sourceId",
      "01MISSINGSOURCE000000000000",
      "--domain",
      "Mathematik",
    ]);
    expect(output).toMatch(/Source not found/i);
  });

  it("personal-card-import-curriculum reads curriculum text from --sourceId", async () => {
    const dbPath = join(tempHome, ".zam", "zam.db");
    const db = await openDatabase({
      dbPath,
      useConfiguredCloud: false,
    });

    const sourceId = ulid();
    const topicUri = "zam-curriculum-topic://realschule|5|mathematik#lb1";
    await db
      .prepare(
        `INSERT INTO sources (id, type, uri, content)
         VALUES (?, 'web', ?, ?)`,
      )
      .run(sourceId, topicUri, "Natürliche Zahlen: Stellenwert und Runden.");

    await db.close();

    const output = runBridgeExpectError([
      "personal-card-import-curriculum",
      "--sourceId",
      sourceId,
      "--domain",
      "Mathematik",
      "--preview",
    ]);
    expect(output).not.toMatch(/text is required/i);
    expect(output).toMatch(/LLM|offline|timed out|provider/i);
  });
});