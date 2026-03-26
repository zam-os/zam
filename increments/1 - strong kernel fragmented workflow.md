# Current state - strong kernel, fragmented workflow

## Executive summary

ZAM is already much more than an idea repository. It contains a working local-first learning kernel, a thin CLI, a machine-facing bridge, shell observation, monitor analysis, session tracking, settings, and a carefully decomposed conceptual foundation in `beliefs/`.

The strongest part of the repository is the kernel architecture and the learning-science core. The weakest part is product coherence. Phase 1 exists as a set of real subsystems, but the end-to-end workflow still depends on expert composition across commands, bridge calls, and duplicated agent instructions. The next increment should turn those parts into one stable, documented, tested loop.

## Reviewed surfaces

- Vision and contribution docs: `README.md`, `README.de.md`, `CONTRIBUTING.md`, `CLAUDE.md`
- Conceptual requirements and worldview: `beliefs/`, `docs/concepts/`
- Architecture and implementation: `src/`
- Tests and delivery config: `tests/`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `biome.json`
- Agent-facing guidance: `skills/claude-code/zam.md`, `.claude/skills/zam/SKILL.md`, `.github/copilot-instructions.md`

## Current state by layer

| Layer | Current state | Assessment |
| --- | --- | --- |
| Vision and beliefs | Strong top-level story plus a well-structured `beliefs/` hierarchy | A real strength and a good base for future planning |
| Kernel | Clear local-first architecture with SQLite, ULIDs, FSRS, queueing, blocking, analytics, observation helpers | The most mature part of the repo |
| CLI | Broad command coverage across tokens, cards, sessions, reviews, bridge, monitor, settings, and skills | Useful, but still orchestration-heavy |
| Bridge | Valuable JSON integration surface for AI CLIs | Important drift between declared types and actual JSON |
| Observation | Shell monitoring and analysis are implemented and tested | Promising differentiator, not just a concept |
| Tests | Build and tests pass; coverage focuses on pure logic | Good start, not enough for the repo's current breadth |

## What is already real

### 1. A coherent conceptual foundation

The repository has a serious theory of operation, not just implementation notes.

- `beliefs/README.md` and its child folders decompose the project's worldview into small linked statements.
- `docs/ARCHITECTURE.md` explains the intended system layers and review flow.
- `docs/concepts/` expands emerging ideas like monitoring methods, multi-repo context, and user settings.
- The bilingual README pair (`README.md`, `README.de.md`) makes the project legible to both English and German readers.

This is unusually strong for an early-stage project and gives the codebase a durable center of gravity.

### 2. A real local-first kernel

The core architecture is clean and credible.

- `src/kernel/db/connection.ts` and `src/kernel/db/schema.ts` establish the local SQLite store with WAL mode, foreign keys, and migrations.
- The data model in `src/kernel/models/` cleanly separates tokens, cards, prerequisites, reviews, sessions, settings, and agent skills.
- `src/kernel/scheduler/fsrs.ts` implements a pure FSRS-5 scheduler with configurable parameters.
- `src/kernel/scheduler/queue.ts`, `interleaver.ts`, and `blocker.ts` express the core learning behavior: due/new queueing, cross-domain interleaving, and prerequisite-aware blocking.
- `src/kernel/recall/prompter.ts` and `evaluator.ts` separate prompt generation from rating evaluation.

This layer reflects the repo's stated principle that new learning logic belongs in the kernel, not in the CLI.

### 3. A broad CLI surface

The CLI is already more complete than the top-level README suggests.

- `src/cli/index.ts` wires 10 subcommands: `init`, `token`, `card`, `session`, `stats`, `review`, `bridge`, `skill`, `monitor`, and `settings`.
- `src/cli/commands/token.ts` covers token creation, fuzzy search, listing, prerequisites, deprecation, and per-user status.
- `src/cli/commands/card.ts` covers due listings, rating submission, and unblocking.
- `src/cli/commands/session.ts` covers session start, step logging, and summaries.
- `src/cli/commands/monitor.ts` adds shell observation setup, status, and a macOS terminal opener.
- `src/cli/commands/settings.ts` exposes persistent user preferences.

This is no longer a toy CLI. It is an actual operator surface for Phase 1 experiments.

### 4. Observation is implemented, not hypothetical

The observation path is one of the repo's most distinctive strengths.

- `src/kernel/observation/shell-hooks.ts` generates shell hooks for `zsh` and `bash`.
- `src/kernel/observation/monitor-io.ts` persists JSONL monitor logs under `~/.zam/monitor`.
- `src/kernel/observation/analyzer.ts` parses logs, pairs command events, and infers ratings from help-seeking, errors, self-corrections, and timing.
- `src/cli/commands/monitor.ts` turns those pieces into a usable workflow.
- `tests/kernel/observation/analyzer.test.ts` gives this layer dedicated test coverage.

This is already a meaningful implementation of "observation over interruption".

### 5. Delivery and tooling are healthy

- `package.json` keeps the stack focused: Commander, Inquirer, better-sqlite3, ULID, tsup, Vitest, Biome.
- `tsup.config.ts` builds both the CLI and library entry points.
- `tests/kernel/fsrs.test.ts` exercises the mathematical core in detail.
- The repository builds successfully and the test suite passes.

## Strongest qualities of the repository today

### Clear architectural boundary

The CLI files are mostly thin wrappers around kernel logic, which keeps the domain model reusable and easier to test.

### High-quality conceptual scaffolding

`beliefs/` is not decorative documentation. It functions as a decomposed requirements and worldview layer that can guide future work and review.

### Credible learning engine

The FSRS implementation, queue building, interleaving, and blocking logic form a real learning kernel rather than a placeholder abstraction.

### Distinctive product differentiation

