# OKF Visualizer Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ADR [2026-07-17b](../adr/2026-07-17b-okf-visualizer-panel.md): an `okf-panel` MCP Apps panel (articles by type + search, markdown reader with inline cited ADRs, link graph, log view), opened by a new `zam_okf_visualize` tool, fed exclusively by OKF MCP tools including a new strictly-scoped citation read.

**Architecture:** CLI layer only (no kernel changes). Panel = self-contained Vite single-file build (`dist/ui/okf-panel.html`) like the four existing panels; data via `createCallTool` over the MCP Apps bridge. New fs logic goes in `src/cli/okf/io.ts` (citation path resolution); tool registrations in `src/cli/commands/mcp.ts` with lazy `await import("../okf/…")` in handlers.

**Tech Stack:** existing only — TypeScript, Vite + vite-plugin-singlefile, `@modelcontextprotocol/ext-apps`, Vitest, Biome. **No new dependencies** (hard rule).

## Global Constraints

- Repo `c:\src\github\zam`, branch `feat/okf-visualizer-panel` (carries the accepted ADR). Commit format `<type>: <short summary>`. Push/PR is the CONTROLLER's step, not a subagent's.
- Gate before every commit: `npm run format && npm run lint && npm run typecheck && npm run test` (and `npm run build` where a task touches build wiring). Vitest hard-asserts the MCP tool count — every tool addition updates `tests/cli/mcp.test.ts` in the same task.
- Tool count trajectory: 21 today → **22** after Task 2 (`zam_okf_read_citation`) → **23** after Task 5 (`zam_okf_visualize`).
- Panel entry must stay Tauri-free/Three.js-free/`./main`-free (`tests/desktop/module-boundaries.test.ts` — add the new file to its cases). Panel root ids: `zam-okf-panel`, plus `zam-contextbar-root` and `zam-connection-notice` divs, matching the other panels.
- Citation-read validation (ADR Decision 5, binding): reject absolute paths; reject `..` escaping the repository root (nearest ancestor of the bundle dir containing `.git`, else the resolved bundle parent); `.md` files only; read-only; the target may be OUTSIDE the bundle (that is its purpose) but never outside the repo root.
- The panel's article model is keyed by `resource` URL (future learning overlay — ADR Future work).
- Same-PR rule: `docs/okf/mcp-surfaces.md` describes the MCP tools/panels surface and must be updated in this branch via the sanctioned write path (`upsertArticle` code path; index/log regenerate).
- Panel code is independent of any external static visualizer implementations (ADR Decision 4) — spec-driven fresh code, generic wording only (public repo: no team/company references anywhere).

---

### Task 1: Citation path resolution in the OKF io layer (TDD)

**Files:**
- Modify: `src/cli/okf/io.ts`
- Test: `tests/cli/okf-bundle.test.ts` (extend)

**Interfaces:**
- Produces: `resolveCitationPath(bundleDir: string, target: string): string` exported from `src/cli/okf/io.ts` — returns the absolute path of a valid citation target or throws `Error` with a message starting `invalid citation target:` naming the reason. Also export `findRepoRoot(startDir: string): string` (walks up to the nearest directory containing `.git`; falls back to `resolve(startDir, "..")`).

- [ ] **Step 1: Write failing tests** — extend `tests/cli/okf-bundle.test.ts` with a new `describe("resolveCitationPath")` using `mkdtempSync` temp dirs shaped like a repo (`<tmp>/.git/` dir, `<tmp>/docs/okf/`, `<tmp>/docs/adr/x.md`):

```ts
describe("resolveCitationPath", () => {
  const makeRepo = () => {
    const root = mkdtempSync(join(tmpdir(), "zam-okf-cite-"));
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "docs", "okf"), { recursive: true });
    mkdirSync(join(root, "docs", "adr"), { recursive: true });
    writeFileSync(join(root, "docs", "adr", "2026-01-01-x.md"), "# X\n");
    return root;
  };

  it("resolves a relative ADR citation inside the repo", () => {
    const root = makeRepo();
    const p = resolveCitationPath(join(root, "docs", "okf"), "../adr/2026-01-01-x.md");
    expect(p).toBe(resolve(root, "docs", "adr", "2026-01-01-x.md"));
  });

  it("rejects absolute paths", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), resolve(root, "docs/adr/2026-01-01-x.md")))
      .toThrow(/invalid citation target/);
  });

  it("rejects escape from the repo root", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), "../../../etc/passwd.md"))
      .toThrow(/invalid citation target/);
  });

  it("rejects non-markdown targets", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), "../adr/x.png"))
      .toThrow(/invalid citation target/);
  });

  it("falls back to the bundle parent as root when no .git exists", () => {
    const root = mkdtempSync(join(tmpdir(), "zam-okf-nogit-"));
    mkdirSync(join(root, "okf"), { recursive: true });
    writeFileSync(join(root, "sibling.md"), "# S\n");
    expect(resolveCitationPath(join(root, "okf"), "../sibling.md")).toBe(resolve(root, "sibling.md"));
    expect(() => resolveCitationPath(join(root, "okf"), "../../outside.md")).toThrow(/invalid citation target/);
  });
});
```

