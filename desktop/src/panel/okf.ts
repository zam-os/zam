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
import { setCurrentLocale, t, tf } from "../i18n.js";
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
import { wrapGraphLabel } from "./graph-layout.js";
import {
  type CatalogEntry,
  type FocusRing,
  type GraphEdge,
  type GraphNode,
  type NodeBox,
  type PositionedNode,
  LABEL_LINE_HEIGHT,
  PILL_HEIGHT,
  articlePillSize,
  edgeAnchor,
  extractLinks,
  filterCatalog,
  groupCatalog,
  layoutFocusGraph,
  layoutGraph,
  neighborIdsOf,
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
/** Graph view: the node the focused layout centers on; null = overview mode.
 * Set by right-clicking a node, cleared by right-clicking it again, the
 * canvas background, the toolbar's exit button, or Escape. */
let graphFocusId: string | null = null;
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
  if (headerCountEl) {
    headerCountEl.textContent = tf(
      catalog.length === 1 ? "okf_article_count_one" : "okf_article_count_many",
      { count: catalog.length },
    );
  }
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
    renderEmptyInto(contentEl, "⚠️", t("okf_load_failed_title"), message);
  }
}

function renderSidebar(): void {
  if (!catalogGroupsEl) return;
  catalogGroupsEl.replaceChildren();
  const filtered = filterCatalog(catalog, searchQuery);
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "okf-catalog-empty";
    empty.textContent = searchQuery ? t("okf_no_matches") : t("okf_no_articles");
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
    label.textContent = type || t("okf_untyped_group");
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
    graphFocusId = null;
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
  title.textContent = t("okf_bundle_not_found_title");
  const sub = document.createElement("div");
  sub.className = "okf-empty-sub";
  sub.textContent = bundleDir
    ? tf("okf_bundle_empty_at_dir", { dir: bundleDir })
    : t("okf_bundle_prompt");

  const form = document.createElement("div");
  form.className = "okf-bundle-selector";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "okf-bundle-input";
  input.placeholder = t("okf_bundle_path_placeholder");
  input.value = bundleDir ?? "";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "okf-bundle-open";
  open.textContent = t("okf_bundle_open");
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
      errorEl.textContent = t("okf_bundle_valid_but_empty");
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
  // Record the focused article machine-locally (zam_okf_focus) so a chat
  // agent can resolve "import this okf" without the panel needing a
  // conversation surface. Fire-and-forget: hosts that do not allow the
  // tool, or a failed write, must never break the reader.
  void callTool("zam_okf_focus", {
    file,
    ...(bundleDir ? { bundle_dir: bundleDir } : {}),
  }).catch(() => {});
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
      link.textContent = t("okf_resource_link");
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

/**
 * Copy the fallback instruction to the clipboard. Webviews differ in what
 * they allow: try the async clipboard API first, fall back to the
 * selection-based path (`document.execCommand("copy")`) — deprecated but
 * still the reliable route in webviews without clipboard-write permission.
 * The button itself reports success/failure so the user never guesses.
 */
async function copyInstruction(
  copyable: HTMLTextAreaElement,
  button: HTMLButtonElement,
): Promise<void> {
  let copied = false;
  try {
    await navigator.clipboard.writeText(copyable.value);
    copied = true;
  } catch {
    copyable.focus();
    copyable.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
  }
  const original = t("okf_copy");
  button.textContent = copied ? t("okf_copied") : t("okf_copy_failed");
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 2000);
}

