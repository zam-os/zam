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

/**
 * Upper bound a single rating may contribute to study time (ADR 2026-08-01
 * Decision 7).
 *
 * Every surface measures "card shown → rating submitted" in wall-clock time,
 * so a card left open — a locked phone, a backgrounded app resuming its
 * persisted session, a terminal abandoned mid-prompt — books hours of "study
 * time" for one card and swamps the statistic. The review log keeps the raw
 * measurement (it is an immutable audit trail); the interpretation is capped
 * here, at read time, so the cap also repairs rows written before it existed.
 * Ten minutes is well past any honest single-card answer, including a slow
 * cloud evaluation and a spoken answer.
 */
export const STUDY_TIME_CAP_MS = 10 * 60_000;

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
  /**
   * Sum of response_time_ms over those ratings, each capped at
   * `STUDY_TIME_CAP_MS`. NULL (never measured) contributes 0.
   */
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
 * but no time. Each rating contributes at most `STUDY_TIME_CAP_MS`.
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

  // MIN/MAX are SQLite's scalar two-argument forms here, not the aggregates:
  // they clamp each row into [0, cap] before SUM adds it up.
  const sql = `
    SELECT ${BUCKET_EXPRESSIONS[period]} AS bucket,
           COUNT(*) AS reviewed,
           COALESCE(
             SUM(MIN(MAX(response_time_ms, 0), ${STUDY_TIME_CAP_MS})),
             0
           ) AS study_time_ms
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

/**
 * A bucket key taken apart for display.
 *
 * The keys are stable and machine-facing (`zam stats --json`, the bridge and
 * the MCP tool all emit them verbatim); turning one into "Fri, Jul 31" or
 * "KW 31" is each client's job. Parsing them is not, so the desktop app and
 * the mobile companion share this instead of each re-deriving the shapes.
 */
export type ParsedActivityBucket =
  | { period: "day"; date: Date }
  | { period: "week"; isoYear: number; isoWeek: number }
  | { period: "month"; date: Date };

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK_KEY = /^(\d{4})-W(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

/**
 * Parse a bucket key produced by `getReviewActivity`, or return `null` when it
 * does not match the period's shape — a caller can then fall back to showing
 * the raw key rather than a wrong date.
 *
 * Dates are built in local time, matching how the buckets were formed.
 */
export function parseActivityBucket(
  bucket: string,
  period: ActivityPeriod,
): ParsedActivityBucket | null {
  if (period === "day") {
    const match = DAY_KEY.exec(bucket);
    if (!match) return null;
    return {
      period,
      date: new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    };
  }
  if (period === "week") {
    const match = WEEK_KEY.exec(bucket);
    if (!match) return null;
    return { period, isoYear: Number(match[1]), isoWeek: Number(match[2]) };
  }
  const match = MONTH_KEY.exec(bucket);
  if (!match) return null;
  return { period, date: new Date(Number(match[1]), Number(match[2]) - 1, 1) };
}

export interface ActivityBucketLabelOptions {
  /** BCP-47 tag the learner reads in, e.g. "de" or "en". */
  locale: string;
  /**
   * Week wording, supplied by the caller's translation layer — "KW 31" in
   * German, "Week 31" in English. `Intl` has no format for ISO week numbers.
   */
  weekLabel: (isoWeek: number) => string;
}

/**
 * Render a bucket key as a chart label in the learner's language.
 *
 * Shared by the desktop app and the mobile companion so a bar reads the same
 * on every device. Unparseable keys fall back to the raw key rather than to a
 * wrong date. The CLI deliberately keeps the raw keys — they are stable and
 * greppable, which is what a terminal surface wants.
 */
export function formatActivityBucketLabel(
  bucket: string,
  period: ActivityPeriod,
  options: ActivityBucketLabelOptions,
): string {
  const parsed = parseActivityBucket(bucket, period);
  if (!parsed) return bucket;
  if (parsed.period === "week") return options.weekLabel(parsed.isoWeek);
  const format: Intl.DateTimeFormatOptions =
    parsed.period === "day"
      ? { weekday: "short", day: "numeric", month: "short" }
      : { month: "short", year: "numeric" };
  try {
    return new Intl.DateTimeFormat(options.locale, format).format(parsed.date);
  } catch {
    // An unknown locale tag must not blank out the chart.
    return bucket;
  }
}
