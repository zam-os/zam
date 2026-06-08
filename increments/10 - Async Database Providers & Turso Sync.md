# Increment 10: Async Database Providers and Turso Sync

## Status

Planned for later implementation. This increment is not required for the
Windows ARM64 local-storage fix delivered in Increment 9.

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

### RemoteTursoProvider

- Use an async HTTP/Web-compatible Turso client.
- Avoid native libSQL bindings.
- Support authenticated remote reads, writes, batches, and transactions on all
  supported architectures, including native Windows ARM64.

### TursoSyncProvider

- Use Turso Sync rather than legacy embedded replicas.
- Support explicit pull/push operations and offline-first writes.
- Define conflict behavior before enabling automatic background sync.
- Remain optional until Turso Sync is stable enough for ZAM's data guarantees.

## Implementation Phases

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

## Acceptance Criteria

- Local-only ZAM behavior remains available without network access.
- Remote Turso works with native Windows ARM64 Node.js.
- No kernel or public API type depends on a concrete database package.
- Provider contract tests run against local SQLite and remote Turso.
- Schema migrations are atomic and equivalent across providers.
- Multi-step model operations preserve transaction guarantees.
- Sync conflicts never silently discard learning or review history.
- The legacy native `libsql` dependency is removed from installation.

## Non-Goals

- Replacing SQLite as ZAM's local storage format.
- Making every CLI command concurrent.
- Enabling automatic background sync before conflict semantics are defined.
- Treating the legacy embedded-replica API as the final sync architecture.

## Key Risk

This is a cross-cutting migration because most kernel APIs are synchronous
today. It should be implemented as a dedicated increment with provider contract
tests, not folded into an unrelated feature or release fix.
