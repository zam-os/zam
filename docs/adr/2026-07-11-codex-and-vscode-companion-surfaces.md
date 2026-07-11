# Codex and VS Code Companion Surfaces

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-06-30-learning-content-studio.md](2026-06-30-learning-content-studio.md)

---

## Context

ZAM 0.10.0 introduced purpose-built MCP Apps for Recall, Graph, Settings, and
learning-content curation. ZAM 0.10.2 proved that the same `ui://` resources can
also be hosted in GitHub Copilot through a thin canvas adapter. Codex Desktop
can use the MCP server and app resources directly, while VS Code needs a visual
surface whose lifetime is independent from the scrolling agent transcript.

An earlier, unmerged VS Code proposal treated a VS Code extension as the
primary host for the complete Studio and an agent terminal. That scope is now
too broad. MCP remains the canonical agent transport, and the standalone ZAM
App remains the easiest onboarding and agent-free surface. Agent harnesses need
the focused learning cards, not another copy of Studio.

## Decision

ZAM 0.10.3 supports two complementary visual mounts over the same MCP server:

1. **Codex Desktop uses the native MCP App result.** The app can appear wherever
   Codex places custom app UI; ZAM does not implement a Codex-specific copy.
2. **VS Code gets one host-neutral ZAM Companion WebviewView.** It is contributed
   to the VS Code Panel by default and can be moved by the user to the Primary
   Sidebar, Secondary Sidebar, or another panel location. Its lifetime is
   independent from the chat transcript.

The VS Code extension starts its own local `zam mcp` client and mounts the same
self-contained Recall, Graph, and Settings resources through the official MCP
Apps `AppBridge`. An opening tool publishes a small, local, best-effort UI
intent. The extension observes that intent, focuses its view, loads the original
resource, and proxies only the tools allowed for that card.

The intent contains only the requested app and its opening parameters. It is
not a second database, a learning-session persistence mechanism, or a message
bus for answers. Recall answers, reveal, and ratings remain inside the Recall
card. Short or complex follow-up questions remain in the user's chosen agent
chat. One-off requests such as “visualize this” may still render an inline MCP
App when the host supports it.

There is one ZAM Companion extension, not separate Codex, Copilot, or Claude
variants. Users normally run one agent harness at a time. Concurrent ownership
and cross-harness session synchronization are out of scope.

## Setup

`zam agent connect` without a harness auto-detects installed hosts and applies
the supported user setup idempotently. Explicit forms such as
`zam agent connect codex`, `zam agent connect vscode`, and
`zam agent connect copilot` remain available.

For Codex, setup installs the user-level MCP entry and global ZAM skill. For VS
Code, setup installs the user-level MCP entry and the packaged ZAM Companion
`.vsix`. Existing unrelated configuration is preserved.

The parameterless ZAM skill invocation presents choices before acting:

1. continue a session only when the current agent conversation already knows
   its active session ID;
2. Recall first, including relevant due-domain suggestions such as RAG or
   Axon Ivy;
3. work while ZAM observes;
4. discover likely missing learning content;
5. collaborate while deliberately leaving suitable steps to the learner.

Studio is not an agent-harness menu option. The standalone ZAM App remains the
onboarding and non-agent experience.

## Consequences

- The persistent learning UI no longer scrolls away with agent messages.
- Codex, Copilot, and future harnesses can share one VS Code surface.
- ZAM reuses the existing app HTML, kernel, database, and MCP tool contracts.
- VS Code gains a small extension package and `.vsix` release asset.
- A running VS Code extension is required for detached-pane behavior; hosts
  without it retain their native inline or text fallback.
- Cross-restart session discovery remains future work. Database session rows
  already persist, but 0.10.3 does not add an MCP resume/list contract.

## 0.10.3 acceptance scope

- Full automated verification on macOS.
- Live Codex Desktop MCP App test.
- Live VS Code test with the official Codex extension and the detached ZAM
  Companion view.
- A brief GitHub Copilot regression smoke test.
- Claude and Windows end-to-end testing are deferred to a later Windows
  polishing release.
