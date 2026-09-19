/**
 * Learning Progress Analytics (ADR 2026-08-01)
 *
 * Activity series over the immutable review log: how many cards a user
 * reviewed per day/week/month and how much study time those reviews took.
 *
 * The events come straight from `idx_review_logs_user (user_id,
 * reviewed_at)` — no aggregate table, no write path. Stored timestamps stay
 * UTC; buckets are formed in the learner's local time in JavaScript (the
 * same calendar SQLite's 'localtime' modifier used, on every database
 * provider), and the `window` bound is cut on that local calendar so "last N
 * buckets" means exactly N local periods.
 */

import { parseStoredTimestampUtc } from "../db/sql.js";
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
 * Every surface measures one rating's active learning time (card shown →
 * rating submitted). Studio and the Recall card use an idle-aware clock
 * (ADR 2026-09-15) so a walk-away does not book as study; other surfaces
 * still send wall-clock. A card left open — a locked phone, a backgrounded
 * app resuming its persisted session, a terminal abandoned mid-prompt —
 * can still book a long raw value. The review log keeps that measurement
 * (it is an immutable audit trail); the interpretation is capped here, at
 * read time, so the cap also repairs rows written before idle tracking
 * existed. Ten minutes is a backstop past any honest single-card answer.
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

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** The local calendar day (process time zone) an instant falls on, at midnight. */
function localDayOf(ms: number): Date {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(local: Date): string {
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`;
}

function monthKey(local: Date): string {
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}`;
}

/**
 * ISO 8601 week-year/week pair ("YYYY-Www"): weeks start on Monday and week 1
 * is the one containing the year's first Thursday, so early-January days that
 * belong to the previous ISO year label correctly (2027-01-01 → "2026-W53",
 * 2025-12-29 → "2026-W01"). Same output SQLite's `strftime('%G-W%V')` gave.
 */
function weekKey(local: Date): string {
  const thursday = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
  );
  thursday.setDate(thursday.getDate() - ((thursday.getDay() + 6) % 7) + 3);
  const isoYear = thursday.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const week1Thursday = new Date(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7) + 3);
  const week =
    1 +
    Math.round(
      (thursday.getTime() - week1Thursday.getTime()) / (7 * 86_400_000),
    );
  return `${isoYear}-W${pad2(week)}`;
}

function bucketKey(period: ActivityPeriod, local: Date): string {
  switch (period) {
    case "day":
      return dayKey(local);
    case "week":
      return weekKey(local);
    case "month":
      return monthKey(local);
  }
}

/**
 * First local day of the period `shift` periods before the current one
 * (day: today; week: Monday; month: the 1st), so a window of N periods starts
 * at `periodStartShifted(period, N - 1)`.
 */
function periodStartShifted(
  period: ActivityPeriod,
  shift: number,
  now: Date,
): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "day":
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - shift,
      );
    case "week": {
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * shift);
      return monday;
    }
    case "month":
      return new Date(today.getFullYear(), today.getMonth() - shift, 1);
  }
}

/**
 * Get the review activity series for a user, bucketed per day/week/month.
 *
 * The database returns the raw events (`reviewed_at`, `response_time_ms`);
 * bucketing and the window cut happen here, in the learner's local calendar,
 * because SQLite's `'localtime'` modifiers have no PostgreSQL counterpart and
 * a series of a few thousand rows is cheap to fold (ADR 2026-09-04
 * Decision 5). `reviewed_at` mixes ISO strings and zone-less SQLite defaults;
 * both are read as UTC, exactly as SQLite did.
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
  const now = new Date();

  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];
  if (options.since) {
    // The first ten characters are the UTC calendar date in every stored
    // shape, which is exactly what `date(reviewed_at)` compared before.
    conditions.push("substr(reviewed_at, 1, 10) >= ?");
    params.push(options.since);
  }

  let localCutoff: Date | null = null;
  if (window > 0) {
    localCutoff = periodStartShifted(period, window - 1, now);
    // Coarse pre-filter so the database does not ship the whole log. Two days
    // of slack cover any UTC offset; the exact local-day cut follows below.
    // A bare "YYYY-MM-DD" sorts before every stored value of that day.
    conditions.push("reviewed_at >= ?");
    params.push(dayKey(new Date(localCutoff.getTime() - 2 * 86_400_000)));
  }

  const rows = (await db
    .prepare(
      `SELECT reviewed_at, response_time_ms
         FROM review_logs
        WHERE ${conditions.join(" AND ")}`,
    )
    .all(...params)) as Array<{
    reviewed_at: string;
    response_time_ms: number | string | null;
  }>;

  const buckets = new Map<string, { reviewed: number; studyTimeMs: number }>();
  for (const row of rows) {
    const ms = parseStoredTimestampUtc(String(row.reviewed_at));
    if (Number.isNaN(ms)) continue;
    const local = localDayOf(ms);
    if (localCutoff && local.getTime() < localCutoff.getTime()) continue;
    const key = bucketKey(period, local);
    const entry = buckets.get(key) ?? { reviewed: 0, studyTimeMs: 0 };
    entry.reviewed += 1;
    const measured =
      row.response_time_ms == null ? 0 : Number(row.response_time_ms);
    entry.studyTimeMs += Math.min(
      Math.max(Number.isFinite(measured) ? measured : 0, 0),
      STUDY_TIME_CAP_MS,
    );
    buckets.set(key, entry);
  }

  return {
    period,
    window,
    buckets: [...buckets.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([bucket, entry]) => ({
        bucket,
        reviewedCards: entry.reviewed,
        studyTimeMs: entry.studyTimeMs,
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
