/**
 * ZAM OKF Visualizer — MCP Apps panel entry (Task 4,
 * docs/plans/2026-07-17-okf-visualizer-panel-plan.md).
 *
 * Browses an Open Knowledge Format bundle (docs/okf by default): a sidebar
 * of articles grouped by frontmatter `type` with a search box, a markdown
 * reader with inline-expandable cited ADRs, a link graph, and a raw log
 * view. All data comes from the `zam_okf_*` MCP tools — no fs/DB access of
 * its own, no external static-visualizer code (ADR 2026-07-17b Decision 4).
 *
 * Standalone by design (tests/desktop/module-boundaries.test.ts): no Tauri,
 * no Three.js, no import from ./main, ./panel, or ./recall. The rendering
 * core (escaping, markdown, catalog grouping/filtering, link extraction,
 * graph layout) is the pure, DOM-free module ./okf-render.js (Task 3); the
 * callTool/context-bar plumbing is shared via ./context-bar.js (item 9,
 * 0.11.0 review), same as every other panel entry.
 *
 * Two known forward references to later plan tasks, both harmless today:
 *  - `SURFACE` below is cast to `CompanionSurface` even though "okf" isn't
 *    a member yet — Task 5 adds it to both `CompanionSurface`
 *    (context-bar.ts) and `COMPANION_SURFACES`
 *    (src/vscode-extension/companion-context.ts) in the same task that
 *    registers `zam_okf_visualize` and starts supplying a real
 *    `companionContext` shaped with `surface: "okf"`. Until then, a manual
 *    Agent/User pill change on this panel round-trips to a surface the
 *    server doesn't recognize yet and degrades through the context bar's
 *    own `onError` path (an inline notice) instead of crashing — first
 *    paint and `ontoolresult`-driven rendering are unaffected either way.
 *  - `app.ontoolresult` is written against `zam_okf_visualize`'s result
 *    shape (Task 5), which doesn't exist yet, so in practice today only the
 *    800ms fallback (`zam_okf_catalog`, which does exist) ever actually
 *    populates the panel — exactly the "testable-by-build now" framing in
 *    the plan.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { setCurrentLocale } from "../i18n.js";
import {
  type CompanionContextBarState,
  type CompanionSurface,
  type ContextBarHandle,
  clearConnectionNotice as clearConnectionNoticeShared,
  createCallTool,
  createContextReader,
  createContextWriter,
  ensureContextBar,
  fallbackContextBarState,
  showConnectionNotice as showConnectionNoticeShared,
} from "./context-bar.js";
import {
  type CatalogEntry,
  type GraphEdge,
  type GraphNode,
  type PositionedNode,
  extractLinks,
  filterCatalog,
  groupCatalog,
  layoutGraph,
  renderMarkdown,
} from "./okf-render.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const GRAPH_W = 680;
const GRAPH_H = 680;
const NODE_R = 22;

// See the module doc comment above: Task 5 adds "okf" to CompanionSurface.
const SURFACE = "okf" as CompanionSurface;

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const headerCountEl = document.getElementById("okf-article-count");
const headerVersionEl = document.getElementById("okf-version");
const viewToggleEl = document.getElementById("okf-view-toggle");
const searchInputEl = document.getElementById(
  "okf-search",
) as HTMLInputElement | null;
const catalogGroupsEl = document.getElementById("okf-catalog-groups");
const contentEl = document.getElementById("okf-content");

const showConnectionNotice = (message: string): void =>
  showConnectionNoticeShared(noticeEl, message);
const clearConnectionNotice = (): void => clearConnectionNoticeShared(noticeEl);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type ViewMode = "reader" | "graph" | "log";

interface OpenOkfResult {
  bundleDir?: string | null;
  catalog?: CatalogEntry[];
  log?: string;
  version?: string;
  user?: string | null;
  companionContext?: CompanionContextBarState;
}

interface CitationState {
  status: "loading" | "ok" | "error";
  path?: string;
  content?: string;
  error?: string;
}

interface CitationView {
  target: string;
  path: string;
  content: string;
}

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;
let currentUser: string | null = null;
let connected = false;
let started = false;
let catalogLoaded = false;
let bundleDir: string | null = null;
let catalog: CatalogEntry[] = [];
/** First-seen `type` order across the full (unfiltered) catalog, fixed once
 * per catalog load — the categorical-color assignment must never reshuffle
 * while the user types in the search box (dataviz skill: fixed order, never
 * cycled). */
