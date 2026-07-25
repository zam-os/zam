import { describe, expect, it } from "vitest";
import {
  RLS_POLICIES_SQL,
  RLS_PROTECTED_TABLES,
} from "../../src/cli/deploy/rls-policies.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { SCHEMA } from "../../src/kernel/db/schema.js";

/**
 * RLS is the load-bearing privacy boundary of Deployment B (ADR 2026-07-04
 * Decision 6): in the shared database, only these policies keep one
 * colleague's review logs away from another's. A privacy boundary nobody
 * tests is a claim, not a boundary — so this exercises a **real** PostgreSQL
 * and the **shipped** policies (`src/cli/deploy/rls-policies.ts`), never a
 * copy pasted into the test.
 *
 * Set `POSTGRES_URL` to run it. CI always does (see `.github/workflows/ci.yml`,
 * `postgres:17-alpine` — 17 because Entra auth is broken on 18).
 */
const POSTGRES_URL = process.env.POSTGRES_URL;

// A skipped security test that still reports "passed" is how a boundary
// quietly stops being tested. Make the skip visible in the report instead.
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

describeWithPostgres("PostgreSQL RLS isolation (needs POSTGRES_URL)", () => {
  /**
   * Everything runs inside one `transaction()` on purpose. `SET ROLE` and
   * `set_config(...)` are **session** state, and outside a transaction this
   * provider issues each query through the pool, which may hand back a
   * different connection — the role and the current learner would silently
   * not apply, and the test would be measuring nothing. A transaction pins
   * one client for the whole scenario.
   */
  async function withPinnedSession<T>(
    fn: (tx: Awaited<ReturnType<typeof openPostgresDatabase>>) => Promise<T>,
  ): Promise<T> {
    const db = openPostgresDatabase({ connectionString: POSTGRES_URL });
    try {
      return await db.transaction(async (tx) => fn(tx));
    } finally {
      await db.close();
    }
  }

  async function setLearner(
    tx: Awaited<ReturnType<typeof openPostgresDatabase>>,
    userId: string,
  ): Promise<void> {
    await tx.exec(`SET LOCAL "app.current_user_id" = '${userId}'`);
  }

  it("keeps one learner's cards and review logs from another", async () => {
    await withPinnedSession(async (tx) => {
      await tx.exec(`
        DROP TABLE IF EXISTS session_steps CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        DROP TABLE IF EXISTS review_logs CASCADE;
        DROP TABLE IF EXISTS cards CASCADE;
        DROP TABLE IF EXISTS assignments CASCADE;
        DROP TABLE IF EXISTS prerequisites CASCADE;
        DROP TABLE IF EXISTS tokens CASCADE;
      `);
      await tx.exec(SCHEMA);
      await tx.exec(RLS_POLICIES_SQL);

      // Superusers and BYPASSRLS roles ignore policies entirely, so testing as
      // the owner would pass no matter what the policies said.
      await tx.exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'learner_role') THEN
            CREATE ROLE learner_role NOSUPERUSER NOBYPASSRLS;
          END IF;
        END
        $$;
        GRANT ALL ON SCHEMA public TO learner_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO learner_role;
        SET LOCAL ROLE learner_role;
      `);

      // Guard the guard: if this role could bypass RLS the rest is theatre.
      const who = (await tx
        .prepare(
          `SELECT current_user AS role,
                  (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass`,
        )
        .get()) as { role: string; bypass: boolean };
      expect(who.role).toBe("learner_role");
      expect(who.bypass).toBe(false);

      await tx
        .prepare(
          `INSERT INTO tokens (id, slug, concept, editorial_state)
           VALUES ('tok1', 'token-1', 'Concept 1', 'published')`,
        )
        .run();

      // ── Alice writes ──────────────────────────────────────────────────
      await setLearner(tx, "alice");
      await tx
        .prepare(
          `INSERT INTO cards (id, token_id, user_id, due_at)
           VALUES ('card_alice', 'tok1', 'alice', CURRENT_TIMESTAMP)`,
        )
        .run();
      await tx
        .prepare(
          `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, scheduled_at)
           VALUES ('log_alice', 'card_alice', 'tok1', 'alice', 1, CURRENT_TIMESTAMP)`,
        )
        .run();

      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(1);
      expect(await tx.prepare("SELECT * FROM review_logs").all()).toHaveLength(
        1,
      );

      // ── Bob must see and touch none of it ─────────────────────────────
      await setLearner(tx, "bob");

      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(0);
      expect(await tx.prepare("SELECT * FROM review_logs").all()).toHaveLength(
        0,
      );
      expect(
        await tx.prepare("SELECT * FROM cards WHERE id = 'card_alice'").get(),
      ).toBeUndefined();

      const updated = await tx
        .prepare("UPDATE cards SET blocked = 1 WHERE id = 'card_alice'")
        .run();
      expect(updated.changes).toBe(0);

      const deleted = await tx
        .prepare("DELETE FROM cards WHERE id = 'card_alice'")
        .run();
      expect(deleted.changes).toBe(0);

      // Bob cannot forge a row in Alice's name either — that is the WITH
      // CHECK half, which a USING-only policy would silently allow.
      await expect(
        tx
          .prepare(
            `INSERT INTO cards (id, token_id, user_id, due_at)
             VALUES ('card_forged', 'tok1', 'alice', CURRENT_TIMESTAMP)`,
          )
          .run(),
      ).rejects.toThrow(/row-level security/i);

      // ── Alice still has exactly what she wrote ────────────────────────
      await setLearner(tx, "alice");
      const aliceCards = (await tx.prepare("SELECT * FROM cards").all()) as
        Array<{ id: string; blocked: number }>;
      expect(aliceCards).toHaveLength(1);
      expect(aliceCards[0].id).toBe("card_alice");
      expect(Number(aliceCards[0].blocked)).toBe(0);
    });
  });

  it("leaves an unset learner with no learning state at all", async () => {
    // A connection that forgot to bind a learner must fail closed, not open.
    await withPinnedSession(async (tx) => {
      await tx.exec(`
        DROP TABLE IF EXISTS session_steps CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        DROP TABLE IF EXISTS review_logs CASCADE;
        DROP TABLE IF EXISTS cards CASCADE;
        DROP TABLE IF EXISTS assignments CASCADE;
        DROP TABLE IF EXISTS prerequisites CASCADE;
        DROP TABLE IF EXISTS tokens CASCADE;
      `);
      await tx.exec(SCHEMA);
      await tx.exec(RLS_POLICIES_SQL);
      await tx.exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'learner_role') THEN
            CREATE ROLE learner_role NOSUPERUSER NOBYPASSRLS;
          END IF;
        END
        $$;
        GRANT ALL ON SCHEMA public TO learner_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO learner_role;
      `);
      await tx
        .prepare(
          `INSERT INTO tokens (id, slug, concept) VALUES ('tok1', 'token-1', 'C')`,
        )
        .run();
      await setLearner(tx, "alice");
      await tx
        .prepare(
          `INSERT INTO cards (id, token_id, user_id, due_at)
           VALUES ('card_alice', 'tok1', 'alice', CURRENT_TIMESTAMP)`,
        )
        .run();

      await tx.exec("SET LOCAL ROLE learner_role");
      await tx.exec(`RESET "app.current_user_id"`);
      expect(await tx.prepare("SELECT * FROM cards").all()).toHaveLength(0);
    });
  });

  it("protects every learning-state table the deployment lists", async () => {
    // Guards against a table being added to the schema and forgotten here.
    await withPinnedSession(async (tx) => {
      await tx.exec(SCHEMA);
      await tx.exec(RLS_POLICIES_SQL);
      for (const table of RLS_PROTECTED_TABLES) {
        const row = (await tx
          .prepare(
            `SELECT relrowsecurity AS enabled, relforcerowsecurity AS forced
               FROM pg_class WHERE relname = ?`,
          )
          .get(table)) as { enabled: boolean; forced: boolean } | undefined;
        expect(row, `${table} missing`).toBeDefined();
        expect(row?.enabled, `${table} RLS not enabled`).toBe(true);
        expect(row?.forced, `${table} RLS not FORCEd`).toBe(true);
      }
    });
  });
});
