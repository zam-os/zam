/**
 * `zam team` — administer the team library (ADR 2026-09-04 Decision 8).
 *
 * Usable by the administrator only: the commands open the server with the
 * administrator's own configured connection (`zam connector setup postgres`)
 * and their own token. Company values — host, database, names — live in the
 * team's configuration, never here.
 */

import { Command } from "commander";
import {
  type Database,
  describePostgresTarget,
  getPostgresCredentials,
  openPostgresAdministration,
  type PostgresCredentials,
} from "../../kernel/index.js";
import { isEntraLoginRequired } from "../db/entra-cli.js";
import {
  addTeamMember,
  entraPrincipalDirectory,
  existingRoleDirectory,
  listTeamMembers,
  type PrincipalDirectory,
  provisionTeamLibrary,
  removeTeamMember,
} from "../deploy/team-provision.js";
import { jsonOut } from "./shared/db.js";

export const teamCommand = new Command("team").description(
  "Administer the team library on PostgreSQL (administrator only)",
);

/** Report a failure and mark the exit code; never `process.exit` mid-flight. */
function report(message: string, json: boolean): undefined {
  if (json) jsonOut({ success: false, error: message });
  else console.error(`Error: ${message}`);
  process.exitCode = 1;
  return undefined;
}

/** The administrator's configured target, optionally pointed at another database. */
function adminTarget(
  database: string | undefined,
  json: boolean,
): PostgresCredentials | undefined {
  const configured = getPostgresCredentials();
  if (!configured) {
    return report(
      "No team library is configured on this machine. Run: zam connector setup postgres",
      json,
    );
  }
  return database ? { ...configured, database } : configured;
}

/**
 * Translate the PostgreSQL errors an administrator actually meets into the
 * next step; everything else passes through unchanged.
 */
function explain(err: unknown, target: PostgresCredentials): string {
  if (isEntraLoginRequired(err)) {
    return (err as Error).message.replace(/^ENTRA_LOGIN_REQUIRED: /, "");
  }
  const code = (err as { code?: string }).code;
  const message = (err as Error).message ?? String(err);
  if (code === "42P01" && /learner_principals/.test(message)) {
    return `${describePostgresTarget(target)} is not a team library yet. Run: zam team provision --database ${target.database}`;
  }
  if (code === "3D000") {
    return `Database ${target.database} does not exist on ${target.host}.`;
  }
  return message;
}

async function withAdminDb<T>(
  target: PostgresCredentials,
  json: boolean,
  fn: (db: Database) => Promise<T>,
): Promise<T | undefined> {
  const db = openPostgresAdministration(target);
  try {
    return await fn(db);
  } catch (err) {
    return report(explain(err, target), json);
  } finally {
    await db.close().catch(() => {});
  }
}

// ── zam team provision ─────────────────────────────────────────────────────

teamCommand
  .command("provision")
  .description(
    "Create or update the team library: schema, migrations, RLS, group roles and the single context (idempotent)",
  )
  .option(
    "--database <name>",
    "Database to provision (default: the configured one)",
  )
  .option("--json", "Output as JSON")
  .action(async (opts: { database?: string; json?: boolean }) => {
    const json = Boolean(opts.json);
    const target = adminTarget(opts.database, json);
    if (!target) return;
    const result = await withAdminDb(target, json, (db) =>
      provisionTeamLibrary(db),
    );
    if (!result) return;
    const location = describePostgresTarget(target);
    if (json) {
      jsonOut({ success: true, target: location, ...result });
      return;
    }
    console.log(`Provisioned ${location}`);
    console.log(
      `  schema version ${result.schemaVersion}, owner ${result.ownerRole}`,
    );
    console.log(
      `  context "team" ${result.contextCreated ? "created" : "present"} (${result.contextId})`,
    );
    console.log(
      "  RLS policies and group roles zam_member / zam_curator applied",
    );
  });

// ── zam team add-member ────────────────────────────────────────────────────