let typeOrder: string[] = [];
let logText = "";
let viewMode: ViewMode = "reader";
let currentFile: string | null = null;
let citationView: CitationView | null = null;
let searchQuery = "";
/** file -> markdown body, populated by the reader and by the graph view's
 * prefetch; shared by both so navigating never re-fetches. */
const bodyCache = new Map<string, string>();
const readErrors = new Map<string, string>();
const openCitations = new Map<string, CitationState>();

const app = new App({ name: "ZAM OKF", version: "0.1.0" });
const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);
const readCompanionContext = createContextReader(callTool, SURFACE);

/**
 * OKF content is bundle-scoped, not per-learner (articles have no user
 * dimension — contrast graph.ts's token/card neighborhoods, which do), so a
 * learner/agent switch only needs to update the displayed user; nothing
 * else on this panel depends on `currentUser`.
 */
function reloadForContext(newState: CompanionContextBarState): void {
  currentUser = newState.user.currentId ?? null;
}

function setCatalog(next: CatalogEntry[]): void {
  catalog = next;
  typeOrder = [...groupCatalog(catalog).keys()];
}

/**
 * Deterministic index into the 4 fixed categorical slots defined in
 * okf-panel.html (--okf-type-1..4, the dataviz skill's validated 8-hue
 * order's first 4 — the "all-pairs" safe subset for this scatter-like
 * graph/badge use). Assigned by first-seen order across the full catalog; a
 * 5th+ distinct `type` folds into the shared "other" slot rather than
 * cycling back through the ramp. Returns 0 for "other".
 */
function typeSlot(type: string): number {
  const idx = typeOrder.indexOf(type);
  return idx >= 0 && idx < 4 ? idx + 1 : 0;
}

function typeColorVar(type: string, suffix: "" | "-bg" = ""): string {
  const slot = typeSlot(type);
  return slot === 0
    ? `var(--okf-type-other${suffix})`
    : `var(--okf-type-${slot}${suffix})`;
}

/**
 * `resource` is contractually an http(s) URL per the OKF article frontmatter
 * schema (see src/cli/okf/bundle.ts's toCatalogEntry) — not markdown, so it
 * doesn't go through okf-render.ts's renderMarkdown/link-classification
 * pipeline. This is a narrower, allow-list-only counterpart to that
 * module's private `safeHref` (not exported, so not reusable here): refuse
 * anything that isn't literally `http://`/`https://` rather than trying to
 * block specific unsafe schemes.
 */