function buildImportAction(file: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "okf-import-action";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "okf-import-btn";
  btn.textContent = t("okf_import_button");
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
        hint.textContent = t("okf_import_handed_off");
      } catch {
        // Hosts without a conversation surface (e.g. the Companion
        // sidebar) reject sendMessage: show the instruction to hand to
        // the agent manually instead.
        const note = document.createElement("div");
        note.textContent = t("okf_import_no_chat");
        const copyable = document.createElement("textarea");
        copyable.readOnly = true;
        copyable.className = "okf-import-fallback";
        copyable.value = importInstruction(file);
        copyable.addEventListener("focus", () => copyable.select());
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "okf-import-copy-btn";
        copyBtn.textContent = t("okf_copy");
        copyBtn.addEventListener("click", () => {
          void copyInstruction(copyable, copyBtn);
        });
        const noteRow = document.createElement("div");
        noteRow.className = "okf-import-fallback-row";
        noteRow.append(note, copyBtn);
        hint.append(noteRow, copyable);
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
      t("okf_reader_empty_title"),
      t("okf_reader_empty_sub"),
    );
    return;
  }
  const error = readErrors.get(currentFile);
  if (error) {
    renderEmptyInto(container, "⚠️", t("okf_article_load_failed"), error);
    return;
  }
  const body = bodyCache.get(currentFile);
  if (body === undefined) {
    renderEmptyInto(container, "⏳", t("okf_loading"), currentFile);
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
  back.textContent = t("okf_back_to_article");
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
    box.textContent = t("okf_citation_loading");
    return box;
  }
  if (state.status === "error") {
    box.className = "okf-citation-error";
    box.textContent = tf("okf_citation_unavailable", {
      message: state.error ?? target,
    });
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
  openBtn.textContent = t("okf_citation_open_full");
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

/**
 * A node as the SVG builder wants it: overview nodes carry `ring: null`
 * (uniform prominence), focused-mode nodes carry the band layoutFocusGraph
 * assigned them.
 */
type RenderNode = PositionedNode & { ring: FocusRing | null };

/** Node scale per prominence band — 1 is the overview's uniform size. */
const RING_SCALE: Record<FocusRing, number> = {
  focus: 1.3,
  neighbor: 1.12,
  background: 0.72,
};

/**
 * Label room per prominence band. The centered node may wrap onto a second
 * line and run widest — it is the one title meant to be read in full. Its
 * neighbors wrap too, but on a tighter line so they stay visibly smaller
 * than the center. Everything else keeps a single line: the rim must not
 * compete for reading attention, and the overview stays as it was.
 */
const LABEL_BUDGET: Record<FocusRing, { maxChars: number; maxWidth: number }> =
  {
    focus: { maxChars: 22, maxWidth: 280 },
    neighbor: { maxChars: 18, maxWidth: 210 },
    background: { maxChars: 16, maxWidth: 200 },
  };
const WRAPPED_RINGS = new Set<FocusRing>(["focus", "neighbor"]);

function ringScale(node: RenderNode): number {
  return node.ring ? RING_SCALE[node.ring] : 1;
}

function nodeLabelLines(node: RenderNode): string[] {
  const raw = node.label ?? node.file ?? node.id;
  if (node.ring && WRAPPED_RINGS.has(node.ring)) {
    // wrapGraphLabel is the 2D graph panel's pure label helper: it balances
    // the two lines and ellipsizes whatever still does not fit.
    return wrapGraphLabel(
      raw.replace(/\.md$/, ""),
      LABEL_BUDGET[node.ring].maxChars,
      2,
    );
  }
  const max = node.ring ? LABEL_BUDGET[node.ring].maxChars : undefined;
  return [
    node.kind === "article"
      ? truncateLabel(raw, "head", max)
      : truncateLabel(raw, "tail", max),
  ];
}

/** Label lines plus the footprint they need, in unscaled canvas units. */
function nodeShape(node: RenderNode): {
  lines: string[];
  width: number;
  height: number;
} {
  const lines = nodeLabelLines(node);
  if (node.kind !== "article") {
    // Citation labels sit beside the glyph, so only the glyph is a footprint.
    return { lines, width: NODE_R * 0.9, height: NODE_R * 0.9 };
  }
  const maxWidth = node.ring ? LABEL_BUDGET[node.ring].maxWidth : 200;
  return { lines, ...articlePillSize(lines, maxWidth) };
}

/**
 * The node's drawn footprint in canvas coordinates (ring scale applied), so
 * edges can be clipped to it — see okf-render.ts's edgeAnchor.
 */
function nodeBox(node: RenderNode): NodeBox {
  const scale = ringScale(node);
  const shape = nodeShape(node);
  return {
    x: node.x,
    y: node.y,
    width: shape.width * scale,
    height: shape.height * scale,
  };
}

function buildGraphNodeEl(node: RenderNode): SVGGElement {
  const scale = ringScale(node);
  const g = document.createElementNS(SVG_NS, "g") as SVGGElement;
  g.setAttribute(
    "transform",
    `translate(${node.x}, ${node.y})${scale === 1 ? "" : ` scale(${scale})`}`,
  );
  g.setAttribute(
    "class",
    `okf-graph-node-${node.kind}${node.ring ? ` okf-ring-${node.ring}` : ""}`,
  );
  g.setAttribute("data-node-id", node.id);

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = node.file ?? node.id;
  g.appendChild(title);

  const { lines, width: pillW, height: pillH } = nodeShape(node);

  if (node.kind === "article") {
    const pill = (): SVGRectElement => {
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", String(-pillW / 2));
      rect.setAttribute("y", String(-pillH / 2));
      rect.setAttribute("width", String(pillW));
      rect.setAttribute("height", String(pillH));
      // Stadium ends for a one-line pill; a wrapped one keeps the same
      // corner radius instead of turning into a lozenge.
      rect.setAttribute("rx", String(Math.min(PILL_HEIGHT / 2, pillH / 2)));
      return rect;
    };
    // The type tint is translucent, so an unrelated edge passing behind the
    // pill would show through it. An opaque backing plate in the panel's
    // surface color keeps every pill reading as a solid object.
    const backing = pill();
    backing.setAttribute("class", "okf-graph-pill-backing");
    g.appendChild(backing);
    const rect = pill();
    rect.style.fill = typeColorVar(node.type ?? "", "-bg");
    rect.style.stroke = typeColorVar(node.type ?? "");
    g.appendChild(rect);
    g.style.cursor = "pointer";
    g.addEventListener("click", (event) => {
      // macOS fires a click alongside ctrl+click's contextmenu — that
      // gesture means "center this node", not "open the article".
      if (event.ctrlKey) return;
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
  // Wrapped labels are centered on the node: the first line starts half a
  // block above the middle, each following line steps down one line height.
  const firstLineY = (-(lines.length - 1) * LABEL_LINE_HEIGHT) / 2;
  let labelX = "0";
  if (node.kind === "article") {
    label.setAttribute("text-anchor", "middle");
  } else {
    // Citation labels grow away from the crowded side of their ring: on an
    // outer ring inward (so text never runs past the viewBox edge), on the
    // focused mode's inner neighbor ring outward — growing inward there
    // would lay every neighbor's label across the centered node and its
    // edges. The offset is in the node's own (possibly scaled) coordinates,
    // hence divided by the scale.
    const onRightHalf = node.x > GRAPH_W / 2;
    const outward = node.ring === "neighbor";
    const toTheRight = outward ? onRightHalf : !onRightHalf;
    const gap = 14 / scale;
    label.setAttribute("text-anchor", toTheRight ? "start" : "end");
    labelX = String(toTheRight ? gap : -gap);
  }
  label.setAttribute("x", labelX);
  label.setAttribute("y", String(firstLineY));
  for (const [index, line] of lines.entries()) {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", labelX);
    if (index > 0) tspan.setAttribute("dy", String(LABEL_LINE_HEIGHT));
    tspan.textContent = line;
    label.appendChild(tspan);
  }
  g.appendChild(label);

  return g;
}

/**
 * Enter (or leave, with `null`) the focused layout and repaint. Bodies are
 * already cached by the time a node exists to right-click, so this repaints
 * synchronously — no loading flash between modes.
 */
function setGraphFocus(id: string | null): void {
  if (graphFocusId === id) return;
  graphFocusId = id;
  if (viewMode === "graph" && contentEl) paintGraphInto(contentEl);
}

/** Prominence band of an edge in the focused layout, mirroring RenderNode's. */
function edgeRing(
  edge: GraphEdge,
  focusId: string | null,
  neighbors: Set<string>,
): FocusRing | null {
  if (focusId === null) return null;
  if (edge.from === focusId || edge.to === focusId) return "focus";
  if (neighbors.has(edge.from) || neighbors.has(edge.to)) return "neighbor";
  return "background";
}

function buildGraphToolbar(focused: GraphNode | undefined): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "okf-graph-legend";

  const legendItem = (markClass: string, label: string): HTMLElement => {
    const item = document.createElement("span");
    item.className = "okf-graph-legend-item";
    const mark = document.createElement("span");
    mark.className = `okf-graph-legend-mark ${markClass}`;
    item.append(mark, label);
    return item;
  };
  bar.append(
    legendItem("article", t("okf_legend_article")),
    legendItem("citation", t("okf_legend_citation")),
  );

  if (focused) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "okf-graph-focus-exit";
    back.textContent = t("okf_graph_focus_exit");
    back.addEventListener("click", () => setGraphFocus(null));
    const label = document.createElement("span");
    label.className = "okf-graph-focus-label";
    label.textContent = tf("okf_graph_focus_on", {
      title: focused.label ?? focused.file ?? focused.id,
    });
    bar.append(back, label);
  }

  const hint = document.createElement("span");
  hint.className = "okf-graph-hint";
  hint.textContent = focused
    ? t("okf_graph_hint_focused")
    : t("okf_graph_hint_overview");
  bar.appendChild(hint);
  return bar;
}

/**
 * Paint the graph from already-loaded bodies, in whichever of the two modes
 * is active: the overview (every node on the type-clustered rings) or the
 * focused layout centered on `graphFocusId`. Both modes share node building,
 * edge drawing and hover emphasis; only positions, prominence bands and the
 * toolbar differ.
 */
function paintGraphInto(container: HTMLElement): void {
  const { nodes, edges } = buildFullGraph();
  container.replaceChildren();
  if (nodes.length === 0) {
    graphFocusId = null;
    renderEmptyInto(
      container,
      "🕸️",
      t("okf_graph_empty_title"),
      t("okf_graph_empty_sub"),
    );
    return;
  }

  // A focus id can outlive its node (the bundle was re-targeted while the
  // graph was focused) — fall back to the overview rather than centering on
  // something that is no longer there.
  const focusId =
    graphFocusId !== null && nodes.some((n) => n.id === graphFocusId)
      ? graphFocusId
      : null;
  graphFocusId = focusId;
  const focusNeighbors =
    focusId === null ? new Set<string>() : neighborIdsOf(edges, focusId);

  const positioned: RenderNode[] =
    focusId === null
      ? layoutGraph(nodes, edges, GRAPH_W, GRAPH_H).map((node) => ({
          ...node,
          ring: null,
        }))
      : layoutFocusGraph(nodes, edges, focusId, GRAPH_W, GRAPH_H);
  const byId = new Map(positioned.map((n): [string, RenderNode] => [n.id, n]));
  const boxes = new Map(
    positioned.map((n): [string, NodeBox] => [n.id, nodeBox(n)]),
  );

  container.appendChild(
    buildGraphToolbar(focusId === null ? undefined : byId.get(focusId)),
  );

  const wrap = document.createElement("div");
  wrap.className = "graph-canvas-wrap";
  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", `0 0 ${GRAPH_W} ${GRAPH_H}`);
  svg.setAttribute("class", "okf-graph-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    focusId === null
      ? t("okf_graph_aria")
      : tf("okf_graph_aria_focused", {
          title: byId.get(focusId)?.label ?? focusId,
        }),
  );
  // Right-clicking empty canvas leaves the focused mode; without this the
  // host's own context menu would open over the graph instead.
  svg.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    setGraphFocus(null);
  });
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
    const ctrl = {
      x: midX + (GRAPH_W / 2 - midX) * 0.22,
      y: midY + (GRAPH_H / 2 - midY) * 0.22,
    };
    // Meet the shapes at their borders, along the curve's own direction —
    // an edge must never run across a node box.
    const start = edgeAnchor(boxes.get(edge.from) ?? nodeBox(from), ctrl);
    const end = edgeAnchor(boxes.get(edge.to) ?? nodeBox(to), ctrl);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
    );
    const ring = edgeRing(edge, focusId, focusNeighbors);
    const baseClass = `okf-graph-edge${ring ? ` okf-edge-ring-${ring}` : ""}`;
    path.setAttribute("class", baseClass);
    path.dataset.baseClass = baseClass;
    path.setAttribute("data-from", edge.from);
    path.setAttribute("data-to", edge.to);
    path.setAttribute("aria-hidden", "true");
    edgesGroup.appendChild(path);
  }

  const nodesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  svg.appendChild(nodesGroup);

  // Hovering a node lights up its edges and neighbors and dims the rest;
  // hover-out restores the neutral state. Both modes keep this — in the
  // focused layout it is how the receded rim stays explorable.
  const emphasize = (id: string | null): void => {
    const neighbors = new Set<string>();
    for (const el of Array.from(edgesGroup.children) as SVGPathElement[]) {
      const from = el.getAttribute("data-from");
      const to = el.getAttribute("data-to");
      const hot = id !== null && (from === id || to === id);
      el.setAttribute(
        "class",
        `${el.dataset.baseClass ?? "okf-graph-edge"}${
          hot ? " okf-edge-hot" : id !== null ? " okf-edge-dim" : ""
        }`,
      );
      if (hot) {
        if (from) neighbors.add(from);
        if (to) neighbors.add(to);
      }
    }
    for (const el of Array.from(nodesGroup.children)) {
      const nodeId = el.getAttribute("data-node-id");
      const dim = id !== null && nodeId !== id && !neighbors.has(nodeId ?? "");
      el.classList.toggle("okf-node-dim", dim);
    }
  };
  for (const node of positioned) {
    const el = buildGraphNodeEl(node);
    el.addEventListener("mouseenter", () => emphasize(node.id));
    el.addEventListener("mouseleave", () => emphasize(null));
    // Right-click centers this node (and re-centers from within the focused
    // mode); right-clicking the centered node again returns to the overview.
    el.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setGraphFocus(focusId === node.id ? null : node.id);
    });
    nodesGroup.appendChild(el);
  }

  container.appendChild(wrap);
}

