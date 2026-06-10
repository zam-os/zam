# Increment 10: Async Database Providers and Turso Sync

## Status

Planned for later implementation. This increment is not required for the
Windows ARM64 local-storage fix delivered in Increment 9.

Only Phase 0 (ARM64 release closure) is near-term work. Later phases stay
gated until cloud database access from every architecture becomes the active
product priority. Turso Sync is parked; see Product Assumptions and the
parked provider section.

## Goal

Replace ZAM's synchronous database dependency boundary with an asynchronous
provider interface so every supported architecture can use:

- local SQLite for zero-account onboarding,
- remote Turso without native libSQL binaries, and
- (parked) a local-first synchronization provider based on Turso Sync, only
  if offline-first ever becomes a requirement.

## Product Assumptions (2026-06-09)

- Users are online in practice (around 99% of the time); offline capability
  is not a product goal. In the rare offline moments, learning can wait.
- The local LLM exists for cost saving, not for offline operation.
- The local database exists for fast, zero-account onboarding, not for
  offline operation. Once cloud credentials are configured, the cloud
  database is the source of truth.

## Why

The legacy `libsql` Node binding has no native Windows ARM64 artifact. Using an
async HTTP client solves remote Turso access on that platform, but does not make
legacy embedded replicas architecture-independent. Turso now recommends Turso
Sync for new applications that need true local-first push/pull synchronization.

Windows ARM64 is not an edge case: Snapdragon-based Windows laptops are a
growing mainstream platform, and every new ZAM user on one of them gets the
local-only path by default. Verified platform facts (2026-06-09):

- `libsql` 0.5.29 publishes no `@libsql/win32-arm64-msvc` package, so neither
  remote Turso nor embedded replicas work natively on Windows ARM64 today.
- The new Turso stack has the same gap: `@tursodatabase/database` and
  `@tursodatabase/sync` 0.6.1 ship darwin-arm64, linux-x64/arm64, and
  win32-x64 binaries only. Turso Sync therefore does not currently run on the
  platform that motivates this increment.
- `better-sqlite3` 12.10.0 ships win32-arm64 prebuilds for Node 22/24+, which
  is why local mode already works.

ZAM therefore needs to separate three concerns instead of selecting one database
package for all of them:

1. Local persistence.
2. Remote database access.
3. Local-first synchronization (parked).

## Target Architecture

