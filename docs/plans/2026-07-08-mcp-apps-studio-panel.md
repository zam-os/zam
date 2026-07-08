# MCP-Apps Studio Panel — ZAM Studio inside Claude & VS Code Copilot

**Date:** 2026-07-08 · **Target:** v0.10.0 · **Demo:** Friday 2026-07-11
**Implements:** [ADR 2026-07-06a](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
Decision 5 / Action Item 6 (first MCP Apps panel).
**Spec:** MCP Apps extension 2026-01-26 (`ui://` resources, sandboxed iframe,
postMessage JSON-RPC; supported by Claude, Claude Desktop, VS Code Copilot,
Goose).

## Goal

`zam mcp` serves a `ui://zam/studio` panel that renders inside Claude
(Desktop) and the GitHub Copilot app with three views:

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
5. **2D graph in the panel (decided 2026-07-08).** The panel gets a new,
   slim 2D neighborhood rendering (SVG) on the same `get-neighborhood`
   data, with click-to-recenter (clicking a node reloads its neighborhood).
   The Tauri desktop Studio keeps its Three.js 3D view; `main.ts` stays
   untouched in v0.10.0 — no graph extraction. Unifying the desktop on the
   2D module is a post-demo option.
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
- **P3 — Knowledge-Graph (Wed–Thu).** New 2D neighborhood renderer in the
  panel (SVG, click-to-recenter). No `main.ts` extraction.
- **P4 — Settings-lite (Thu).** Workspaces, backup-create, update display.
- **P5 — Polish + demo rehearsal (Thu).** i18n, both hosts end-to-end,
  choose primary demo host, ADR/README status, release 0.10.0.

## Risks

- **Claude rendering (ext-apps#671).** P1 verifies immediately; the
  GitHub Copilot app is the fallback demo host. VS Code Copilot is
  explicitly **not** a demo target (Thomas, 2026-07-08) — it only served
  as a generic MCP-Apps host smoke test.
- **main.ts entanglement / bundle size** — resolved 2026-07-08 by the
  2D-in-panel decision: no graph extraction, no Three.js in the panel
  bundle.
- **Host UX differences** (panel height, persistence across turns). Demo
  rehearsal on Thursday settles the presentation flow.

## Status (2026-07-08 end of day)

**P1 complete** on branch `feat/mcp-apps-studio-panel` (commits `f92a30e` +
follow-up):

- `zam mcp` serves `ui://zam/studio` (self-contained HTML, built by
  `npm run build:panel` → `dist/ui/studio-panel.html`) and registers
  `zam_open_studio` with `_meta.ui.resourceUri`. Panel completes the
  `ui/initialize` handshake and shows connection state + version + user.
- `zam agent connect claude-desktop` preset added (platform-aware
  `claude_desktop_config.json` path); `copilot` preset targets
  `~/.copilot/mcp-config.json`, which the GitHub Copilot desktop app is
  expected to share with Copilot CLI (verify during render test).
- Windows path-separator bugs in `tests/cli/agent-harness.test.ts` fixed;
  MCP tests isolated via `ZAM_CONFIG_PATH`. Full local suite green on
  Windows for the first time.

**Render check (2026-07-08 late evening, semi-automated via Windows-MCP):**

- Decisions taken: 2D graph **in the panel only** (desktop keeps 3D),
  **click-to-recenter** interaction — see Decisions 5 / Phases P3 / Risks.
- **VS Code Copilot (1.128, agent mode, routed to GPT-5.3-Codex):** picked
  up the checkout server from a freshly written user-level `mcp.json`
  *without restart*, ran `zam_open_studio` ("Ran ZAM Studio – zam (MCP
  Server)", completed) and answered "ZAM Studio is open and connected as
  user `thomas` (version `0.9.4`)". Caveat: that sentence is derivable
  from the tool result (`{studio, version, user}`), so **inline panel
  rendering still needs one human glance** at the chat card in VS Code.
- **Claude Desktop (1.19367):** `mcpServers.zam` → `node dist/cli/index.js
  mcp` written to `claude_desktop_config.json`. App restart required to
  load it — not automatable from this session (the session runs inside the
  app). After next app start, prompt "Open the ZAM Studio" in the Chat
  tab. ext-apps#671 risk therefore still open on the Claude host.
- **GitHub Copilot app (restarted 22:34):** config sharing with
  `~/.copilot/mcp-config.json` is **verified** — logs show "MCP client
  for zam connected" on both sessions. But on "Open the ZAM Studio" the
  agent did NOT use the panel tool; it ran a detached shell "Launch the
  ZAM desktop GUI" (`zam ui --dev` → tauri/vite on :1420) instead.
  Whether the app renders MCP Apps panels is still unconfirmed — retest
  with an explicit "call the zam_open_studio tool" prompt. Config
  backups: session scratchpad.
- Side effect fixed: Copilot's stray vite blocked port 1420, so the CCD
  preview of `desktop-vite` now uses `autoPort` + a `PORT` env override
  in `desktop/vite.config.ts` (tauri keeps 1420 by default). In a plain
  browser the Studio UI renders but data calls fail ("reading 'invoke'")
  — no Tauri IPC there; exactly the gap P2's transport injection fills.

**P2 (next session):** `runBridge` transport injection, `zam_studio_bridge`
allowlist tool, Editor view mounted in the panel — see Phases above.

## Verification

- `tests/cli/mcp.test.ts`: `resources/list` contains `ui://zam/studio`;
  `resources/read` returns HTML with the panel marker; `zam_open_studio`
  declares the `_meta.ui` link; `zam_studio_bridge` rejects commands outside
  the allowlist.
- Manual: panel renders in Claude Desktop and VS Code Copilot; Editor
  roundtrip (edit a question → `question_source` flips to `manual`); graph
  shows a token neighborhood; backup writes a snapshot file; update display
  shows channel/version.
