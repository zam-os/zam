/**
 * `zam init` — Initialize ~/.zam/ directory and database.
 */

import { Command } from "commander";
import { openDatabase, getDefaultDbPath } from "../../kernel/index.js";

export const initCommand = new Command("init")
  .description("Initialize the ZAM database and config directory")
  .action(() => {
    try {
      const dbPath = getDefaultDbPath();
      const db = openDatabase({ initialize: true });
      db.close();
      console.log(`Initialized ZAM database at ${dbPath}`);
    } catch (err) {
      console.error("Failed to initialize:", (err as Error).message);
      process.exit(1);
    }
  });
