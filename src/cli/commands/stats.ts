/**
 * `zam stats` — Learning dashboard and review activity.
 */

import { Command } from "commander";
import {
  getDomainCompetence,
  getReviewActivity,
  getUserStats,
} from "../../kernel/index.js";
import { resolveUser } from "../users/identity.js";
import {
  resolveActivityPeriod,
  resolveActivityWindow,
} from "./shared/activity.js";
import { withDb } from "./shared/db.js";

/**
 * Study time for one bucket. Zero means "never measured" — reviews logged
 * before ADR 2026-08-01 closed the logging gap carry no response time — and
 * reads as an em dash rather than a truthful-looking "0s".
 */
function formatStudyTime(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export const statsCommand = new Command("stats")
  .description("Show learning dashboard for a user")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--json", "Output as JSON")
  .option(
    "--period <day|week|month>",
    "Review activity period (default: day)",
    "day",
  )
  .option(
    "--window <n>",
    "How many periods to show (default: 30 days / 12 weeks / 6 months)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db);
      const stats = await getUserStats(db, userId);
      const domains = await getDomainCompetence(db, userId);

      const period = resolveActivityPeriod(opts.period);
      const activity = await getReviewActivity(db, userId, {
        period,
        window: resolveActivityWindow(opts.window, period),
      });
      if (opts.json) {
        console.log(JSON.stringify({ stats, domains, activity }, null, 2));
        return;
      }

      console.log(`Learning Dashboard — ${stats.userId}`);
      console.log("═".repeat(50));
      console.log(`  Total tokens:     ${stats.totalTokens}`);
      console.log(`  Cards in deck:    ${stats.cardsInDeck}`);
      console.log(`  Due today:        ${stats.dueToday}`);
      console.log(`  Blocked:          ${stats.blocked}`);
      console.log(`  Mature:           ${stats.mature}`);
      console.log(`  Avg stability:    ${stats.avgStability ?? "N/A"}`);
      console.log(`  Total sessions:   ${stats.totalSessions}`);
      console.log(`  Last session:     ${stats.lastSession ?? "N/A"}`);

      if (domains.length > 0) {
        console.log("\nDomain Competence:");
        console.log("─".repeat(80));
        console.log(
          "  Domain           Cards  Mature  Stability  Retention  Suggested Mode",
        );
        console.log(`  ${"─".repeat(74)}`);
        for (const d of domains) {
          console.log(
            `  ${d.domain.padEnd(17)} ${String(d.totalCards).padEnd(6)} ${String(d.matureCards).padEnd(7)} ${String(d.avgStability).padEnd(10)} ${(d.retentionRate * 100).toFixed(1).padStart(5)}%     ${d.suggestedMode}`,
          );
        }
      }

      if (activity.buckets.length > 0) {
        console.log(
          `\nReview Activity (per ${period}, last ${activity.window}):`,
        );
        console.log("─".repeat(50));
        console.log("  Bucket            Cards  Study time");
        for (const b of activity.buckets) {
          console.log(
            `  ${b.bucket.padEnd(18)} ${String(b.reviewedCards).padEnd(6)} ${formatStudyTime(b.studyTimeMs)}`,
          );
        }
        const totalCards = activity.buckets.reduce(
          (s, b) => s + b.reviewedCards,
          0,
        );
        const totalTime = activity.buckets.reduce(
          (s, b) => s + b.studyTimeMs,
          0,
        );
        console.log("─".repeat(50));
        console.log(
          `  Total             ${String(totalCards).padEnd(6)} ${formatStudyTime(totalTime)}`,
        );
      } else {
        console.log(
          "\nNo review activity in the window. Review some cards to see progress here.",
        );
      }
    });
  });
