# MCP as the Canonical Agent Transport (and the Surface Topology Around It)

**Status:** Proposed
**Date:** 2026-07-06
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-20-observer-permission-model.md](2026-06-20-observer-permission-model.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-05-30b-hardware-setup-and-agent-distribution.md](2026-05-30b-hardware-setup-and-agent-distribution.md) ·
[2026-07-06b-checkpointed-review-dialogue.md](2026-07-06b-checkpointed-review-dialogue.md) (companion)

---

## Context

### The problem: confirmation fatigue in agent harnesses

The ZAM skill drives all knowledge management by shelling out to `zam` / `npx zam`
commands. In every harness this means the host's *shell-command* permission system
gates every step of a learning session. Three compounding causes:

1. **Volume.** A conceptual review costs two commands per card
   (`zam card update` + `zam session log`) plus 4–6 setup/teardown commands —
   a ten-card session is ~25 approval prompts. `zam bridge submit` cannot absorb
   the session log: `SubmitRatingRequest.sessionId` exists in
   [protocol.ts](../../src/bridge/protocol.ts) but is not wired as a CLI flag in
   [bridge.ts](../../src/cli/commands/bridge.ts).
2. **Allowlist-hostile idioms.** The skill's command shapes are exactly what
   shell allowlists fail on: stdin JSON via pipes
   (`echo '{…}' | zam bridge relevant-tokens`), output redirects
   (`zam bridge check-due > /tmp/zam-review.json`), quoted multi-word arguments
   (`--task "…"`), chained commands, and the `npx zam` vs. `zam` prefix split.
   Antigravity users report allowlisted commands re-prompting whenever pipes,
   semicolons, or quotes are involved, and an "Always Proceed" setting with open
   no-effect bug reports.
3. **Workarounds already paid for.** `zam learn` exists partly to "sidestep …
   per-subcommand permission prompts from chained `card update` / `session log`
   calls" ([SKILL.md](../../.claude/skills/zam/SKILL.md)), and the Codex skill
   flavor carries an execution-notes section about escalation retries,
   `["npx","zam"]` prefix rules, and Windows PowerShell quoting. Every new
   harness adds another such section — the transport is wrong, not the scripts.

### Harness consent surfaces (as of July 2026 — churns, re-verify at implementation)

| Harness | Shell commands from a skill | MCP tools |
|---|---|---|
| **Antigravity CLI** (replaced Gemini CLI for consumer use 2026-06-18) | Permission presets and shell allowlists remain host policy | Shared `~/.gemini/config/mcp_config.json` read by CLI **and** IDE (2.0+); first tool use may still require approval |
| **Antigravity IDE** | Terminal auto-execution allowlists have historically re-prompted for pipes/quotes | Reads the shared config; older builds use `~/.gemini/antigravity/mcp_config.json` only; approval behavior remains host-controlled and must be smoke-tested |
| **Claude Code** | `Bash(zam …)` prefix rules work until pipes/redirects/npx split them | Project-scoped `.mcp.json`; `"allow": ["mcp__zam"]` trusts the whole server |
| **Codex** | Sandbox escalations + prefix rules (documented in our own skill) | `[mcp_servers.zam]` in `config.toml`; `default_tools_approval_mode` plus **per-tool** `approval_mode` |

The pattern: MCP consent is **structured** (typed tool + JSON arguments), while
shell consent is **textual** (every quoting variation can become a new string to
match). This gives hosts a stable tool identity for durable policy, but it does
not guarantee zero prompts: server trust and per-tool approval remain host
decisions, and MCP annotations are advisory hints rather than authorization.

### What already exists in this repo

- [protocol.ts](../../src/bridge/protocol.ts) — a stable, machine-facing JSON
  contract covering the whole learning surface.
- `zam bridge serve --stdin` ([bridge.ts](../../src/cli/commands/bridge.ts)) — a
  persistent JSON dispatch loop over the same Commander handlers, built for the
  desktop Studio. An MCP server is this loop with a standard handshake and tool
  schemas.
- The agent-harness registry
  ([agent-harness.ts](../../src/cli/agent-harness.ts), ADR 2026-06-23) — detects
  Claude Code / Codex / opencode / Cursor / Copilot / Antigravity.
- Tri-flavor skills (`.claude/`, `.agent/`, `.agents/`) shipped in the npm
  package and desktop resources.
- ADR 2026-06-20 already sketched `zam mcp serve` and built the two-layer consent
  model so "Layer 1 = MCP host consent" composes with ZAM's own `ObserverPolicy`.

