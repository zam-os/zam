/**
 * `zam connector` — Manage external service connectors.
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
import { input, password } from "@inquirer/prompts";
import {
  openDatabase,
  setSetting,
  deleteSetting,
} from "../../kernel/index.js";
import {
  loadADOConfig,
  fetchActiveWorkItems,
} from "../../kernel/connectors/azure-devops.js";

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

export const connectorCommand = new Command("connector")
  .description("Manage external service connectors");

// ── zam connector setup ado ─────────────────────────────────────────────────

connectorCommand
  .command("setup")
  .description("Configure a connector")
  .argument("<type>", "Connector type (ado)")
  .action(async (type) => {
    if (type !== "ado") {
      console.error(`Unknown connector type: ${type}. Supported: ado`);
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      const orgUrl = await input({
        message: "Organization URL (e.g. https://dev.azure.com/myorg):",
      });
      const project = await input({
        message: "Project name:",
      });
      const pat = await password({
        message: "Personal Access Token:",
      });

      if (!orgUrl || !project || !pat) {
        console.error("All fields are required.");
        process.exit(1);
      }

      db = openDatabase();
      setSetting(db, "ado.org_url", orgUrl.replace(/\/+$/, ""));
      setSetting(db, "ado.project", project);
      setSetting(db, "ado.pat", pat);
      db.close();

      console.log(`Azure DevOps connector configured for ${orgUrl}/${project}`);
    } catch (err) {
      db?.close();
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nSetup cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── zam connector tasks ─────────────────────────────────────────────────────

connectorCommand
  .command("tasks")
  .description("List active tasks from connected board")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      db = openDatabase();
      const config = loadADOConfig(db);
      db.close();

      if (!config) {
        console.error("No connector configured. Run: zam connector setup ado");
        process.exit(1);
      }

      const items = await fetchActiveWorkItems(config);

      if (opts.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
      }

      if (items.length === 0) {
        console.log("No active work items assigned to you.");
        return;
      }

      console.log(`${items.length} active work item(s):\n`);
      console.log(
        "ID       Type          State       Title",
      );
      console.log("─".repeat(80));
      for (const wi of items) {
        console.log(
          `${String(wi.id).padEnd(8)} ${wi.type.padEnd(13)} ${wi.state.padEnd(11)} ${wi.title.slice(0, 45)}`,
        );
      }
    } catch (err) {
      db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── zam connector clear ─────────────────────────────────────────────────────

connectorCommand
  .command("clear")
  .description("Remove a connector configuration")
  .argument("<type>", "Connector type (ado)")
  .action((type) => {
    if (type !== "ado") {
      console.error(`Unknown connector type: ${type}. Supported: ado`);
      process.exit(1);
    }

    withDb((db) => {
      deleteSetting(db, "ado.org_url");
      deleteSetting(db, "ado.project");
      deleteSetting(db, "ado.pat");
      console.log("Azure DevOps connector removed.");
    });
  });
