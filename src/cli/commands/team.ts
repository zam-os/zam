/**
 * `zam team` — administer the team library (ADR 2026-09-04 Decision 8).
 *
 * Usable by the Entra administrator only: the commands open the server with
 * the administrator's own configured connection (`zam connector setup
 * postgres`) and their own token. Company values — host, database, names —
 * live in the team's configuration, never here.
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
  listTeamMembers,
  provisionTeamLibrary,
  removeTeamMember,
} from "../deploy/team-provision.js";
import { jsonOut } from "./shared/db.js";

export const teamCommand = new Command("team").description(
  "Administer the team library on PostgreSQL (administrator only)",
);

function fail(message: string, json: boolean): never {
  if (json) jsonOut({ error: message });
  else console.error(`Error: ${message}`);
  process.exit(1);
}

/** The administrator's configured target, optionally pointed at another database. */
function adminTarget(
  database: string | undefined,
  json: boolean,
): PostgresCredentials {
  const configured = getPostgresCredentials();
  if (!configured) {
    return fail(
      "No team library is configured on this machine. Run: zam connector setup postgres",
      json,
    );
  }
  return database ? { ...configured, database } : configured;
}

async function withAdminDb<T>(
  target: PostgresCredentials,
  json: boolean,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  const db = openPostgresAdministration(target);
  try {
    return await fn(db);
  } catch (err) {
    const message = isEntraLoginRequired(err)
      ? (err as Error).message.replace(/^ENTRA_LOGIN_REQUIRED: /, "")
      : (err as Error).message;
    return fail(message, json);
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
    const result = await withAdminDb(target, json, (db) =>
      provisionTeamLibrary(db),
    );
    if (json) {
      jsonOut({
        success: true,
        target: describePostgresTarget(target),
        ...result,
      });
      return;
    }
    console.log(`Provisioned ${describePostgresTarget(target)}`);
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
    "Map a colleague's Entra account into the library: role, ZAM id, grants (idempotent)",
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
      // Principal management lives in the server's `postgres` database.
      const maintenance = openPostgresAdministration({
        ...target,
        database: "postgres",
      });
      try {
        const result = await withAdminDb(target, json, (db) =>
          addTeamMember(db, entraPrincipalDirectory(maintenance), {
            upn,
            database: target.database,
            curator: opts.curator !== false,
          }),
        );
        if (json) {
          jsonOut({ success: true, ...result });
          return;
        }
        console.log(
          `${result.created ? "Added" : "Updated"} ${result.upn} → learner ${result.userId}` +
            (result.curator ? " (member, curator)" : " (member)"),
        );
        if (!result.objectId) {
          console.log(
            "  note: no Entra object id reported for this role — is the principal an Entra user on this server?",
          );
        }
      } finally {
        await maintenance.close().catch(() => {});
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
    const result = await withAdminDb(target, json, (db) =>
      removeTeamMember(db, upn),
    );
    if (json) {
      jsonOut({ success: true, ...result });
      return;
    }
    console.log(
      `Login revoked for ${result.upn}` +
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
    const members = await withAdminDb(target, json, (db) =>
      listTeamMembers(db),
    );
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