### New ecosystem facts that widen the decision

- **MCP Apps (SEP-1865)** went live 2026-01-26 as the first official MCP
  extension: servers ship `ui://` HTML resources that hosts render as interactive
  panels in-conversation, with the panel calling back into the server's tools.
  Confirmed hosts: Claude, ChatGPT, VS Code/Copilot, Goose, Postman. This is the
  natural vehicle for "ZAM Recall as the visual app part on the right side."
- **ACP (Agent Client Protocol)** has 25+ agents by 2026-03 (Gemini CLI first,
  GitHub Copilot CLI, JetBrains co-development; Claude Code and Codex via
  adapters). A ZAM-owned chat pane could embed any of them by implementing the
  *client* side once — and hand the agent the same ZAM MCP server at session
  start.
- **opencode** exposes a documented headless server (`opencode serve`, OpenAPI
  3.1) with an official JS/TS SDK and any-provider support (DeepSeek/MiMo fit
  the cost-first stance).

### Two personas, three topologies

| Topology | What it is | Persona | Confirmation story |
|---|---|---|---|
| **T1: harness-owned chat** | Claude Code / Codex / Antigravity chat pane + ZAM MCP + optional panel | Developer doing real work (primary today) | Stable tool identities; prompt count depends on host policy |
| **T2: ZAM App embedded terminal** | Studio embeds a PTY terminal running the detected harness CLI | Learner who shouldn't juggle apps | ZAM provisions MCP config before spawn; the harness still owns approval |
| **T3: ZAM App native chat pane** | Studio talks to an agent backend programmatically (ACP client / opencode SDK) | School / non-dev persona, long-term | Host prompts disappear; ZAM is the permission UI |

An embedded terminal alone does **not** reduce confirmations — the harness still
prompts inside it. T2 only becomes friendly because of the provisioning in
Decision 4. The *learning-discussion* motivation for T3 is served much more
cheaply by the companion ADR
([2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md)); what remains for
T3 is work execution inside the App, which can wait.

---

## Decision

### 1. `zam mcp` — a stdio MCP server as the canonical agent transport

Add a `zam mcp` subcommand (CLI layer) that serves the ZAM toolset over stdio via
`@modelcontextprotocol/sdk`. It is a **thin adapter over the same handlers the
bridge dispatches to**; [protocol.ts](../../src/bridge/protocol.ts) remains the
single contract. Prerequisite refactor: extract the handler logic out of
[bridge.ts](../../src/cli/commands/bridge.ts) (4,500 lines of Commander actions)
into a transport-neutral handler map that bridge CLI, `bridge serve`, and
`zam mcp` all call. The kernel stays free of MCP/LLM/HTTP imports — the boundary
rule is unchanged.

The bridge CLI is **not** deprecated: it remains the documented fallback for
harnesses without MCP configuration and for CI/scripting.

### 2. A coarse tool surface (~10 tools) with consent annotations

Fewer, batched tools mean fewer approvals in per-call hosts, less context, and a
UI-friendly granularity for MCP Apps. Initial surface:

| Tool | Maps to | Annotations |
|---|---|---|
| `zam_status` | check-due + stats summary | read-only |
| `zam_session_start` | start-session | non-destructive; closed-world |
| `zam_session_end` | end-session (incl. `synthesize`) | non-destructive; closed-world |
| `zam_get_reviews` | full due batch with resolved contexts (replaces per-card get-review *and* the `/tmp/zam-review.json` redirect) | read-only; open-world when resolving remote sources |
| `zam_submit_review` | user rating **plus** session-step log, or unrated agent step (closes the `sessionId` gap) | non-destructive; closed-world |
| `zam_review_action` | skip / edit / deprecate / delete / stop | destructive; keeps the in-protocol `confirm` gate |
| `zam_add_token` | add-token (token + card + prereqs + contexts) | non-destructive; open-world if embeddings are remote |
| `zam_find_tokens` | semantic find / relevant-tokens | read-only; open-world if embeddings are remote |
| `zam_suggest_foundations` | suggest-foundations | read-only; open-world if embeddings are remote |
| `zam_link_prereq` | prereq edge + optional block | non-destructive; closed-world |
| `zam_monitor` | get-monitor + analyze-monitor | read-only |

Read-only tools get `readOnlyHint`; tools that can resolve remote sources or call
a configured embedding endpoint get `openWorldHint: true`. Dynamic LLM question
self-healing is disabled on the read-only MCP review path. Destructive actions
keep ZAM's own `confirm` requirement so server trust never silently authorizes
deletion. Tool descriptions stay terse — pedagogy lives in the skill, not in
schemas.

