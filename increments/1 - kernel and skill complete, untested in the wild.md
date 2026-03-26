# Increment 1 — Kernel and Skill Complete, Untested in the Wild

> Current state review as of 2026-03-26

## What exists

ZAM is a working CLI application (`v0.1.0`) that implements the full Phase 1 vision described in the README: an AI-agnostic learning kernel that enables spaced repetition during real work, integrated with AI CLIs through a JSON bridge protocol.

### Kernel (`src/kernel/`, ~2400 lines)

The kernel is the strongest part of the codebase. It is well-structured, AI-agnostic, and internally consistent.

**Data model (8 tables):**
- `tokens` — atomic knowledge concepts with Bloom levels (1-5), domain, symbiosis mode
- `cards` — per-user FSRS scheduling state (stability, difficulty, reps, lapses, due date, blocked)
- `prerequisites` — directed dependency graph between tokens
- `review_logs` — immutable audit trail of every rating event
- `sessions` / `session_steps` — work+learning episodes with per-step actor and rating
- `agent_skills` — task recipes the agent learns from user guidance
- `user_config` — key-value settings store

**FSRS-5 scheduler (297 lines, pure functions):**
- Correct implementation of the 19-weight FSRS-5 algorithm
- Handles all card states: new -> learning -> review, with relearning on forget
- Stability, difficulty, retrievability, and interval formulas match the reference spec
- Tested with 30 assertions covering all state transitions, boundary conditions, and purity

**Review flow:**
- Queue builder fetches due + new cards, sorts by urgency, interleaves by domain (max 2 consecutive from same domain), intersperses new cards every 5th position, caps at 50
- Bloom-adapted prompt templates (remember/understand/apply/analyze/synthesize)
- Rating evaluator coordinates FSRS scheduling with review logging
- Prerequisite blocker: forget triggers blocking, surfaces prerequisites, unblocks when prerequisites reach reps >= 1

**Observation layer:**
- Shell hook generation for zsh and bash (preexec/precmd capturing to JSONL)
- Monitor I/O for reading/writing observation logs
- Pure-function analyzer: parses command logs, matches against token patterns, infers ratings from help-seeking, error rate, self-corrections, and inter-command timing gaps
- 17 test assertions for the analyzer

**Analytics:**
- User stats dashboard (tokens, cards, due, blocked, mature, avg stability, sessions)
- Domain competence with suggested symbiosis mode (shadowing/copilot/autonomy based on retention and stability thresholds)

### CLI (`src/cli/`, ~2500 lines)

10 command groups, each thin orchestration: open DB, call kernel, render, close.

| Command | Subcommands | Notes |
|---------|-------------|-------|
| `init` | — | Creates ~/.zam/ and runs schema |
| `token` | register, find, list, prereq, deprecate, status | Full token lifecycle |
| `card` | due, update, unblock | FSRS scheduling + blocking |
| `review` | — | Interactive terminal review (inquirer prompts) |
| `session` | start, log, end | Work+learning episodes |
| `stats` | — | Dashboard + domain competence |
| `skill` | list, show, add | Agent skill recipes |
| `monitor` | start, stop, status, open | Shell observation hooks + macOS terminal spawning |
| `settings` | show, get, set, delete | User preferences |
| `bridge` | check-due, get-review, submit, get-skill, add-token, get-monitor, analyze-monitor | JSON-only machine API |

### AI Skill Layer

Two copies of the same skill definition (one at `skills/claude-code/zam.md`, one at `.claude/skills/zam/SKILL.md`). The skill defines a complete session protocol with 5 steps: start/check -> knowledge plan -> session start -> observe/rate -> end session. Well-written, comprehensive.

### Beliefs (`beliefs/`, 15 files)

A tree of foundational premises with max 7 components each:
- **Symbiosis**: modes, bidirectional learning, observation over interruption
- **Forgetting**: prerequisite blocking, skill decay
- **Knowledge structure**: token-card separation, dependency graphs
- **Learning in context**: session model, interleaving
- **Openness**: bridge protocol

### Documentation

- README.md (EN + DE) — clear vision statement with Phase 1/2 breakdown
- ARCHITECTURE.md — comprehensive 307-line doc covering everything from FSRS formulas to the module map
- CONTRIBUTING.md — community-oriented, values-driven
- docs/concepts/ — monitoring methods, multi-repo context, user settings

### Build & Tooling

- TypeScript (strict), ESM, tsup (dual CLI + library build), vitest, biome
- 2 test files, 47 passing tests, 705 lines of test code
- Build succeeds cleanly

---