function safeExternalHref(url: string): string | null {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

async function loadCatalogFallback(): Promise<void> {
  try {
    const result = (await callTool("zam_okf_catalog", {
      bundle_dir: bundleDir ?? undefined,
      include_log: true,
    })) as {
      dir: string;
      articles: CatalogEntry[];
      problems: string[];
      log?: string;
    };
    bundleDir = result.dir;
    setCatalog(result.articles);
    logText = result.log ?? "";
    catalogLoaded = true;
    renderAll();
  } catch (error) {
    renderTopLevelError(errorMessage(error));
  }
}

function start(): void {
  if (started || !connected) return;
  started = true;
  if (catalogLoaded) {
    renderAll();
  } else {
    void loadCatalogFallback();
  }
}

// ── Render orchestration ────────────────────────────────────────────────

function renderAll(): void {
  renderHeader();
  updateViewToggleActiveState();
  renderSidebar();
  renderContent();
}

function renderHeader(): void {
  if (headerCountEl) headerCountEl.textContent = `${catalog.length} Artikel`;
  // See the module doc comment: no `zam_okf_*` tool currently returns a
  // distinct OKF-format `okf_version` (index.md's frontmatter field) —
  // every seeding path names this field `version` (the panel/app version,
  // same convention as every other zam_open_*/zam_show_* tool). Displaying
  // it here is the closest faithful match to the plan's "okf_version in the
  // header" until/unless a tool exposes the format version distinctly.
  if (headerVersionEl) headerVersionEl.textContent = panelVersion ? `v${panelVersion}` : "";
}

function updateViewToggleActiveState(): void {
  for (const btn of viewButtons()) {
    btn.classList.toggle("active", btn.dataset.view === viewMode);
  }
}

function viewButtons(): HTMLButtonElement[] {
  return viewToggleEl
    ? Array.from(viewToggleEl.querySelectorAll<HTMLButtonElement>(".okf-view-btn"))
    : [];
}

function renderEmptyInto(
  container: HTMLElement,
  emoji: string,
  title: string,
  sub: string,
): void {
  container.replaceChildren();
  const box = document.createElement("div");
  box.className = "zam-card okf-empty";
  const emojiEl = document.createElement("div");
  emojiEl.className = "okf-empty-emoji";
  emojiEl.textContent = emoji;
  const titleEl = document.createElement("div");
  titleEl.className = "okf-empty-title";
  titleEl.textContent = title;
  const subEl = document.createElement("div");
  subEl.className = "okf-empty-sub";
  subEl.textContent = sub;
  box.append(emojiEl, titleEl, subEl);
  container.appendChild(box);
}

function renderTopLevelError(message: string): void {
  catalogGroupsEl?.replaceChildren();
  if (contentEl) {
    renderEmptyInto(
      contentEl,
      "⚠️",
      "Wissensbasis konnte nicht geladen werden",
      message,
    );
  }
}

function renderSidebar(): void {
  if (!catalogGroupsEl) return;
  catalogGroupsEl.replaceChildren();
  const filtered = filterCatalog(catalog, searchQuery);
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "okf-catalog-empty";
    empty.textContent = searchQuery ? "Keine Treffer." : "Keine Artikel.";
    catalogGroupsEl.appendChild(empty);
    return;
  }
  for (const [type, entries] of groupCatalog(filtered)) {
    const groupEl = document.createElement("div");
    const titleEl = document.createElement("div");
    titleEl.className = "okf-catalog-group-title";
    const dot = document.createElement("span");
    dot.className = "okf-type-dot";
    dot.style.background = typeColorVar(type);
    const label = document.createElement("span");
    label.textContent = type || "(ohne Typ)";
    titleEl.append(dot, label);
    groupEl.appendChild(titleEl);
    for (const entry of entries) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "okf-catalog-item";
      if (viewMode === "reader" && !citationView && currentFile === entry.file) {
        item.classList.add("active");
      }
      item.textContent = entry.title;
      item.title = entry.description;
      item.addEventListener("click", () => {
        viewMode = "reader";
        void openArticle(entry.file);
      });
      groupEl.appendChild(item);
    }
    catalogGroupsEl.appendChild(groupEl);
  }
}

function renderContent(): void {
  if (!contentEl) return;
  if (viewMode === "graph") {
    void renderGraphView();
    return;
  }
  if (viewMode === "log") {
    renderLogView(contentEl);
    return;
  }
  renderReaderBody(contentEl);
}

// ── Reader ───────────────────────────────────────────────────────────────

async function openArticle(file: string): Promise<void> {
  currentFile = file;
  citationView = null;
  readErrors.delete(file);
  renderAll();
  if (!bodyCache.has(file)) {
    try {
      const result = (await callTool("zam_okf_read", {
        bundle_dir: bundleDir ?? undefined,
        file,
      })) as { markdown: string };
      bodyCache.set(file, result.markdown);
    } catch (error) {
      readErrors.set(file, errorMessage(error));
    }
  }
  renderAll();
}