### 3. Skills remain the pedagogy layer, slimmed to tool references

The skill keeps everything MCP cannot carry: session protocol, Bloom-level
probing, observation etiquette, decomposition and safety rules. Its command
blocks become tool references ("call `zam_get_reviews`"), with a short bridge-CLI
fallback appendix. The per-harness execution-notes sections (escalation retries,
PowerShell quoting) shrink or disappear. All three flavors and `AGENTS.md` are
updated in the same implementation PR (plans stay harness-agnostic).

### 4. `zam agent connect <harness>` — provision configuration, surface trust

Extend the harness registry ([agent-harness.ts](../../src/cli/agent-harness.ts))
with a `connect` action that writes the per-harness MCP configuration:
project `.mcp.json` (Claude Code), the shared `~/.gemini/config/mcp_config.json`
(Antigravity CLI + IDE 2.0+; older IDE builds read
`~/.gemini/antigravity/mcp_config.json`), `~/.codex/config.toml` (Codex, incl. per-tool
`approval_mode` for the destructive tools), and
`~/.config/opencode/opencode.json` (opencode). This powers the
Studio "Open Agent" button (ADR 2026-06-23 item 6) and is what later makes the
embedded terminal (T2) lower-friction: ZAM provisions configuration before
spawning the harness and tells the user where the remaining host approval lives.

### 5. Surface topology: one web UI, multiple mounts — MCP Apps first

Studio views stay framework-free (plain TS + DOM, as in
[desktop/src](../../desktop/src/main.ts)) so one view codebase can mount in three
places: the Tauri window, an MCP Apps `ui://` iframe, and (if needed) a VS
Code-family webview. The **first embedded-panel target is MCP Apps** served by
the same `zam mcp` process — zero additional artifact, renders in Claude,
VS Code/Copilot, ChatGPT, and Goose. Candidate first panels: due-queue /
check-in card, knowledge-map neighborhood view. A VS Code/OpenVSX webview
extension (which would cover Antigravity IDE and Codex-in-VS-Code) is the
fallback **only if** Antigravity does not adopt MCP Apps in a useful timeframe.

### 6. Deferred: work-execution chat inside the ZAM App (T3)

When a ZAM-owned chat pane that *does work* becomes necessary (concrete school-
persona demand is the trigger), implement it as an **ACP client** (vendor-
neutral, permission requests surface in ZAM's UI, the agent receives the same
ZAM MCP server at `session/new`), with the opencode server/SDK as the
alternative. The Claude Agent SDK is **rejected** for this slot: single-vendor
and metered-API against the project's multi-harness and cost-first stances.

---

## Options weighed

**A — Harden the skill/CLI only.** Batch verbs, remove pipes/redirects, ship
per-harness allowlist snippets. Cheap, and the batching is adopted anyway
(Action Item 3) because it also improves the fallback path. Rejected as the
*sole* path: shell allowlists remain heuristic and demonstrably buggy
(Antigravity), Windows quoting pain stays, and per-harness workaround notes keep
multiplying.

**B — MCP server as canonical transport.** Chosen. One durable consent decision
per harness; typed JSON arguments end the quoting saga; one warm process (single
DB open) replaces ~30 Node cold-starts per session; the same server later
carries MCP Apps panels and plugs into ACP/opencode topologies unchanged.

**C — Embedded terminal as the fix.** Rejected as a standalone answer: the
harness still prompts inside the embedded terminal. Valuable as a *surface*
(T2), adopted in sequencing, but it depends on B for the confirmation win.

**D — ZAM-owned chat now (Agent SDK / opencode / ACP).** Deferred (Decision 6).
The urgent motivation — discussing a knowledge question inside the App — is
served without any agent harness by the companion ADR
[2026-07-06b](2026-07-06b-checkpointed-review-dialogue.md).

---

## Consequences

**Easier**
- A learning session exposes stable, named MCP tools instead of ~25 distinct
  shell command shapes; hosts can persist policy at server or tool granularity.
- JSON tool arguments remove the PowerShell/cmd quoting notes from the skill.
- `zam_get_reviews` eliminates the `/tmp` redirect hack; `zam_submit_review`
  halves per-card round-trips.
- The same server is the delivery vehicle for embedded panels (MCP Apps) and for
  any future ACP/opencode embedding — no second integration layer.
