# MCP-Apps Studio Panel — ZAM Studio inside Claude & VS Code Copilot

**Date:** 2026-07-08 · **Target:** v0.10.0 · **Demo:** Friday 2026-07-11
**Implements:** [ADR 2026-07-06a](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
Decision 5 / Action Item 6 (first MCP Apps panel).
**Spec:** MCP Apps extension 2026-01-26 (`ui://` resources, sandboxed iframe,
postMessage JSON-RPC; supported by Claude, Claude Desktop, VS Code Copilot,
Goose).

## Goal

`zam mcp` serves a `ui://zam/studio` panel that renders inside Claude and
VS Code Copilot with three views:

1. **Editor** — the Learning Content Editor (token list/search, question
   curation; where `question_source` provenance pays off).
2. **Knowledge-Graph** — the neighborhood view.
3. **Settings-lite** — only what matters in-harness: **workspaces**,
   **local database backup**, **update display**. Explicitly omitted:
   provider/model configuration (the harness brings the model), observer
   and session controls.

Rationale (Thomas): an exact-fit, well-designed UI inside the harness, with
zero model configuration — LLM work is the harness's job. Review flow stays
conversational; the panel is for curation and administration.

## Decisions

1. **One panel bundle, reused views.** New entry `desktop/src/panel.ts`
   producing a self-contained HTML file (JS/CSS inlined) at
   `dist/ui/studio-panel.html`; `zam mcp` registers it as the
   `ui://zam/studio` resource. Studio conventions stay framework-free
   (plain TS + DOM), exactly as ADR Decision 5 planned for multi-mount.
2. **Transport injection at the single choke point.** All Studio views call
   `runBridge(cmd, args)` ([main.ts:1139](../../desktop/src/main.ts)). The
   panel provides an MCP-backed implementation via
   `@modelcontextprotocol/ext-apps` (`App.callTool`), the Tauri
   implementation stays as-is. Views remain unchanged.
3. **`zam_studio_bridge` tool with a hard allowlist.** One MCP tool carries
   the panel's data traffic (`{cmd, args}`), restricted to the commands the
   three views need: `list-tokens`, token read/edit/delete, `get-neighborhood`,
   `list-knowledge-contexts`, `get-/set-active-knowledge-context`,
   `workspace-list`, `workspace-repair-links`, `database-status`,
   `backup-create` (new), `update-check` (new). Provider, observer, and
   session commands are NOT reachable through this tool. Mutating commands
   follow the existing destructive/confirm annotation conventions.
4. **`zam_open_studio` entry tool** declares
   `_meta.ui.resourceUri: "ui://zam/studio"`; calling it renders the panel
   in the conversation.
5. **Graph extraction.** The Three.js neighborhood view (main.ts ~3541–3900)
   moves to a shared module consumed by both `main.ts` and `panel.ts`.
   Fallback if extraction fights back before Friday: a slim 2D neighborhood
   rendering on the same `get-neighborhood` data.
6. **Two new bridge handlers** (transport-neutral handler map, same pattern
   as ADR 2026-07-06a item 1): `backup-create` (kernel `exportSnapshot` to
   the workspace backup location) and `update-check` (kernel update-check;
   returns channel + available version for the update display).
7. **Out of scope for v1:** curriculum wizard in the panel, provider editor,
   observer surfaces, panel-initiated review sessions, VS Code webview
   extension (MCP Apps covers both demo hosts).

## Phases

- **P1 — Walking skeleton (Tue evening).** Register `ui://zam/studio`
  (placeholder HTML) + `zam_open_studio` with `_meta.ui`. Automated tests via
  the existing MCP JSON-RPC harness; manual render check in Claude Desktop
  and VS Code Copilot. De-risks the known Claude rendering issue
  (ext-apps#671) before any view work.
- **P2 — Transport + Editor (Wed).** `runBridge` injection, panel entry +
  build target, `zam_studio_bridge` allowlist tool, Editor view mounted.
- **P3 — Knowledge-Graph (Wed–Thu).** Graph module extraction, panel mount.
- **P4 — Settings-lite (Thu).** Workspaces, backup-create, update display.
- **P5 — Polish + demo rehearsal (Thu).** i18n, both hosts end-to-end,
  choose primary demo host, ADR/README status, release 0.10.0.

## Risks

- **Claude rendering (ext-apps#671).** P1 verifies immediately; VS Code
  Copilot is the fallback demo host.
- **main.ts entanglement.** Graph extraction touches a 4.7k-line file;
  mitigation: extract state + functions wholesale into a module with a
  narrow init/dispose interface, or fall back to the 2D rendering.
- **Bundle size.** Three.js inlined into the resource HTML (~150 KB gzip) is
  acceptable; hosts fetch the resource once.
- **Host UX differences** (panel height, persistence across turns). Demo
  rehearsal on Thursday settles the presentation flow.

## Verification

- `tests/cli/mcp.test.ts`: `resources/list` contains `ui://zam/studio`;
  `resources/read` returns HTML with the panel marker; `zam_open_studio`
  declares the `_meta.ui` link; `zam_studio_bridge` rejects commands outside
  the allowlist.
- Manual: panel renders in Claude Desktop and VS Code Copilot; Editor
  roundtrip (edit a question → `question_source` flips to `manual`); graph
  shows a token neighborhood; backup writes a snapshot file; update display
  shows channel/version.
