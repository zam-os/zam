import { describe, expect, it } from "vitest";
import { RLS_PROTECTED_TABLES } from "../../src/cli/deploy/rls-policies.js";
import {
  ADMIN_TABLES,
  addTeamMember,
  entraPrincipalDirectory,
  KNOWLEDGE_TABLES,
  LIBRARY_SETTINGS_TABLES,
  listTeamMembers,
  type PrincipalDirectory,
  provisionTeamLibrary,
  removeTeamMember,
  TEAM_CONTEXT_NAME,
} from "../../src/cli/deploy/team-provision.js";
import { resolveLearnerId } from "../../src/cli/users/identity.js";
import {
  openDatabase,
  openPostgresAdministration,
} from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { CURRENT_SCHEMA_VERSION } from "../../src/kernel/db/provision.js";
import { SCHEMA } from "../../src/kernel/db/schema.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  bindSettingsScope,
  bindStandingAssignments,
  createAssignment,
  createToken,
  detachCardForUser,
  ensureCard,
  getSetting,
  listAssignmentsForLearner,
  setSetting,
  withdrawAssignment,
} from "../../src/kernel/index.js";

/**
 * `zam team` end to end on a real PostgreSQL (ADR 2026-09-04 Decisions 2, 7
 * and 8): provision → add-member → connect as that member → review state is
 * private under RLS → the mapping table and the version marker are out of
 * every member's reach → remove-member revokes the login. Plain password
 * roles stand in for Entra principals through the injected directory; the
 * Azure flavour differs only in how the login role comes to exist.
 *
 *   npm run pg:up   →   npm run pg:test
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

/** Every table the kernel creates, read from the schema itself. */
function schemaTables(): string[] {
  return [...SCHEMA.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(
    (m) => m[1],
  );
}

describe("team library table classification", () => {
  it("names every kernel table exactly once", () => {
    // A table that is not classified has no writer and no reader beyond the
    // owner — fail closed, but fail loudly here so the classification keeps
    // up with the schema.
    const classified = [
      ...RLS_PROTECTED_TABLES,
      ...LIBRARY_SETTINGS_TABLES,
      ...KNOWLEDGE_TABLES,
      ...ADMIN_TABLES,
    ];
    expect(new Set(classified).size).toBe(classified.length);
    // learner_principals is deployment-scoped (rls-policies.ts), not kernel schema.
    expect([...classified].sort()).toEqual(
      [...schemaTables(), "learner_principals"].sort(),
    );
  });
});

describe("entraPrincipalDirectory", () => {
  /**
   * A stand-in for the server's `postgres` maintenance database: answers
   * `pgaadauth_list_principals` from a role list, records every call, and
   * lets `pgaadauth_create_principal` add a role under the spelling it is
   * given — which is what Azure does (verified 2026-09-18).
   */
  function fakeAdminDb(roles: Array<{ rolname: string; objectid: string }>) {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const db = {
      prepare(sql: string) {
        return {
          async all(...params: unknown[]) {
            calls.push({ sql, params });
            const wanted = String(params[0]).toLowerCase();
            return roles.filter((r) => r.rolname.toLowerCase() === wanted);
          },
          async get(...params: unknown[]) {
            calls.push({ sql, params });
            if (sql.includes("pgaadauth_create_principal")) {
              roles.push({ rolname: String(params[0]), objectid: "oid-new" });
            }
            return undefined;
          },
          async run() {
            return { changes: 0, lastInsertRowid: 0 };
          },
        };
      },
      async exec() {},
      async pragma() {
        return [];
      },
      async transaction() {
        throw new Error("not used here");
      },
      async close() {},
    };
    return { db: db as unknown as Database, calls };
  }

  it("reuses an existing role in the server's spelling and creates new ones in lower case", async () => {
    const { db, calls } = fakeAdminDb([
      { rolname: "Casey.Mixed@example.org", objectid: "oid-casey" },
    ]);
    const directory = entraPrincipalDirectory(db);

    expect(await directory.ensurePrincipal("casey.mixed@example.org")).toEqual({
      roleName: "Casey.Mixed@example.org",
      objectId: "oid-casey",
    });
    expect(
      calls.some((c) => c.sql.includes("pgaadauth_create_principal")),
    ).toBe(false);

    expect(await directory.ensurePrincipal("Jane.Doe@Example.org")).toEqual({
      roleName: "jane.doe@example.org",
      objectId: "oid-new",
    });
    const create = calls.find((c) =>
      c.sql.includes("pgaadauth_create_principal"),
    );
    expect(create?.params).toEqual(["jane.doe@example.org"]);
  });
});

describeWithPostgres("zam team on PostgreSQL (needs POSTGRES_URL)", () => {
  const url = POSTGRES_URL as string;
  const admin = POSTGRES_URL ? new URL(url) : ({} as URL);
  const schema = "zam_team";
  const database = admin.pathname ? admin.pathname.replace(/^\//, "") : "";
  const created = new Set<string>();

  /**
   * Local stand-in for pgaadauth: a password role per "principal", matched
   * regardless of case and reported in the server's spelling — exactly what
   * `pgaadauth_list_principals` gives the Azure flavour.
   */
  const localDirectory: PrincipalDirectory = {
    async ensurePrincipal(upn) {
      const db = openPostgresDatabase({ connectionString: url });
      try {
        const known = (await db
          .prepare(
            "SELECT rolname FROM pg_roles WHERE lower(rolname) = lower(?)",
          )
          .get(upn)) as { rolname: string } | undefined;
        if (known) {
          created.add(known.rolname);
          return { roleName: known.rolname, objectId: `oid-${known.rolname}` };
        }
        await db.exec(`
          CREATE ROLE "${upn}" LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
          ALTER ROLE "${upn}" SET search_path = ${schema};
        `);
        created.add(upn);
        return { roleName: upn, objectId: `oid-${upn}` };
      } finally {
        await db.close();
      }
    },
  };

  function adminDb(): Database {
    return openPostgresDatabase({
      connectionString: `${url}?options=-c%20search_path%3D${schema}`,
    });
  }

  function connectAs(upn: string): Promise<Database> {
    return openDatabase({
      postgres: {
        host: admin.hostname,
        port: Number(admin.port || 5432),
        database,
        username: upn,
        auth: "password",
        password: "pw",
        ssl: false,
      },
    });
  }

  async function reset(): Promise<void> {
    const db = openPostgresDatabase({ connectionString: url });
    try {
      await db.exec(
        `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
      );
      for (const upn of created) {
        await db.exec(`DROP OWNED BY "${upn}"; DROP ROLE IF EXISTS "${upn}";`);
      }
      created.clear();
    } finally {
      await db.close();
    }
  }

  it("provisions, maps members, isolates their learning state and revokes logins", async () => {
    await reset();
    try {
      // ── provision (twice: idempotent) ────────────────────────────────
      const control = adminDb();
      try {
        const first = await provisionTeamLibrary(control, { schema });
        expect(first.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        expect(first.contextCreated).toBe(true);
        const second = await provisionTeamLibrary(control, { schema });
        expect(second.contextCreated).toBe(false);
        expect(second.contextId).toBe(first.contextId);
        const ctx = (await control
          .prepare("SELECT name FROM contexts WHERE name = ?")
          .get(TEAM_CONTEXT_NAME)) as { name: string };
        expect(ctx.name).toBe(TEAM_CONTEXT_NAME);

        // ── add members; one without curator rights; one whose name the
        //    SQLite→PostgreSQL type rewrite used to mangle ("real", "blob") ─
        const alice = await addTeamMember(control, localDirectory, {
          upn: "alice@example.org",
          database,
        });
        const bob = await addTeamMember(control, localDirectory, {
          upn: "bob@example.org",
          database,
          curator: false,
        });
        const isabel = await addTeamMember(control, localDirectory, {
          upn: "isabel.real.blob@example.org",
          database,
        });
        expect(alice.created).toBe(true);
        expect(alice.objectId).toBe("oid-alice@example.org");
        // Re-adding keeps the ULID — history belongs to the person.
        const again = await addTeamMember(control, localDirectory, {
          upn: "alice@example.org",
          database,
        });
        expect(again.created).toBe(false);
        expect(again.userId).toBe(alice.userId);
        // The server's spelling wins over the administrator's: a role that
        // exists as Casey.Mixed@… is mapped, granted and reported under that
        // name when typed in lower case. `current_learner_id()` compares
        // db_role with current_user byte for byte, so a row in the typed
        // casing would leave Casey locked out after a "successful" add.
        await localDirectory.ensurePrincipal("Casey.Mixed@example.org");
        const casey = await addTeamMember(control, localDirectory, {
          upn: "casey.mixed@example.org",
          database,
        });
        expect(casey.role).toBe("Casey.Mixed@example.org");
        expect(casey.upn).toBe("casey.mixed@example.org");
        expect(
          await control
            .prepare(
              "SELECT db_role, entra_upn FROM learner_principals WHERE zam_user_id = ?",
            )
            .get(casey.userId),
        ).toEqual({
          db_role: "Casey.Mixed@example.org",
          entra_upn: "Casey.Mixed@example.org",
        });
        // Group roles and blanks are never colleagues.
        await expect(
          addTeamMember(control, localDirectory, {
            upn: "zam_member",
            database,
          }),
        ).rejects.toThrow(/group role/);
        await expect(
          addTeamMember(control, localDirectory, { upn: "  ", database }),
        ).rejects.toThrow(/principal name/);

        const token = await createToken(control, {
          slug: "team-token",
          concept: "Shared knowledge",
          domain: "team",
        });

        // ── members connect as themselves ─────────────────────────────
        const asAlice = await connectAs("alice@example.org");
        const asBob = await connectAs("bob@example.org");
        const asIsabel = await connectAs("isabel.real.blob@example.org");
        const asCasey = await connectAs("Casey.Mixed@example.org");
        try {
          expect(await resolveLearnerId(asAlice)).toBe(alice.userId);
          expect(await resolveLearnerId(asBob)).toBe(bob.userId);
          expect(await resolveLearnerId(asIsabel)).toBe(isabel.userId);
          expect(await resolveLearnerId(asCasey)).toBe(casey.userId);

          // Alice writes her learning state; Bob cannot see it (RLS).
          await ensureCard(asAlice, token.id, alice.userId);
          const aliceCards = await asAlice
            .prepare("SELECT id FROM cards")
            .all();
          const bobCards = await asBob.prepare("SELECT id FROM cards").all();
          expect(aliceCards).toHaveLength(1);
          expect(bobCards).toHaveLength(0);

          // Curator may publish knowledge, a plain member may not.
          await createToken(asAlice, {
            slug: "alice-publishes",
            concept: "By a curator",
          });
          await expect(
            createToken(asBob, { slug: "bob-publishes", concept: "Denied" }),
          ).rejects.toThrow(/permission denied/i);

          // Nobody but the owner touches the mapping or the version marker —
          // otherwise a curator could become any colleague.
          await expect(
            asAlice
              .prepare(
                "UPDATE learner_principals SET zam_user_id = ? WHERE db_role = ?",
              )
              .run(bob.userId, "alice@example.org"),
          ).rejects.toThrow(/permission denied/i);
          await expect(
            asAlice.prepare("UPDATE zam_schema_version SET version = 0").run(),
          ).rejects.toThrow(/permission denied/i);
          // Members read only the two columns current_learner_id() needs.
          await expect(
            asAlice
              .prepare("SELECT entra_object_id FROM learner_principals")
              .all(),
          ).rejects.toThrow(/permission denied/i);
          expect(
            await asAlice
              .prepare(
                "SELECT zam_user_id FROM learner_principals WHERE db_role = current_user",
              )
              .get(),
          ).toEqual({ zam_user_id: alice.userId });
          // …and still see their own learning state after the owner re-ran
          // provisioning, which lifts FORCE RLS only for the duration of the
          // migrations.
          await provisionTeamLibrary(control, { schema });
          expect(
            await asAlice.prepare("SELECT id FROM cards").all(),
          ).toHaveLength(1);
          expect(
            await asBob.prepare("SELECT id FROM cards").all(),
          ).toHaveLength(0);
          const forced = (await control
            .prepare(
              `SELECT count(*) AS n FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = ? AND c.relname = ANY(?) AND c.relforcerowsecurity`,
            )
            .get(schema, [...RLS_PROTECTED_TABLES])) as { n: number | string };
          expect(Number(forced.n)).toBe(RLS_PROTECTED_TABLES.length);

          // ── assignments under the shipped grants: the assigner writes the
          //    assignment row only; the assignee's own client binds the card
          //    (nobody may write another learner's state); the assignee can
          //    neither withdraw, take over nor delete the assignment ───────
          const assignment = await createAssignment(asAlice, {
            tokenId: token.id,
            assignerId: alice.userId,
            assigneeId: bob.userId,
          });
          expect(
            (await listAssignmentsForLearner(asBob, bob.userId)).map(
              (a) => a.id,
            ),
          ).toEqual([assignment.id]);
          expect(
            await asBob.prepare("SELECT id FROM cards").all(),
          ).toHaveLength(0);
          const bound = await bindStandingAssignments(asBob, bob.userId);
          expect(bound.map((c) => [c.user_id, c.assignment_id])).toEqual([
            [bob.userId, assignment.id],
          ]);
          expect(await bindStandingAssignments(asBob, bob.userId)).toEqual([]);
          await expect(
            detachCardForUser(asBob, token.id, bob.userId),
          ).rejects.toThrow(/active assignment/i);
          for (const [sql, params] of [
            [
              "UPDATE assignments SET assigner_id = ? WHERE id = ?",
              [bob.userId, assignment.id],
            ],
            [
              "UPDATE assignments SET withdrawn_at = '2026-01-01T00:00:00.000Z' WHERE id = ?",
              [assignment.id],
            ],
            ["DELETE FROM assignments WHERE id = ?", [assignment.id]],
          ] as Array<[string, unknown[]]>) {
            expect((await asBob.prepare(sql).run(...params)).changes, sql).toBe(
              0,
            );
          }
          await expect(
            withdrawAssignment(asBob, assignment.id, bob.userId),
          ).rejects.toThrow(/Permission denied/);
          await withdrawAssignment(asAlice, assignment.id, alice.userId);
          const detached = await detachCardForUser(asBob, token.id, bob.userId);
          expect(detached.detached_at).toBeTruthy();
          // Bound or not, Bob's card never became visible to Alice.
          expect(
            await asAlice
              .prepare("SELECT id FROM cards WHERE user_id = ?")
              .all(bob.userId),
          ).toHaveLength(0);

          // ── settings scopes (Decision 4) under the shipped grants: a
          //    person's keys are theirs under RLS, nothing of them touches
          //    the shared table, and only a curator writes library defaults ─
          bindSettingsScope(asAlice, {
            userId: alice.userId,
            machineId: "01MALICEPC000000000000000000",
            shared: true,
          });
          bindSettingsScope(asBob, {
            userId: bob.userId,
            machineId: "01MBOBPC00000000000000000000",
            shared: true,
          });
          await setSetting(asAlice, "system.locale", "de");
          await setSetting(asAlice, "llm.url", "http://alice-pc:11434/v1");
          await setSetting(asBob, "system.locale", "en");
          expect(await getSetting(asAlice, "system.locale")).toBe("de");
          expect(await getSetting(asBob, "system.locale")).toBe("en");
          expect(await getSetting(asBob, "llm.url")).toBeUndefined();
          const shared = (await control
            .prepare(
              "SELECT count(*) AS n FROM user_config WHERE key IN ('system.locale', 'llm.url')",
            )
            .get()) as { n: number | string };
          expect(Number(shared.n)).toBe(0);
          expect(
            await asBob
              .prepare("SELECT key FROM user_settings WHERE user_id = ?")
              .all(alice.userId),
          ).toHaveLength(0);
          await expect(
            asBob
              .prepare(
                `INSERT INTO user_settings (user_id, machine_id, key, value, updated_at)
                 VALUES (?, '', 'system.locale', 'fr', '2026-09-19T00:00:00.000Z')`,
              )
              .run(alice.userId),
          ).rejects.toThrow(/row-level security/i);
          // Library defaults: a plain member is refused, a curator sets them
          // for everyone.
          await expect(
            setSetting(asBob, "search.dedup_threshold", "0.5"),
          ).rejects.toThrow(/permission denied/i);
          await setSetting(asAlice, "search.dedup_threshold", "0.9");
          expect(await getSetting(asBob, "search.dedup_threshold")).toBe("0.9");
        } finally {
          await asAlice.close();
          await asBob.close();
          await asIsabel.close();
          await asCasey.close();
        }

        // ── listing and revocation ─────────────────────────────────────
        const members = await listTeamMembers(control);
        expect(
          members
            .map((m) => [m.upn, m.canLogin, m.curator])
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "en")),
        ).toEqual([
          ["alice@example.org", true, true],
          ["bob@example.org", true, false],
          ["Casey.Mixed@example.org", true, true],
          ["isabel.real.blob@example.org", true, true],
        ]);
        expect(members[0].createdAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );

        const removed = await removeTeamMember(control, "bob@example.org");
        expect(removed.wasMapped).toBe(true);
        await expect(connectAs("bob@example.org")).rejects.toThrow(
          /not permitted to log in|password authentication failed/i,
        );
        const after = await listTeamMembers(control);
        expect(after.find((m) => m.upn === "bob@example.org")?.canLogin).toBe(
          false,
        );
        // Bob's row survives the revocation.
        const bobRow = await control
          .prepare(
            "SELECT zam_user_id FROM learner_principals WHERE db_role = ?",
          )
          .get("bob@example.org");
        expect(bobRow).toBeDefined();
        // Revocation resolves the spelling the same way as adding did.
        const caseyGone = await removeTeamMember(
          control,
          "CASEY.MIXED@example.org",
        );
        expect(caseyGone.role).toBe("Casey.Mixed@example.org");
        expect(caseyGone.wasMapped).toBe(true);
        await expect(connectAs("Casey.Mixed@example.org")).rejects.toThrow(
          /not permitted to log in|password authentication failed/i,
        );

        // Revocation refuses what is not a colleague.
        await expect(
          removeTeamMember(control, "ghost@example.org"),
        ).rejects.toThrow(/No role ghost@example.org exists/);
        await expect(removeTeamMember(control, "zam_curator")).rejects.toThrow(
          /group role/,
        );
        await expect(
          removeTeamMember(control, decodeURIComponent(admin.username)),
        ).rejects.toThrow(/connected as/);
      } finally {
        await control.close();
      }

      // The administration open skips the schema gate; the learner open
      // enforces it — both against the same target.
      const raw = openPostgresAdministration({
        host: admin.hostname,
        port: Number(admin.port || 5432),
        database,
        username: decodeURIComponent(admin.username),
        auth: "password",
        password: decodeURIComponent(admin.password),
        ssl: false,
      });
      await raw.prepare("SELECT 1 AS one").get();
      await raw.close();
    } finally {
      await reset();
    }
  });
});
