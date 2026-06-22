# Pluggable AI Providers, Agent Harnesses, and Approachable UI Setup

**Status:** Proposed
**Date:** 2026-06-23
**Deciders:** Thomas (project owner)
**Related:**
[2026-06-20-observer-permission-model.md](2026-06-20-observer-permission-model.md) ·
[2026-06-22-screen-recording-observer.md](2026-06-22-screen-recording-observer.md) ·
[2026-06-13b-approachable-setup-and-self-update.md](2026-06-13b-approachable-setup-and-self-update.md) ·
[2026-05-31b-tauri-active-recall-studio.md](2026-05-31b-tauri-active-recall-studio.md)

---

## Context

ZAM is moving on two fronts at once: from a single local-LLM assumption toward
several external AI surfaces, and from a CLI-first bootstrap toward a UI-driven
setup in the desktop Studio. Local models are the privacy anchor but are often
too slow, or simply unavailable, on the machines learners actually use. Four
coupled questions surfaced while designing the Studio setup, and they share one
root: **how ZAM connects to external AI and to the user's machine.**

### Two different "AI" roles keep getting conflated

| | **Agent harness** | **Provider** |
|---|---|---|
| Role | The AI the learner *works with*; drives ZAM via `zam bridge` (JSON) | The model **ZAM itself calls** for vision interpretation and recall evaluation |
| Examples | Claude Code, Codex, Cursor, GitHub Copilot, Antigravity | MiMo-V2.5, DeepSeek-V4-Flash, local MiMo-VL/Gemma |
| Analogy | the teacher's *hands* | the tutor's *eyes & judgment* |
| Configured as | which harness + how to launch it (CLI vs app) | url / model / key / flavor, per role |

They are orthogonal: a learner may drive ZAM with **Claude Code** while ZAM uses
**local MiMo-VL** for vision and **DeepSeek** for recall. Modeling them as one
"AI setting" produces an incoherent UI; modeling them as two does not.

### Current state in code (forces at play)

- **Providers.** `getLlmConfig()` / `getVisionConfig()` in
  [`src/cli/llm/client.ts`](../../src/cli/llm/client.ts) read flat `llm.*` /
  `llm.vision.*` settings. [2026-06-22](2026-06-22-screen-recording-observer.md)
  added cloud-vision support by **detecting the endpoint URL and recommending a
  cheap model per provider** (`deepseek-v4-flash`, `openrouter/free`,
  `gemini-3.5-flash`, `gpt-5-mini`, `mimo-v2.5`). This works but hard-codes the
  provider matrix into readiness logic and gives no way to bind *different*
  models to *different jobs* (a cheap text model for recall, a vision model for
  the observer) or to express a fallback chain.
- **Harness launching.** [`src/cli/terminal-open.ts`](../../src/cli/terminal-open.ts)
  (extracted this increment) opens a terminal running a *ZAM* command
  (`zam learn`, `zam monitor`). There is no concept of launching an external
  agent harness pointed at the workspace.
- **Setup & data location.** `zam setup`
  ([`src/cli/commands/setup.ts`](../../src/cli/commands/setup.ts)) operates on
  `process.cwd()` — the personal-instance repo (skills, `CLAUDE.md`,
  `beliefs/`, `goals/`). The **database and secrets live elsewhere**, in the
  hidden `~/.zam/` (`zam.db`, `credentials.json`, `config.json`, observer
  reports), or in a Turso remote. The folder a learner selects is therefore
  *not* where their personal data lives, and the default data location is not
  discoverable.
- **Capture scope.** [2026-06-20](2026-06-20-observer-permission-model.md)
  defined `observer.scope` ∈ `off | window | fullscreen`, default `window`.
  Open Question #1 there — *when to escalate from single-window to full-display
  capture* — is still open.

---

## Decision

### 1. Role-based provider configuration

Replace the flat `llm.*` / `llm.vision.*` keys (and the URL-detection matrix
from [2026-06-22](2026-06-22-screen-recording-observer.md)) with **named
provider records bound to roles**, resolved by a single
`getProviderForRole(db, role)` so the kernel keeps one source of truth.

```jsonc
{
  "providers": {
    "local-vl": { "url": "http://localhost:8000/v1", "model": "mimo-vl",
                  "apiFlavor": "chat-completions" },                 // privacy path
    "mimo":     { "url": "https://api.xiaomi.com/mimo/v1", "model": "mimo-v2.5",
                  "apiFlavor": "chat-completions", "apiKeyRef": "mimo" },
    "deepseek": { "url": "https://api.deepseek.com/v1", "model": "deepseek-v4-flash",
                  "apiFlavor": "chat-completions", "apiKeyRef": "deepseek" },
    "anthropic":{ "url": "https://api.anthropic.com", "model": "claude-haiku-4-5",
                  "apiFlavor": "anthropic-messages", "apiKeyRef": "anthropic" }
  },
  "roles": {
    "vision": { "primary": "local-vl", "fallback": "mimo" },  // local-first (privacy)
    "recall": { "primary": "deepseek", "fallback": "mimo" },  // cheap cloud, fast
    "text":   { "primary": "deepseek" }
  }
}
```

