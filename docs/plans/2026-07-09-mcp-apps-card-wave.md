# MCP-Apps Card Wave Implementation Plan (Recall · Graph · Settings)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the three in-place MCP-Apps cards of Thomas's 2026-07-09
direction pivot — a spoiler-free Recall card, a 2D Knowledge-Graph card,
and a Settings-lite card — completing P3/P4 of
[2026-07-08-mcp-apps-studio-panel.md](2026-07-08-mcp-apps-studio-panel.md)
plus the newly spec'd recall mechanism, demo-ready.

**Architecture:** Each card is its own MCP-Apps app: one tool with
`_meta.ui.resourceUri` + one self-contained `ui://zam/*` HTML resource,
built as separate vite-singlefile bundles from `desktop/src/panel/`.
Cards talk to the server via `app.callServerTool` (data through the
existing `zam_studio_bridge` allowlist or regular tools), insert user
messages via `app.sendMessage` (harness LLM evaluates free-text
answers — zero model config in zam), and sync state via
`app.updateModelContext`. Two new transport-neutral bridge handlers
(`backup-create`, `update-check`) extend `bridge-handlers.ts`.

**Tech Stack:** TypeScript (plain DOM, framework-free), Vite 8 +
vite-plugin-singlefile (one build per entry — the plugin is single-input
by design), `@modelcontextprotocol/ext-apps` 1.7.4 server + app APIs,
Vitest, Biome.

## Global Constraints

- Kernel purity: no HTTP/fetch/LLM imports under `src/kernel/` — the
  update-check network fetch stays in the CLI layer.
- Panels stay Tauri-free and Three-free — extend
  `tests/desktop/module-boundaries.test.ts` for every new panel entry.
- `zam bridge` emits JSON only; new bridge commands go through the
  serve-compatible executor (`executeBridgeCommandJson`) untouched.
- The `zam_studio_bridge` allowlist is a closed set; this wave extends
  it by exactly `backup-create` and `update-check` (13 → 15).
- IDs are ULIDs; use `ulid()`.
- No new npm dependencies.
- New files ≤80-char lines, Biome-formatted; comments only for
  non-obvious constraints.
- Windows test isolation: subprocess tests override HOME/USERPROFILE
  (pattern in tests/cli/mcp.test.ts); no hardcoded path separators.
- Commits `feat:`/`refactor:`/`test:` prefixed, each ending with:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Deviation (approved): no worktree — work directly on
  `feat/mcp-apps-studio-panel` in this checkout.

## Shared ground truth (scouted 2026-07-09, do not re-derive)

- `zam_get_reviews` (MCP tool) returns `{cards:[...]}`; with
  `includeQuestions: true` each card has `cardId, tokenId, slug,
  concept, domain, bloomLevel, state, dueAt, bloomVerb, question,
  sourceLink, resolvedContext`. Ordered `bloom_level ASC, due_at ASC`,
  no limit. MCP path always forces `noDynamicQuestion: true`.
- `zam_submit_review` input `{user?, cardId?, tokenId?, rating? 1-4,
  sessionId?, doneBy?: "user"|"agent"}` → `{success, rating,
  evaluation:{nextDueAt, stability, difficulty, state, scheduledDays,
  reps, lapses}, blocked: {blockedSlug, prerequisites:[{slug, concept,
  bloomLevel}]}|null}`.
- `get-neighborhood` (studio-bridge cmd, argv `["--focus", slug]`,
  optional `["--user", id]`) → `{focus, center, prerequisites[],
  dependents[]}`; node = `{id, slug, title, display_title, concept,
  domain, bloomLevel, knowledgeContexts:[{name,label,language}],
  card:{state,reps,stability,difficulty,blocked,dueAt,lastReviewAt}|null}`.
  1-hop only; edge direction implicit (prerequisites → center →
  dependents). `src/bridge/protocol.ts` `GraphToken` type is stale
  (missing title/display_title/knowledgeContexts) — fix in Task 2.
- Kernel snapshot API (re-exported from `src/kernel/index.ts`):
  `exportSnapshot(db, options?) → Promise<string>` (portable SQL text,
  SHA-256 manifest), `verifySnapshot(snapshot) → SnapshotManifest
  {format, version, createdAt, tables: Record<string,number>,
  checksum}`.
