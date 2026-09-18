/**
 * Team library administration (ADR 2026-09-04 Decisions 2, 7 and 8).
 *
 * Everything the administrator applies to the shared PostgreSQL database
 * after the kernel schema: the RLS deployment SQL, the three group roles that
 * carry authorisation, default privileges so future migrations stay covered,
 * the library's single knowledge context, and the per-colleague mapping from
 * database role to ZAM ULID. Idempotent end to end, so `zam team provision`
 * is a repeatable step rather than a one-shot.
 *
 * Deliberately in the CLI layer: the kernel stays free of roles, grants and
 * identity providers (ADR 2026-07-04 Decision 8). The kernel only contributes
 * `applySchemaAndMigrations`.
 */

import { ulid } from "ulid";
import type { Database } from "../../kernel/index.js";
import {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
  createKnowledgeContext,
  getKnowledgeContextByName,
} from "../../kernel/index.js";
import { DEPLOYMENT_RLS_SQL, RLS_PROTECTED_TABLES } from "./rls-policies.js";

/** Group roles; NOLOGIN, cluster-wide, granted to every learner role. */
export const TEAM_MEMBER_ROLE = "zam_member";
export const TEAM_CURATOR_ROLE = "zam_curator";

/** Name of the one knowledge context a team library carries (Decision 2). */
export const TEAM_CONTEXT_NAME = "team";

/** Double-quote a PostgreSQL identifier (roles are UPNs with `@` and `.`). */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function createGroupRoleSql(role: string): string {
  return `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
    CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;`;
}

/**
 * Grants for the group roles.
 *
 * `zam_member` reads the whole library and writes its own learning state —
 * the RLS policies decide which rows that is — plus `user_config`, which every
 * surface still writes until settings scopes land (pilot plan phase 4).
 * `zam_curator` may write everything: publishing tokens, contexts, sources.
 * In the pilot every member is also a curator (Decision 7), so narrowing
 * later is a grant revoke, not a schema change.
 */
export function groupRoleGrantsSql(schema: string, ownerRole: string): string {
  const owner = quoteIdent(ownerRole);
  const learningState = [...RLS_PROTECTED_TABLES, "user_config"]
    .map((table) => `${schema}.${table}`)
    .join(", ");
  return `
GRANT USAGE ON SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE}, ${TEAM_CURATOR_ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE};
GRANT INSERT, UPDATE, DELETE ON ${learningState} TO ${TEAM_MEMBER_ROLE};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE};
GRANT EXECUTE ON FUNCTION ${schema}.current_learner_id() TO ${TEAM_MEMBER_ROLE};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${TEAM_CURATOR_ROLE};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${TEAM_CURATOR_ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${schema}
  GRANT SELECT ON TABLES TO ${TEAM_MEMBER_ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${schema}
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${TEAM_CURATOR_ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${schema}
  GRANT USAGE, SELECT ON SEQUENCES TO ${TEAM_MEMBER_ROLE}, ${TEAM_CURATOR_ROLE};
`;
}

export interface ProvisionResult {
  schemaVersion: number;
  /** Role that ran the provisioning and owns the schema objects. */
  ownerRole: string;
  contextId: string;
  contextCreated: boolean;
}

/**
 * Turn a database into a team library, or bring one up to date: kernel
 * schema and migrations, RLS deployment SQL, group roles and grants, the
 * single knowledge context. Runs as the administrator (schema owner).
 */
export async function provisionTeamLibrary(
  db: Database,
  options: { schema?: string } = {},
): Promise<ProvisionResult> {
  const schema = options.schema ?? "public";
  const who = (await db.prepare("SELECT current_user AS role").get()) as {
    role: string;
  };

  await applySchemaAndMigrations(db);
  await db.exec(DEPLOYMENT_RLS_SQL);
  await db.exec(createGroupRoleSql(TEAM_MEMBER_ROLE));
  await db.exec(createGroupRoleSql(TEAM_CURATOR_ROLE));
  await db.exec(groupRoleGrantsSql(schema, who.role));

  let context = await getKnowledgeContextByName(db, TEAM_CONTEXT_NAME);
  let contextCreated = false;
  if (!context) {
    context = await createKnowledgeContext(db, {
      name: TEAM_CONTEXT_NAME,
      label: "Team library",
    });
    contextCreated = true;
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ownerRole: who.role,
    contextId: context.id,
    contextCreated,
  };
}

/**
 * Where login roles come from. On Azure Database for PostgreSQL an Entra
 * principal becomes a role through `pgaadauth_create_principal`, which lives
 * only in the server's `postgres` maintenance database; local development
 * and tests create plain password roles instead. Same contract either way.
 */
export interface PrincipalDirectory {
  /**
   * Make sure a login role for `upn` exists and return what is known about
   * it. Must be idempotent: an existing principal (the administrator's own
   * account, a colleague added twice) is returned, not an error.
   */
  ensurePrincipal(upn: string): Promise<{ objectId: string | null }>;
}

/**
 * The Azure flavour: `adminDb` is a connection to the server's `postgres`
 * database as the Entra administrator. Azure matches tokens to roles by
 * object id (Decision 2), which `pgaadauth_list_principals` reports.
 */
