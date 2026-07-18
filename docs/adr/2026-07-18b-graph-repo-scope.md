# Learning Graph Scope Selectors and the Repo Scope

**Status:** Implemented
**Date:** 2026-07-18
**Deciders:** Thomas (project owner), designed with Fable 5
**Related:**
[2026-07-18-okf-learning-import.md](2026-07-18-okf-learning-import.md) (anchored source links make the repo scope possible) ·
[2026-07-17-okf-knowledge-base.md](2026-07-17-okf-knowledge-base.md) (OKF bundles) ·
[2026-07-06a-mcp-agent-transport-and-surfaces.md](2026-07-06a-mcp-agent-transport-and-surfaces.md) (MCP Apps panels)

---

## Context

The 2D knowledge-graph card (`zam_show_graph`, `ui://zam/graph`) rendered
only a focus token's 1-hop neighborhood. Opened without a focus — the
Companion title-bar button, or any host that doesn't pass one — it
dead-ended in a "Kein Fokus" hint, so in practice the card "stays usually
empty" (project owner). The desktop app already solved browsing with
scope selectors (knowledge-context and domain pills, a learner filter,
and a bootstrap that picks a start token); the card had none of that.

Since the knowledge-to-learning import (ADR 2026-07-18), tokens created
from OKF articles carry an anchored `source_link`
(`<article resource>#<anchor>`), which for the first time makes "the
tokens related to this repo's knowledge base" a queryable set.

## Decision

1. **Repo scope is computed server-side.** `zam_show_graph` resolves the
   workspace's bundle directory exactly like the `zam_okf_*` tools (MCP
   `roots/list`, falling back to the server cwd), collects one
   source-link base per article (frontmatter `resource`, else the
   resolved article path — the same rule `importOkfTokens` writes), and
   ships `repoScope { label, bases }` in the tool result. `label` is the
   repository folder name. Best-effort: any failure omits `repoScope`
   and must never block opening the card.

2. **The kernel filters by source-link base.**
   `listTokens({ sourceLinkBases })` matches `source_link = base` or
   `base#anchor` (LIKE with escaped wildcards, OR-ed over bases; an
   explicit empty list matches nothing). Exposed as the repeatable
   `zam bridge list-tokens --source-link-base`, reachable from panels via
   the existing `zam_studio_bridge` allowlist entry.

3. **The card bootstraps into selectors instead of a hint.** Without a
   focus it loads the default scope — repo when `repoScope` is present
   and non-empty, else all tokens — renders scope pills (repo / Alle),
   domain pills with `/`-prefix groups (ported from the desktop app), and
   a clickable token list, then opens on the scope's lowest-Bloom token
   the learner has a card for. Only a truly empty database shows an
   empty state. With an explicit focus the previous behavior is
   unchanged; the selector bar still loads for browsing.

4. **Late tool results restart cleanly.** The card's 800ms no-host
   fallback can bootstrap before the real tool result (with `repoScope`)
   arrives; a navigation-generation counter discards in-flight
   navigations and scope loads from a superseded session instead of
   letting them land as stale breadcrumb entries (found live in the
   VS Code e2e run).

## Consequences

- The Companion's Learning Graph button is useful without any prior
  conversation context, and its default view is the current repo's
  learning surface — the import feature's output becomes visible where
  the work happens.
- Tokens imported before anchored source links existed (or created by
  hand without one) do not appear in the repo scope until they are
  re-bound (e.g. by a re-import); the "Alle" scope always shows them.
- The graph card and the desktop app now share selector semantics but
  not code; the card's pure selector logic lives in
  `desktop/src/panel/graph-scope.ts` with its own tests.

## Code

`src/kernel/models/token.ts` (listTokens sourceLinkBases),
`src/cli/commands/bridge.ts` (--source-link-base),
`src/cli/okf/io.ts` (collectSourceLinkBases),
`src/cli/commands/mcp.ts` (repoScope in zam_show_graph),
`desktop/src/panel/graph-scope.ts`, `desktop/src/panel/graph.ts`.
