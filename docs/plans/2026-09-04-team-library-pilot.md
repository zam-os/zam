# Team Learning Library Pilot — PostgreSQL, Entra, derived identity

Implements [ADR 2026-09-04](../adr/2026-09-04-team-library-postgres-entra-pilot.md).
Read [AGENTS.md](../../AGENTS.md) first. Work exactly the next unchecked phase;
one branch, one PR, one focused commit per phase. Nothing here creates a cloud
resource before Phase 8.

**Status:**

- [x] Phase 0 — ADR proposed; company specifics removed from the repository
- [ ] Phase 1 — Dialect foundation: ISO timestamps, `dialect`, Postgres in the model-test matrix
- [ ] Phase 2 — `postgres` provider wired in; `native` and the embedded replica retired
- [ ] Phase 3 — Derived identity and team mode
- [ ] Phase 4 — Settings scopes: `user_settings`, machine id
- [ ] Phase 5 — RLS completion, group roles, schema-derived coverage test
- [ ] Phase 6 — `zam team` administration commands and the generic runbook
- [ ] Phase 7 — Desktop "Connect to team library", disclosure, `zam doctor`
- [ ] Phase 8 — Server creation, `zam_test` pilot with two or three colleagues, then `zam_prod`
- [ ] Final check — every ADR decision mapped to a shipped phase (table at the end)

## Ground rules for every phase

- Kernel stays free of auth, RLS, HTTP and process spawning. The `az` call
  lives under `src/cli/`; the provider under `src/kernel/db/` receives a
  password-supplier function.
- Schema changes go in both `src/kernel/db/schema.ts` and an idempotent
  M-series migration, with `CURRENT_SCHEMA_VERSION` bumped.
- No new dependency. `pg` is already an optional dependency; nothing else is
  added.
- Run before hand-off: `npm run format && npm run lint && npm run typecheck && npm run test && npm run build`,
  plus `npm run pg:up && npm run pg:test` for anything touching Postgres.
- Update the covering OKF article through `zam_okf_upsert` in the same commit
  when a phase changes described behaviour.

## Phase 1 — Dialect foundation

Deployment-independent; pays off on SQLite too (the `dueToday` miscount).

- Add `dialect: "sqlite" | "postgres"` to the `Database` contract; every
  provider sets it, `createPersistentDatabaseHost` forwards it.
- A small `src/kernel/db/sql.ts` with the few provider-neutral helpers the
  kernel needs: `nowIso()`, `dateBucketExpr(dialect, period)`,
  `caseInsensitiveLike(column)`.
- Replace every `datetime('now')` / `date('now', …)` used in a comparison or
  insert with a JavaScript ISO timestamp passed as a parameter
  (`stats.ts`, `progress.ts`, `settings.ts`, `revision.ts`, `kvt-attach.ts`).
  Schema defaults stay; the Postgres DDL translation maps them to an
  expression producing the same ISO text.
- Normalise the `LIKE` sites in `token.ts` to `lower(...) LIKE lower(?)` or
  equality where the pattern was a literal.
- Provider matrix: a `describeWithProviders` helper that runs a suite against
  local SQLite and, when `POSTGRES_URL` is set, a schema-isolated Postgres
  database (reuse the `freshSchema` pattern from `postgres-provision.test.ts`).
  Wrap `fsrs`, `queue`, `card-detach`, `library-revision`, `progress`,
  `assignment` and `token-embeddings` suites with it.

- Move the CI service container and `scripts/pg-dev.mjs` to
  `postgres:18-alpine`, and drop the "17 because Entra is broken on 18" notes
  in `pg-dev.mjs` and `postgres-rls.test.ts` — the ADR decides 18.

Acceptance: the wrapped suites are green on both legs in CI against
PostgreSQL 18; a grep for `datetime('now')` outside `schema.ts`/`provision.ts`
finds nothing; the `dueToday` count agrees with the queue on a card due
earlier today.

## Phase 2 — `postgres` provider wired in; `native` retired

- `DatabaseProvider = "local" | "remote" | "postgres"`; `ZAM_DB_PROVIDER`
  accepts the new value.
