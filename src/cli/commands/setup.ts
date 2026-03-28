/**
 * `zam setup` — Distribute skill files from the zam package into the current
 * personal instance's .claude/ and .gemini/ directories, and optionally
 * initialize the ZAM database and generate a CLAUDE.md.
 *
 * Run this once after cloning a ZAM personal instance, and again after
 * upgrading zam (with --force) to refresh the skill files.
 */

import { Command } from "commander";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import { openDatabase, getDefaultDbPath } from "../../kernel/index.js";

// The compiled CLI lives at dist/cli/index.js inside the package.
// Two levels up from there is the package root (dist/ → package root).
// This same relative path also works when running via `tsx src/cli/index.ts`
// (src/ → package root), so no branch logic is needed.
const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

const SKILL_PAIRS: Array<{ from: string; to: string }> = [
  {
    from: join(packageRoot, ".claude", "skills", "zam", "SKILL.md"),
    to: join(".claude", "skills", "zam", "SKILL.md"),
  },
  {
    from: join(packageRoot, ".gemini", "skills", "zam", "SKILL.md"),
    to: join(".gemini", "skills", "zam", "SKILL.md"),
  },
];

function copySkills(force: boolean): void {
  const cwd = process.cwd();
  let anyAction = false;

  for (const { from, to } of SKILL_PAIRS) {
    const dest = join(cwd, to);

    if (!existsSync(from)) {
      console.warn(`  warn  source not found, skipping: ${from}`);
      continue;
    }

    if (existsSync(dest) && !force) {
      console.log(`  skip  ${to} (already present — use --force to update)`);
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

function initDatabase(skipInit: boolean): void {
  if (skipInit) return;

  try {
    const dbPath = getDefaultDbPath();
    const db = openDatabase({ initialize: true });
    db.close();
    console.log(`  init  ZAM database at ${dbPath}`);
  } catch (err) {
    // Database may already exist — not an error during setup.
    const msg = (err as Error).message;
    if (!msg.includes("already")) {
      console.warn(`  warn  database init: ${msg}`);
    } else {
      console.log(`  skip  database already initialized`);
    }
  }
}

function writeClaudeMd(skipClaudeMd: boolean): void {
  if (skipClaudeMd) return;

  const dest = join(process.cwd(), "CLAUDE.md");
  if (existsSync(dest)) {
    console.log(`  skip  CLAUDE.md (already present)`);
    return;
  }

  const name = basename(process.cwd());
  writeFileSync(
    dest,
    `# ZAM Personal Kernel — ${name}

This is a ZAM personal instance. ZAM builds lasting skills through spaced
repetition during real work — not separate study sessions.

## First time here?
Run \`/setup\` in Claude Code or Gemini CLI to complete first-time setup.

## Regular use
Run \`/zam\` to start a learning session on whatever you are working on.

## What lives here
- \`beliefs/\` — your worldview, approved by git commit
- \`goals/\` — your objectives, decomposed into tasks and learning tokens

## Fast-changing data
Learning tokens, cards, and review history live in \`~/.zam/zam.db\` (local
SQLite, not committed to git). Use \`zam connector setup turso\` to enable
cloud sync across machines.
`,
    "utf8",
  );
  console.log(`  write CLAUDE.md`);
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
  .action(
    (opts: { force: boolean; skipInit: boolean; skipClaudeMd: boolean }) => {
      console.log(`Setting up ZAM in ${process.cwd()}\n`);

      copySkills(opts.force);
      initDatabase(opts.skipInit);
      writeClaudeMd(opts.skipClaudeMd);

      console.log(
        "\nDone. Run `zam whoami --set <your-id>` to set your identity, then open Claude Code or Gemini CLI and run /zam to start a learning session.",
      );
    },
  );
