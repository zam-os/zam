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
 * local time with ISO week-year labels, and bounded to the N most recent local
 * periods. Tests on fixed historical dates pass `window: 0` so they stay
 * deterministic regardless of when the suite runs; the `window` mechanics
 * themselves are pinned in the dedicated bounds test.
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
      window: 0,
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

  it("buckets by ISO week (Monday start, %G-W%V) and by month", async () => {
    await logEvent("2026-07-15 12:00:00", 1_000);
    await logEvent("2026-07-16 12:00:00", 500);
    await logEvent("2026-08-10 12:00:00", 3_000);

    const weekExpr = "strftime('%G-W%V', reviewed_at, 'localtime')";
    const weekBuckets = (await db
      .prepare(
        `SELECT ${weekExpr} AS bucket, COUNT(*) AS n
         FROM review_logs WHERE user_id = ? GROUP BY bucket ORDER BY bucket`,
      )
      .all(userId)) as Array<{ bucket: string; n: number }>;

    const weekly = await getReviewActivity(db, userId, {
      period: "week",
      window: 0,
    });
    expect(weekly.buckets.map((b) => b.bucket)).toEqual(
      weekBuckets.map((b) => b.bucket),
    );
    expect(weekly.buckets.map((b) => b.reviewedCards)).toEqual(
      weekBuckets.map((b) => b.n),
    );

    const monthly = await getReviewActivity(db, userId, {
      period: "month",
      window: 0,
    });
    expect(monthly.buckets.map((b) => b.bucket)).toEqual([
      "2026-07",
      "2026-08",
    ]);
    expect(monthly.buckets.map((b) => b.reviewedCards)).toEqual([2, 1]);
    expect(monthly.buckets.map((b) => b.studyTimeMs)).toEqual([1_500, 3_000]);
  });

  it("labels year-boundary weeks with ISO week-year semantics", async () => {
    // Fixed expectations, not re-queries of the implementation expression:
    // 2026-01-01 is a Thursday → ISO week 1 of 2026 starts Monday 2025-12-29.
    // 2026-12-28 is a Monday; its Thursday is 2026-12-31, so the whole week
    // (including Friday 2027-01-01) is ISO week 53 of 2026. 2027-W01 only
    // starts Monday 2027-01-04. %Y-W%W would label 2027-01-01 as "2027-W00" —
    // %G-W%V must not.
    await logEvent("2025-12-29 12:00:00", 1_000);
    await logEvent("2026-01-01 12:00:00", 500);
    await logEvent("2026-12-28 12:00:00", 250);
    await logEvent("2027-01-01 12:00:00", 3_000);
    await logEvent("2027-01-04 12:00:00", 2_000);

    const weekly = await getReviewActivity(db, userId, {
      period: "week",
      since: "2025-01-01",
      window: 0,
    });
    expect(weekly.buckets.map((b) => b.bucket)).toEqual([
      "2026-W01", // 2025-12-29 + 2026-01-01
      "2026-W53", // 2026-12-28 + 2027-01-01
      "2027-W01", // 2027-01-04
    ]);
    expect(weekly.buckets.map((b) => b.reviewedCards)).toEqual([2, 2, 1]);
    expect(weekly.buckets.map((b) => b.studyTimeMs)).toEqual([
      1_500, 3_250, 2_000,
    ]);
  });

  it("bounds the series to the N most recent local buckets", async () => {
    // Far-past events plus one from right now: a 1-bucket month window must
    // only include the current month, a 1-bucket day window only today.
    await logEvent("2025-07-15 12:00:00", 1_000);
    await logEvent("2025-08-10 12:00:00", 3_000);
    await logEvent(new Date().toISOString().slice(0, 19).replace("T", " "), 500);

    const oneMonth = await getReviewActivity(db, userId, {
      period: "month",
      window: 1,
    });
    expect(oneMonth.window).toBe(1);
    expect(oneMonth.buckets).toHaveLength(1);
    expect(oneMonth.buckets[0].reviewedCards).toBe(1);

    const oneDay = await getReviewActivity(db, userId, {
      period: "day",
      window: 1,
    });
    expect(oneDay.buckets).toHaveLength(1);
    expect(oneDay.buckets[0].reviewedCards).toBe(1);

    const twoWeeks = await getReviewActivity(db, userId, {
      period: "week",
      window: 2,
    });
    expect(twoWeeks.buckets.length).toBeLessThanOrEqual(2);
    expect(
      twoWeeks.buckets.reduce((s, b) => s + b.reviewedCards, 0),
    ).toBe(1);
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
      window: 0,
    });
    expect(since.buckets).toEqual([
      { bucket: "2026-08-10", reviewedCards: 1, studyTimeMs: 3_000 },
    ]);

    const scoped = await getReviewActivity(db, userId, {
      period: "month",
      window: 0,
    });
    expect(scoped.buckets).toHaveLength(2);
  });

  it("buckets a late-UTC review on the learner's local day", async () => {
    // 2026-07-15 23:30 UTC is 2026-07-16 01:30 in Europe/Berlin (UTC+2 in
    // July): the local-day bucket must be the 16th, not the UTC day 15th.
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = "Europe/Berlin";
      await logEvent("2026-07-15 23:30:00", 1_000);

      const activity = await getReviewActivity(db, userId, {
        period: "day",
        window: 0,
      });
      expect(activity.buckets.map((b) => b.bucket)).toEqual(["2026-07-16"]);
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });

  it("returns an empty series for a user without reviews", async () => {
    const empty = await getReviewActivity(db, "nobody", { period: "day" });
    expect(empty.buckets).toEqual([]);
  });
});
