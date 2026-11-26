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
1. **MCP (Model Context Protocol)**: Recommended. Preferred for full agent tool integration. Start via `zam mcp` or configure a harness via `zam agent connect <harness>` (supports `claude-code`, `claude-desktop`, `antigravity`, `codex`, `vscode`, `opencode`, `goose`, `copilot`, `hermes`, `zcode`, `grok`).
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
- **Schema changes** go in BOTH `src/kernel/db/schema.ts` and an idempotent
  numbered migration (M-series) in `runMigrations`
  (`src/kernel/db/provision.ts`), and increment `CURRENT_SCHEMA_VERSION`
  there — an existing library skips the chain once its marker is current.
- **Knowledge-base compatibility is rebuildable during the pilot** (ADR
  2026-08-14 Decisions 8–9). Bundled, unreleased fixture ids may change when
  the central model arrives. Preserve personal review evidence, use an explicit
  mapping, and never transfer mastery across an uncertain match. Question,
  slug, or embedding similarity may propose a mapping but cannot decide it.
  Canonical ids become stable only when they cross the public release contract.
  In a tile, that explicit mapping is `replaces` on a practice item — the only
  thing that moves a learner's card and review history to a new item id.
- **ZAM Academy and Free Import replace the curriculum wizard** (ADR 2026-08-14 Decision 10, superseded by ADR 2026-11-22). The manifest-driven curriculum importer and wizard UI have been removed; do not restore them. Curated school and topic packages come from **ZAM Academy**, and arbitrary personal or non-covered material uses **Free Import** (text, URLs, photos, PDFs). `findBundledCellsForScope(scope)` and `needsGenericCurriculumImport(scope)` remain in the kernel for Atlas/scope lookup (and surfaces offer ZAM Academy where the wizard used to be). Legacy bundled `de-by:` school cells are intentionally not offered in learner UI while their `replaces` migrations proceed.
- **Blocking is separate from rating**: `evaluateRating()` updates FSRS state; callers decide whether to invoke blocking after a rating of `1`.
- **Every rating submit declares its `answer_format`** (ADR 2026-09-27): `recall`, `options` for a tapped fast check followed by a self-rating, or `choice` for a rating derived from the chosen option. The kernel's tap ceiling depends on it.
- **Guided work (ADR 2026-11-15)**: subtasks are written only through `zam_work_plan`, `zam_work_hand_over` and `zam_work_close` (kernel `src/kernel/models/subtask.ts`); a colleague's work comes in only through the plan. Each answer's `instruction` carries the flow, so change those texts in `src/cli/work-handlers.ts`, not a longer skill. No card step during the work; the record at the end goes by card id, never by token id. ZAM writes no board.
- **Material import (photos, PDFs, ADR 2026-10-05)**: the model reads the file itself; the learner decides each card in one review list (Yes / No / Bonus); nothing of the material is stored — only a source link and file fingerprints. PDFs go only to models that declare `file` input. A Bonus token is published but has no card until the learner takes it.
- **Card text (ADR 2026-10-14b)**: question, concept and fast-check options may hold segments (text, math, image). Write them only through `writeCardText` (a new token passes them to `createToken`). Never put LaTeX, Markdown or HTML into a text segment or a title. A formula is allowlisted LaTeX (`tokenizeTex`) with `speech`, and an image needs `alt`. Text from a model or an agent goes through `readCardTextInput` (`agent` mode refuses, `import` mode keeps readable text).
- **Observation without content (ADR 2026-10-08)**: every screen surface checks `screenObservationGate()` before it captures, reads, spawns or analyzes anything; `observation.screen` in `~/.zam/config.json` is off by default and no setting, bridge command or MCP tool may write it. Monitor logs are read only through `readMonitorLog`, which redacts every command and drops its working directory; never add a raw read path, and redact any command text before it reaches the database.
- **Agents and library content are untrusted (ADR 2026-10-08b)**: every tool must be safe to auto-approve. A path from a tool argument or a stored link goes through `resolveTrustedPath`/`readTrustedTextFile` (`src/kernel/system/trusted-paths.ts`), never against the working directory; a URL from an argument or the library goes through `safeFetch` (`src/cli/net/safe-fetch.ts`); no argument may write a security switch (trusted folders, secret backends, observation, pairing, endpoint confirmation, Academy providers). A Studio panel command needs its entry in `STUDIO_BRIDGE_COMMANDS` with the options it refuses, and a pre-approved tool must change nothing. Secrets go to child processes on stdin or in that child's environment, never on a command line. See `docs/okf/agent-trust-model.md`.
- **`zam bridge` must emit JSON only** (stricter than `--json` flag on other commands).
- **Token metadata drives behavior**: Bloom levels drive prompt generation; `symbiosis_mode` is load-bearing.
- **FSRS tests are the source of truth** for scheduling behavior — check `tests/kernel/fsrs.test.ts` when changing scheduling or rating semantics.
- **Semantic search**: kernel stores embeddings (`token_embeddings`) and ranks (`searchTokensHybrid`); the CLI layer embeds (role `embedding`, `src/cli/llm/embedder.ts`). Never import HTTP/LLM code into the kernel. The one exception is the binding-free database driver in `src/kernel/db/remote/hrana.ts`, which is transport for the `Database` contract, not an integration. Anything else that needs HTTP takes it as an injected function (see `ReferenceFetcher`).
- **OKF knowledge base (`docs/okf/`)**: living current-truth reference articles that ZAM cards cite as `source_link` (ADR 2026-07-17). Never edit bundle files by hand — write through the `zam_okf_upsert` MCP tool (it validates, updates only the article's `index.md` entry, and adds a `log.md` entry in the existing dated-bullet or ZAM date-heading format; missing navigation files use ZAM defaults); a PR that changes behavior an article describes updates that article in the same PR. Decision rationale stays in ADRs; articles only reference them (`# Citations`).
- **ZAM Academy cells (ADR 2026-10-19, amended by ADR 2026-11-22)** are maintained in `zam-os/zam-academy` next to their training apps, never edited here. A release copies them with `npm run academy:sync`, and `tests/kernel/academy-cells-lock.test.ts` fails on a hand edit. Only a learner's action reads `https://academy.zam-os.org` (`zam bridge academy-*`, Mobile's tap). Listing fetches only `catalog.json` and `academy.json` in parallel; individual `cell.json` files download lazily on „Aufnehmen“ / „Aktualisieren“. The origin is a constant, redirects fail, and agent tools read only the cache in `~/.zam/academy` (`zam_bundled_cells_list` surfaces uncached catalog entries with `requiresLearnerEnrol: true`, and `zam_bundled_cell_enrol` directs the learner to click „Aufnehmen“ in ZAM Academy for uncached entries). A card's web `source_link` opens in the system browser only on a click, only for http(s) (`desktop/src/source-link.ts`). Integrating new cells and replacing the `de-by:` school cells follows `docs/plans/2026-11-08-academy-cell-integration.md`.
- **Private Academy providers (ADR 2026-11-25)** publish Academy-format packages behind a login on their own origin. Never name a provider, host or tenant in this repository (tests use `example-provider` / `https://provider.example`), and never bundle or `academy:sync` a provider cell. The confirmed-provider list (`academy.providers` in `~/.zam/config.json`) is a security switch: only Studio's „Anbieter hinzufügen“ and `zam academy provider add` write it, with the hash the learner saw. The Azure CLI token goes only to the confirmed origin, built from GUID-checked values (`entraCliApiToken`). A provider tile installs with `installKvtTile({ provider })`. The library pins each namespace to its confirmed origin (M051), and the installer checks ownership of atom, item, `replaces` and `retired_items` ids (`tile_atoms`, M050). In a team library a curator installs (`zam team install-cell`) and members enrol from the library (`enrolInstalledTile`); agent tools read only the per-provider cache and the library (`src/cli/academy/agent-cells.ts`).
- **Knowledge map (`docs/knowledge-map/map.json`)**: ZAM's own repository knowledge map (ADR 2026-10-03), one-sentence statements that each cite repo files. Like an OKF article, it changes in the same PR as what it describes: a PR that makes a statement untrue, or renames, moves or deletes a cited file, updates the map (keep existing ids) and checks it with `npm run dev -- knowledge-map validate --repo . --write`. The "ZAM's own map" test in `tests/cli/knowledge-map.test.ts` fails CI while the map has any error or warning.

## Commit format

`<type>: <short summary>` — types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