function buildMetaStrip(entry: CatalogEntry | undefined): HTMLElement {
  const strip = document.createElement("div");
  strip.className = "okf-meta-strip";
  const type = entry?.type ?? "";
  if (type) {
    const badge = document.createElement("span");
    badge.className = "okf-type-badge";
    badge.style.background = typeColorVar(type, "-bg");
    badge.style.color = typeColorVar(type);
    badge.textContent = type;
    strip.appendChild(badge);
  }
  for (const tag of entry?.tags ?? []) {
    const tagEl = document.createElement("span");
    tagEl.className = "okf-tag";
    tagEl.textContent = tag;
    strip.appendChild(tagEl);
  }
  if (entry?.timestamp) {
    const ts = document.createElement("span");
    ts.textContent = entry.timestamp;
    strip.appendChild(ts);
  }
  if (entry?.resource) {
    const href = safeExternalHref(entry.resource);
    if (href) {
      const link = document.createElement("a");
      link.className = "okf-resource-link";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Quelle ↗";
      strip.appendChild(link);
    }
  }
  return strip;
}

function renderReaderBody(container: HTMLElement): void {
  if (citationView) {
    renderCitationFullView(container, citationView);
    return;
  }
  if (!currentFile) {
    renderEmptyInto(
      container,
      "📚",
      "Kein Artikel ausgewählt",
      "Wähle links einen Artikel aus der Wissensbasis.",
    );
    return;
  }
  const error = readErrors.get(currentFile);
  if (error) {
    renderEmptyInto(container, "⚠️", "Artikel konnte nicht geladen werden", error);
    return;
  }
  const body = bodyCache.get(currentFile);
  if (body === undefined) {
    renderEmptyInto(container, "⏳", "Lädt...", currentFile);
    return;
  }
  container.replaceChildren();
  container.appendChild(buildMetaStrip(catalog.find((e) => e.file === currentFile)));
  const bodyEl = document.createElement("div");
  bodyEl.className = "okf-article-body zam-card";
  bodyEl.innerHTML = renderMarkdown(body);
  attachContentClickDelegation(bodyEl);
  decorateCitationLinks(bodyEl, new Set());
  container.appendChild(bodyEl);
}

function renderCitationFullView(container: HTMLElement, view: CitationView): void {
  container.replaceChildren();
  const back = document.createElement("button");
  back.type = "button";
  back.className = "okf-citation-view-back";
  back.textContent = "← Zurück zum Artikel";
  back.addEventListener("click", () => {
    citationView = null;
    renderAll();
  });
  container.appendChild(back);

  const strip = document.createElement("div");
  strip.className = "okf-meta-strip";
  const badge = document.createElement("span");
  badge.className = "okf-type-badge";
  badge.style.background = "var(--accent)";
  badge.style.color = "#ffffff";
  badge.textContent = "ADR";
  const pathEl = document.createElement("span");
  pathEl.textContent = view.path;
  strip.append(badge, pathEl);
  container.appendChild(strip);

  const bodyEl = document.createElement("div");
  bodyEl.className = "okf-article-body zam-card";
  bodyEl.innerHTML = renderMarkdown(view.content);
  attachContentClickDelegation(bodyEl);
  decorateCitationLinks(bodyEl, new Set());
  container.appendChild(bodyEl);
}

/** Click delegation for the two link kinds okf-render.ts's renderMarkdown
 * classifies as in-panel (article/citation) rather than a plain href — see
 * classifyLink in okf-render.ts. External links carry a real href and need
 * no handler here. */
function attachContentClickDelegation(container: HTMLElement): void {
  container.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const articleLink = target.closest("[data-okf-article]");
    if (articleLink) {
      event.preventDefault();
      const file = articleLink.getAttribute("data-okf-article");
      if (file) {
        viewMode = "reader";
        void openArticle(file);
      }
      return;
    }
    const citationLink = target.closest("[data-okf-citation]");
    if (citationLink) {
      event.preventDefault();
      const citationTarget = citationLink.getAttribute("data-okf-citation");
      if (citationTarget) void toggleInlineCitation(citationTarget);
    }
  });
}

