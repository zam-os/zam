---
type: architecture
title: MCP Transport and Surfaces
description: zam mcp is the preferred agent transport, and the Agent Plugins package ships it with ZAM's portable skill for compatible clients.
tags:
  - mcp
  - agents
  - surfaces
  - plugins
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/mcp-surfaces.md"
timestamp: 2026-08-15T08:54:42.759Z
---

`zam mcp` starts ZAM's stdio **Model Context Protocol** server. It is the
preferred agent connection; [bridge-protocol.md](bridge-protocol.md) remains
the JSON-only fallback.

# Connect an agent

`zam agent connect <harness>` writes the MCP registration for one supported
harness:

- `claude-code`
- `claude-desktop`
- `antigravity`
- `codex`
- `opencode`
- `goose`
- `copilot`

With no target, the command detects installed harnesses. The MCP command itself
is loaded lazily so the CLI bootstrap stays light.

# Portable Agent Plugin package

The repository root and the published `zam-core` npm artifact implement Agent
Plugins v1.0.0. Compatible clients discover both portable components from fixed
locations:

- `plugin.json` declares the package identity and specification version;
- `skills/zam/SKILL.md` carries host-neutral ZAM workflow instructions using
  Agent Skills standard frontmatter;
- `mcp.json` declares the `zam` stdio server and starts
  `node ${PLUGIN_ROOT}/dist/cli/index.js mcp` from `${PLUGIN_ROOT}`.

A source checkout needs a completed build before the MCP entrypoint exists.
Published npm artifacts include `dist/cli/index.js` and every portable
manifest/component through the package `files` allowlist. ZAM continues to use
its configured learner database location, so the plugin, CLI, and Desktop
Studio share the same profile. The existing `.claude/`, `.agent/`, and
`.agents/` skills plus `zam agent connect` remain compatibility paths for
clients that do not install the portable package directly.

# Intent routing

The server publishes MCP-wide guidance plus specific tool descriptions. The
following terms deliberately select different stored knowledge:

| User intent | Tool | Surface |
| --- | --- | --- |
| “knowledge graph”, “learning graph”, “Wissensgraph” | `zam_show_graph` | Learning tokens and their prerequisite graph |
| “knowledge articles”, “Wissensartikel”, “OKFs”, “ADRs” | `zam_okf_visualize` with `view: "graph"` | Repository articles and their cited decisions |
| due-card review or active recall | `zam_open_recall` | Spoiler-free recall session |
| learner and model configuration | `zam_open_settings` | Focused settings panel |

The shipped ZAM skill repeats this distinction for hosts that can display only
one inline app at a time.

# MCP tool surface

The authoritative tool list and annotations are pinned by
`tests/cli/mcp.test.ts`.

## Learning work

The model-visible learning tools cover:

- session start and end;
- review queues and rating submission — submissions accept an optional
  `responseTimeMs` (milliseconds between showing a card and rating it), which
  feeds the study-time statistic (ADR 2026-08-01 Decision 5);
- review progress: `zam_progress_stats` returns the activity series — cards
  reviewed per day/week/month with summed study time, aggregated in SQL over
  the immutable review log. `window` counts **periods, not days**, and each
  rating contributes at most ten minutes of study time so an abandoned card
  cannot swamp the series (ADR 2026-08-01 Decision 7);
- token search, registration, and prerequisite linking;
- companion learner/model context;
- monitored practice and sampling;
- focused Recall, Learning Graph, Settings, and Studio panels.

## OKF knowledge work

| Tool | Purpose |
| --- | --- |
| `zam_okf_catalog` | List articles and conformance problems; `include_log` optionally includes raw `log.md` |
| `zam_okf_read` | Read one complete article |
| `zam_okf_audit` | Report Git-backed freshness evidence without writing |
| `zam_okf_upsert` | Validate and write an article, regenerate `index.md`, and append `log.md` |
| `zam_okf_read_citation` | Read a repo-contained Markdown citation such as an ADR |
| `zam_okf_visualize` | Open the searchable reader, article graph, or log |
| `zam_okf_focused` | Resolve the article currently focused in any connected reader |
| `zam_okf_import` | Atomically record an agent's finished decomposition as tokens and cards |

## Bundle resolution and containment

- An explicit `bundle_dir` always wins.
- Otherwise, `zam_okf_*` tools use `docs/okf` below the MCP client's workspace
  root from `roots/list`.
- The server working directory is the final fallback.
- Citation reads accept only `.md` targets that resolve inside the repository
  root, including citations outside the bundle such as `docs/adr/`.

# MCP Apps panels

Five self-contained HTML resources ship under `dist/ui/`:

