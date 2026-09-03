# Startup and VS Code performance

This plan turns the 2026-09-02 startup profile into small, independently
verifiable changes. Work on exactly the next unchecked phase. Keep all phases
on one branch and use one focused commit per completed phase.

## Goal

Make ZAM feel immediate when an app or the VS Code Companion first needs data,
especially with a remote Turso library, without adding caches, daemons, or new
runtime dependencies. Each phase should remove unnecessary work before adding
new machinery.

## Status

- [x] **Phase 1 — version-gated schema provisioning**
- [x] **Phase 2 — one database connection per persistent host**
- [ ] **Phase 3 — fewer remote reads during bootstrap**
- [ ] **Phase 4 — a narrow VS Code activation graph**
- [ ] **Phase 5 — lazy optional UI modules**

## Baseline

Measurements were taken on 2026-09-02 against the configured remote Turso
library in `aws-eu-west-1`:

- `openDatabase()` took about **2.12 s** before the first product query.
- Opening a current schema issued **35 database operations** (30 `exec`, 5
  `pragma`) because the complete idempotent migration chain ran every time.
- A cold MCP recall open took **2.22 s**; after the MCP process was warm, a
  direct graph request took **49 ms** and another recall open **84 ms**.
- The Studio bridge proxy still took **1.94–2.06 s** after MCP warm-up because
  each bridge command opened and provisioned its own database.
- A persistent bridge process ran `check-due` in **2.77 s** cold and **2.10 s**
  on its second invocation for the same reason.
- The VS Code extension bundle was **3.1 MB**. About **2.905 MB (90.2%)** came
  from bundled curriculum fixture JSON reached through the kernel barrel
  import, although activation only needs installation configuration helpers.
- The Desktop JavaScript bundle was **1.1 MB**, including about **527 KB** of
  Three.js. Most focused panels were roughly **700 KB**; the OKF panel was
  **4.0 MB** because Mermaid was eager.

These are diagnostic baselines, not permanent budgets. Re-measure the relevant
path in every phase and record both latency and structural evidence (operation
count or bundle composition), so network variance cannot hide a regression.

## Phase 1 — version-gated schema provisioning

Persist a singleton schema version owned by the kernel. A current database
open performs one version read and skips table DDL, column discovery, and the
idempotent migration chain. A database with no marker or an older marker still
runs the existing provider-neutral provisioning path.

- Add the version table to `SCHEMA_TABLES` and as idempotent migration M029.
- Stamp the current version only after tables, migrations, and indexes all
  succeed; a partially provisioned database must remain eligible for repair.
- Let a marker newer than this client count as current. Migrations are additive,
  and an older ZAM client must not try to downgrade a library opened by a newer
  release.
- Fall back only for the known “version table is absent” condition. Propagate
  transport, authentication, and unrelated SQL failures unchanged.
- Route local SQLite, native/HTTP Turso, embedded replicas, PostgreSQL-capable
  provisioning, and mobile's shared kernel path through the same contract.
- Cover current, stale, unmarked, partially failed, and repeated provisioning
  states with provider-neutral tests.

Acceptance:

- A current-schema gate uses exactly one prepared read and no `exec`/`pragma`.
- Empty and pre-M029 databases reach the current schema and receive the marker.
- The complete existing test suite remains green on every provider available
  in CI.

Result (2026-09-02): the current-schema path performs one prepared `get` and no
`exec` or `pragma`. With a deterministic 25 ms delay per database operation,
the previous complete provisioning path took 1,008 ms across 37 operations;
the gate took 28 ms for one operation (35.8× faster in that simulation). The
full suite passed 2,336 tests; PostgreSQL-only tests remain CI-gated by
`POSTGRES_URL`.

## Phase 2 — one database connection per persistent host

Make the lifetime boundary match the process boundary. MCP and Desktop already
have persistent hosts; their bridge-backed operations should receive the host's
open `Database` instead of entering `withDb` for every command.

- Add an explicit database-injection seam to bridge command execution while
  keeping standalone `zam bridge` behavior unchanged.
- Open once per MCP/Desktop host and close once during orderly shutdown.
- Keep command handlers stateless apart from the injected database; do not add
  a global connection cache or background service.
- Test concurrent calls, error recovery, shutdown, and standalone bridge
  isolation.

Acceptance:

- Two commands in one host cause one database open and one eventual close.
- The Studio bridge proxy no longer pays connection/provisioning latency per
  interaction.

Result (2026-09-03): `zam mcp` and the Desktop's persistent `bridge serve`
process now inject one lazy, process-owned database into bridge command
execution. Standalone `zam bridge` calls retain their open/close ownership, a
failed lazy open remains retryable, and stdin close releases the Desktop host's
handle after its final queued request. The exceptional `server-db-connect`
setup action retires the old handle so the following dashboard refresh uses
the newly selected library. In five alternating read-only
`list-knowledge-contexts` calls against the configured remote Turso library,
the four warm standalone calls took 86–97 ms (90 ms mean) while warm hosted
calls took 40–47 ms (43 ms mean), a 52% reduction. Structural tests pin one
open and one eventual close across concurrent hosted commands; the focused
Phase 2 suite passed 59 tests.

## Phase 3 — fewer remote reads during bootstrap

Reduce serial network round trips after the connection is ready.

- Consolidate the independent aggregates in `getUserStats` into the smallest
  clear set of SQL reads supported by every provider.
- Return the due summary with the existing Desktop bootstrap payload instead of
  immediately issuing another bridge command.
- Batch independent settings/secrets reads only where it preserves typed error
  handling and simple fallbacks.

Acceptance:

- Dashboard bootstrap renders the same values with a documented lower query
  count.
- Local behavior and failure messages remain unchanged.

## Phase 4 — a narrow VS Code activation graph

Stop pulling the complete kernel public barrel and bundled curriculum catalog
into the Companion activation bundle.

- Import the small installation/configuration modules directly from the
  extension entry point.
- Keep command-only or transport-heavy modules behind dynamic imports where
  activation does not need them.
- Add a build analysis assertion that curriculum fixture JSON is absent from
  the activation chunk.

Acceptance:

- Extension activation behavior and commands are unchanged.
- The activation bundle contains no bundled curriculum fixture payload and its
  size reduction is recorded.

## Phase 5 — lazy optional UI modules

Load visualization engines only on surfaces and actions that use them.

- Split Three.js away from non-graph Desktop startup.
- Load Mermaid only when the OKF reader encounters a Mermaid diagram.
- Preserve CSP, offline operation, and the single-file panel packaging contract.

Acceptance:

- Dashboard, Recall, Settings, and plain OKF reading do not evaluate either
  visualization engine.
- Graphs and Mermaid diagrams still work after their first lazy load.

## Verification for every phase

Run the phase-specific tests and benchmark first, then the repository gate:

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

If a phase changes behavior described by an OKF article, update that article
through `zam_okf_upsert` in the same commit. Never hand-edit `docs/okf/`.
