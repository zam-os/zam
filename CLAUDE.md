# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build              # Build CLI (dist/cli/index.js), library (dist/index.js) via tsup, and the MCP Apps panel (dist/ui/studio-panel.html) via Vite
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
3. `recall/evaluator.ts` — runs FSRS-6 scheduling and short steps, updates card, appends to `review_logs`
4. `scheduler/blocker.ts` — prerequisite blocking/unblocking (separate from rating evaluation)

### Bridge & MCP Protocols

ZAM supports two transport protocols for external agents:
1. **MCP (Model Context Protocol)**: Recommended. Preferred for full agent tool integration. Start via `zam mcp` or configure a harness via `zam agent connect <harness>` (supports `claude-code`, `claude-desktop`, `antigravity`, `codex`, `opencode`, `goose`, `copilot`).
2. **Bridge CLI**: Machine-facing JSON CLI (`zam bridge <command>`) used as a fallback.

Bridge responses are always JSON, including errors. Treat `protocol.ts` types as the stable contract.

## Product principle: simplicity of use

**Ease of use is a first-class requirement**, not polish after a power-user path works. Many learners never open a terminal.

- **Studio-first for learner-facing setup.** Prefer Desktop/Settings UI over CLI-only flows. CLI/`zam bridge` stay for agents and automation; they must not be the only way through normal setup.
- **First run stays light.** Optional upgrades (multi-machine vault secrets, server DB, advanced tooling) must not block onboarding. Paste and sensible defaults remain the default; power features are skippable and “later”.
- **One clear action per step.** Short copy, good defaults, no manual third-party bookkeeping when ZAM can do it (e.g. create Bitwarden vault items instead of asking the learner to craft them by hand).
- **Degrade gracefully.** Missing optional tools → in-app guidance plus a working fallback (usually paste), never a dead end.
- Tradeoff rule: **simple for learners** over “elegant for operators”, unless an ADR says otherwise.

## Key conventions

- **Agent transport**: MCP transport (`zam mcp`) is the preferred agent connection method; `zam agent connect <harness>` handles configuration. `zam bridge` remains the fallback.
- **Optional-surface deps stay lazy**: heavy or optional integrations (the MCP transport in `src/cli/commands/mcp.ts`) must not enter the CLI's eager module graph — register a stub command that `await import()`s the implementation, built as its own dist output. `src/cli/index.ts` is a builtins-only bootstrap that classifies load failures and self-heals developer checkouts (`ZAM_NO_AUTO_HEAL=1` opts out); see ADR 2026-07-07.
- **Kernel vs. CLI boundary**: New learning logic goes in the kernel, not in CLI commands.
- **Token vs. Card distinction**: `zam token register` creates only a token. `zam bridge add-token` also creates a user card. If a concept should appear in a user's queue, ensure a card is created.
- **IDs are ULIDs** throughout — use `ulid()`, not UUIDs or numeric IDs.
- **Blocking is separate from rating**: `evaluateRating()` updates FSRS state; callers decide whether to invoke blocking after a rating of `1`.
- **`zam bridge` must emit JSON only** (stricter than `--json` flag on other commands).
- **Token metadata drives behavior**: Bloom levels drive prompt generation; `symbiosis_mode` is load-bearing.
- **FSRS tests are the source of truth** for scheduling behavior — check `tests/kernel/fsrs.test.ts` when changing scheduling or rating semantics.
- **Semantic search**: kernel stores embeddings (`token_embeddings`) and ranks (`searchTokensHybrid`); the CLI layer embeds (role `embedding`, `src/cli/llm/embedder.ts`). Never import HTTP/LLM code into the kernel.
- **OKF knowledge base (`docs/okf/`)**: living current-truth reference articles that ZAM cards cite as `source_link` (ADR 2026-07-17). Never edit bundle files by hand — write through the `zam_okf_upsert` MCP tool (it validates and regenerates `index.md`/`log.md`); a PR that changes behavior an article describes updates that article in the same PR. Decision rationale stays in ADRs; articles only reference them (`# Citations`).

## Commit format

`<type>: <short summary>` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