| Opening tool | Resource | Purpose |
| --- | --- | --- |
| `zam_open_studio` | `ui://zam/studio` | Legacy all-in-one onboarding and curation |
| `zam_open_recall` | `ui://zam/recall` | Active recall |
| `zam_show_graph` | `ui://zam/graph` | Learning-token graph |
| `zam_open_settings` | `ui://zam/settings` | Learner and evaluator settings |
| `zam_okf_visualize` | `ui://zam/okf` | Repository knowledge base |

`npm run build:panel` produces these resources. The VS Code / Antigravity
Companion extension hosts the same panels in a webview and routes recall
evaluation through the selected IDE evaluator. Rapid replacement requests are
serialized and coalesced by recency, so the newest requested panel owns the
final iframe.

## Host-owned placement

- Native hosts decide where an MCP App appears.
- Recall requests standard `pip` mode only when the negotiated host context
  advertises it.
- Inline-only hosts remain inline; ZAM cannot force a host-specific right
  sidebar.
- The read-only Learning Graph and OKF surfaces hide evaluator/model controls,
  because their stored data is rendered without a model.

## Multi-window handoff

An opening tool cannot render a panel itself, so it publishes a UI intent that
a local Companion window picks up. Each editor window registers itself under
`~/.zam/hosts/<hostId>.json` — heartbeat every 5 seconds, focus state, and the
window's first workspace folder — and consumes only its own intent file under
`~/.zam/intents/`.

- `publishUiIntent` picks the window whose workspace contains the publishing
  process's working directory; focus and heartbeat recency only break ties.
- Registration continues while a window is unfocused, so a request published
  while the user's focus sits elsewhere still reaches a window.
- Entries older than 60 seconds are pruned, which cleans up after a window
  that was killed rather than closed.
- `~/.zam/vscode-host.json` and the shared `~/.zam/ui-intent.json` remain as a
  single-slot fallback for a Companion or CLI older than 0.25. A window claims
  the shared file only while focused, and records every id it sees so it never
  replays another window's request on regaining focus.

## Machine-local settings under concurrency

`~/.zam/config.json` holds every machine-local setting — install mode, model
registry, workspaces, and the Companion's learner, evaluator, and model
selections. Each window runs its own `zam mcp`, so several processes write it
at once.

- `saveInstallConfig` replaces the file through a temp file and a rename, so no
  reader ever sees a torn file.
- Every setter goes through `updateInstallConfig`, which loads, mutates, and
  saves under an exclusive `config.json.lock`. The load happens *inside* the
  lock: without it two processes interleave and one silently drops the other's
  change, which the learner sees as a setting reverting by itself.
- Whether a lock may be taken away from its holder depends on whether that
  holder is still **running**, not on how long its work has taken. A holder
  that is alive finishes on any filesystem, so waiting costs a stall while
  taking the lock from it costs a setting. The lock file records the holder's
  pid for exactly this check.
- A lock whose owner has exited is broken immediately. A live owner is waited
  out for 10 seconds, and any lock is broken after 30 — a backstop for a
  suspended process or a recycled pid, not the normal path. Elapsed-time
  thresholds this generous are what keep a slow filesystem, such as a Windows
  ARM runner with a scanner between every create and rename, from looking like
  a crashed process.
- Releasing removes a lock only when its token can still be read and matches
  the process's own token. A missing or different token leaves the path
  untouched. Otherwise a single broken lock cascades: the original holder
  deletes its successor's lock on the way out, and a run of writes lands
  unprotected.
- An acquire that fails with anything other than "already exists" is retried
  for half a second measured from the first refusal before giving up. Measuring from
  the first refusal (rather than the start of the overall acquire) ensures a
  writer queued behind a live holder still gets its retry budget when the lock
  releases. On Windows a create transiently fails
  while the previous holder's unlink is still in flight or a scanner holds the
  file, and treating that as "no lock available" writes unsynchronized — the
  exact lost update the lock exists to prevent.
- The lock stays best-effort. A lock file no owner can be read from is broken
  after half a second instead of waited on, and a location where no lock can be
  created at all writes unlocked. Failing to lock must never stop ZAM from
  saving its own settings.

# OKF visualizer

`zam_okf_visualize` accepts an optional initial `view`:

- `reader` shows the selected article;
- `graph` immediately shows OKF articles and their cited ADRs;
- `log` shows the bundle change log.

The requested view is forwarded through VS Code UI intents and Copilot canvas
adapters. A missing or invalid bundle opens the panel with visible `problems`
instead of failing the opening tool.

## Reader navigation and diagrams

- Article links stay inside the reader.
- Citation links expand inline and can open a full citation view through
  `zam_okf_read_citation`.
