# Monitoring Methods

## Level 1 — Shell Observation

The first level of user observation monitors shell activity. Two approaches are available:

- **Inline**: The user runs commands with the `!` prefix inside the agent conversation. Simple but limited — no timing data, and the user stays inside the agent's interface.
- **Monitored terminal**: The agent opens a separate terminal window with observation hooks installed. This is the preferred default — it provides a natural workspace and captures timestamps, exit codes, and working directories.

The user should be prompted once to choose their preferred approach. The preference is saved in user settings so they are not asked again.

### Session Synthesis

End a monitored session with:

```bash
zam session end --session <id> --synthesize
```

ZAM matches monitor commands against steps from agent skills linked to exactly
one token. Task-specific or multi-token mappings can be supplied as a JSON file
with `--patterns <path>`. Only medium- and high-confidence candidates are
shown, and each rating must be accepted, overridden, or skipped before any
learning state changes.

Confirmed ratings update the card, review log, session step, prerequisite
blocking state, and synthesis audit in one transaction. Repeating synthesis
for the same session and token does not apply the rating twice.

### Redaction and retention

The shell hooks write command lines to `~/.zam/monitor/<session>.jsonl` as
typed. ZAM redacts them on every read (ADR 2026-10-08 R5): `zam_monitor`, the
bridge monitor commands, synthesis candidates and skill discovery only ever
see the command with its values in secret positions replaced by `[redacted]`
— environment assignments, secret flags and headers, credentials in URLs,
passwords piped into login commands, tokens and high-entropy strings. The log
itself is rewritten in redacted form when monitoring stops and when the
session ends.

The raw log is deleted once the learner confirms or dismisses the session's
synthesis (`zam_observation_close`, `zam observation close`, or
`zam session end --synthesize` after going through the candidates), and at
the latest after 24 hours (`observation.retentionDays` in `~/.zam/config.json`,
default 1).
A value-free digest of the session's command prefixes stays, so skill
discovery still finds recurring patterns. `zam observation status` shows what
this machine keeps.

## Level 2 — Screen and UI Observation

Screen observation is off on every machine until the learner sets
`observation.screen` to `true` in `~/.zam/config.json` by hand; no setting or
tool can turn it on (ADR 2026-10-08 R8). While it is off, every screen command
below refuses with `screen-observation-off`. The ADR proposes replacing ZAM's
own screen capture with structural evidence from external skill recorders.

The Windows 11 UI observer (Phase 0) combines native UI events, input metadata,
and sparse visual evidence in a separate observer sidecar:

- [Windows 11 UI observer proposal](../windows-ui-observer-proposal.md)
- [Observer next steps](../observer-next-steps.md)

Start a UI learning session with `zam bridge start-session --context ui`,
run `zam-observer watch --reports`, and poll reports with
`zam bridge observe-ui-watch --session <id>`. The desktop observer panel and
the screen-recording path (`start-recording`, `stop-recording`, video input to
`observe-ui-snapshot`) were deleted under ADR 2026-10-08, because nobody used
them. End with
`zam bridge end-session`. UI session synthesis uses the same review flow as
shell sessions when `candidateTokens` are present (vision snapshots) or once
deterministic token matching lands in Phase 1.

The observer reports structured evidence to the session agent. It does not
directly update cards or FSRS state.

## Supplemental System-Level Tracing

Depending on the operating system, native tracing facilities could track broader system changes beyond the terminal:

- **macOS**: DTrace, Endpoint Security framework
- **Linux**: eBPF, auditd, strace
- **Windows**: ETW (Event Tracing for Windows), Process Monitor

The feasibility and depth of system-level tracing varies across platforms and requires further investigation.

## Level 3 — Browser Activity Tracking

For tasks that involve web-based tools (cloud consoles, documentation, dashboards), browser activity tracking could extend observation beyond the terminal. This would capture navigation patterns, time spent on pages, and interactions with web UIs.
