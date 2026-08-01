/**
 * Learning Progress Analytics (ADR 2026-08-01)
 *
 * Activity series over the immutable review log: how many cards a user
 * reviewed per day/week/month and how much study time those reviews took.
 *
 * Aggregation happens in SQL over `idx_review_logs_user (user_id,
 * reviewed_at)` — no aggregate table, no write path. Stored timestamps stay
 * UTC; buckets are formed in the learner's local time via SQLite's
 * 'localtime' modifier, and the `window` bound is cut on the same local
 * calendar so "last N buckets" means exactly N local periods.
 */

import type { Database } from "../db/types.js";

export type ActivityPeriod = "day" | "week" | "month";

/** Default windows per period when no explicit `window` is requested. */
export const DEFAULT_ACTIVITY_WINDOWS: Record<ActivityPeriod, number> = {
  day: 30,
  week: 12,
  month: 6,
};

export interface ReviewActivityBucket {
  /**
   * Local-time bucket start:
   * - day:   "YYYY-MM-DD"        (date(reviewed_at, 'localtime'))
   * - week:  "YYYY-Www"          (ISO week-year/week, strftime %G-W%V)
   * - month: "YYYY-MM"
   */
  bucket: string;
  /** Number of rating events — one rating equals one card worked. */
  reviewedCards: number;
  /** Sum of response_time_ms over those ratings (NULL counts as 0). */
  studyTimeMs: number;
}

export interface ReviewActivity {
  period: ActivityPeriod;
  /** The effective bucket count the query was bounded to. */
  window: number;
  buckets: ReviewActivityBucket[];
}

export interface GetReviewActivityOptions {
  period?: ActivityPeriod;
  /**
   * Keep only the `window` most recent buckets, cut on the same local
   * calendar the buckets use (default: `DEFAULT_ACTIVITY_WINDOWS`). The
   * current partial week/month counts as one bucket, so a week view with
   * `window: 12` covers the current ISO week plus the 11 before it.
   * `window: 0` disables the bound (useful together with `since`).
   */
  window?: number;
  /**
   * Optional lower bound as a UTC calendar date "YYYY-MM-DD", compared on
   * the row's UTC date — format-agnostic because `reviewed_at` is written
   * as both ISO-8601 and SQLite datetime strings depending on the caller.
   * A documented escape hatch for explicit ranges and tests; production
   * surfaces use `window`, which is exact in local time.
   */
  since?: string;
}

const BUCKET_EXPRESSIONS: Record<ActivityPeriod, string> = {
  day: "date(reviewed_at, 'localtime')",
  // %G-W%V is the ISO 8601 week-year/week pair: weeks start on Monday and
  // week 1 is the one containing the year's first Thursday. Early-January
  // days that belong to the previous ISO year label correctly (2027-01-01
  // → "2026-W53", 2025-12-29 → "2026-W01").
  week: "strftime('%G-W%V', reviewed_at, 'localtime')",
  month: "strftime('%Y-%m', reviewed_at, 'localtime')",
};

/** First day of the current local period (day: today; week: Monday; month: 1st). */
function currentPeriodStart(period: ActivityPeriod): string {
  switch (period) {
    case "day":
      return "date('now', 'localtime')";
    case "week":
      // The Monday of the current week: back 6 days, then forward to the next
      // Monday ('weekday 1'). SQLite has no 'start of week' support and no
      // 'N weeks' modifier, so week spans are expressed in days below.
      return "date('now', 'localtime', '-6 days', 'weekday 1')";
    case "month":
      return "date('now', 'localtime', 'start of month')";
  }
}

/**
 * SQL fragment bounding the series to the `window` most recent local
 * periods: rows are cut on `date(reviewed_at, 'localtime')` so the bound
 * and the buckets never disagree about which local day a row belongs to.
 * SQLite modifiers know no 'weeks' unit, so week windows shift by days.
 */
function windowCondition(period: ActivityPeriod, window: number): string {
  const shift = window - 1;
  const modifier =
    period === "day"
      ? `-${shift} days`
      : period === "week"
        ? `-${shift * 7} days`
        : `-${shift} months`;
  return `${currentPeriodStart(period)} , '${modifier}'`;
}

/**
 * Get the review activity series for a user, bucketed per day/week/month.
 *
 * Buckets with no reviews are omitted; a chart can fill gaps itself. Study
 * time only exists from the release that started logging response times on
 * every surface (ADR 2026-08-01 Decision 2); older rows contribute counts
 * but no time.
 */
export async function getReviewActivity(
  db: Database,
  userId: string,
  options: GetReviewActivityOptions = {},
): Promise<ReviewActivity> {
  const period = options.period ?? "day";
  const window = options.window ?? DEFAULT_ACTIVITY_WINDOWS[period];

  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];
  if (options.since) {
    conditions.push("date(reviewed_at) >= ?");
    params.push(options.since);
  }
  if (window > 0) {
    conditions.push(
      `date(reviewed_at, 'localtime') >= date(${windowCondition(period, window)})`,
    );
  }

  const sql = `
    SELECT ${BUCKET_EXPRESSIONS[period]} AS bucket,
           COUNT(*) AS reviewed,
           COALESCE(SUM(response_time_ms), 0) AS study_time_ms
    FROM review_logs
    WHERE ${conditions.join(" AND ")}
    GROUP BY bucket
    ORDER BY bucket ASC`;

  const rows = (await db.prepare(sql).all(...params)) as Array<{
    bucket: string;
    reviewed: number;
    study_time_ms: number;
  }>;

  return {
    period,
    window,
    buckets: rows.map((row) => ({
      bucket: row.bucket,
      reviewedCards: row.reviewed,
      studyTimeMs: row.study_time_ms,
    })),
  };
}
