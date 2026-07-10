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
- **Claude Code Desktop, Code tab (2026-07-09):** zam server loads via
  the project `.mcp.json`, `zam_open_studio` executes and returns
  `{studio, version, user}` correctly — but **no panel card renders**
  (tool result stays a collapsed text result). The Code tab is an MCP
  *tool* host, not an MCP-Apps *UI* host.
- **Chat tab (2026-07-09 evening, after config re-arm):** zam server
  connects, answers `tools/list` + `resources/list` — but the model
  never issued a `tools/call` (mcp-server-zam.log ends there). So the
  Chat-tab failure is at tool-invocation level (enablement/selection),
  not rendering. GitHub Copilot app: zam connects again, no tool call
  observed either, no card (Thomas).
- **ext-apps#671 research (2026-07-09):** open, unfixed bug — Claude
  Desktop (Windows) and claude.ai do NOT mount the MCP-Apps iframe even
  when the full protocol exchange succeeds (capability negotiated,
  resources/read served); users only see the text fallback "[This tool
  call rendered an interactive widget …]". Applies to mcp-remote
  proxies too → an HTTP-transport plan B would not help. The same UI
  renders correctly in the ext-apps repo's **basic-host** reference
  implementation (clone + `npm install` + `npm start` →
  localhost:8080). Fallback demo hosts to evaluate: basic-host
  (guaranteed per #671 reporter) and Goose (listed with documented
  MCP-Apps support).
- **basic-host: FULL RENDER SUCCESS (2026-07-09 evening).** ext-apps
  repo cloned to `C:\src\github\ext-apps`; new `scripts/mcp-http-dev.ts`
  exposes the zam MCP server via streamable HTTP on :3001 (stateless,
  fresh server per request, shared db); basic-host (ports 8080/8081,
  `SERVERS` env) connects and — notably — honors
  `visibility: ["app"]`: `zam_studio_bridge` is hidden from its tool
  picker. Calling `zam_open_studio` renders the complete Editor panel:
  connected header (v0.9.4, signed in as thomas), knowledge-context
  filter active ("work"), real personal cards listed through
  `zam_studio_bridge`. The full path is proven end-to-end:
  iframe → `ui/initialize` → `callServerTool` → HTTP → allowlist →
  Commander executor → SQLite → panel. Demo strategy: basic-host is the
  rendering demo (start: `npx tsx scripts/mcp-http-dev.ts` +
  `SERVERS='["http://localhost:3001/mcp"]' npx tsx serve.ts` in
  `ext-apps/examples/basic-host`); Claude Desktop demonstrates the
  conversational tool side until #671 lands.

**P2 complete (2026-07-09, overnight session, commits `b183b95..b9c57f4`):**

- `executeBridgeCommandJson` extracted from `bridge serve` (console-capture
  + promise-queue mutex, serve wire protocol unchanged); `zam_studio_bridge`
  MCP tool with the hard 13-command allowlist (`_meta.ui.visibility:
  ["app"]`, destructiveHint; provider/observer/session/curriculum rejected,
  test-asserted). `backup-create`/`update-check` deferred to P4 as planned.
- `desktop/src/bridge-transport.ts` (setBridgeTransport/runBridge seam) and
  i18n extracted out of main.ts; views repointed (import-line-only edits);
  module-boundary guard tests.
- Editor mounted in the panel: MCP transport via ext-apps
  `app.callServerTool` → `zam_studio_bridge`; all 67 bound DOM IDs
  replicated; non-allowlisted triggers hidden; `window.alert` replaced by
  an in-panel toast (sandboxed iframes usually lack allow-modals);
  `--clr-*` variables aliased. Bundle ~525 kB / ~126 kB gzip, Three- and
  Tauri-free.
- Whole-branch review (Fable): "ready to merge with fixes", 0 Critical —
  fixes applied same night. Suite green, lint/tsc clean.
- Follow-ups for a post-demo ticket: extract + unit-test
  `parseBridgeToolResult` (panel transport branches), confirm-gate
  subprocess test through the studio tool, `isServeMode` rename, compact
  JSON for large tool payloads, panel `App` version hardcode, and the
  locale decision (de hosts currently get a mixed de/en panel — decide at
  rehearsal: drop the navigator.language switch for consistent English, or
  ship mixed until P5 i18n).

