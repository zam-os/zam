/**
 * `zam setup` — Link skill directories from the ZAM package into the current
 * personal instance's agent skill directories, and optionally initialize the
 * ZAM database and generate agent-specific instruction files.
 *
 * Run this once after cloning a ZAM personal instance. Linked workspaces pick
 * up future ZAM updates automatically.
 */

import { resolve } from "node:path";
import { Command } from "commander";
import {
  type Database,
  type DatabaseTargetInfo,
  getDatabaseTargetInfo,
  getMachineAiConfig,
  getSetting,
  openDatabaseWithSync,
  setSetting,
} from "../../kernel/index.js";
import {
  parseSetupAgents,
  type SetupAgent,
  wireSkills,
  writeAgentsMd,
  writeClaudeMd,
  writeCopilotInstructions,
} from "../provisioning/index.js";

export function formatDatabaseInitTarget(target: DatabaseTargetInfo): string {
  switch (target.kind) {
    case "local":
      return `ZAM database at ${target.location} (local SQLite)`;
    case "turso-remote":
      return `ZAM database via Turso remote at ${target.location}`;
    case "turso-native":
      return `ZAM database via Turso native driver at ${target.location}`;
    case "turso-replica":
      return `ZAM database replica at ${target.location} syncing from ${target.syncUrl}`;
  }
}

async function initDatabase(skipInit: boolean): Promise<void> {
  if (skipInit) return;

  try {
    const target = getDatabaseTargetInfo();
    const db = await openDatabaseWithSync({ initialize: true });
    await activateMachineProviderConfig(db);
    await db.close();
    console.log(`  init  ${formatDatabaseInitTarget(target)}`);
  } catch (err) {
    // Database may already exist â€” not an error during setup.
    const msg = (err as Error).message;
    if (!msg.includes("already")) {
      console.warn(`  warn  database init: ${msg}`);
    } else {
      console.log(`  skip  database already initialized`);
    }
  }
}

export async function activateMachineProviderConfig(
  db: Database,
): Promise<void> {
  const machineAi = getMachineAiConfig();
  const providerCount = Object.keys(machineAi.providers ?? {}).length;
  const roleCount = Object.keys(machineAi.roles ?? {}).length;
  if (providerCount === 0 && roleCount === 0) return;
  if ((await getSetting(db, "llm.enabled")) !== undefined) return;

  await setSetting(db, "llm.enabled", "true");
  console.log(
    `  activate  ${providerCount} machine-local provider(s) from ~/.zam/config.json`,
  );
}

export const setupCommand = new Command("setup")
  .description(
    "Link ZAM skill directories into this workspace and initialize the database",
  )
  .option("--force", "replace an unmanaged existing ZAM skill directory", false)
  .option("--skip-init", "skip database initialization", false)
  .option("--skip-claude-md", "skip CLAUDE.md generation", false)
  .option("--skip-agents-md", "skip AGENTS.md generation", false)
  .option("--target <path>", "repository/workspace directory to set up")
  .option(
    "--agents <list>",
    "comma-separated agents to wire: all, claude, copilot, codex, agent",
  )
  .option(
    "--dry-run",
    "show what would be written without changing files",
    false,
  )
  .action(
    async (opts: {
      force: boolean;
      skipInit: boolean;
      skipClaudeMd: boolean;
      skipAgentsMd: boolean;
      target?: string;
      agents?: string;
      dryRun: boolean;
    }) => {
      let agents: Set<SetupAgent>;
      try {
        agents = parseSetupAgents(opts.agents);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }

      const target = resolve(opts.target ?? process.cwd());
      const updateExistingInstructions = Boolean(opts.target) || opts.force;
      console.log(
        `Setting up ZAM in ${target}${opts.dryRun ? " (dry run)" : ""}\n`,
      );

      wireSkills(target, agents, {
        force: opts.force,
        dryRun: opts.dryRun,
      });
      await initDatabase(opts.skipInit || opts.dryRun);
      if (agents.has("claude")) {
        writeClaudeMd(opts.skipClaudeMd, target, {
          dryRun: opts.dryRun,
          updateExisting: updateExistingInstructions,
        });
      }
      if (agents.has("codex") || agents.has("agent")) {
        writeAgentsMd(opts.skipAgentsMd, target, {
          dryRun: opts.dryRun,
          updateExisting: updateExistingInstructions,
        });
      }
      if (agents.has("copilot") && (opts.target || opts.agents)) {
        writeCopilotInstructions(target, {
          dryRun: opts.dryRun,
          updateExisting: updateExistingInstructions,
        });
      }

      console.log(
        "\nDone. Run `zam whoami --set <your-id>` to set your identity. Start the `zam` skill with `/zam` in Claude/Copilot/Gemini-compatible clients or `$zam` (or `/skills`) in Codex.",
      );
    },
  );
