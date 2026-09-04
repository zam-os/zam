# Team Learning Library on Managed PostgreSQL: Entra Identity, Per-Learner Roles, and a ZAM-Only Server

**Status:** Proposed (2026-09-04) — awaiting owner sign-off
**Date:** 2026-09-04
**Deciders:** Thomas (project owner)
**Amends:**
[2026-07-04-multi-learner-shared-knowledge.md](2026-07-04-multi-learner-shared-knowledge.md)
— Deployment B: replaces Decisions 13 (PostgreSQL version), 14 (dev/prod
server split), 15 (co-tenancy) and the cost section; refines Decisions 6
(identity is the connection), 7 (ULID ↔ principal mapping) and 9 (one
database, one context) with the client-side mechanics they left open. The
editorial workflow, the data classes, and Decisions 1–5, 8 and 10–12 stand.
[2026-06-09-async-database-providers.md](2026-06-09-async-database-providers.md)
— retires the `native` libsql provider and the embedded replica.
**Related:**
[2026-07-23-online-only-server-db-and-mobile-gating.md](2026-07-23-online-only-server-db-and-mobile-gating.md)
(the personal server database this runs beside, not instead of) ·
[2026-07-25-shared-curated-learning-content.md](2026-07-25-shared-curated-learning-content.md)
(the product principle) ·
[2026-07-26b-central-curriculum-content-service.md](2026-07-26b-central-curriculum-content-service.md)
(the anonymous content service, which stays a different thing) ·
[2026-07-30b-credential-secret-backends.md](2026-07-30b-credential-secret-backends.md)
(deliberately *not* involved — this deployment stores no secret)

---

## Context

ADR 2026-07-04 designed "Deployment B": a closed team learns from one shared
PostgreSQL library, knowledge is shared, learning state is private per learner
and isolated by row-level security, identity comes from Microsoft Entra. Its
Phases B, C0 and D shipped — content versioning, a Postgres provider with a
contract test, the RLS policies with an isolation suite, assignments. Phase C,
the actual deployment, never started, and in the seven weeks since, five of
its premises changed.

1. **PostgreSQL 18 no longer excludes Entra.** Decision 13 pinned PostgreSQL 17
   because Entra sign-in was reported broken on 18. Microsoft has since made
   PostgreSQL 18 generally available on Flexible Server with Entra integration;
   the current Entra documentation lists no version restriction, and `vector`
   0.8.2 is offered on 17 and 18 alike. The "sharpest risk in the whole
   arrangement" (Decision 15) has dissolved.
2. **There is no co-tenant server.** Decision 15 assumed ZAM would ride along
   on a server another service needed anyway, at zero marginal cost. That
   server will not exist. ZAM gets its own, so the version coupling, the shared
   point-in-time restore and the co-tenant administrators all disappear — and
   the bill becomes real, which is why the cheapest configuration wins.
3. **Nobody has data to migrate.** The pilot colleagues have not set ZAM up
   yet. The owner's private library stays private, on private machines, and
   never enters the team database. A migration path is out of scope.
4. **The Azure CLI is on every pilot machine.** That makes token acquisition a
   subprocess call, with no new dependency, no app registration and no stored
   secret — the "one genuinely new piece of client machinery" the parent ADR
   expected shrinks to a few lines.
5. **Machines are personal.** Every colleague has one work machine that nobody
   else uses; some also have a company phone. Mobile is not in the pilot.

The architecture review of 2026-09-04 added findings the deployment cannot
ship over:

- **Identity is asserted by the caller.** The learner id is a `user.id` row in
  `user_config`, a table without a user column. In a shared database the first
  colleague's id would become everyone's default, and `--user`, `whoami --set`
  and the MCP `user` parameter accept any id. RLS on the server closes the
  read side; the client still has to *derive* its identity from the connection
  rather than announce one.
- **`user_config` is single-learner by construction.** Roughly thirty settings
  keys (`llm.*`, `observer.*`, `recall.*`, `system.locale`, …) would collide
  across colleagues in one database.
- **The Postgres provider is unreachable.** `openDatabase` knows `local`,
  `native` and `remote`; nothing selects `openPostgresDatabase` outside tests.
- **The dialect layer is regex over SQLite text.** It misses `strftime` and
  `date('now', 'localtime', …)` in the progress statistics, case-sensitive
  `LIKE`, and `due_at <= datetime('now')`, which PostgreSQL rejects as a
  text-versus-timestamp comparison. Timestamps are already mixed on SQLite:
  JavaScript writes ISO 8601 with a `T`, the schema default writes a space.
  The contract test runs toy tables, not ZAM's queries, so none of this is
  caught.
