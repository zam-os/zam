/**
 * `zam connector` — Manage external service connectors.
 */

import { input, password } from "@inquirer/prompts";
import { Command } from "commander";
import {
  clearADOCredentials,
  clearPostgresCredentials,
  clearPreviousLibrary,
  clearTursoCredentials,
  getADOCredentials,
  getPostgresCredentials,
  getPreviousLibrary,
  getTursoCredentials,
  keepLibraryAsPrevious,
  loadStoredCredentials,
  type PostgresAuthMode,
  resolveCredentials,
  type StoredSecret,
  secretRefFromUri,
  setADOCredentials,
  setPostgresCredentials,
  setTursoCredentials,
} from "../../kernel/credentials.js";
import type { Database } from "../../kernel/index.js";
import {
  describePostgresTarget,
  getSystemProfile,
  openDatabaseWithSync,
} from "../../kernel/index.js";
import { fetchActiveWorkItems } from "../connectors/azure-devops.js";
import { entraCliSignedInUpn, isEntraLoginRequired } from "../db/entra-cli.js";
import { restoreLibrary } from "../db/library-switch.js";
import { describeIdentity } from "../users/identity.js";

export const connectorCommand = new Command("connector").description(
  "Manage external service connectors",
);

// ── zam connector setup ado ─────────────────────────────────────────────────