**Direction update (2026-07-09, Thomas, pre-render-test):** MCP Apps are
in-place UI — cards render inline between chat turns (also on mobile,
where no side pane exists), not as a persistent side panel. Target shape
therefore: **separate single-purpose apps, no in-panel navigation** — the
harness leads the flow and surfaces the right card (editor / graph /
settings) from conversational context. New use case unlocked by in-place
UI: **spoiler-free recall cards** — active-recall quizzes cannot work in
a terminal harness (the answer text would be visible in scrollback); an
MCP-Apps card can hide/reveal the answer and submit ratings through the
existing `zam_get_reviews`/`zam_submit_review` tools (panels may call any
server tool via `callServerTool`). This revises "review flow stays
conversational" for MCP-Apps hosts — post-0.10.0 scope. In-card answer
mechanism (verified against ext-apps 1.7.4 App API, 2026-07-09):
free-text answers typed in the card → `app.sendMessage()` inserts a
user message, the harness LLM evaluates against the stored concept and
books the rating (keeps "zero model config"); self-rating buttons →
`app.callServerTool("zam_submit_review", …)` directly, no chat noise
(the studio-bridge allowlist constrains only `zam_studio_bridge`);
card state across turns → `app.updateModelContext()` (model-visible
without triggering a response). Both rating paths proven functionally
on 2026-07-09 via the show_widget fallback rail (sendPrompt ≙
sendMessage; free-text answer evaluated and booked by the agent).
Final-review refinement: the two rating paths are mutually exclusive —
free-text answers are booked by the harness model only; self-rating
buttons exist only on the reveal-without-answer path.
Consequences for
phases: P3 graph becomes its own tool + resource (`zam_show_graph` →
`ui://zam/graph`) instead of a Studio tab; P4 Settings-lite likewise a
separate card; the P2 Editor panel ships as-is for the Friday demo.
Confirm the shape after today's render test.

**Card wave complete (2026-07-10 early morning):** P3 + P4 shipped as
separate in-place cards per the direction pivot, plus the recall card —
see [2026-07-09-mcp-apps-card-wave.md](2026-07-09-mcp-apps-card-wave.md).
Four apps now: `zam_open_studio` (Editor), `zam_open_recall`
(spoiler-free recall: in-card free-text answer → model evaluates+books;
reveal path → self-rating; mutually exclusive per final review),
`zam_show_graph` (2D SVG neighborhood, click-to-recenter),
`zam_open_settings` (workspaces/repair, knowledge contexts, database
status, snapshot backup via new `backup-create`, update display via new
`update-check`; allowlist now 15 commands, 16 tools total). Final wave
review (Opus): 0 Critical; fixes applied (rating paths exclusivity,
stale test comment). All four cards **verified rendering with live
Turso data** in basic-host (Playwright/headless screenshots; recall
needs ~10 s for the 91-card batch — remote-DB latency, not a bug).
Suite green (656+ tests), branch pushed through the fix commits.

**Follow-ups (post-demo ticket):** shared `panel/mcp-shared.ts` helper
(dedupe the tripled callTool/connect boilerplate), inline recall's six
i18n strings (~130 kB bundle win), tool-numbering comments in mcp.ts,
`backupCreate` return-type annotation, offline update-check message
wording (English/CLI-flavored in a German card), graph SVG interaction
unit tests, panel locale decision (de hosts get mixed de/en until P5).

**BREAKTHROUGH (2026-07-10 morning): Claude Code Desktop's Code tab
RENDERS the cards.** After a broken 1.20186 update and rollback, the
direct-download build `AnthropicClaude\app-1.19367.0` renders MCP-Apps
panels inline in Code-tab sessions — verified live with
`zam_open_settings` (full card, live Turso data, buttons, update check
green). The MSIX/Store build with the same version number did NOT render
the day before; the distribution channel apparently ships different
renderer components. Consequence: the demo can run **in the primary
work environment itself** (Claude Desktop Code tab); Chat tab / Copilot
panel / Cowork remain nice-to-verify secondary stages, basic-host stays
the guaranteed fallback.

**Next:** P5 — rehearsal (Code tab first: all four cards incl. the
recall loop with sendMessage evaluation; then Chat tab, Copilot app,
Cowork), i18n/locale decision, README/ADR status, release 0.10.0.

## Verification

- `tests/cli/mcp.test.ts`: `resources/list` contains `ui://zam/studio`;
  `resources/read` returns HTML with the panel marker; `zam_open_studio`
  declares the `_meta.ui` link; `zam_studio_bridge` rejects commands outside
  the allowlist.
- Manual: panel renders in Claude Desktop and VS Code Copilot; Editor
  roundtrip (edit a question → `question_source` flips to `manual`); graph
  shows a token neighborhood; backup writes a snapshot file; update display
  shows channel/version.
