import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  ensureCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-08-01: `zam bridge stats-activity` exposes the review activity
 * series (cards per day/week/month + study time) as JSON. The study time only
 * exists where response times were logged, so rows without one contribute
 * counts but no milliseconds.
 */
describe("zam bridge stats-activity", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let dbPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-activity-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-activity-cwd-"));
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

    const token = await createToken(db, {
      slug: "activity-token",
      concept: "Activity concept",
      domain: "stats",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "test-user");

    const daysAgoIso = (days: number) =>
      new Date(Date.now() - days * 86_400_000).toISOString();
    const logs = [
      { at: daysAgoIso(0), ms: 2_000 },
      { at: daysAgoIso(1), ms: 500 },
      { at: daysAgoIso(3), ms: null },
    ];
    for (let i = 0; i < logs.length; i++) {
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, response_time_ms,
              reviewed_at, scheduled_at, session_id)
           VALUES (?, ?, ?, ?, 3, ?, ?, '2000-01-01 00:00:00', NULL)`,
        )
        .run(`log-${i}`, card.id, token.id, "test-user", logs[i].ms, logs[i].at);
    }
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): Record<string, unknown> {
    const result = spawnSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: "utf8",
    });
    return JSON.parse(result.stdout) as Record<string, unknown>;
  }

  it("returns a daily series with counts and study time", () => {
    const res = runBridge(["stats-activity", "--period", "day"]) as {
      userId: string;
      period: string;
      window: number;
      buckets: Array<{
        bucket: string;
        reviewedCards: number;
        studyTimeMs: number;
      }>;
    };

    expect(res.userId).toBe("test-user");
    expect(res.period).toBe("day");
    expect(res.window).toBe(30);

    const totalCards = res.buckets.reduce((s, b) => s + b.reviewedCards, 0);
    const totalMs = res.buckets.reduce((s, b) => s + b.studyTimeMs, 0);
    expect(totalCards).toBe(3);
    expect(totalMs).toBe(2_500);
    expect(res.buckets.every((b) => b.reviewedCards === 1)).toBe(true);
  });

  it("defaults to day period and accepts a custom window", () => {
    const res = runBridge(["stats-activity"]) as {
      period: string;
      window: number;
      buckets: unknown[];
    };
    expect(res.period).toBe("day");
    expect(res.window).toBe(30);

    const narrow = runBridge([
      "stats-activity",
      "--period",
      "day",
      "--days",
      "2",
    ]) as { window: number; buckets: unknown[] };
    expect(narrow.window).toBe(2);
  });

  it("aggregates the same events into a single month bucket", () => {
    const res = runBridge(["stats-activity", "--period", "month"]) as {
      period: string;
      window: number;
      buckets: Array<{ reviewedCards: number; studyTimeMs: number }>;
    };
    expect(res.period).toBe("month");
    expect(res.window).toBe(6);
    expect(res.buckets.length).toBeGreaterThanOrEqual(1);
    const totalCards = res.buckets.reduce((s, b) => s + b.reviewedCards, 0);
    const totalMs = res.buckets.reduce((s, b) => s + b.studyTimeMs, 0);
    expect(totalCards).toBe(3);
    expect(totalMs).toBe(2_500);
  });

  it("rejects an unknown period with a JSON error", () => {
    const res = runBridge(["stats-activity", "--period", "year"]) as {
      error?: string;
    };
    expect(res.error).toContain("Invalid period");
  });
});
