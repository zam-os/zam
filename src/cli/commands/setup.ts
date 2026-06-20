/**
 * `zam setup` — Distribute skill files from the zam package into the current
 * personal instance's agent skill directories, and optionally initialize the
 * ZAM database and generate agent-specific instruction files.
 *
 * Run this once after cloning a ZAM personal instance, and again after
 * upgrading zam (with --force) to refresh the skill files.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
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

const SKILL_PAIRS: Array<{ from: string; to: string }> = [
  {
    from: join(packageRoot, ".claude", "skills", "zam", "SKILL.md"),
    to: join(".claude", "skills", "zam", "SKILL.md"),
  },
  {
    from: join(packageRoot, ".agent", "skills", "zam", "SKILL.md"),
    to: join(".agent", "skills", "zam", "SKILL.md"),
  },
  {
    from: join(packageRoot, ".agents", "skills", "zam", "SKILL.md"),
    to: join(".agents", "skills", "zam", "SKILL.md"),
  },
];

export function copySkills(force: boolean, cwd: string = process.cwd()): void {
  let anyAction = false;

  for (const { from, to } of SKILL_PAIRS) {
    const dest = join(cwd, to);

    if (!existsSync(from)) {
      console.warn(`  warn  source not found, skipping: ${from}`);
      continue;
    }

    if (existsSync(dest) && !force) {
      console.log(`  skip  ${to} (already present â€” use --force to update)`);
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

export function writeClaudeMd(
  skipClaudeMd: boolean,
  cwd: string = process.cwd(),
): void {
  if (skipClaudeMd) return;

  const dest = join(cwd, "CLAUDE.md");
  if (existsSync(dest)) {
    console.log(`  skip  CLAUDE.md (already present)`);
    return;
  }

  const name = basename(cwd);
  writeFileSync(
    dest,
    `# ZAM Personal Kernel â€” ${name}

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
`,
    "utf8",
  );
  console.log(`  write CLAUDE.md`);
}

export function writeAgentsMd(
  skipAgentsMd: boolean,
  cwd: string = process.cwd(),
): void {
  if (skipAgentsMd) return;

  const dest = join(cwd, "AGENTS.md");
  if (existsSync(dest)) {
    console.log(`  skip  AGENTS.md (already present)`);
    return;
  }

  const name = basename(cwd);
  writeFileSync(
    dest,
    `# ZAM Personal Kernel - ${name}

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
`,
    "utf8",
  );
  console.log(`  write AGENTS.md`);
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
  .action(
    async (opts: {
      force: boolean;
      skipInit: boolean;
      skipClaudeMd: boolean;
      skipAgentsMd: boolean;
    }) => {
      console.log(`Setting up ZAM in ${process.cwd()}\n`);

      copySkills(opts.force);
      await initDatabase(opts.skipInit);
      writeClaudeMd(opts.skipClaudeMd);
      writeAgentsMd(opts.skipAgentsMd);

      console.log(
        "\nDone. Run `zam whoami --set <your-id>` to set your identity. Start the `zam` skill with `/zam` in Claude/Gemini-compatible clients or `$zam` (or `/skills`) in Codex.",
      );
    },
  );
