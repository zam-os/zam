import { Command } from "commander";
import { initCommand } from "./commands/init.js";
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

const program = new Command();

program
  .name("zam")
  .description(
    "The Symbiotic Learning Kernel: Elevating Human Intelligence through AI Collaboration.",
  )
  .version("0.1.0");

program.addCommand(initCommand);
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

program.parse();
