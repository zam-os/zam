/**
 * `zam setup` — Distribute skill files from the zam package into the current
 * personal instance's agent skill directories, and optionally initialize the
 * ZAM database and generate agent-specific instruction files.
 *
 * Run this once after cloning a ZAM personal instance, and again after
 * upgrading zam (with --force) to refresh the skill files.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import type { Database } from "../../kernel/index.js";
import { getDefaultDbPath, openDatabaseWithSync, setSetting } from "../../kernel/index.js";

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

async function initDatabase(skipInit: boolean): Promise<void> {
  if (skipInit) return;

  try {
    const dbPath = getDefaultDbPath();
    const db = await openDatabaseWithSync({ initialize: true });
    await migrateProviderConfig(db);
    await db.close();
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

/**
 * Migrate legacy AI provider config from ~/.zam/config.json into the ZAM
 * settings store (llm.providers, llm.roles).  Pre-0.5.x config kept
 * provider definitions and role bindings in a machine-local JSON file
 * under `ai.providers` / `ai.roles`.  After migration the settings store
 * is the single source of truth and the old config.json section is
 * stripped so it never collides again.
 *
 * Keys stored under `llmProviders` in credentials.json are left in place
 * — they already use the reference format that the settings store expects.
 */
async function migrateProviderConfig(db: Database): Promise<void> {
  // Only run once: if llm.providers already exists, migration already happened.
  const { getSetting } = await import("../../kernel/models/settings.js");
  if (await getSetting(db, "llm.providers")) return;

  const configPath = join(homedir(), ".zam", "config.json");
  if (!existsSync(configPath)) return;

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return; // unreadable — skip silently
  }

  const aiSection = config.ai as Record<string, unknown> | undefined;
  if (!aiSection) return;

  const providers = aiSection.providers as Record<string, unknown> | undefined;
  const roles = aiSection.roles as Record<string, unknown> | undefined;

  if (!providers && !roles) return;

  let migrated = 0;

  if (providers && Object.keys(providers).length > 0) {
    // Normalise legacy field names to the settings-store schema.
    const normalised: Record<string, Record<string, unknown>> = {};
    for (const [name, rec] of Object.entries(providers)) {
      const r = rec as Record<string, unknown>;
      normalised[name] = {
        url: r.url ?? "",
        model: r.model ?? "",
        apiFlavor: r.apiFlavor ?? r.flavor ?? "chat-completions",
        ...(r.apiKeyRef ? { apiKeyRef: r.apiKeyRef } : {}),
        ...(r.label ? { label: r.label } : {}),
        ...(r.local !== undefined ? { local: Boolean(r.local) } : {}),
        ...(r.runner ? { runner: r.runner } : {}),
      };
    }
    await setSetting(db, "llm.providers", JSON.stringify(normalised));
    migrated += Object.keys(normalised).length;
  }

  if (roles && Object.keys(roles).length > 0) {
    await setSetting(db, "llm.roles", JSON.stringify(roles));
    migrated += Object.keys(roles).length;
  }

  if (migrated > 0) {
    // Enable LLM globally so the migrated providers actually work.
    // (Pre-0.5.x had no per-role LLM toggle; if you had providers,
    // you wanted the LLM on.)
    await setSetting(db, "llm.enabled", "true");

    // Strip the legacy ai section from config.json so it never shadows
    // the settings store again.
    delete config.ai;
    try {
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
    } catch {
      // best-effort — the settings migration already succeeded
    }

    console.log(
      `  migrate  ${migrated} provider/role config(s) from ~/.zam/config.json`,
    );
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
