import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  ensureCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

describe("bridge database status and profile selection", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-database-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-database-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const first = await createToken(db, {
      slug: "database-status-first",
      concept: "First concept",
      domain: "test",
      bloom_level: 1,
      question: "What is the stored first question?",
    });
    const second = await createToken(db, {
      slug: "database-status-second",
      concept: "Second concept",
      domain: "test",
      bloom_level: 1,
    });
    await ensureCard(db, first.id, "thomas");
    await ensureCard(db, second.id, "thomas");
    await ensureCard(db, first.id, "test-user");
    await setSetting(db, "user.id", "test-user");
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): unknown {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: "utf8",
    });
    return JSON.parse(output);
  }

  it("reports the secret-safe target, active profile, and all card counts", () => {
    const result = runBridge(["database-status"]);
    expect(result).toMatchObject({
      success: true,
      connected: true,
      target: { kind: "local" },
      userId: "test-user",
      cardCount: 1,
      users: [
        { id: "test-user", cardCount: 1 },
        { id: "thomas", cardCount: 2 },
      ],
    });
  });

  it("switches to an existing learning profile", () => {
    expect(runBridge(["database-select-user", "--user", "thomas"])).toEqual({
      success: true,
      userId: "thomas",
      cardCount: 2,
    });

    expect(runBridge(["database-status"])).toMatchObject({
      userId: "thomas",
      cardCount: 2,
    });
  });

  it("rejects a profile without cards", () => {
    expect(() =>
      runBridge(["database-select-user", "--user", "missing"]),
    ).toThrow();
  });

  it("rejects mobile pairing from a local-only database", () => {
    expect(() =>
      runBridge(["mobile-pairing-payload", "--user", "test-user"]),
    ).toThrow();
  });

  it("can load a review with the stored question instead of dynamic generation", () => {
    runBridge(["setting-set", "--key", "llm.enabled", "--value", "true"]);

    expect(
      runBridge(["get-review", "--no-dynamic-question", "--no-resolve"]),
    ).toMatchObject({
      hasReview: true,
      prompt: { question: "What is the stored first question?" },
      questionSource: "original",
    });
  });
});
