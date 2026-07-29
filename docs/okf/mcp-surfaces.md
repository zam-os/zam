---
type: architecture
title: MCP Transport and Surfaces
description: zam mcp is the preferred agent transport - a stdio MCP server exposing ZAM tools and MCP Apps panels; zam agent connect configures supported harnesses.
tags:
  - mcp
  - agents
  - surfaces
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/mcp-surfaces.md"
timestamp: 2026-07-29T19:30:00Z
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
`zam_okf_read_citation` / `zam_okf_import` / `zam_okf_focused`). The
authoritative tool list with annotations is pinned by
`tests/cli/mcp.test.ts`.

The `zam_okf_*` tools resolve their default bundle directory as
`docs/okf` under the MCP client's workspace root (MCP `roots/list`),
falling back to the server's working directory — a host-spawned server
often runs from the editor's installation directory, so the workspace
the user has open is what "the repo's bundle" means. An explicit
`bundle_dir` always wins.

`zam_okf_catalog` accepts an optional `include_log` flag that adds the
raw `log.md` text to the result (empty string if the bundle has none
yet). `zam_okf_read_citation` reads a citation target an article points
to — an ADR, for example — read-only and restricted to `.md` files that
resolve inside the repository root; the target may be outside the
bundle (that's its purpose) but never outside the repo
(`resolveCitationPath` / `findRepoRoot` in `src/cli/okf/io.ts`).

`zam_okf_import` records an agent's finished decomposition of one
article as learning tokens plus cards for the importing user, in one
transaction. The agent judges (concepts worth remembering, Bloom level
and domain per token, prerequisite order); the tool only validates and
writes. Re-imports are classified per token: `new` adds, `update`
refreshes content and keeps learning state, `replace` refreshes content
and resets learning state to the beginning. For every confirmed token,
the submitted prerequisite list is the complete desired set: re-import
adds new edges and removes obsolete ones, including clearing the set
with an empty or omitted list. Cycle validation and all edge changes are
part of the same transaction, so a rejected graph restores the previous
content and DAG. Previously imported tokens absent from a re-import move
to token maintenance (kept, excluded from scheduling) instead of being
deleted. Also available as `zam bridge okf-import`.

# MCP Apps panels

Five self-contained HTML panels ship as MCP Apps resources and open
in hosts that support them: `ui://zam/studio`, `ui://zam/recall`,
`ui://zam/graph`, `ui://zam/settings`, `ui://zam/okf` (built by
`npm run build:panel`, served from `dist/ui/`). The VS Code /
Antigravity Companion extension (`src/vscode-extension/`) hosts the
same panels in a webview and routes recall evaluation through
per-IDE evaluator selections. Replacement requests in that shared
webview are serialized and coalesced by recency: a mount already in
flight may finish, then the latest requested panel mounts last and owns
the final iframe. This makes rapid toolbar or command switches
deterministic.

`zam_okf_visualize` opens the OKF panel on any OKF bundle (default
resolved like the other `zam_okf_*` tools — see above): articles
grouped by type with search, a markdown reader that expands cited ADRs
and other citation targets inline via `zam_okf_read_citation`, a link
graph (articles as nodes, inter-article links as edges, citations as
visually distinct nodes), and the `log.md` history. The panel always
opens — a missing or invalid bundle surfaces as `problems` in the panel
instead of a tool error.

# OKF link graph: overview and focused mode

The graph view has two modes over the same nodes and edges. The
**overview** places every article on a type-clustered inner ellipse and
every citation on an outer one. Right-clicking a node switches to the
**focused** mode: that node moves to the canvas center, its direct
neighbors (one hop, either edge direction) form an enlarged inner ring,
and every remaining node recedes to a small, faint rim — still visible
and still hoverable, because the surrounding knowledge base is context,
not noise. Ring angles are carried over from the overview, so a node
keeps its direction across the switch.

Left-click opens what the node stands for, in both modes: an article
node opens the article in the reader, a citation node opens its target
— usually an ADR — in the reader's full citation view, read through
`zam_okf_read_citation`. That view's back button returns to the graph
(focused layout intact) when the graph is where it was opened from, and
to the article otherwise.

Right-clicking the centered node again, right-clicking empty canvas,
`Esc`, or the toolbar's overview button returns to the overview;
right-clicking a different node re-centers on it. Hovering any node
still lights its edges and neighbors and dims the rest, in both modes.
Edges are drawn between node borders rather than centers, so no line
crosses a node box.

Labels are sized by band: the centered node may wrap onto a second line
and run widest — it is the one title meant to be read in full — its
neighbors wrap on a tighter line, and the rim stays on a single, harder
clipped line so it does not compete for reading attention. The overview
keeps one line per node.

The reader's "import as learning content" action hands the
decomposition request to a chat in host order of capability: hosts
advertising the MCP Apps `message` capability get it via `ui/message`
(the VS Code Companion routes this into the editor's Chat view through
`workbench.action.chat.open`); hosts without one show the instruction
as copyable text with a copy button. Independently, the reader records
its focused article machine-locally (`zam_okf_focus`, app-only, written
to `~/.zam/okf-focus.json`), so a request like "import this okf" or
"import the currently focused article" typed into ANY connected harness
— Claude Code, Copilot, Codex — resolves through the model-visible
`zam_okf_focused` tool. The agent does the thinking either way, then
records via `zam_okf_import`.

The knowledge-graph card (`zam_show_graph`, `ui://zam/graph`) centers
on a focus token's direct prerequisites and dependents. Opened without
a focus it does not dead-end: it shows scope selectors (desktop-app
style — scope pills, domains with `/`-prefix groups, and a clickable
token list) and defaults to the tokens anchored in the workspace's OKF
bundle — the articles' source-link bases, resolved like the okf tools —
falling back to all tokens when the workspace has no imported
knowledge. The scoped listing runs through
`zam bridge list-tokens --source-link-base` (repeatable), which is also
available directly.

# Citations

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-07-16 — Companion Context Bar and Harness Affinity](../adr/2026-07-16-companion-context-and-harness-affinity.md)
- [ADR 2026-07-17 — OKF Knowledge Base](../adr/2026-07-17-okf-knowledge-base.md)
- [ADR 2026-07-17b — OKF Visualizer Panel](../adr/2026-07-17b-okf-visualizer-panel.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-07-18b — Learning Graph Scope Selectors and the Repo Scope](../adr/2026-07-18b-graph-repo-scope.md)
- [ADR 2026-07-18c — OKF Import Handoff](../adr/2026-07-18c-okf-import-handoff.md)
- Code: `src/cli/commands/mcp.ts`, `src/cli/commands/agent.ts`, `src/cli/okf/io.ts`, `src/cli/okf-focus.ts`, `src/cli/bridge-handlers.ts` (`importOkfTokens`), `src/vscode-extension/host.ts`, `src/vscode-extension/latest-task-queue.ts`, `desktop/src/panel/okf.ts`, `desktop/src/panel/okf-render.ts`
