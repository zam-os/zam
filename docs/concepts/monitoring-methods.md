# Monitoring Methods

## Level 1 — Shell Observation

The first level of user observation monitors shell activity. Two approaches are available:

- **Inline**: The user runs commands with the `!` prefix inside the agent conversation. Simple but limited — no timing data, and the user stays inside the agent's interface.
- **Monitored terminal**: The agent opens a separate terminal window with observation hooks installed. This is the preferred default — it provides a natural workspace and captures timestamps, exit codes, and working directories.

The user should be prompted once to choose their preferred approach. The preference is saved in user settings so they are not asked again.

## Level 2 — System-Level Tracing

Depending on the operating system, native tracing facilities could track broader system changes beyond the terminal:

- **macOS**: DTrace, Endpoint Security framework
- **Linux**: eBPF, auditd, strace
- **Windows**: ETW (Event Tracing for Windows), Process Monitor

The feasibility and depth of system-level tracing varies across platforms and requires further investigation.

## Level 3 — Browser Activity Tracking

For tasks that involve web-based tools (cloud consoles, documentation, dashboards), browser activity tracking could extend observation beyond the terminal. This would capture navigation patterns, time spent on pages, and interactions with web UIs.