async function toggleInlineCitation(target: string): Promise<void> {
  if (openCitations.has(target)) {
    openCitations.delete(target);
    renderAll();
    return;
  }
  openCitations.set(target, { status: "loading" });
  renderAll();
  try {
    const result = (await callTool("zam_okf_read_citation", {
      bundle_dir: bundleDir ?? undefined,
      target,
    })) as { target: string; path: string; content: string };
    openCitations.set(target, {
      status: "ok",
      path: result.path,
      content: result.content,
    });
  } catch (error) {
    openCitations.set(target, { status: "error", error: errorMessage(error) });
  }
  renderAll();
}

/**
 * Insert an inline preview box after every currently-open citation link
 * inside `container` (state-driven, rebuilt on every render rather than
 * mutated in place, so it survives the innerHTML replace that draws the
 * surrounding article/log body). `ancestors` guards a pathological
 * self-/mutually-referential citation chain from recursing forever — each
 * level only expands a target it hasn't already expanded on the way down.
 */
function decorateCitationLinks(
  container: HTMLElement,
  ancestors: ReadonlySet<string>,
): void {
  for (const link of container.querySelectorAll("[data-okf-citation]")) {
    const target = link.getAttribute("data-okf-citation");
    if (!target || ancestors.has(target)) continue;
    const state = openCitations.get(target);
    if (!state) continue;
    link.insertAdjacentElement(
      "afterend",
      buildCitationBox(target, state, ancestors),
    );
  }
}

function buildCitationBox(
  target: string,
  state: CitationState,
  ancestors: ReadonlySet<string>,
): HTMLElement {
  const box = document.createElement("div");
  if (state.status === "loading") {
    box.className = "okf-citation-inline";
    box.textContent = "Lädt Zitat...";
    return box;
  }
  if (state.status === "error") {
    box.className = "okf-citation-error";
    box.textContent = `Zitat nicht erreichbar: ${state.error ?? target}`;
    return box;
  }

  box.className = "okf-citation-inline";
  const badge = document.createElement("span");
  badge.className = "okf-citation-badge";
  badge.textContent = "ADR";
  const pathEl = document.createElement("span");
  pathEl.textContent = state.path ?? target;
  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "okf-citation-open";
  openBtn.textContent = "Vollständig öffnen ↗";
  openBtn.addEventListener("click", (event) => {
    event.preventDefault();
    citationView = {
      target,
      path: state.path ?? target,
      content: state.content ?? "",
    };
    renderAll();
  });
  const contentBodyEl = document.createElement("div");
  contentBodyEl.className = "okf-article-body";
  contentBodyEl.innerHTML = renderMarkdown(state.content ?? "");
  attachContentClickDelegation(contentBodyEl);
  decorateCitationLinks(contentBodyEl, new Set([...ancestors, target]));
  box.append(badge, pathEl, openBtn, contentBodyEl);
  return box;
}

// ── Graph view ───────────────────────────────────────────────────────────

async function ensureAllBodiesLoaded(): Promise<void> {
  const missing = catalog.filter(
    (entry) => !bodyCache.has(entry.file) && !readErrors.has(entry.file),
  );
  await Promise.all(
    missing.map(async (entry) => {
      try {
        const result = (await callTool("zam_okf_read", {
          bundle_dir: bundleDir ?? undefined,
          file: entry.file,
        })) as { markdown: string };
        bodyCache.set(entry.file, result.markdown);
      } catch (error) {
        readErrors.set(entry.file, errorMessage(error));
      }
    }),
  );
}

function buildFullGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const byFile = new Map(catalog.map((e): [string, CatalogEntry] => [e.file, e]));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addNode = (node: GraphNode): void => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    nodes.push(node);
  };
  for (const entry of catalog) {
    addNode({ id: entry.file, kind: "article", type: entry.type, file: entry.file });
  }
  for (const entry of catalog) {
    const body = bodyCache.get(entry.file);
    if (body === undefined) continue;
    const { articles, citations } = extractLinks(body);
    for (const target of articles) {
      addNode({
        id: target,
        kind: "article",
        type: byFile.get(target)?.type,
        file: target,
      });
      edges.push({ from: entry.file, to: target });
    }
    for (const target of citations) {
      addNode({ id: target, kind: "citation", file: target });
      edges.push({ from: entry.file, to: target });
    }
  }
  return { nodes, edges };
}

