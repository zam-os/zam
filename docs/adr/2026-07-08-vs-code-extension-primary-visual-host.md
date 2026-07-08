# VS Code Extension as the Primary Visual Host for ZAM

**Status:** Proposed
**Date:** 2026-07-08
**Deciders:** Thomas (project owner)
**Related:**
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) ·
[2026-06-30-learning-content-studio.md](2026-06-30-learning-content-studio.md) ·
[2026-06-23-pluggable-providers-and-agent-harnesses.md](2026-06-23-pluggable-providers-and-agent-harnesses.md)

---

## Context

The MCP Apps walking skeleton is valuable P1 plumbing: it proves that `zam mcp`
can expose app resources, serve structured tool responses, and start converging
the agent transport and visual surface around one protocol. It does not yet prove
that arbitrary MCP hosts will render ZAM Studio reliably in the environments we
actually use.

In this branch, `zam_open_studio` returns structured JSON, but the GitHub Copilot
app did not visibly render the MCP Apps panel. A browser or Tauri preview is not
equivalent evidence: it verifies the HTML bundle, not a host's `ui://` resource
handling, iframe policy, tool callback behavior, or panel lifecycle. Relying on
GitHub Copilot Desktop, Claude Desktop, or other arbitrary hosts as the primary
visual surface would make the demo path depend on uneven and unconfirmed host
support.

VS Code is a controlled host surface we can target directly. It has stable
Webview and WebviewView APIs, an integrated Terminal API, command and settings
APIs, workspace context, extension packaging, and a familiar install path for
developer users. Copilot and MCP integration can still be configured in and
around VS Code, but ZAM's primary visual host should not depend on MCP Apps
rendering support.

---

## Decision

Build a VS Code extension as the primary visual host for ZAM Studio and the
agent-control surface.

The extension provides:

1. A ZAM Studio Webview or WebviewView surface.
2. An **Open Agent Terminal** command that opens a VS Code integrated terminal
   configured for the selected agent workflow.
3. Local ZAM status and configuration commands.
4. Release packaging as a `.vsix` attached to GitHub Releases.
5. Optional Marketplace and OpenVSX publishing later, after the extension
   stabilizes.

Initial distribution is a release asset, not a marketplace dependency. Users can
install the `.vsix` manually from GitHub Releases while the API shape, packaging,
and permissions model settle. Marketplace and OpenVSX publishing remain follow-up
distribution work, not part of the first viable implementation.

---

## Architecture guidance

The VS Code extension host owns all VS Code API interactions: commands, settings,
workspace inspection, terminal creation, extension activation, and webview
lifecycle.

The Studio webview talks to the extension host through VS Code's `postMessage`
channel. The webview must not read local files, spawn shells, or call ZAM
commands directly. It renders state and emits UI intents; the extension host
validates those intents and performs privileged work.

The extension host talks to ZAM through the existing CLI and bridge protocol, or
through MCP where that is the right transport. `zam mcp` remains the canonical
agent-tool transport. The VS Code extension is a visual and control host, not a
replacement for MCP tools or the agent-facing ZAM server.

Prefer reusing existing Studio view code where feasible, especially pure
framework-free view components and protocol types. Do not block the first
extension increment on a perfect multi-mount extraction across Tauri, MCP Apps,
and VS Code. A small amount of duplication is acceptable if it proves the VS Code
host path quickly and does not move learning logic out of the kernel.

---

## Relationship to ADR 2026-07-06a

This ADR refines and supersedes the visual-host portion of
[ADR 2026-07-06a](2026-07-06a-mcp-agent-transport-and-surfaces.md).

ADR 2026-07-06a chose MCP as the canonical agent transport and described MCP
Apps as the first embedded-panel target, with a VS Code-family webview extension
as a fallback only if needed. The transport decision still stands: `zam mcp`
remains canonical for agent tools, and MCP Apps can remain an optional later
surface.

The visual-host decision changes: VS Code extension becomes the primary demo and
implementation path for ZAM Studio and the agent terminal, superseding the "MCP
Apps first / VS Code webview fallback only if needed" sequencing. MCP Apps are
no longer the first visual-host bet because host rendering support is uneven and
unconfirmed in our environment.

---

## Consequences

**Easier**

- Stable UI host with documented Webview, WebviewView, command, settings,
  workspace, and terminal APIs.
- Integrated terminal support for agent workflows without building a PTY stack
  first.
- Direct access to workspace context and VS Code trust/state surfaces.
- Predictable `.vsix` release-asset distribution with no immediate Marketplace
  or OpenVSX requirement.
- A clearer demo path that does not depend on arbitrary MCP host rendering.

**Harder**

- A new extension package, build target, and release artifact to maintain.
- A VS Code-specific surface that does not automatically serve non-VS-Code
  users.
- Extra packaging and compatibility testing across supported VS Code versions.
- Workspace trust, shell execution, terminal environment, and local ZAM binary
  discovery must be handled carefully and visibly.
- MCP Apps still need separate validation if they are reintroduced as an
  optional host surface later.

---

## Action Items

1. [ ] Scaffold the VS Code extension package without changing kernel
   boundaries.
2. [ ] Wire the initial ZAM Studio webview shell and message protocol.
3. [ ] Add local ZAM status and configuration commands backed by the existing
   CLI/bridge or MCP transport.
4. [ ] Add the **Open Agent Terminal** command using the VS Code integrated
   terminal API.
5. [ ] Add CI/release packaging that produces a `.vsix` and attaches it to
   GitHub Releases.
6. [ ] Add manual `.vsix` install and update documentation.
7. [ ] Revisit Marketplace/OpenVSX publishing after the extension stabilizes.
