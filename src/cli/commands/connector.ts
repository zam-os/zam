/**
 * `zam connector` — Manage external service connectors.
 */

import { input, password } from "@inquirer/prompts";
import { Command } from "commander";
import { fetchActiveWorkItems } from "../../kernel/connectors/azure-devops.js";
import {
  clearADOCredentials,
  clearTursoCredentials,
  getADOCredentials,
  getTursoCredentials,
  loadStoredCredentials,
  resolveCredentials,
  type StoredSecret,
  secretRefFromUri,
  setADOCredentials,
  setTursoCredentials,
} from "../../kernel/credentials.js";
import type { Database } from "../../kernel/index.js";
import { getSystemProfile, openDatabaseWithSync } from "../../kernel/index.js";

export const connectorCommand = new Command("connector").description(
  "Manage external service connectors",
);

// ── zam connector setup ado ─────────────────────────────────────────────────

connectorCommand
  .command("setup")
  .description("Configure a connector")
  .argument("<type>", "Connector type (ado, turso)")
  .option("--url <url>", "Turso database URL (non-interactive)")
  .option("--token <token>", "Turso auth token (non-interactive)")
  .option(
    "--token-from <ref>",
    "Optional later: vault reference instead of --token (e.g. bw://zam-turso/token). Paste with --token remains the default.",
  )
  .option(
    "--mode <mode>",
    "Turso access mode: native (libsql driver) | remote (HTTP, works on Windows ARM64)",
  )
  .action(async (type, opts) => {
    if (type === "turso") {
      if (opts.mode && opts.mode !== "native" && opts.mode !== "remote") {
        console.error(`Invalid --mode: ${opts.mode}. Use native or remote.`);
        process.exit(1);
      }
      if (opts.token && opts.tokenFrom) {
        console.error("Use either --token or --token-from, not both.");
        process.exit(1);
      }
      return setupTurso(opts.url, opts.token, opts.mode, opts.tokenFrom);
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
      console.log("ID       Type          State       Title");
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

// ── zam connector token ─────────────────────────────────────────────────────

connectorCommand
  .command("token")
  .description(
    "Replace a connector's token, keeping the rest of its configuration",
  )
  .argument("<type>", "Connector type (turso)")
  .option("--token <token>", "New auth token (non-interactive)")
  .option(
    "--token-from <ref>",
    "Vault reference instead of --token (e.g. bw://zam-turso/token)",
  )
  .action(async (type, opts) => {
    if (type !== "turso") {
      console.error(`Unknown connector type: ${type}. Supported: turso`);
      process.exit(1);
    }
    if (opts.token && opts.tokenFrom) {
      console.error("Use either --token or --token-from, not both.");
      process.exit(1);
    }
    return refreshTursoToken(opts.token, opts.tokenFrom);
  });

// ── zam connector sync ──────────────────────────────────────────────────────

connectorCommand
  .command("sync")
  .description("Verify the Turso cloud database connection")
  .action(async () => {
    const turso = getTursoCredentials();
    if (!turso) {
      console.error(
        "No Turso cloud database configured. Run: zam connector setup turso",
      );
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      db = await openDatabaseWithSync({ initialize: true });
      await db.prepare("SELECT 1").get();
      console.log(`Connected to ${turso.url}`);
      await db.close();
    } catch (err) {
      await db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── Turso setup helpers ─────────────────────────────────────────────────────

/**
 * The Turso URL and mode already on disk, read from the *stored* document
 * rather than the resolved view: a token that a vault can no longer resolve
 * still leaves a perfectly good URL behind, and that is exactly the case where
 * someone needs it back.
 */
function storedTursoConfig(): { url?: string; mode?: "native" | "remote" } {
  const stored = loadStoredCredentials().turso;
  return { url: stored?.url, mode: stored?.mode };
}

/**
 * Replace only the auth token, keeping the configured URL and access mode.
 *
 * Turso tokens expire; the database they point at does not. Sending a learner
 * back through the full `setup turso` flow to re-paste a URL they never
 * changed is the kind of friction that turns a 30-second repair into a
 * postponed one — and the URL is the part that is easy to get subtly wrong.
 */
async function refreshTursoToken(
  tokenArg?: string,
  tokenFrom?: string,
): Promise<void> {
  const { url, mode } = storedTursoConfig();
  if (!url) {
    console.error(
      "No Turso database is configured yet, so there is no token to refresh.\n" +
        "  Set one up first: zam connector setup turso",
    );
    process.exit(1);
  }

  let db: Database | undefined;
  try {
    let token: StoredSecret | undefined;
    if (tokenFrom) {
      token = secretRefFromUri(tokenFrom);
    } else if (tokenArg) {
      token = tokenArg;
    } else {
      console.log(`Refreshing the token for ${url}`);
      token = await password({ message: "New auth token:" });
    }
    if (!token) {
      console.error("A token is required.");
      process.exit(1);
    }

    setTursoCredentials(url, token, undefined, mode);
    await resolveCredentials();

    if (!getTursoCredentials()) {
      console.error(
        tokenFrom
          ? `Could not resolve token reference "${tokenFrom}". Fix the vault item or run: zam credentials check`
          : "Turso credentials incomplete after the refresh.",
      );
      process.exit(1);
    }

    db = await openDatabaseWithSync({ initialize: true });
    await db.prepare("SELECT 1").get();
    await db.close();

    console.log(
      `Turso token refreshed and verified: ${url}` +
        (mode ? ` (mode: ${mode})` : "") +
        (tokenFrom ? ` (token from ${tokenFrom})` : ""),
    );
  } catch (err) {
    await db?.close();
    if ((err as Error).name === "ExitPromptError") {
      console.log("\nCancelled.");
      process.exit(0);
    }
    // The new token is kept rather than rolled back: the old one is normally
    // the expired one being replaced, so restoring it would only re-break a
    // config the learner just deliberately changed. Say plainly that it was
    // stored but not proven.
    console.error(
      `Stored the new token, but could not verify it against ${url}:\n` +
        `  ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

async function setupTurso(
  urlArg?: string,
  tokenArg?: string,
  mode?: "native" | "remote",
  tokenFrom?: string,
): Promise<void> {
  let db: Database | undefined;

  // Auto-detect Windows ARM64 and default to remote mode, since the libsql
  // native driver has no prebuilt ARM64 binaries for Windows.
  const arch = getSystemProfile().arch;
  const isWindowsArm64 = process.platform === "win32" && arch === "arm64";
  const effectiveMode = mode ?? (isWindowsArm64 ? "remote" : undefined);
  if (!mode && isWindowsArm64) {
    console.log(
      "Detected Windows ARM64 — defaulting to remote (HTTP) mode.\n" +
        "  The native libsql driver is not available on this architecture.\n" +
        "  Remote mode uses the Turso HTTP API and works everywhere.\n",
    );
  }

  try {
    // Re-running setup to replace an expired token is the common case, so the
    // URL already on disk is offered rather than demanded: `--token` alone is
    // enough non-interactively, and the prompt just needs Enter.
    const storedUrl = storedTursoConfig().url;
    const url =
      urlArg ??
      (tokenArg || tokenFrom
        ? (storedUrl ??
          (await input({
            message: "Turso database URL (e.g. libsql://my-db-user.turso.io):",
          })))
        : await input({
            message: "Turso database URL (e.g. libsql://my-db-user.turso.io):",
            ...(storedUrl ? { default: storedUrl } : {}),
          }));

    let token: StoredSecret | undefined;
    if (tokenFrom) {
      token = secretRefFromUri(tokenFrom);
    } else if (tokenArg) {
      token = tokenArg;
    } else {
      token = await password({
        message: "Auth token:",
      });
    }

    if (!url || !token) {
      console.error("Both URL and token are required.");
      process.exit(1);
    }

    // Store credentials outside the db so they survive db deletion.
    // Vault references are stored as-is; resolved plaintext never hits disk.
    setTursoCredentials(url, token, undefined, effectiveMode);
    await resolveCredentials();

    if (!getTursoCredentials()) {
      console.error(
        tokenFrom
          ? `Could not resolve token reference "${tokenFrom}". Fix the vault item or run: zam credentials check`
          : "Turso credentials incomplete after setup.",
      );
      process.exit(1);
    }

    // Verify by opening the configured cloud database.
    db = await openDatabaseWithSync({ initialize: true });
    await db.prepare("SELECT 1").get();
    await db.close();

    console.log(
      `Turso cloud database configured and verified: ${url}` +
        (effectiveMode ? ` (mode: ${effectiveMode})` : "") +
        (tokenFrom ? ` (token from ${tokenFrom})` : ""),
    );
  } catch (err) {
    await db?.close();
    if ((err as Error).name === "ExitPromptError") {
      console.log("\nSetup cancelled.");
      process.exit(0);
    }
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}
