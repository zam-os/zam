import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  ensureCard,
  formatActivityBucketLabel,
  getReviewActivity,
  openDatabase,
  parseActivityBucket,
  STUDY_TIME_CAP_MS,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-08-01: the activity series (cards reviewed per day/week/month and
 * study time) is aggregated in SQL over the immutable review log, bucketed in
 * local time with ISO week-year labels, and bounded to the N most recent local
 * periods. Tests on fixed historical dates pass `window: 0` so they stay
 * deterministic regardless of when the suite runs; the `window` mechanics
 * themselves are pinned in the dedicated bounds test.
 *
 * Expected buckets are written out literally rather than re-queried from the
 * implementation's own SQL. Fixture events are stamped at 12:00 UTC, which
 * lands on the same calendar day in every timezone the suite runs in (CI is
 * UTC, this project's machines are Europe/Berlin), so the labels hold without
 * pinning a zone — see the local-day test for the bucketing shift itself.
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

    const activity = await getReviewActivity(db, userId, {
      period: "day",
      window: 0,
    });

    expect(activity.period).toBe("day");
    expect(activity.buckets).toEqual([
      { bucket: "2026-07-15", reviewedCards: 2, studyTimeMs: 3_000 },
      { bucket: "2026-07-16", reviewedCards: 1, studyTimeMs: 500 },
      { bucket: "2026-08-10", reviewedCards: 1, studyTimeMs: 3_000 },
      // No response time was ever logged for this rating: it counts as a
      // worked card and contributes no study time.
      { bucket: "2026-08-11", reviewedCards: 1, studyTimeMs: 0 },
    ]);
  });

  it("buckets by ISO week (Monday start, %G-W%V) and by month", async () => {
    await logEvent("2026-07-15 12:00:00", 1_000);
    await logEvent("2026-07-16 12:00:00", 500);
    await logEvent("2026-08-10 12:00:00", 3_000);

    // 2026-07-15 (Wed) and 2026-07-16 (Thu) share ISO week 29; 2026-08-10 is
    // a Monday and opens week 33.
    const weekly = await getReviewActivity(db, userId, {
      period: "week",
      window: 0,
    });
    expect(weekly.buckets).toEqual([
      { bucket: "2026-W29", reviewedCards: 2, studyTimeMs: 1_500 },
      { bucket: "2026-W33", reviewedCards: 1, studyTimeMs: 3_000 },
    ]);

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

  it("buckets a review on the learner's local day, not the UTC day", async () => {
    // The zone cannot be pinned from inside the test: SQLite's 'localtime'
    // resolves against the C runtime's timezone, which Windows fixes at
    // process start and does not re-read when process.env.TZ is assigned —
    // an earlier version of this test set TZ here and passed only on machines
    // that already ran in a non-UTC zone. So the case is built from the
    // runtime's own offset instead, and holds in UTC CI and in Europe/Berlin.
    const offsetMinutes = -new Date(
      Date.UTC(2026, 6, 15, 12),
    ).getTimezoneOffset();
    // Ahead of UTC: a late-evening UTC review already belongs to the next
    // local day. Behind UTC: an early-morning one still belongs to the
    // previous one. In UTC itself no shift exists and the UTC day is correct.
    const utcHour = offsetMinutes > 0 ? 23 : 0;
    const instantUtcMs = Date.UTC(2026, 6, 15, utcHour, 30);
    await logEvent(
      new Date(instantUtcMs).toISOString().slice(0, 19).replace("T", " "),
      1_000,
    );

    const local = new Date(instantUtcMs);
    const expected = [
      local.getFullYear(),
      String(local.getMonth() + 1).padStart(2, "0"),
      String(local.getDate()).padStart(2, "0"),
    ].join("-");

    const activity = await getReviewActivity(db, userId, {
      period: "day",
      window: 0,
    });
    expect(activity.buckets.map((b) => b.bucket)).toEqual([expected]);

    // Outside UTC the bucket must have moved off the stored UTC date — that
    // is the regression this test exists for.
    if (offsetMinutes !== 0) {
      expect(expected).not.toBe("2026-07-15");
    }
  });

  it("caps what a single rating may contribute to study time", async () => {
    // A card left open — locked phone, backgrounded companion resuming its
    // persisted session, terminal abandoned mid-prompt — measures hours for
    // one card. The log keeps the raw number; the statistic must not.
    const abandoned = 6 * 60 * 60_000;
    await logEvent("2026-07-15 12:00:00", abandoned);
    await logEvent("2026-07-15 12:30:00", 4_000);

    const activity = await getReviewActivity(db, userId, {
      period: "day",
      window: 0,
    });
    expect(activity.buckets).toEqual([
      {
        bucket: "2026-07-15",
        reviewedCards: 2,
        studyTimeMs: STUDY_TIME_CAP_MS + 4_000,
      },
    ]);

    // The raw measurement survives in the audit trail.
    const raw = (await db
      .prepare(
        "SELECT MAX(response_time_ms) AS ms FROM review_logs WHERE user_id = ?",
      )
      .get(userId)) as { ms: number };
    expect(raw.ms).toBe(abandoned);
  });

  it("returns an empty series for a user without reviews", async () => {
    const empty = await getReviewActivity(db, "nobody", { period: "day" });
    expect(empty.buckets).toEqual([]);
  });
});

/**
 * Bucket keys are the stable machine-facing contract; the GUIs turn them into
 * chart labels. Desktop and mobile share this so a bar reads the same on every
 * device (ADR 2026-08-01 Decision 6).
 */
describe("parseActivityBucket / formatActivityBucketLabel", () => {
  const weekLabel = (week: number) => `KW ${week}`;

  it("parses each period's key shape into local dates and ISO weeks", () => {
    expect(parseActivityBucket("2026-07-15", "day")).toEqual({
      period: "day",
      date: new Date(2026, 6, 15),
    });
    expect(parseActivityBucket("2026-W29", "week")).toEqual({
      period: "week",
      isoYear: 2026,
      isoWeek: 29,
    });
    expect(parseActivityBucket("2026-07", "month")).toEqual({
      period: "month",
      date: new Date(2026, 6, 1),
    });
  });

  it("rejects a key that does not match the period", () => {
    expect(parseActivityBucket("2026-07", "day")).toBeNull();
    expect(parseActivityBucket("2026-07-15", "week")).toBeNull();
    expect(parseActivityBucket("nonsense", "month")).toBeNull();
  });

  it("renders labels in the learner's language", () => {
    const de = formatActivityBucketLabel("2026-07-15", "day", {
      locale: "de-DE",
      weekLabel,
    });
    const en = formatActivityBucketLabel("2026-07-15", "day", {
      locale: "en-US",
      weekLabel,
    });
    expect(de).toContain("15");
    expect(en).toContain("15");
    expect(de).not.toBe(en);

    expect(
      formatActivityBucketLabel("2026-W29", "week", {
        locale: "de-DE",
        weekLabel,
      }),
    ).toBe("KW 29");
    expect(
      formatActivityBucketLabel("2026-07", "month", {
        locale: "en-US",
        weekLabel,
      }),
    ).toBe("Jul 2026");
  });

  it("falls back to the raw key instead of showing a wrong date", () => {
    // A malformed key or an unusable locale tag must not blank out the chart.
    expect(
      formatActivityBucketLabel("not-a-date", "day", {
        locale: "de-DE",
        weekLabel,
      }),
    ).toBe("not-a-date");
    expect(
      formatActivityBucketLabel("2026-07-15", "day", {
        locale: "!!invalid!!",
        weekLabel,
      }),
    ).toBe("2026-07-15");
  });
});