- External and canonical source links use MCP Apps `ui/open-link` wherever the
  negotiated host advertises the `openLinks` capability; a normal click is
  sufficient. Without that capability the panel leaves the plain HTTPS anchor
  to navigate on its own, so a click is never swallowed.
- The VS Code Companion opens a matching canonical GitHub `blob/main` source
  as a local file in an open workspace. If no safe matching file exists, it
  opens the HTTPS URL externally.
- Fenced `mermaid` blocks render locally as non-interactive SVG with strict
  security and HTML labels disabled. No diagram source leaves the panel.
- Invalid or empty Mermaid source keeps the escaped source block visible and
  adds a localized error notice; one failing diagram never stops the ones
  after it.

## Freshness radar

`zam_okf_audit` reads repo-contained path-shaped values enclosed in backticks
on `- Code:` rows under `# Citations`. For each article it compares the latest
article commit with the latest commit for every cited code path:

- `current`: cited code is at the article commit or one of its ancestors, or
  its only change since then was to version literals;
- `review-recommended`: cited code has a later descendant commit, an
  uncommitted change, or a missing path-shaped target;
- `unknown`: Git history, tracking, or ancestry is insufficient.

A change that touches nothing but version strings — the `ZAM-Content-Studio`
User-Agent every release bumps, for example — stays `current` and reports the
reason `version-only-change`, so a release never manufactures review work. The
test is strict: removed and added lines must pair up one-to-one and match once
semver literals are masked, so a behavior change riding along with a bump still
recommends review.

A valid frontmatter timestamp is only the fallback for an untracked article.
Descriptive identifiers without path syntax are ignored. The audit never
rewrites articles and never changes tokens, cards, or FSRS state.

The visualizer paints catalog and log first, then requests freshness
asynchronously. Only `review-recommended` articles receive an amber sidebar
dot; the reader labels all three states and names changed paths in its tooltip.
Audit failure degrades to `unknown` without blocking reading, importing, graph,
or log views.

# OKF link graph

The graph uses the same article and citation nodes in two layouts:

- **Overview:** articles occupy a type-clustered inner ellipse; citations occupy
  an outer ellipse.
- **Focused:** the selected node moves to the center, direct one-hop neighbors
  form an enlarged inner ring, and all remaining nodes stay visible on a faint
  outer rim. Node direction is preserved between layouts.

| Interaction | Result |
| --- | --- |
| Left-click article | Open it in the reader |
| Left-click citation | Open its full citation view |
| Right-click node | Focus or re-center that node |
| Right-click centered node or empty canvas | Return to overview |
| `Esc` or overview toolbar button | Return to overview |
| Hover node | Emphasize its edges and neighbors |

The citation view returns to the focused graph when opened from the graph, and
to the article otherwise. Edges meet node borders instead of crossing node
boxes. Center, neighbor, rim, and overview labels use progressively tighter
wrapping so the focused title remains the primary readable label.

# From repository knowledge to learning

The reader's **import as learning content** action starts an agent-guided flow:

1. The reader records its focused article through the app-only `zam_okf_focus`
   tool, in `~/.zam/focus/<hostId>.json` for its own window and in
   `~/.zam/okf-focus.json` unscoped.
2. A host advertising MCP Apps `message` receives the decomposition request via
   `ui/message`; the VS Code Companion routes it to the editor Chat view.
3. A host without chat shows the same instruction as copyable text.
4. The agent reads the full article, judges recall-worthy concepts, Bloom
   levels, domains, and prerequisite order, then writes once through
   `zam_okf_import`.

A typed request such as “import this OKF” in Claude Code, Copilot, Codex, or
another connected harness resolves the same machine-local focus through the
model-visible `zam_okf_focused` tool.

The focus is scoped per window like the UI intents above. The writing panel
learns its window from `ZAM_COMPANION_HOST_ID`, which the extension injects
into the `zam mcp` child it spawns; the reader resolves the window from its own
working directory through the host registry. A window's article wins over the
unscoped file even when the unscoped one is newer — the agent asking is working
inside one window, and that window's reader is the one it means. Surfaces
outside an editor window, such as the desktop app, write and read the unscoped
file alone.

`zam_okf_import` writes tokens, prerequisite edges, and per-user cards in one
transaction:

- `new` adds a token;
- `update` refreshes content and keeps learning state;
- `replace` refreshes content and resets learning state;
- omitted previous tokens move to maintenance instead of being deleted;
- the submitted prerequisite list replaces the previous desired set;
- cycle rejection restores the previous content and graph.

The same operation is available through `zam bridge okf-import`.

