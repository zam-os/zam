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
 * `SURFACE` is `"okf"`, a real `CompanionSurface` member (context-bar.ts)
 * and `COMPANION_SURFACES` entry (src/vscode-extension/companion-context.ts)
 * since Task 5, which also registers `zam_okf_visualize` — the tool
 * `app.ontoolresult` below is written against, seeding the panel with the
 * bundle catalog/log and a real `companionContext` shaped with
 * `surface: "okf"` on first paint. The 800ms fallback to `zam_okf_catalog`
 * still runs for hosts that never deliver a tool result to the app (e.g. a
 * plain resource viewer).
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
  stripFrontmatter,
} from "./okf-render.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const GRAPH_W = 960;
const GRAPH_H = 620;
const NODE_R = 22;

const SURFACE: CompanionSurface = "okf";

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
  /** The OKF bundle-format version (index.md's `okf_version` frontmatter),
   * not the zam app/package version — see `zam_okf_visualize`'s `okfVersion`
   * field (src/cli/commands/mcp.ts). `null` when the bundle failed to load
   * or index.md has no `okf_version`. */
  okfVersion?: string | null;
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
/** Bundle-format version shown in the `#okf-version` header element —
 * distinct from `panelVersion` (the zam app/package version, still shown in
 * the context-bar title). Null/unset until a tool result with `okfVersion`
 * arrives; the 800ms zam_okf_catalog fallback never sets it, since that tool
 * doesn't return it. */
let bundleOkfVersion: string | null = null;
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
  // #okf-version shows the OKF BUNDLE's format version (index.md's
  // `okf_version`), not the zam app/package version — that's still shown
  // separately in the context-bar title (see ensureContextBar/panelVersion).
  // Unknown (bundle failed to load, no `okf_version` field, or the 800ms
  // zam_okf_catalog fallback ran because no host ever fired ontoolresult)
  // degrades to hiding the element rather than falling back to the app
  // version, which would mislabel it.
  if (headerVersionEl) {
    if (bundleOkfVersion) {
      headerVersionEl.hidden = false;
      headerVersionEl.textContent = `OKF v${bundleOkfVersion}`;
    } else {
      headerVersionEl.hidden = true;
      headerVersionEl.textContent = "";
    }
  }
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
  if (catalogLoaded && catalog.length === 0) {
    renderBundleSelector(contentEl);
    return;
  }
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

// ── Bundle folder selector ────────────────────────────────────────────────

/**
 * Re-target the panel at a different bundle directory via
 * `zam_okf_catalog` (the tool the 800ms fallback already uses), resetting
 * all per-bundle state. Returns an error message, or null on success.
 */
async function retargetBundle(dir: string): Promise<string | null> {
  try {
    const result = (await callTool("zam_okf_catalog", {
      bundle_dir: dir,
      include_log: true,
    })) as {
      dir: string;
      articles: CatalogEntry[];
      problems: string[];
      log?: string;
    };
    bundleDir = result.dir;
    // The catalog tool does not report the bundle's okf_version -- hide the
    // stale one rather than showing the previous bundle's.
    bundleOkfVersion = null;
    setCatalog(result.articles);
    logText = result.log ?? "";
    catalogLoaded = true;
    bodyCache.clear();
    readErrors.clear();
    openCitations.clear();
    currentFile = null;
    citationView = null;
    return null;
  } catch (error) {
    return errorMessage(error);
  }
}

/**
 * Shown when the resolved bundle has no articles -- typically because the
 * server's cwd default (`docs/okf`) does not point at the workspace the
 * user means. A sandboxed webview cannot open a native folder picker for a
 * filesystem *path*, so this is a path input with inline validation via
 * the same MCP tool that loads the catalog.
 */