export function entraPrincipalDirectory(adminDb: Database): PrincipalDirectory {
  const lookup = async (upn: string): Promise<string | null> => {
    const rows = (await adminDb
      .prepare(
        "SELECT rolname, objectid FROM pgaadauth_list_principals(false) WHERE lower(rolname) = lower(?)",
      )
      .all(upn)) as Array<{ rolname: string; objectid: string | null }>;
    return rows.length > 0 ? (rows[0].objectid ?? null) : null;
  };
  return {
    async ensurePrincipal(upn) {
      const existing = (await adminDb
        .prepare(
          "SELECT 1 AS present FROM pgaadauth_list_principals(true) WHERE lower(rolname) = lower(?)",
        )
        .get(upn)) as { present: number } | undefined;
      if (!existing) {
        await adminDb
          .prepare("SELECT * FROM pgaadauth_create_principal(?, false, false)")
          .get(upn);
      }
      return { objectId: await lookup(upn) };
    },
  };
}

export interface AddMemberResult {
  upn: string;
  userId: string;
  /** False when the role was already mapped and kept its ULID. */
  created: boolean;
  objectId: string | null;
  curator: boolean;
}

/**
 * Map a colleague into the library (Decision 2): make sure their login role
 * exists, mint a ZAM ULID once, record the mapping, grant the group roles and
 * the right to connect. Re-running for a mapped colleague keeps their ULID —
 * history belongs to the person — and refreshes the Entra details.
 */
export async function addTeamMember(
  db: Database,
  directory: PrincipalDirectory,
  options: { upn: string; database: string; curator?: boolean },
): Promise<AddMemberResult> {
  const upn = options.upn.trim();
  if (!upn) throw new Error("A user principal name is required.");
  const curator = options.curator ?? true;
  const role = quoteIdent(upn);

  const { objectId } = await directory.ensurePrincipal(upn);

  const existing = (await db
    .prepare("SELECT zam_user_id FROM learner_principals WHERE db_role = ?")
    .get(upn)) as { zam_user_id: string } | undefined;
  const userId = existing?.zam_user_id ?? ulid();
  if (existing) {
    await db
      .prepare(
        `UPDATE learner_principals
            SET entra_upn = ?, entra_object_id = COALESCE(?, entra_object_id)
          WHERE db_role = ?`,
      )
      .run(upn, objectId, upn);
  } else {
    await db
      .prepare(
        `INSERT INTO learner_principals (zam_user_id, db_role, entra_object_id, entra_upn)
         VALUES (?, ?, ?, ?)`,
      )
      .run(userId, upn, objectId, upn);
  }

  await db.exec(`GRANT ${TEAM_MEMBER_ROLE} TO ${role};`);
  if (curator) {
    await db.exec(`GRANT ${TEAM_CURATOR_ROLE} TO ${role};`);
  } else {
    await db.exec(`REVOKE ${TEAM_CURATOR_ROLE} FROM ${role};`);
  }
  await db.exec(
    `GRANT CONNECT ON DATABASE ${quoteIdent(options.database)} TO ${role};`,
  );
  await db.exec(`ALTER ROLE ${role} LOGIN;`);

  return { upn, userId, created: !existing, objectId, curator };
}

/**
 * Take a colleague's login away (Decision 2). Their rows stay; the mapping
 * stays too, so a returning colleague is the same learner again.
 */
export async function removeTeamMember(
  db: Database,
  upn: string,
): Promise<{ upn: string; wasMapped: boolean }> {
  const trimmed = upn.trim();
  const mapped = (await db
    .prepare("SELECT 1 AS present FROM learner_principals WHERE db_role = ?")
    .get(trimmed)) as { present: number } | undefined;
  await db.exec(`ALTER ROLE ${quoteIdent(trimmed)} NOLOGIN;`);
  return { upn: trimmed, wasMapped: Boolean(mapped) };
}

export interface TeamMember {
  userId: string;
  role: string;
  upn: string | null;
  objectId: string | null;
  canLogin: boolean;
  curator: boolean;
  createdAt: string;
}

/** Every mapped colleague with their login and curator state. */
export async function listTeamMembers(db: Database): Promise<TeamMember[]> {
  const rows = (await db
    .prepare(
      `SELECT lp.zam_user_id AS "userId",
              lp.db_role AS role,
              lp.entra_upn AS upn,
              lp.entra_object_id AS "objectId",
              COALESCE(r.rolcanlogin, false) AS "canLogin",
              CASE WHEN r.rolname IS NULL THEN false
                   ELSE pg_has_role(r.rolname, '${TEAM_CURATOR_ROLE}', 'member') END AS curator,
              lp.created_at::text AS "createdAt"
         FROM learner_principals lp
         LEFT JOIN pg_roles r ON r.rolname = lp.db_role
        ORDER BY lp.entra_upn, lp.db_role`,
    )
    .all()) as TeamMember[];
  return rows.map((row) => ({
    ...row,
    canLogin: Boolean(row.canLogin),
    curator: Boolean(row.curator),
  }));
}
