import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { bridgeCommand } from "./commands/bridge.js";
import { cardCommand } from "./commands/card.js";
import { connectorCommand } from "./commands/connector.js";
import { gitSyncCommand } from "./commands/git-sync.js";
import { goalCommand } from "./commands/goal.js";
import { initCommand } from "./commands/init.js";
import { learnCommand } from "./commands/learn.js";
import { monitorCommand } from "./commands/monitor.js";
import { reviewCommand } from "./commands/review.js";
import { sessionCommand } from "./commands/session.js";
import { settingsCommand } from "./commands/settings.js";
import { setupCommand } from "./commands/setup.js";
import { skillCommand } from "./commands/skill.js";
import { statsCommand } from "./commands/stats.js";
import { tokenCommand } from "./commands/token.js";
import { uiCommand } from "./commands/ui.js";
import { whoamiCommand } from "./commands/whoami.js";
import { workspaceCommand } from "./commands/workspace.js";

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
program.addCommand(cardCommand);
program.addCommand(sessionCommand);
program.addCommand(statsCommand);
program.addCommand(reviewCommand);
program.addCommand(learnCommand);
program.addCommand(uiCommand);
program.addCommand(bridgeCommand);
program.addCommand(skillCommand);
program.addCommand(monitorCommand);
program.addCommand(settingsCommand);
program.addCommand(whoamiCommand);
program.addCommand(connectorCommand);
program.addCommand(goalCommand);
program.addCommand(gitSyncCommand);
program.addCommand(workspaceCommand);

program.parse();
