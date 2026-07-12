# Agent-Backed AI Provider (Third Path Beside Local and Cloud)

**Status:** Proposed
**Date:** 2026-07-12
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-06-25a-machine-local-llm-role-configuration.md](2026-06-25a-machine-local-llm-role-configuration.md) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)

---

## Context

ZAM's CLI layer resolves AI work through **role-bound providers** (`recall`,
`vision`, `text`, `embedding`) via `getProviderForRole()`. In practice the
Desktop App and curriculum import flows present learners with an implicit
**two-way choice**:

1. **Local** — an OpenAI-compatible endpoint on the machine (FLM, Ollama, …).
2. **Cloud** — a named provider record with API keys (DeepSeek, Anthropic, …).

That split works when ZAM owns the HTTP call end-to-end. It breaks down when the
learner already runs a **connected external agent harness** — OpenCode, Codex,
Claude Code, Goose, Copilot, Antigravity — where:

- the model, API keys, and routing live in the **harness config**, not in
  `~/.zam/config.json`;
- the harness may already be the daily driver for coding and MCP tool use;
- `zam agent connect <harness>` has provisioned the ZAM MCP server, but
  curriculum import and Content Studio still bypass the harness and talk to ZAM's
  own `text` provider directly.

Recent curriculum-import work surfaced the pain: large Lehrplan blocks stress
small local models (timeouts, renderer instability), while cloud setup in ZAM
Settings is a second configuration surface the user may not want if OpenCode (or
another harness) is already configured with a capable model.

The product question: **when an agent harness is connected, should ZAM offer
"Agent" as a third AI backend that reuses whatever model that harness uses?**

---

## Decision (proposed)

Introduce an optional **`agent` transport** for selected ZAM roles (starting with
`text`, optionally `recall` later), alongside the existing **direct HTTP**
transports (local + cloud).

### 1. Three AI paths in the UI

Settings and import surfaces that today distinguish "local vs cloud" should gain
a third option when a supported harness is **detected and connected**:

| Path | Who configures the model | ZAM's job |
|------|--------------------------|-----------|
| **Local** | ZAM `~/.zam/config.json` → `text` role → local provider | HTTP to localhost |
| **Cloud** | ZAM provider records + credentials | HTTP to cloud API |
| **Agent** | The connected harness (e.g. OpenCode `opencode.json`) | Delegate generation to the harness; do not duplicate its provider setup |

The label should name the active harness when known ("OpenCode", "Codex", …),
not a generic "Agent".

### 2. Scope of delegation

**In scope (phase 1 proposal):**

- Structured JSON tasks currently served by `importCurriculumViaLLM()` and similar
  `text`-role callers (curriculum card extraction, Content Studio import helpers).
- Read-only **capability probe**: "can this harness answer a bounded JSON schema
  request right now?" for status chips in Studio / curriculum wizard.

**Out of scope (explicit deferrals):**

- Replacing `recall`-role latency-sensitive prefetch (ADR 2026-06-27) — keep
  direct HTTP unless a later ADR proves agent round-trips are fast enough.
- `vision` / observer pixels — remain local-first per ADR 2026-06-20/22.
- `embedding` — stay on direct HTTP; harnesses do not standardize embeddings today.

### 3. Harness selection and configuration source

When `text` role binding is `agent:<harnessId>` (exact syntax TBD):

1. **Prefer the harness the user connected last** via `zam agent connect`, or an
   explicit "active harness for AI" picker in Settings.
2. **Read model/endpoint metadata from the harness config file** that
   `agent-connect` already knows (`~/.config/opencode/opencode.json` for
   OpenCode, Codex `config.toml`, etc.) — for **display and health checks only**
   initially; the implementation must not scrape secrets into ZAM logs.
3. **Execute the LLM call through a harness-specific adapter** in the CLI layer
   (`src/cli/llm/` or `src/cli/agent-llm/`), never in the kernel.

Candidate adapters (to be evaluated during implementation planning):

