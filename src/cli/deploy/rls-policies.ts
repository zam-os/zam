/**
 * Row-level security policies for the shared PostgreSQL deployment
 * (ADR 2026-07-04 Decision 6, "Deployment B").
 *
 * These are the **load-bearing privacy boundary**: in Deployment B a learner's
 * cards, review logs and sessions sit in the same database as everyone else's,
 * and only RLS keeps them apart. They therefore live in shipped code and are
 * applied by an admin command — not in a test fixture, where a policy nobody
 * deploys proves nothing.
 *
 * Deliberately in the CLI layer, not the kernel: ADR Decision 8 keeps the
 * kernel free of RLS, auth and HTTP. The kernel's only multi-user awareness
 * stays its `user_id` columns.
 *
 * Two properties are non-negotiable and easy to lose:
 *
 * - **`FORCE ROW LEVEL SECURITY`**, not just `ENABLE`. Without FORCE the table
 *   *owner* bypasses its own policies silently, and the schema owner is
 *   exactly who the application connects as if nobody separated the roles.
 * - **A non-superuser role.** PostgreSQL superusers and roles with `BYPASSRLS`
 *   ignore policies entirely. Granting the application a superuser is
 *   indistinguishable from having no policies at all.
 *
 * Neither is detectable from application behaviour — everything keeps working,
 * it just stops isolating. That is why `tests/kernel/postgres-rls.test.ts`
 * asserts against a real database rather than against this string.
 */

/**
 * The session variable each connection must carry for the policies to resolve.
 * See {@link SET_CURRENT_LEARNER_SQL} — and note the open design question in
 * ADR Phase C: with a connection pool this has to be re-applied per
 * transaction, because it is session state, not connection-independent.
 */
export const CURRENT_LEARNER_SETTING = "app.current_user_id";

/** Statement that binds a connection (or transaction) to one learner. */
export function setCurrentLearnerSql(local = true): string {
  return `SELECT set_config('${CURRENT_LEARNER_SETTING}', $1, ${local})`;
}

/**
 * Policies for every learning-state table. Idempotent: safe to re-run, which
 * is what makes it usable as a deployment step rather than a one-shot.
 *
 * Knowledge tables (tokens, prerequisites, sources, embeddings) deliberately
 * carry no policy — the library is shared by design; only *learning state* is
 * private (ADR data-class table).
 */
export const RLS_POLICIES_SQL = `
-- Learning state is private to the learner (ADR 2026-07-04 Decision 6).
-- FORCE, so the table owner is subject to its own policies too.

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_cards_policy ON cards;
CREATE POLICY learner_cards_policy ON cards FOR ALL
  USING (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true))
  WITH CHECK (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true));

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_review_logs_policy ON review_logs;
CREATE POLICY learner_review_logs_policy ON review_logs FOR ALL
  USING (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true))
  WITH CHECK (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true));

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_sessions_policy ON sessions;
CREATE POLICY learner_sessions_policy ON sessions FOR ALL
  USING (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true))
  WITH CHECK (user_id = current_setting('${CURRENT_LEARNER_SETTING}', true));

-- session_steps has no user_id of its own; it inherits its owner's identity
-- through the session it belongs to.
ALTER TABLE session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_steps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_session_steps_policy ON session_steps;
CREATE POLICY learner_session_steps_policy ON session_steps FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions
     WHERE user_id = current_setting('${CURRENT_LEARNER_SETTING}', true)))
  WITH CHECK (session_id IN (
    SELECT id FROM sessions
     WHERE user_id = current_setting('${CURRENT_LEARNER_SETTING}', true)));
`;

/** Tables the policies above cover — used by tests and the admin runbook. */
export const RLS_PROTECTED_TABLES = [
  "cards",
  "review_logs",
  "sessions",
  "session_steps",
] as const;