function truncateLabel(text: string, max = 16): string {
  const base = text.replace(/\.md$/, "");
  return base.length > max ? `${base.slice(0, max - 1)}…` : base;
}

function buildGraphNodeEl(node: PositionedNode): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g") as SVGGElement;
  g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
  g.setAttribute("class", `okf-graph-node-${node.kind}`);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = node.file ?? node.id;
  g.appendChild(title);

  if (node.kind === "article") {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(-NODE_R));
    rect.setAttribute("y", String(-NODE_R * 0.6));
    rect.setAttribute("width", String(NODE_R * 2));
    rect.setAttribute("height", String(NODE_R * 1.2));
    rect.setAttribute("rx", "8");
    rect.style.fill = typeColorVar(node.type ?? "", "-bg");
    rect.style.stroke = typeColorVar(node.type ?? "");
    g.appendChild(rect);
    g.style.cursor = "pointer";
    g.addEventListener("click", () => {
      viewMode = "reader";
      void openArticle(node.file ?? node.id);
    });
  } else {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", String(NODE_R * 0.55));
    g.appendChild(circle);
  }

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("class", "okf-graph-node-label");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("dominant-baseline", "central");
  label.setAttribute("y", node.kind === "article" ? "0" : String(NODE_R * 0.55 + 11));
  label.textContent = truncateLabel(node.file ?? node.id);
  g.appendChild(label);

  return g;
}

async function renderGraphView(): Promise<void> {
  if (!contentEl) return;
  contentEl.replaceChildren();
  const loading = document.createElement("div");
  loading.className = "okf-empty";
  loading.textContent = "Lädt Graph...";
  contentEl.appendChild(loading);

  await ensureAllBodiesLoaded();
  if (viewMode !== "graph" || !contentEl) return; // user switched away while loading

  const { nodes, edges } = buildFullGraph();
  contentEl.replaceChildren();
  if (nodes.length === 0) {
    renderEmptyInto(
      contentEl,
      "🕸️",
      "Kein Graph verfügbar",
      "Diese Wissensbasis enthält noch keine Artikel.",
    );
    return;
  }

  const legend = document.createElement("div");
  legend.className = "okf-graph-legend";
  const articleLegend = document.createElement("span");
  articleLegend.className = "okf-graph-legend-item";
  articleLegend.innerHTML = '<span class="okf-graph-legend-mark article"></span>Artikel';
  const citationLegend = document.createElement("span");
  citationLegend.className = "okf-graph-legend-item";
  citationLegend.innerHTML =
    '<span class="okf-graph-legend-mark citation"></span>Zitat (ADR)';
  legend.append(articleLegend, citationLegend);
  contentEl.appendChild(legend);

  const positioned = layoutGraph(nodes, edges, GRAPH_W, GRAPH_H);
  const byId = new Map(positioned.map((n): [string, PositionedNode] => [n.id, n]));

  const wrap = document.createElement("div");
  wrap.className = "graph-canvas-wrap";
  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", `0 0 ${GRAPH_W} ${GRAPH_H}`);
  svg.setAttribute("class", "okf-graph-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "OKF Wissensgraph");
  wrap.appendChild(svg);

  const edgesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  svg.appendChild(edgesGroup);
  for (const edge of edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("class", "okf-graph-edge");
    line.setAttribute("aria-hidden", "true");
    edgesGroup.appendChild(line);
  }

  const nodesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  svg.appendChild(nodesGroup);
  for (const node of positioned) {
    nodesGroup.appendChild(buildGraphNodeEl(node));
  }

  contentEl.appendChild(wrap);
}

// ── Log view ─────────────────────────────────────────────────────────────

function renderLogView(container: HTMLElement): void {
  container.replaceChildren();
  if (!logText.trim()) {
    renderEmptyInto(
      container,
      "📜",
      "Kein Log vorhanden",
      "Für diese Wissensbasis wurde noch kein log.md geschrieben.",
    );
    return;
  }
  // log.md entries are appended newest-day-first, newest-entry-first within
  // a day (src/cli/okf/bundle.ts's appendLog) -- already the order the spec
  // wants, no re-sorting needed.
  const bodyEl = document.createElement("div");
  bodyEl.className = "okf-log-body zam-card";
  bodyEl.innerHTML = renderMarkdown(logText);
  attachContentClickDelegation(bodyEl);
  decorateCitationLinks(bodyEl, new Set());
  container.appendChild(bodyEl);
}

// ── Static event wiring ──────────────────────────────────────────────────

for (const btn of viewButtons()) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.view as ViewMode | undefined;
    if (!mode || mode === viewMode) return;
    viewMode = mode;
    renderAll();
  });
}
updateViewToggleActiveState();