function renderBundleSelector(container: HTMLElement): void {
  container.replaceChildren();
  const box = document.createElement("div");
  box.className = "zam-card okf-empty";

  const icon = document.createElement("div");
  icon.className = "okf-empty-emoji";
  icon.textContent = "📂";
  const title = document.createElement("div");
  title.className = "okf-empty-title";
  title.textContent = "Wissensbasis nicht gefunden";
  const sub = document.createElement("div");
  sub.className = "okf-empty-sub";
  sub.textContent = bundleDir
    ? `Unter "${bundleDir}" liegen keine Artikel. Gib den Pfad zum docs/okf-Ordner eines Repos an:`
    : "Gib den Pfad zum docs/okf-Ordner eines Repos an:";

  const form = document.createElement("div");
  form.className = "okf-bundle-selector";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "okf-bundle-input";
  input.placeholder = "C:\\pfad\\zum\\repo\\docs\\okf";
  input.value = bundleDir ?? "";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "okf-bundle-open";
  open.textContent = "Öffnen";
  const errorEl = document.createElement("div");
  errorEl.className = "okf-bundle-error";

  const submit = async (): Promise<void> => {
    const dir = input.value.trim();
    if (!dir) return;
    open.disabled = true;
    errorEl.textContent = "";
    const error = await retargetBundle(dir);
    open.disabled = false;
    if (error) {
      errorEl.textContent = error;
      return;
    }
    if (catalog.length === 0) {
      errorEl.textContent =
        "Der Ordner ist ein gültiges Bundle, enthält aber keine Artikel.";
      return;
    }
    renderAll();
  };
  open.addEventListener("click", () => void submit());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void submit();
  });

  form.append(input, open);
  box.append(icon, title, sub, form, errorEl);
  container.appendChild(box);
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
    // Frontmatter timestamps may carry a T00:00:00Z time part -- the strip
    // shows the date only.
    ts.textContent = entry.timestamp.slice(0, 10);
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

/**
 * The agent-facing decomposition request (ADR 2026-07-18 Decision 5). The
 * jump from knowledge to learning goes THROUGH the conversation: the agent
 * must understand the article before anything is recorded — the panel
 * never calls zam_okf_import itself.
 */
function importInstruction(file: string): string {
  const dir = bundleDir ? ` (bundle: ${bundleDir})` : "";
  return (
    `Import the OKF article "${file}"${dir} as learning content: read the ` +
    "full article with zam_okf_read, extract the concepts I must be able " +
    "to produce from memory (look-up facts stay in the article), judge a " +
    "Bloom level and a domain per concept, arrange them in prerequisite " +
    "order, check for existing tokens with zam_find_tokens, then record " +
    "your decomposition with zam_okf_import."
  );
}

function buildImportAction(file: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "okf-import-action";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "okf-import-btn";
  btn.textContent = "Als Lerninhalt importieren";
  const hint = document.createElement("div");
  hint.className = "okf-import-hint";

  btn.addEventListener("click", () => {
    void (async () => {
      btn.disabled = true;
      hint.replaceChildren();
      try {
        const result = await app.sendMessage({
          role: "user",
          content: [{ type: "text", text: importInstruction(file) }],
        });
        if (result.isError) {
          throw new Error("host rejected the message");
        }
        hint.textContent =
          "An den Agenten übergeben — die Zerlegung läuft im Chat.";
      } catch {
        // Hosts without a conversation surface (e.g. the Companion
        // sidebar) reject sendMessage: show the instruction to hand to
        // the agent manually instead.
        const note = document.createElement("div");
        note.textContent =
          "Dieser Host hat keinen Chat — gib deinem Agenten diese Anweisung:";
        const copyable = document.createElement("textarea");
        copyable.readOnly = true;
        copyable.className = "okf-import-fallback";
        copyable.value = importInstruction(file);
        copyable.addEventListener("focus", () => copyable.select());
        hint.append(note, copyable);
      } finally {
        btn.disabled = false;
      }
    })();
  });

  wrap.append(btn, hint);
  return wrap;
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
  container.appendChild(buildImportAction(currentFile));
  const bodyEl = document.createElement("div");
  bodyEl.className = "okf-article-body zam-card";
  // The meta strip above renders the frontmatter; rendering the raw fence
  // too showed it as one garbled paragraph at the top of every article.
  bodyEl.innerHTML = renderMarkdown(stripFrontmatter(body));
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
  bodyEl.innerHTML = renderMarkdown(stripFrontmatter(view.content));
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
  contentBodyEl.innerHTML = renderMarkdown(stripFrontmatter(state.content ?? ""));
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
    addNode({
      id: entry.file,
      kind: "article",
      type: entry.type,
      file: entry.file,
      label: entry.title,
    });
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
        label: byFile.get(target)?.title,
      });
      edges.push({ from: entry.file, to: target });
    }
    for (const target of citations) {
      addNode({
        id: target,
        kind: "citation",
        file: target,
        label: citationLabel(target),
      });
      edges.push({ from: entry.file, to: target });
    }
  }
  return { nodes, edges };
}

