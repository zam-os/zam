# Copilot instructions for ZAM

## Build, test, and lint

- `npm run build` builds two outputs via `tsup`: the CLI entrypoint at `dist/cli/index.js` and the library entrypoint at `dist/index.js`.
- `npm run dev -- <args>` runs the CLI from source through `tsx` while iterating on command behavior.
- `npm run test` runs the full Vitest suite.
- `npm run test -- tests/kernel/fsrs.test.ts` runs a single test file.
- `npm run lint` runs `biome check src/`. Biome is version-sensitive here, so if lint fails before checking code, inspect schema compatibility between `biome.json` and the installed Biome CLI first.

## High-level architecture

- `src/cli/index.ts` wires the CLI together with Commander. Files in `src/cli/commands/` are thin orchestration layers: open the database, call kernel functions, render human or JSON output, and close the connection.
- `src/kernel/` is the real application core and is intentionally AI-agnostic. `src/kernel/index.ts` is the public kernel API, and `src/index.ts` re-exports that API for programmatic use.
- `src/kernel/db/connection.ts` and `src/kernel/db/schema.ts` define the local-first SQLite store at `~/.zam/zam.db`. The database is opened with WAL mode and foreign keys enabled, so changes to persistence should preserve concurrent CLI access and relational integrity.
- The main domain split is:
  - `models/token.ts`: atomic knowledge concepts, Bloom levels, and symbiosis metadata.
  - `models/card.ts`: per-user FSRS scheduling state for each token.
  - `models/prerequisite.ts`: the dependency graph between concepts.
  - `models/review.ts`: immutable review log entries.
  - `models/session.ts`: work+learning sessions and session steps.
- The review flow spans multiple modules:
  - `scheduler/queue.ts` builds the queue from due cards and new cards, interleaves by domain, and inserts new cards every fifth slot.
  - `recall/prompter.ts` turns Bloom levels into template-based recall prompts. This is not an LLM call.
  - `recall/evaluator.ts` runs FSRS scheduling, updates the card, and appends to `review_logs`.
  - `scheduler/blocker.ts` handles prerequisite blocking and unblocking when a forgotten concept should surface its prerequisites.
- `src/cli/commands/bridge.ts` plus `src/bridge/protocol.ts` are the machine-facing integration layer for external AI CLIs. Keep bridge responses JSON-only and treat the protocol types as the stable contract for automation.

## Key repository-specific conventions

- Keep new learning logic in the kernel, not in CLI commands. Command files should stay close to I/O and argument handling.
- Preserve the distinction between a token and a card: tokens describe concepts, cards describe one user's scheduling state. `zam token register` only creates a token; `zam bridge add-token` also ensures a user card. If a concept should appear in a user's queue immediately, make sure a card is created.
- IDs are ULIDs throughout the codebase. Follow the existing `ulid()` pattern rather than introducing UUIDs or numeric IDs.
- Blocking is a separate concern from rating evaluation. `evaluateRating()` updates FSRS state and review logs, but callers decide whether to run prerequisite blocking after a rating of `1`.
- Many commands expose `--json` for scripting, but `zam bridge` is stricter: it should emit JSON only, including errors.
- Token metadata is important to behavior, not decoration. Bloom levels drive prompt generation, and `symbiosis_mode` is part of the token model.
- The existing automated coverage is centered on the FSRS scheduler in `tests/kernel/fsrs.test.ts`. Changes to scheduling behavior or rating semantics should be checked there first.
- README and CONTRIBUTING both reinforce the project's design intent: keep the kernel local-first and AI-agnostic, and prefer flows that keep the human in the loop instead of hiding the learning process.
- If you create commits from a Copilot session, `CONTRIBUTING.md` uses the format `<type>: <short summary>` with types such as `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`.
