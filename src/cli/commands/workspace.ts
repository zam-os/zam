/**
 * `zam workspace` — Workspace management commands.
 *
 * `zam workspace publish` initializes a Git repository inside the local sandbox
 * workspace and pushes it to GitHub, establishing a secure version-controlled backup
 * and change-managed team workflow.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { confirm, input } from "@inquirer/prompts";
import { Command } from "commander";
import type { Database } from "../../kernel/index.js";
import {
  getDatabaseTargetInfo,
  getSetting,
  hasCommand,
  openDatabase,
} from "../../kernel/index.js";

/**
 * Execute a shell command inside a specific directory.
 */
function runGit(cwd: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd,
      stdio: "pipe",
      encoding: "utf8",
    }).trim();
  } catch (err) {
    throw new Error(`Git command failed: ${(err as Error).message}`);
  }
}

export function ghRepoCreateArgs(
  repoName: string,
  repoVisibility: "--private" | "--public",
): string[] {
  return ["repo", "create", repoName, repoVisibility, "--source=.", "--push"];
}

export function gitRemoteArgs(githubUrl: string, hasOrigin: boolean): string[] {
  return hasOrigin
    ? ["remote", "set-url", "origin", githubUrl]
    : ["remote", "add", "origin", githubUrl];
}

export const workspaceCommand = new Command("workspace").description(
  "Manage your ZAM learning workspace",
);

workspaceCommand
  .command("publish")
  .description("Publish your local workspace sandbox to GitHub")
  .action(async () => {
    let db: Awaited<ReturnType<typeof openDatabase>> | undefined;
    let workspaceDir = "";

    try {
      db = await openDatabase();
      workspaceDir = (await getSetting(db, "personal.workspace_dir")) || "";
      await db.close();
    } catch {
      // Fallback if DB doesn't exist
      await db?.close();
    }

    if (!workspaceDir) {
      console.error(
        "\x1b[31m✗ No active workspace configured. Please run `zam init` first.\x1b[0m",
      );
      process.exit(1);
    }

    if (!existsSync(workspaceDir)) {
      console.error(
        `\x1b[31m✗ Workspace directory does not exist: ${workspaceDir}\x1b[0m`,
      );
      process.exit(1);
    }

    console.log(`\nActive workspace: \x1b[36m${workspaceDir}\x1b[0m`);

    // ── Check Git command ────────────────────────────────────────────────────
    if (!hasCommand("git")) {
      console.error(
        "\x1b[31m✗ Git command was not found on this system. Please install Git first.\x1b[0m",
      );
      process.exit(1);
    }

    // ── Setup .gitignore ─────────────────────────────────────────────────────
    const gitignorePath = join(workspaceDir, ".gitignore");
    if (!existsSync(gitignorePath)) {
      writeFileSync(
        gitignorePath,
        "node_modules/\n.agent/\n.agents/\n.claude/\n.gemini/\n.goose/\n*.log\n",
        "utf8",
      );
    }

    // ── Initialize Local Git Repo ────────────────────────────────────────────
    const hasGitRepo = existsSync(join(workspaceDir, ".git"));
    if (!hasGitRepo) {
      console.log("Initializing local Git repository...");
      runGit(workspaceDir, ["init", "-b", "main"]);
      runGit(workspaceDir, ["add", "."]);
      runGit(workspaceDir, [
        "commit",
        "-m",
        "chore: initial workspace sandbox bootstrap",
      ]);
      console.log("\x1b[32m✓ Local Git repository initialized.\x1b[0m");
    } else {
      console.log("Git repository is already initialized.");
    }

    // ── GitHub Publishing options ────────────────────────────────────────────
    const repoName = await input({
      message: "Choose a name for your GitHub repository:",
      default: "zam-personal",
    });

    const isPrivate = await confirm({
      message: "Should the repository be private?",
      default: true,
    });

    const repoVisibility = isPrivate ? "--private" : "--public";

    // ── Method A: Using GitHub CLI (gh) ──────────────────────────────────────
    if (hasCommand("gh")) {
      console.log("GitHub CLI detected! Automating repository creation...");
      const proceedGh = await confirm({
        message:
          "Would you like ZAM to create the repository using the GitHub CLI?",
        default: true,
      });

      if (proceedGh) {
        try {
          console.log(`Creating GitHub repository ${repoName}...`);
          execFileSync("gh", ghRepoCreateArgs(repoName, repoVisibility), {
            cwd: workspaceDir,
            stdio: "inherit",
          });
          console.log(
            "\n\x1b[32m✓ Successfully published workspace to GitHub!\x1b[0m",
          );
          process.exit(0);
        } catch (err) {
          console.warn(
            `\x1b[33m⚠ GitHub CLI creation failed: ${(err as Error).message}\x1b[0m`,
          );
        }
      }
    }

    // ── Method B: Manual Git setup instructions ──────────────────────────────
    console.log(
      "\n\x1b[1mPlease create the repository manually on GitHub:\x1b[0m",
    );
    console.log("  1. Go to https://github.com/new");
    console.log(`  2. Name it exactly: \x1b[36m${repoName}\x1b[0m`);
    console.log(
      `  3. Choose \x1b[36m${isPrivate ? "Private" : "Public"}\x1b[0m`,
    );
    console.log(
      "  4. Do NOT initialize it with README, .gitignore, or license",
    );
    console.log("  5. Click 'Create repository'\n");

    const githubUrl = await input({
      message:
        "Paste the repository Git URL (e.g. git@github.com:user/repo.git):",
    });

    if (githubUrl) {
      try {
        console.log("Linking remote repository and pushing...");
        // Check if origin already exists
        let hasOrigin = false;
        try {
          runGit(workspaceDir, ["remote", "get-url", "origin"]);
          hasOrigin = true;
        } catch {}

        runGit(workspaceDir, gitRemoteArgs(githubUrl, hasOrigin));

        runGit(workspaceDir, ["push", "-u", "origin", "main"]);
        console.log(
          "\x1b[32m✓ Successfully linked and pushed to GitHub!\x1b[0m",
        );
      } catch (err) {
        console.error(
          `\x1b[31m✗ Push failed: ${(err as Error).message}\x1b[0m`,
        );
        console.log(
          "You can push manually later using: git push -u origin main",
        );
      }
    }
  });

