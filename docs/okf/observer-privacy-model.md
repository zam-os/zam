---
type: architecture
title: Observer Privacy Model and Policy Enforcement
description: Two-layer consent and the ObserverPolicy contract that governs screen capture across the CLI and the native Rust observer sidecar.
tags:
  - observer
  - privacy
  - boundaries
  - security
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/observer-privacy-model.md"
timestamp: 2026-09-11T17:10:00Z
---

ZAM observes learner activity to assess mastery silently without interrupting flow.
Because visual observation captures screen contents, privacy and consent are
first-class requirements enforced across both headless CLI grabs and the native
Rust observer sidecar.

# Two-Layer Consent Model

Responsibility is split cleanly between the calling environment and the ZAM kernel:

1. **Layer 1 — Invocation Gate (Host-owned):** The host environment (CLI
   permissions or MCP tool-consent confirmation) decides *whether* an AI agent
   may invoke screen capture at all.
2. **Layer 2 — Capture Policy (ZAM-owned):** Even when invocation is granted,
   the ZAM kernel's `ObserverPolicy` (`src/kernel/observation/policy.ts`) decides
   *what* a given capture is permitted to see. ZAM controls the camera and
   enforces the boundaries.

# The `ObserverPolicy` Contract

The policy is resolved from user configuration (`user_config` table via `zam settings`),
falling back to active symbiosis mode presets, then safe defaults:

- `scope`: `"off"` disables observation completely; `"window"` requires an explicit
  target (`--process-name` or `--hwnd`); `"fullscreen"` permits untargeted captures.
  Default is `"window"`.
- `allowlist`: lower-cased process names permitted under window scope. An empty
  allowlist permits any window that is not denylisted.
- `denylist`: user-defined process or title substring fragments never captured.
- `consent`: `"per-capture"`, `"per-session"`, or `"standing"`. Default is
  `"per-session"`.
- `retention`: `"none"` (ephemeral in-memory analysis only), `"session"`, or
  `"persist"`. Default is `"none"`.
- `redactWindowTitles`: boolean (default `true`), redacts title strings from stored logs.
- `audioOptIn`: boolean (default `false`), microphone audio is strictly opt-in.

Symbiosis modes provide defaults when settings are unconfigured: `autonomy`
defaults to `{ scope: "fullscreen", consent: "standing" }`; `shadowing` and `copilot`
default to `{ scope: "window", consent: "per-session" }`.

# Built-In Sensitive Floor

An immutable sensitive context filter is hardcoded in `BUILT_IN_SENSITIVE_MATCHERS`:

- **Password managers:** `1password`, `bitwarden`, `keepass`, `lastpass`, `dashlane`,
  `nordpass`, `enpass`, `proton pass`.
- **System credential and authentication surfaces:** `credentialuibroker`, `consentux`,
  `logonui`, `windowssecurity`, `authenticator`.
- **Banking hints:** `online banking`, `onlinebanking`.

This floor is authoritative: a user's `allowlist` can never override or bypass
a built-in sensitive match.

# Two-Phase Capture Gate

Every capture passes two evaluation phases:

1. **Phase 1 (`decidePreCapture`):** Evaluated before any pixels are read.
   Rejects immediately if `scope === "off"`, if `scope === "window"` without an
   explicit target, or if the requested process matches the sensitive floor or
   the denylist. No screenshot is taken on denial.
2. **Phase 2 (`decidePostCapture`):** Evaluated after the target window handle is
   resolved to an actual process name and window title. If the resolved window
   matches the sensitive floor, the denylist, or fails the allowlist, the captured
   pixels are immediately discarded.

# Native Rust Sidecar Synchronization

The native Rust observer sidecar (`observer/`) shares the exact same policy
definition with the TypeScript kernel (`src/kernel/observation/observer-sidecar-policy.ts`).
Calling `syncObserverSidecarPolicy(db)` serializes the policy into
`<observer-dir>/policy.json` (mode `0o600`), mapping the policy to `SidecarPrivacyPolicy`
(`allowProcesses`, `denyProcesses`, `denyTitleMarkers`). The Rust sidecar reads this
file directly, ensuring headless CLI commands and background sidecar keyframe
monitoring share one source of truth.

# Citations

- [ADR 2026-06-20 — Configurable Observer Permission Model and Two-Layer Consent](../adr/2026-06-20-observer-permission-model.md)
- Code: `src/kernel/observation/policy.ts`, `src/kernel/observation/observer-sidecar-policy.ts`, `src/kernel/observation/ui-observer-io.ts`, `src/cli/commands/bridge.ts`