- **`apiFlavor`** is an open union: `chat-completions` (OpenAI-compatible —
  covers MiMo, DeepSeek, OpenRouter, and Gemini's compat endpoint with **no new
  adapter**), `responses` (OpenAI Responses API), and `anthropic-messages` (the
  Messages API — `/v1/messages`, `x-api-key`, image blocks as
  `{type:"image",source:{type:"base64",…}}`; not OpenAI-shaped, so it needs one
  adapter function alongside the existing per-flavor request functions). The
  Anthropic flavor unlocks **structured outputs** (guaranteed report schema,
  retiring fragile fenced-JSON parsing) and **prompt caching** on the stable
  prefix.
- **Secrets never inline.** `apiKeyRef` points into the existing secret store
  [`~/.zam/credentials.json`](../../src/kernel/credentials.ts) (survives DB
  deletion, git-ignored), so workspace exports never carry keys.
- **Vision is local-first by default** — the privacy-critical role. Screenshots
  stay on-device unless the local VL model is down or refuses, and any cloud
  fallback is opt-in and still gated by the
  [ObserverPolicy](2026-06-20-observer-permission-model.md) sensitive-app filter
  *before* upload.
- **Cheap-first defaults for recall/text.** MiMo-V2.5 and DeepSeek-V4-Flash
  (both OpenAI-compatible) keep the cost of a capable tutor low enough that no
  ≥€6/month subscription is required; premium providers (Anthropic, OpenAI) are
  opt-in. Concrete model IDs stay in config because such tags churn.
- **Back-compat:** a shim reads the old `llm.*` keys so existing installs keep
  working through one release.

This **supersedes** the URL-detect-and-recommend mechanism in
[2026-06-22](2026-06-22-screen-recording-observer.md) by generalizing it: "detect
URL → recommend a model" becomes "named provider, explicitly bound to a role."

### 2. Agent harness registry (the "Agent" button)

Generalize `terminal-open.ts` from "open a terminal running a ZAM command" to
"launch the learner's selected, installed **agent harness** in the workspace,
ready to drive `zam bridge`."

```ts
interface AgentHarness {
  id: "claude-code" | "codex" | "cursor" | "copilot" | "antigravity";
  label: string;
  kind: "cli" | "app";
  detect(): boolean;                          // findExecutable() / app-path probe
  launch(o: { workspace: string; shell: TerminalShell }): void;
}
// cli → openTerminalWindow(cd workspace + harness command)   e.g. Claude Code in PowerShell
// app → spawn the executable (workspace as arg where supported) e.g. Codex / Copilot / Cursor / Antigravity
```

- Detection mirrors the Ollama probing already in
  [`src/kernel/system/installer.ts`](../../src/kernel/system/installer.ts).
- The Recall Studio surfaces **two** actions: **"Practice solo"** (today's
  `zam learn` console) and **"Open Agent"** (the harness). The button is labeled
  *Agent*, not *Terminal*.
- Ship **accessible-first**: GitHub Copilot app (free tier; `gpt-5-mini` is
  cheap there), Claude Code, Codex CLI — then Cursor, Antigravity. Gate the
  button on `detect()`; offer an install hint otherwise.
- The harness is purely the *driver*; it is independent of the provider config
  in Decision 1.

### 3. Workspace directory vs. machine state

Select a **visible workspace**, but **do not move the live database into it.**

- The UI setup picks a **workspace** (default `~/Documents/ZAM`, or chosen) for
  human-facing, git-trackable content: `beliefs/`, `goals/`, exports, the
  instance `CLAUDE.md`/`AGENTS.md`.
- The **live SQLite stays at `~/.zam/zam.db`.** It is the one path the CLI
  kernel, the Tauri backend
  ([`desktop/src-tauri/src/lib.rs`](../../desktop/src-tauri/src/lib.rs)), and the
  Rust observer ([`observer/src/privacy.rs`](../../observer/src/privacy.rs)) all
  agree on; [2026-06-13b](2026-06-13b-approachable-setup-and-self-update.md)
  already notes store-sandbox conflicts with writing `~/.zam`. Decisively, a
  live WAL SQLite file inside a cloud-synced Documents/OneDrive/iCloud folder is
  a known corruption hazard.
- "Accessible" is served instead by an **"Open data folder"** reveal action, a
  **backup/export** of the DB into the visible workspace, and **Turso** (already
  supported) for cross-machine sync. Relocating the live DB itself is possible
  but would require teaching all three consumers a configurable path; deferred.

### 4. Capture scope follows task type

