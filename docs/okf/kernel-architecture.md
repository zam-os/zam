---
type: architecture
title: Kernel and CLI Architecture
description: ZAM is split into an AI-agnostic learning kernel and a thin CLI orchestration layer; all learning logic lives in the kernel, all LLM/HTTP code in the CLI.
tags:
  - kernel
  - cli
  - boundaries
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/kernel-architecture.md"
timestamp: 2026-07-29T21:04:29Z
---

ZAM has exactly two code layers with a hard boundary between them.

The **kernel** (`src/kernel/`) is the learning engine. It owns scheduling,
recall, prerequisite blocking, sessions, analytics, and persistence, and it
has **zero LLM dependencies**: no fetch to model endpoints, no embedding
calls, ever. It stores vectors and ranks search results, but never produces
embeddings itself. Its public API is `src/kernel/index.ts`; the package root
`src/index.ts` re-exports it for programmatic use, and every new kernel
function must be re-exported there to be usable.

The **CLI** (`src/cli/`) is thin orchestration. Each command opens the
database, calls kernel functions, renders output, and closes the
connection. Everything that talks to an LLM or embedding endpoint lives in
`src/cli/llm/`. Heavy optional surfaces (for example the MCP transport in
`src/cli/commands/mcp.ts`) stay out of the CLI's eager module graph: the
bootstrap registers stub commands that `await import()` the implementation.

Two placement rules follow: new learning logic goes in the kernel, never in
CLI commands; new HTTP goes in the CLI layer, never in the kernel.

# Persistence

Without cloud credentials the default is local SQLite at `~/.zam/zam.db`
(WAL mode, foreign keys on). `openDatabase` can instead select Turso through
the native libSQL driver (a remote URL or an embedded replica) or ZAM's
binding-free HTTP provider. An explicit PostgreSQL provider implements the
same contract for server deployments.

All access goes through the async `Database` contract in
`src/kernel/db/types.ts`; concrete drivers are imported only inside
`src/kernel/db/`. IDs are ULIDs throughout. Schema changes require both
`src/kernel/db/schema.ts` and an idempotent numbered migration.
Machine-local state (config, selections and credentials) stays under
`~/.zam/`, never in the shareable database.

# Citations

- [ADR 2026-03-23 — Kernel and Shell Observation](../adr/2026-03-23-kernel-and-shell-observation.md)
- [ADR 2026-06-09 — Async Database Providers](../adr/2026-06-09-async-database-providers.md)
- [ADR 2026-07-07 — Resilient Self-Update and Dependency-Failure Isolation](../adr/2026-07-07-resilient-self-update-and-dependency-isolation.md)
- [ADR 2026-07-23 — Online-Only Server Database and Mobile Gating](../adr/2026-07-23-online-only-server-db-and-mobile-gating.md)
- Code: `src/kernel/index.ts`, `src/kernel/db/types.ts`, `src/kernel/db/connection.ts`, `src/kernel/db/postgres.ts`, `src/cli/index.ts`
