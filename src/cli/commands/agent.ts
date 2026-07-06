/**
 * `zam agent` — provision and inspect the AI agent that drives ZAM sessions.
 *
 * Default mode still relies on an external agent CLI; this command installs one
 * for the user (currently opencode — the only candidate native on both Apple
 * Silicon and Windows on ARM with its own GUI) so non-developers don't have to.
 * opencode reads the AGENTS.md that `zam setup` writes, which is how it picks
 * up the ZAM skill. (Increment 12, Phase 6.)
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { Command } from "commander";
import type { Database } from "../../kernel/index.js";
import {
  getSetting,
  hasCommand,
  installOpenCode,
  openDatabase,
} from "../../kernel/index.js";
import {
  AGENT_HARNESSES,
  connectHarnessMcp,
  getHarness,
  launchHarness,
  resolveHarnessExecutable,
} from "../agent-harness.js";
import { findExecutable, normalizeShell } from "../terminal-open.js";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

const SUPPORTED_AGENTS = ["opencode"];

function agentsMdPresent(cwd = process.cwd()): boolean {
  return existsSync(join(cwd, "AGENTS.md"));
}

function printStatus(): void {
  const installed = hasCommand("opencode");
  const wired = agentsMdPresent();

  console.log(`${C.bold}ZAM agent${C.reset}`);
  console.log(
    `  opencode:   ${
      installed
        ? `${C.green}installed${C.reset}`
        : `${C.yellow}not installed${C.reset} ${C.dim}(zam agent install)${C.reset}`
    }`,
  );
  console.log(
    `  AGENTS.md:  ${
      wired
        ? `${C.green}present${C.reset} ${C.dim}(opencode reads this)${C.reset}`
        : `${C.yellow}missing${C.reset} ${C.dim}(run zam setup to wire the ZAM skill)${C.reset}`
    }`,
  );
}

const installCmd = new Command("install")
  .description("Download and install the default agent (opencode)")
  .option("--agent <name>", "Agent to install", "opencode")
  .action((opts: { agent: string }) => {
    if (!SUPPORTED_AGENTS.includes(opts.agent)) {
      console.error(
        `Unsupported agent: ${opts.agent}. Supported: ${SUPPORTED_AGENTS.join(", ")}.`,
      );
      process.exit(1);
    }

    const result = installOpenCode();
    if (!result.success) {
      console.error(`${C.yellow}✗${C.reset} ${result.message}`);
      process.exit(1);
    }

    console.log(`${C.green}✓${C.reset} ${result.message}`);
    if (agentsMdPresent()) {
      console.log(
        `  ${C.dim}opencode will read AGENTS.md here and pick up the ZAM skill.${C.reset}`,
      );
    } else {
      console.log(
        `  Run ${C.cyan}zam setup${C.reset} to write AGENTS.md so opencode uses the ZAM skill.`,
      );
    }
    console.log(`  Start it with: ${C.cyan}opencode${C.reset}`);
  });

const statusCmd = new Command("status")
  .description("Show whether the agent is installed and wired to ZAM")
  .action(printStatus);

const listCmd = new Command("list")
  .description("List known agent harnesses and whether each is detected")
  .action(() => {
    console.log(`${C.bold}Agent harnesses${C.reset}`);
    for (const h of AGENT_HARNESSES) {
      const status = resolveHarnessExecutable(h)
        ? `${C.green}detected${C.reset}`
        : `${C.yellow}not found${C.reset}`;
      console.log(
        `  ${h.id.padEnd(13)} ${status}  ${C.dim}${h.label} (${h.kind})${C.reset}`,
      );
    }
    console.log(`\n  ${C.dim}Open one: zam agent open --id <id>${C.reset}`);
    console.log(
      `  ${C.dim}Point ZAM at a custom path: zam settings set agent.<id>.command <path>${C.reset}`,
    );
  });

const openCmd = new Command("open")
  .description("Open an agent harness in the workspace, ready to drive ZAM")
  .option(
    "--id <id>",
    "Harness id (default: agent.default setting, else first detected)",
  )
  .option("--dir <path>", "Workspace directory (defaults to cwd)")
  .option(
    "--shell <type>",
    "Shell type: zsh | bash | pwsh | powershell (auto-detected)",
  )
  .action(async (opts: { id?: string; dir?: string; shell?: string }) => {
    let shell: ReturnType<typeof normalizeShell>;
    try {
      shell = normalizeShell(opts.shell);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    let id = opts.id;
    let override: string | undefined;
    let db: Database | undefined;
    try {
      db = await openDatabase();
      if (!id) {
        id = (await getSetting(db, "agent.default")) || undefined;
      }
      if (!id) {
        id = AGENT_HARNESSES.find((h) => resolveHarnessExecutable(h))?.id;
      }
      if (id) {
        override = (await getSetting(db, `agent.${id}.command`)) || undefined;
      }
    } finally {
      await db?.close();
    }

    if (!id) {
      console.error(
        "No agent harness configured or detected. Install one (e.g. zam agent install), then set a default: zam settings set agent.default <id>.",
      );
      process.exit(1);
    }

    const harness = getHarness(id);
    if (!harness) {
      console.error(
        `Unknown harness: ${id}. Known: ${AGENT_HARNESSES.map((h) => h.id).join(", ")}.`,
      );
      process.exit(1);
    }

    const executable = resolveHarnessExecutable(harness, override);
    if (!executable) {
      console.error(
        `${harness.label} was not detected. Install it, or point ZAM at it: zam settings set agent.${harness.id}.command <path>.`,
      );
      process.exit(1);
    }

    const workspace = opts.dir ?? process.cwd();
    launchHarness(harness, { executable, workspace, shell });
  });

const connectCmd = new Command("connect")
  .description("Provision MCP trust configuration for an agent harness")
  .argument(
    "<harness>",
    "Harness to connect: claude-code | antigravity | codex",
  )
  .option(
    "--print",
    "Print configuration changes instead of writing them to disk",
  )
  .action(async (harnessArg, opts: { print?: boolean }) => {
    const validHarnesses = ["claude-code", "antigravity", "codex"];
    if (!validHarnesses.includes(harnessArg)) {
      console.error(
        `Unsupported harness: ${harnessArg}. Supported: ${validHarnesses.join(", ")}.`,
      );
      process.exit(1);
    }

    let zamPath = findExecutable("zam");
    if (!zamPath) {
      console.warn(
        `${C.yellow}Warning: 'zam' executable was not found on your PATH. Falling back to literal 'zam'.${C.reset}`,
      );
      zamPath = "zam";
    }

    const result = connectHarnessMcp(harnessArg as any, {
      zamPath,
      cwd: process.cwd(),
      home: homedir(),
    });

    if (opts.print) {
      console.log(`Path: ${result.path}`);
      console.log(`Content:\n${result.content}`);
      return;
    }

    if (result.alreadyConfigured) {
      console.log(
        `${C.green}✓${C.reset} MCP server 'zam' already configured in ${result.path}`,
      );
      return;
    }

    try {
      mkdirSync(dirname(result.path), { recursive: true });
      writeFileSync(result.path, result.content, "utf-8");
      console.log(
        `${C.green}✓${C.reset} Wrote trust configuration to ${result.path}`,
      );
      console.log(`  ${C.dim}${result.hint}${C.reset}`);
    } catch (err: any) {
      console.error(`Error writing trust configuration: ${err.message}`);
      process.exit(1);
    }
  });

export const agentCommand = new Command("agent")
  .description("Provision and inspect the agent that drives ZAM sessions")
  .addCommand(installCmd)
  .addCommand(statusCmd)
  .addCommand(openCmd)
  .addCommand(listCmd)
  .addCommand(connectCmd)
  .action(printStatus);
