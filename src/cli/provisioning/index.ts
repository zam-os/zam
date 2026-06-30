import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The bundled CLI resolves from dist/cli/index.js; source tests resolve from
// src/cli/provisioning/index.ts. Select the first candidate containing package.json.
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

export type SkillWireAction = "linked" | "relinked" | "skipped";

export interface SkillWireResult {
  source: string;
  destination: string;
  action: SkillWireAction;
  reason?: string;
}

export interface SkillWireOptions {
  force?: boolean;
  dryRun?: boolean;
  quiet?: boolean;
}

function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function comparableRealPath(path: string): string {
  const real = realpathSync(path);
  return process.platform === "win32" ? real.toLowerCase() : real;
}

function pathsResolveToSameDirectory(
  sourceDir: string,
  destinationDir: string,
): boolean {
  try {
    return comparableRealPath(destinationDir) === comparableRealPath(sourceDir);
  } catch {
    return false;
  }
}

function linkPointsTo(sourceDir: string, destinationDir: string): boolean {
  try {
    return (
      lstatSync(destinationDir).isSymbolicLink() &&
      pathsResolveToSameDirectory(sourceDir, destinationDir)
    );
  } catch {
    return false;
  }
}

function isReplaceableCopiedSkill(destinationDir: string): boolean {
  try {
    if (!lstatSync(destinationDir).isDirectory()) return false;
    const entries = readdirSync(destinationDir);
    if (entries.length !== 1 || entries[0] !== "SKILL.md") return false;
    return /^name:\s*zam\s*$/m.test(
      readFileSync(join(destinationDir, "SKILL.md"), "utf8"),
    );
  } catch {
    return false;
  }
}

export function wireSkills(
  cwd: string = process.cwd(),
  agents: Set<SetupAgent> = parseSetupAgents(),
  opts: SkillWireOptions = {},
): SkillWireResult[] {
  const results: SkillWireResult[] = [];
  const log = (message: string) => {
    if (!opts.quiet) console.log(message);
  };

  for (const { from, to, agents: pairAgents } of SKILL_PAIRS) {
    if (!pairAgents.some((agent) => agents.has(agent))) continue;
    const sourceDir = dirname(from);
    const destinationDir = dirname(join(cwd, to));

    if (!existsSync(sourceDir)) {
      if (!opts.quiet) {
        console.warn(`  warn  source not found, skipping: ${sourceDir}`);
      }
      results.push({
        source: sourceDir,
        destination: destinationDir,
        action: "skipped",
        reason: "source-not-found",
      });
      continue;
    }

    if (
      pathsResolveToSameDirectory(sourceDir, destinationDir) &&
      !lstatSync(destinationDir).isSymbolicLink()
    ) {
      log(`  skip  ${dirname(to)} (package source)`);
      results.push({
        source: sourceDir,
        destination: destinationDir,
        action: "skipped",
        reason: "source-directory",
      });
      continue;
    }

    if (linkPointsTo(sourceDir, destinationDir)) {
      log(`  skip  ${dirname(to)} (already linked)`);
      results.push({
        source: sourceDir,
        destination: destinationDir,
        action: "skipped",
        reason: "already-linked",
      });
      continue;
    }

    const destinationExists = pathExists(destinationDir);
    const replaceExisting =
      destinationExists &&
      (Boolean(opts.force) || isReplaceableCopiedSkill(destinationDir));

    if (destinationExists && !replaceExisting) {
      if (!opts.quiet) {
        console.warn(
          `  warn  ${dirname(to)} already exists and is not managed by ZAM; use --force to replace it`,
        );
      }
      results.push({
        source: sourceDir,
        destination: destinationDir,
        action: "skipped",
        reason: "unmanaged-destination",
      });
      continue;
    }

    const action: SkillWireAction = destinationExists ? "relinked" : "linked";
    if (opts.dryRun) {
      log(`  would ${action === "linked" ? "link" : "relink"}  ${dirname(to)}`);
    } else {
      if (destinationExists) {
        rmSync(destinationDir, { recursive: true, force: true });
      }
      mkdirSync(dirname(destinationDir), { recursive: true });
      symlinkSync(
        sourceDir,
        destinationDir,
        process.platform === "win32" ? "junction" : "dir",
      );
      log(`  ${action === "linked" ? "link" : "relink"}  ${dirname(to)}`);
    }
    results.push({ source: sourceDir, destination: destinationDir, action });
  }

  return results;
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
- The skill directory is linked to this ZAM installation and updates with it.`,
      Boolean(opts.dryRun),
    );
    logInstructionAction(action, "CLAUDE.md", Boolean(opts.dryRun));
    return;
  }

  const name = basename(cwd);
  const content = `# ZAM Personal Kernel — ${name}

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
- The skill directory is linked to this ZAM installation and updates with it.`,
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
- The skill directory is linked to this ZAM installation and updates with it.`,
    Boolean(opts.dryRun),
  );
  logInstructionAction(
    action,
    ".github/copilot-instructions.md",
    Boolean(opts.dryRun),
  );
}