- Kernel update API: `decideUpdate({currentVersion, latestVersion,
  channel}) → UpdateDecision {updateAvailable, currentVersion,
  latestVersion, channel, action, command?, reason}`,
  `getInstallChannel()`. Network fetch `fetchLatestVersion(repo)` and
  `currentVersion()` live in `src/cli/commands/update.ts:46-92` —
  Task 3 extracts them to a shared CLI module.
- `vite-plugin-singlefile` cannot do multi-entry (wontfix upstream) —
  build once per entry via an env-selected input.
- `loadStudioPanelHtml()` in `src/cli/commands/mcp.ts:68-86` hardcodes
  the filename; Task 1 generalizes it.
- ext-apps App API (1.7.4): `app.callServerTool({name, arguments})`,
  `app.sendMessage({...})` (inserts user message, triggers model),
  `app.updateModelContext({content:[...]})` (silent), `app.connect()`,
  `app.ontoolresult`. Success envelope of zam tools: parse
  `content[0].text` as JSON (never `structuredContent` — it wraps
  arrays as `{result}`); on `isError` throw `JSON.parse(text).error ??
  text` (existing pattern in `desktop/src/panel/panel.ts` `mcpTransport`).

---

### Task 1: Recall card (`zam_open_recall` → `ui://zam/recall`) + multi-panel build

**Files:**
- Modify: `vite.config.panel.mts` (env-selected input)
- Modify: `package.json` (`build:panel` builds all entries sequentially)
- Modify: `src/cli/commands/mcp.ts` (generalize `loadStudioPanelHtml` →
  `loadPanelHtml(fileName, placeholderTitle)`; register recall resource
  + `zam_open_recall` tool)
- Create: `desktop/src/panel/recall-panel.html`
- Create: `desktop/src/panel/recall.ts`
- Modify: `tests/cli/mcp.test.ts` (resource + tool assertions)
- Modify: `tests/desktop/module-boundaries.test.ts` (recall.ts entry)

**Interfaces:**
- Consumes: `zam_get_reviews` / `zam_submit_review` via
  `app.callServerTool` (shapes in Shared ground truth); `t`/`tf` from
  `desktop/src/i18n.ts`; result-parse pattern from
  `desktop/src/panel/panel.ts`.
- Produces: `loadPanelHtml(fileName: string, placeholderTitle: string):
  string` in mcp.ts (Tasks 2+3 reuse); npm script pattern
  `"build:panel": "vite build --config vite.config.panel.mts"` extended
  to run once per `PANEL_INPUT` (Tasks 2+3 append entries); resource
  URI convention `ui://zam/<name>` + file `desktop/src/panel/
  <name>-panel.html`.

- [ ] **Step 1: Failing tests first** — extend `tests/cli/mcp.test.ts`:
  `resources/list` contains `ui://zam/recall`; `resources/read` returns
  HTML containing marker id `zam-recall-panel`; `tools/list` contains
  `zam_open_recall` with `_meta.ui.resourceUri === "ui://zam/recall"`
  and annotations `{readOnlyHint: true}`; calling it returns
  `structuredContent` with `{recall: "zam", version, user}`. Update the
  existing tool-count assertion (13 → 14). Extend
  module-boundaries.test.ts: `desktop/src/panel/recall.ts` has no
  `@tauri-apps`/`three`/`./main` import. Run
  `npm run test -- tests/cli/mcp.test.ts tests/desktop/module-boundaries.test.ts`
  — expect the new assertions to FAIL.
- [ ] **Step 2: Build plumbing.** `vite.config.panel.mts`: select input
  via env with studio as default —
  ```ts
  const input = process.env.PANEL_INPUT ?? "studio-panel.html";
  // rollupOptions.input: resolve(dir, "desktop/src/panel", input)
  // emptyOutDir only when building the default (first) entry:
  // emptyOutDir: input === "studio-panel.html"
  ```
  `package.json`: `"build:panel"` becomes a chain that builds
  `studio-panel.html` then `recall-panel.html` (cross-env is NOT a dep;
  use `node -e` free chaining via `npm run` scripts with the env set by
  vite config default OR add per-entry scripts using PowerShell-safe
  syntax — simplest cross-platform:
  `"build:panel": "vite build --config vite.config.panel.mts && vite build --config vite.config.panel.mts --mode recall"`
  with the config reading `mode` instead of an env var:
  `input = mode === "recall" ? "recall-panel.html" : "studio-panel.html"`
  — use the `--mode` approach; it needs no new dependency).