/**
 * A citation target like "../adr/2026-07-17b-okf-visualizer-panel.md" used
 * to label as a clipped "../adr/2026-07-…" -- six of those are
 * indistinguishable. The basename's tail is the distinctive part (dated ADR
 * file names share their prefix), so keep the tail.
 */
function citationLabel(target: string): string {
  return target.split("/").pop()?.replace(/\.md$/, "") ?? target;
}

function truncateLabel(text: string, keep: "head" | "tail", max = 26): string {
  const base = text.replace(/\.md$/, "");
  if (base.length <= max) return base;
  return keep === "head"
    ? `${base.slice(0, max - 1)}…`
    : `…${base.slice(-(max - 1))}`;
}

function buildGraphNodeEl(node: PositionedNode): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g") as SVGGElement;
  g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
  g.setAttribute("class", `okf-graph-node-${node.kind}`);
  g.setAttribute("data-node-id", node.id);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = node.file ?? node.id;
  g.appendChild(title);

  const labelText =
    node.kind === "article"
      ? truncateLabel(node.label ?? node.file ?? node.id, "head")
      : truncateLabel(node.label ?? node.file ?? node.id, "tail");

  if (node.kind === "article") {
    // Pill sized to its label (11px font ≈ 6.2px/char) so titles sit inside
    // the shape instead of overflowing a fixed-width box.
    const pillW = Math.min(Math.max(labelText.length * 6.2 + 20, 64), 200);
    const pillH = 26;
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(-pillW / 2));
    rect.setAttribute("y", String(-pillH / 2));
    rect.setAttribute("width", String(pillW));
    rect.setAttribute("height", String(pillH));
    rect.setAttribute("rx", String(pillH / 2));
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
    circle.setAttribute("r", String(NODE_R * 0.45));
    g.appendChild(circle);
  }

  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("class", "okf-graph-node-label");
  label.setAttribute("dominant-baseline", "central");
  if (node.kind === "article") {
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("y", "0");
  } else {
    // Citations sit on the outer ring: grow their labels inward (toward the
    // center) so text never runs past the viewBox edge.
    const onRightHalf = node.x > GRAPH_W / 2;
    label.setAttribute("text-anchor", onRightHalf ? "end" : "start");
    label.setAttribute("x", onRightHalf ? "-14" : "14");
    label.setAttribute("y", "0");
  }
  label.textContent = labelText;
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
    // Quadratic curve with the control point pulled toward the canvas
    // center: edges bow gently inward instead of slicing straight across.
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const ctrlX = midX + (GRAPH_W / 2 - midX) * 0.22;
    const ctrlY = midY + (GRAPH_H / 2 - midY) * 0.22;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`,
    );
    path.setAttribute("class", "okf-graph-edge");
    path.setAttribute("data-from", edge.from);
    path.setAttribute("data-to", edge.to);
    path.setAttribute("aria-hidden", "true");
    edgesGroup.appendChild(path);
  }

  const nodesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  svg.appendChild(nodesGroup);

  // Hovering a node lights up its edges and neighbors and dims the rest;
  // hover-out restores the neutral state.
  const emphasize = (id: string | null): void => {
    const neighbors = new Set<string>();
    for (const el of Array.from(edgesGroup.children)) {
      const from = el.getAttribute("data-from");
      const to = el.getAttribute("data-to");
      const hot = id !== null && (from === id || to === id);
      el.setAttribute(
        "class",
        `okf-graph-edge${hot ? " okf-edge-hot" : id !== null ? " okf-edge-dim" : ""}`,
      );
      if (hot) {
        if (from) neighbors.add(from);
        if (to) neighbors.add(to);
      }
    }
    for (const el of Array.from(nodesGroup.children)) {
      const nodeId = el.getAttribute("data-node-id");
      const dim =
        id !== null && nodeId !== id && !neighbors.has(nodeId ?? "");
      el.classList.toggle("okf-node-dim", dim);
    }
  };
  for (const node of positioned) {
    const el = buildGraphNodeEl(node);
    el.addEventListener("mouseenter", () => emphasize(node.id));
    el.addEventListener("mouseleave", () => emphasize(null));
    nodesGroup.appendChild(el);
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
  if (structured.okfVersion !== undefined) bundleOkfVersion = structured.okfVersion;
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
