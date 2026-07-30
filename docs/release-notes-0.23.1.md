# ZAM 0.23.1 — source links and diagrams in the OKF reader

Repository knowledge now takes you back to the source instead of stopping at
the reader.

External links in an OKF article use the standard MCP Apps link action, so a
normal click works in hosts that sandbox embedded apps. In the VS Code
Companion, a canonical GitHub `blob/main` source link is resolved against the
open workspace first: when the file exists locally, it opens directly in the
editor. Other hosts and unmatched links retain the portable HTTPS fallback.

## Mermaid diagrams, rendered locally

Fenced `mermaid` blocks now become diagrams inside the OKF reader.

- Diagram source stays on the machine; Mermaid is bundled into the
  self-contained panel instead of loaded from a CDN.
- Rendering uses Mermaid's strict security mode with HTML labels, link
  interaction, and automatic page scanning disabled.
- Invalid syntax remains visible as escaped source and receives a localized
  error notice, so a broken diagram never hides the article content.
- Light and dark host themes produce matching diagrams, including after a
  runtime theme change.

The embedded Mermaid runtime increases only the OKF panel artifact. Its
generated parser tables are escaped during the build so the final single-file
MCP App remains parseable by strict hosts.

## A reference article that reads like reference material

“MCP Transport and Surfaces” has been reviewed and reorganized into visible
sections, tables, lists, and short operational flows. It now separates:

- conversational intent routing for the Learning Graph and the OKF/ADR graph;
- the model-visible tools from their host-rendered app surfaces;
- host-owned placement from behavior ZAM can request;
- source navigation, Mermaid rendering, freshness, import, and learning state.

The article was updated through `zam_okf_upsert`, so its permanent resource URL,
catalog entry, and change log stay consistent.

## Host boundaries remain explicit

MCP Apps hosts still decide whether an app appears inline, in picture-in-picture,
or in a side panel. ZAM uses the negotiated host capabilities and the standard
link-opening contract; it does not emulate host-specific keyboard shortcuts or
force a layout that the host does not provide.

The navigation and rendering boundary is recorded in
[ADR 2026-07-30](adr/2026-07-30-okf-reader-navigation-and-mermaid.md).
