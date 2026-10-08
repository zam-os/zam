---
type: architecture
title: Observer Privacy Model and Policy Enforcement
description: The machine-local screen observation switch, two-layer consent and the ObserverPolicy contract for screen capture, and how shell observation is redacted and retained.
tags:
  - observer
  - privacy
  - boundaries
  - security
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/observer-privacy-model.md"
timestamp: 2026-10-08T20:10:00Z
---

ZAM observes learner activity to assess mastery silently without interrupting flow.
Because visual observation captures screen contents, privacy and consent are
first-class requirements enforced across both headless CLI grabs and the native
Rust observer sidecar. Until ZAM's own screen capture is removed (ADR
2026-10-08), every screen surface sits behind one machine-local switch that is
off by default.

# Screen Observation Switch

`observation.screen` in the machine-local `~/.zam/config.json` (or the file
named by `ZAM_CONFIG_PATH`) decides whether any screen surface runs at all.
Only a literal `true` turns it on; a missing file, a missing key, `false`, the
string `"true"` or an unreadable file all mean off.

- **What it covers.** `zam bridge capture-ui` (live capture and `--image`),
  `start-recording`, `stop-recording`, `observe-ui-snapshot` (images and
  video), and the read-back of stored observer reports through
  `get-observations` and `observe-ui-watch`. Each returns a typed refusal with
  `denied: true` and `denialReason: "screen-observation-off"` before it
  captures, reads a file, starts ffmpeg or calls a model. `stop-recording`
  still stops a recording started while the switch was on, and deletes its
  file instead of returning it. `observeUiSnapshotViaLLM`
  (`src/cli/llm/vision.ts`) checks the switch too, so no caller reaches the
  vision model past it. A UI session's synthesis reads no observer reports
  while the switch is off and returns no candidates.
- **Who can write it.** Nobody but the learner, by editing the file. It is not
  a database setting, so `setting-set` cannot reach it, and turning
  `llm.vision.enabled` on does not open it. No bridge command or MCP tool
  writes the `observation` section of `config.json`.
- **Desktop shell.** The Tauri shell starts the sidecar itself, so it reads the
  same file with its own reader (`desktop/src-tauri/src/machine_config.rs`),
  which resolves the path exactly like the kernel. The sidecar runtime is
  resolved in one place, and that place checks the switch first, so no Tauri
  command starts the sidecar while it is off. The developer-only observer
  panel stays hidden unless the switch is on.
- **Reporting.** `zam bridge get-observer-policy` and `zam observer status`
  report `screenObservation: "on" | "off"`, and a UI session started while the
  switch is off carries the refusal text as its `observerPolicyHint`.

The switch does not stop an agent with its own shell from capturing the
screen; it ensures ZAM is not the tool that does it.

# Two-Layer Consent Model

With the switch on, responsibility is split between the calling environment
and the ZAM kernel:

1. **Layer 1 — Invocation Gate (Host-owned):** The host environment (CLI
   permissions or MCP tool-consent confirmation) decides *whether* an AI agent
   may invoke screen capture at all.
2. **Layer 2 — Capture Policy (ZAM-owned):** Even when invocation is granted,
   the ZAM kernel's `ObserverPolicy` (`src/kernel/observation/policy.ts`) decides
   *what* a given capture is permitted to see. ZAM controls the camera and
   enforces the boundaries.

The policy applies to live captures only. A caller-provided `--image` and the
video path (`start-recording`, `observe-ui-snapshot`) never consult it, which
is why the switch sits in front of them.

# The `ObserverPolicy` Contract

The policy is resolved from the `observer.*` settings (`zam settings`),
falling back to active symbiosis mode presets, then safe defaults. The
`observer.*` keys are **machine-scoped** (ADR 2026-09-04 Decision 4): what a
capture may see depends on the machine in front of the learner, so each
install keeps its own row in `user_settings`, and on a shared team library
no other member can read or change it. On a personal library the last write
is mirrored to `user_config`, where older clients still look.

- `scope`: `"off"` disables observation completely; `"window"` requires an explicit
  target (`--process-name` or `--hwnd`); `"fullscreen"` permits untargeted captures.
  Default is `"window"`.
- `allowlist`: lower-cased process names permitted under window scope. An empty
  allowlist permits any window that is not denylisted.
- `denylist`: user-defined process or title substring fragments never captured.
- `consent`: `"per-capture"`, `"per-session"`, or `"standing"`. Default is
  `"per-session"`.
- `retention`: `"none"` (ephemeral in-memory analysis only), `"session"`, or
  `"persist"`. Default is `"none"`. The value is declared, not enforced; what
  actually deletes observation files is the retention described under
  *Shell Observation* below.
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

This floor is authoritative on the TypeScript capture path: a user's `allowlist`
can never override or bypass a built-in sensitive match. The native sidecar
carries its own built-in set (see below).

# Two-Phase Capture Gate

Every live capture passes two evaluation phases:

1. **Phase 1 (`decidePreCapture`):** Evaluated before any pixels are read.
   Rejects immediately if `scope === "off"`, if `scope === "window"` without an
   explicit target, or if the requested process matches the sensitive floor,
   matches the denylist, or — under window scope with a non-empty allowlist —
   is not on the allowlist. No screenshot is taken on denial.