connectorCommand
  .command("setup")
  .description("Configure a connector")
  .argument("<type>", "Connector type (ado, turso, postgres)")
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
  .option("--host <host>", "PostgreSQL server host (team library)")
  .option("--port <port>", "PostgreSQL port (default 5432)")
  .option("--database <name>", "PostgreSQL database name")
  .option(
    "--username <name>",
    "PostgreSQL role; with Entra your UPN (discovered from `az` when omitted)",
  )
  .option(
    "--auth <mode>",
    "PostgreSQL authentication: entra-cli (default, token from `az`) | password",
  )
  .option("--password <password>", "PostgreSQL password (auth password)")
  .option(
    "--password-from <ref>",
    "Vault reference instead of --password (e.g. bw://zam-team-db/password)",
  )
  .option("--no-ssl", "Plain connection (loopback hosts only)")
  .option(
    "--replace",
    "Replace a configured database of the other kind (turso ↔ postgres) instead of refusing",
  )
  .action(async (type, opts) => {
    if (type === "postgres") {
      return setupPostgres(opts);
    }
    if (type === "turso") {
      if (opts.mode && opts.mode !== "native" && opts.mode !== "remote") {
        console.error(`Invalid --mode: ${opts.mode}. Use native or remote.`);
        process.exit(1);
      }
      if (opts.token && opts.tokenFrom) {
        console.error("Use either --token or --token-from, not both.");
        process.exit(1);
      }
      if (!refuseOtherLibrary("turso", Boolean(opts.replace))) {
        process.exit(1);
      }
      return setupTurso(opts.url, opts.token, opts.mode, opts.tokenFrom);
    }
    if (type !== "ado") {
      console.error(
        `Unknown connector type: ${type}. Supported: ado, turso, postgres`,
      );
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

// ── zam connector restore ───────────────────────────────────────────────────

connectorCommand
  .command("restore")
  .description(
    "Switch back to the previous library kept by --replace (turso ↔ postgres)",
  )
  .option("--json", "Output as JSON")
  .action(async (opts: { json?: boolean }) => {
    const previous = getPreviousLibrary();
    if (!previous) {
      const message =
        "No previous library is kept on this machine. Nothing to restore.";
      if (opts.json)
        console.log(JSON.stringify({ success: false, error: message }));
      else console.error(message);
      process.exit(1);
    }
    try {
      const status = await restoreLibrary();
      if (opts.json) {
        console.log(JSON.stringify({ success: true, ...status }, null, 2));
        return;
      }
      console.log(`Switched back to ${status.target.location}.`);
      if (status.verifyError) {
        console.log(
          `  note: the library could not be opened: ${status.verifyError}`,
        );
      } else if (status.target.kind === "postgres") {
        console.log(
          status.member
            ? `  learner ${status.userId} (database role ${status.role})`
            : `  your account ${status.role ?? ""} is not a member yet — administrator: zam team add-member ${status.role ?? "<upn>"}`,
        );
      }
      if (status.previous) {
        console.log(
          `  kept as previous library: ${status.previous.location} (zam connector restore switches again)`,
        );
      }
    } catch (err) {
      const message = (err as Error).message;
      if (opts.json)
        console.log(JSON.stringify({ success: false, error: message }));
      else console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

// ── zam connector clear ─────────────────────────────────────────────────────

connectorCommand
  .command("clear")
  .description("Remove a connector configuration")
  .argument("<type>", "Connector type (ado, turso, postgres, previous)")
  .action((type) => {
    if (type === "turso") {
      clearTursoCredentials();
      console.log("Turso cloud sync removed. Database remains local-only.");
      return;
    }

    if (type === "postgres") {
      clearPostgresCredentials();
      console.log(
        "Team library connection removed. Database remains local-only.",
      );
      return;
    }

    if (type === "previous") {
      const previous = getPreviousLibrary();
      clearPreviousLibrary();
      console.log(
        previous
          ? `Forgot the previous library (${previous.location}) and its token.`
          : "No previous library was kept.",
      );
      return;
    }

    if (type !== "ado") {
      console.error(
        `Unknown connector type: ${type}. Supported: ado, turso, postgres, previous`,
      );
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
  .description(
    "Verify the configured server database connection (Turso or team library)",
  )
  .action(async () => {
    const turso = getTursoCredentials();
    const postgres = getPostgresCredentials();
    if (!turso && !postgres) {
      console.error(
        "No server database configured. Run: zam connector setup turso | zam connector setup postgres",
      );
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      db = await openDatabaseWithSync(postgres ? {} : { initialize: true });
      await db.prepare("SELECT 1").get();
      if (postgres) {
        const identity = await describeIdentity(db);
        console.log(
          `Connected to ${describePostgresTarget(postgres)} as ${postgres.username}`,
        );
        console.log(
          identity.userId
            ? `Learner id: ${identity.userId}`
            : `Not a member yet. Ask the administrator to run: zam team add-member ${postgres.username}`,
        );
      } else if (turso) {
        console.log(`Connected to ${turso.url}`);
      }
      await db.close();
    } catch (err) {
      await db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

/**
 * One machine is bound to one library (ADR 2026-09-04 Decision 6). Storing
 * a second kind would leave every command refusing until someone clears one
 * by hand, so setup refuses first — or replaces on request.
 */
function refuseOtherLibrary(
  setting: "turso" | "postgres",
  replace: boolean,
): boolean {
  const stored = loadStoredCredentials();
  const other = setting === "turso" ? stored.postgres : stored.turso;
  if (!other) return true;
  if (replace) {
    // Kept, not dropped: switching back is `zam connector restore`, with no
    // new token to fetch (pilot plan phase 7).
    keepLibraryAsPrevious(setting === "turso" ? "postgres" : "turso");
    console.log(
      `Kept the configured ${setting === "turso" ? "team library" : "Turso database"} as the previous library (--replace). Switch back with: zam connector restore`,
    );
    return true;
  }
  const otherName =
    setting === "turso" ? "team library (postgres)" : "Turso database";
  const clear = setting === "turso" ? "postgres" : "turso";
  console.error(
    `A ${otherName} is already configured on this machine. ZAM binds a machine to one library:\n` +
      `  keep it and stop, or run: zam connector clear ${clear}   (or pass --replace)`,
  );
  return false;
}

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

// ── PostgreSQL (team library) setup ─────────────────────────────────────────

interface PostgresSetupOptions {
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  auth?: string;
  password?: string;
  passwordFrom?: string;
  /** Commander defaults `ssl` to true and `--no-ssl` sets it to false. */
  ssl?: boolean;
  replace?: boolean;
}

/**
 * Connect this machine to the team library (ADR 2026-09-04 Decisions 3, 6 and
 * 9). With Entra nothing secret is stored: host, database and the colleague's
 * UPN — read from the Azure CLI when not given — are all the file holds, and
 * every connection fetches its own token. `password` mode exists for local
 * Docker development and servers without Entra; the password may be a vault
 * reference like every other secret.
 *
 * Verification opens the configured library once. Membership is reported, not
 * enforced here: an administrator maps the account with `zam team add-member`.
 */
async function setupPostgres(opts: PostgresSetupOptions): Promise<void> {
  let db: Database | undefined;
  try {
    if (opts.password && opts.passwordFrom) {
      console.error("Use either --password or --password-from, not both.");
      process.exit(1);
    }
    if (!refuseOtherLibrary("postgres", Boolean(opts.replace))) {
      process.exit(1);
    }
    const stored = loadStoredCredentials().postgres;
    const authRaw = opts.auth ?? stored?.auth ?? "entra-cli";
    if (authRaw !== "entra-cli" && authRaw !== "password") {
      console.error(`Invalid --auth: ${authRaw}. Use entra-cli or password.`);
      process.exit(1);
    }
    const auth: PostgresAuthMode = authRaw;

    const host =
      opts.host ??
      (await input({
        message:
          "PostgreSQL host (e.g. my-team-pg.postgres.database.azure.com):",
        ...(stored?.host ? { default: stored.host } : {}),
      }));
    const database =
      opts.database ??
      (await input({
        message: "Database name:",
        default: stored?.database ?? "zam_prod",
      }));
    const portRaw =
      opts.port ?? (stored?.port !== undefined ? String(stored.port) : "");
    const port = portRaw.trim() ? Number(portRaw) : undefined;
    if (port !== undefined && (!Number.isInteger(port) || port <= 0)) {
      console.error(`Invalid --port: ${portRaw}`);
      process.exit(1);
    }

    let username = opts.username ?? stored?.username;
    if (!username && auth === "entra-cli") {
      console.log("Reading your signed-in account from the Azure CLI…");
      username = await entraCliSignedInUpn();
    }
    if (!username) {
      username = await input({ message: "Database role (username):" });
    }

    let pw: StoredSecret | undefined;
    if (auth === "password") {
      if (opts.passwordFrom) pw = secretRefFromUri(opts.passwordFrom);
      else if (opts.password) pw = opts.password;
      else pw = await password({ message: "Password:" });
      if (!pw) {
        console.error("A password is required with --auth password.");
        process.exit(1);
      }
    }

    if (!host || !database || !username) {
      console.error("Host, database and username are required.");
      process.exit(1);
    }

    // A bearer token or password must never cross the network in the clear;
    // plain connections are for a database on this machine only.
    const plainRequested = opts.ssl === false;
    const loopback = /^(localhost|127\.0\.0\.1|::1)$/i.test(host.trim());
    if (plainRequested && !loopback) {
      console.error(
        `--no-ssl is only allowed for loopback hosts; ${host.trim()} would receive credentials unencrypted.`,
      );
      process.exit(1);
    }
    // Re-running setup without --no-ssl keeps a stored plain setting for a
    // loopback host; a remote host always gets TLS.
    const ssl =
      plainRequested || (stored?.ssl === false && loopback) ? false : undefined;

    setPostgresCredentials({
      host: host.trim(),
      database: database.trim(),
      username: username.trim(),
      auth,
      ...(port !== undefined ? { port } : {}),
      ...(pw !== undefined ? { password: pw } : {}),
      ...(ssl === false ? { ssl: false } : {}),
    });
    await resolveCredentials();

    const target = getPostgresCredentials();
    if (!target) {
      console.error(
        opts.passwordFrom
          ? `Could not resolve password reference "${opts.passwordFrom}". Fix the vault item or run: zam credentials check`
          : "PostgreSQL credentials incomplete after setup.",
      );
      process.exit(1);
    }

    // Verify by opening the configured library; the open refuses an
    // unprovisioned or outdated schema with the administrator's next step.
    const location = describePostgresTarget(target);
    try {
      db = await openDatabaseWithSync();
    } catch (err) {
      const message = (err as Error).message;
      if (/not provisioned yet/.test(message)) {
        // The administrator's normal first run: the connection is right, the
        // library is simply not there yet. Settings stay; nothing is wrong.
        console.log(
          `Connection settings saved for ${location} as ${target.username} (auth: ${target.auth}).`,
        );
        console.log(
          `The library is not provisioned yet. Administrator: zam team provision --database ${target.database}`,
        );
        return;
      }
      throw err;
    }
    let learner: string | null = null;
    let mapped = false;
    try {
      const who = (await db
        .prepare("SELECT current_learner_id() AS learner")
        .get()) as { learner: string | null } | undefined;
      learner = who?.learner ?? null;
      mapped = true;
    } catch {
      // No `current_learner_id()` — a plain PostgreSQL without the team
      // deployment SQL. Connection proven; membership cannot be judged.
    }
    await db.close();

    console.log(
      `Team library configured and verified: ${location}` +
        ` as ${target.username} (auth: ${target.auth})`,
    );
    if (mapped && learner === null) {
      console.log(
        "Your account is not yet a member of this library. Ask the administrator to run:\n" +
          `  zam team add-member ${target.username}`,
      );
    } else if (learner) {
      console.log(`Learner id: ${learner}`);
    }
  } catch (err) {
    await db?.close();
    if ((err as Error).name === "ExitPromptError") {
      console.log("\nSetup cancelled.");
      process.exit(0);
    }
    const saved = getPostgresCredentials() !== null;
    const detail = isEntraLoginRequired(err)
      ? (err as Error).message.replace(/^ENTRA_LOGIN_REQUIRED: /, "")
      : (err as Error).message;
    console.error(`Error: ${detail}`);
    if (saved) {
      console.error(
        "The connection settings were saved but could not be verified. Fix them with " +
          "`zam connector setup postgres …` or undo with `zam connector clear postgres`.",
      );
    }
    process.exit(1);
  }
}