searchInputEl?.addEventListener("input", () => {
  searchQuery = searchInputEl.value;
  renderSidebar();
});

// ── Host lifecycle (mirrors graph.ts) ───────────────────────────────────

app.ontoolresult = (params) => {
  const structured = (params.structuredContent ?? {}) as OpenOkfResult;
  panelVersion = structured.version;
  // Same late-tool-result race as graph.ts/recall.ts: the 800ms fallback
  // below may have already started against a previous bundle/user. The
  // tool result's context is authoritative -- restart when it names a
  // different bundle, since cached bodies/reader/citation state are scoped
  // to the previous one.
  const previousUser = currentUser;
  const previousBundleDir = bundleDir;
  currentUser = structured.user ?? null;
  if (structured.bundleDir !== undefined) bundleDir = structured.bundleDir;
  if (structured.catalog) {
    setCatalog(structured.catalog);
    catalogLoaded = true;
  }
  if (structured.log !== undefined) logText = structured.log;
  if (started && (previousUser !== currentUser || previousBundleDir !== bundleDir)) {
    started = false;
    bodyCache.clear();
    readErrors.clear();
    openCitations.clear();
    currentFile = null;
    citationView = null;
  }
  clearConnectionNotice();

  const contextState =
    structured.companionContext ?? fallbackContextBarState(SURFACE, currentUser);
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    "ZAM OKF",
    panelVersion,
    contextState,
    {
      write: writeCompanionContext,
      read: readCompanionContext,
      onReload: reloadForContext,
      onError: showConnectionNotice,
    },
  );
  start();
};

// Mount the bar immediately — before any tool result — so the title and an
// honest "no learner/agent resolved yet" state (fallbackContextBarState) are
// visible from first paint, not only once a host's ontoolresult (or the
// 800ms grace-period fallback below) actually fires.
contextBar = ensureContextBar(
  contextBar,
  contextBarRoot,
  "ZAM OKF",
  panelVersion,
  fallbackContextBarState(SURFACE, currentUser),
  {
    write: writeCompanionContext,
    read: readCompanionContext,
    onReload: reloadForContext,
    onError: showConnectionNotice,
  },
);

// A plain file viewer (e.g. an editor preview) renders this HTML without
// ever answering ui/initialize — connect() then stays pending forever.
// Degrade honestly instead of showing "Connecting to host…" for good.
const NO_HOST_NOTICE =
  "Kein MCP-Apps-Host — diese Karte braucht einen Host mit ui/initialize " +
  "(z. B. basic-host oder Copilot-Panel).";
const noHostTimer = setTimeout(() => showConnectionNotice(NO_HOST_NOTICE), 4000);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    if (navigator.language.startsWith("de")) {
      setCurrentLocale("de");
    }
    // ontoolresult (which carries the initial bundle/catalog/log and the
    // signed-in user) normally fires right after the handshake and triggers
    // the load. If a host never delivers it (today: always, until Task 5's
    // zam_okf_visualize exists), still load via zam_okf_catalog after a
    // short grace period instead of leaving the card stuck waiting.
    window.setTimeout(start, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(`ZAM OKF failed to start: ${errorMessage(error)}`);
  });