- [ ] **Step 2: Run, observe failure** (`npm run test -- tests/cli/okf-bundle.test.ts`) — missing exports.

- [ ] **Step 3: Implement** in `src/cli/okf/io.ts` (style-match the existing functions):

```ts
export function findRepoRoot(startDir: string): string {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(startDir, "..");
    dir = parent;
  }
}

export function resolveCitationPath(bundleDir: string, target: string): string {
  if (isAbsolute(target)) throw new Error(`invalid citation target: absolute paths are not allowed (${target})`);
  if (!target.endsWith(".md")) throw new Error(`invalid citation target: only .md files are readable (${target})`);
  const root = findRepoRoot(bundleDir);
  const resolved = resolve(bundleDir, target);
  const rel = relative(root, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`invalid citation target: resolves outside the repository root (${target})`);
  }
  return resolved;
}
```

(Note the no-`.git` fallback: `findRepoRoot` returns the bundle's parent, so `../sibling.md` passes and `../../outside.md` fails — exactly what the test pins.)

- [ ] **Step 4: Run tests, verify pass; run the full gate** (`npm run format && npm run lint && npm run typecheck && npm run test`).
- [ ] **Step 5: Commit** — `feat: scoped citation path resolution for OKF bundles`

---

### Task 2: `zam_okf_read_citation` tool + `include_log` on catalog (TDD)

**Files:**
- Modify: `src/cli/commands/mcp.ts`, `tests/cli/mcp.test.ts`

**Interfaces:**
- Produces tool `zam_okf_read_citation`: input `{ bundle_dir?: string, target: string }` (zod: `okfBundleDirSchema` reuse + `z.string()`), plain tool, `commonAnnotations`, lazy handler: `const { resolveCitationPath } = await import("../okf/io.js")`; reads the file (`readFile` utf-8), returns `{ target, path: <repo-relative path>, content }`; validation/read errors surface through the existing `wrapHandler` error shape.
- Produces: `zam_okf_catalog` accepts optional `include_log?: boolean`; when true the result gains `log: string` (raw `log.md` content, empty string if the file is missing).
- `tests/cli/mcp.test.ts`: tool count 21→22, name list updated; new cases — citation read round-trip against a temp repo bundle, traversal rejection surfaces `isError` with `invalid citation target`, catalog `include_log` returns log text.

- [ ] **Step 1: Write failing tests** in `tests/cli/mcp.test.ts` (follow the existing in-memory client pattern; temp bundle fixture with `.git` dir, one article via `upsertArticle`, one `docs/adr/*.md` file).
- [ ] **Step 2: Observe failure** (count assertion + missing tool).
- [ ] **Step 3: Implement** in `createMcpServer` beside the existing OKF tools (lines ~1218-1322), mirroring their registration style and lazy imports exactly.
- [ ] **Step 4: Full gate.**
- [ ] **Step 5: Commit** — `feat: okf citation read tool and catalog log option`

---

### Task 3: Panel rendering core as pure module (TDD)

**Files:**
- Create: `desktop/src/panel/okf-render.ts`
- Test: `tests/desktop/okf-render.test.ts`

**Interfaces:**
- Produces (pure, DOM-free, importable under Vitest without a DOM):
  - `renderMarkdown(source: string): string` — escapes ALL HTML first, then renders headings, paragraphs, bold/italic/inline code, fenced code, ordered/unordered lists, tables, blockquotes, links. Link classification hook: `[x](<kebab>.md)` → `<a data-okf-article="<file>">`, `[x](../adr/<file>.md)` (or any relative `.md` outside the bundle) → `<a data-okf-citation="<target>">`, external URLs → `target="_blank" rel="noopener noreferrer"`.
  - `groupCatalog(catalog: CatalogEntry[]): Map<string, CatalogEntry[]>` — by frontmatter `type`, stable order.
  - `filterCatalog(catalog: CatalogEntry[], query: string): CatalogEntry[]` — title/description/tags/file matching, case-insensitive.
  - `extractLinks(body: string): { articles: string[]; citations: string[] }` — for the graph.
  - `layoutGraph(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): PositionedNode[]` — deterministic circle layout, articles on the ring by type order, citation nodes on an outer arc.
- Tests pin: escaping (a `<script>` in source never survives), each markdown construct, link classification (all three kinds), grouping/filter behavior, layout determinism (same input → same coordinates), citation extraction from a real-shaped article body with a `# Citations` section.

- [ ] Steps: failing tests → implement → gate → commit `feat: okf panel rendering core`.

---

### Task 4: The panel itself + build wiring

**Files:**
- Create: `desktop/src/panel/okf-panel.html`, `desktop/src/panel/okf.ts`
- Modify: `vite.config.panel.mts` (`MODE_TO_INPUT` gains `okf`), `package.json` (`build:panel` gains `vite build --config vite.config.panel.mts --mode okf` — appending, never emptying), `tests/desktop/module-boundaries.test.ts` (add `okf.ts` case)

**Interfaces:**
- Consumes: `okf-render.ts` (Task 3), `context-bar.ts` (`App`, `createCallTool`, `ensureContextBar`, `fallbackContextBarState`, `showConnectionNotice`/`clearConnectionNotice`), `i18n.ts`.
- Behavior spec (pinned by Task 3's pure functions plus the mcp.test.ts resource assertion in Task 5):
  - `app.ontoolresult` seeds `{ bundleDir, catalog, log, version, user, companionContext }` from `zam_okf_visualize` (Task 5 shape); 800ms fallback after `app.connect()` calls `zam_okf_catalog { bundle_dir: bundleDir ?? undefined, include_log: true }`; 4s no-host notice — all mirroring `graph.ts`.
  - Sidebar: type groups + search box (`filterCatalog`); article count + `okf_version` in the header.
  - Reader: `zam_okf_read { bundle_dir, file }` → `renderMarkdown`; meta strip from frontmatter (type badge, tags, timestamp, `resource` link out). Clicks on `data-okf-article` navigate in-panel; clicks on `data-okf-citation` call `zam_okf_read_citation { bundle_dir, target }` and render inline with an "ADR" badge and a link out; citation read errors show a non-blocking "not reachable" note.
  - Graph view (toggle): SVG from `extractLinks` + `layoutGraph`; article nodes colored per type via CSS variables (`--okf-type-*` with light/dark values), citation nodes visually distinct; click article node → reader.
  - Log view (toggle): raw log lines, newest first (they already are).
  - Theming: CSS custom properties + `@media (prefers-color-scheme: dark)`, `color-scheme: light dark` — copy the token approach from `graph-panel.html`, panel-specific styles inline in the HTML.
- [ ] Steps: write HTML + TS per spec → extend module-boundaries test (failing first) → wire vite mode + build script → `npm run build` and verify `dist/ui/okf-panel.html` exists, is self-contained, contains `zam-okf-panel` → full gate → commit `feat: okf visualizer panel`.

---

### Task 5: `zam_okf_visualize` app tool + resource + surface union

**Files:**
- Modify: `src/cli/commands/mcp.ts` (URI `ui://zam/okf`, `registerAppTool` + `registerAppResource` via `loadPanelHtml("okf-panel.html", …)`), `desktop/src/panel/context-bar.ts` + `src/vscode-extension/companion-context.ts` (surface union gains `"okf"` — keep both sides in sync by hand, as documented), `tests/cli/mcp.test.ts` (count 22→23; resource html contains `zam-okf-panel`; `_meta.ui.resourceUri` link; companion-context degradation case with `makeThrowingDb`)

**Interfaces:**
- Tool `zam_okf_visualize`: input `{ bundle_dir?: string }`; handler mirrors `zam_show_graph`'s open-tool pattern (resolve companion context safely, `publishUiIntent`, return `{ okf: "zam", version, user, bundleDir: <resolved>, catalog, log, companionContext }`) — catalog + log loaded lazily via `await import("../okf/io.js")` so the panel renders without a first round-trip; on a missing/invalid bundle return `{ …, catalog: [], problems }` rather than an error (panel shows the empty/problem state).
- [ ] Steps: failing mcp.test.ts additions → implement → full gate incl. `npm run build` (resource assertion needs the real dist HTML) → commit `feat: zam_okf_visualize opens the okf panel`.

---

### Task 6: Same-PR knowledge + ADR status

**Files:**
- Modify (via sanctioned write path only): `docs/okf/mcp-surfaces.md` (+ regenerated `docs/okf/index.md`, `docs/okf/log.md`)
- Modify: `docs/adr/README.md` (2026-07-17b row → Implemented), `docs/adr/2026-07-17b-okf-visualizer-panel.md` (Status → Implemented)

- [ ] **Step 1:** Update the `mcp-surfaces` article through the code path the tool uses (small one-off node script in the scratchpad invoking `upsertArticle` from `src/cli/okf/io.ts` via tsx, passing the full updated body) — mention the okf panel among the MCP Apps panels and the two new tools, current-truth wording only. Never hand-edit `index.md`/`log.md`.
- [ ] **Step 2:** Run `npm run test -- tests/cli/okf-conformance.test.ts` — must pass (this gates the bundle including your update).
- [ ] **Step 3:** ADR + index status flips; full gate; commit `docs: okf surface article and ADR status for the visualizer panel`.

---

## Self-review notes

- ADR coverage: Decisions 1 (panel) → Task 4; 2 (data via tools) → Tasks 2/4/5; 3 (`zam_okf_visualize`) → Task 5; 4 (independent code) → Tasks 3/4 spec-driven; 5 (scoped citation read) → Tasks 1/2; 6 (CLI-only) → no kernel file is touched anywhere. Future-work overlay: article model keyed by `resource` (Task 3 CatalogEntry carries it).
- Tool-count assertions are updated in the same task as each registration (Tasks 2, 5) — the known hard-assert trap.
- The panel cannot be imported under Vitest (module-scope `document`) — hence the pure-module split (Task 3) mirroring `graph-layout.ts`, and build-level verification (Task 4/5), matching existing repo practice.
- No new dependencies anywhere; heavy imports stay lazy inside handlers; single-bundle constraint untouched.
