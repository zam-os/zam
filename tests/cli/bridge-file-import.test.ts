import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/kernel/index.js";

describe("bridge model-free file import", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let csvPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-file-bridge-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-file-bridge-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    csvPath = join(tempCwd, "cards.csv");
    writeFileSync(
      csvPath,
      "id,question,answer,deck\ncapital,Capital of France?,Paris,Geography",
      "utf8",
    );
    mkdirSync(join(tempHome, ".zam"), { recursive: true });
    const db = await openDatabase({
      dbPath: join(tempHome, ".zam", "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'offline-user')",
      )
      .run();
    await db.close();
  });

  afterEach(() => {
    rmSync(tempHome, { recursive: true, force: true });
    rmSync(tempCwd, { recursive: true, force: true });
  });

  function run(args: string[]): Record<string, any> {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: {
        ...process.env,
        HOME: tempHome,
        USERPROFILE: tempHome,
        ZAM_DB_PROVIDER: "local",
      },
      encoding: "utf8",
    });
    return JSON.parse(output);
  }

  function runError(args: string[]): Record<string, any> {
    try {
      run(args);
      throw new Error("Expected bridge command to fail");
    } catch (error) {
      const failure = error as { stdout?: string };
      return JSON.parse((failure.stdout ?? "{}").trim());
    }
  }

  it("previews, confirms, and then classifies the same file as unchanged", () => {
    const preview = run([
      "personal-card-import-file-preview",
      "--path",
      csvPath,
    ]);
    expect(preview.success).toBe(true);
    expect(preview.counts).toMatchObject({ create: 1, cardsToCreate: 1 });

    const committed = run([
      "personal-card-import-file-confirm",
      "--path",
      csvPath,
      "--plan-hash",
      preview.planHash,
    ]);
    expect(committed).toMatchObject({ success: true, cardsCreated: 1 });

    const duplicate = run([
      "personal-card-import-file-preview",
      "--path",
      csvPath,
    ]);
    expect(duplicate.counts).toMatchObject({
      create: 0,
      update: 0,
      skip: 1,
      cardsToCreate: 0,
    });
  });

  it("rejects confirmation when the file changed after preview", () => {
    const preview = run([
      "personal-card-import-file-preview",
      "--path",
      csvPath,
    ]);
    writeFileSync(
      csvPath,
      "id,question,answer,deck\ncapital,Capital of France?,Lyon,Geography",
      "utf8",
    );

    const error = runError([
      "personal-card-import-file-confirm",
      "--path",
      csvPath,
      "--plan-hash",
      preview.planHash,
    ]);
    expect(error.error).toMatch(/preview.*current/i);
  });
});