- The handler extraction de-risks `bridge.ts` (one dispatch surface, testable
  without Commander).

**Harder**
- Coarser consent is real: annotations improve host UX but are not enforcement.
  Safety still depends on ZAM-side `confirm` gates and per-tool approval modes
  where hosts offer them.
- Tool schemas cost ~1–2k context tokens in hosts that don't defer tool loading;
  kept low by the coarse surface and terse descriptions.
- One more runtime dependency (`@modelcontextprotocol/sdk`, CLI layer only) and
  one more long-lived process to reason about (same lifecycle class as
  `bridge serve`).
- Per-harness config formats churn; `zam agent connect` must track them
  (verify the July 2026 matrix at implementation time).

**To revisit**
- Whether Antigravity adopts MCP Apps (decides if the webview extension is ever
  built).
- The `.agents/` directory collision: Codex and Antigravity CLI both read
  `.agents/skills/` — the tri-flavor scheme may need a rethink when the skill is
  slimmed.
- Consolidating the Studio's `bridge serve` onto `zam mcp` (one daemon) — not
  now; no user-visible gain for the destabilization risk.
- T3 trigger and stack choice (ACP vs. opencode) — own ADR when the need is
  concrete.

---

## Action Items

Ordered; each is a small, independently shippable PR on this feature branch's
successors. File paths are load-bearing.

1. [x] **Extract transport-neutral handlers** from
   [`src/cli/commands/bridge.ts`](../../src/cli/commands/bridge.ts) into a
   handler map (e.g. `src/cli/bridge-handlers.ts`) consumed by the Commander
   actions and `bridge serve`. No behavior change; contract stays
   [`src/bridge/protocol.ts`](../../src/bridge/protocol.ts).
2. [x] **`zam mcp`** (`src/cli/commands/mcp.ts`): stdio server over
   `@modelcontextprotocol/sdk`, the ~10 tools from Decision 2 with annotations,
   mapped onto the handler map. Destructive tools require `confirm: true`.
3. [x] **Batch verbs on the bridge CLI too** (fallback parity): wire
   `--session` into `bridge submit` (rating + session step with an explicit
   `stepError` if the latter fails); add a
   `bridge session-open` that returns stats + due summary + relevant tokens in
   one call.
4. [x] **`zam agent connect <harness>`** in
   [`src/cli/agent-harness.ts`](../../src/cli/agent-harness.ts) +
   [`src/cli/commands/agent.ts`](../../src/cli/commands/agent.ts): write
   per-harness MCP config; print what was written and where.
5. [x] **Slim the skill** (all three flavors + `AGENTS.md`): tool references,
   bridge-CLI fallback appendix, delete obsolete per-harness execution notes.
6. [ ] **(Later increment) MCP Apps panel**: first `ui://` resource reusing a
   Studio view (due queue / check-in card), served by `zam mcp`.
7. [ ] **(Later increment) Studio embedded terminal** (T2): PTY + xterm.js in
   the Tauri Studio, spawning the detected harness after `agent connect`
   provisioning; consider unifying with the `zam monitor` terminal.
8. [x] **Re-verify the harness consent matrix** during items 2/4 — presets,
   config paths, and approval semantics churn quarterly.

---

## External references (state as of 2026-07-06)

- MCP Apps extension (SEP-1865): <https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/> · <https://github.com/modelcontextprotocol/ext-apps>
- Gemini CLI → Antigravity CLI transition: <https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/>
- Antigravity CLI permission presets & shared MCP config: <https://www.codeagentswarm.com/en/guides/how-to-use-antigravity-cli> · <https://medium.com/google-cloud/configuring-mcp-servers-and-skills-for-antigravity-cli-and-ide-a938c7eebb78>
- Antigravity allowlist / auto-approve issues: <https://discuss.ai.google.dev/t/bug-antigravity-still-ask-permission-even-command-is-already-on-allowed-list/118636> · <https://discuss.ai.google.dev/t/how-to-auto-approve-specific-local-mcp-tools-bypass-accept-prompt-in-antigravity/135984>
- Codex MCP config (per-tool approval): <https://developers.openai.com/codex/config-reference> · <https://developers.openai.com/codex/mcp>
- Claude Code MCP permission rules: <https://code.claude.com/docs/en/settings>
- Agent Client Protocol: <https://github.com/agentclientprotocol/agent-client-protocol>
- opencode server & SDK: <https://opencode.ai/docs/server/> · <https://opencode.ai/docs/sdk/>
