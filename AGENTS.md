# Agent instructions for ZAM

Rules for **all** coding agents/harnesses working in this repo (Codex,
Antigravity/Gemini, Claude Code, …). [CLAUDE.md](CLAUDE.md) carries the same
conventions in longer form — if anything here seems to conflict with it,
CLAUDE.md wins. Architecture decisions live in [docs/adr/](docs/adr/).

## Architecture in one paragraph

Two layers. **Kernel** (`src/kernel/`): the AI-agnostic learning engine —
zero LLM dependencies, no HTTP to model endpoints, ever. `src/kernel/index.ts`
is its public API. **CLI** (`src/cli/`): thin orchestration — commands open
the DB, call kernel functions, render output. Everything that talks to an
LLM/embedding endpoint lives in `src/cli/llm/`. New learning logic goes in
the kernel; new HTTP goes in the CLI layer.

## Hard rules

- **Kernel stays AI-agnostic.** No fetch/LLM/embedding calls under
  `src/kernel/`. The kernel stores vectors and ranks; the CLI layer embeds.
- **`zam bridge` emits JSON only** — every output through the existing
  `jsonOut`/`jsonError` helpers in `src/cli/commands/bridge.ts`. No stray
  `console.log`.
- **MCP transport** (`zam mcp`) is the preferred agent connection method; `zam agent connect <harness>` handles configuration. `zam bridge` remains the fallback.
- **Database access only through the async `Database` contract**
  (`src/kernel/db/types.ts`): `await db.prepare(...).run/get/all(...)`.
  Never import a concrete driver (better-sqlite3/libsql) outside
  `src/kernel/db/`. BLOBs come back as `Buffer` *or* `Uint8Array` depending
  on provider — handle both.
- **No new dependencies** (npm or native) without explicit approval from
  Thomas. `package.json` changes are a red flag in review.
- **IDs are ULIDs** (`ulid()`), never UUIDs or numeric ids.
- **Schema changes** go in BOTH `src/kernel/db/schema.ts` and an idempotent
  numbered migration (M-series) in `runMigrations`
  (`src/kernel/db/connection.ts`).
- **Token vs card**: a token is shared knowledge; a card is per-user FSRS
  state. A concept only appears in a user's queue if a card exists.
- New kernel API must be re-exported from `src/kernel/index.ts`.

## Verification — required before every commit

```bash
npm run format     # Biome, fixes formatting in place
npm run lint       # must be clean
npm run typecheck  # must be clean
npm run test       # full Vitest suite, all pre-existing tests stay green
npm run build      # tsup must succeed
```

Run a single test file during iteration with:
`npm run test -- tests/kernel/<file>.test.ts`

## Commits and branches

- Format: `<type>: <short summary>` — types `feat`, `fix`, `docs`,
  `refactor`, `test`, `chore`.
- Multi-phase features: **one branch, one PR**, one commit per phase — no
  per-phase branches.
- Do not push or open PRs unless explicitly asked.

## Working from an implementation plan

Active plans live in `docs/plans/` and contain a **Status** section with
checkboxes. Implement **exactly the next unchecked phase**, nothing more.
Treat checked phases as documentation of code you inherit. If the plan is
ambiguous or wrong, say so in your report — do not silently work around it.
