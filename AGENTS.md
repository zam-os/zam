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

## Product principle: simplicity of use

**Ease of use is a first-class requirement**, not a polish pass after the
feature works for power users. ZAM’s audience includes learners who will not
open a terminal.

- **Studio-first for learner-facing setup.** Prefer Desktop/Settings UI over
  CLI-only paths. CLI and `zam bridge` stay for automation and agents; they
  must not be the only way to complete a normal setup step.
- **First run stays light.** Optional upgrades (multi-machine vault secrets,
  server DB, advanced 2FA tooling) must not block or complicate onboarding.
  Paste/defaults remain the default path; power features are skippable and
  “later”.
- **One clear action per step.** Short copy, sensible defaults, no manual
  third-party bookkeeping when ZAM can do it (e.g. create Bitwarden items
  instead of asking the learner to craft vault entries by hand).
- **Degrade gracefully.** Missing optional tools (CLI not installed, vault
  locked) → clear in-app guidance and a working fallback (usually paste),
  never a dead end.
- When a design tradeoff is “elegant for operators” vs “simple for learners”,
  **choose simple for learners** unless an ADR explicitly says otherwise.

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
- **A published practice-item ULID is frozen** (ADR 2026-08-14 Decision 8): a
  shipped item id is never re-minted. Cards and `review_logs` reference it, so
  a fresh id for the same question orphans learning history. Atom ids may still
  move — nothing personal points at them.
- **Schema changes** go in BOTH `src/kernel/db/schema.ts` and an idempotent
  numbered migration (M-series) in `runMigrations`
  (`src/kernel/db/connection.ts`).
- **Token vs card**: a token is shared knowledge; a card is per-user FSRS
  state. A concept only appears in a user's queue if a card exists.
- New kernel API must be re-exported from `src/kernel/index.ts`.
- **`docs/okf/` is not hand-editable.** It is an OKF knowledge bundle whose
  articles are learning sources (ADR 2026-07-17): write only through the
  `zam_okf_upsert` MCP tool, update the covering article in the same PR
  that changes described behavior, and keep decision rationale in ADRs —
  articles reference them under `# Citations`.

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
