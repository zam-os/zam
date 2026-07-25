import { describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { SCHEMA } from "../../src/kernel/db/schema.ts";

export const RLS_POLICIES_SQL = `
-- Enable and FORCE Row Level Security on learning state tables (ADR 2026-07-04 Decision 6)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_cards_policy ON cards;
CREATE POLICY learner_cards_policy ON cards FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_review_logs_policy ON review_logs;
CREATE POLICY learner_review_logs_policy ON review_logs FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_sessions_policy ON sessions;
CREATE POLICY learner_sessions_policy ON sessions FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_steps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_session_steps_policy ON session_steps;
CREATE POLICY learner_session_steps_policy ON session_steps FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE user_id = current_setting('app.current_user_id', true)))
  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE user_id = current_setting('app.current_user_id', true)));
`;

describe("PostgreSQL Row Level Security (RLS) Isolation Suite", () => {
  it("defines load-bearing RLS policies for cards, review_logs, sessions, and session_steps", () => {
    expect(RLS_POLICIES_SQL).toContain("FORCE ROW LEVEL SECURITY");
    expect(RLS_POLICIES_SQL).toContain("learner_cards_policy");
    expect(RLS_POLICIES_SQL).toContain("learner_review_logs_policy");
    expect(RLS_POLICIES_SQL).toContain("learner_sessions_policy");
    expect(RLS_POLICIES_SQL).toContain("learner_session_steps_policy");
  });

  if (process.env.POSTGRES_URL) {
    it("strictly isolates learner A from learner B's cards and review logs", async () => {
      const db = openPostgresDatabase({
        connectionString: process.env.POSTGRES_URL,
      });

      try {
        await db.exec(`
          DROP TABLE IF EXISTS session_steps CASCADE;
          DROP TABLE IF EXISTS sessions CASCADE;
          DROP TABLE IF EXISTS review_logs CASCADE;
          DROP TABLE IF EXISTS cards CASCADE;
          DROP TABLE IF EXISTS assignments CASCADE;
          DROP TABLE IF EXISTS prerequisites CASCADE;
          DROP TABLE IF EXISTS tokens CASCADE;
        `);

        await db.exec(SCHEMA);
        await db.exec(RLS_POLICIES_SQL);

        // Seed a shared published token
        await db
          .prepare(
            `INSERT INTO tokens (id, slug, concept, editorial_state) VALUES ('tok1', 'token-1', 'Concept 1', 'published')`,
          )
          .run();

        // 1. Learner A inserts card and review log under app.current_user_id = 'alice'
        await db.exec("SET app.current_user_id = 'alice'");
        await db
          .prepare(
            `INSERT INTO cards (id, token_id, user_id, due_at) VALUES ('card_alice', 'tok1', 'alice', CURRENT_TIMESTAMP)`,
          )
          .run();
        await db
          .prepare(
            `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, scheduled_at) VALUES ('log_alice', 'card_alice', 'tok1', 'alice', 3, CURRENT_TIMESTAMP)`,
          )
          .run();

        // Verify Alice sees her card and log
        const aliceCards = (await db
          .prepare("SELECT * FROM cards")
          .all()) as Array<{ id: string }>;
        expect(aliceCards).toHaveLength(1);
        expect(aliceCards[0].id).toBe("card_alice");

        const aliceLogs = (await db
          .prepare("SELECT * FROM review_logs")
          .all()) as Array<{ id: string }>;
        expect(aliceLogs).toHaveLength(1);
        expect(aliceLogs[0].id).toBe("log_alice");

        // 2. Switch context to Learner B (Bob) under app.current_user_id = 'bob'
        await db.exec("SET app.current_user_id = 'bob'");

        // Bob queries cards and review logs -> gets 0 rows
        const bobCards = await db.prepare("SELECT * FROM cards").all();
        expect(bobCards).toHaveLength(0);

        const bobLogs = await db.prepare("SELECT * FROM review_logs").all();
        expect(bobLogs).toHaveLength(0);

        // Bob attempts to read Alice's card directly -> gets undefined
        const aliceCardSeenByBob = await db
          .prepare("SELECT * FROM cards WHERE id = 'card_alice'")
          .get();
        expect(aliceCardSeenByBob).toBeUndefined();

        // Bob attempts to update Alice's card -> 0 changes
        const updateRes = await db
          .prepare("UPDATE cards SET stability = 10.0 WHERE id = 'card_alice'")
          .run();
        expect(updateRes.changes).toBe(0);

        // Bob attempts to delete Alice's card -> 0 changes
        const deleteRes = await db
          .prepare("DELETE FROM cards WHERE id = 'card_alice'")
          .run();
        expect(deleteRes.changes).toBe(0);
      } finally {
        await db.close();
      }
    });
  }
});
