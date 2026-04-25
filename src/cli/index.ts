import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { setupCommand } from "./commands/setup.js";
import { tokenCommand } from "./commands/token.js";
import { cardCommand } from "./commands/card.js";
import { sessionCommand } from "./commands/session.js";
import { statsCommand } from "./commands/stats.js";
import { reviewCommand } from "./commands/review.js";
import { bridgeCommand } from "./commands/bridge.js";
import { skillCommand } from "./commands/skill.js";
import { monitorCommand } from "./commands/monitor.js";
import { settingsCommand } from "./commands/settings.js";
import { whoamiCommand } from "./commands/whoami.js";
import { connectorCommand } from "./commands/connector.js";
import { goalCommand } from "./commands/goal.js";

const program = new Command();

program
  .name("zam")
  .description(
    "The Symbiotic Learning Kernel: Elevating Human Intelligence through AI Collaboration.",
  )
  .version("0.3.4");

program.addCommand(initCommand);
program.addCommand(setupCommand);
program.addCommand(tokenCommand);
program.addCommand(cardCommand);
program.addCommand(sessionCommand);
program.addCommand(statsCommand);
program.addCommand(reviewCommand);
program.addCommand(bridgeCommand);
program.addCommand(skillCommand);
program.addCommand(monitorCommand);
program.addCommand(settingsCommand);
program.addCommand(whoamiCommand);
program.addCommand(connectorCommand);
program.addCommand(goalCommand);

program.parse();