- `credentials.json`: `postgres: { host, port?, database, username, auth:
  "entra-cli" | "password", passwordRef? }`. Reading a `turso` and a
  `postgres` block on one machine is an error with a clear message.
- `openDatabase` builds `openPostgresDatabase({ host, …, password: supplier })`
  where `supplier` is injected by the CLI layer: `entraCliPasswordSupplier()`
  spawns `az account get-access-token --resource-type oss-rdbms` per new pool
  connection and maps failures to `ENTRA_LOGIN_REQUIRED`; `password` reads the
  literal or vault reference as today's Turso token does.
- `getDatabaseTargetInfo` returns `kind: "postgres"`; `setup.ts` and the
  Studio label it.
- `zam connector setup postgres --host --database [--auth entra-cli|password]`
  and `zam connector test`.
- Remove the `native` provider, `syncUrl`, embedded-replica repair and the
  `turso-native`/`turso-replica` kinds; `mode: "native"` in stored credentials
  is read as `remote` with a one-time stderr notice. Drop the `libsql`
  optional dependency from `package.json` (owner-approved by the ADR).
- Tests: provider selection from credentials, mutual exclusion, supplier
  called once per new connection (fake pool), `ENTRA_LOGIN_REQUIRED` mapping
  for the three `az` failure shapes (missing binary, not logged in, wrong
  tenant), legacy `native` read as `remote`.

Acceptance: `POSTGRES_URL`-backed CI opens the ZAM schema through
`openDatabase({ provider: "postgres" })` with the password supplier and runs a
review round trip; `npm ls libsql` reports nothing.

## Phase 3 — Derived identity and team mode

- `src/cli/users/identity.ts` gains an identity provider: on a `postgres`
  target it runs `SELECT current_learner_id()` once per host session and
  caches the result; `NULL` raises `NOT_A_MEMBER` with the ADR's message and
  never falls back to a local id.
- `resolveUser`, `ensureDefaultUser`, the MCP `getUserId` and the Companion's
  selected user accept an explicit id only when it equals the derived one;
  otherwise `IDENTITY_MISMATCH`. `whoami` prints the derived id and its
  source; `whoami --set/--clear` refuse in team mode.
- Persistent hosts (`zam mcp`, `bridge serve`) resolve identity once with the
  database, not per command.
- Single context: `zam team provision` creates the library's one context
  (Phase 6); in team mode the active context is that row and the picker is
  hidden in Desktop, MCP Settings and the Companion.
- Tests: derived id used across bridge, MCP and CLI; mismatch rejected;
  unmapped role locked out; local SQLite behaviour unchanged.

Acceptance: with two mapped roles against Docker Postgres, every surface acts
as the connected role and no flag or parameter can change it.

## Phase 4 — Settings scopes

- M030: `user_settings(user_id, machine_id DEFAULT '', key, value,
  updated_at)`; index on `(user_id, key)`.
- Machine id: `getMachineId()` in `install-config.ts` mints a ULID once and
  stores it as `machine.id` in `~/.zam/config.json`.
- Settings API: `getUserSetting(db, { userId, machineId, key })` resolves
  machine → person → default; `setUserSetting(..., scope: "person" |
  "machine")`. A key registry declares each key's scope; unknown keys default
  to person scope.
- Classify existing keys: machine scope — `llm.url`, `llm.model`, `llm.*` local
  endpoints, `observer.*`, voice devices; person scope — `system.locale`,
  `review_method`, `recall.quick_mode`, study settings, `agent.default`;
  library scope stays in `user_config`.
- Transitional read-through: a personal key missing from `user_settings` is
  read from `user_config` and moved on first write. `user.id` is not written
  in team mode.
- Tests: resolution order, scope registry, read-through and move, two users
  in one database never see each other's rows (Postgres leg).

Acceptance: two colleagues on one Docker database keep separate locales and
separate local-model endpoints; a person's locale set on machine A appears on
machine B.

## Phase 5 — RLS completion and roles

