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
passwords piped into login commands, tokens and high-entropy strings. No read
returns the working directory, because a project path is content. A skill
step written with a value, such as `export AWS_PROFILE=staging`, still
matches: ZAM redacts the step the same way before it compares. The log itself
is rewritten in redacted form when monitoring stops, and any log idle for ten
minutes is rewritten by the next retention sweep, which also runs every hour
while the desktop app or an MCP connection is open.

The raw log is evidence only while it is captured. When the session ends
(`zam_session_end`, `zam session end`), ZAM first prepares the synthesis
candidates from it and then deletes it; the candidates carry the redacted
command texts the learner confirms. A session that never ends loses its raw
log after 24 hours (`observation.retentionDays` in `~/.zam/config.json`,
default 1). To drop a running session's evidence sooner, use
`zam_observation_close`, `zam observation close` or Settings → Data.
`zam observation status` shows what this machine keeps.

### Skill discovery

When a raw log goes, ZAM keeps a digest of it in
`~/.zam/monitor/digests/<session>.json`: the session's commands reduced to
tool and subcommand (`git checkout`, `npm run build`, `docker compose up`), in
order and redacted, without arguments, times, exit codes or working
directories. Trivial commands (`cd`, `ls`, `pwd`, `clear`, `exit`, `echo`) are
left out, and only the newest 200 digests are kept.

`zam bridge discover-skills [--min-sessions 2] [--limit 20]` reads those
digests, plus the raw logs of sessions still running, and proposes a skill for
every sequence of two to five steps that recurs in at least `--min-sessions`
of the latest `--limit` sessions. Existing agent skills are skipped; a pattern
seen in three sessions is medium confidence, in four or more high. Discovery
only proposes: an agent or the learner turns a proposal into an agent skill.
It is a bridge command only — no MCP tool or Studio view calls it yet. Deleting
`~/.zam/monitor/digests/` removes everything discovery has learned.

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
run `zam-observer watch --reports` from a source build (the sidecar no longer
ships with the desktop app), and poll reports with
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
