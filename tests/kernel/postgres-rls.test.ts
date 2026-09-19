import { describe, expect, it } from "vitest";
import {
  DEPLOYMENT_RLS_SQL,
  grantsForLearnerRoleSql,
  RLS_PROTECTED_TABLES,
} from "../../src/cli/deploy/rls-policies.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { SCHEMA } from "../../src/kernel/db/schema.js";

/**
 * RLS is the load-bearing privacy boundary of Deployment B (ADR 2026-07-04
 * Decision 6): in the shared database only these policies keep one
 * colleague's review logs away from another's. A privacy boundary nobody
 * tests is a claim, not a boundary — so this exercises a **real** PostgreSQL
 * and the **shipped** policies (`src/cli/deploy/rls-policies.ts`), never a
 * copy pasted into the test.
 *
 * Identity comes from `current_user` (Decision 7), so switching learner here
 * means switching database role — exactly what a colleague's own Entra login
 * does in production.
 *
 *   npm run pg:up && npm run pg:test
 *
 * CI always runs it (`postgres:18-alpine`, the version the team library
 * runs on — Entra sign-in on 18 was verified on the real server, ADR
 * 2026-09-04).
 */
const POSTGRES_URL = process.env.POSTGRES_URL;

// A skipped security test that still reports "passed" is how a boundary
// quietly stops being tested. Make the gap visible in the report instead.
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

const ALICE = "01JALICE0000000000000000";
const BOB = "01JBOB000000000000000000";