| Harness | Possible execution surface | Notes |
|---------|---------------------------|-------|
| **OpenCode** | `opencode serve` OpenAPI / official SDK | Headless, documented; aligns with ADR 2026-07-06a T3 |
| **Codex** | MCP or CLI subprocess with structured prompt | Already in connect registry |
| **Claude Code / Desktop** | MCP `prompt` tool or ACP (future) | Higher latency; good for batch import |
| **Goose / Copilot / Antigravity** | Harness-specific; lowest priority | Evaluate per harness |

The adapter contract should mirror the existing `ProviderConfig` outcome: given
(system, user) messages and a JSON schema hint, return parseable card proposals
or a typed error — same as `importCurriculumViaLLM()` today.

### 4. Fallback behavior

Agent path is **opt-in per role**. If the harness is offline, misconfigured, or
returns malformed JSON:

- surface a clear error naming the harness (not a generic LLM timeout);
- optionally offer one-click switch to cloud/local **without** rewriting harness
  config;
- curriculum wizard partial-import semantics (ADR 2026-07-02, idempotent
  topic import) remain unchanged.

No silent fallback to cloud — that would bill the wrong account and confuse users
who chose Agent deliberately.

### 5. Architecture boundary (unchanged)

- **Kernel** stays HTTP- and harness-agnostic; no OpenCode imports under
  `src/kernel/`.
- **CLI** owns adapters, probes, and timeouts — same as `client.ts` today.
- **MCP** remains the preferred *tool* transport for agents talking *to* ZAM; this
  ADR covers ZAM talking *through* an agent for *outbound* LLM work — a different
  direction, implemented only in the CLI layer.

---

## Consequences

**Easier**

- Learners with OpenCode (or similar) configure AI once; ZAM reuses it for
  curriculum import and studio text tasks.
- Large curriculum blocks can use the same capable cloud model already wired in
  the harness without duplicating API keys in ZAM Settings.
- Aligns product narrative: "connect your agent" is not only MCP tools, but also
  shared AI infrastructure.

**Harder**

- Two configuration worlds must be kept coherent in the UI (ZAM roles vs harness
  config) without implying they are synchronized automatically.
- Per-harness adapters multiply test and maintenance cost (`agent-connect` already
  tracks format churn).
- Latency and cancellation semantics differ from direct HTTP; curriculum import
  timeouts may need per-transport values.
- Security review: ensuring ZAM never exfiltrates harness secrets when reading
  config for display.

---

## Open questions (for refinement before acceptance)

1. **Exact role binding syntax** — `agent:opencode` in `~/.zam/config.json`, or a
   separate `textTransport: "agent"` + `textAgentHarness: "opencode"`?
2. **OpenCode first?** — Ship OpenCode-only MVP, or require an abstract adapter
   interface day one?
3. **Invocation mechanism** — subprocess (`opencode run`), HTTP (`opencode serve`),
   or MCP tool invoked against a loopback harness session?
4. **Concurrency** — curriculum sequential import vs parallel harness sessions.
5. **Desktop vs CLI-only** — does the Tauri app spawn/serve the harness, or only
   consume an already-running OpenCode server?
6. **Status UX** — extend existing `ensure-llm` / AI status bridge commands with
   `transport: "agent"` and harness health, or new `ensure-agent-llm`?
7. **Relationship to T3 native chat** (ADR 2026-07-06a) — is agent-backed `text`
   role a stepping stone toward embedded OpenCode, or a permanent third path?

---

## Implementation sketch (non-normative)

Phases below are a **starting point for planning**, not committed scope.

1. **ADR accepted** → agree OpenCode as reference harness and adapter interface.
2. **Probe + settings** — detect connected harness; show third radio in AI
   settings; persist role binding.
3. **Text-role adapter** — wire `importCurriculumViaLLM()` (and callers) to
   delegate when binding is agent.
4. **Curriculum wizard** — replace "switch to cloud" hint with "use Agent
   (OpenCode)" when harness is available.
5. **Tests** — contract tests with mocked harness responses; no live OpenCode in CI.

---

## Status history

| Date | State | Note |
|------|-------|------|
| 2026-07-12 | Proposed | Initial draft from curriculum-import pain (local timeouts); Thomas to refine before acceptance. |