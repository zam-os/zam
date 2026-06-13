/**
 * `zam agent` — provision and inspect the AI agent that drives ZAM sessions.
 *
 * Default mode still relies on an external agent CLI; this command installs one
 * for the user (currently opencode — the only candidate native on both Apple
 * Silicon and Windows on ARM with its own GUI) so non-developers don't have to.
 * opencode reads the AGENTS.md that `zam setup` writes, which is how it picks
 * up the ZAM skill. (Increment 12, Phase 6.)
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { hasCommand, installOpenCode } from "../../kernel/index.js";

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

export const agentCommand = new Command("agent")
  .description("Provision and inspect the agent that drives ZAM sessions")
  .addCommand(installCmd)
  .addCommand(statusCmd)
  .action(printStatus);