- [ ] **Step 3: mcp.ts.** Rename `loadStudioPanelHtml` →
  `loadPanelHtml(fileName: string, placeholderTitle: string)` (both
  path candidates parameterized; placeholder HTML keeps the marker
  `<div id="zam-studio-panel">` ONLY for the studio call — give the
  placeholder a `data-panel` attribute from fileName instead of
  hardcoding; keep existing studio call sites green). Register:
  ```ts
  const RECALL_RESOURCE_URI = "ui://zam/recall";
  registerAppResource(server, "zam-recall", RECALL_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE }, async () => ({ contents: [{
      uri: RECALL_RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE,
      text: loadPanelHtml("recall-panel.html", "ZAM Recall") }] }));
  registerAppTool(server, "zam_open_recall", {
    title: "Open ZAM recall session",
    description: [see Step 4 — the answer-evaluation contract],
    inputSchema: { user: z.string().optional().describe("User ID") },
    annotations: { ...commonAnnotations, readOnlyHint: true },
    _meta: { ui: { resourceUri: RECALL_RESOURCE_URI } },
  }, wrapHandler(async ({ user }) => ({ recall: "zam",
    version: pkg.version, user: user ?? getSetting(db, "user.id") })));
  ```
  (Check how `zam_open_studio` resolves the user and mirror it.)
- [ ] **Step 4: The evaluation contract lives in the tool description.**
  Exact description text (verbatim, it instructs ANY harness model):
  "Open the ZAM spoiler-free recall card. The card shows due review
  questions; the user answers inside the card. When a user message
  arrives matching `ZAM-Antwort zu Karte "<slug>" (cardId <id>):
  <answer>`, evaluate the answer against the card's stored concept
  (fetch via zam_get_reviews if needed), then submit the FSRS rating
  with zam_submit_review (doneBy: "user", rating 1-4: 1 wrong/blank,
  2 partially correct or effortful, 3 correct, 4 correct and
  effortless) and reply with a one-line verdict naming what matched or
  was missing."
- [ ] **Step 5: The card.** `recall-panel.html` — self-contained,
  light/dark via `prefers-color-scheme` CSS variables (copy the
  variable block pattern from `studio-panel.html`, include the
  `--clr-*` aliases), root `<div id="zam-recall-panel">`, header
  (status dot + version like studio), then card area. `recall.ts`:
  - `App` from `@modelcontextprotocol/ext-apps`; connect; reuse the
    studio `mcpTransport`-style result parsing (copy the small
    function, do NOT import from `./panel.ts` — keep entries
    independent).
  - On connect: `callServerTool("zam_get_reviews", {includeQuestions:
    true, ...(user && {user})})` where `user` comes from
    `ontoolresult` structuredContent; store `cards` array; render
    card 0 with counter "1 / N".
  - Card render: domain + `Bloom <level> · <bloomVerb>` badges,
    question text, then EITHER reveal-first flow or answer-first flow:
    a textarea (`placeholder: "Antwort aus dem Gedächtnis…"`), button
    row: `Antwort prüfen` (primary; disabled while textarea empty),
    `Aufdecken` (secondary). The stored `concept` stays in a JS
    closure — never in the DOM before reveal (spoiler discipline,
    stricter than the show_widget prototype).
  - `Antwort prüfen` → `app.sendMessage({ content: [{ type: "text",
    text: `ZAM-Antwort zu Karte "${card.slug}" (cardId ${card.cardId}):
    ${answer}` }] })` (verify exact params type from
    `node_modules/@modelcontextprotocol/ext-apps/dist/src/app.d.ts`
    `McpUiMessageRequest`), then show the revealed concept + the
    4-rating row (user may still self-rate; the model may also have
    booked — see Step 6 note), and disable double-send.
  - `Aufdecken` → reveal concept + rating row (self-rating path).
  - Rating buttons `Nochmal/Schwer/Gut/Leicht` (1-4) →
    `callServerTool("zam_submit_review", {cardId, rating, doneBy:
    "user", ...(user && {user})})` → on success show
    `→ wieder fällig <formatted nextDueAt>` briefly, advance to next
    card, update counter; on `blocked` non-null show a small notice
    with `blockedSlug`.
  - After every state change call `app.updateModelContext({ content:
    [{ type: "text", text: JSON.stringify({ zamRecall: { cardId,
    slug, state: "shown|revealed|answered|rated", remaining } }) }] })`
    (verify exact params from d.ts).
  - Empty queue: friendly "Nichts fällig" state.