- Policies for `session_syntheses`, `user_settings`, `assignments`
  (`assigner_id = current_learner_id() OR assignee_id = current_learner_id()`).
- Group roles `zam_owner` (schema owner, NOLOGIN), `zam_member`, `zam_curator`
  with the grants the ADR names; `grantsForLearnerRoleSql` grants membership
  instead of table rights.
- Schema-derived coverage test: walk `pragma table_info` for every table in
  `SCHEMA_TABLES`; any table with a `user_id` column or a foreign key path to
  `cards`/`sessions` must show `relrowsecurity` and `relforcerowsecurity`
  true. The test must fail when a fixture table is added without a policy.
- Test that a `zam_member` without `zam_curator` cannot write `tokens`, and a
  `zam_curator` can.

Acceptance: `npm run pg:test` covers every learning-state table by derivation;
the policy list and the derived set agree.

## Phase 6 — `zam team` administration

- `zam team provision --database <name>`: opens as the administrator (the
  admin's own `az` token), runs `applySchemaAndMigrations`, the RLS and role
  SQL, creates the single context — idempotent.
- `zam team add-member <upn>`: `pgaadauth_create_principal`, resolve object id
  via `az ad user show --id <upn>`, mint ULID, insert `learner_principals`,
  grant `zam_member` and (pilot) `zam_curator`. Prints the ULID.
- `zam team remove-member <upn>`: `ALTER ROLE … NOLOGIN`; rows untouched.
- `zam team members`: list mappings.
- Generic runbook lives in the ADR appendix; a short `docs/team-library.md`
  explains the colleague's side (install, `az login`, connect) with
  placeholders only.
- Tests against Docker Postgres with plain roles standing in for principals
  (`pgaadauth_*` is stubbed behind a small interface so the local leg runs).

Acceptance: provision → add-member → connect as that member (local role) →
review round trip, all through the CLI.

## Phase 7 — Desktop wizard, disclosure, doctor

- Extend the server-database wizard and `server-db-connect` bridge command
  with the team-library path: host, database, username from `az`, test
  connection, disclosure with **Understood** / **Learn locally instead**,
  persistent notice in Settings.
- `zam doctor`: `az` present, logged in, tenant matches the configured
  username, role mapped (`current_learner_id()` non-null).
- Companion and MCP need no UI change; verify they show the derived identity.
- Verify in the real host per the repo rule (VSIX or Desktop build, intent,
  screenshot or log), not only unit tests.

Acceptance: a colleague with `az login` done connects from the Studio without
a terminal and sees the disclosure exactly once.

## Phase 8 — Server and pilot

Outside the repository except for notes in the team's knowledge hub.

1. Create the server per the ADR appendix in the nearest region that
   provisions; request region access if Frankfurt refuses.
2. Prove Entra on PostgreSQL 18: admin token login, one
   `pgaadauth_create_principal`, one colleague connects. On failure, recreate
   on 17 and record it in the ADR status history.
3. `zam team provision --database zam_test`; add two or three colleagues; one
   week of real use; collect friction in the knowledge hub, not here.
4. `zam team provision --database zam_prod`; move the colleagues over; keep
   `zam_test` for the next release rehearsal.
5. Record the actual monthly cost and region in the team's runbook.

## Final check — nothing slipped

| ADR decision | Phase |
|---|---|
| 1 Server, PostgreSQL 18 verified, one server two databases | 8 |
| 2 One role per colleague, derived identity, single context | 3, 6 |
| 3 Azure CLI token supplier, no secret at rest | 2 |
| 4 Settings scopes, machine id | 4 |
| 5 ISO timestamps, `dialect`, Postgres model-test matrix | 1 |
| 6 `postgres` first-class, `native` retired | 2 |
| 7 RLS completion, group roles, derived coverage test | 5 |
| 8 `zam team`, generic runbook, company values outside | 6 |
| 9 Desktop wizard, disclosure, mobile out of scope | 7 |
| 10 Content from the knowledge hub, no migration | 6 (empty library at provision) |
| 11 Parent decisions kept | all — no phase touches them |
