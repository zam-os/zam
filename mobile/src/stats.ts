/**
 * Learning statistics for the mobile companion — Android and iOS (ADR
 * 2026-08-01).
 *
 * The companion talks to the shared kernel directly, so the series comes from
 * `getReviewActivity` rather than the bridge: the view works offline, on the
 * same numbers the desktop app and `zam stats` show.
 *
 * Rendering is split from data on purpose. `buildStatsView` is pure and
 * testable; `renderStatsRows` only turns the result into DOM.
 */

// Deep imports, not the `src/kernel/index.js` barrel: the barrel drags the
// whole kernel — including the Node-only system modules — into the mobile
// bundle, which every other file here avoids the same way.
import {
  type ActivityPeriod,
  formatActivityBucketLabel,
  getReviewActivity,
  type ReviewActivityBucket,
} from "../../src/kernel/analytics/progress.js";
import type { Database } from "../../src/kernel/db/types.js";

export type StatsPeriod = ActivityPeriod;

export interface StatsRow {
  /** Localized bucket label, e.g. "Fr., 31. Juli" or "KW 31". */
  label: string;
  /** The raw bucket key, kept for the row's tooltip/aria text. */
  bucket: string;
  reviewedCards: number;
  /** Localized study time, or `null` when nothing was ever measured. */
  studyTime: string | null;
  /** Bar width in percent of the busiest bucket in the series (2–100). */
  barPercent: number;
}

export interface StatsView {
  period: StatsPeriod;
  rows: StatsRow[];
  totalCards: number;
  /** Localized total study time, or `null` when nothing was measured. */
  totalStudyTime: string | null;
}

export interface StatsFormatters {
  locale: string;
  /** "KW 31" / "Week 31" — `Intl` has no ISO-week format. */
  weekLabel: (isoWeek: number) => string;
  /** "1m 20s" — the caller owns the unit wording. */
  duration: (ms: number) => string;
}

/**
 * Turn an activity series into everything the view needs.
 *
 * A bucket whose study time is zero was reviewed before response times were
 * logged (ADR 2026-08-01 Decision 2). It reports `null` rather than "0s" so
 * the UI can say "not measured" instead of claiming no time was spent.
 */
export function buildStatsView(
  period: StatsPeriod,
  buckets: ReviewActivityBucket[],
  formatters: StatsFormatters,
): StatsView {
  const busiest = Math.max(1, ...buckets.map((b) => b.reviewedCards));
  const totalCards = buckets.reduce((sum, b) => sum + b.reviewedCards, 0);
  const totalMs = buckets.reduce((sum, b) => sum + b.studyTimeMs, 0);

  return {
    period,
    totalCards,
    totalStudyTime: totalMs > 0 ? formatters.duration(totalMs) : null,
    rows: buckets.map((bucket) => ({
      bucket: bucket.bucket,
      label: formatActivityBucketLabel(bucket.bucket, period, {
        locale: formatters.locale,
        weekLabel: formatters.weekLabel,
      }),
      reviewedCards: bucket.reviewedCards,
      studyTime:
        bucket.studyTimeMs > 0 ? formatters.duration(bucket.studyTimeMs) : null,
      barPercent: Math.max(
        2,
        Math.round((bucket.reviewedCards / busiest) * 100),
      ),
    })),
  };
}

/** Read the series for a learner and shape it for display. */
export async function loadStatsView(
  db: Database,
  userId: string,
  period: StatsPeriod,
  formatters: StatsFormatters,
): Promise<StatsView> {
  const activity = await getReviewActivity(db, userId, { period });
  return buildStatsView(period, activity.buckets, formatters);
}
