import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { resolveCredentials } from "../kernel/credentials.js";
import { agentCommand } from "./commands/agent.js";
import { bridgeCommand } from "./commands/bridge.js";
import { cardCommand } from "./commands/card.js";
import { connectorCommand } from "./commands/connector.js";
import { credentialsCommand } from "./commands/credentials.js";
import { doctorCommand } from "./commands/doctor.js";
import { gitSyncCommand } from "./commands/git-sync.js";
import { goalCommand } from "./commands/goal.js";
import { initCommand } from "./commands/init.js";
import { knowledgeContextCommand } from "./commands/knowledge-context.js";
import { learnCommand } from "./commands/learn.js";
import { monitorCommand } from "./commands/monitor.js";
import { observerCommand } from "./commands/observer.js";
import { profileCommand } from "./commands/profile.js";
import { providerCommand } from "./commands/provider.js";
import { reviewCommand } from "./commands/review.js";
import { sessionCommand } from "./commands/session.js";
import { settingsCommand } from "./commands/settings.js";
import { setupCommand } from "./commands/setup.js";
import { skillCommand } from "./commands/skill.js";
import { snapshotCommand } from "./commands/snapshot.js";
import { statsCommand } from "./commands/stats.js";
import { tokenCommand } from "./commands/token.js";
import { uiCommand } from "./commands/ui.js";
import { updateCommand } from "./commands/update.js";
import { whoamiCommand } from "./commands/whoami.js";
import { workspaceCommand } from "./commands/workspace.js";

// Resolve vault references into the process-lifetime snapshot before any
// command (or the persistent desktop bridge) reads credentials synchronously.
// Literals need no backend; failures degrade to null accessors (ADR 2026-07-30b).
await resolveCredentials();

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"),
) as { version: string };

const program = new Command();

program
  .name("zam")
  .description(
    "The Symbiotic Learning Kernel: Elevating Human Intelligence through AI Collaboration.",
  )
  .version(pkg.version);

program.addCommand(initCommand);
program.addCommand(setupCommand);
program.addCommand(tokenCommand);
program.addCommand(knowledgeContextCommand);
program.addCommand(doctorCommand);
program.addCommand(cardCommand);
program.addCommand(sessionCommand);
program.addCommand(statsCommand);
program.addCommand(reviewCommand);
program.addCommand(learnCommand);
program.addCommand(uiCommand);
program.addCommand(bridgeCommand);
program.addCommand(
  // Stub: the MCP transport's deps (@modelcontextprotocol/sdk, zod) load only
  // when `zam mcp` actually runs (ADR 2026-07-07). Import failures bubble to
  // the bootstrap, which classifies and self-heals them.
  new Command("mcp")
    .description("Launch the Model Context Protocol (MCP) server over Stdio")
    .action(async () => {
      const { runMcpServer } = await import("./commands/mcp.js");
      await runMcpServer();
    }),
);
program.addCommand(skillCommand);
program.addCommand(monitorCommand);
program.addCommand(observerCommand);
program.addCommand(settingsCommand);
program.addCommand(whoamiCommand);
program.addCommand(connectorCommand);
program.addCommand(credentialsCommand);
program.addCommand(providerCommand);
program.addCommand(snapshotCommand);
program.addCommand(profileCommand);
program.addCommand(updateCommand);
program.addCommand(agentCommand);
program.addCommand(goalCommand);
program.addCommand(gitSyncCommand);
program.addCommand(workspaceCommand);

const isBridgeInvocation = process.argv[2] === "bridge";
let bridgeParseOutput = "";
if (isBridgeInvocation) {
  const captureBridgeParseOutput = (value: string): void => {
    bridgeParseOutput += value;
  };
  bridgeCommand.exitOverride();
  bridgeCommand.configureOutput({ writeErr: captureBridgeParseOutput });
  for (const command of bridgeCommand.commands) {
    command.exitOverride();
    command.configureOutput({ writeErr: captureBridgeParseOutput });
  }
}

try {
  await program.parseAsync();
} catch (error) {
  const commanderCode = (error as { code?: string })?.code;
  if (isBridgeInvocation && commanderCode === "commander.helpDisplayed") {
    // Commander implements --help by throwing after it writes the requested
    // help text. It is successful control flow, not a bridge failure.
  } else if (isBridgeInvocation && commanderCode?.startsWith("commander.")) {
    const message = (
      bridgeParseOutput.trim() ||
      (error instanceof Error ? error.message : String(error))
    ).replace(/^error:\s*/i, "");
    process.stdout.write(`${JSON.stringify({ error: message }, null, 2)}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
