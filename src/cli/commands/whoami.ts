/**
 * `zam whoami` — Show or set the default user identity.
 *
 * On the team library the identity is derived from the database login (ADR
 * 2026-09-04 Decision 2); `--set` and `--clear` are refused there.
 */

import { Command } from "commander";
import { deleteSetting, setSetting } from "../../kernel/index.js";
import { describeIdentity, isTeamLibrary } from "../users/identity.js";
import { withDb } from "./shared/db.js";

export const whoamiCommand = new Command("whoami")
  .description("Show or set the default user identity")
  .option("--set <id>", "Set the default user ID")
  .option("--clear", "Remove the default user ID")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      if ((opts.set || opts.clear) && isTeamLibrary(db)) {
        const message =
          "In the team library your identity is derived from your database login and cannot be set or cleared here.";
        if (opts.json) {
          console.log(JSON.stringify({ error: message }));
        } else {
          console.error(message);
        }
        process.exitCode = 1;
        return;
      }

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

      const identity = await describeIdentity(db);
      if (opts.json) {
        console.log(JSON.stringify(identity));
        return;
      }

      if (identity.source === "team-library") {
        if (identity.userId) {
          console.log(
            `${identity.userId}  (team library, derived from database role ${identity.role ?? "?"})`,
          );
        } else {
          console.log(
            `Not a member yet (database role ${identity.role ?? "?"}). Ask the administrator to run: zam team add-member <your upn>`,
          );
        }
        return;
      }

      if (identity.userId) {
        console.log(identity.userId);
      } else {
        console.log("No default user set. Use: zam whoami --set <id>");
      }
    });
  });
