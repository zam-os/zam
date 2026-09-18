/**
 * Team library administration (ADR 2026-09-04 Decisions 2, 7 and 8).
 *
 * Everything the administrator applies to the shared PostgreSQL database
 * after the kernel schema: the RLS deployment SQL, the group roles that
 * carry authorisation, default privileges so future migrations stay covered,
 * the library's single knowledge context, and the per-colleague mapping from
 * database role to ZAM ULID. Idempotent end to end, so `zam team provision`
 * is a repeatable step rather than a one-shot.
 *
 * Deliberately in the CLI layer: the kernel stays free of roles, grants and
 * identity providers (ADR 2026-07-04 Decision 8). The kernel only contributes
 * `applySchemaAndMigrations`.
 *
 * ## Table classes and who may write them
 *
 * Every kernel table falls into exactly one class (a test asserts the
 * classification is complete, so a new table cannot slip through unnamed):
 *
 * - **learning state** (`RLS_PROTECTED_TABLES`): members write their own rows,
 *   row-level security decides which those are;
 * - **library settings** (`user_config`): shared, writable by members until
 *   settings scopes split personal keys out (pilot plan phase 4);
 * - **knowledge** (`KNOWLEDGE_TABLES`): readable by everyone, written by
 *   curators only;
 * - **administration** (`ADMIN_TABLES`): `learner_principals`, which
 *   `current_learner_id()` reads, and the schema version marker — nobody but
 *   the owner may change them. A member who could rewrite the mapping table
 *   could become any colleague, so this class is what keeps the identity
 *   derivation trustworthy.
 *
 * Curators never get `ALL TABLES`: a table added by a later migration has no
 * writer until it is classified here, which fails closed.
 */

import { ulid } from "ulid";
import type { Database } from "../../kernel/index.js";
import {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
  createKnowledgeContext,
  getKnowledgeContextByName,
  nowIso,
} from "../../kernel/index.js";
import { DEPLOYMENT_RLS_SQL, RLS_PROTECTED_TABLES } from "./rls-policies.js";

/** Group roles; NOLOGIN, cluster-wide, granted to every learner role. */
export const TEAM_MEMBER_ROLE = "zam_member";
export const TEAM_CURATOR_ROLE = "zam_curator";

/** Name of the one knowledge context a team library carries (Decision 2). */
export const TEAM_CONTEXT_NAME = "team";

/** Shared library settings — members may write until phase 4 splits scopes. */
export const LIBRARY_SETTINGS_TABLES = ["user_config"] as const;

/** Knowledge — read by all, written by curators. */
export const KNOWLEDGE_TABLES = [
  "tokens",
  "prerequisites",
  "sources",
  "token_sources",
  "token_embeddings",
  "contexts",
  "token_contexts",
  "media_assets",
  "token_media",
  "imported_card_bindings",
  "learning_atoms",
  "atom_uri_aliases",
  "atom_alignments",
  "atom_curriculum_bindings",
  "atom_prerequisites",
  "practice_item_replacements",
  "agent_skills",
] as const;

/** Written by the owner only; readable as far as the client needs. */
export const ADMIN_TABLES = [
  "learner_principals",
  "zam_schema_version",
] as const;

/** Double-quote a PostgreSQL identifier (roles are UPNs with `@` and `.`). */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Single-quote a PostgreSQL string literal. */
function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
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

function qualified(schema: string, tables: readonly string[]): string {
  return tables.map((table) => `${schema}.${table}`).join(", ");
}

/**
 * Grants for the group roles — explicit table lists, never `ALL TABLES` for
 * writes. `learner_principals` is readable column-wise only: the two columns
 * `current_learner_id()` needs, not every colleague's Entra object id.
 */
