# Implementation Plan: MCP Agent Transport (ADR 2026-07-06a)

**Source of truth:** [docs/adr/2026-07-06a-mcp-agent-transport-and-surfaces.md](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
**Scope:** ADR Action Items 1–5 + 8. Items 6–7 (MCP Apps panel, Studio embedded
terminal) are explicitly **out of scope** — later increments.
**Roles:** implementation by any capable agent harness; independent review
against the [Verification matrix](#verification-matrix-for-reviewers); final
review, fixes, and release by Claude.

This plan is self-contained: no conversation context is required. File paths are
load-bearing. When this plan and the code disagree about a detail (option names,
line numbers), trust the code and keep the plan's *intent*.

---

## Workflow rules (read first)

- **One branch for all phases:** `feat/mcp-agent-transport`, cut from
  `docs/agent-integration-adr` (or from `main` once that docs PR has merged).
  No per-phase branches. One PR at the end.
- **Commit per phase**, format `<type>: <short summary>`
  (`feat` / `refactor` / `test` / `docs` / `chore`).
- **Gates before every commit:** `npm run test`, `npm run lint`,
  `npm run typecheck`. If lint fails before you touched code, check Biome
  schema/CLI version compatibility first (see CLAUDE.md).
- **Boundaries:** learning logic lives in `src/kernel/` and stays free of
  MCP/LLM/HTTP imports. Everything in this plan is CLI-layer
  (`src/cli/`, `src/bridge/`). IDs are ULIDs. `zam bridge` output stays
  JSON-only.
- **Contract discipline:** [src/bridge/protocol.ts](../../src/bridge/protocol.ts)
  is the stable contract — **additive changes only** (new types, new optional
  fields; never rename or remove).
- Keep `AGENTS.md` in sync with `CLAUDE.md` if you touch either.

---

## Phase 0 — Preflight

1. Add runtime dependencies to `package.json` (`dependencies`, not dev):
   `@modelcontextprotocol/sdk` (current stable) and `zod` (the major version the
   SDK's peer range requires). Node >= 22 is already the floor; the SDK supports it.
2. Confirm `tsup` bundles the new imports into `dist/cli/index.js`
   (`npm run build` succeeds; no dynamic-require surprises).
3. Baseline: all gates green before any code change.

**Commit:** `chore: add MCP SDK dependencies`

---

## Phase 1 — Extract transport-neutral bridge handlers (scoped)

**Goal:** the operations the MCP server needs become plain async functions,
callable without Commander. **No behavior change** to existing commands; all
existing `tests/cli/bridge-*.test.ts` stay green untouched.

Create `src/cli/bridge-handlers.ts` exporting typed functions with the shape
`(db, params) → Promise<ProtocolShape>`. Move (don't duplicate) the action-body
logic out of [src/cli/commands/bridge.ts](../../src/cli/commands/bridge.ts) for
exactly these operations; the Commander actions become thin wrappers
(parse opts → call handler → `jsonOut(...)`):

| Handler | Source today (bridge.ts) | Notes |
|---|---|---|
| `checkDue` | `check-due` (~line 334) | Already returns the full card list (`cards: [{cardId, tokenId, slug, concept, domain, bloomLevel, state, dueAt}]`) — reuse as-is |
| `getReview` | `get-review` | Single-card question + `resolvedContext` |
| `getReviewsBatch` | **new**, composes the two above | Card list from `checkDue`; when `includeQuestions: true`, enrich each card via the `get-review` path (`resolve` per card, failures degrade to `resolvedContext: null`). Default `includeQuestions: false` — batch resolution is N file/web reads; make cost opt-in |
| `submitReview` | `submit` + session-step logging | `executeReviewAction(rate)`; when `sessionId` present, also append the session step (`doneBy` default `"user"`, the submitted rating). Sequential; if the step write fails after the rating succeeded, return the evaluation **plus** a `stepError` field — never pretend atomicity |
| `reviewAction` | `review-action` | Keep the existing preview/`requiresConfirmation` flow for destructive actions |
| `addToken` | `add-token` | Token + card + prerequisites + knowledge contexts |
| `findTokens` | `relevant-tokens` / token find path | Degrade exactly like the CLI does when no embedder is configured |
| `suggestFoundations` | `suggest-foundations` | |
| `linkPrereq` | token prereq + optional card block | Prereq edge; `blockUser?: string` also blocks that user's card |
| `startSession` / `endSession` | `start-session` / `end-session` | Keep the observer-policy hint behavior |
| `getMonitor` / `analyzeMonitor` | `get-monitor` / `analyze-monitor` | |
| `sessionOpen` | **new composite** | stats summary + `checkDue` summary + `findTokens(taskContext)` in one call (see Phase 3) |

Additive protocol types in `protocol.ts`: `GetReviewsResponse`
(`{ cards: Array<GetReviewResponse-like> }` — note the existing narrow
`CheckDueResponse` stays untouched), `SubmitReviewResult` (evaluation +
optional `stepError`), `SessionOpenResponse`.

**Tests:** new `tests/cli/bridge-handlers.test.ts` (temp DB via existing
`tests/helpers` patterns) covering `getReviewsBatch` (with/without questions),
`submitReview` (with/without `sessionId`; step-failure surfaces `stepError`),
`linkPrereq` (+block). Existing bridge tests unchanged and green.

**Commit:** `refactor: extract transport-neutral bridge handlers`

---

## Phase 2 — `zam mcp` (stdio MCP server)

**Goal:** ADR Decision 1+2. New `src/cli/commands/mcp.ts`, registered via
`program.addCommand(mcpCommand)` in [src/cli/index.ts](../../src/cli/index.ts).

Implementation notes:

- `McpServer` + `StdioServerTransport` from `@modelcontextprotocol/sdk`.
  Server name `zam`, version from `package.json`.
- **stdout is protocol.** Before anything else runs, rebind `console.log` to
  `console.error` inside the command action (belt-and-braces against stray
  logging in shared code; `bridge serve` has the same class of guard).
- **DB lifecycle:** open once at startup (same path `bridge serve` uses), close
  on transport close and SIGINT/SIGTERM.
- **User resolution:** every tool takes an optional `user` string; default via
  the same `resolveUser`/whoami path the bridge uses.
- Zod input schemas mirror the protocol types; descriptions terse (one line per
  tool/param — the pedagogy lives in the skill, not the schemas).

Register exactly these 11 tools (ADR Decision 2), mapped onto Phase-1 handlers:

| Tool | Handler | Annotations |
|---|---|---|
| `zam_status` | `checkDue` (+ stats summary) | `readOnlyHint: true` |
| `zam_session_start` | `startSession` | |
| `zam_session_end` | `endSession` (incl. `synthesize`) | |
| `zam_get_reviews` | `getReviewsBatch` | `readOnlyHint: true` |
| `zam_submit_review` | `submitReview` | `idempotentHint: false` |
| `zam_review_action` | `reviewAction` | `destructiveHint: true` |
| `zam_add_token` | `addToken` | |
| `zam_find_tokens` | `findTokens` | `readOnlyHint: true` |
| `zam_suggest_foundations` | `suggestFoundations` | `readOnlyHint: true` |
| `zam_link_prereq` | `linkPrereq` | |
| `zam_monitor` | `getMonitor` / `analyzeMonitor` (via `analyze?: patterns`) | `readOnlyHint: true` |

All tools: `openWorldHint: false` (local DB). `zam_review_action` with
`delete-token`/`delete-card` **must** keep the two-step confirm flow: first call
without `confirm` returns the preview + `requiresConfirmation: true`; deletion
only with `confirm: true`. One-time server trust must never silently delete.

Tool results: `structuredContent` with the protocol JSON (plus a
`content` text fallback of the same JSON, stringified). Handler errors → tool
error results (`isError: true`), never a crashed server.

**Tests:** `tests/cli/mcp.test.ts` using the SDK's `InMemoryTransport.createLinkedPair()`
with a `Client`: list tools (11, correct annotations), call `zam_status` and
`zam_submit_review` against a temp DB, destructive action without `confirm`
returns the preview, handler throw → `isError` result, stdout purity (nothing
but JSON-RPC frames when running the real command against a pipe — a small
spawn-based smoke test).

**Manual smoke (documented in the PR description):**
`claude mcp add zam -- zam mcp` in a scratch project, or
`npx @modelcontextprotocol/inspector zam mcp` — list tools, call `zam_status`.

**Commit:** `feat: zam mcp — MCP stdio server over bridge handlers`

---

## Phase 3 — Bridge CLI batch parity (fallback path)

**Goal:** ADR Action Item 3 — the non-MCP fallback gets the same round-trip
economy.

1. `zam bridge submit`: add `--session <id>` and `--done-by <user|agent>`
   (default `user`) wired to the Phase-1 `submitReview` handler.
2. New `zam bridge session-open --user <u> --task "<t>" [--context <c>]` →
   `sessionOpen` composite (stats + due summary + relevant tokens + started
   session) as one JSON response.
3. `zam bridge get-reviews [--include-questions] [--no-resolve]` exposing
   `getReviewsBatch` (replaces the documented
   `check-due > /tmp/zam-review.json` pattern).

**Tests:** extend `tests/cli/bridge-*.test.ts` style for the three commands.

**Commit:** `feat: batched bridge verbs (submit --session, session-open, get-reviews)`

---

## Phase 4 — `zam agent connect <harness>`

**Goal:** ADR Decision 4 — provision MCP trust instead of documenting it.

Extend [src/cli/agent-harness.ts](../../src/cli/agent-harness.ts) and
[src/cli/commands/agent.ts](../../src/cli/commands/agent.ts):

- `zam agent connect <claude-code|antigravity|codex> [--print]`
- Resolve the `zam` executable (reuse `findExecutable`; fall back to literal
  `zam` with a warning). Server entry: command = resolved path, args = `["mcp"]`.
- Per-harness targets (v1 — **verify paths/schemas against current harness docs
  at implementation time**, they churn; keep the writers table-driven):
  - **claude-code:** project `.mcp.json` (cwd), `mcpServers.zam`,
    stdio. JSON parse → merge → stringify (2-space indent). Create if missing.
  - **antigravity:** `~/.gemini/config/mcp_config.json` (shared IDE+CLI),
    `mcpServers.zam`. Same merge strategy.
  - **codex:** `~/.codex/config.toml`. **Never rewrite the file** (comments
    would be lost): if `[mcp_servers.zam]` already appears, print "already
    configured" and stop; otherwise append a clearly-delimited block —
    `[mcp_servers.zam]`, `command`, `args`, plus per-tool
    `approval_mode = "prompt"` overrides for `zam_review_action` under
    `[mcp_servers.zam.tools.…]` if the installed Codex supports it (keep the
    block minimal otherwise).
- Idempotent: re-running updates the JSON entry in place / no-ops the TOML.
- `--print` renders what *would* be written (path + content) without touching
  disk.
- Output: human-readable summary of file + entry written, and a one-line hint
  where the harness surfaces the trust decision.

**Tests:** extend `tests/cli/agent-harness.test.ts` with injected home/cwd
(temp dirs): fresh write, merge-preserves-other-servers, TOML append + skip,
`--print` writes nothing.

**Commit:** `feat: zam agent connect — provision per-harness MCP config`

---

## Phase 5 — Slim the skill to the MCP transport

**Goal:** ADR Decision 3. The skill keeps all pedagogy; the transport changes.

For **all three flavors** (`.claude/skills/zam/SKILL.md`,
`.agent/skills/zam/SKILL.md`, `.agents/skills/zam/SKILL.md`):

1. Add a **Transport** section near the top: *prefer the `zam` MCP tools
   (`zam_status`, `zam_get_reviews`, …) when the server is available; if not,
   tell the user once to run `zam agent connect <harness>` (or fall back to the
   bridge CLI).* Include the 11-tool table with one-line purposes.
2. Rewrite the Session Protocol steps to tool calls:
   - unblock + stats greeting → `zam_status`
   - `echo '{…}' | zam bridge relevant-tokens` → `zam_find_tokens`
   - `check-due > /tmp/zam-review.json` + Read → `zam_get_reviews`
   - `session start` / `session end` → `zam_session_start` / `zam_session_end`
   - per-card `card update` + `session log` → **one** `zam_submit_review`
     (with `sessionId`)
   - `suggest-foundations` pipes → `zam_suggest_foundations`
   - `token register` + `token prereq` + `card block` in decomposition →
     `zam_add_token` + `zam_link_prereq`
3. Keep a short **"Fallback: bridge CLI"** appendix mapping each tool to its
   `zam bridge …` command (now including the Phase-3 batched verbs). Keep
   `zam learn` and `zam monitor` guidance as-is.
4. Delete the now-obsolete Codex execution notes about escalated permissions,
   `["npx","zam"]` prefix rules, and PowerShell-vs-cmd quoting (JSON tool args
   make them moot); keep the `bridge add-token` stdin caveat only in the
   fallback appendix.
5. Preserve every pedagogy section unchanged: token definition, assessment
   modes, rating rubric, dynamic decomposition, source-grounded splitting,
   blocking rule, symbiosis modes, safety rules — plus the checkpoint
   invariants (question → answer → rating; see ADR 2026-07-06b).
6. Flavor deltas stay minimal (Claude `!`-prefix note, Codex `$zam` note,
   Antigravity/Gemini wording) — diff the three files at the end; they should
   differ only in those known spots.
7. Update `AGENTS.md` and `CLAUDE.md` (bridge section): mention `zam mcp`,
   `zam agent connect`, and that MCP is the preferred agent transport with the
   bridge CLI as fallback. Add a `README.md` quickstart snippet
   (`zam agent connect claude-code` → agent session with zero per-command
   prompts).
8. Do **not** hand-edit `desktop/src-tauri/resources/**` skill copies — they are
   produced by `npm run desktop:prepare`; run it if the desktop bundle needs
   refreshing.

**Commit:** `docs: skill uses MCP transport, bridge CLI as fallback`

---

## Verification matrix (for reviewers)

Independent reviewers (e.g. MiMo-V2.5-Pro, GPT-5.5): check each row, report
file:line for violations, propose minimal fixes.

| # | Invariant | How to check |
|---|---|---|
| 1 | Kernel purity | `grep -rn "modelcontextprotocol\|zod" src/kernel/` → empty |
| 2 | Contract additive | `git diff main -- src/bridge/protocol.ts` shows only additions/optional fields |
| 3 | Bridge behavior unchanged | existing `tests/cli/bridge-*.test.ts` untouched and green |
| 4 | stdout purity of `zam mcp` | spawn test exists and passes; no `console.log` in `src/cli/commands/mcp.ts` or `bridge-handlers.ts` |
| 5 | Destructive gate | `zam_review_action` delete without `confirm` returns preview, deletes nothing (test exists) |
| 6 | Tool surface | exactly 11 tools; annotations match the ADR table |
| 7 | Config writers safe | JSON merge preserves unrelated servers; Codex TOML is append-only; `--print` writes nothing (tests exist) |
| 8 | Gates | `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` all green |
| 9 | Skill flavors consistent | 3-way diff shows only the known per-harness deltas; AGENTS.md/CLAUDE.md in sync |
| 10 | No per-phase branches, commits follow `<type>: <summary>` | `git log main..HEAD --oneline` |

---

## Final review & release (Claude)

1. Re-run the verification matrix; fix or file what reviewers missed.
2. Manual harness smoke: `zam agent connect claude-code` in a scratch project →
   one trust prompt → `zam_status`/`zam_get_reviews`/`zam_submit_review` run
   without per-call approvals. `--print` output sanity for antigravity/codex.
3. `npm pack` smoke: global-install the tarball, `zam mcp` starts, tools list.
4. Version bump (`0.8.0` → `0.9.0`, `chore(release)`), merge PR per project
   flow, GitHub release draft with a hand-written "What's new", local macOS
   app build if desktop artifacts are being shipped this release.
5. Update the ADR index: 2026-07-06a → `Accepted` / `Partially implemented`
   (items 6–7 remain open).

---

## Out of scope (do not build here)

- MCP Apps `ui://` resources (ADR item 6) and the Studio embedded terminal
  (item 7) — separate increments.
- The checkpointed-dialogue features (ADR 2026-07-06b) — separate plan.
- opencode/ACP embedding (ADR Decision 6 — deferred).
- Consolidating the Studio's `bridge serve` onto `zam mcp`.