describeWithPostgres("PostgreSQL RLS isolation (needs POSTGRES_URL)", () => {
  /**
   * `SET LOCAL ROLE` is transaction-scoped, so a transaction both pins one
   * pooled client and guarantees the role resets afterwards. Outside a
   * transaction this provider takes a fresh client per query and the role
   * would silently not apply — the test would measure nothing.
   */
  /**
   * Own schema, not `public`: other Postgres suites run in parallel workers
   * against the same database, and `GRANT ... ON ALL TABLES IN SCHEMA public`
   * racing another suite's `DROP TABLE` in `public` fails both with
   * "tuple concurrently updated". A schema per suite ends the contention.
   */
  const SCHEMA_NAME = "zam_rls";

  async function withSession<T>(
    fn: (tx: Awaited<ReturnType<typeof openPostgresDatabase>>) => Promise<T>,
  ): Promise<T> {
    const db = openPostgresDatabase({
      connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${SCHEMA_NAME}`,
    });
    try {
      return await db.transaction(async (tx) => fn(tx));
    } finally {
      await db.close();
    }
  }

  /** Fresh schema + deployment SQL + two mapped learner roles. */
  async function seed(
    tx: Awaited<ReturnType<typeof openPostgresDatabase>>,
  ): Promise<void> {
    await tx.exec(`
      DROP SCHEMA IF EXISTS ${SCHEMA_NAME} CASCADE;
      CREATE SCHEMA ${SCHEMA_NAME};
    `);
    await tx.exec(SCHEMA);
    await tx.exec(DEPLOYMENT_RLS_SQL);

    for (const role of ["alice_role", "bob_role", "unmapped_role"]) {
      await tx.exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
            CREATE ROLE ${role} NOSUPERUSER NOBYPASSRLS;
          END IF;
        END
        $$;
      `);
      await tx.exec(grantsForLearnerRoleSql(role, SCHEMA_NAME));
    }

    // Only alice and bob are mapped; unmapped_role deliberately is not.
    await tx
      .prepare(
        `INSERT INTO learner_principals (zam_user_id, db_role, entra_upn)
         VALUES (?, 'alice_role', 'alice@example.org'),
                (?, 'bob_role', 'bob@example.org')`,
      )
      .run(ALICE, BOB);

    await tx
      .prepare(
        `INSERT INTO tokens (id, slug, concept, editorial_state)
         VALUES ('tok1', 'token-1', 'Concept 1', 'published')`,
      )
      .run();
  }

  const asRole = (
    tx: Awaited<ReturnType<typeof openPostgresDatabase>>,
    role: string,
  ) => tx.exec(`SET LOCAL ROLE ${role}`);

  it("resolves the learner from the connected role, with no variable to set", async () => {
    await withSession(async (tx) => {
      await seed(tx);

      await asRole(tx, "alice_role");
      let who = (await tx
        .prepare("SELECT current_user AS role, current_learner_id() AS learner")
        .get()) as { role: string; learner: string | null };
      expect(who.role).toBe("alice_role");
      expect(who.learner).toBe(ALICE);

      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "bob_role");
      who = (await tx
        .prepare("SELECT current_user AS role, current_learner_id() AS learner")
        .get()) as { role: string; learner: string | null };
      expect(who.role).toBe("bob_role");
      expect(who.learner).toBe(BOB);
    });
  });

  it("keeps one learner's cards and review logs from another", async () => {
    await withSession(async (tx) => {
      await seed(tx);
      await asRole(tx, "alice_role");

      // Guard the guard: a superuser or BYPASSRLS role ignores policies, which
      // would make every assertion below pass regardless of the policies.
      const guard = (await tx
        .prepare(
          `SELECT current_user AS role,
                  (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass`,
        )
        .get()) as { role: string; bypass: boolean };
      expect(guard.role).toBe("alice_role");
      expect(guard.bypass).toBe(false);

      await tx
        .prepare(
          `INSERT INTO cards (id, token_id, user_id, due_at)
           VALUES ('card_alice', 'tok1', ?, CURRENT_TIMESTAMP)`,
        )
        .run(ALICE);
      await tx
        .prepare(
          `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, scheduled_at)
           VALUES ('log_alice', 'card_alice', 'tok1', ?, 1, CURRENT_TIMESTAMP)`,
        )
        .run(ALICE);

      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(1);
      expect(await tx.prepare("SELECT * FROM review_logs").all()).toHaveLength(
        1,
      );

      await tx
        .prepare(
          `INSERT INTO card_presentations (
             id, user_id, card_id, token_id, learning_day, time_zone,
             reserved_at, created_at
           ) VALUES (
             'pres_alice', ?, 'card_alice', 'tok1', '2026-09-07', 'UTC',
             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
           )`,
        )
        .run(ALICE);
      await tx
        .prepare(
          `INSERT INTO review_attempts (
             id, user_id, token_id, actor, channel, status
           ) VALUES ('att_alice', ?, 'tok1', 'user', 'direct', 'rated')`,
        )
        .run(ALICE);
      await tx
        .prepare(
          `INSERT INTO user_settings (user_id, machine_id, key, value, updated_at)
           VALUES (?, '', 'system.locale', 'de', '2026-09-19T00:00:00.000Z')`,
        )
        .run(ALICE);

      // ── Bob sees and touches none of it ───────────────────────────────
      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "bob_role");

      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(0);
      expect(
        await tx.prepare("SELECT * FROM user_settings").all(),
      ).toHaveLength(0);
      await tx.exec("SAVEPOINT forge_setting");
      await expect(
        tx
          .prepare(
            `INSERT INTO user_settings (user_id, machine_id, key, value, updated_at)
             VALUES (?, '', 'system.locale', 'fr', '2026-09-19T00:00:00.000Z')`,
          )
          .run(ALICE),
      ).rejects.toThrow(/row-level security/i);
      await tx.exec("ROLLBACK TO SAVEPOINT forge_setting");
      expect(await tx.prepare("SELECT * FROM review_logs").all()).toHaveLength(
        0,
      );
      expect(
        await tx.prepare("SELECT * FROM card_presentations").all(),
      ).toHaveLength(0);
      expect(
        await tx.prepare("SELECT * FROM review_attempts").all(),
      ).toHaveLength(0);
      expect(
        await tx.prepare("SELECT * FROM cards WHERE id = 'card_alice'").get(),
      ).toBeUndefined();

      expect(
        (
          await tx
            .prepare("UPDATE cards SET blocked = 1 WHERE id = 'card_alice'")
            .run()
        ).changes,
      ).toBe(0);
      expect(
        (await tx.prepare("DELETE FROM cards WHERE id = 'card_alice'").run())
          .changes,
      ).toBe(0);

      // Forging a row in Alice's name is the WITH CHECK half, which a
      // USING-only policy would silently allow. A rejected statement aborts
      // the transaction (25P02), so scope it to a savepoint.
      await tx.exec("SAVEPOINT forge");
      await expect(
        tx
          .prepare(
            `INSERT INTO cards (id, token_id, user_id, due_at)
             VALUES ('card_forged', 'tok1', ?, CURRENT_TIMESTAMP)`,
          )
          .run(ALICE),
      ).rejects.toThrow(/row-level security/i);
      await tx.exec("ROLLBACK TO SAVEPOINT forge");

      // ── Alice still has exactly what she wrote ────────────────────────
      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "alice_role");
      const cards = (await tx.prepare("SELECT * FROM cards").all()) as Array<{
        id: string;
        blocked: number;
      }>;
      expect(cards).toHaveLength(1);
      expect(cards[0].id).toBe("card_alice");
      expect(Number(cards[0].blocked)).toBe(0);
      expect(
        await tx.prepare("SELECT * FROM card_presentations").all(),
      ).toHaveLength(1);
      expect(
        await tx.prepare("SELECT * FROM review_attempts").all(),
      ).toHaveLength(1);
      expect(
        await tx.prepare("SELECT * FROM user_settings").all(),
      ).toHaveLength(1);
    });
  });

  it("shows an unmapped role nothing at all", async () => {
    // A role with no principal mapping must fail closed, not open — this is
    // what makes a forgotten mapping a lockout rather than a data leak.
    await withSession(async (tx) => {
      await seed(tx);
      await asRole(tx, "alice_role");
      await tx
        .prepare(
          `INSERT INTO cards (id, token_id, user_id, due_at)
           VALUES ('card_alice', 'tok1', ?, CURRENT_TIMESTAMP)`,
        )
        .run(ALICE);

      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "unmapped_role");
      const learner = (await tx
        .prepare("SELECT current_learner_id() AS learner")
        .get()) as { learner: string | null };
      expect(learner.learner).toBeNull();
      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(0);
    });
  });

  it("lets the assignee see an assignment but never take it over", async () => {
    // ADR 2026-07-04 Decision 10: visible to both, owned by the assigner. A
    // single FOR ALL policy with the wider USING would let Bob delete the
    // row (DELETE checks USING only) or rewrite assigner_id to himself.
    await withSession(async (tx) => {
      await seed(tx);
      await asRole(tx, "alice_role");
      await tx
        .prepare(
          `INSERT INTO assignments (id, token_id, assigner_id, assignee_id)
           VALUES ('asg1', 'tok1', ?, ?)`,
        )
        .run(ALICE, BOB);

      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "bob_role");
      expect(await tx.prepare("SELECT id FROM assignments").all()).toEqual([
        { id: "asg1" },
      ]);
      const attempts = [
        "UPDATE assignments SET withdrawn_at = '2026-01-01T00:00:00.000Z' WHERE id = 'asg1'",
        `UPDATE assignments SET assigner_id = '${BOB}' WHERE id = 'asg1'`,
        "DELETE FROM assignments WHERE id = 'asg1'",
      ];
      for (const sql of attempts) {
        expect((await tx.prepare(sql).run()).changes, sql).toBe(0);
      }
      await tx.exec("SAVEPOINT forge");
      await expect(
        tx
          .prepare(
            `INSERT INTO assignments (id, token_id, assigner_id, assignee_id)
             VALUES ('forged', 'tok1', ?, ?)`,
          )
          .run(ALICE, BOB),
      ).rejects.toThrow(/row-level security/i);
      await tx.exec("ROLLBACK TO SAVEPOINT forge");
      // Bob may assign in his own name; a third party sees neither.
      await tx
        .prepare(
          `INSERT INTO assignments (id, token_id, assigner_id, assignee_id)
           VALUES ('asg2', 'tok1', ?, ?)`,
        )
        .run(BOB, ALICE);

      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "unmapped_role");
      expect(await tx.prepare("SELECT id FROM assignments").all()).toHaveLength(
        0,
      );

      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "alice_role");
      expect(
        (
          await tx
            .prepare(
              "UPDATE assignments SET withdrawn_at = '2026-01-01T00:00:00.000Z' WHERE id = 'asg1'",
            )
            .run()
        ).changes,
      ).toBe(1);
      expect(
        (await tx.prepare("SELECT id FROM assignments ORDER BY id").all()).map(
          (row) => (row as { id: string }).id,
        ),
      ).toEqual(["asg1", "asg2"]);
    });
  });

  it("protects every learning-state table the deployment lists", async () => {
    // Guards against a table being added to the schema and forgotten here.
    await withSession(async (tx) => {
      await seed(tx);
      for (const table of RLS_PROTECTED_TABLES) {
        const row = (await tx
          .prepare(
            // Schema-qualified: another schema in the same database holding
            // a table of the same name would otherwise answer for it, and the
            // suite would report on the wrong `cards`.
            `SELECT c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced
               FROM pg_class c
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE c.relname = ? AND n.nspname = current_schema()`,
          )
          .get(table)) as { enabled: boolean; forced: boolean } | undefined;
        expect(row, `${table} missing`).toBeDefined();
        expect(row?.enabled, `${table} RLS not enabled`).toBe(true);
        expect(row?.forced, `${table} RLS not FORCEd`).toBe(true);
      }
    });
  });
});
