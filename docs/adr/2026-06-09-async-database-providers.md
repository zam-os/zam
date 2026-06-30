# Async Database Providers

**Status:** Implemented
**Deciders:** Thomas (project owner)

---

## Context

Refactoring the kernel and database architecture to support async interfaces for future cloud sync and Turso connection.

## Decisions

- An asynchronous database, statement, result, and transaction contract.
- Promise-based adapters for local SQLite and the optional native libSQL backend.
- An Hrana v3 HTTP transport for remote Turso access.
- Explicit `local`, `native`, and `remote` provider selection.
- Async kernel and CLI database access.
- Provider contract tests against local SQLite and an Hrana stub.
- Windows ARM64 validation of remote Turso access without native libSQL.

## Evidence

- `src/kernel/db/types.ts`
- `src/kernel/db/sync-adapter.ts`
- `src/kernel/db/remote/hrana.ts`
- `src/kernel/db/remote/provider.ts`
- `src/kernel/db/connection.ts`
- `tests/kernel/provider-contract.test.ts`
- `tests/kernel/database-backend.test.ts`
