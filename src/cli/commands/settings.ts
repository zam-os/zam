/**
 * `zam settings` — User settings management.
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
import {
  openDatabase,
  getSetting,
  getAllSettings,
  getAllSettingsDetailed,
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

export const settingsCommand = new Command("settings")
  .description("Manage user settings");

// ── zam settings show ─────────────────────────────────────────────────────

settingsCommand
  .command("show")
  .description("Show all settings")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      if (opts.json) {
        console.log(JSON.stringify(getAllSettings(db), null, 2));
        return;
      }

      const settings = getAllSettingsDetailed(db);
      if (settings.length === 0) {
        console.log("No settings configured.");
        return;
      }

      console.log("Settings:\n");
      console.log("Key                  Value                Updated");
      console.log("─".repeat(65));
      for (const s of settings) {
        console.log(
          `${s.key.padEnd(20)} ${s.value.padEnd(20)} ${s.updated_at}`,
        );
      }
    });
  });

// ── zam settings get ──────────────────────────────────────────────────────

settingsCommand
  .command("get")
  .description("Get a single setting")
  .requiredOption("--key <key>", "Setting key")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const value = getSetting(db, opts.key);

      if (opts.json) {
        console.log(JSON.stringify({ key: opts.key, value: value ?? null }));
        return;
      }

      if (value === undefined) {
        console.log(`Not set: ${opts.key}`);
      } else {
        console.log(value);
      }
    });
  });

// ── zam settings set ──────────────────────────────────────────────────────

settingsCommand
  .command("set")
  .description("Set a setting")
  .requiredOption("--key <key>", "Setting key")
  .requiredOption("--value <value>", "Setting value")
  .option("--quiet", "Suppress output")
  .action((opts) => {
    withDb((db) => {
      setSetting(db, opts.key, opts.value);
      if (!opts.quiet) {
        console.log(`Set ${opts.key} = ${opts.value}`);
      }
    });
  });

// ── zam settings delete ───────────────────────────────────────────────────

settingsCommand
  .command("delete")
  .description("Delete a setting")
  .requiredOption("--key <key>", "Setting key")
  .option("--quiet", "Suppress output")
  .action((opts) => {
    withDb((db) => {
      const deleted = deleteSetting(db, opts.key);
      if (!opts.quiet) {
        if (deleted) {
          console.log(`Deleted: ${opts.key}`);
        } else {
          console.log(`Not found: ${opts.key}`);
        }
      }
    });
  });
