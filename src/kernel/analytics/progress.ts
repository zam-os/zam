/**
 * Learning Progress Analytics (ADR 2026-08-01)
 *
 * Activity series over the immutable review log: how many cards a user
 * reviewed per day/week/month and how much study time those reviews took.
 *
 * Aggregation happens in SQL over `idx_review_logs_user (user_id,
 * reviewed_at)` — no aggregate table, no write path. Stored timestamps stay
 * UTC; buckets are formed in the learner's local time via SQLite's
 * 'localtime' modifier.
 */

import type { Database } from "../db/types.js";

export type ActivityPeriod = "day" | "week" | "month";

export interface ReviewActivityBucket {
  /**
   * Local-time bucket start:
   * - day:   "YYYY-MM-DD"      (date(reviewed_at, 'localtime'))
   * - week:  "YYYY-Www"        (Monday-start weeks, strftime %W)
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
  buckets: ReviewActivityBucket[];
}

export interface GetReviewActivityOptions {
  period?: ActivityPeriod;
  /**
   * Lower bound as a UTC date "YYYY-MM-DD". Rows are filtered on their UTC
   * date, so this is format-agnostic (reviewed_at is written as both ISO-8601
   * and SQLite datetime strings depending on the caller).
   */
  since?: string;
}

const BUCKET_EXPRESSIONS: Record<ActivityPeriod, string> = {
  day: "date(reviewed_at, 'localtime')",
  week: "strftime('%Y-W%W', reviewed_at, 'localtime')",
  month: "strftime('%Y-%m', reviewed_at, 'localtime')",
};

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

  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];
  if (options.since) {
    conditions.push("date(reviewed_at) >= ?");
    params.push(options.since);
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
    buckets: rows.map((row) => ({
      bucket: row.bucket,
      reviewedCards: row.reviewed,
      studyTimeMs: row.study_time_ms,
    })),
  };
}
