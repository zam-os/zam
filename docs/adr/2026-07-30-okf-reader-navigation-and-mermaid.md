# OKF Reader Navigation and Mermaid Rendering

**Status:** Implemented
**Date:** 2026-07-30
**Deciders:** Thomas (project owner), implemented with Codex
**Related:**
[2026-07-17b-okf-visualizer-panel.md](2026-07-17b-okf-visualizer-panel.md) (OKF panel) ·
[2026-07-11-codex-and-vscode-companion-surfaces.md](2026-07-11-codex-and-vscode-companion-surfaces.md) (VS Code host)

---

## Context

The OKF reader rendered external Markdown and article-resource links as normal
browser anchors. MCP Apps run inside host-controlled sandboxed frames, so those
anchors did not reliably open anything and bypassed the standard
`ui/open-link` capability that the VS Code Companion already implemented.

An OKF article's canonical `resource` is a GitHub `blob/main` URL, while the
same repository is commonly open in VS Code. Opening the browser in that case
loses the local editing context.

The reader's small Markdown renderer also treated fenced `mermaid` blocks as
ordinary code. Rendering them through a remote service would expose repository
knowledge and violate the panels' self-contained packaging model. Rendering
diagram source as SVG introduces an additional untrusted-markup boundary.

## Decision

1. **External reader links use MCP Apps `ui/open-link`.** A normal click is
   enough. A panel connected to a host that advertises the `openLinks`
   capability prevents direct navigation and delegates the URL to that host.
   The original HTTPS anchor stays in the markup and remains the fallback
   wherever that capability is absent, so a click is never swallowed.
2. **The VS Code Companion prefers a matching local file.** For a canonical,
   safely decoded GitHub `blob/main` URL it checks each open workspace folder
   for the repository-relative path. An existing file opens through
   `vscode.open`; an absent file or any other HTTP(S) URL falls back to the
   system browser. Dot segments, encoded separators, credentials, non-HTTPS
   GitHub URLs, and non-`main` blob URLs never become local paths.
3. **Fenced `mermaid` blocks render locally in the OKF panel.** The full
   Mermaid runtime is bundled into the self-contained OKF panel; no diagram
   source or rendered output crosses the network.
4. **Diagram rendering stays non-interactive and strict.** Mermaid runs with
   `securityLevel: "strict"`, HTML labels disabled, automatic page scanning
   disabled, and syntax-error SVG insertion suppressed. Only explicitly
   labelled `mermaid` fences enter the renderer. Their source passes through
   the reader's escaped code-block DOM and is recovered with `textContent`,
   Mermaid's generated SVG is inserted only after validation, and link/click
   bindings are not installed.
5. **Failure preserves the source.** Invalid Mermaid syntax leaves the escaped
   code block visible and adds a localized error notice. Navigation races
   cannot write a finished diagram back into detached reader content, and
   diagram jobs are serialized across rapid repaints.

## Options considered

- **Keep plain anchors and require a modifier key** — rejected because a
  sandboxed host, not keyboard intent, controls navigation.
- **Always open GitHub in a browser** — retained as the portable fallback, but
  insufficient in VS Code when the exact source already exists in the active
  workspace.
- **Send Mermaid text to a rendering service or load Mermaid from a CDN** —
  rejected because repository knowledge would leave the machine and the MCP
  App would no longer be self-contained.
- **Implement a partial Mermaid-compatible parser in ZAM** — rejected because
  a visual approximation would accept only an undocumented syntax subset and
  diverge from authors' Mermaid expectations.

## Consequences

- Source and external links work consistently through each MCP Apps host.
- VS Code users move directly from the reader to the editable local article
  whenever the canonical source maps to an open workspace.
- OKF articles and cited Markdown can use standard Mermaid fences for inline
  diagrams without network access.
- The full Mermaid runtime materially increases the single-file OKF panel
  artifact, while other ZAM panels remain unchanged.
- Strict rendering deliberately disables Mermaid link and click directives.
