/**
 * `zam settings` — User settings management.
 */

import { Command } from "commander";
import type { Database } from "libsql";
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
  .command("get <key>")
  .description("Get a single setting")
  .option("--json", "Output as JSON")
  .action((key, opts) => {
    withDb((db) => {
      const value = getSetting(db, key);

      if (opts.json) {
        console.log(JSON.stringify({ key, value: value ?? null }));
        return;
      }

      if (value === undefined) {
        console.log(`Not set: ${key}`);
      } else {
        console.log(value);
      }
    });
  });

// ── zam settings set ──────────────────────────────────────────────────────

settingsCommand
  .command("set <key> <value>")
  .description("Set a setting")
  .option("--quiet", "Suppress output")
  .action((key, value, opts) => {
    withDb((db) => {
      let parsedVal = value;
      if (key === "llm.enabled") {
        const lower = value.toLowerCase();
        if (lower === "on" || lower === "enable" || lower === "enabled" || lower === "true") {
          parsedVal = "true";
        } else if (lower === "off" || lower === "disable" || lower === "disabled" || lower === "false") {
          parsedVal = "false";
        }
      }
      setSetting(db, key, parsedVal);
      if (!opts.quiet) {
        console.log(`Set ${key} = ${parsedVal}`);
      }
    });
  });

// ── zam settings delete ───────────────────────────────────────────────────

settingsCommand
  .command("delete <key>")
  .description("Delete a setting")
  .option("--quiet", "Suppress output")
  .action((key, opts) => {
    withDb((db) => {
      const deleted = deleteSetting(db, key);
      if (!opts.quiet) {
        if (deleted) {
          console.log(`Deleted: ${key}`);
        } else {
          console.log(`Not found: ${key}`);
        }
      }
    });
  });

// ── zam settings llm [state] ──────────────────────────────────────────────

settingsCommand
  .command("llm [state]")
  .description("Quickly enable/disable or check local LLM integration (on/off/enable/disable)")
  .action((state) => {
    withDb((db) => {
      if (!state) {
        const enabled = getSetting(db, "llm.enabled") || "false";
        console.log(
          `LLM Integration is currently: ${
            enabled === "true"
              ? "\x1b[32mON (enabled)\x1b[0m"
              : "\x1b[31mOFF (disabled)\x1b[0m"
          }`,
        );
        return;
      }

      const lower = state.toLowerCase();
      let value = "false";
      if (
        lower === "on" ||
        lower === "enable" ||
        lower === "enabled" ||
        lower === "true"
      ) {
        value = "true";
      } else if (
        lower === "off" ||
        lower === "disable" ||
        lower === "disabled" ||
        lower === "false"
      ) {
        value = "false";
      } else {
        console.error(`Invalid state: ${state}. Use on, off, enable, or disable.`);
        process.exit(1);
      }

      setSetting(db, "llm.enabled", value);
      console.log(
        `LLM Integration is now: ${
          value === "true"
            ? "\x1b[32mON (enabled)\x1b[0m"
            : "\x1b[31mOFF (disabled)\x1b[0m"
        }`,
      );
    });
  });

