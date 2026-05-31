/**
 * `zam git-sync` — Git integration subcommand.
 *
 * Automatically marks cards as stale/due when their source files change in git.
 */

import { execSync } from "node:child_process";
import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import type { Database } from "libsql";
import type { Token } from "../../kernel/index.js";
import {
  getCard,
  matchesFilePath,
  openDatabase,
  updateCard,
} from "../../kernel/index.js";
import { resolveUser } from "./resolve-user.js";

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

/**
 * Installs the Git post-commit hook.
 */
function installHook(): void {
  const gitDir = join(process.cwd(), ".git");
  if (!existsSync(gitDir)) {
    console.error(
      "Error: Current directory is not the root of a Git repository.",
    );
    process.exit(1);
  }

  const hooksDir = join(gitDir, "hooks");
  const hookPath = join(hooksDir, "post-commit");

  const hookContent = `#!/bin/sh
# ZAM Spaced Repetition Auto-Stale Hook
# Triggered automatically on git commits to decay modified concept cards.
zam git-sync --commit HEAD --quiet
`;

  try {
    writeFileSync(hookPath, hookContent, { encoding: "utf-8", flag: "w" });
    try {
      chmodSync(hookPath, "755");
    } catch (e) {
      // Best-effort chmod (Windows might ignore/fail, which is fine)
    }
    console.log(
      "Successfully installed ZAM post-commit hook at .git/hooks/post-commit",
    );
  } catch (err) {
    console.error("Failed to write post-commit hook:", (err as Error).message);
    process.exit(1);
  }
}

export const gitSyncCommand = new Command("git-sync")
  .description("Sync learning cards with recent Git file modifications")
  .option("--commit <hash>", "Git commit hash to check", "HEAD")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--install", "Install git post-commit hook in current repo")
  .option("--quiet", "Suppress verbose output")
  .action((opts) => {
    if (opts.install) {
      installHook();
      return;
    }

    withDb((db) => {
      const userId = resolveUser(opts, db);

      let changedFiles: string[] = [];
      try {
        const output = execSync(
          `git diff-tree --no-commit-id --name-only -r ${opts.commit}`,
          {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
          },
        );
        changedFiles = output
          .split(/\r?\n/)
          .map((f) => f.trim())
          .filter(Boolean);
      } catch (err) {
        if (!opts.quiet) {
          console.warn(
            "Notice: Failed to read git modifications. Ensure you are in a Git repo and commit hash is valid.",
          );
        }
        return;
      }

      if (changedFiles.length === 0) {
        if (!opts.quiet) {
          console.log("No file changes detected in commit.");
        }
        return;
      }

      // Fetch active tokens
      const tokens = db
        .prepare(`
        SELECT * FROM tokens 
        WHERE source_link IS NOT NULL 
          AND deprecated_at IS NULL
      `)
        .all() as Token[];

      const matchedTokens: Token[] = [];

      for (const token of tokens) {
        const matches = changedFiles.some((cf) =>
          matchesFilePath(token.source_link, cf),
        );
        if (matches) {
          matchedTokens.push(token);
        }
      }

      if (matchedTokens.length === 0) {
        if (!opts.quiet) {
          console.log(
            `Scanned ${changedFiles.length} file(s), no associated learning tokens found.`,
          );
        }
        return;
      }

      let decayedCount = 0;
      const now = new Date().toISOString();

      for (const token of matchedTokens) {
        const card = getCard(db, token.id, userId);
        if (card) {
          // Decay stability to a quarter (concept's source changed → likely stale),
          // with a 0.2-day floor so the card surfaces for review soon. Using max,
          // not min: min would collapse every card to <=0.2 regardless of prior strength.
          const newStability = Math.max(0.2, card.stability / 4.0);

          db.prepare(`
            UPDATE cards
            SET due_at = ?,
                stability = ?,
                state = CASE WHEN state = 'new' THEN 'new' ELSE 'review' END,
                elapsed_days = 0.0,
                scheduled_days = 0.0
            WHERE id = ?
          `).run(now, newStability, card.id);

          decayedCount++;
          if (!opts.quiet) {
            console.log(
              `  Decayed card for: ${token.slug} (Source: ${token.source_link})`,
            );
          }
        }
      }

      if (!opts.quiet) {
        console.log(
          `\nZAM Auto-Stale Complete: Scanned ${changedFiles.length} file(s).`,
        );
        console.log(
          `Successfully decayed FSRS stability and scheduled reviews for ${decayedCount} concept(s).`,
        );
      }
    });
  });