# Learning Graph

`zam_show_graph` opens **ZAM Learning Graph**, never the OKF/ADR graph.

- With a focus token it centers direct prerequisites and dependents.
- Without a focus it shows scope selectors, grouped domains, and a clickable
  token list instead of an empty state.
- Its default scope uses tokens anchored to the workspace OKF bundle's article
  source-link bases.
- When the workspace has no imported repository knowledge it falls back to all
  tokens.
- The scoped listing is also available through repeatable
  `zam bridge list-tokens --source-link-base` arguments.

# Central learning field-test tools and Recall

MCP mirrors the bounded, commit-controlled learner workflow through
`zam_bundled_cells_list`, `zam_bundled_cell_enrol`,
`zam_preconditions_get`, `zam_precondition_assess`,
`zam_pull_forward_candidates`, `zam_pull_forward_execute`,
`zam_bonus_candidates_list`, and `zam_bonus_atom_enrol`. Content selection
is available in Studio; no arbitrary package, URL, or manifest crosses the
pilot publication boundary.

The Recall panel calls `zam_get_reviews` with `respectWorkload: true`, so
its snapshot observes the learner's total-card limit, new-card limit, sibling
settings, and `tier1-first` ordering. A learner who explicitly chooses “keep
going” supplies only the selected batch's additional-new count as a temporary
override. Tier-1 binary checks render as one-tap choices and are compared
locally rather than sent to a model. Precondition, keep-going, and bonus
choices use the dedicated tools; none manufactures an FSRS rating.

# Citations
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [Field-test slice plan](../plans/2026-08-15-central-learning-field-test-slice.md)
- Tests: `tests/cli/mcp.test.ts`, `tests/cli/bridge-handlers.test.ts`, `tests/desktop/study-offers.test.ts`
- Code: `src/cli/commands/mcp.ts`, `desktop/src/panel/recall.ts`, `desktop/src/learning-content.ts`

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-07-11 — Codex and VS Code Companion Surfaces](../adr/2026-07-11-codex-and-vscode-companion-surfaces.md)
- [ADR 2026-07-16 — Companion Context Bar and Harness Affinity](../adr/2026-07-16-companion-context-and-harness-affinity.md)
- [ADR 2026-07-17 — OKF Knowledge Base](../adr/2026-07-17-okf-knowledge-base.md)
- [ADR 2026-07-17b — OKF Visualizer Panel](../adr/2026-07-17b-okf-visualizer-panel.md)
- [ADR 2026-07-18 — Knowledge-to-Learning Import](../adr/2026-07-18-okf-learning-import.md)
- [ADR 2026-07-18b — Learning Graph Scope Selectors and the Repo Scope](../adr/2026-07-18b-graph-repo-scope.md)
- [ADR 2026-07-18c — OKF Import Handoff](../adr/2026-07-18c-okf-import-handoff.md)
- [ADR 2026-07-29b — OKF Freshness Radar](../adr/2026-07-29b-okf-freshness-radar.md)
- [ADR 2026-07-30 — OKF Reader Navigation and Mermaid Rendering](../adr/2026-07-30-okf-reader-navigation-and-mermaid.md)
- [ADR 2026-08-01 — Learning Progress Statistics](../adr/2026-08-01-learning-progress-stats.md)
- [ADR 2026-08-09b — Portable Agent Plugin Package](../adr/2026-08-09b-agent-plugin-package.md)
- Code: `src/cli/commands/mcp.ts`, `src/cli/commands/agent.ts`, `src/cli/okf/io.ts`, `src/cli/okf/freshness.ts`, `src/cli/okf-focus.ts`, `src/cli/ui-intent.ts`, `src/kernel/system/install-config.ts`, `src/kernel/analytics/progress.ts`, `src/cli/bridge-handlers.ts` (`importOkfTokens`), `src/vscode-extension/extension.ts`, `src/vscode-extension/host.ts`, `src/vscode-extension/protocol.ts`, `src/vscode-extension/latest-task-queue.ts`, `src/copilot-extension/extension.mjs`, `desktop/src/panel/context-bar.ts`, `desktop/src/panel/display-mode.ts`, `desktop/src/panel/recall.ts`, `desktop/src/panel/graph.ts`, `desktop/src/panel/okf.ts`, `desktop/src/panel/okf-render.ts`, `desktop/src/panel/okf-mermaid.ts`, `desktop/src/panel/okf-panel.html`, `vite.config.panel.mts`, `plugin.json`, `mcp.json`, `skills/zam/SKILL.md`, `package.json`, `tests/cli/agent-plugin.test.ts`, `docs/AGENT_PLUGIN.md`
