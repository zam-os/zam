# Resilient Self-Update and Dependency-Failure Isolation

**Status:** Accepted (2026-07-07 — Fable 5 review incorporated, open decisions resolved)
**Deciders:** Thomas (project owner)
**Relates to:** [2026-06-13b Approachable Setup and Self-Update](2026-06-13b-approachable-setup-and-self-update.md) · [2026-07-06a MCP as the Canonical Agent Transport](2026-07-06a-mcp-agent-transport-and-surfaces.md)

---

## Context

`zam update` on the developer channel is a source-checkout self-update: `git pull --ff-only` → `npm install` → `npm run build` → `zam setup --force` (established in ADR 2026-06-13b). It works — *when it runs*. It does not run when the CLI cannot load, and a single missing runtime dependency is enough to stop it loading.

The concrete failure that triggered this ADR:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@modelcontextprotocol/sdk'
    imported from C:\src\github\zam\dist\cli\index.js
```

The chain that produces it:

1. ADR 2026-07-06a (MCP transport, v0.9.0) added `@modelcontextprotocol/sdk` and `zod` as dependencies. Their **only** consumer is `src/cli/commands/mcp.ts`.
2. `src/cli/index.ts` imports `mcpCommand` **statically**, so `mcp.ts` — and therefore its top-level `import … from "@modelcontextprotocol/sdk/…"` and `import { z } from "zod"` — sit in the CLI's *eager* module graph. `tsup` externalizes runtime deps, so `dist/cli/index.js` emits those imports verbatim at the top of the bundle.
3. If a checkout advances to v0.9.0 source and is rebuilt without a matching `npm install` (`tsup` does not resolve externalized imports, so the **build succeeds even with the dependency uninstalled**), `node_modules` lacks those two packages. ESM resolution throws `ERR_MODULE_NOT_FOUND` at load, before any command body runs.
4. `update` lives inside that same crashing module graph. **The one command that would `npm install` the missing dependencies is itself unreachable.** Self-update cannot self-heal.

The observed checkout confirms the shape: `commander`, `ulid`, `better-sqlite3`, and `@inquirer` were present; only the two v0.9.0 additions were absent. `dist/` is gitignored, so a plain `git pull` never desyncs it — the desync appears when a build runs without the matching install.

The immediate operational remedy is `npm install`. This ADR is about preventing recurrence: a stale, partial, or interrupted dependency tree should degrade **legibly and locally** — and, on the developer channel, heal itself — instead of bricking the whole tool. The update path must never claim success over a build that cannot launch.

## Goal

Make the CLI and its self-update resilient to a `node_modules` that is out of sync with `package.json`:

- An optional/heavy surface's missing dependency degrades **only that surface**, not every command.
- The developer update **verifies its own result** and refuses to report success over a broken build.
- When the tool cannot load, it **repairs itself where safe** (developer checkout) and otherwise prints an actionable message instead of a raw Node stack trace.

Non-goal: turning ZAM into a plugin system or lazy-loading every command. The eager graph is fine for genuinely-required core dependencies; the problem is *optional* dependencies riding in it.

## Decisions

### 1. Isolate optional transport dependencies from the eager module graph

Load `mcp.ts` — and therefore the MCP SDK and `zod` — **lazily**. The program registers a lightweight stub `Command("mcp")` (same name and description; the real command takes no options or arguments today, so `--help` parity is trivial) whose `.action()` performs `await import("./commands/mcp.js")` and delegates.

- `createMcpServer(db)` remains exported from `commands/mcp.ts`; `tests/cli/mcp.test.ts` imports it from source and continues unchanged.
- The stub does **not** catch import failures. A missing-package rejection bubbles through `parseAsync` to the bootstrap (Decision 3), which classifies it and — on the developer channel — auto-heals and re-execs. One uniform recovery path; no bespoke error UX in the stub. All bootstrap output goes to stderr, so a harness-spawned `zam mcp` keeps stdout protocol-clean.
- Consequence: a missing/partial MCP install can no longer take down `update`, `review`, `whoami`, etc. — and on a developer checkout, `zam mcp` itself comes back after one self-heal cycle.
- Boundary (deliberate): this fixes the *observed* class — the transport deps, which nothing else needs at load time. A missing *core* dependency (`commander`, `better-sqlite3`) still fails the whole eager graph — that residual class is Decision 3's job.
- Build shape: the lazily imported module becomes its own output (`dist/cli/commands/mcp.js`) so the SDK imports stay out of the main bundle's graph. `mcp.ts`'s own `package.json` lookup already has a fallback chain that covers this depth (verified for `dist/cli/commands/` and the desktop bundle layout). Exact tsup mechanics (code splitting vs runtime-external import) are an implementation-plan decision.

Rationale: the fix should match the coupling that caused the bug. The MCP SDK + `zod` are used by exactly one surface; there is no reason for the whole CLI to depend on them at load time.

### 2. The developer update verifies its own result (kernel-planned smoke test, clean-room retry)

`planUpdate` in the kernel gains a new step kind — `smoke-test` — between `npm-build` and `distribute-skills` on the developer channel, keeping the repo's "kernel decides, CLI executes" boundary: the sequencing stays pure and unit-tested in `tests/kernel/update-check.test.ts`.

`applyDeveloperUpdate` implements the step: spawn `process.execPath dist/cli/index.js --version` (output captured, not inherited) and require exit code 0.

- **Depth (resolved):** `--version` only. It is load-only — no DB, no network — and loading the CLI resolves the **entire eager command graph**, so this one flag exercises exactly the layer that failed here, in under a second.
- **Failure path (resolved):** one automatic clean-room retry, internal to the executor (the kernel plan stays a linear step list): `npm ci` → `npm run build` → re-run the smoke test. If it still fails, print the captured stderr/stdout plus recovery guidance and exit non-zero. **Never print the success banner over a build that cannot launch.** `npm ci` wipes `node_modules` — acceptable because this branch only runs when the tree is already broken.
- Note: `npm install` already triggers `prepare` → build; the explicit `npm run build` step stays (deterministic even under configs like `--ignore-scripts`), accepting an occasionally redundant, cheap rebuild.

### 3. Load-time preflight via an inverted entry, with developer-channel auto-heal

Rather than repointing `bin` at a new bootstrap file (this ADR's first draft), invert the entry **in place**:

- Move the program wiring of `src/cli/index.ts` verbatim into a new `src/cli/app.ts`.
- `src/cli/index.ts` becomes a bootstrap whose bundle depends **only on Node builtins**: `try { await import("./app.js"); } catch (err) { classify → heal or report }`. Pure logic (classification, recovery planning) lives in a side-effect-free module (e.g. `src/cli/bootstrap/logic.ts`) compiled into the bootstrap bundle and unit-testable in isolation.
- `bin` stays `dist/cli/index.js`. Verified consequences:
  - **Zero packaging ripple.** `scripts/prepare-desktop-bridge.mjs` copies `dist/` recursively and *generates* the bundled `package.json` from the root one; lockfile `bin` metadata refreshes through npm itself. Nothing needs hand-propagation.
  - **Every existing shim and spawn keeps working and gains the preflight**: the npm global shim, the desktop bundle, `ui.ts`'s GUI-bridge spawn, and `applyDeveloperUpdate`'s own `setup --force` re-spawn all target `dist/cli/index.js`.
  - A **half-built `dist/`** (bootstrap present, `app.js` missing) is itself caught and classified.

**Classification** (pure `classifyLoadError(err)`):

| Signal | Class | Remedy |
|---|---|---|
| `ERR_MODULE_NOT_FOUND`, bare package name | dependencies out of sync | `npm install` |
| `ERR_MODULE_NOT_FOUND`, relative path | stale/partial build | `npm run build` |
| `ERR_DLOPEN_FAILED` | native ABI mismatch (e.g. `better-sqlite3` after a Node major change) | `npm rebuild better-sqlite3` |
| anything else | ordinary error | **pass through unchanged** |

The pass-through default is load-bearing: `app.ts` ends in top-level `await program.parseAsync()`, so *ordinary command rejections* surface through the same `import()` promise. The bootstrap must never mislabel a command failure as an install problem.

**Auto-heal (resolved: full auto-heal).** For the three fixable classes the bootstrap repairs the checkout automatically — including non-interactive contexts — then re-execs the original command once:

- **Guards:** developer channel only (bootstrap reads `~/.zam/config.json` directly with `node:fs`, replicating the tiny channel-default rule; it must not import kernel code); the walked-up repo root must contain both `package.json` and `.git` (a packaged/desktop layout has no `.git` → instruct-only); loop guard via an env flag (e.g. `ZAM_BOOTSTRAP_HEALED=1`) so heal-and-re-exec happens at most once; `ZAM_NO_AUTO_HEAL=1` opts out (CI, debugging).
- **Mechanics:** run the class's remedy with output forwarded to **stderr** (never stdout — a harness-spawned `zam mcp` must keep stdout protocol-clean), then re-exec `process.execPath` with the original argv and inherited stdio, propagating the child's exit code. If the re-exec still fails, print the classified instructions (including `npm ci` and `zam update`) and exit non-zero.
- **Accepted trade-offs (chosen deliberately):** a harness-spawned `zam mcp` on a broken checkout incurs an npm-install delay at startup instead of hard-failing (the harness may time out once; the checkout is fixed for the next spawn). Two concurrent zam invocations on a broken checkout may race their heals; npm tolerates this, worst case is redundant work.

Relationship to the existing `zam doctor`: `doctor` is **knowledge-base** repair (titles, umlauts, duplicates, domains, contexts) — it opens the DB and runs well after load. The preflight is a **pre-load, pre-DB** concern and cannot be a `doctor` task. They stay separate.

Correction from the first draft: a hashbang at the start of *any* module is valid ES2023 syntax (supported long before Node ≥ 22, which `engines` requires), so no shebang/banner rearrangement is needed — the `tsup` banner and `bin` stay exactly as they are.

## Resolved decisions (2026-07-07)

1. **Auto-heal policy → full auto-heal** (developer channel only, once-guarded, `ZAM_NO_AUTO_HEAL` opt-out, stderr-only output). Chosen over TTY-gated offer.
2. **Install command → `npm install`, with an automatic one-shot `npm ci` + rebuild retry when the smoke test fails.**
3. **`zam doctor install` → deferred.** The integrity check ships inside the bootstrap; extracting an on-demand doctor task is a follow-on if wanted.
4. **Smoke-test depth → `--version` only.**

## Scope

### In

- `src/cli/app.ts` extraction + bootstrap `src/cli/index.ts` + `tsup.config.ts` update (three CLI outputs: bootstrap, app, lazy `mcp`).
- Pure bootstrap logic (`classifyLoadError`, recovery planning incl. channel/root/env guards) + unit tests, including the pass-through default.
- Auto-heal execution: remedy subprocess (stderr-forwarded) + single re-exec + failure copy.
- Lazy `mcp` registration with `--help` parity; `createMcpServer` export retained (`tests/cli/mcp.test.ts` unchanged).
- Kernel: `smoke-test` step kind in `planUpdate` + tests in `tests/kernel/update-check.test.ts`.
- CLI: smoke-test execution + `npm ci` clean-room retry + failure copy in `applyDeveloperUpdate`.
- Fault-injection verification as part of the increment's final check: with `@modelcontextprotocol/sdk` temporarily hidden, `zam update check` works and `zam mcp` recovers via auto-heal; with a core dep hidden, the bootstrap heals or (with `ZAM_NO_AUTO_HEAL=1`) prints the classified message, not a raw stack.
- Docs: this ADR's status + index row; CLAUDE.md gains the lazy-optional-deps convention; README "Keeping ZAM up to date" only if wording changes.

### Out (follow-on)

- Lazy-loading commands other than `mcp` (observer sidecar, UI/Tauri bridge) — same pattern, only if a real dependency-isolation need appears.
- A general plugin/extension system.
- Changes to the winget / Homebrew / direct (signed desktop) update channels — untouched.
- Auto-repair on non-developer channels (nothing to `npm install` in a packaged layout).
- `zam doctor install` on-demand integrity task.

## Risks

- **Bootstrap misclassification.** Ordinary command errors arrive through the same catch as load failures. Mitigate: explicit pass-through default, classifier unit tests per class, fault-injection e2e.
- **Auto-heal misfire.** An npm run in a context the user didn't expect. Mitigate: developer-channel + `.git` guards, single-shot loop guard, `ZAM_NO_AUTO_HEAL` escape hatch, all output on stderr, remedy commands limited to the classified fix.
- **Harness startup latency.** First `zam mcp` spawn on a broken checkout runs an install; the harness may time out once. Accepted by decision; the checkout is fixed for the next spawn.
- **Lazy `mcp` regressions.** Help listing/routing parity; `tests/cli/mcp.test.ts` must stay green; module-level state in the lazily loaded bundle is process-local anyway (`zam mcp` processes run only the MCP path).
- **Build-shape fragility.** The bootstrap's `./app.js` and the stub's `./commands/mcp.js` imports must resolve at runtime in `dist/`. Mitigate: the Decision 2 smoke test loads the full graph on every developer update; the fault-injection check exercises the built shape directly.
- **False confidence.** The `--version` smoke test proves the module graph *loads*; it does not prove commands behave. Acceptable — load-time resolution is precisely the failure class this ADR targets.

## Consequences

- The failure that motivated this ADR becomes impossible for the transport deps (Decision 1) and **self-correcting** for everything else on a developer checkout (Decision 3): any entry-level load failure lands in a small dependency-free bootstrap that fixes the tree and re-runs the command, or names the remedy where it can't. A broken rebuild can no longer masquerade as an update success (Decision 2).
- Existing installs need no migration: `bin`, shims, and packaging are untouched; they gain the preflight on their next rebuild.
- New rule of thumb for the codebase: **an optional surface's dependencies must not sit in the eager module graph.** New agent transports/integrations follow the lazy-`mcp` pattern by default.
