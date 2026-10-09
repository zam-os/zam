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
timestamp: 2026-10-09T09:30:00Z
---

ZAM observes learner activity to assess mastery silently without interrupting flow.
Because visual observation captures screen contents, privacy and consent are
first-class requirements. Until ZAM's own screen capture is removed (ADR
2026-10-08), every remaining screen surface sits behind one machine-local
switch that is off by default. The screen-recording path and the desktop
observer panel were deleted outright, because nobody used them.

# Screen Observation Switch

`observation.screen` in the machine-local `~/.zam/config.json` (or the file
named by `ZAM_CONFIG_PATH`) decides whether any screen surface runs at all.
Only a literal `true` turns it on; a missing file, a missing key, `false`, the
string `"true"` or an unreadable file all mean off.

- **What it covers.** `zam bridge capture-ui` (live capture and `--image`),
  `observe-ui-snapshot`, and the read-back of stored observer reports through
  `get-observations` and `observe-ui-watch`. Each returns a typed refusal with
  `denied: true` and `denialReason: "screen-observation-off"` before it
  captures, reads a file or calls a model. `observeUiSnapshotViaLLM`
  (`src/cli/llm/vision.ts`) checks the switch too, so no caller reaches the
  vision model past it. A UI session's synthesis reads no observer reports
  while the switch is off and returns no candidates.
- **Who can write it.** Nobody but the learner, by editing the file. It is not
  a database setting, so `setting-set` cannot reach it, and turning
  `llm.vision.enabled` on does not open it. No bridge command or MCP tool
  writes the `observation` section of `config.json`.
- **Reporting.** `zam bridge get-observer-policy` and `zam observer status`
  report `screenObservation: "on" | "off"`, and a UI session started while the
  switch is off carries the refusal text as its `observerPolicyHint`.

The switch does not stop an agent with its own shell from capturing the
screen; it ensures ZAM is not the tool that does it.

# Removed Surfaces

ADR 2026-10-08 (open question 3) found that nobody used them, so they were
deleted instead of guarded:

- `zam bridge start-recording` and `stop-recording` (full-screen ffmpeg
  recording) and video input to `observe-ui-snapshot`, which now reads one
  PNG or JPEG image and refuses a video file;
- the desktop observer panel with its timed loop and watch, and every Tauri
  command that started the observer sidecar. The desktop shell no longer
  starts the sidecar at all.

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

The policy applies to live captures only. A caller-provided `--image` and
`observe-ui-snapshot` never consult it, which is why the switch sits in front
of them.

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

The native Rust observer sidecar (`observer/`) is built and tested in CI but
no longer ships with the desktop app, and nothing in ZAM starts it: whatever
can capture the screen is a separate install, so an organisation can
prohibit it with its own inventory and application-control tooling (ADR
2026-10-08, trade-off on packaging). Built from source it runs only when
invoked by hand (`zam-observer watch …`). It does not evaluate
`ObserverPolicy` itself.
`syncObserverSidecarPolicy(db)` (`src/kernel/observation/observer-sidecar-policy.ts`)
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
  environment assignments, flags and headers whose name says secret
  (including PowerShell `-Name:value` bindings and, inside cmdlets and
  scripts, unique prefixes of secret parameters such as `-Pa`), URL
  credentials, `key=value` pairs and JSON fields with a secret-sounding key,
  also inside double-quoted shell arguments, per-command positions (mysql
  `-p…`, `docker login -p`, `curl -u`, `docker -e`, `net use`, `setx`,
  `sshpass`, `config set`), values piped into a command that reads a secret
  from stdin (`--password-stdin`, `sudo -S`), here-strings, heredoc bodies,
  JWTs, private keys, well-known token formats and high-entropy strings. A
  secret in an unknown position with low entropy survives; redaction is
  weaker than having no content. No read returns the working directory, and
  the rewrite at rest drops it too. Monitor patterns are case-insensitive
  substrings, and each is redacted like the command before the comparison,
  so a skill step that contains a value still matches.
- **Redaction at rest.** The log is rewritten in redacted form at
  `zam monitor stop`, and a sweep redacts any log idle for ten minutes. Texts
  an agent sends back for a confirmed synthesis are redacted again before they
  reach the shared database. Command texts that confirmed syntheses stored in
  the library before redaction existed were deleted by migration M039; the
  ratings stayed.
- **Retention.** A raw log is evidence only while it is captured. When the
  session ends (`zam_session_end`, `zam session end`), ZAM prepares the
  synthesis candidates from it and then deletes the session's raw monitor log
  and observer reports; the candidates carry the redacted texts the learner
  confirms. A session that never ends loses them after 24 hours
  (`observation.retentionDays` in `config.json`, default 1).
  `zam_observation_close`, `zam observation close` and the Settings → Data
  action drop a running session's evidence sooner. The sweep
  (`src/kernel/observation/retention.ts`) runs at session end,
  `zam monitor start`, `zam mcp` start and `zam bridge serve` start, and every
  hour while `zam mcp` or `zam bridge serve` runs. It never
  consults the database, so a session ended on another machine deletes nothing
  here before the window. It never writes a `config.json` that does not parse,
  and while the file is unreadable it deletes nothing. Sessions that started
  before retention first ran on a machine are legacy: redacted, but deleted
  only after the owner confirms `zam observation inventory --delete`.
- **Digests and skill discovery.** Before a raw log goes, ZAM writes a digest
  to `~/.zam/monitor/digests/<session>.json`: the session's commands reduced
  to tool and subcommand (`git checkout`, `npm run build`), in order and
  redacted, with no arguments, times, exit codes or working directories, and
  without trivial commands such as `cd` or `ls`. Only the newest 200 are kept.
  They are the one thing observation leaves behind, and they exist for
  `zam bridge discover-skills`, which proposes a skill for every sequence of
  two to five steps that recurs across sessions
  (`src/kernel/observation/skill-discovery.ts`). Discovery is bridge-only; no
  MCP tool or Studio view calls it yet.

# Citations

- [ADR 2026-10-08 — Observation Without Content](../adr/2026-10-08-skill-learner-observation.md)
- [ADR 2026-06-20 — Configurable Observer Permission Model and Two-Layer Consent](../adr/2026-06-20-observer-permission-model.md)
- [ADR 2026-09-04 — Team Library on PostgreSQL with Entra](../adr/2026-09-04-team-library-postgres-entra-pilot.md)
- Code: `src/kernel/observation/screen-switch.ts`, `src/kernel/observation/redact.ts`, `src/kernel/observation/retention.ts`, `src/kernel/observation/skill-discovery.ts`, `src/kernel/observation/analyzer.ts`, `src/kernel/observation/monitor-io.ts`, `src/kernel/db/provision.ts`, `src/kernel/system/install-config.ts`, `src/kernel/observation/policy.ts`, `src/kernel/observation/observer-sidecar-policy.ts`, `src/kernel/observation/ui-observer-io.ts`, `src/kernel/models/settings.ts`, `src/cli/commands/bridge.ts`, `src/cli/llm/vision.ts`, `scripts/prepare-desktop-bridge.mjs`, `observer/src/privacy.rs`, `observer/src/uia.rs`