The observation pipeline is already a meaningful differentiator from generic flashcard or agent tooling.

### Good extensibility direction

The code already anticipates multiple contexts (`shell`, `ui`, `reallife`), multiple AI frontends, and a stable JSON bridge.

## Gaps, contradictions, and risks

### 1. The bridge contract is not yet the stable contract the repo claims it is

This is the single highest-risk inconsistency in the current codebase.

- `src/bridge/protocol.ts` declares types that do not match the JSON actually emitted by `src/cli/commands/bridge.ts` for `check-due`, `get-review`, `submit`, and `add-token`.
- `src/bridge/index.ts` only re-exports an older subset of protocol types and omits monitor-related shapes entirely.
- `docs/ARCHITECTURE.md` tells readers to treat `protocol.ts` as the stable contract, but the executable behavior has already drifted.

Impact: any external AI integration that trusts the declared bridge types instead of the actual CLI JSON is at risk of breaking silently.

### 2. Phase 1 is implemented as parts, not yet as one blessed workflow

The ingredients are present, but the repo still behaves like a toolkit assembled by experts.

- `session`, `monitor`, `bridge`, `settings`, `card`, and `review` commands all exist, but no single command or bridge flow defines the canonical executable-task lifecycle.
- `src/cli/commands/review.ts` runs interactive reviews without creating sessions or writing `session_steps`.
- The end-to-end behavior currently lives partly in code and partly in AI-facing skill instructions.

Impact: the project promise is stronger than the product shape. That creates friction for new contributors and external integrations.

### 3. Several core beliefs are documented more strongly than they are enforced

There are important cases where the worldview is ahead of runtime guarantees.

- `beliefs/knowledge-structure/dependency-graphs/README.md` says prerequisites are acyclic, but `src/kernel/models/prerequisite.ts` only rejects self-dependencies and does not detect cycles.
- `beliefs/symbiosis/bidirectional-learning/README.md` says agent skills decay via the same scheduling logic, but the current implementation stores `agent_skills` without any skill-card or review state.
- `beliefs/symbiosis/modes/README.md` and token metadata imply runtime mode behavior, but `symbiosis_mode` is currently stored rather than actively used to steer workflows.

Impact: the codebase risks looking more complete than it is if readers assume every documented belief is already operational.

### 4. Documentation and agent guidance have already started to drift

The repo now has several documentation surfaces that are close, but not identical.

- `docs/concepts/user-settings.md` says settings live in a local file, while the implementation stores them in SQLite via `user_config` (`src/kernel/db/schema.ts`, `src/kernel/models/settings.ts`).
- `docs/ARCHITECTURE.md` shows an 8-command CLI/module map, but `src/cli/index.ts` wires 10 subcommands.
- `skills/claude-code/zam.md` and `.claude/skills/zam/SKILL.md` differ on monitor shutdown behavior: one tells the user to run `zam monitor stop`, the other says closing the terminal is enough.

Impact: the more AI surfaces and docs are duplicated, the easier it becomes for supported workflows to diverge.

### 5. Automated coverage is too narrow for the repo's current scope

The test suite is solid where it exists, but the protected area is still small.

- `tests/kernel/fsrs.test.ts` covers the scheduler thoroughly.
- `tests/kernel/observation/analyzer.test.ts` covers command log analysis.
- Missing coverage: DB migrations, token/card/session models, bridge JSON behavior, monitor workflow, CLI command wiring, and invariant enforcement.

Impact: the repo can evolve quickly right now, but the risk of accidental contract drift is growing faster than the tests.

### 6. Tooling configuration has already drifted enough to break linting

The repository's validation story is not fully green today.

- `npm run lint` currently fails before checking source files because `biome.json` is out of sync with the installed Biome CLI.
- The failure is configuration-level: schema version mismatch plus keys that the installed Biome no longer accepts.
- `CLAUDE.md` and `.github/copilot-instructions.md` already hint that Biome version sensitivity is a known issue, which means this is not a random local glitch but an active maintenance concern.

Impact: contributors cannot treat lint as a trustworthy safety check until the config and installed tool version are brought back into alignment.

## Alignment with the stated goals in the repository

### Strong alignment

The implementation already matches several of the repo's core claims well.

- **AI-agnostic kernel**: the learning logic is genuinely separate from any LLM dependency.
- **Local-first ownership**: SQLite at `~/.zam/zam.db` is central to the implementation.
- **Human-in-the-loop learning**: tokens, cards, review logs, sessions, and observation all point toward competence retention rather than pure automation.
- **Observation over interruption**: shell monitoring is already a real subsystem, not a slide-deck idea.

### Partial alignment

These ideas are present, but not fully embodied as a product.

- **Phase 1: individual symbiosis** is represented strongly at the subsystem level, but not yet as one obvious user journey.
- **Competence-driven symbiosis modes** exist analytically, but are not yet the main control surface for runtime behavior.
- **Bidirectional learning** exists in storage and narrative, but not yet as a full review/scheduling loop for agent skills.

### Not yet aligned

These goals remain conceptual rather than implemented.

- Human goal management and the "personal repository" idea from `docs/concepts/multi-repo-context.md`
- Community and marketplace behavior from README Phase 2
- Cross-repo reasoning, involvement levels (`own`, `contribute`, `vote`), and community resource stewardship

## Interpretation

This repository is in a promising but transitional state.

It has already crossed the line from manifesto to working system. The right reading is not "too early" but "structurally ahead of its narrative and integration discipline". The codebase is ready for an increment that closes the gap between a strong kernel and a coherent Phase 1 product loop.

## Baseline validation

- `npm run build` passes
- `npm run test` passes (`47` tests across `2` test files)
- `npm run lint` currently fails before linting source because `biome.json` does not match the installed Biome CLI (`@biomejs/biome` `2.4.8`)
