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
import { join, resolve } from "node:path";
import { confirm, input } from "@inquirer/prompts";
import { Command } from "commander";
import type { Database } from "../../kernel/index.js";
import {
  getConfiguredWorkspaces,
  getDatabaseTargetInfo,
  getSetting,
  hasCommand,
  openDatabase,
  removeConfiguredWorkspace,
  upsertConfiguredWorkspace,
  type WorkspaceConfig,
  type WorkspaceKind,
  type WorkspaceSourceControl,
} from "../../kernel/index.js";
import {
  parseSetupAgents,
  wireSkills,
  writeAgentsMd,
  writeClaudeMd,
  writeCopilotInstructions,
} from "./setup.js";

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

const WORKSPACE_KINDS: WorkspaceKind[] = [
  "personal",
  "team",
  "family",
  "community",
  "organization",
  "custom",
];
const WORKSPACE_SOURCE_CONTROLS: WorkspaceSourceControl[] = [
  "github",
  "azure-devops",
  "git",
  "none",
];

function parseWorkspaceKind(value?: string): WorkspaceKind {
  const kind = (value ?? "custom").toLowerCase();
  if (WORKSPACE_KINDS.includes(kind as WorkspaceKind)) {
    return kind as WorkspaceKind;
  }
  throw new Error(
    `Invalid workspace kind: ${value}. Use ${WORKSPACE_KINDS.join(", ")}.`,
  );
}

function parseWorkspaceSourceControl(
  value?: string,
): WorkspaceSourceControl | undefined {
  if (!value) return undefined;
  const source = value.toLowerCase();
  if (WORKSPACE_SOURCE_CONTROLS.includes(source as WorkspaceSourceControl)) {
    return source as WorkspaceSourceControl;
  }
  throw new Error(
    `Invalid source control: ${value}. Use ${WORKSPACE_SOURCE_CONTROLS.join(", ")}.`,
  );
}

function parseScopes(value?: string): string[] | undefined {
  if (!value) return undefined;
  const scopes = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return scopes.length > 0 ? scopes : undefined;
}

function requireWorkspace(id: string): WorkspaceConfig {
  const workspace = getConfiguredWorkspaces().find((item) => item.id === id);
  if (!workspace) {
    throw new Error(
      `Workspace "${id}" is not configured. Add it with: zam workspace add ${id} --path <dir>`,
    );
  }
  return workspace;
}

workspaceCommand
  .command("list")
  .description("List configured ZAM workspaces")
  .option("--json", "Output as JSON")
  .action((opts: { json?: boolean }) => {
    const workspaces = getConfiguredWorkspaces();
    if (opts.json) {
      console.log(JSON.stringify({ workspaces }, null, 2));
      return;
    }

    console.log("Configured ZAM workspaces:\n");
    if (workspaces.length === 0) {
      console.log(
        "  (none) — add one: zam workspace add personal --path <dir>",
      );
      return;
    }

    for (const workspace of workspaces) {
      const label = workspace.label ? ` (${workspace.label})` : "";
      console.log(`  ${workspace.id}${label}`);
      console.log(`      kind: ${workspace.kind}`);
      console.log(`      path: ${workspace.path}`);
      if (workspace.sourceControl) {
        console.log(`      source: ${workspace.sourceControl}`);
      }
      if (workspace.knowledgeScopes?.length) {
        console.log(`      scopes: ${workspace.knowledgeScopes.join(", ")}`);
      }
    }
  });

workspaceCommand
  .command("add <id>")
  .description("Register an existing directory as a ZAM workspace")
  .requiredOption("--path <dir>", "Existing workspace/repository directory")
  .option(
    "--kind <kind>",
    `Workspace kind (${WORKSPACE_KINDS.join(" | ")})`,
    "custom",
  )
  .option("--label <label>", "Human-readable label")
  .option(
    "--source-control <provider>",
    `Source-control provider (${WORKSPACE_SOURCE_CONTROLS.join(" | ")})`,
  )
  .option("--scopes <list>", "Comma-separated knowledge scopes")
  .option("--default-agent <id>", "Default agent harness for this workspace")
  .action((id, opts) => {
    try {
      const path = resolve(String(opts.path));
      if (!existsSync(path)) {
        console.error(`Workspace path does not exist: ${path}`);
        process.exit(1);
      }
      const workspace: WorkspaceConfig = {
        id,
        kind: parseWorkspaceKind(opts.kind),
        path,
        ...(opts.label ? { label: opts.label } : {}),
        ...(opts.sourceControl
          ? { sourceControl: parseWorkspaceSourceControl(opts.sourceControl) }
          : {}),
        ...(parseScopes(opts.scopes)
          ? { knowledgeScopes: parseScopes(opts.scopes) }
          : {}),
        ...(opts.defaultAgent ? { defaultAgent: opts.defaultAgent } : {}),
      };
      // Provision the skill junctions first; only record the workspace once
      // linking succeeds, so a junction failure never leaves an orphaned entry.
      wireSkills(path, parseSetupAgents());
      upsertConfiguredWorkspace(workspace);
      console.log(`Registered and linked workspace "${id}" at ${path}.`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

workspaceCommand
  .command("remove <id>")
  .description("Unregister a ZAM workspace without deleting its files")
  .action((id) => {
    const existing = getConfiguredWorkspaces().find((item) => item.id === id);
    if (!existing) {
      console.error(`Workspace "${id}" is not configured.`);
      process.exit(1);
    }
    removeConfiguredWorkspace(id);
    console.log(
      `Unregistered workspace "${id}". Files in ${existing.path} were not changed.`,
    );
  });

workspaceCommand
  .command("setup <id>")
  .description("Install ZAM skills into a configured workspace")
  .option(
    "--agents <list>",
    "comma-separated agents to wire: all, claude, copilot, codex, agent",
  )
  .option(
    "--force",
    "overwrite existing skill files and refresh ZAM blocks",
    false,
  )
  .option(
    "--dry-run",
    "show what would be written without changing files",
    false,
  )
  .action((id, opts) => {
    try {
      const workspace = requireWorkspace(id);
      const agents = parseSetupAgents(opts.agents);
      console.log(
        `Setting up workspace "${workspace.id}" in ${workspace.path}${opts.dryRun ? " (dry run)" : ""}\n`,
      );

      wireSkills(workspace.path, agents, {
        force: Boolean(opts.force),
        dryRun: Boolean(opts.dryRun),
      });
      if (agents.has("claude")) {
        writeClaudeMd(false, workspace.path, {
          dryRun: Boolean(opts.dryRun),
          updateExisting: true,
        });
      }
      if (agents.has("codex") || agents.has("agent")) {
        writeAgentsMd(false, workspace.path, {
          dryRun: Boolean(opts.dryRun),
          updateExisting: true,
        });
      }
      if (agents.has("copilot")) {
        writeCopilotInstructions(workspace.path, {
          dryRun: Boolean(opts.dryRun),
          updateExisting: true,
        });
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

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
