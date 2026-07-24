# Agent-Backed AI Provider (Third Path Beside Local and Cloud)

**Status:** Accepted
**Date:** 2026-07-12 (accepted 2026-07-24)
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-12-unified-capability-model-registry.md](2026-07-12-unified-capability-model-registry.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-07-11-codex-and-vscode-companion-surfaces.md](2026-07-11-codex-and-vscode-companion-surfaces.md) ·
[2026-07-02-lehrplanplus-import-wizard.md](2026-07-02-lehrplanplus-import-wizard.md)

---

## Context

ZAM resolves AI work through a **capability-based model registry** (ADR
2026-07-12, *Unified Capability-Based Model Registry* — implemented). The CLI
layer keeps an ordered list of `ModelEntry` rows in machine-local config; runtime
selection (`resolveCapability` → `getProviderForRole`) walks the list by `order`
and returns the first entry that is user-enabled and probe-detected for the
requested capability (`text`, `embedding`, `image`, …). Every entry is an HTTP
endpoint with a wire `apiFlavor` (`chat-completions` or `anthropic-messages`).

In practice this presents learners with an implicit **two-way choice**:

1. **Local** — an OpenAI-compatible endpoint on the machine (FLM, Ollama, …).
2. **Cloud** — a remote endpoint plus an API key (DeepSeek, Anthropic API, …).

Both are **direct HTTP** paths where ZAM owns the call end-to-end. That model
breaks for the AI access most of ZAM's target users actually have: a
**subscription**, not a metered API key.

### Why subscriptions do not fit the HTTP registry

A metered **API key** (DeepSeek, the Anthropic *API*, the OpenAI *API*) is
separate, usage-based billing — it drops straight into a `ModelEntry` and the
existing Cloud path consumes it. A **subscription** (Claude Pro/Max, ChatGPT
Plus/Pro, GitHub Copilot, Google AI Pro, SuperGrok) is different in kind:

- it is **OAuth-bound to the vendor's own client**, not exposed as an
  API-key + endpoint a third party can call;
- it is consumed only *through* that client (Claude Code, Codex, the Copilot CLI,
  the Antigravity CLI, …), which holds the login session;
- using the subscription outside the official client is usually undocumented,
  unstable, and against the vendor's terms.

So a learner who pays for Claude Pro or a Copilot seat cannot paste those into
ZAM's Cloud path. Re-implementing each vendor's OAuth flow and private
subscription endpoints inside ZAM would be fragile, break on every vendor change,
and be ToS-risky — a bad investment for a project heading into a field test.

### The connected harness already holds the session

`zam agent connect <harness>` already provisions the ZAM **MCP server** into
Claude Code, Codex, OpenCode, Copilot, Antigravity, Goose, and others
(ADR 2026-07-06a, 2026-07-11). That wiring is **harness → ZAM**: the harness calls
ZAM's tools. The same harness, however, already has a capable model configured
and its subscription session live. Recent curriculum-import work surfaced the
pain from the *other* direction: large Lehrplan blocks stress small local models
(timeouts, renderer instability), while the only richer option ZAM offers today is
a second, API-key configuration surface the user may not have.

**The product question:** when a harness is connected, should ZAM offer *"Agent"*
as a third AI backend that reuses whatever model — and subscription — that
harness already runs, by delegating outbound `text` work *through* it?

This is the inverse direction of MCP: **ZAM → harness**, for outbound generation,
implemented entirely in the CLI layer.

---

## Decision

Introduce an optional **`agent` transport** for the `text` **and `recall`**
capabilities, alongside the existing **direct HTTP** transports. An agent-backed
model is a first-class **`ModelEntry`** in the same registry, so it participates
in ordering, enable/disable, and fallback exactly like an HTTP entry.

