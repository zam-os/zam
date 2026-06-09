# Increment 10: Async Database Providers and Turso Sync

## Status

Planned for later implementation. This increment is not required for the
Windows ARM64 local-storage fix delivered in Increment 9.

Only Phase 0 (ARM64 release closure) is near-term work. All later phases stay
gated until cross-platform Turso access and multi-device sync become the
active product priority, and Phase 4 is additionally gated on upstream
Windows ARM64 support (see below).

## Goal

Replace ZAM's synchronous database dependency boundary with an asynchronous
provider interface so every supported architecture can use:

- local SQLite without network access,
- remote Turso without native libSQL binaries, and
- a future local-first synchronization provider based on Turso Sync.

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
3. Local-first synchronization.

## Target Architecture

```text
AsyncDatabase
|- LocalSQLiteProvider
|- RemoteTursoProvider
`- TursoSyncProvider
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
- Intended audience: administrative and reporting commands (for example
  `zam stats --user <id>` against the cloud database) and cloud access from
  architectures without native sync support.
- Not a supported configuration for interactive review sessions: a network
  round trip per review and broken offline behavior contradict ZAM's
  local-first learning loop.

### TursoSyncProvider

- Use Turso Sync rather than legacy embedded replicas.
- Support explicit pull/push operations and offline-first writes.
- Define conflict behavior before enabling automatic background sync.
- Remain optional until Turso Sync is stable enough for ZAM's data guarantees
  and upstream publishes Windows ARM64 npm binaries (missing as of
  `@tursodatabase/sync` 0.6.1; track the upstream issue before starting
  Phase 4).

## Implementation Phases

### Phase 0: ARM64 Release Closure (prerequisite, no async work)

- Fix the Windows ARM64 CI smoke test to set an identity before `zam stats`.
- Release `zam-core` 0.3.7: the published 0.3.6 still imports native `libsql`
  unconditionally and crashes on Windows ARM64.
- Validate `npx zam setup` plus one review on physical Windows ARM64 hardware.
- Verify one tagged desktop release including the `aarch64-pc-windows-msvc`
  artifact.

After Phase 0, local-only ZAM fully supports Windows ARM64. Everything below
is deferred until sync becomes the active priority.

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

### Phase 4: Local-First Sync

- Evaluate the current Turso Sync SDK and storage support.
- Define ownership and conflict rules for cards, reviews, settings, and tokens.
- Implement explicit sync status, pull, push, and recovery commands.
- Add interruption, conflict, and multi-device integration tests.

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

- Local-only ZAM behavior remains available without network access.
- Remote Turso works with native Windows ARM64 Node.js.
- No kernel or public API type depends on a concrete database package.
- Provider contract tests run against local SQLite and remote Turso.
- Schema migrations are atomic and equivalent across providers.
- Multi-step model operations preserve transaction guarantees.
- Sync conflicts never silently discard learning or review history.
- The Turso Sync provider ships only after upstream publishes Windows ARM64
  binaries.
- The legacy native `libsql` dependency is removed from installation.

## Non-Goals

- Replacing SQLite as ZAM's local storage format.
- Adding a second cloud database provider (for example Cloudflare D1 or a
  Postgres service); it would duplicate integration surface without solving
  Windows ARM64.
- Making every CLI command concurrent.
- Enabling automatic background sync before conflict semantics are defined.
- Treating the legacy embedded-replica API as the final sync architecture.

## Key Risk

This is a cross-cutting migration because most kernel APIs are synchronous
today. It should be implemented as a dedicated increment with provider contract
tests, not folded into an unrelated feature or release fix.
