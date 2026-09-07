/**
 * Row-level security for the shared PostgreSQL deployment
 * (ADR 2026-07-04 Decisions 6 and 7, "Deployment B").
 *
 * These are the **load-bearing privacy boundary**: in Deployment B a learner's
 * cards, review logs and sessions sit in the same database as everyone else's,
 * and only RLS keeps them apart. They therefore live in shipped code and are
 * applied by an admin step — not in a test fixture, where a policy nobody
 * deploys proves nothing.
 *
 * Deliberately in the CLI layer, not the kernel: ADR Decision 8 keeps the
 * kernel free of RLS, auth and HTTP, and the mapping table below is
 * deployment-scoped — it has no meaning for local SQLite or Turso.
 *
 * ## The identity is the connection (project owner, 2026-07-25)
 *
 * Policies resolve the learner from **`current_user`**, the PostgreSQL role,
 * rather than from a session variable the application must remember to set.
 *
 * That is exactly what Entra already gives this deployment: an administrator
 * maps Entra identities to database roles, and each colleague connects *as
 * themselves* with their own token. The connection is the person. Nothing has
 * to be set per request, so nothing can be forgotten per request — and the
 * pooling hazard disappears, because a pooled connection cannot carry the
 * wrong learner when the learner *is* the connection.
 *
 * The alternative — `current_setting('app.current_user_id')` set per
 * transaction — is the right pattern when one service account multiplexes many
 * users, which is a web-server architecture ZAM does not have. It was
 * considered and rejected: it makes correctness depend on every call site
 * remembering a `SET LOCAL`, and a forgotten one fails *open* if the
 * connection happens to carry a previous learner's value.
 *
 * ## Two properties that are easy to lose and invisible when lost
 *
 * - **`FORCE ROW LEVEL SECURITY`**, not merely `ENABLE`. Without FORCE the
 *   table *owner* silently bypasses its own policies, and the schema owner is
 *   exactly who the application connects as if nobody separated the roles.
 * - **A non-superuser role.** Superusers and `BYPASSRLS` roles ignore policies
 *   entirely; granting the application a superuser is indistinguishable from
 *   having no policies at all.
 *
 * Neither is detectable from application behaviour — everything keeps working,
 * it just stops isolating. That is why `tests/kernel/postgres-rls.test.ts`
 * asserts against a real database and checks its own premise first.
 */

/**
 * Maps a ZAM learner (ULID) to the database role they connect as.
 *
 * ADR Decision 7: Entra identifiers never become keys in ZAM's data. The
 * object id and UPN are recorded here for administration and nowhere else;
 * every other table references the ULID only. A tenant change, an account
 * recreation or a move to self-hosting rewrites this one table.
 *
 * Deployment-scoped: created by this module, never by the kernel schema.
 */
export const LEARNER_PRINCIPALS_DDL = `
CREATE TABLE IF NOT EXISTS learner_principals (
  zam_user_id      TEXT PRIMARY KEY,
  db_role          TEXT NOT NULL UNIQUE,
  entra_object_id  TEXT,
  entra_upn        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/**
 * Resolve the connected role to a ZAM learner id.
 *
 * `STABLE` so the planner may fold it once per query instead of per row.
 * Returns NULL for a role with no mapping, and `user_id = NULL` is never
 * true — an unmapped connection therefore sees nothing rather than
 * everything. Failing closed is the whole point.
 *
 * SECURITY INVOKER (the default) plus a SELECT grant, rather than SECURITY
 * DEFINER: the mapping is not secret — it says which colleague is which id,
 * not what anyone has learned — and avoiding DEFINER avoids its search_path
 * sharp edges entirely.
 */
export const CURRENT_LEARNER_FN_SQL = `
CREATE OR REPLACE FUNCTION current_learner_id() RETURNS TEXT
  LANGUAGE sql
  STABLE
AS $$
  SELECT zam_user_id FROM learner_principals WHERE db_role = current_user
$$;
`;

/**
 * Policies for every learning-state table. Idempotent, so this is usable as a
 * repeatable deployment step rather than a one-shot.
 *
 * Knowledge tables (tokens, prerequisites, sources, embeddings) deliberately
 * carry no policy — the library is shared by design; only *learning state* is
 * private (ADR data-class table).
 */
export const RLS_POLICIES_SQL = `
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_cards_policy ON cards;
CREATE POLICY learner_cards_policy ON cards FOR ALL
  USING (user_id = current_learner_id())
  WITH CHECK (user_id = current_learner_id());

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_review_logs_policy ON review_logs;
CREATE POLICY learner_review_logs_policy ON review_logs FOR ALL
  USING (user_id = current_learner_id())
  WITH CHECK (user_id = current_learner_id());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_sessions_policy ON sessions;
CREATE POLICY learner_sessions_policy ON sessions FOR ALL
  USING (user_id = current_learner_id())
  WITH CHECK (user_id = current_learner_id());

-- session_steps carries no user_id of its own; it inherits its owner's
-- identity through the session it belongs to.
ALTER TABLE session_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_steps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_session_steps_policy ON session_steps;
CREATE POLICY learner_session_steps_policy ON session_steps FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = current_learner_id()))
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE user_id = current_learner_id()));

ALTER TABLE card_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_presentations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_card_presentations_policy ON card_presentations;
CREATE POLICY learner_card_presentations_policy ON card_presentations FOR ALL
  USING (user_id = current_learner_id())
  WITH CHECK (user_id = current_learner_id());

ALTER TABLE review_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_review_attempts_policy ON review_attempts;
CREATE POLICY learner_review_attempts_policy ON review_attempts FOR ALL
  USING (user_id = current_learner_id())
  WITH CHECK (user_id = current_learner_id());

-- session_syntheses carries no user_id; it inherits through the session.
ALTER TABLE session_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_syntheses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learner_session_syntheses_policy ON session_syntheses;
CREATE POLICY learner_session_syntheses_policy ON session_syntheses FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = current_learner_id()))
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE user_id = current_learner_id()));
`;

/**
 * Everything a deployment must apply, in order, after the kernel schema.
 * Idempotent end to end.
 */
export const DEPLOYMENT_RLS_SQL = [
  LEARNER_PRINCIPALS_DDL,
  CURRENT_LEARNER_FN_SQL,
  RLS_POLICIES_SQL,
].join("\n");

/** Tables the policies above cover — asserted by the test, listed in the runbook. */
export const RLS_PROTECTED_TABLES = [
  "cards",
  "review_logs",
  "sessions",
  "session_steps",
  "card_presentations",
  "review_attempts",
  "session_syntheses",
] as const;

/**
 * Grants a learner role needs. Read on the mapping table so
 * `current_learner_id()` resolves; RLS then decides which rows they see.
 */
export function grantsForLearnerRoleSql(role: string): string {
  return `
GRANT USAGE ON SCHEMA public TO ${role};
GRANT SELECT ON learner_principals TO ${role};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role};
GRANT EXECUTE ON FUNCTION current_learner_id() TO ${role};
`;
}