The recall path (dynamic question generation, answer evaluation, follow-up
discussion) is opt-in per caller: an agent round-trip is slower than direct HTTP
(process start + the harness's own framing), so it is offered where the learner
deliberately chose the agent — not forced on latency-sensitive prefetch. The
follow-up discussion is already **stateless** (the full thread is resent every
call), so the single-shot harness receives the thread flattened into one
transcript prompt with no loss of context.

### 1. Three AI paths, one registry

| Path | Who configures the model | ZAM's job |
|------|--------------------------|-----------|
| **Local** | ZAM `ModelEntry` → local URL | HTTP to localhost |
| **Cloud** | ZAM `ModelEntry` → remote URL + `apiKeyRef` | HTTP to cloud API |
| **Agent** | The connected harness (its own config + subscription) | Delegate generation to the harness; never duplicate or scrape its provider setup |

The Settings label names the active harness ("Claude Code", "Codex", …), not a
generic "Agent".

### 2. Binding lives on `ModelEntry`, not on deprecated roles

The registry replaced `llm.roles`/`llm.providers`. An agent binding is therefore
**two optional fields on `ModelEntry`**, not a new role syntax:

```ts
transport?: "http" | "agent";   // default "http" when absent
agentHarness?: ConnectHarnessId; // e.g. "claude-code", required when transport === "agent"
```

An agent entry carries no meaningful `url`/`apiFlavor`; its "endpoint" is the
harness id. `capabilities`/`detectedCapabilities` still gate it (an agent entry
is `text`-capable), and `order` still decides priority. This answers the original
open question about binding syntax: **it is registry data, resolved by the
existing `resolveCapability` path.**

### 3. Per-harness adapters behind one interface (abstract from day one)

Execution lives in a new CLI module `src/cli/agent-llm/`, never in the kernel.
A single abstract contract, one implementation per harness:

```ts
interface AgentTextAdapter {
  readonly harness: ConnectHarnessId;
  probe(): Promise<AgentProbeResult>;                        // for status chips
  generate(req: AgentGenerateRequest): Promise<AgentGenerateResult>; // (system,user)+schema hint → text
}
```

`generate` returns raw text that the caller parses with ZAM's existing defensive
JSON parsing (`parseGeneratedCardArray`) — the same contract as the current HTTP
path in `requestCurriculumCards()`. Adapters are **bespoke per harness** (each may
use that harness's native, streaming-capable surface) but share this contract, so
callers stay harness-agnostic.

### 4. Invocation: the harness's native headless surface

Each adapter drives its harness's documented non-interactive mode. The reference
implementation (this PR) is **Claude Code**:

- `spawn(resolveHarnessExecutable("claude-code"), ["-p", <prompt>, "--output-format", "json"])`,
  parse the JSON envelope, return its `result`.
- Uses the user's Claude subscription via the existing `claude` login. **No new npm
  dependency**, no secret handling inside ZAM.
- The Claude Code SDK (streaming) is a later upgrade path, not required now.

Candidate surfaces for the rest of Thomas' priority set (evaluated per harness at
implementation time, **not** committed here):

| Harness | Subscription | Likely headless surface | Priority |
|---------|--------------|-------------------------|----------|
| **Claude Code** | Claude Pro/Max | `claude -p … --output-format json`; images via `--add-dir` + paths | shipped (text + image) |
| **Antigravity CLI** | Google AI Pro | `agy -p …` (the CLI, not the IDE); multimodal via workspace image files | shipped (text + image) |
| **Codex** | ChatGPT Plus/Pro | `codex exec --json …`; images via `-i` | shipped (text + image) |
| **Grok** | SuperGrok | `grok -p … --output-format json`; images via `--prompt-json` base64 | shipped (text + image) |
| **GitHub Copilot** | Copilot seat | **surface TBD** — registered today only as an editor extension, not a text CLI; must be verified before an adapter | high, blocked on surface |

### 5. Near-zero setup

To approximate "no extra install", ZAM may **bootstrap the small CLI itself**
(as `zam agent install` already does for OpenCode). The learner then does a
one-time `claude` / `codex` login. For subscription users this is the closest
reachable point to zero configuration — a truly harness-free path is only
possible for metered API keys, which remain the Local/Cloud paths.

### 6. Fallback: explicit, never silent

The agent path is opt-in per entry. When the harness is offline, misconfigured, or
returns unparseable output, `generate` throws a **typed `AgentError` that names the
harness**. There is **no silent fallback to cloud** — that would bill the wrong
account and confuse a user who chose Agent deliberately. An explicit fallback is
still possible by placing a lower-priority HTTP `ModelEntry` after the agent entry
in `order`; the UI may offer a one-click "switch to Local/Cloud" without rewriting
harness config.

### 7. Architecture boundary (unchanged)

- **Kernel** stays HTTP- and harness-agnostic. `ModelEntry` gains only two
  optional *config* fields (`transport`, `agentHarness`) — pure metadata the
  kernel stores and never acts on. No harness or subprocess code under
  `src/kernel/`.
- **CLI** owns adapters, probes, subprocess spawning, and per-transport timeouts.
  Adapters are lazy-loaded so the optional surface never enters the eager module
  graph (ADR 2026-07-07).
- **MCP** remains the canonical *inbound* agent transport (harness → ZAM tools).
  This ADR is strictly the *outbound* direction and does not change MCP.

---

## Resolved open questions

1. **Binding syntax** → `ModelEntry.transport = "agent"` + `agentHarness`
   (registry data), not `llm.roles`, which is deprecated. (§2)
2. **One harness first vs abstract interface** → **abstract `AgentTextAdapter`
   from day one**, per-harness bespoke implementations; Claude Code is the
   reference. (§3)
3. **Invocation mechanism** → harness-native headless surface. Claude Code =
   subprocess `claude -p --output-format json`. Not `serve`/HTTP, not loopback
   MCP. (§4)
4. **Concurrency** → curriculum import stays sequential; no parallel harness
   sessions in phase 1.
5. **Desktop vs CLI** → adapters live in the CLI layer; the Desktop app consumes
   them through the same bridge/MCP commands rather than spawning its own harness.
6. **Status UX** → the adapter's `probe()` feeds the existing AI-status chips; no
   new `ensure-agent-llm` command.
7. **Relation to T3 native chat (ADR 2026-07-06a)** → agent-backed `text` is a
   **standalone third path**, not a stepping stone toward an embedded harness.

---

## Consequences

**Easier**

- Learners with a Claude/Copilot/ChatGPT/Google subscription configure AI once, in
  their harness, and ZAM reuses it for curriculum import and studio text tasks —
  no duplicate API keys, no separate billing.
- Large curriculum blocks run on the harness's capable model instead of a small
  local one.
- Reinforces the product story: "connect your agent" now means shared AI
  infrastructure, not only MCP tools.

**Harder**

- Two configuration worlds (ZAM registry vs harness config) must stay coherent in
  the UI without implying automatic sync.
- Per-harness adapters multiply test/maintenance cost; harness CLIs churn.
- Latency and cancellation differ from HTTP; `text` timeouts may need
  per-transport values.
- Security review: reading harness config for *display/health* must never scrape
  secrets into ZAM logs; the subprocess path avoids handling secrets at all.

---

## Implementation status

Phase 1 lands in this PR — the **Claude Code adapter wired into curriculum
import and the full recall loop**:

1. `src/cli/agent-llm/adapter.ts` — the `AgentTextAdapter` contract, `AgentError`,
   and a harness→adapter lookup.
2. `src/cli/agent-llm/claude-code.ts` — `ClaudeCodeAdapter` over
   `claude -p --output-format json`, with an injectable executor for tests.
3. `ModelEntry` (+ CLI `ProviderConfig`) gain `transport`/`agentHarness`. A shared
   `requestAgentCompletion()` helper delegates to the adapter when the resolved
   `text`/`recall` endpoint is agent-backed; `resolveUsableTextEndpoint` and
   `resolveUsableRecallEndpoint` short-circuit the HTTP online-chain for it
   (opt-in per caller so unwired callers fail with a clear message, not a bogus
   HTTP attempt).
4. Wired callers: `importCurriculumViaLLM` (text), and `generateQuestionViaLLM`,
   `evaluateAnswerViaLLM`, `discussReviewViaLLM` (recall — the discussion thread
   is flattened into one transcript prompt).
5. Contract tests with mocked harness responses; **no live `claude` in CI**.

Settings UI for adding an Agent model (desktop + MCP settings panel) lands in
this PR as a follow-up commit: third kind in the model form, `model-upsert
--transport agent --agent-harness <id>`, harness list filtered to adapters that
exist today (Claude Code).

Deferred to later PRs: remaining `text`-role callers (card split, foundation
proposals, Content Studio helpers), the Codex/Antigravity/Grok adapters, and
the auto-install bootstrap.

---

## Status history

| Date | State | Note |
|------|-------|------|
| 2026-07-12 | Proposed | Initial draft from curriculum-import pain (local timeouts). |
| 2026-07-24 | Accepted | Rebased onto the Unified Model Registry; reframed around subscription (OAuth-bound) access; open questions resolved; renamed to `2026-07-12a` to avoid the date collision with the unified-registry ADR. Phase-1 Claude adapter lands with this ADR. |