## What works well

1. **Clean kernel/CLI separation.** The kernel has zero UI or CLI concerns. Every model function takes a `Database` parameter. The CLI is truly thin.

2. **FSRS-5 implementation is solid.** Pure functions, no side effects, no mutation. The test suite covers all state transitions. This is production-quality scheduling.

3. **The beliefs folder is a novel and effective idea.** Treating foundational premises as versioned, decomposed, reviewable artifacts — with change protocol and cross-links — is genuinely innovative. It serves both human understanding and agent context loading.

4. **The bridge protocol is well-designed.** JSON-only, stable field contract, typed in TypeScript, covers the full learning cycle. An AI CLI that follows the skill document can drive a complete learning session.

5. **The observation analyzer is thoughtful.** Inferring ratings from shell behavior (help-seeking, error rate, self-corrections, timing) is a practical approach to silent assessment. The heuristic is reasonable and testable.

6. **Documentation quality is high.** ARCHITECTURE.md alone is a better-than-average project doc. The beliefs folder adds a dimension most projects lack entirely.

---

## What needs attention

### Must fix

1. **Biome config schema mismatch.** `biome.json` references schema `2.0.0` but the installed Biome is `2.4.8`. The `organizeImports` key and `files.ignore` key are unrecognized. `npm run lint` fails. The CLAUDE.md warns about this but doesn't fix it.

### Structural gaps

2. **No integration or end-to-end tests.** The 47 tests cover FSRS math and observation analysis — both pure functions. There are no tests for:
   - Token/card/session model CRUD (database interaction)
   - The review queue builder
   - The rating evaluator (FSRS + DB + review log combined)
   - The blocker (cascade block + unblock)
   - Any CLI command
   - Any bridge command

3. **Duplicate skill files.** `skills/claude-code/zam.md` and `.claude/skills/zam/SKILL.md` are nearly identical but have diverged (the .claude version has settings integration and --quiet/--summary flags the other doesn't). One should be the source of truth.

4. **No user identity management.** Every command requires `--user <id>` but there is no concept of "current user." The skill document uses `<username>` as a placeholder. A first-time user has no obvious way to know what user ID to use.

5. **No real-world validation.** Issue #1 shows that even the project creator encountered problems: Gemini couldn't find the skill, and the session protocol didn't wait for answers. The system has not been tested end-to-end with any AI CLI in a real learning session beyond initial experiments.

6. **No CI/CD.** No GitHub Actions, no automated test/build/lint pipeline. The lint failure could have been caught before merge.

### Design gaps

7. **Multi-user is designed but not exercised.** Token-card separation supports multiple users per token, but there is no user registration, no user listing, no default user. The system is conceptually multi-user but practically single-user.

8. **Agent skills have no review cycle.** The beliefs say agent skills decay and need revalidation via FSRS. The code stores skills with `token_slugs` links, but there is no mechanism to schedule skill revalidation or flag stale skills.

9. **Symbiosis mode is stored but not acted upon.** The `symbiosis_mode` field exists on tokens and `getDomainCompetence()` suggests modes, but nothing in the system actually changes behavior based on the current mode. The skill document describes the three modes, but the agent implements only shadowing.

10. **No cycle detection in prerequisites.** The beliefs state "acyclic — circular dependencies are not allowed." The code prevents self-referential prerequisites (`tokenId === requiresId`) but does not detect transitive cycles (A requires B requires C requires A).

11. **The `execution_context` field (shell/ui/reallife) is stored but unused.** Sessions record their context, but no code reads it to change behavior.

---

## Metrics

| Metric | Value |
|--------|-------|
| Source code | 4,884 lines (TypeScript) |
| Test code | 705 lines |
| Test coverage | FSRS scheduler + observation analyzer only |
| Passing tests | 47 / 47 |
| Build | clean |
| Lint | fails (biome config mismatch) |
| Dependencies | 4 runtime (commander, better-sqlite3, inquirer, ulid) + 6 dev |
| Commits | 18 |
| Open issues | 1 (Gemini skill integration) |
| Open PRs | 1 (this planning discussion, draft) |

---

## Summary

ZAM's kernel is well-built. The FSRS implementation, the data model, the bridge protocol, and the beliefs tree are all solid foundations. The gap is between the built system and a validated system: no integration tests, no CI, no real-world usage loop, and several designed-but-dormant features (symbiosis modes, agent skill revalidation, cycle detection). The immediate risk is that the system appears complete but breaks in practice — as Issue #1 already demonstrates with Gemini.

The codebase is ready for its first real-world proving cycle.
