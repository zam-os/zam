# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build              # Build CLI (dist/cli/index.js) and library (dist/index.js) via tsup
npm run dev -- <args>      # Run CLI from source via tsx during development
npm run test               # Run full Vitest suite
npm run test -- tests/kernel/fsrs.test.ts  # Run a single test file
npm run lint               # Biome check on src/
npm run format             # Biome format --write src/
```

Biome is version-sensitive: if lint fails before touching code, check schema compatibility between `biome.json` and the installed Biome CLI first.

## Architecture

ZAM has two distinct layers:

**Kernel** (`src/kernel/`): AI-agnostic learning engine with zero LLM dependencies. `src/kernel/index.ts` is the public API; `src/index.ts` re-exports it for programmatic use. All learning logic lives here.

**CLI** (`src/cli/`): Thin orchestration layer. `src/cli/index.ts` wires commands via Commander. Each command in `src/cli/commands/` opens the DB, calls kernel functions, renders output, and closes the connection.

### Domain model

- **token**: Atomic knowledge concept with Bloom level (1–5), domain, and `symbiosis_mode`. Shared across users.
- **card**: Per-user FSRS scheduling state for a token (stability, difficulty, due date, block status).
- **prerequisite**: Directed dependency graph between tokens.
- **review_log**: Immutable audit trail of review events.
- **session / session_step**: Work+learning episodes with per-step ratings.

Database lives at `~/.zam/zam.db` (SQLite, WAL mode, foreign keys enabled).

### Review flow

1. `scheduler/queue.ts` — builds queue from due + new cards, interleaves by domain, inserts new cards every 5th slot
2. `recall/prompter.ts` — generates template-based (not LLM) prompts adapted to Bloom level
3. `recall/evaluator.ts` — runs FSRS-5 scheduling, updates card, appends to `review_logs`
4. `scheduler/blocker.ts` — prerequisite blocking/unblocking (separate from rating evaluation)

### Bridge protocol

`src/cli/commands/bridge.ts` + `src/bridge/protocol.ts` form the machine-facing JSON API for external AI CLIs. Bridge responses are always JSON, including errors. Treat `protocol.ts` types as the stable contract.

## Key conventions

- **Kernel vs. CLI boundary**: New learning logic goes in the kernel, not in CLI commands.
- **Token vs. Card distinction**: `zam token register` creates only a token. `zam bridge add-token` also creates a user card. If a concept should appear in a user's queue, ensure a card is created.
- **IDs are ULIDs** throughout — use `ulid()`, not UUIDs or numeric IDs.
- **Blocking is separate from rating**: `evaluateRating()` updates FSRS state; callers decide whether to invoke blocking after a rating of `1`.
- **`zam bridge` must emit JSON only** (stricter than `--json` flag on other commands).
- **Token metadata drives behavior**: Bloom levels drive prompt generation; `symbiosis_mode` is load-bearing.
- **FSRS tests are the source of truth** for scheduling behavior — check `tests/kernel/fsrs.test.ts` when changing scheduling or rating semantics.

## Commit format

`<type>: <short summary>` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