Resolve Open Question #1 from
[2026-06-20](2026-06-20-observer-permission-model.md): scope is chosen by **what
the task is about**, not a single global default.

- **App-discovery / start-flow tasks** ("find and launch the right app") begin
  at **`fullscreen`** — the target window does not exist yet, so the observer
  must see the desktop/taskbar interaction.
- **Known-application tasks** start the app **for** the learner when its icon is
  pinned to the taskbar (ZAM launches it), then capture **`window`-only** — the
  app identity is known and the desktop need not be recorded.

This composes with the screen-recording observer
([2026-06-22](2026-06-22-screen-recording-observer.md)): the recording's early
frames may be fullscreen (discovery) and later frames window-scoped (execution),
under the same ObserverPolicy floor (the built-in sensitive denylist is always
enforced regardless of scope).

---

## Options weighed

**Providers — flat keys (status quo) vs. role-based records.** Flat
`llm.vision.*` + URL-detection is low-cost but cannot bind different models to
different jobs, express a fallback chain, or add a non-OpenAI wire format without
more special-casing. Role-based records cost a settings migration and one new
adapter (`anthropic-messages`) but give per-role model choice, explicit
fallbacks, and a single resolver. **Chosen: role-based**, with a back-compat
shim.

**Harness — bespoke per-command launchers vs. a registry.** The codebase already
has two near-identical launchers (`monitor open`, `learn open`); a third for each
harness would multiply that. A small registry with `detect`/`launch` keeps it
linear. **Chosen: registry.**

**Data location — workspace-holds-DB vs. machine-global DB + visible workspace.**
Putting the live DB in the selected (possibly cloud-synced) folder is what users
expect but risks SQLite corruption and breaks the single-path contract three
processes rely on. **Chosen: machine-global DB, visible workspace for content,
reveal + backup + Turso for accessibility.**

**Capture scope — single global default vs. task-typed.** A global `fullscreen`
over-captures known-app tasks; a global `window` cannot observe app discovery.
**Chosen: task-typed**, within the existing policy floor.

---

## Consequences

**Easier**
- One coherent setup: pick a workspace, pick (or detect) an agent, pick cheap
  providers per role — three orthogonal choices instead of one tangled one.
- Adding a provider is "url + model + key + flavor"; the cheap OpenAI-compatible
  defaults need zero new code.
- Learning stays cheap/free by default (local vision + MiMo/DeepSeek recall),
  with premium providers a one-line opt-in.

**Harder**
- A settings migration off `llm.*` / `llm.vision.*` and a back-compat shim for
  one release.
- One new wire adapter (`anthropic-messages`) and its tests.
- A harness registry with per-harness detection that must track external CLIs/apps.

**To revisit**
- Whether to ever allow relocating the live DB (vs. backup/export + Turso only).
- How task-type → capture-scope is declared: inferred by the session agent, or an
  explicit field on `zam session start`.
- Pricing/availability of the default providers (MiMo-V2.5, DeepSeek-V4-Flash)
  must be verified against the live catalogs; tags churn.

---

## Action Items

Ordered so a fresh agent can pick up any item; file paths are load-bearing.

1. [ ] **Provider records + resolver.** Add the `providers`/`roles` schema and
   `getProviderForRole(db, role)` in [`src/cli/llm/client.ts`](../../src/cli/llm/client.ts);
   route `getVisionConfig` → role `vision`, `getLlmConfig`/`evaluateAnswerViaLLM`
   → role `recall`. Keep the `{primary, fallback}` shape.
2. [ ] **`anthropic-messages` adapter.** Add the Messages-API request function in
   [`src/cli/llm/vision.ts`](../../src/cli/llm/vision.ts) beside the
   chat-completions / responses paths; use structured outputs for the report
   schema; check `stop_reason === "refusal"` before reading content.
3. [ ] **Back-compat shim + migration** from `llm.*` / `llm.vision.*`; `apiKeyRef`
   → [`credentials.ts`](../../src/kernel/credentials.ts).
4. [ ] **Reconcile with [2026-06-22](2026-06-22-screen-recording-observer.md):**
   fold the frame-sampling (`ffmpeg`/`maxFrames`) loop and the role-based
   per-endpoint flavor/fallback into one path (the WIP on
   `wip/codex-observer-vision-and-learn-open` is the starting point).
5. [ ] **Agent harness registry** generalizing
   [`terminal-open.ts`](../../src/cli/terminal-open.ts); detection à la
   [`installer.ts`](../../src/kernel/system/installer.ts); Studio "Open Agent"
   button + "Practice solo".
6. [ ] **Studio setup**: workspace picker (default `~/Documents/ZAM`), "Open data
   folder" reveal, DB backup/export into the workspace.
7. [ ] **Task-typed capture scope** in the session/observer flow; document the
   fullscreen→window transition in
   [windows-ui-observer-proposal.md](../windows-ui-observer-proposal.md).