2. **Phase 2 (`decidePostCapture`):** Evaluated after the target window handle is
   resolved to an actual process name and window title. If the resolved window
   matches the sensitive floor, the denylist, or fails the allowlist — or if
   window scope silently fell back to a fullscreen grab because the target
   could not be resolved — the captured pixels are immediately discarded.

# Native Rust Sidecar

The native Rust observer sidecar (`observer/`) does not evaluate `ObserverPolicy`
itself. `syncObserverSidecarPolicy(db)` (`src/kernel/observation/observer-sidecar-policy.ts`)
resolves the policy and writes only its user-configurable lists to
`<observer-dir>/policy.json` (mode `0o600`) in the sidecar's `WindowPrivacyPolicy`
wire shape: `allowProcesses` from the allowlist, and `denyProcesses` plus
`denyTitleMarkers` both from the denylist, so a denylist term blocks on process
or title. `scope`, `consent`, `retention`, `redactWindowTitles` and `audioOptIn`
are not part of the file; they govern the TypeScript capture path only.

On top of that file the sidecar enforces its own built-in sensitive set
(`observer/src/privacy.rs`), which overlaps with but is not identical to
`BUILT_IN_SENSITIVE_MATCHERS`: the sidecar additionally blocks private-browsing
window titles, broader authentication markers (`2fa`, `passkey`, `sign in`,
`password`, German equivalents) and financial titles (`paypal`, `checkout`,
`banking`), while it does not list the Windows credential surfaces `consentux`,
`logonui` and `windowssecurity` or the `nordpass` process. Neither list can be
overridden by `policy.json`.

The UI Automation channel (`observer/src/uia.rs`) reports control type,
automation id and the accessible name of the focused element, never its value.
An element without an accessible name reports an empty name: the sidecar no
longer reads pixels to name it (the OCR fallback was removed under ADR
2026-10-08). The accessible name is still screen text — a label, a document
title, a customer name in a list — so UI Automation events are not
content-free.

# Shell Observation: Redaction and Retention

The shell monitor (`zam monitor`) is not a screen surface and is not behind
the switch, but the same ADR governs what it keeps:

- **Redaction on every read.** The shell hooks append command lines to
  `~/.zam/monitor/<session>.jsonl` themselves, so ZAM redacts on the way out:
  `readMonitorLog` (`src/kernel/observation/monitor-io.ts`) is the only read
  path, and every command it returns went through `redactCommand`
  (`src/kernel/observation/redact.ts`). `zam_monitor`, the bridge monitor
  commands, synthesis candidates, unmatched commands and skill discovery all
  read through it. Values in known secret positions become `[redacted]`:
  environment assignments, flags and headers whose name says secret, URL
  credentials, `key=value` pairs and JSON fields with a secret-sounding key,
  per-command positions (mysql `-p…`, `curl -u`, `docker -e`, `net use`,
  `sshpass`, `config set`), values piped into a command that reads a secret
  from stdin, here-strings, heredoc bodies, JWTs, private keys, well-known
  token formats and high-entropy strings. A secret in an unknown position
  with low entropy survives; redaction is weaker than having no content.
- **Redaction at rest.** The log is rewritten in redacted form at
  `zam monitor stop` and at session end, and a sweep redacts any log idle for
  ten minutes. Texts an agent sends back for a confirmed synthesis are
  redacted again before they reach the shared database.
- **Retention.** A session's raw monitor log and observer reports are deleted
  once the learner confirms or dismisses its synthesis
  (`zam_observation_close`, `zam observation close`, the Settings → Data
  action, or `zam session end --synthesize` after the candidates), and at the
  latest after `observation.retentionDays` (default 14) in `config.json`. A
  value-free digest of the session's command prefixes stays for skill
  discovery. The sweep (`src/kernel/observation/retention.ts`) runs at session
  end, `zam monitor start`, `zam mcp` start and `zam bridge serve` start. It
  never consults the database, so a confirmation on another machine deletes
  nothing here. Sessions that started before retention first ran on a
  machine are legacy: redacted, but deleted only after the owner confirms
  `zam observation inventory --delete`.

# Citations

- [ADR 2026-10-08 — Observation Without Content](../adr/2026-10-08-skill-learner-observation.md)
- [ADR 2026-06-20 — Configurable Observer Permission Model and Two-Layer Consent](../adr/2026-06-20-observer-permission-model.md)
- [ADR 2026-09-04 — Team Library on PostgreSQL with Entra](../adr/2026-09-04-team-library-postgres-entra-pilot.md)
- Code: `src/kernel/observation/screen-switch.ts`, `src/kernel/observation/redact.ts`, `src/kernel/observation/retention.ts`, `src/kernel/observation/monitor-io.ts`, `src/kernel/system/install-config.ts`, `src/kernel/observation/policy.ts`, `src/kernel/observation/observer-sidecar-policy.ts`, `src/kernel/observation/ui-observer-io.ts`, `src/kernel/models/settings.ts`, `src/cli/commands/bridge.ts`, `src/cli/llm/vision.ts`, `desktop/src-tauri/src/machine_config.rs`, `observer/src/privacy.rs`, `observer/src/uia.rs`