export function groupRoleGrantsSql(schema: string, ownerRole: string): string {
  const owner = quoteIdent(ownerRole);
  const learningState = qualified(schema, [
    ...RLS_PROTECTED_TABLES,
    ...LIBRARY_SETTINGS_TABLES,
  ]);
  const knowledge = qualified(schema, KNOWLEDGE_TABLES);
  const admin = qualified(schema, ADMIN_TABLES);
  return `
GRANT USAGE ON SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE}, ${TEAM_CURATOR_ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE};
GRANT INSERT, UPDATE, DELETE ON ${learningState} TO ${TEAM_MEMBER_ROLE};
GRANT INSERT, UPDATE, DELETE ON ${knowledge} TO ${TEAM_CURATOR_ROLE};
REVOKE INSERT, UPDATE, DELETE ON ${admin} FROM ${TEAM_MEMBER_ROLE}, ${TEAM_CURATOR_ROLE};
REVOKE SELECT ON ${schema}.learner_principals FROM ${TEAM_MEMBER_ROLE}, ${TEAM_CURATOR_ROLE};
GRANT SELECT (zam_user_id, db_role) ON ${schema}.learner_principals TO ${TEAM_MEMBER_ROLE};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${TEAM_MEMBER_ROLE};
GRANT EXECUTE ON FUNCTION ${schema}.current_learner_id() TO ${TEAM_MEMBER_ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${schema}
  GRANT SELECT ON TABLES TO ${TEAM_MEMBER_ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA ${schema}
  GRANT USAGE, SELECT ON SEQUENCES TO ${TEAM_MEMBER_ROLE};
`;
}

/**
 * Migrations run as the owner, and `FORCE ROW LEVEL SECURITY` binds the owner
 * too — a copy-and-rename migration over a learning-state table would then
 * carry only the administrator's rows and drop everyone else's. Lift FORCE
 * on the protected tables that already exist before the migrations run; the
 * policy SQL re-applies it right after. Members connected meanwhile stay
 * under RLS: `ENABLE` still applies to every non-owner.
 */
