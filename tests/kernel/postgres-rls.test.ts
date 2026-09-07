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
 * CI always runs it (`postgres:17-alpine`; 17 because Entra auth is broken
 * on 18).
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
  async function withSession<T>(
    fn: (tx: Awaited<ReturnType<typeof openPostgresDatabase>>) => Promise<T>,
  ): Promise<T> {
    const db = openPostgresDatabase({ connectionString: POSTGRES_URL });
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
      DROP TABLE IF EXISTS session_syntheses CASCADE;
      DROP TABLE IF EXISTS review_attempts CASCADE;
      DROP TABLE IF EXISTS card_presentations CASCADE;
      DROP TABLE IF EXISTS session_steps CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS review_logs CASCADE;
      DROP TABLE IF EXISTS cards CASCADE;
      DROP TABLE IF EXISTS assignments CASCADE;
      DROP TABLE IF EXISTS prerequisites CASCADE;
      DROP TABLE IF EXISTS tokens CASCADE;
      DROP TABLE IF EXISTS learner_principals CASCADE;
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
      await tx.exec(grantsForLearnerRoleSql(role));
    }

    // Only alice and bob are mapped; unmapped_role deliberately is not.
    await tx
      .prepare(
        `INSERT INTO learner_principals (zam_user_id, db_role, entra_upn)
         VALUES (?, 'alice_role', 'alice@docuware.com'),
                (?, 'bob_role', 'bob@docuware.com')`,
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

      // ── Bob sees and touches none of it ───────────────────────────────
      await tx.exec("SET LOCAL ROLE NONE");
      await asRole(tx, "bob_role");

      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(0);
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
