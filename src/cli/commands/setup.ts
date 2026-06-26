/**
 * `zam setup` — Distribute skill files from the zam package into the current
 * personal instance's agent skill directories, and optionally initialize the
 * ZAM database and generate agent-specific instruction files.
 *
 * Run this once after cloning a ZAM personal instance, and again after
 * upgrading zam (with --force) to refresh the skill files.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  type DatabaseTargetInfo,
  getDatabaseTargetInfo,
  openDatabaseWithSync,
} from "../../kernel/index.js";

// The bundled CLI resolves from dist/cli/index.js; source tests resolve from
// src/cli/commands/setup.ts. Select the first candidate containing package.json.
const packageRoot =
  [
    fileURLToPath(new URL("../..", import.meta.url)),
    fileURLToPath(new URL("../../..", import.meta.url)),
  ].find((candidate) => existsSync(join(candidate, "package.json"))) ??
  fileURLToPath(new URL("../..", import.meta.url));

export type SetupAgent = "claude" | "copilot" | "codex" | "agent";

const ALL_SETUP_AGENTS: SetupAgent[] = ["claude", "copilot", "codex", "agent"];

const SKILL_PAIRS: Array<{
  from: string;
  to: string;
  agents: SetupAgent[];
}> = [
  {
    from: join(packageRoot, ".claude", "skills", "zam", "SKILL.md"),
    to: join(".claude", "skills", "zam", "SKILL.md"),
    agents: ["claude", "copilot"],
  },
  {
    from: join(packageRoot, ".agent", "skills", "zam", "SKILL.md"),
    to: join(".agent", "skills", "zam", "SKILL.md"),
    agents: ["agent"],
  },
  {
    from: join(packageRoot, ".agents", "skills", "zam", "SKILL.md"),
    to: join(".agents", "skills", "zam", "SKILL.md"),
    agents: ["codex"],
  },
];

export function parseSetupAgents(value?: string): Set<SetupAgent> {
  if (!value || value.trim().toLowerCase() === "all") {
    return new Set(ALL_SETUP_AGENTS);
  }
  const aliases: Record<string, SetupAgent[]> = {
    claude: ["claude"],
    copilot: ["copilot"],
    codex: ["codex"],
    agent: ["agent"],
    opencode: ["agent"],
  };
  const selected = new Set<SetupAgent>();
  for (const raw of value.split(",")) {
    const key = raw.trim().toLowerCase();
    const mapped = aliases[key];
    if (!mapped) {
      throw new Error(
        `Unknown agent "${raw}". Use: all, claude, copilot, codex, agent.`,
      );
    }
    for (const item of mapped) selected.add(item);
  }
  return selected;
}

export function copySkills(
  force: boolean,
  cwd: string = process.cwd(),
  agents: Set<SetupAgent> = parseSetupAgents(),
  dryRun = false,
): void {
  let anyAction = false;

  for (const { from, to, agents: pairAgents } of SKILL_PAIRS) {
    if (!pairAgents.some((agent) => agents.has(agent))) continue;
    const dest = join(cwd, to);

    if (!existsSync(from)) {
      console.warn(`  warn  source not found, skipping: ${from}`);
      continue;
    }

    if (existsSync(dest) && !force) {
      console.log(`  skip  ${to} (already present â€” use --force to update)`);
      continue;
    }

    if (dryRun) {
      console.log(`  would copy  ${to}`);
      anyAction = true;
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(from, dest);
    console.log(`  copy  ${to}`);
    anyAction = true;
  }

  if (!anyAction && !force) {
    console.log(
      "\nSkill files are already up to date. Run with --force to overwrite.",
    );
  }
}

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

const ZAM_BLOCK_START = "<!-- ZAM:START -->";
const ZAM_BLOCK_END = "<!-- ZAM:END -->";

function upsertMarkedBlock(
  dest: string,
  blockBody: string,
  dryRun: boolean,
): "write" | "update" | "skip" {
  const block = `${ZAM_BLOCK_START}\n${blockBody.trim()}\n${ZAM_BLOCK_END}`;
  if (!existsSync(dest)) {
    if (!dryRun) {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, `${block}\n`, "utf8");
    }
    return "write";
  }

  const existing = readFileSync(dest, "utf8");
  if (existing.includes(block)) return "skip";

  const start = existing.indexOf(ZAM_BLOCK_START);
  const end = existing.indexOf(ZAM_BLOCK_END);
  const next =
    start >= 0 && end > start
      ? `${existing.slice(0, start)}${block}${existing.slice(end + ZAM_BLOCK_END.length)}`
      : `${existing.trimEnd()}\n\n${block}\n`;

  if (!dryRun) writeFileSync(dest, next, "utf8");
  return start >= 0 && end > start ? "update" : "write";
}

function logInstructionAction(
  action: "write" | "update" | "skip",
  label: string,
  dryRun: boolean,
): void {
  if (action === "skip") {
    console.log(`  skip  ${label} (ZAM block already present)`);
  } else {
    console.log(`  ${dryRun ? "would " : ""}${action} ${label}`);
  }
}

export interface InstructionWriteOptions {
  dryRun?: boolean;
  updateExisting?: boolean;
}

export function writeClaudeMd(
  skipClaudeMd: boolean,
  cwd: string = process.cwd(),
  opts: InstructionWriteOptions = {},
): void {
  if (skipClaudeMd) return;

  const dest = join(cwd, "CLAUDE.md");
  if (existsSync(dest)) {
    if (!opts.updateExisting) {
      console.log(`  skip  CLAUDE.md (already present)`);
      return;
    }
    const action = upsertMarkedBlock(
      dest,
      `## ZAM learning sessions

ZAM is available in this repository. Use the \`zam\` skill in Claude Code to turn real work into an observed learning session with active recall and FSRS scheduling.

- Skill files live under \`.claude/skills/zam/\`.
- Fast-changing review data lives in \`~/.zam/\`, not in this repository.
- Run \`zam setup --target . --agents claude,copilot --force\` after upgrading ZAM to refresh the skill.`,
      Boolean(opts.dryRun),
    );
    logInstructionAction(action, "CLAUDE.md", Boolean(opts.dryRun));
    return;
  }

  const name = basename(cwd);
  const content = `# ZAM Personal Kernel â€” ${name}

This is a ZAM personal instance. ZAM builds lasting skills through spaced
repetition during real work â€” not separate study sessions.

## First time here?
Run \`/setup\` in Claude Code or Gemini CLI to complete first-time setup.

## Regular use
Run \`/zam\` to start a learning session on whatever you are working on.

## What lives here
- \`beliefs/\` â€” your worldview, approved by git commit
- \`goals/\` â€” your objectives, decomposed into tasks and learning tokens

## Fast-changing data
Learning tokens, cards, and review history live in local SQLite by default.
Use \`zam connector setup turso\` to store cloud credentials in
\`~/.zam/credentials.json\` and use a Turso database across machines.
`;
  if (opts.dryRun) {
    console.log(`  would write CLAUDE.md`);
  } else {
    writeFileSync(dest, content, "utf8");
    console.log(`  write CLAUDE.md`);
  }
}

export function writeAgentsMd(
  skipAgentsMd: boolean,
  cwd: string = process.cwd(),
  opts: InstructionWriteOptions = {},
): void {
  if (skipAgentsMd) return;

  const dest = join(cwd, "AGENTS.md");
  if (existsSync(dest)) {
    if (!opts.updateExisting) {
      console.log(`  skip  AGENTS.md (already present)`);
      return;
    }
    const action = upsertMarkedBlock(
      dest,
      `## ZAM learning sessions

ZAM is available in this repository. Select the \`zam\` skill through \`/skills\` or invoke \`$zam\` where supported to turn real work into an observed learning session with active recall and FSRS scheduling.

- Skill files live under \`.agents/skills/zam/\`.
- Fast-changing review data lives in \`~/.zam/\`, not in this repository.
- Run \`zam setup --target . --agents codex,agent --force\` after upgrading ZAM to refresh the skill.`,
      Boolean(opts.dryRun),
    );
    logInstructionAction(action, "AGENTS.md", Boolean(opts.dryRun));
    return;
  }

  const name = basename(cwd);
  const content = `# ZAM Personal Kernel - ${name}

This is a ZAM personal instance. ZAM builds lasting skills through spaced
repetition during real work, not separate study sessions.

## First time here?
Run \`zam setup\` from the shell. When this repository includes
\`.agents/skills/setup/\`, you can instead select \`setup\` through \`/skills\`
or invoke \`$setup\`.

## Regular use
Select the \`zam\` skill through \`/skills\` or invoke \`$zam\` to start a
learning session on whatever you are working on.

## What lives here
- \`beliefs/\` - your worldview, approved by git commit
- \`goals/\` - your objectives, decomposed into tasks and learning tokens

## Fast-changing data
Learning tokens, cards, and review history live in local SQLite by default.
Use \`zam connector setup turso\` to store cloud credentials in
\`~/.zam/credentials.json\` and use a Turso database across machines.

## Codex skills
Codex discovers repository skills under \`.agents/skills/\`. Run
\`zam setup --force\` after upgrading \`zam-core\` to refresh them.
`;
  if (opts.dryRun) {
    console.log(`  would write AGENTS.md`);
  } else {
    writeFileSync(dest, content, "utf8");
    console.log(`  write AGENTS.md`);
  }
}

export function writeCopilotInstructions(
  cwd: string = process.cwd(),
  opts: InstructionWriteOptions = {},
): void {
  const dest = join(cwd, ".github", "copilot-instructions.md");
  const action = upsertMarkedBlock(
    dest,
    `## ZAM learning sessions

ZAM is available in this repository through \`.claude/skills/zam/\`. Use the \`zam\` project skill from Copilot-compatible skill selection surfaces to turn real work into an observed learning session with active recall and FSRS scheduling.

- Fast-changing review data lives in \`~/.zam/\`, not in this repository.
- Run \`zam setup --target . --agents copilot --force\` after upgrading ZAM to refresh the skill.`,
    Boolean(opts.dryRun),
  );
  logInstructionAction(
    action,
    ".github/copilot-instructions.md",
    Boolean(opts.dryRun),
  );
}

export const setupCommand = new Command("setup")
  .description(
    "Distribute ZAM skill files into this personal instance and initialize the database",
  )
  .option(
    "--force",
    "overwrite existing skill files (use after upgrading zam)",
    false,
  )
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

      copySkills(opts.force, target, agents, opts.dryRun);
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