function liftForceRlsSql(schema: string): string {
  return RLS_PROTECTED_TABLES.map(
    (table) => `
DO $$
BEGIN
  IF to_regclass(${quoteLiteral(`${schema}.${table}`)}) IS NOT NULL THEN
    EXECUTE 'ALTER TABLE ${schema}.${table} NO FORCE ROW LEVEL SECURITY';
  END IF;
END
$$;`,
  ).join("\n");
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

  // Provisioning as anyone but the owner would create a second set of
  // objects or fail half-way; say so before touching anything.
  const owner = (await db
    .prepare(
      `SELECT tableowner FROM pg_tables WHERE schemaname = ? AND tablename = 'cards'`,
    )
    .get(schema)) as { tableowner: string } | undefined;
  if (owner && owner.tableowner !== who.role) {
    throw new Error(
      `This library is owned by role ${owner.tableowner}; provisioning must run as that role, not as ${who.role}.`,
    );
  }

  await db.exec(liftForceRlsSql(schema));
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
 * only in the server's `postgres` maintenance database; a self-hosted server
 * or local development uses roles that already exist. Same contract either way.
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
 * `pgaadauth_list_principals(false)` lists every Entra principal; `true`
 * would list administrators only and make every colleague look new.
 */
export function entraPrincipalDirectory(adminDb: Database): PrincipalDirectory {
  const lookup = async (
    upn: string,
  ): Promise<{ present: boolean; objectId: string | null }> => {
    const rows = (await adminDb
      .prepare(
        "SELECT * FROM pgaadauth_list_principals(false) WHERE lower(rolname) = lower(?)",
      )
      .all(upn)) as Array<Record<string, unknown>>;
    if (rows.length === 0) return { present: false, objectId: null };
    const objectId = rows[0].objectid ?? rows[0].objectId ?? null;
    return { present: true, objectId: objectId ? String(objectId) : null };
  };
  return {
    async ensurePrincipal(upn) {
      const existing = await lookup(upn);
      if (!existing.present) {
        await adminDb
          .prepare("SELECT * FROM pgaadauth_create_principal(?, false, false)")
          .get(upn);
      }
      return { objectId: (await lookup(upn)).objectId };
    },
  };
}

/**
 * For servers without Entra (self-hosted, local development): the login role
 * must already exist; the administrator creates it with `CREATE ROLE … LOGIN
 * PASSWORD …`. Nothing is created here, so a typo cannot mint a role.
 */
export function existingRoleDirectory(db: Database): PrincipalDirectory {
  return {
    async ensurePrincipal(upn) {
      const row = (await db
        .prepare("SELECT 1 AS present FROM pg_roles WHERE rolname = ?")
        .get(upn)) as { present: number } | undefined;
      if (!row) {
        throw new Error(
          `Role ${upn} does not exist on this server. Create it first, e.g. CREATE ROLE ${quoteIdent(upn)} LOGIN PASSWORD '…';`,
        );
      }
      return { objectId: null };
    },
  };
}

/** Names that are never a colleague. */
function assertPrincipalName(upn: string, currentRole: string): void {
  if (!upn || /\s/.test(upn)) {
    throw new Error("A user principal name is required (no whitespace).");
  }
  const lower = upn.toLowerCase();
  if (lower === TEAM_MEMBER_ROLE || lower === TEAM_CURATOR_ROLE) {
    throw new Error(`${upn} is a group role, not a colleague.`);
  }
  if (lower === currentRole.toLowerCase()) {
    throw new Error(
      `${upn} is the account you are connected as; use add-member for yourself, never remove-member.`,
    );
  }
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
 * history belongs to the person — and refreshes the Entra details. The
 * mapping row and the grants land in one transaction, so a failure leaves no
 * mapped-but-unusable member behind.
 */
export async function addTeamMember(
  db: Database,
  directory: PrincipalDirectory,
  options: { upn: string; database: string; curator?: boolean },
): Promise<AddMemberResult> {
  const upn = options.upn.trim();
  const who = (await db.prepare("SELECT current_user AS role").get()) as {
    role: string;
  };
  if (!upn || /\s/.test(upn)) {
    throw new Error("A user principal name is required (no whitespace).");
  }
  const lower = upn.toLowerCase();
  if (lower === TEAM_MEMBER_ROLE || lower === TEAM_CURATOR_ROLE) {
    throw new Error(`${upn} is a group role, not a colleague.`);
  }
  const curator = options.curator ?? true;
  const role = quoteIdent(upn);

  const { objectId } = await directory.ensurePrincipal(upn);

  return db.transaction(async (tx) => {
    const existing = (await tx
      .prepare("SELECT zam_user_id FROM learner_principals WHERE db_role = ?")
      .get(upn)) as { zam_user_id: string } | undefined;
    const userId = existing?.zam_user_id ?? ulid();
    if (existing) {
      await tx
        .prepare(
          `UPDATE learner_principals
              SET entra_upn = ?, entra_object_id = COALESCE(?, entra_object_id)
            WHERE db_role = ?`,
        )
        .run(upn, objectId, upn);
    } else {
      await tx
        .prepare(
          `INSERT INTO learner_principals (zam_user_id, db_role, entra_object_id, entra_upn)
           VALUES (?, ?, ?, ?)`,
        )
        .run(userId, upn, objectId, upn);
    }

    await tx.exec(`GRANT ${TEAM_MEMBER_ROLE} TO ${role};`);
    if (curator) {
      await tx.exec(`GRANT ${TEAM_CURATOR_ROLE} TO ${role};`);
    } else {
      await tx.exec(`REVOKE ${TEAM_CURATOR_ROLE} FROM ${role};`);
    }
    await tx.exec(
      `GRANT CONNECT ON DATABASE ${quoteIdent(options.database)} TO ${role};`,
    );
    // The administrator's own login is never toggled; a returning colleague's is.
    if (lower !== who.role.toLowerCase()) {
      await tx.exec(`ALTER ROLE ${role} LOGIN;`);
    }

    return { upn, userId, created: !existing, objectId, curator };
  });
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
  const who = (await db.prepare("SELECT current_user AS role").get()) as {
    role: string;
  };
  assertPrincipalName(trimmed, who.role);
  const exists = (await db
    .prepare("SELECT 1 AS present FROM pg_roles WHERE rolname = ?")
    .get(trimmed)) as { present: number } | undefined;
  if (!exists) {
    throw new Error(
      `No role ${trimmed} exists on this server — nothing to revoke.`,
    );
  }
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
  /** ISO-8601 UTC. */
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
              to_char(lp.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
         FROM learner_principals lp
         LEFT JOIN pg_roles r ON r.rolname = lp.db_role
        ORDER BY lp.entra_upn, lp.db_role`,
    )
    .all()) as TeamMember[];
  return rows.map((row) => ({
    ...row,
    canLogin: Boolean(row.canLogin),
    curator: Boolean(row.curator),
    createdAt: row.createdAt ?? nowIso(),
  }));
}