- [ ] **Step 6: Double-booking guard.** When the user sends a text
  answer (sendMessage) the MODEL books the rating; the card must then
  treat its own rating row as optional ("vom Assistenten bewertet —
  selbst nachjustieren?" hint) — implement by disabling auto-advance
  until either a card rating click OR 10s timeout after sendMessage,
  whichever first; keep it simple and comment the constraint.
- [ ] **Step 7: Build + verify.** `npm run build` (both panels emit:
  `dist/ui/studio-panel.html` AND `dist/ui/recall-panel.html`; check
  vite output sizes, recall should be well under studio since no
  learning-content import). `Select-String -Path dist/ui/recall-panel.html -Pattern "THREE","@tauri"`
  → no matches. Tests from Step 1 now PASS. `npx tsc --noEmit -p
  desktop`, `npm run lint`, full `npm run test` once.
- [ ] **Step 8: Commit** —
  `feat: spoiler-free recall card as MCP app (zam_open_recall)`.

### Task 2: Graph card (`zam_show_graph` → `ui://zam/graph`)

**Files:**
- Create: `desktop/src/panel/graph-panel.html`
- Create: `desktop/src/panel/graph.ts`
- Modify: `src/cli/commands/mcp.ts` (resource + tool)
- Modify: `package.json` (`build:panel` third entry, `--mode graph`)
- Modify: `vite.config.panel.mts` (mode → input map:
  `{recall: "recall-panel.html", graph: "graph-panel.html"}`)
- Modify: `src/bridge/protocol.ts` (`GraphToken`: add `title: string`,
  `display_title: string`, `knowledgeContexts: Array<{name: string;
  label: string; language: string}>` — align with the real mapToken)
- Modify: `tests/cli/mcp.test.ts`, `tests/desktop/module-boundaries.test.ts`

**Interfaces:**
- Consumes: `loadPanelHtml` from Task 1; `zam_studio_bridge` with
  `{cmd: "get-neighborhood", args: ["--focus", slug]}` (+
  `["--user", user]` when known) — response shape in Shared ground
  truth; `RESOURCE_MIME_TYPE`, `registerAppResource/Tool` patterns.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Failing tests** — mcp.test.ts: `ui://zam/graph` listed
  + readable (marker `zam-graph-panel`), tool `zam_show_graph` with
  `_meta.ui`, inputSchema accepts `{focus?: string, user?: string}`,
  annotations `{readOnlyHint: true}`, tool count 14 → 15;
  module-boundaries entry for graph.ts. Run; expect FAIL.
- [ ] **Step 2: Register.** Tool result `{graph: "zam", focus: focus ??
  null, version: pkg.version, user: ...}` via `wrapHandler`; the card
  reads `structuredContent.focus` from `ontoolresult`.
- [ ] **Step 3: The card.** 2D SVG neighborhood (NO Three.js, no libs):
  - Layout: center node mid-canvas; `prerequisites[]` on a lower arc,
    `dependents[]` on an upper arc (mirrors the desktop 3D semantics:
    green=prerequisite edges below, blue=dependent edges above — reuse
    those two hues, light/dark adjusted).
  - Node: rounded rect, label `display_title` (fallback slug),
    Bloom-level tint (5-step scale from the panel palette), small
    badge when `card?.blocked`, muted styling when `card === null`
    (no personal card).
  - Interaction: click any node → fetch its neighborhood via
    `zam_studio_bridge` and re-render (click-to-recenter per plan
    decision); a small breadcrumb of the last 5 focus slugs enables
    going back. Hover: title tooltip with concept (SVG `<title>`).
  - No focus given: render an empty state with a hint ("Ruf mich mit
    einem Fokus-Token auf: zam_show_graph {focus}") — the model
    usually passes focus from conversation context.
  - `updateModelContext` after each recenter: `{zamGraph: {focus,
    prerequisites: n, dependents: n}}`.
- [ ] **Step 4: Build + verify.** Third build entry emits
  `dist/ui/graph-panel.html`; THREE/@tauri greps clean; tests PASS;
  `tsc -p desktop`; lint; full suite once.
- [ ] **Step 5: Commit** —
  `feat: 2D knowledge-graph card as MCP app (zam_show_graph)`.

### Task 3: Settings card + `backup-create` / `update-check` handlers

**Files:**
- Create: `src/cli/update/latest-version.ts` (extraction)
- Modify: `src/cli/commands/update.ts` (import from the new module;
  behavior identical)
- Modify: `src/cli/bridge-handlers.ts` (two new handlers)
- Modify: `src/cli/commands/bridge.ts` (two thin Commander commands)
- Modify: `src/cli/commands/mcp.ts` (allowlist +2; settings resource +
  `zam_open_settings` tool)
- Create: `desktop/src/panel/settings-panel.html`
- Create: `desktop/src/panel/settings.ts`
- Modify: `package.json` / `vite.config.panel.mts` (fourth entry,
  `--mode settings`)
- Test: `tests/cli/bridge-handlers.test.ts` (handlers),
  `tests/cli/mcp.test.ts` (allowlist 15, resource, tool count 16),
  `tests/desktop/module-boundaries.test.ts` (settings.ts)

**Interfaces:**
- Consumes: kernel `exportSnapshot`, `verifySnapshot`,
  `decideUpdate`, `getInstallChannel` (all re-exported from
  `src/kernel/index.ts`); `ensureActiveWorkspace(db).path` +
  `defaultWorkspaceDir()` from `src/cli/workspaces/active.ts`;
  existing `backup-db` command at `bridge.ts:351-377` as the
  workspace-dir-resolution reference.
- Produces: bridge commands `backup-create` (`--dir <path>` optional)
  and `update-check` (`--latest <version>` and `--channel <channel>`
  optional, both for offline/deterministic testing), handler functions
  `backupCreate(db, params: {dir?: string})` and
  `updateCheck(params: {latest?: string; channel?: string})`.

- [ ] **Step 1: Failing handler tests** in
  `tests/cli/bridge-handlers.test.ts`:
  ```ts
  it("backupCreate writes a verifiable snapshot file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-snap-"));
    const res = await backupCreate(db, { dir });
    expect(res.ok).toBe(true);
    expect(res.path.endsWith(".sql")).toBe(true);
    const manifest = verifySnapshot(readFileSync(res.path, "utf-8"));
    expect(manifest.tables).toBeDefined();
    expect(res.checksum).toBe(manifest.checksum);
  });
  it("updateCheck decides deterministically with injected latest", async () => {
    const res = await updateCheck({ latest: "99.0.0", channel: "developer" });
    expect(res.updateAvailable).toBe(true);
    expect(res.latestVersion).toBe("99.0.0");
    expect(res.channel).toBe("developer");
  });
  ```
  Run; expect FAIL (functions missing).
- [ ] **Step 2: Extraction.** Move `currentVersion()` and
  `fetchLatestVersion()` from `src/cli/commands/update.ts:46-92` into
  `src/cli/update/latest-version.ts` (exact code move, exported);
  update.ts imports them. No behavior change — existing update tests
  must stay green.
- [ ] **Step 3: Handlers** in bridge-handlers.ts:
  ```ts
  export async function backupCreate(db: Database,
    params: { dir?: string }): Promise<{ ok: true; path: string;
    createdAt: string; checksum: string;
    tables: Record<string, number> }> {
    const targetDir = params.dir || (await ensureActiveWorkspace(db)).path;
    const snapshot = await exportSnapshot(db);
    const manifest = verifySnapshot(snapshot);
    const backupDir = join(targetDir, "zam-backups");
    mkdirSync(backupDir, { recursive: true });
    const stamp = manifest.createdAt.replace(/[:.]/g, "-");
    const path = join(backupDir, `zam-snapshot-${stamp}.sql`);
    writeFileSync(path, snapshot, "utf-8");
    return { ok: true, path, createdAt: manifest.createdAt,
      checksum: manifest.checksum, tables: manifest.tables };
  }
  export async function updateCheck(params: { latest?: string;
    channel?: string }): Promise<UpdateDecision> {
    const current = currentVersion();
    const latest = params.latest ?? (await fetchLatestVersion(GITHUB_REPO));
    const channel = (params.channel as InstallChannel) ?? getInstallChannel();
    return decideUpdate({ currentVersion: current,
      latestVersion: latest, channel });
  }
  ```
  (Adapt import sites/const names to reality; `GITHUB_REPO` moves to
  the extracted module.) Thin Commander commands in bridge.ts call
  these and `jsonOut(...)` the result; wire `--latest`/`--channel`/
  `--dir` flags. Handler tests PASS.
- [ ] **Step 4: Allowlist + MCP tests.** Add `backup-create`,
  `update-check` to `STUDIO_BRIDGE_ALLOWED_COMMANDS`; update
  mcp.test.ts allowlist assertions (still reject `backup-db`,
  provider/observer/session samples); add a subprocess test calling
  `zam_studio_bridge {cmd: "update-check", args: ["--latest",
  "0.0.1"]}` → parses to `updateAvailable: false`.
- [ ] **Step 5: Settings card.** Marker `zam-settings-panel`; tool
  `zam_open_settings` (readOnlyHint NOT set — the card can mutate via
  backup/repair; use `{...commonAnnotations}` only), result
  `{settings: "zam", version, user}`. Card sections, all via
  `zam_studio_bridge`:
  - Workspaces: `workspace-list` → table (label, path, linkHealth);
    per-workspace `Repair links` button → `workspace-repair-links
    --id <id>` → refresh.
  - Knowledge context: `get-active-knowledge-context` +
    `list-knowledge-contexts` → select; change →
    `set-active-knowledge-context [name]` (positional arg!).
  - Database: `database-status` → status line.
  - Backup: button → `backup-create` → show returned path + table
    count; errors inline.
  - Update: on load `update-check` (no args → live fetch; show
    spinner, handle offline error gracefully) → display
    `currentVersion → latestVersion (channel)` + `reason`; info-only,
    no install action (plan decision).
- [ ] **Step 6: Build + verify.** Fourth entry emits
  `dist/ui/settings-panel.html`; greps clean; mcp.test count 16 tools
  / 4 ui resources; `tsc -p desktop`; lint; full suite.
- [ ] **Step 7: Commit** — split in two:
  `feat: backup-create and update-check bridge handlers` and
  `feat: settings-lite card as MCP app (zam_open_settings)`.

### Task 4: Final whole-branch review + docs

- [ ] Generate review package `merge-base(main)..HEAD`, dispatch final
  reviewer (most capable model), triage/apply pre-merge fixes (one fix
  subagent, full findings list).
- [ ] Update `docs/plans/2026-07-08-mcp-apps-studio-panel.md` Status:
  P3/P4 done as separate cards, recall card shipped, what remains for
  P5 (rehearsal, release 0.10.0, i18n decision).
- [ ] Verify demo choreography end-to-end in basic-host: all four
  tools render their cards (studio editor, recall, graph, settings)
  against `scripts/mcp-http-dev.ts`; screenshot each.
- [ ] Commit docs; push branch.

## Self-review notes

- Spec coverage: recall mechanism (sendMessage/callServerTool/
  updateModelContext) → Task 1; P3 graph (2D, click-recenter, no
  main.ts extraction) → Task 2; P4 (Settings-lite, backup-create,
  update-check, allowlist) → Task 3; P5 partial (docs/verification) →
  Task 4 — release itself stays a human step.
- Types cross-checked against scouted shapes; protocol.ts GraphToken
  fix included (Task 2).
- Known open questions left to implementers WITH pointers: exact
  `McpUiMessageRequest`/`McpUiUpdateModelContextRequest` param shapes
  (read the d.ts — file path given), `zam_open_studio` user
  resolution (mirror it), mode-based vite input selection details.
