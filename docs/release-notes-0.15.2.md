# ZAM 0.15.2 — the Companion tells you when its CLI is stale

A patch release: the Companion now detects when the `zam mcp` CLI it
launches has drifted from its own version, so a stale CLI can't silently
break panels.

## Fixed

- **Version-drift guard.** The Companion VSIX and the `zam mcp` server it
  spawns (the global `zam-core` CLI) ship as independent artifacts, so
  updating one and leaving the other behind failed silently — exactly how
  the 0.15.0 CRLF-parse bug kept breaking the OKF panel after the VSIX had
  already been updated to 0.15.1. On connect, the Companion now compares
  the server's reported version with its own and, on a mismatch, shows one
  actionable notice: a stale CLI gets a **Copy fix command** button
  (`npm install -g zam-core@<version>`); a stale extension is told to
  update the Companion. The check is one-shot, fire-and-forget, and never
  blocks or fails the connection; it stays silent for dev/source builds
  whose version is the unreplaced placeholder.

## Notes

If your OKF panel or other Companion surfaces have been misbehaving, this
release will now tell you when the cause is a stale CLI. The fix it points
to is always `npm install -g zam-core@<version>` followed by a window
reload.