```text
AsyncDatabase
|- LocalSQLiteProvider
|- RemoteTursoProvider
`- TursoSyncProvider (parked)
```

### LocalSQLiteProvider

- Wrap the existing local SQLite implementation in Promise-based methods.
- Preserve the current SQLite file format and migrations.
- Remain the default provider and work fully offline.
- Evaluate `node:sqlite` (built into Node >= 22, which ZAM already requires)
  behind the same contract; adopting it would remove the last native module
  from local mode and make installs architecture-independent.

### RemoteTursoProvider

- Use an async HTTP/Web-compatible Turso client.
- Avoid native libSQL bindings.
- Support authenticated remote reads, writes, batches, and transactions on all
  supported architectures, including native Windows ARM64.
- Primary cloud mode for all architectures, including interactive review
  sessions: the per-review local LLM call dominates latency, so an HTTP
  round trip per query is acceptable under the online-first assumption.
- Also serves administrative and reporting commands (for example
  `zam stats --user <id>` against the cloud database).

### TursoSyncProvider (parked)

Parked indefinitely: synchronization exists to serve offline-first usage,
which is not a product goal. With the online-first assumption, every device
talks to the same remote database directly and no conflict semantics are
needed. Revisit only if that assumption changes, and then only once Turso
Sync is stable enough for ZAM's data guarantees and upstream publishes
Windows ARM64 npm binaries (missing as of `@tursodatabase/sync` 0.6.1).

## Implementation Phases

### Phase 0: ARM64 Release Closure (prerequisite, no async work)

- Fix the Windows ARM64 CI smoke test to set an identity before `zam stats`.
- Release `zam-core` 0.3.7: the published 0.3.6 still imports native `libsql`
  unconditionally and crashes on Windows ARM64.
- Validate `npx zam setup` plus one review on physical Windows ARM64 hardware.
- Verify one tagged desktop release including the `aarch64-pc-windows-msvc`
  artifact.

**Validation log — 2026-06-10, physical Windows ARM64, Node 26.3.0 (PASS):**
`npx zam setup` plus one review ran end to end over the async Hrana HTTP Turso
provider with no native `libsql`. Verified on hardware: the 0.3.7 CLI loads
where 0.3.6 crashed (`Cannot find module '@libsql/win32-arm64-msvc'`);
`better-sqlite3` 12.10.0 ARM64 prebuild loads; `whoami`/`stats` read the Turso
cloud DB over HTTP; `zam setup` ran remote migrations idempotently; and one
`bridge submit` review wrote + FSRS-rescheduled a card (the blocking rule fired
correctly). Caveat: exercised against the **source-HEAD build (npm-linked)**,
because the published `zam-core@0.3.7` predates the HTTP provider (#31 landed
after the #29 release tag). To close this for npm users, cut **0.3.8**, and
ensure `~/.zam/credentials.json` carries `turso.mode: "remote"` (otherwise
remote paths default to native libsql and crash on ARM64). The tagged
`aarch64-pc-windows-msvc` desktop artifact bullet remains unverified.

After Phase 0, local-only ZAM fully supports Windows ARM64. Everything below
is deferred until cloud database access becomes the active priority.

### Phase 1: Async Database Contract

- Define async database, statement, result, transaction, and migration
  interfaces.
- Add provider contract tests independent of a concrete database package.
- Convert shared CLI database wrappers to async lifecycle management.

### Phase 2: Kernel Migration

- Convert models, schedulers, analytics, recall, goals, and settings to async
  database operations.
- Preserve transaction boundaries for destructive and multi-table operations.
- Keep behavioral compatibility with the existing synchronous implementation.

### Phase 3: Remote Turso

- Implement the remote HTTP provider.
- Select providers explicitly from configuration.
- Add timeout, retry, authentication, and actionable offline errors.
- Test the provider on Windows ARM64 CI.

### Phase 4: Local-to-Cloud Promotion

- Implement a one-time promotion command that uploads an existing local
  onboarding database into a configured cloud database.
- Verify row counts after promotion and keep the local file as a backup
  until the user confirms.
- Document the onboarding ramp: start local with zero accounts, attach cloud
  credentials later, promote history, continue remote.

### Phase 5: Remove Legacy Backend

- Migrate existing Turso configuration and credentials.
- Remove the optional native `libsql` dependency.
- Remove legacy embedded-replica metadata recovery code.
- Publish upgrade and rollback instructions.

## Interim Measures (independent of this increment)

- `zam backup` / `zam restore`: an explicit SQL text dump to a user-chosen
  folder (for example a OneDrive-synced directory) covers device loss for
  local-only users without sync semantics, accounts, or async migration. Do
  not sync the live `.db` file through a file-sync service; WAL plus file
  sync risks corruption. This closes the backup/restore gap already tracked
  as Increment 3A remaining work and stays useful after real sync exists.
- New cloud users need no new database provider: additional free databases
  under the existing Turso organization cover per-user cloud storage with
  zero new code.

## Acceptance Criteria

- Local mode remains the zero-configuration onboarding default.
- Remote Turso works with native Windows ARM64 Node.js.
- No kernel or public API type depends on a concrete database package.
- Provider contract tests run against local SQLite and remote Turso.
- Schema migrations are atomic and equivalent across providers.
- Multi-step model operations preserve transaction guarantees.
- Local-to-cloud promotion transfers existing history losslessly and
  verifiably.
- If a sync provider ever ships: conflicts never silently discard learning
  or review history, and it ships only after upstream publishes Windows
  ARM64 binaries.
- The legacy native `libsql` dependency is removed from installation.

## Non-Goals

- Replacing SQLite as ZAM's local storage format.
- Adding a second cloud database provider (for example Cloudflare D1 or a
  Postgres service); it would duplicate integration surface without solving
  Windows ARM64.
- Making every CLI command concurrent.
- Offline capability as a product goal; ZAM assumes users are online and
  lets learning wait in rare offline moments.
- Enabling automatic background sync before conflict semantics are defined.
- Treating the legacy embedded-replica API as the final sync architecture.

## Key Risk

This is a cross-cutting migration because most kernel APIs are synchronous
today. It should be implemented as a dedicated increment with provider contract
tests, not folded into an unrelated feature or release fix.