- **RLS coverage is narrower than the ADR's own data-class table.**
  `session_syntheses` is learning state and unprotected; assignments have no
  visibility policy; every member may write knowledge tables.
- **The `native` libsql path is dead weight.** ADR 2026-07-23 abandoned
  offline sync, only a setup label still mentions the embedded replica, yet
  the connection module carries its file-repair logic and the native binding
  remains a packaging risk on every platform.

## Decision drivers

1. **Ship the pilot** — a small team, one library, colleagues who can start
   learning without a terminal.
2. **Cheapest configuration that keeps the privacy boundary** — every euro is
   now ZAM's own.
3. **Identity is the connection** (parent Decision 6, kept) — nothing per
   request to remember, nothing that fails open.
4. **No new dependency, no secret at rest** — the Azure CLI already holds the
   login; ZAM borrows it.
5. **The kernel stays single-learner and platform-neutral** (parent Decision
   8, kept) — auth, RLS and process spawning stay in the CLI layer.
6. **The public repository stays free of company specifics** — tenant names,
   server names and resource groups live in the team's own runbook.

## Decision

### 1. One ZAM-only server, the cheapest that still isolates learners

| | |
|---|---|
| Service | Azure Database for PostgreSQL **Flexible Server**, dedicated to ZAM |
| Compute | **Burstable B1ms** (1 vCore, 2 GiB), no high availability |
| Storage | **32 GiB** (the service floor) |
| Backup | locally redundant, **7 days**, no geo-redundancy |
| Engine | **PostgreSQL 18** — supersedes parent Decision 13 |
| Extensions | `vector` optional; the kernel's BLOB embeddings need none |
| Authentication | **Microsoft Entra only** — password authentication disabled |
| Network | public endpoint, TLS required (see firewall note) |
| Databases | `zam_test` and `zam_prod` **on the same server** |
| Region | the Azure region **nearest the team**, unless it costs significantly more |

**PostgreSQL 18, verified before anything depends on it.** Microsoft states
Entra integration for 18, and its Entra documentation names no version limit,
but the parent ADR's finding was real at the time. So the first act after the
server exists is the smallest possible proof: the Entra administrator signs in
with an `az` token, runs `pgaadauth_create_principal` for one colleague, and
that colleague connects. If that fails on 18, the server is recreated on 17
with no other change — every other decision here is version-agnostic.

**Two databases, one server.** Parent Decision 14 separated dev and prod
servers for three reasons: shared point-in-time restore, a careless dev query
on a single vCore, and rehearsing a major-version upgrade. All three were
about a *co-tenant's* production database. With ZAM alone on the server, a
restore rolls back ZAM's own test database (acceptable), a slow test query
slows ZAM's own pilot (acceptable, and `zam_test` is idle most of the time),
and there is no upgrade to rehearse while 18 is current. A second server
would roughly double the bill for insurance nobody needs yet. Local Docker
PostgreSQL remains the inner development loop (parent Decision 14, kept).

**Region.** The team sits in southern Germany; Germany West Central
(Frankfurt) is the natural choice. Microsoft has restricted Flexible Server
provisioning there to Enterprise Agreement customers during capacity
shortages (reported April 2025, still in force two months later), so
creation may need a "region access" quota request, or a company agreement
that already qualifies. If neither is available in a day, fall back in this
order — Germany North, Switzerland North, West Europe — and take the first
whose B1ms price is within a few euros of Frankfurt's. Latency differences
between these regions are irrelevant for review sessions; the bill decides.

**Firewall.** Entra-only authentication means no password exists to guess, so
the pilot may open the public endpoint to all addresses if colleagues have no
fixed egress. If the office or VPN has stable ranges, restrict to them. Both
are one `az` command; neither changes anything in ZAM.

**Cost.** Standalone figures from the parent ADR's cost section now apply in
full: roughly **$16–19 per month** on demand, under $10 with a one-year
reservation once the pilot proves it continues. Region-dependent — confirm in
the pricing calculator before creating the server.

### 2. One learner, one Entra principal, one database role, one ZAM ULID

Parent Decisions 6 and 7, made concrete:

- The administrator (the project owner, who is the server's Entra
  administrator) creates one database role per colleague with
  `pgaadauth_create_principal('<upn>', false, false)`, mints a **ZAM ULID**
  for them, and inserts the mapping into `learner_principals` — role name,
  ULID, Entra object id and UPN. Azure matches tokens to roles by **object
  id**, not by name; a recreated account with the same UPN is a different
  person and gets a new mapping.
- **The client derives its identity from the connection.** On connect ZAM
  runs `SELECT current_learner_id()` and uses the result as the session's
  learner id. An unmapped role gets `NULL`, which the server already fails
  closed on; the client turns that into one plain message — *"Your account is
  not yet a member of this library. Ask the administrator to add you."* — and
  never falls back to a local id.
- **Nothing may override it.** In team mode `--user`, `whoami --set`, the MCP
  `user` parameter and the Companion's selected user are accepted only when
  they equal the derived id and rejected otherwise. `whoami` shows the derived
  id and says where it came from.
- **Removing a colleague** revokes login (`ALTER ROLE … NOLOGIN`) and drops
  the mapping's login rights; their rows stay. History belongs to the person,
  and a learner who returns is mapped back to the same ULID by object id.

**One identity owns one knowledge context.** The team library carries exactly
one context, created at provisioning. Connected to the team library, the
context picker is hidden and every token belongs to that context. Parent
Decision 9 ("the database selection carries the context") is thereby
satisfied in its simplest form; the multi-context machinery keeps working on
personal libraries and is simply not offered here.

### 3. The Azure CLI is the token source — no MSAL, no app registration, no secret

```
az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv
az ad signed-in-user show --query userPrincipalName -o tsv
```

- The PostgreSQL provider takes a **password supplier** — an async function —
  and calls it for **every new pooled connection**. Tokens live up to an hour;
  an open PostgreSQL session is not re-authenticated when its token expires,
  and a new connection simply fetches a fresh one. No refresh loop, no timer,
  no cached token. The parent ADR's "refresh-before-expiry" machinery is not
  built because it is not needed.
- The username is the colleague's UPN, read once from `az` and cached as a
  non-secret in `~/.zam/credentials.json` beside host and database. Nothing
  secret is ever written: no token, no refresh token, no vault reference.
  ADR 2026-07-30b's backends are not involved.
- If `az` is missing, not logged in, or logged into the wrong tenant, the
  provider raises a typed `ENTRA_LOGIN_REQUIRED` error and the surfaces say
  *"Run `az login` and try again"*. `zam doctor` checks the same three
  conditions.
- **Where it lives:** the supplier that spawns `az` is CLI-layer code
  (`src/cli/`); the provider in `src/kernel/db/` only sees a function that
  returns a string. Locally the same function returns the Docker password, so
  the provider has one code path (parent Decision 14, kept).
- Not chosen: MSAL with the Windows broker (a native dependency), a device-code
  flow (needs an app registration and a place to keep the refresh token). Both
  remain available if a machine without `az` ever appears.

### 4. Settings gain scopes: person, machine, library

`user_config` stays for library-wide keys. Everything a *person* configures
moves to a new table:

```sql
CREATE TABLE user_settings (
  user_id    TEXT NOT NULL,
  machine_id TEXT NOT NULL DEFAULT '',   -- '' = follows the person
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, machine_id, key)
);
```

- **Person scope** (`machine_id = ''`) follows the learner to every device:
  locale, review method, quick mode, study settings, default agent.
- **Machine scope** carries hardware specifics — local model endpoints,
  observer policy, voice devices — keyed by a **machine id**: a ULID minted
  once per install and stored in `~/.zam/config.json`. No hardware serial, no
  hostname; the id says "this install", nothing about the device. Resolution
  is machine row first, person row second, default last. This is what lets a
  colleague's work PC and company phone hold different local-AI settings
  while sharing one learning state.
- **Library scope** stays in `user_config`: the library's context, defaults a
  curator sets for everyone.
- `user.id` is **not stored** in team mode; it is derived (Decision 2). On a
  personal library the same table is used with the local id, so there is one
  settings API. Existing personal keys in `user_config` are read as a
  fallback and moved on first write — a transitional rule, not a migration
  step anyone has to run.
- `user_settings` is learning-adjacent personal data and gets the same RLS
  policy as `cards`.

### 5. Timestamps and dialect become the kernel's responsibility, not a regex's

