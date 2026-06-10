/**
 * `zam whoami` — Manage default user identity.
 */

import { Command } from "commander";
import { deleteSetting, getSetting, setSetting } from "../../kernel/index.js";
import { withDb } from "./shared/db.js";

export const whoamiCommand = new Command("whoami")
  .description("Show or set the default user identity")
  .option("--set <id>", "Set the default user ID")
  .option("--clear", "Remove the default user ID")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      if (opts.set) {
        await setSetting(db, "user.id", opts.set);
        if (opts.json) {
          console.log(JSON.stringify({ userId: opts.set }));
        } else {
          console.log(`Default user set to: ${opts.set}`);
        }
        return;
      }

      if (opts.clear) {
        const deleted = await deleteSetting(db, "user.id");
        if (opts.json) {
          console.log(JSON.stringify({ userId: null, cleared: deleted }));
        } else if (deleted) {
          console.log("Default user cleared.");
        } else {
          console.log("No default user was set.");
        }
        return;
      }

      const userId = await getSetting(db, "user.id");
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
