# Increment 2 — Prove It Works, Fix What Breaks

> Proposed next increment following [Increment 1](1%20-%20kernel%20and%20skill%20complete%2C%20untested%20in%20the%20wild.md)

## Principle

The kernel exists. The skill exists. The beliefs exist. What does not exist is proof that the system works end-to-end when a real person uses it with a real AI CLI. Increment 2 closes this gap: make the system actually usable, test it, and fix what breaks.

No new features. No new concepts. Just: **make what exists reliable and validated.**

---

## Changes (7)

### 1. Fix the build pipeline

**What:** Fix the biome.json schema mismatch so `npm run lint` passes. Add a GitHub Actions CI workflow that runs `build`, `test`, and `lint` on every push and PR.

**Why:** The lint failure has been silently ignored since the Biome upgrade. Without CI, regressions land on main undetected. This is the foundation for all other changes — no code should merge without green checks.

**Scope:** Update `biome.json` to schema `2.4.8`, fix any lint errors that surface. Add `.github/workflows/ci.yml`.

---

### 2. Add integration tests for the kernel

**What:** Add test files for the database-touching kernel functions:
- Token CRUD + find + deprecate
- Card ensure + due + update
- Prerequisite add + get + dependents
- Review queue builder (with interleaving assertions)
- Rating evaluator (FSRS + DB write + review log)
- Cascade block + unblock

**Why:** The existing 47 tests cover pure functions only. Every database interaction is untested. The review queue builder — the most complex coordination point in the kernel — has zero assertions. When something breaks in production (as Issue #1 suggests), there is no safety net.

**Scope:** Tests use an in-memory SQLite database (`:memory:` + initialize). No mocks, no filesystem. Each test file is self-contained.

---

### 3. Establish a default user identity

**What:** Add a `zam whoami` command and the concept of a default user. On first `zam init`, prompt for a username (or accept `--user <name>`). Store in `user_config` as `default_user`. All commands that take `--user` fall back to the default when the flag is omitted.

**Why:** Every command currently requires `--user <id>`. The skill document uses `<username>` as a placeholder. A new user has no idea what to pass. The bridge commands, the stats command, the review command — all require the user to know their ID before they can do anything. This is the single biggest friction point for first-time use.

**Scope:** Touches `init.ts` (prompt or flag), `settings.ts` model (for default_user), and every command that has `--user` (make it optional with fallback). The bridge protocol adds a `whoami` command.

---

### 4. Consolidate the skill file to one source of truth

**What:** Remove `skills/claude-code/zam.md`. Make `.claude/skills/zam/SKILL.md` the canonical source. Add a symlink or a one-line pointer in the skills folder for discoverability.

**Why:** Two copies of the same file have already diverged. The .claude version has settings integration, `--quiet` flags, `--summary` for review sessions, and the "close the terminal" instruction. The other version lacks these. Maintaining two files guarantees future drift.

**Scope:** Delete one file, ensure the remaining one is referenced correctly from wherever skills are discovered. Address Issue #1 (Gemini can't find the skill) by documenting the expected skill location for each AI CLI.

---

### 5. Add prerequisite cycle detection

**What:** When `addPrerequisite(db, tokenId, requiresId)` is called, check for transitive cycles before inserting. Throw an error if the new edge would create a cycle.

**Why:** The beliefs explicitly state "acyclic — circular dependencies are not allowed." The code only prevents A-requires-A. A user (or agent) registering A-requires-B, B-requires-C, C-requires-A would create a cycle that makes the blocker loop forever. This is a correctness issue, not a feature.

**Scope:** Add a `wouldCreateCycle(db, tokenId, requiresId): boolean` function to `prerequisite.ts`. Call it from `addPrerequisite`. Add test cases for direct and transitive cycles.

---

### 6. Run a documented end-to-end session with Claude Code

**What:** Use ZAM with Claude Code to complete a real task (e.g., "set up a new npm project from scratch"). Document the full session: what the agent did, what the user did, what broke, what worked. File issues for anything that needs fixing. Record the session as a reference for contributors.

**Why:** Issue #1 exists because the system was tested with Gemini and broke. No end-to-end session has been documented for Claude Code either. The skill document describes a protocol that may have bugs only a real session reveals: timing, bridge call order, error handling when a token already exists, what happens when the user types something unexpected.

**Scope:** This is a manual task, not a code change. The output is a markdown file in `docs/sessions/` documenting the experience, plus any issues filed. It validates everything from Increment 1 and surfaces the bug list for Increment 3.

---

### 7. Write a quickstart guide

**What:** Add a `docs/quickstart.md` that walks a new user from `npm install` to completing their first ZAM session in under 5 minutes. Cover: init, first token, first review, what to expect.

**Why:** The README describes the vision. ARCHITECTURE.md describes the internals. The skill document describes the AI agent protocol. But there is no document that says "you are a person who just cloned this repo — here's how to use it." The CONTRIBUTING.md says "fork and clone" but not "here's how to actually experience ZAM."

**Scope:** One file. References `zam init`, `zam token register`, `zam review`, `zam stats`. No new code — just the guide.

---

## What this increment does NOT include

- No new observation levels (screen, real-life)
- No symbiosis mode automation (remains manual/advisory)
- No agent skill revalidation scheduling
- No multi-user features beyond default user
- No Phase 2 community features
- No npm publishing or distribution

These are all valid future increments. This increment is about making the existing system trustworthy before extending it.

---

## Success criteria

After Increment 2:

1. `npm run build && npm run test && npm run lint` all pass
2. CI runs on every push and PR
3. Kernel integration tests cover all database-touching functions
4. A new user can `zam init` and start a session without guessing a user ID
5. One canonical skill file exists
6. Prerequisite cycles are rejected
7. At least one documented end-to-end session exists as a reference
