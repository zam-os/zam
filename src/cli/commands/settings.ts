/**
 * `zam settings` — User settings management.
 */

import { existsSync } from "node:fs";
import { Command } from "commander";
import type { Database } from "libsql";
import {
  deleteSetting,
  getAllSettings,
  getAllSettingsDetailed,
  getRepoPaths,
  getSetting,
  openDatabase,
  setSetting,
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

export const settingsCommand = new Command("settings").description(
  "Manage user settings",
);

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
        if (
          lower === "on" ||
          lower === "enable" ||
          lower === "enabled" ||
          lower === "true"
        ) {
          parsedVal = "true";
        } else if (
          lower === "off" ||
          lower === "disable" ||
          lower === "disabled" ||
          lower === "false"
        ) {
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
  .description(
    "Quickly enable/disable or check local LLM integration (on/off/enable/disable)",
  )
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
        console.error(
          `Invalid state: ${state}. Use on, off, enable, or disable.`,
        );
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

// ── zam settings locale [lang] ───────────────────────────────────────────

settingsCommand
  .command("locale [lang]")
  .description(
    "Quickly set or check manual ZAM language override (en/de/es/fr/pt/zh/ja)",
  )
  .action((lang) => {
    withDb((db) => {
      if (!lang) {
        const locale = getSetting(db, "system.locale") || "en";
        console.log(`Active language (locale): \x1b[36m${locale}\x1b[0m`);
        return;
      }

      const lower = lang.toLowerCase();
      const supported = ["en", "de", "es", "fr", "pt", "zh", "ja"];
      if (!supported.includes(lower)) {
        console.error(
          `Invalid language code: ${lang}. Supported: ${supported.join(", ")}`,
        );
        process.exit(1);
      }

      setSetting(db, "system.locale", lower);
      console.log(`Language set to: \x1b[32m${lower}\x1b[0m`);
    });
  });

// ── zam settings repos ───────────────────────────────────────────────────

settingsCommand
  .command("repos")
  .description("Show or set Personal, Team, and Organization repository paths")
  .option("--personal <path>", "Set the Personal Repository path")
  .option("--team <path>", "Set the Team Repository path")
  .option("--org <path>", "Set the Organization Repository path")
  .action((opts) => {
    withDb((db) => {
      let changed = false;

      if (opts.personal !== undefined) {
        setSetting(db, "repo.personal", opts.personal);
        console.log(`Set repo.personal = ${opts.personal}`);
        changed = true;
      }
      if (opts.team !== undefined) {
        setSetting(db, "repo.team", opts.team);
        console.log(`Set repo.team = ${opts.team}`);
        changed = true;
      }
      if (opts.org !== undefined) {
        setSetting(db, "repo.org", opts.org);
        console.log(`Set repo.org = ${opts.org}`);
        changed = true;
      }

      if (changed) {
        console.log("\nUpdated Repository Settings:\n");
      } else {
        console.log("Repository Settings:\n");
      }

      const paths = getRepoPaths(db);
      console.log(
        `Personal Repo:  ${
          paths.personal
            ? `\x1b[32m${paths.personal}\x1b[0m`
            : "\x1b[31mNot Configured\x1b[0m"
        }`,
      );
      console.log(
        `Team Repo:      ${
          paths.team
            ? `\x1b[32m${paths.team}\x1b[0m`
            : "\x1b[31mNot Configured\x1b[0m"
        }`,
      );
      console.log(
        `Org Repo:       ${
          paths.org
            ? `\x1b[32m${paths.org}\x1b[0m`
            : "\x1b[31mNot Configured\x1b[0m"
        }`,
      );

      // Check if folders exist
      console.log("\nValidation:");
      for (const [name, path] of Object.entries(paths)) {
        if (path) {
          const exists = existsSync(path);
          console.log(
            `  ${name.padEnd(9)}: ${
              exists
                ? "\x1b[32m✓ Valid folder\x1b[0m"
                : "\x1b[31m✗ Directory does not exist\x1b[0m"
            }`,
          );
        } else {
          console.log(`  ${name.padEnd(9)}: \x1b[33m- Not Set\x1b[0m`);
        }
      }
    });
  });
