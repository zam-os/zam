# OKF Visualizer Panel (MCP App)

**Status:** Accepted
**Date:** 2026-07-17
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-17-okf-knowledge-base.md](2026-07-17-okf-knowledge-base.md) (OKF bundles and MCP tools) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP Apps as a surface) ·
[2026-07-16-companion-context-and-harness-affinity.md](2026-07-16-companion-context-and-harness-affinity.md) (harness affinity)

---

## Context

OKF bundles are no longer confined to ZAM's own repo: the OKF tools
(`zam_okf_catalog`, `zam_okf_read`, `zam_okf_upsert`) operate on any
bundle directory, and downstream users maintain bundles in their own
repos whose articles serve as ZAM learning sources via `source_link`.

A companion pattern has emerged in bundle-owning repos: a static,
self-contained HTML visualizer committed next to the bundle (article list
by type, search, markdown reader, link graph including citation nodes,
log view). Its structural weakness is data access — a browser page has no
filesystem access, so it needs a local HTTP server or a folder picker.

That weakness disappears inside an MCP Apps host: the server reads the
bundle from disk and the panel renders where the user already works.
MCP Apps-capable harnesses (Claude Code, GitHub Copilot Chat in VS Code,
and others) are already wired through `zam agent connect <harness>`, and
ZAM already ships MCP Apps panels (studio, recall, graph). ZAM is
therefore the natural home: every repo with an OKF bundle gets the panel
for free, regardless of which team owns it.

## Decision

1. **ZAM gains an OKF visualizer MCP Apps panel** (`okf-panel`, built via
   Vite alongside the existing panels) showing an OKF bundle: articles
   grouped by `type` with search, a markdown reader with frontmatter
   meta, a link graph (articles as nodes, inter-article links as edges,
   ADR citations as visually distinct nodes), and the `log.md` history.
2. **Data flows exclusively through the existing MCP tools** —
   `zam_okf_catalog` and `zam_okf_read` over the MCP Apps bridge. No
   HTTP fetch, no new kernel code; the bundle directory resolves exactly
   as it does for the other OKF tools (parameter, default `docs/okf`
   under the server's working directory).
3. **A new CLI-layer tool `zam_okf_visualize` opens the panel**, naming
   and mechanics consistent with `zam_open_studio` / `zam_show_graph`.
4. **The panel is independent ZAM code against the OKF v0.1 contract.**
   Static visualizers maintained by bundle owners remain useful as
   zero-dependency browser fallbacks; no coupling in either direction.
5. **Cited decision records render inline via a strictly-scoped
   citation read.** Articles commonly cite ADRs via relative links
   (`../adr/<file>.md`) outside the bundle directory. The OKF read
   surface gains a repo-relative citation read (parameter or sibling
   tool of `zam_okf_read`) with hard validation: no absolute paths, the
   resolved path must stay inside the repository root, `.md` files only,
   read-only. The panel uses it to show cited records inline.
6. **CLI layer only.** Nothing enters the kernel — consistent with the
   OKF knowledge-base ADR: documentation plumbing, not learning logic.

## Future work (out of v1 scope)

- **Learning-state overlay** (mark articles whose `resource` URL backs
  due cards via `source_link`) is a natural follow-up. The panel's
  article model stays keyed by `resource` URL so the overlay can attach
  later without rework.

## Options considered

- **Each consuming team hosts a panel in its own MCP server** — rejected:
  duplicates panel infrastructure per consumer; ZAM serves every OKF
  bundle from one implementation.
- **Static HTML only (status quo)** — rejected as the primary surface:
  loading friction, no harness integration, no path to the learning
  overlay. Kept as the browser fallback.
- **A tab inside the studio panel** — considered; rejected to keep the
  studio focused on authoring/learning content and because the
  visualizer's audience includes agents opening it mid-task on arbitrary
  repos.

## Consequences

- The panel ships with ZAM releases; bundle repos need nothing beyond
  being valid OKF v0.1.
- Any team adopting ZAM gets the panel in every MCP Apps-capable harness
  its members connect via `zam agent connect <harness>`.
- Panel and static fallbacks share a conceptual model but independent
  code; divergence is accepted — the static files are deliberately
  dependency-free.
