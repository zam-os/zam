import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  openDatabase,
  createToken,
  ensureCard,
  setSetting,
  getCard,
} from "../../src/kernel/index.js";

describe("bridge batch commands e2e", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let dbPath: string;
  let token1: any;
  let card1: any;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-batch-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-batch-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    dbPath = join(dataDir, "zam.db");

    const db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });

    token1 = await createToken(db, {
      slug: "token-1",
      concept: "Concept One Description",
      domain: "science",
      bloom_level: 1,
      question: "What is One?",
    });

    card1 = await ensureCard(db, token1.id, "thomas");
    await setSetting(db, "user.id", "thomas");

    // Force due
    await db.prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'").run();

    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[], stdin = ""): any {
    try {
      const output = execFileSync("node", [cliPath, "bridge", ...args], {
        cwd: tempCwd,
        env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        input: stdin,
        encoding: "utf8",
      });
      return JSON.parse(output);
    } catch (err: any) {
      throw new Error(`Command failed with status ${err.status}. Stderr: ${err.stderr}. Stdout: ${err.stdout}`);
    }
  }

  it("can get reviews batch, open a session, and submit review with session details", async () => {
    // 1. Get reviews batch
    const reviewsRes = runBridge(["get-reviews", "--include-questions", "--no-resolve"]);
    expect(reviewsRes.cards).toHaveLength(1);
    expect(reviewsRes.cards[0].slug).toBe("token-1");
    expect(reviewsRes.cards[0].question).toBe("What is One?");

    // 2. Open a session
    const sessionRes = runBridge(["session-open", "--task", "Study Science", "--context", "shell"]);
    expect(sessionRes.session).toBeDefined();
    expect(sessionRes.session.task).toBe("Study Science");
    expect(sessionRes.due.dueCount).toBe(1);

    const sessionId = sessionRes.session.id;

    // 3. Submit a review with session & done-by
    const submitRes = runBridge([
      "submit",
      "--card-id",
      card1.id,
      "--rating",
      "3",
      "--session",
      sessionId,
      "--done-by",
      "agent",
    ]);

    expect(submitRes.success).toBe(true);
    expect(submitRes.rating).toBe(3);

    // Verify it was recorded in DB
    const db = await openDatabase({
      dbPath,
      useConfiguredCloud: false,
    });
    const updatedCard = await getCard(db, token1.id, "thomas");
    expect(updatedCard!.reps).toBe(1);

    // Verify the step was logged under the session
    const step = await db.prepare("SELECT * FROM session_steps WHERE session_id = ?").get(sessionId);
    expect(step).toBeDefined();
    expect(step.done_by).toBe("agent");
    expect(step.rating).toBe(3);

    await db.close();
  });
});
