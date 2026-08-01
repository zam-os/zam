import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  ensureCard,
  getReviewActivity,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-08-01: the activity series (cards reviewed per day/week/month and
 * study time) is aggregated in SQL over the immutable review log, bucketed in
 * local time. Expectations are computed with the same SQLite date expressions
 * the implementation uses, so the tests stay deterministic in any timezone.
 */
describe("getReviewActivity", () => {
  let db: Database;
  let tempDir: string;
  let userId: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-progress-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    userId = "thomas";
    const token = await createToken(db, {
      slug: "progress-token",
      concept: "Progress concept",
      domain: "stats",
      bloom_level: 1,
    });
    await ensureCard(db, token.id, userId);
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Insert one immutable review-log event with a controlled timestamp. */
  async function logEvent(
    reviewedAt: string,
    responseTimeMs: number | null,
  ): Promise<void> {
    await db
      .prepare(
        `INSERT INTO review_logs
           (id, card_id, token_id, user_id, rating, response_time_ms,
            reviewed_at, scheduled_at, session_id)
         SELECT 'r' || substr(hex(randomblob(8)), 1, 16), id, token_id, ?,
                3, ?, ?, '2000-01-01 00:00:00', NULL
         FROM cards WHERE user_id = ? LIMIT 1`,
      )
      .run(userId, responseTimeMs, reviewedAt, userId);
  }

  async function localBucket(expr: string): Promise<string> {
    const row = (await db
      .prepare(`SELECT ${expr} AS b LIMIT 1`)
      .get()) as { b: string };
    return row.b;
  }

  it("groups ratings into local-day buckets with study time", async () => {
    await logEvent("2026-07-15 12:00:00", 1_000);
    await logEvent("2026-07-15 13:30:00", 2_000);
    await logEvent("2026-07-16 12:00:00", 500);
    await logEvent("2026-08-10 12:00:00", 3_000);
    await logEvent("2026-08-11 12:00:00", null);

    const dayExpr = "date(reviewed_at, 'localtime')";
    const expected = (await db
      .prepare(
        `SELECT ${dayExpr} AS bucket, COUNT(*) AS n,
                COALESCE(SUM(response_time_ms), 0) AS ms
         FROM review_logs WHERE user_id = ?
         GROUP BY bucket ORDER BY bucket ASC`,
      )
      .all(userId)) as Array<{ bucket: string; n: number; ms: number }>;

    const activity = await getReviewActivity(db, userId, {
      period: "day",
    });

    expect(activity.period).toBe("day");
    expect(activity.buckets).toHaveLength(expected.length);
    activity.buckets.forEach((bucket, i) => {
      expect(bucket.bucket).toBe(expected[i].bucket);
      expect(bucket.reviewedCards).toBe(expected[i].n);
      expect(bucket.studyTimeMs).toBe(expected[i].ms);
    });

    const totalCards = activity.buckets.reduce(
      (sum, b) => sum + b.reviewedCards,
      0,
    );
    const totalMs = activity.buckets.reduce((sum, b) => sum + b.studyTimeMs, 0);
    expect(totalCards).toBe(5);
    expect(totalMs).toBe(6_500);
  });

  it("buckets by Monday-start week and by month", async () => {
    await logEvent("2026-07-15 12:00:00", 1_000);
    await logEvent("2026-07-16 12:00:00", 500);
    await logEvent("2026-08-10 12:00:00", 3_000);

    const weekExpr = "strftime('%Y-W%W', reviewed_at, 'localtime')";
    const weekBuckets = (await db
      .prepare(
        `SELECT ${weekExpr} AS bucket, COUNT(*) AS n
         FROM review_logs WHERE user_id = ? GROUP BY bucket ORDER BY bucket`,
      )
      .all(userId)) as Array<{ bucket: string; n: number }>;

    const weekly = await getReviewActivity(db, userId, { period: "week" });
    expect(weekly.buckets.map((b) => b.bucket)).toEqual(
      weekBuckets.map((b) => b.bucket),
    );
    expect(weekly.buckets.map((b) => b.reviewedCards)).toEqual(
      weekBuckets.map((b) => b.n),
    );

    const monthly = await getReviewActivity(db, userId, { period: "month" });
    expect(monthly.buckets.map((b) => b.bucket)).toEqual([
      "2026-07",
      "2026-08",
    ]);
    expect(monthly.buckets.map((b) => b.reviewedCards)).toEqual([2, 1]);
    expect(monthly.buckets.map((b) => b.studyTimeMs)).toEqual([1_500, 3_000]);
  });

  it("filters by a UTC date bound and scopes to the user", async () => {
    await logEvent("2026-07-15 12:00:00", 1_000);
    await logEvent("2026-08-10 12:00:00", 3_000);

    const other = await createToken(db, {
      slug: "progress-token-other",
      concept: "Other user",
      domain: "stats",
      bloom_level: 1,
    });
    await ensureCard(db, other.id, "elsewhere");

    const since = await getReviewActivity(db, userId, {
      period: "day",
      since: "2026-08-01",
    });
    expect(since.buckets).toEqual([
      { bucket: "2026-08-10", reviewedCards: 1, studyTimeMs: 3_000 },
    ]);

    const scoped = await getReviewActivity(db, userId, { period: "month" });
    expect(scoped.buckets).toHaveLength(2);
  });

  it("returns an empty series for a user without reviews", async () => {
    const empty = await getReviewActivity(db, "nobody", { period: "day" });
    expect(empty.buckets).toEqual([]);
  });

  it("round-trips local-day bucketing for the week expression", async () => {
    // The %Y-W%W format stays chronologically sortable, which the ORDER BY
    // relies on. Sanity-check the string shape.
    const expr = await localBucket("strftime('%Y-W%W', '2026-07-16 12:00:00', 'localtime')");
    expect(expr).toMatch(/^\d{4}-W\d{2}$/);
  });
});