- **Every timestamp ZAM writes is ISO 8601 UTC, written by JavaScript.** No
  kernel query compares a column against a database-side "now"; the caller
  passes the instant as a parameter. Schema defaults keep `datetime('now')`
  on SQLite and are translated for PostgreSQL to an expression that yields the
  same ISO text, so the two providers store byte-identical values.
- `LIKE` is normalised as `lower(col) LIKE lower(?)` where it is a search,
  and replaced by equality or prefix checks where it was one already.
- Date bucketing for progress statistics (`day`, `week`, `month`) is computed
  in JavaScript from the ISO strings, or via a small per-provider expression
  behind a `dialect` field on the `Database` contract — the one honest
  addition to that contract, because `sqlite` and `postgres` genuinely differ
  here.
- **The kernel model tests run against PostgreSQL in CI**, not only a toy
  contract. A provider matrix helper wraps the queue, card, evaluator, token
  and progress suites; the Postgres leg skips without `POSTGRES_URL` and
  reports the skip, as the existing suites do.
- The regex translation layer is confined to DDL and stops growing.

### 6. `postgres` is a first-class provider; `native` and the embedded replica retire

- `DatabaseProvider` becomes `"local" | "remote" | "postgres"`.
  `~/.zam/credentials.json` gains a `postgres` block — `host`, `port`,
  `database`, `username`, `auth: "entra-cli" | "password"`, optional
  `passwordRef` for local development — and its presence selects team mode.
  `turso` and `postgres` are mutually exclusive on one machine: a device is
  bound to one library (parent Decision 9).
- `getDatabaseTargetInfo` reports a `postgres` kind; `zam connector setup
  postgres` exists for automation; the Desktop wizard is the learner-facing
  path (Decision 9 below).
- **Retired:** the `native` libsql driver, the embedded replica (`syncUrl`,
  `.meta`/`-info` repair, `InvalidLocalState` recovery) and the
  `turso-native`/`turso-replica` target kinds. A stored `mode: "native"` is
  read as `remote` with a one-time notice. The Hrana HTTP provider remains
  the personal server-database path; the native binding leaves the package.

### 7. RLS covers the whole learning-state class, and grants encode the roles

- Policies are added for `session_syntheses` (learning state the parent ADR
  lists and the policies missed), `user_settings` (Decision 4) and
  `assignments` (visible to assigner **or** assignee, parent Decision 10).
- Three `NOLOGIN` group roles carry authorisation: `zam_owner` owns the
  schema and no human ever logs in as it; `zam_member` may `SELECT` knowledge
  and read/write its own learning state under RLS; `zam_curator` may also
  write knowledge tables. Every learner role is granted `zam_member`; **in
  the pilot every member is also granted `zam_curator`**, so restricting
  publishing later is a grant flip, not a schema change.
- **Coverage is derived, not listed.** A test walks the schema: every table
  with a `user_id` column, or reachable from `cards`/`sessions` by foreign
  key, must carry an enabled *and forced* policy. A new learning-state table
  without one fails CI; the hand-written list in `rls-policies.ts` becomes
  the thing the test checks, not the thing it trusts.

### 8. Administration is a CLI, server creation is a script, company values stay outside

A `zam team` command group, usable only by the Entra administrator (their own
`az` token, their own admin role):

| Command | Does |
|---|---|
| `zam team provision --database <name>` | schema + migrations, RLS, roles, grants, the single context — idempotent |
| `zam team add-member <upn>` | `pgaadauth_create_principal`, mint ULID, insert mapping, grant `zam_member` (+ `zam_curator` in the pilot) |
| `zam team remove-member <upn>` | revoke login, keep rows |
| `zam team members` | list mappings |

Creating the server itself is an `az` script kept **as a generic runbook in
this repository** (appendix) with placeholders; the team's actual tenant,
subscription, resource group, server name and firewall ranges live in the
team's own knowledge-hub repository, never here.

### 9. Surfaces: Desktop first, mobile not in the pilot

- The existing server-database wizard gains a **"Connect to team library"**
  path: host and database, username discovered from `az`, one test
  connection, then the disclosure from parent Decision 6 — *"Your learning
  progress is stored in a database operated by your organisation. Other
  learners cannot see it. Database administrators technically can."* with
  **Understood** / **Learn locally instead**. The text stays visible in
  Settings.
- MCP, the VS Code Companion and the CLI follow automatically because they
  open the same configured database; their identity comes from Decision 2.
