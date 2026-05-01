/**
 * `zam connector` — Manage external service connectors.
 */

import { Command } from "commander";
import type { Database } from "libsql";
import { input, password } from "@inquirer/prompts";
import {
  openDatabaseWithSync,
} from "../../kernel/index.js";
import {
  fetchActiveWorkItems,
} from "../../kernel/connectors/azure-devops.js";
import {
  getTursoCredentials,
  setTursoCredentials,
  clearTursoCredentials,
  getADOCredentials,
  setADOCredentials,
  clearADOCredentials,
} from "../../kernel/credentials.js";

export const connectorCommand = new Command("connector")
  .description("Manage external service connectors");

// ── zam connector setup ado ─────────────────────────────────────────────────

connectorCommand
  .command("setup")
  .description("Configure a connector")
  .argument("<type>", "Connector type (ado, turso)")
  .option("--url <url>", "Turso database URL (non-interactive)")
  .option("--token <token>", "Turso auth token (non-interactive)")
  .action(async (type, opts) => {
    if (type === "turso") {
      return setupTurso(opts.url, opts.token);
    }
    if (type !== "ado") {
      console.error(`Unknown connector type: ${type}. Supported: ado, turso`);
      process.exit(1);
    }

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

      setADOCredentials(orgUrl.replace(/\/+$/, ""), project, pat);
      console.log(`Azure DevOps connector configured for ${orgUrl}/${project}`);
    } catch (err) {
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
    try {
      const config = getADOCredentials();

      if (!config) {
        console.error("No connector configured. Run: zam connector setup ado");
        process.exit(1);
      }

      const items = await fetchActiveWorkItems({
        orgUrl: config.org_url,
        project: config.project,
        pat: config.pat,
      });

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
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── zam connector clear ─────────────────────────────────────────────────────

connectorCommand
  .command("clear")
  .description("Remove a connector configuration")
  .argument("<type>", "Connector type (ado, turso)")
  .action((type) => {
    if (type === "turso") {
      clearTursoCredentials();
      console.log("Turso cloud sync removed. Database remains local-only.");
      return;
    }

    if (type !== "ado") {
      console.error(`Unknown connector type: ${type}. Supported: ado, turso`);
      process.exit(1);
    }

    clearADOCredentials();
    console.log("Azure DevOps connector removed.");
  });

// ── zam connector sync ──────────────────────────────────────────────────────

connectorCommand
  .command("sync")
  .description("Verify the Turso cloud database connection")
  .action(() => {
    const turso = getTursoCredentials();
    if (!turso) {
      console.error("No Turso cloud database configured. Run: zam connector setup turso");
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      db = openDatabaseWithSync({ initialize: true });
      db.prepare("SELECT 1").get();
      console.log(`Connected to ${turso.url}`);
      db.close();
    } catch (err) {
      db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── Turso setup helper ──────────────────────────────────────────────────────

async function setupTurso(urlArg?: string, tokenArg?: string): Promise<void> {
  let db: Database | undefined;
  try {
    const url = urlArg ?? await input({
      message: "Turso database URL (e.g. libsql://my-db-user.turso.io):",
    });
    const token = tokenArg ?? await password({
      message: "Auth token:",
    });

    if (!url || !token) {
      console.error("Both URL and token are required.");
      process.exit(1);
    }

    // Store credentials outside the db so they survive db deletion
    setTursoCredentials(url, token);

    // Verify by opening the configured cloud database.
    db = openDatabaseWithSync({ initialize: true });
    db.prepare("SELECT 1").get();
    db.close();

    console.log(`Turso cloud database configured and verified: ${url}`);
  } catch (err) {
    db?.close();
    if ((err as Error).name === "ExitPromptError") {
      console.log("\nSetup cancelled.");
      process.exit(0);
    }
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}
