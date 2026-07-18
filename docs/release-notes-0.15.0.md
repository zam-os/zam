# ZAM 0.15.0 — the graph finds your repo, the import finds your chat

ZAM 0.15.0 closes the loop that 0.14.0 opened: imported knowledge now has
a default home in the Learning Graph, and the knowledge-to-learning
import is reachable from every direction — panel button, chat command,
any harness.

## Highlights

- **The Learning Graph defaults to your repo.** Opened without a focus,
  the graph card no longer dead-ends: it shows scope selectors
  (desktop-app style — a repo pill, domain pills with `/`-prefix groups,
  and a clickable token list) and defaults to the tokens anchored in the
  workspace's OKF knowledge base, opening on the scope's foundation
  token. `zam_show_graph` computes the repo scope server-side from the
  bundle's source-link bases (MCP roots); the kernel gains a
  source-link-base filter, exposed as the repeatable
  `zam bridge list-tokens --source-link-base` (ADR 2026-07-18b).
- **The import button reaches the chat.** The VS Code Companion now
  advertises the MCP Apps `message` capability and routes the
  visualizer's "import as learning content" request into VS Code's Chat
  view (`workbench.action.chat.open`). Chat-less hosts keep the
  copyable-text fallback — now with a copy button.
- **"Import this okf" works from any harness.** The OKF reader records
  its focused article machine-locally (app-only `zam_okf_focus`); the
  model-visible `zam_okf_focused` tool resolves "import this okf" /
  "the currently focused article" from Claude Code, Copilot, or Codex —
  the panel and the chat no longer need to be the same surface
  (ADR 2026-07-18c). Tool count grows to 26.

## Fixes and hardening

- **Graph card race fixed.** A late tool result could leave a stale
  breadcrumb entry from the card's no-host fallback bootstrap; in-flight
  navigations from a superseded session are now discarded.
- **Panel focus recording is fire-and-forget** — a host that does not
  allow the tool, or a failed write, never breaks the reader; the focus
  file is advisory machine-local state, never shared-database content.
- **Docs kept honest.** ADRs 2026-07-18b/c record the decisions;
  `mcp-surfaces.md` and `token-card-model.md` (anchored source links,
  maintenance state) were brought up to current truth through the
  guarded upsert path.