- **Mobile is out of the pilot.** The Rust shell speaks libsql only; a phone
  against PostgreSQL would need either a `tokio-postgres` path with `az`-less
  token acquisition or an HTTP gateway. Neither is decided here. The
  company-phone case in Decision 4 is modelled so it costs nothing to add
  later.

### 10. Content comes from the team's knowledge hub; nothing is migrated

Parent Decision 2 stands: articles and token drafts live in the team's
central knowledge-hub repository (the OKF bundle there is the natural
`source_link` target), reviewed through pull requests; the Studio owns the
release step with its cosmetic/material classification. The library starts
empty at provisioning and fills through that route. No personal library is
imported, no slug-collision rule is needed, and the owner's private library
is never connected to a work machine.

### 11. What stays exactly as the parent ADR decided

Editorial states and materiality (Decisions 1–3), roles (4), Deployment A
untouched (5), learning state in the shared database under RLS with the
in-app disclosure and online-only reviews (6), kernel free of RLS/auth/HTTP
(8), assignments (10), **no aggregates about people** (11), content-level
signals only above a threshold (12).

## Consequences

- The pilot can start as soon as the server exists: every client-side piece
  is a bounded change on an existing seam, and the identity path needs no
  procurement, consent or dependency approval.
- **A forgotten mapping is a lockout, never a leak**, and a spoofed `--user`
  is a rejection, never a different colleague's queue.
- Colleagues' settings stop colliding, and a person's preferences follow them
  to a second device while hardware specifics stay with the machine.
- The kernel's SQL becomes provider-honest; the SQLite-only `dueToday`
  miscount disappears as a side effect.
- One provider fewer to test, package and explain; one native binding fewer
  to fail on Windows ARM64 or inside the packaged desktop app.
- The bill is ZAM's own — small, visible, and switchable off.
- **Still true and still disclosed:** the server administrator can read every
  row. In the pilot that is the project owner.
- Mobile learners of the team library wait for a later ADR.

## Open questions

1. **Region access.** Whether the company's agreement already permits
   Flexible Server creation in Germany West Central, or a quota request is
   needed — settled by trying, on the day the server is created.
2. **Firewall shape.** All addresses versus company egress ranges — the
   administrator's call at creation; ZAM is indifferent.
3. **Curator for everyone** is the pilot rule. When publishing should narrow,
   the grant is revoked from individual roles; nothing else changes.

## Scope and delivery plan

Phased in [docs/plans/2026-09-04-team-library-pilot.md](../plans/2026-09-04-team-library-pilot.md):
dialect foundation → provider wiring and `native` retirement → derived
identity → settings scopes → RLS completion → `zam team` → Desktop wizard →
server creation and pilot. Each phase ships on its own; the server is created
only after the client can prove the identity path against local Docker.

## Appendix — generic server runbook (placeholders in angle brackets)

```bash
# 1. Resource group and server: Entra only, cheapest tier, PostgreSQL 18.
az group create --name <rg> --location <region>
az postgres flexible-server create \
  --resource-group <rg> --name <server> --location <region> \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 18 \
  --microsoft-entra-auth Enabled --password-auth Disabled \
  --backup-retention 7 --geo-redundant-backup Disabled --zonal-resiliency Disabled \
  --public-access <All | start-ip-end-ip>

# 2. The Entra administrator (the project owner's own account).
az postgres flexible-server microsoft-entra-admin create \
  --resource-group <rg> --server-name <server> \
  --admin-display-name <admin-upn> --admin-object-id <admin-object-id> --admin-type User

# 3. Databases.
az postgres flexible-server db create --resource-group <rg> --server-name <server> --database-name zam_test
az postgres flexible-server db create --resource-group <rg> --server-name <server> --database-name zam_prod

# 4. Prove Entra on 18 before anything else: admin connects with a token.
export PGPASSWORD=$(az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv)
psql "host=<server>.postgres.database.azure.com dbname=zam_test user=<admin-upn> sslmode=require" \
  -c "select * from pgaadauth_create_principal('<colleague-upn>', false, false);"

# 5. Hand over to ZAM.
zam team provision --database zam_test
zam team add-member <colleague-upn>
```

## Status history

| Date | State | Note |
|------|-------|------|
| 2026-09-04 | Proposed | Written after the architecture review and the owner's answers of the same day: ZAM-only server, cheapest tier, PostgreSQL 18, Entra-only, `az` as token source, one role per colleague with the owner as administrator, derived identity, settings scopes with a machine id, `native` provider retired, mobile and migration out of scope, company specifics kept out of the repository. |
