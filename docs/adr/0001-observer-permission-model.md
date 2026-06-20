# ADR-0001: Configurable Observer Permission Model (`ObserverPolicy`) and Two-Layer Consent

**Status:** Accepted
**Date:** 2026-06-20
**Deciders:** Thomas (project owner)
**Related:**
[windows-ui-observer-proposal.md](../windows-ui-observer-proposal.md) ·
[observer-next-steps.md](../observer-next-steps.md) ·
[ui-observation-protocol.md](../ui-observation-protocol.md) ·
[ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Context

ZAM's primary assessment mode is **observation over interruption**: the agent
watches the learner do real work and silently infers ratings. Observation Level 1
(shell) is mature. Level 2 (screen/UI) is partly built, and this is where the
permission problem surfaces.

A useful framing emerged while comparing ZAM's Observer to a coding agent's
**Computer Use** capability: *Computer Use = perceive + act* (screenshot + click +
type), whereas *the Observer = perceive only* (capture → vision → candidate
rating). The Observer is therefore the **read-only subset of Computer Use** — the
exact analog of the "read" tier a Computer-Use host grants to a browser: looking
is allowed, controlling is not. Computer Use's tier system *is* "configurable
permission per application." ZAM should have the equivalent for its Observer.

### Current state in code (the forces at play)

There are **two independent screen-capture paths with divergent permission
handling**:

| Path | Where | Permission model today |
|------|-------|------------------------|
| **Native Rust sidecar** `zam-observer.exe` | `observer/` (Phase 0 complete) | Rich: window picker, process/title allow- & denylists, automatic pause for password managers / banking / private browsing / UIA password fields, custom policy via the **`ZAM_OBSERVER_PRIVACY_POLICY` env var**. Built-in sensitive contexts cannot be bypassed by custom allow rules. |
| **`capture-ui` bridge command** | [`src/cli/commands/bridge.ts:910`](../../src/cli/commands/bridge.ts) (`captureScreenshot()` at :950) | **None.** Validates only the *format* of `--hwnd` / `--process-name` (injection guard). Default is a **full-screen** grab. No consent gate, no allow/deny, no retention rule. |

This divergence is the core problem:

1. **No single source of truth.** The sidecar's policy lives in an env var; the
   bridge command has no policy at all. A learner who configures privacy for the
   desktop watch flow gets **zero** protection when a headless CLI agent (Codex,
   Claude Code — "Approach C" in [SKILL.md](../../.agents/skills/zam/SKILL.md))
   calls `capture-ui`.
2. **Not user-configurable through the product.** Policy is an env var, not a
   `zam settings` key. ZAM already has a key/value settings store
   ([`src/kernel/models/settings.ts`](../../src/kernel/models/settings.ts), table
   `user_config`) used for things like `monitor_method` — the natural home.
3. **The bridge protocol has no permission vocabulary.**
   [`src/bridge/protocol.ts`](../../src/bridge/protocol.ts) defines no consent /
   scope / denied shape, even though the report schema in
   [`src/kernel/observation/ui-observer.ts`](../../src/kernel/observation/ui-observer.ts)
   *already* has a `privacy-pause` kind and a per-evidence `redacted` flag.
   Privacy is modelled in the **report**, but never **enforced at capture** on
   the bridge path.

The proposal doc already lists allow/deny lists, per-session window selection, and
automatic sensitive-context pause as **MVP requirements, not later polish**
([windows-ui-observer-proposal.md](../windows-ui-observer-proposal.md) §Privacy and
Safety). This ADR makes that requirement first-class and, critically, *shared
across both capture paths*.

### Why this matters beyond ZAM's own CLI

MCP (Model Context Protocol) is an open standard: any MCP-capable host (Claude
Code, Codex, Cursor, Cline, Zed, …) can call any MCP server. Today every AI CLI
needs a ZAM-specific skill that knows the `zam bridge …` commands — a custom
integration per client. A future `zam mcp serve` would expose ZAM capabilities —
including the Observer — as native MCP tools usable by *any* agent. That makes the
permission model a **public contract**, not an internal detail, and raises the
stakes for getting it right now.

---

## Decision

Introduce a single, typed, user-configurable **`ObserverPolicy`** in the kernel
that **both** capture paths consult and enforce, and formalize a **two-layer
consent model** that cleanly separates host responsibility from ZAM
responsibility.

### Two-layer consent model

```
┌─ Layer 1 — Invocation gate (HOST-owned) ────────────────────────────┐
│ "May this agent invoke ZAM's observe capability at all?"             │
│   today:  `zam bridge capture-ui` is a shell command → gated by the  │
│           agent harness's command-permission system                  │
│   future: `zam_observe` MCP tool → gated by the MCP host's           │
│           tool-consent UI (the request_access analog)                │
└─────────────────────────────────────────────────────────────────────┘
                              │  invocation allowed
                              ▼
┌─ Layer 2 — Capture policy (ZAM-owned, LOAD-BEARING) ────────────────┐
│ "Given an invocation, what may actually be captured, what is         │
│  redacted, how long is it retained?"  →  the ObserverPolicy.         │
│ Enforced by ZAM regardless of which agent/host called it, because    │
│ ZAM holds the camera (PowerShell/.NET or the Rust sidecar).          │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle:** Layer 1 is *necessary but not sufficient*. A host can only gate
*whether* the tool runs; it cannot scope *what* ZAM's camera then captures. A host
that sees only "agent called `zam.observe`" cannot prevent a full-screen grab over
a banking window. Therefore the configurable permissions **must** live inside ZAM
(Layer 2) and cannot be delegated to the host.

### `ObserverPolicy` shape

A typed policy resolved from `user_config` with safe defaults, defined in the
kernel so every path (bridge CLI today, MCP server later) shares one
implementation:

```ts
// src/kernel/observation/policy.ts
export interface ObserverPolicy {
  version: 1;
  scope: "off" | "window" | "fullscreen";          // default "window"
  allowlist: string[];      // process names permitted for capture
  denylist: string[];       // process names NEVER captured (merged with built-in set)
  consent: "per-capture" | "per-session" | "standing"; // default "per-session"
  retention: "none" | "session" | "persist";       // default "none" (no disk artifacts)
  redactWindowTitles: boolean;                      // default true
  audioOptIn: boolean;                              // default false (think-aloud narration)
}
```

**Invariant (preserved from the Rust observer):** a **built-in sensitive denylist**
(password managers, authentication/UAC dialogs, banking, private browsing, UIA
password fields, Windows secure desktop) is *always* enforced and **cannot be
overridden** by a user `allowlist`. User config can only make the policy *stricter*
than the built-in floor, never looser.

Mapping each axis to the Computer-Use analogy:

| Axis | Setting key (`user_config`) | ≈ Computer Use |
|------|------------------------------|----------------|
| Scope | `observer_scope` | which app may be seen |
| Allowlist | `observer_allowlist` | per-application grant |
| Denylist | `observer_denylist` | (stronger — background observation raises stakes) |
| Consent timing | `observer_consent` | `request_access` timing |
| Retention | `observer_retention` | (no CU equivalent) |

Defaults derive from the active **symbiosis mode**: *shadowing* → `per-session` +
`window` (only the task window); *autonomy* → `standing` grant. This falls out of
the existing mode machinery in [ARCHITECTURE.md](../ARCHITECTURE.md) §Symbiosis Modes.

---

## Options Considered

### Option A: Env-var policy only (status quo, extended)

Keep `ZAM_OBSERVER_PRIVACY_POLICY` for the sidecar; add a parallel env var for
`capture-ui`.

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | Low |
| Scalability | Poor — two divergent policies persist |
| Team familiarity | High (already exists on Rust side) |

**Pros:** minimal change; reuses existing Rust mechanism.
**Cons:** not discoverable or configurable via `zam settings`; env vars are a poor
UX for end users; keeps the two paths divergent; no consent-timing or retention
concept; not introspectable by an agent or MCP host.

### Option B: Typed `ObserverPolicy` in the kernel, shared by both paths *(recommended)*

Single source of truth in `src/kernel/observation/policy.ts`, persisted in
`user_config`, consulted by `capture-ui` and passed to the Rust sidecar. Protocol
gains permission/denied shapes. Optional `zam observer grant/revoke/status` sugar.

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Cost | Medium (cross-language plumbing + protocol bump) |
| Scalability | High — one policy serves bridge **and** future MCP server |
| Team familiarity | High (kernel + settings patterns already established) |

**Pros:** single source of truth; discoverable/configurable via existing settings;
unifies both capture paths; adds consent-timing + retention; agent-introspectable;
maps to symbiosis modes; reuses the same enforcement code under a future
`zam mcp serve`.
**Cons:** must plumb the resolved policy into the Rust sidecar (TS↔Rust contract);
protocol version bump; one-release migration off `ZAM_OBSERVER_PRIVACY_POLICY`.

### Option C: Delegate gating to the host / MCP layer

Rely on the MCP host / CLI permission system to gate capture; ZAM stays
permissionless.

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low (no ZAM policy code) |
| Cost | Low |
| Scalability | Fails the safety requirement |
| Team familiarity | n/a |

**Pros:** no ZAM-side policy code; leverages host consent UI.
**Cons:** **fundamentally insufficient.** ZAM holds the camera; the host can gate
*whether* the tool runs but not *what* is captured, redacted, or retained. Cannot
enforce the built-in sensitive denylist. Rejected on safety grounds — but it
motivates documenting Layer 1 vs Layer 2 explicitly.

---

## Trade-off Analysis

The decisive trade-off is **Option A's low cost vs. Option B's correctness and
reach.** Option A leaves the headless-agent path (the very path this whole thread
started from) unprotected and keeps two policies drifting apart. Option C is
attractively cheap but is unsound precisely because of the two-layer insight: the
party holding the camera must own the capture policy.

Option B costs a protocol bump and a TS↔Rust policy contract, but it is the only
option that (a) protects **both** capture paths, (b) is configurable through the
product rather than env vars, and (c) is reusable verbatim when ZAM later exposes
`zam_observe` over MCP. The cost is paid once; the contract serves every current
and future agent.

**Chosen: Option B.**

---

## Consequences

**Easier**
- Any agent (Claude Code, Codex, future MCP clients) gets consistent, safe capture
  with one configuration.
- Learners configure observation privacy once via `zam settings`; it applies to
  desktop watch *and* headless `capture-ui`.
- The two capture paths stop diverging — one policy, one enforcement contract.
- Clean, low-marginal-cost path to `zam mcp serve` (Layer 1 = MCP consent, Layer 2
  = same `resolveObserverPolicy`).

**Harder**
- A cross-language policy contract (TypeScript ↔ Rust) must be defined and kept in
  sync; the sidecar stops reading its own env var and receives resolved policy
  instead.
- `src/bridge/protocol.ts` gains permission/denied types and a version bump; the
  built-in sensitive denylist must remain authoritative over user config.
- `capture-ui` callers must handle a new `denied` / `privacy-pause` response
  instead of always receiving a screenshot — SKILL.md Approach C needs updating.

**To revisit**
- When to escalate from single-window to full-display capture (proposal Open
  Question #1).
- Retention & encryption of derived evidence — DPAPI vs. no-disk default (Open
  Question #4).
- Where the consent prompt for `per-capture` lives: desktop app, CLI prompt, or
  MCP host UI.

---

## Action Items

Ordered so a fresh agent with a token budget can pick up any item. File paths are
load-bearing.

> **Progress (2026-06-20):** Items 1–4 are done. The wire-contract half of item 3
> (`CaptureUiResponse` / `ObserverPermission` / `denialReason` / the denied
> variant) shipped with them; the `GetObserverPolicyResponse` introspection
> endpoint (`zam bridge get-observer-policy`) completes it. Item 8 is partly done (SKILL.md Approach C updated;
> ARCHITECTURE.md + proposal note still TODO). Settings keys are dotted
> (`observer.scope`, …), not `observer_*` — see item 5. Enforcement is two-phase
> (pre-capture for scope/explicit target; post-resolution for the captured
> window's process/title); the deny discriminator is `denialReason`, not the
> originally sketched `kind: "privacy-pause"`. Item 4: the native Rust sidecar
> now resolves `<observer-dir>/policy.json` (kernel-written;
> `ZAM_OBSERVER_PRIVACY_POLICY` is a deprecated fallback), and the kernel writes
> it via `zam bridge sync-observer-policy` and on every `observer.*` settings
> change — one policy source for both capture paths. Caveat: if the desktop
> launches the observer with a custom `ZAM_OBSERVER_DIR`, the sync must target
> that dir.

1. [x] **Define the policy.** Add `ObserverPolicy`, defaults, the built-in
   sensitive denylist, and `resolveObserverPolicy(db)` in
   `src/kernel/observation/policy.ts`. Unit tests in
   `tests/kernel/observation/observer-policy.test.ts` (built-in denylist must win
   over user allowlist; default = `window`/`per-session`/`none`).
2. [x] **Enforce on the bridge path.** In
   [`src/cli/commands/bridge.ts`](../../src/cli/commands/bridge.ts) `capture-ui`:
   before `captureScreenshot()`, resolve policy → if `scope: "off"` or target is
   denylisted or the frontmost window is sensitive, return a typed
   `{ denied: true, reason, kind: "privacy-pause" }` instead of pixels; honor
   `consent` and `retention`.
3. [x] **Extend the contract.** In
   [`src/bridge/protocol.ts`](../../src/bridge/protocol.ts) add a typed
   `CaptureUiResponse` (currently ad hoc), an exported `ObserverPolicy`, a
   `GetObserverPolicyResponse` (lets an agent ask "what may I capture?"), and the
   `denied` variant. Bump the policy/protocol version.
4. [x] **Unify the sidecar.** Replace the Rust observer's
   `ZAM_OBSERVER_PRIVACY_POLICY` env path with the resolved policy passed from the
   kernel (JSON on spawn or a resolved config file). Keep the env var as a
   deprecated fallback for one release.
5. [ ] **Expose settings.** Wire the `observer.*` keys through `zam settings`; add
   optional `zam observer grant|revoke|status` sugar over the picker. Surface an
   unset-policy prompt at the first `--context ui` session (per
   [user-settings.md](../concepts/user-settings.md) discoverability).
6. [ ] **Mode presets.** Map symbiosis modes → default policy presets
   (shadowing/copilot/autonomy).
7. [ ] **(Later) MCP.** Sketch `zam mcp serve` exposing `zam_observe` with declared
   tool-consent (Layer 1); reuse `resolveObserverPolicy` + enforcement (Layer 2).
8. [ ] **Docs.** Update [ARCHITECTURE.md](../ARCHITECTURE.md) (Observation Levels +
   policy), note the partial resolution of Open Question #1 in
   [windows-ui-observer-proposal.md](../windows-ui-observer-proposal.md), and
   document the `denied` response in
   [SKILL.md](../../.agents/skills/zam/SKILL.md) Approach C.