/**
 * Consistent single-file backup of the open database into
 * `<targetDir>/zam-backups/`. Uses SQLite `VACUUM INTO`, which writes a clean
 * snapshot even in WAL mode with a live connection. Returns the backup path.
 */
export async function backupDatabaseTo(
  db: Database,
  targetDir: string,
): Promise<string> {
  const backupDir = join(targetDir, "zam-backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = join(backupDir, `zam-${stamp}.db`);
  await db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  return dest;
}

workspaceCommand
  .command("data-dir")
  .description("Print the ZAM data directory (database, credentials, config)")
  .option("--json", "Output as JSON")
  .action((opts: { json?: boolean }) => {
    const dir = join(homedir(), ".zam");
    console.log(opts.json ? JSON.stringify({ dataDir: dir }) : dir);
  });

workspaceCommand
  .command("backup")
  .description("Back up the local ZAM database into your workspace")
  .option(
    "--dir <path>",
    "Target directory (default: workspace dir, else ~/Documents/zam)",
  )
  .option("--json", "Output as JSON")
  .action(async (opts: { dir?: string; json?: boolean }) => {
    const target = getDatabaseTargetInfo();
    if (target.kind !== "local") {
      const reason = `The database is ${target.kind} (${target.location}); file backup applies only to a local database — your Turso remote is already the cloud backup.`;
      if (opts.json) {
        console.log(JSON.stringify({ ok: false, reason }));
        return;
      }
      console.error(`\x1b[33m⚠ ${reason}\x1b[0m`);
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      db = await openDatabase();
      const workspaceDir =
        opts.dir ||
        (await getSetting(db, "personal.workspace_dir")) ||
        join(homedir(), "Documents", "zam");
      const dest = await backupDatabaseTo(db, workspaceDir);
      if (opts.json) {
        console.log(JSON.stringify({ ok: true, path: dest }));
      } else {
        console.log(`\x1b[32m✓ Database backed up to ${dest}\x1b[0m`);
      }
    } catch (err) {
      const reason = (err as Error).message;
      if (opts.json) {
        console.log(JSON.stringify({ ok: false, reason }));
      } else {
        console.error(`\x1b[31m✗ Backup failed: ${reason}\x1b[0m`);
      }
      process.exit(1);
    } finally {
      await db?.close();
    }
  });
