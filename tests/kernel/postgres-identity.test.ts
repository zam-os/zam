import { describe, expect, it } from "vitest";
import {
  DEPLOYMENT_RLS_SQL,
  grantsForLearnerRoleSql,
} from "../../src/cli/deploy/rls-policies.js";
import {
  IdentityMismatchError,
  NotAMemberError,
  resolveLearnerId,
} from "../../src/cli/users/identity.js";
import { openDatabase } from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";

/**
 * Derived identity against a real PostgreSQL (ADR 2026-09-04 Decision 2):
 * two mapped login roles and one unmapped role connect through
 * `openDatabase`, exactly as colleagues do with their own Entra login, and the
 * client takes its learner id from the connection. Local Docker allows
 * password roles, which stand in for Entra principals here.
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

const ALICE = "01JALICE0000000000000000";
const BOB = "01JBOB000000000000000000";

describeWithPostgres(
  "derived identity on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const url = POSTGRES_URL as string;
    const admin = POSTGRES_URL ? new URL(url) : ({} as URL);
    const schema = "zam_identity";
    const roles = ["zam_id_alice", "zam_id_bob", "zam_id_nobody"];

    async function withAdmin<T>(fn: (db: Database) => Promise<T>): Promise<T> {
      const db = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      try {
        return await fn(db);
      } finally {
        await db.close();
      }
    }

    async function seed(): Promise<void> {
      await withAdmin(async (db) => {
        await db.exec(
          `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
        );
        await applySchemaAndMigrations(db);
        await db.exec(DEPLOYMENT_RLS_SQL);
        for (const role of roles) {
          await db.exec(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
              CREATE ROLE ${role} LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
            END IF;
          END
          $$;
          ALTER ROLE ${role} SET search_path = ${schema};
        `);
          await db.exec(grantsForLearnerRoleSql(role, schema));
        }
        await db
          .prepare(
            `INSERT INTO learner_principals (zam_user_id, db_role, entra_upn)
           VALUES (?, 'zam_id_alice', 'alice@example.org'),
                  (?, 'zam_id_bob', 'bob@example.org')`,
          )
          .run(ALICE, BOB);
      });
    }

    async function teardown(): Promise<void> {
      await withAdmin(async (db) => {
        await db.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        for (const role of roles) {
          await db.exec(`DROP ROLE IF EXISTS ${role}`);
        }
      });
    }

    function connectAs(role: string): Promise<Database> {
      return openDatabase({
        postgres: {
          host: admin.hostname,
          port: Number(admin.port || 5432),
          database: admin.pathname.replace(/^\//, ""),
          username: role,
          auth: "password",
          password: "pw",
          ssl: false,
        },
      });
    }

    it("takes the learner id from the connected role and rejects any other", async () => {
      await seed();
      try {
        const alice = await connectAs("zam_id_alice");
        const bob = await connectAs("zam_id_bob");
        const nobody = await connectAs("zam_id_nobody");
        try {
          expect(await resolveLearnerId(alice)).toBe(ALICE);
          expect(await resolveLearnerId(bob)).toBe(BOB);
          expect(await resolveLearnerId(alice, ALICE)).toBe(ALICE);
          await expect(resolveLearnerId(alice, BOB)).rejects.toThrow(
            IdentityMismatchError,
          );
          await expect(resolveLearnerId(nobody)).rejects.toThrow(
            NotAMemberError,
          );
        } finally {
          await alice.close();
          await bob.close();
          await nobody.close();
        }
      } finally {
        await teardown();
      }
    });
  },
);
