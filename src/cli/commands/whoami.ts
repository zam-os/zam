/**
 * `zam whoami` — Manage default user identity.
 */

import { Command } from "commander";
import type { Database } from "libsql";
import {
  openDatabase,
  getSetting,
  setSetting,
  deleteSetting,
} from "../../kernel/index.js";

function withDb(fn: (db: Database) => void): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  } finally {
    db?.close();
  }
}

export const whoamiCommand = new Command("whoami")
  .description("Show or set the default user identity")
  .option("--set <id>", "Set the default user ID")
  .option("--clear", "Remove the default user ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      if (opts.set) {
        setSetting(db, "user.id", opts.set);
        if (opts.json) {
          console.log(JSON.stringify({ userId: opts.set }));
        } else {
          console.log(`Default user set to: ${opts.set}`);
        }
        return;
      }

      if (opts.clear) {
        const deleted = deleteSetting(db, "user.id");
        if (opts.json) {
          console.log(JSON.stringify({ userId: null, cleared: deleted }));
        } else if (deleted) {
          console.log("Default user cleared.");
        } else {
          console.log("No default user was set.");
        }
        return;
      }

      const userId = getSetting(db, "user.id");
      if (opts.json) {
        console.log(JSON.stringify({ userId: userId ?? null }));
        return;
      }

      if (userId) {
        console.log(userId);
      } else {
        console.log("No default user set. Use: zam whoami --set <id>");
      }
    });
  });
