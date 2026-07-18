# OKF Import Handoff — Chat Delivery and the Focused-Article State

**Status:** Implemented
**Date:** 2026-07-18
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-18-okf-learning-import.md](2026-07-18-okf-learning-import.md) (the import contract this hands off to) ·
[2026-07-17b-okf-visualizer-panel.md](2026-07-17b-okf-visualizer-panel.md) (the panel carrying the action) ·
[2026-07-11-codex-and-vscode-companion-surfaces.md](2026-07-11-codex-and-vscode-companion-surfaces.md) (Companion webview host)

---

## Context

The visualizer's "import as learning content" action posts the
decomposition request into the host conversation via MCP Apps
`ui/message`. The VS Code Companion webview host never advertised the
`message` capability, so in the Companion — the surface actually in
front of the user — the action always fell into the copyable-text
fallback ("Dieser Host hat keinen Chat", project owner's report).

The inverse direction was missing entirely: a user reading an article in
the panel who types "import this okf" into their chat had no way for the
agent to know which article is meant. Any solution had to work for every
connected harness — Claude Code, Copilot, **and Codex** (project owner:
"Codex also can use the vscode context knowledge") — which rules out
mechanisms private to one chat (host model context, a single editor
API).

## Decision

1. **The Companion delivers `ui/message` to VS Code's Chat view.** The
   webview host advertises `message: { text: {} }` and proxies the
   request to the extension, which calls
   `workbench.action.chat.open` with the message text as a submitted
   query. Any failure (no chat available) returns `{ isError: true }`
   per the MCP Apps contract, so the panel's copyable-text fallback
   (with its copy button) remains the safety net. No attempt is made to
   inject into third-party chat panels (Claude Code, Codex) — they have
   no public API for it; the built-in Chat view is the one addressable
   target.

2. **The focused article is machine-local server state, not host
   context.** The reader records the article it shows through a new
   app-only tool `zam_okf_focus` (same closed pattern as
   `zam_studio_bridge`: panel-callable, model-hidden), which writes a
   last-write-wins snapshot to `~/.zam/okf-focus.json` — mirroring the
   ui-intent file's design (atomic rename, versioned shape, env
   override for tests). The zam MCP server is the one place every
   harness already looks, so the model-visible, read-only
   `zam_okf_focused` tool makes "import this okf" / "the currently
   focused article" resolvable from any of them. The write is
   fire-and-forget from the panel: a host that does not allow the tool,
   or a failed write, never breaks the reader.

3. **Freshness is judged, not enforced.** The snapshot carries
   `updatedAt`; the reading agent names the resolved article and
   double-checks with the user when the timestamp looks stale (okf
   skill), rather than the server imposing a TTL. A focus from earlier
   in the session is usually still what the user means.

## Consequences

- In the Companion, the import button now lands in the Chat view; in
  MCP Apps hosts with their own conversation (Copilot canvas), the
  existing `sendMessage` path is untouched; in chat-less hosts the
  fallback still works.
- "Import this okf" works symmetrically from any harness — the panel
  and the chat no longer need to be the same surface.
- The focus file is advisory UI state: it is never written to the
  shared database and losing it costs one click in the panel.
- Tool count grows to 26; the pairing (app-only write, model-visible
  read) is a pattern later panel state can reuse.

## Code

`src/cli/okf-focus.ts`, `src/cli/commands/mcp.ts` (both tools),
`src/vscode-extension/host.ts` (message capability),
`src/vscode-extension/extension.ts` (chat.open routing),
`src/vscode-extension/protocol.ts` / `src/copilot-extension/extension.mjs`
(allowlists), `desktop/src/panel/okf.ts` (focus recording).