teamCommand
  .command("add-member")
  .description(
    "Map a colleague's account into the library: role, ZAM id, grants (idempotent)",
  )
  .argument("<upn>", "User principal name, e.g. jane.doe@example.org")
  .option("--database <name>", "Library database (default: the configured one)")
  .option("--no-curator", "Member may learn but not publish knowledge")
  .option("--json", "Output as JSON")
  .action(
    async (
      upn: string,
      opts: { database?: string; curator?: boolean; json?: boolean },
    ) => {
      const json = Boolean(opts.json);
      const target = adminTarget(opts.database, json);
      if (!target) return;

      // Where login roles come from depends on how this server authenticates:
      // Entra principals are created through pgaadauth in the server's
      // `postgres` maintenance database; a password server uses roles the
      // administrator already created.
      const maintenance =
        target.auth === "entra-cli"
          ? openPostgresAdministration({ ...target, database: "postgres" })
          : null;
      try {
        const result = await withAdminDb(target, json, (db) => {
          const directory: PrincipalDirectory = maintenance
            ? entraPrincipalDirectory(maintenance)
            : existingRoleDirectory(db);
          return addTeamMember(db, directory, {
            upn,
            database: target.database,
            curator: opts.curator !== false,
          });
        });
        if (!result) return;
        if (json) {
          jsonOut({
            success: true,
            target: describePostgresTarget(target),
            ...result,
          });
          return;
        }
        console.log(
          `${result.created ? "Added" : "Updated"} ${result.role} → learner ${result.userId}` +
            (result.curator ? " (member, curator)" : " (member)"),
        );
        if (result.role !== result.upn) {
          console.log(
            `  note: the server spells this account ${result.role}; the colleague connects with exactly that spelling (zam connector setup postgres --username ${result.role} …).`,
          );
        }
        if (maintenance && !result.objectId) {
          console.log(
            "  note: no Entra object id reported for this role — is the principal an Entra user on this server?",
          );
        }
      } finally {
        await maintenance?.close().catch(() => {});
      }
    },
  );

// ── zam team remove-member ─────────────────────────────────────────────────

teamCommand
  .command("remove-member")
  .description("Revoke a colleague's login; their learning history stays")
  .argument("<upn>", "User principal name")
  .option("--database <name>", "Library database (default: the configured one)")
  .option("--json", "Output as JSON")
  .action(async (upn: string, opts: { database?: string; json?: boolean }) => {
    const json = Boolean(opts.json);
    const target = adminTarget(opts.database, json);
    if (!target) return;
    const result = await withAdminDb(target, json, (db) =>
      removeTeamMember(db, upn),
    );
    if (!result) return;
    if (json) {
      jsonOut({
        success: true,
        target: describePostgresTarget(target),
        ...result,
      });
      return;
    }
    console.log(
      `Login revoked for ${result.role}` +
        (result.wasMapped
          ? "; the mapping and history stay."
          : " (was not mapped)."),
    );
  });

// ── zam team members ───────────────────────────────────────────────────────

teamCommand
  .command("members")
  .description("List the mapped colleagues with login and curator state")
  .option("--database <name>", "Library database (default: the configured one)")
  .option("--json", "Output as JSON")
  .action(async (opts: { database?: string; json?: boolean }) => {
    const json = Boolean(opts.json);
    const target = adminTarget(opts.database, json);
    if (!target) return;
    const members = await withAdminDb(target, json, (db) =>
      listTeamMembers(db),
    );
    if (!members) return;
    if (json) {
      jsonOut({
        success: true,
        target: describePostgresTarget(target),
        members,
      });
      return;
    }
    if (members.length === 0) {
      console.log("No members yet. Add one with: zam team add-member <upn>");
      return;
    }
    for (const member of members) {
      const flags = [
        member.canLogin ? "login" : "no-login",
        member.curator ? "curator" : "member",
      ].join(", ");
      console.log(`${member.userId}  ${member.upn ?? member.role}  (${flags})`);
    }
  });