async function renderGraphView(): Promise<void> {
  if (!contentEl) return;
  const pending = catalog.some(
    (entry) => !bodyCache.has(entry.file) && !readErrors.has(entry.file),
  );
  if (pending) {
    contentEl.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "okf-empty";
    loading.textContent = t("okf_graph_loading");
    contentEl.appendChild(loading);

    await ensureAllBodiesLoaded();
    if (viewMode !== "graph" || !contentEl) return; // user switched away while loading
  }

  paintGraphInto(contentEl);
}

// ── Log view ─────────────────────────────────────────────────────────────

function renderLogView(container: HTMLElement): void {
  container.replaceChildren();
  if (!logText.trim()) {
    renderEmptyInto(
      container,
      "📜",
      t("okf_log_empty_title"),
      t("okf_log_empty_sub"),
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

const VIEW_LABEL_KEYS: Record<ViewMode, string> = {
  reader: "okf_view_reader",
  graph: "okf_view_graph",
  log: "okf_view_log",
};

/**
 * Localize the chrome that lives statically in okf-panel.html (view-toggle
 * labels, search placeholder). Called once at module load (English default)
 * and again after connect() resolves the locale, since that markup is never
 * re-rendered by renderAll().
 */
function applyStaticLocale(): void {
  for (const btn of viewButtons()) {
    const mode = btn.dataset.view as ViewMode | undefined;
    if (mode) btn.textContent = t(VIEW_LABEL_KEYS[mode]);
  }
  if (searchInputEl) searchInputEl.placeholder = t("okf_search_placeholder");
}

for (const btn of viewButtons()) {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.view as ViewMode | undefined;
    if (!mode || mode === viewMode) return;
    viewMode = mode;
    renderAll();
  });
}
updateViewToggleActiveState();
applyStaticLocale();

searchInputEl?.addEventListener("input", () => {
  searchQuery = searchInputEl.value;
  renderSidebar();
});

// Keyboard counterpart to right-clicking the canvas: leave the focused
// graph. Registered once for the panel's lifetime (the graph is repainted,
// never re-listened), and a no-op outside the focused graph.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || viewMode !== "graph" || graphFocusId === null)
    return;
  event.preventDefault();
  setGraphFocus(null);
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
    graphFocusId = null;
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
      applyStaticLocale();
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
