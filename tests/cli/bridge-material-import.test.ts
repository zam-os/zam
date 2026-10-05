import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, setSetting } from "../../src/kernel/index.js";

/**
 * `zam bridge material-import-*` (ADR 2026-10-05): JSON only, errors
 * included, from staging through review and confirm to taking a bonus card.
 */

const FIXTURE = join(
  process.cwd(),
  "tests",
  "fixtures",
  "material-import",
  "chemie-sinne.json",
);

describe("zam bridge material-import-*", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-material-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-material-cwd-"));
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
    await setSetting(db, "user.id", "learner");
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function env() {
    return { ...process.env, HOME: tempHome, USERPROFILE: tempHome };
  }

  function runCliJson(args: string[]): any {
    return JSON.parse(
      execFileSync("node", [cliPath, "bridge", ...args], {
        cwd: tempCwd,
        env: env(),
        input: "",
        encoding: "utf8",
      }),
    );
  }

  function runCliError(args: string[]): { status: number | null; body: any } {
    try {
      execFileSync("node", [cliPath, "bridge", ...args], {
        cwd: tempCwd,
        env: env(),
        input: "",
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      const failure = err as { status: number | null; stdout: string };
      return { status: failure.status, body: JSON.parse(failure.stdout) };
    }
    throw new Error("expected the command to fail");
  }

  it("stages, reviews, confirms and hands out a bonus card", () => {
    const staged = runCliJson([
      "material-import-stage",
      "--file",
      FIXTURE,
      "--origin",
      "harness",
      "--harness",
      "opencode",
    ]);
    expect(staged).toEqual({
      success: true,
      id: expect.stringMatching(/^[0-9A-Z]{26}$/),
      proposalCount: 4,
    });

    const pending = runCliJson(["material-import-pending"]);
    expect(pending.imports).toEqual([
      expect.objectContaining({
        id: staged.id,
        title: "Stofferkennung mit den Sinnen",
        harness: "opencode",
      }),
    ]);

    const review = runCliJson(["material-import-review", "--id", staged.id]);
    expect(review.success).toBe(true);
    expect(review.analysis.subjects).toEqual(["chemie"]);
    expect(review.rows[0]).toEqual({
      kind: "proposal",
      id: "p:0",
      proposalIndex: 0,
      preset: "yes",
    });

    const confirmed = runCliJson([
      "material-import-confirm",
      "--id",
      staged.id,
      "--decisions",
      JSON.stringify({ "p:0": "yes", "p:2": "bonus" }),
      "--areas",
      JSON.stringify({ "chemie/stoffe-und-eigenschaften": "chemie/stoffe" }),
    ]);
    expect(confirmed).toMatchObject({
      success: true,
      cardsCreated: 1,
      bonusKept: 1,
      linkedExisting: 0,
    });
    expect(runCliJson(["material-import-pending"]).imports).toEqual([]);

    const areas = runCliJson(["material-import-areas"]);
    expect(areas.areas).toEqual([{ path: "chemie/stoffe", tokenCount: 2 }]);
    expect(areas.cellSubjects).toContain("chemie");

    const bonus = runCliJson(["material-import-bonus-list"]);
    expect(bonus.items).toHaveLength(1);
    expect(bonus.items[0].sourceTitle).toBe("Stofferkennung mit den Sinnen");
    const taken = runCliJson([
      "material-import-bonus-take",
      "--token",
      bonus.items[0].tokenId,
    ]);
    expect(taken).toEqual({ success: true, cardId: expect.any(String) });
    expect(runCliJson(["material-import-bonus-list"]).items).toEqual([]);
  });

  it("names the models and refuses a built-in import without one, as JSON", () => {
    const models = runCliJson(["material-import-models"]);
    expect(models).toMatchObject({ success: true, image: null, file: null });
    expect(typeof models.convertsHeic).toBe("boolean");

    const photo = join(tempCwd, "Seite 1.jpg");
    writeFileSync(photo, "synthetic");
    expect(runCliJson(["material-import-analyze", "--file", photo])).toEqual({
      success: false,
      code: "no-image-model",
      message: expect.any(String),
    });
    const pdf = join(tempCwd, "blatt.pdf");
    writeFileSync(pdf, "%PDF-1.7");
    expect(
      runCliJson(["material-import-analyze", "--file", photo, pdf]),
    ).toMatchObject({ success: false, code: "mixed" });
    expect(runCliJson(["material-import-pending"]).imports).toEqual([]);
  });

  it("discards a batch", () => {
    const staged = runCliJson(["material-import-stage", "--file", FIXTURE]);
    expect(runCliJson(["material-import-discard", "--id", staged.id])).toEqual({
      success: true,
      discarded: true,
    });
    expect(runCliJson(["material-import-pending"]).imports).toEqual([]);
  });

  it("answers every failure with JSON", () => {
    const missing = runCliError([
      "material-import-confirm",
      "--id",
      "01JZZZZZZZZZZZZZZZZZZZZZZZ",
      "--decisions",
      "{}",
    ]);
    expect(missing.status).toBe(1);
    expect(missing.body.error).toMatch(/not waiting any more/);

    const staged = runCliJson(["material-import-stage", "--file", FIXTURE]);
    const badJson = runCliError([
      "material-import-confirm",
      "--id",
      staged.id,
      "--decisions",
      "yes please",
    ]);
    expect(badJson.body.error).toMatch(/--decisions must be JSON/);

    const badChoice = runCliError([
      "material-import-confirm",
      "--id",
      staged.id,
      "--decisions",
      JSON.stringify({ "p:0": "maybe" }),
    ]);
    expect(badChoice.body.error).toMatch(/decisions\.p:0/);

    const notASet = join(tempCwd, "not-a-set.json");
    writeFileSync(notASet, JSON.stringify({ cards: [] }));
    const invalid = runCliError(["material-import-stage", "--file", notASet]);
    expect(invalid.body.error).toMatch(/Invalid material proposals/);
  });
});
