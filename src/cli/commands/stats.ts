/**
 * `zam stats` — Learning dashboard.
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
import {
  openDatabase,
  getUserStats,
  getDomainCompetence,
} from "../../kernel/index.js";

function withDb(fn: (db: Database) => void): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  } finally {
    db?.close();
  }
}

export const statsCommand = new Command("stats")
  .description("Show learning dashboard for a user")
  .requiredOption("--user <id>", "User ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const stats = getUserStats(db, opts.user);
      const domains = getDomainCompetence(db, opts.user);

      if (opts.json) {
        console.log(JSON.stringify({ stats, domains }, null, 2));
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
        console.log("  " + "─".repeat(74));
        for (const d of domains) {
          console.log(
            `  ${d.domain.padEnd(17)} ${String(d.totalCards).padEnd(6)} ${String(d.matureCards).padEnd(7)} ${String(d.avgStability).padEnd(10)} ${(d.retentionRate * 100).toFixed(1).padStart(5)}%     ${d.suggestedMode}`,
          );
        }
      }
    });
  });
