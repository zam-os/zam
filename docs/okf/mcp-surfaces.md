---
type: architecture
title: MCP Transport and Surfaces
description: zam mcp is the preferred agent transport - a stdio MCP server exposing ZAM tools and MCP Apps panels; zam agent connect configures supported harnesses.
tags:
  - mcp
  - agents
  - surfaces
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/mcp-surfaces.md"
timestamp: 2026-07-17T00:00:00Z
---

`zam mcp` starts a stdio **Model Context Protocol** server
(`src/cli/commands/mcp.ts`, lazily loaded so the CLI bootstrap stays
light). It is the preferred way for agents to drive ZAM;
[bridge-protocol.md](bridge-protocol.md) is the fallback.

`zam agent connect <harness>` writes the MCP registration for a harness;
supported: `claude-code`, `claude-desktop`, `antigravity`, `codex`,
`opencode`, `goose`, `copilot`. Running it with no target auto-detects
installed harnesses.

The server exposes ZAM's tool surface (session start/end, queue and
review actions, token search and registration, prerequisite linking,
companion context and sampling, and the OKF knowledge-base tools
`zam_okf_catalog` / `zam_okf_read` / `zam_okf_upsert` /
`zam_okf_read_citation`). The authoritative tool list with annotations
is pinned by `tests/cli/mcp.test.ts`.

`zam_okf_catalog` accepts an optional `include_log` flag that adds the
raw `log.md` text to the result (empty string if the bundle has none
yet). `zam_okf_read_citation` reads a citation target an article points
to — an ADR, for example — read-only and restricted to `.md` files that
resolve inside the repository root; the target may be outside the
bundle (that's its purpose) but never outside the repo
(`resolveCitationPath` / `findRepoRoot` in `src/cli/okf/io.ts`).

# MCP Apps panels

Four self-contained HTML panels ship as MCP Apps resources and open
in hosts that support them: `ui://zam/studio`, `ui://zam/recall`,
`ui://zam/graph`, `ui://zam/settings` (built by `npm run build:panel`,
served from `dist/ui/`). The VS Code / Antigravity Companion extension
(`src/vscode-extension/`) hosts the same panels in a webview and routes
recall evaluation through per-IDE evaluator selections.

# Citations

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-07-16 — Companion Context Bar and Harness Affinity](../adr/2026-07-16-companion-context-and-harness-affinity.md)
- [ADR 2026-07-17 — OKF Knowledge Base](../adr/2026-07-17-okf-knowledge-base.md)
- [ADR 2026-07-17b — OKF Visualizer Panel](../adr/2026-07-17b-okf-visualizer-panel.md)
- Code: `src/cli/commands/mcp.ts`, `src/cli/commands/agent.ts`, `src/cli/okf/io.ts`
