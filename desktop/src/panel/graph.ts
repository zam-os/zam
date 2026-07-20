/**
 * ZAM 2D Knowledge-Graph card — MCP Apps panel entry.
 *
 * Renders the 1-hop neighborhood (prerequisites below, dependents above)
 * around a focus token as a plain SVG diagram — no Three.js, no libraries.
 * Clicking a neighbor re-centers the graph on it (click-to-recenter); a
 * breadcrumb of the last 5 focus titles enables going back.
 *
 * Standalone by design (tests/desktop/module-boundaries.test.ts): no Tauri,
 * no Three.js, no import from ./panel.ts or ./recall.ts. The `callTool`/
 * context-bar plumbing below is shared via ./context-bar.js (item 9, 0.11.0
 * review) rather than hand-copied, but this panel entry still bundles
 * independently — that module has no import of its own beyond the
 * already-shared `@modelcontextprotocol/ext-apps`.
 */

import { App } from "@modelcontextprotocol/ext-apps";
import { setCurrentLocale, t, tf } from "../i18n.js";
import {
  type CompanionContextBarState,
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
  type GraphNodeBounds,
  graphEdgeEndpoints,
  graphNodeTitle,
  wrapGraphLabel,
} from "./graph-layout.js";
import {
  buildDomainOptions,
  filterByDomain,
  pickDefaultFocus,
} from "./graph-scope.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const VIEW_W = 700;
const VIEW_H = 500;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = 260;
const PREREQ_RADIUS = 160;
const DEPENDENT_RADIUS = 145;
const NODE_HEIGHT = 38;
const NODE_MIN_WIDTH = 64;
const NODE_PAD_X = 14;
const NODE_PAD_Y = 8;
const LABEL_MAX_CHARS_PER_LINE = 20;
const LABEL_MAX_LINES = 3;
const LABEL_LINE_HEIGHT = 14;
const HISTORY_LIMIT = 5;

const contextBarRoot = document.getElementById("zam-contextbar-root");
const noticeEl = document.getElementById("zam-connection-notice");
const scopeEl = document.getElementById("graph-scope");
const breadcrumbEl = document.getElementById("graph-breadcrumb");
const contentEl = document.getElementById("graph-content");

const showConnectionNotice = (message: string): void =>
  showConnectionNoticeShared(noticeEl, message);
const clearConnectionNotice = (): void => clearConnectionNoticeShared(noticeEl);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let contextBar: ContextBarHandle | undefined;
let panelVersion: string | undefined;

interface OpenGraphResult {
  graph?: string;
  focus?: string | null;
  version?: string;
  user?: string | null;
  companionContext?: CompanionContextBarState;
  repoScope?: RepoScope;
}

/**
 * Tokens anchored in the current workspace's OKF bundle (source-link bases,
 * one per article) — computed server-side by zam_show_graph from MCP roots.
 */
interface RepoScope {
  label: string;
  bases: string[];
}

interface KnowledgeContextRef {
  name: string;
  label: string | null;
  language: string | null;
}

interface GraphCard {
  state: string;
  reps: number;
  stability: number;
  difficulty: number;
  blocked: boolean;
  dueAt: string;
  lastReviewAt: string | null;
}

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  display_title: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  knowledgeContexts: KnowledgeContextRef[];
  card: GraphCard | null;
}

interface Neighborhood {
  focus: string;
  center: GraphNode;
  prerequisites: GraphNode[];
  dependents: GraphNode[];
}

const app = new App({ name: "ZAM Graph", version: "0.1.0" });

let currentUser: string | null = null;
let connected = false;
let started = false;
let initialFocus: string | null = null;
/** Last up to HISTORY_LIMIT focuses, most-recent last (current focus). */
let history: Array<{ slug: string; title: string }> = [];

// ── Scope selectors (desktop-app style; ADR: default = current repo) ──────
let repoScope: RepoScope | null = null;
type ScopeKind = "repo" | "all";
let scopeKind: ScopeKind = "all";
let scopeDomain: string | null = null;
/** Tokens of the current scope (before the domain filter); null = not loaded. */
let scopeTokens: GraphNode[] | null = null;
/**
 * Bumped whenever the session restarts (late tool result with a different
 * user/focus/repoScope, or a context-bar change). In-flight navigations and
 * scope loads from an older generation discard their results instead of
 * landing in the restarted session — without this, the 800ms fallback
 * bootstrap races the real tool result and leaves a stale breadcrumb entry.
 */
let navGeneration = 0;

const SURFACE = "graph";

const callTool = createCallTool(app);
const writeCompanionContext = createContextWriter(callTool, SURFACE);
const readCompanionContext = createContextReader(callTool, SURFACE);

/**
 * A user/evaluator context change is a context boundary (ADR §Decision 4):
 * re-navigate to the current focus under the new context rather than
 * continue showing a neighborhood scoped to the previous learner. Scope
 * tokens carry the learner's card state, so they reload too.
 */
function reloadForContext(newState: CompanionContextBarState): void {
  currentUser = newState.user.currentId ?? null;
  scopeTokens = null;
  navGeneration++;
  const focus = history[history.length - 1]?.slug ?? initialFocus;
  if (focus) {
    void navigateTo(focus);
    void loadScope();
  } else {
    void bootstrapWithoutFocus();
  }
}

/** Sync a compact neighborhood snapshot into the host's model context. */
function pushContext(nb: Neighborhood): void {
  void app
    .updateModelContext({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            zamGraph: {
              focus: nb.focus,
              prerequisites: nb.prerequisites.length,
              dependents: nb.dependents.length,
            },
          }),
        },
      ],
    })
    .catch(() => {
      // Context sync is best-effort; a rejection must not break the card.
    });
}

function clearContent(): void {
  contentEl?.replaceChildren();
}

function renderMessage(emoji: string, title: string, sub: string): void {
  if (!contentEl) return;
  clearContent();
  const box = document.createElement("div");
  box.className = "zam-card graph-empty";
  const emojiEl = document.createElement("div");
  emojiEl.className = "graph-empty-emoji";
  emojiEl.textContent = emoji;
  const titleEl = document.createElement("div");
  titleEl.className = "graph-empty-title";
  titleEl.textContent = title;
  const subEl = document.createElement("div");
  subEl.className = "graph-empty-sub";
  subEl.textContent = sub;
  box.append(emojiEl, titleEl, subEl);
  contentEl.appendChild(box);
}

function renderNoFocus(): void {
  // t(), not tf(): the "{focus}" here is the tool-call syntax shown to the
  // user, not an interpolation slot.
  renderMessage("🧭", t("graph_no_focus_title"), t("graph_no_focus_sub"));
}

function renderError(message: string): void {
  renderMessage("⚠️", t("graph_load_failed"), message);
}

function renderEmptyScope(): void {
  renderMessage(
    "🌱",
    t("graph_scope_empty_title"),
    t("graph_scope_empty_sub"),
  );
}

// ── Scope selectors ────────────────────────────────────────────────────────

async function listScopeTokens(kind: ScopeKind): Promise<GraphNode[]> {
  const args: string[] = [];
  if (currentUser) args.push("--user", currentUser);
  if (kind === "repo" && repoScope) {
    for (const base of repoScope.bases) {
      args.push("--source-link-base", base);
    }
  }
  const data = (await callTool("zam_studio_bridge", {
    cmd: "list-tokens",
    args,
  })) as { tokens?: GraphNode[] };
  return data.tokens ?? [];
}

function scopedTokens(): GraphNode[] {
  return filterByDomain(scopeTokens ?? [], scopeDomain);
}

function scopePill(
  text: string,
  className: string,
  active: boolean,
  title: string,
  onClick: () => void,
): HTMLButtonElement {
  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = className + (active ? " active" : "");
  pill.textContent = text;
  pill.title = title;
  pill.addEventListener("click", onClick);
  return pill;
}

function renderScopeBar(): void {
  if (!scopeEl) return;
  scopeEl.replaceChildren();
  if (scopeTokens === null) return; // scope not loaded (yet)

  const scopeRow = document.createElement("div");
  scopeRow.className = "graph-scope-row";
  if (repoScope) {
    scopeRow.appendChild(
      scopePill(
        `📚 ${repoScope.label}`,
        "scope-pill",
        scopeKind === "repo",
        t("graph_scope_repo_pill_title"),
        () => void switchScope("repo"),
      ),
    );
  }
  scopeRow.appendChild(
    scopePill(
      t("graph_scope_all"),
      "scope-pill",
      scopeKind === "all",
      t("graph_scope_all_title"),
      () => void switchScope("all"),
    ),
  );
  const count = document.createElement("span");
  count.className = "graph-scope-count";
  const visible = scopedTokens();
  count.textContent = tf(
    visible.length === 1 ? "graph_token_count_one" : "graph_token_count_many",
    { count: visible.length },
  );
  scopeRow.appendChild(count);
  scopeEl.appendChild(scopeRow);

  const options = buildDomainOptions(scopeTokens);
  if (options.length > 1) {
    const domainRow = document.createElement("div");
    domainRow.className = "graph-scope-row graph-domain-row";
    domainRow.appendChild(
      scopePill(
        t("graph_domain_all"),
        "domain-pill",
        scopeDomain === null,
        t("graph_domain_all_title"),
        () => switchDomain(null),
      ),
    );
    for (const option of options) {
      domainRow.appendChild(
        scopePill(
          option.isGroup ? `${option.value} ⋯` : option.value,
          "domain-pill",
          scopeDomain === option.value,
          option.isGroup
            ? tf("graph_domain_group_title", { value: option.value })
            : tf("graph_domain_pill_title", { value: option.value }),
          () => switchDomain(option.value),
        ),
      );
    }
    scopeEl.appendChild(domainRow);
  }

  const currentSlug = history[history.length - 1]?.slug;
  const list = document.createElement("div");
  list.className = "graph-token-list";
  for (const token of visible) {
    list.appendChild(
      scopePill(
        graphNodeTitle(token),
        `token-pill${token.card ? "" : " token-pill-nocard"}`,
        token.slug === currentSlug,
        token.concept,
        () => void navigateTo(token.slug),
      ),
    );
  }
  if (visible.length === 0) {
    const empty = document.createElement("span");
    empty.className = "graph-scope-empty";
    empty.textContent = t("graph_scope_empty_list");
    list.appendChild(empty);
  }
  scopeEl.appendChild(list);
}

/** Load the current scope's tokens and render the bar. False on failure. */
async function loadScope(): Promise<boolean> {
  const generation = navGeneration;
  try {
    const tokens = await listScopeTokens(scopeKind);
    if (generation !== navGeneration) return false; // superseded meanwhile
    scopeTokens = tokens;
    renderScopeBar();
    return true;
  } catch {
    if (generation === navGeneration) scopeTokens = null;
    return false;
  }
}

function focusScopeDefault(): void {
  const pick = pickDefaultFocus(scopedTokens());
  if (pick) {
    void navigateTo(pick.slug);
  } else {
    renderEmptyScope();
  }
}

async function switchScope(kind: ScopeKind): Promise<void> {
  scopeKind = kind;
  scopeDomain = null;
  if (await loadScope()) focusScopeDefault();
}

function switchDomain(domain: string | null): void {
  scopeDomain = domain;
  renderScopeBar();
  focusScopeDefault();
}

/**
 * No focus supplied: instead of a dead "Kein Fokus" hint, load the default
 * scope — the current repo's OKF-anchored tokens when the workspace has a
 * bundle with imported tokens, else all tokens — and open on its foundation
 * (lowest Bloom level, preferring tokens the learner has a card for).
 */
async function bootstrapWithoutFocus(): Promise<void> {
  scopeKind = repoScope ? "repo" : "all";
  scopeDomain = null;
  if (!(await loadScope())) {
    renderNoFocus(); // data channel unavailable: keep the old hint
    return;
  }
  if (scopeKind === "repo" && (scopeTokens?.length ?? 0) === 0) {
    scopeKind = "all";
    if (!(await loadScope())) {
      renderNoFocus();
      return;
    }
  }
  focusScopeDefault();
}

function bloomStep(level: number): number {
  return Math.min(5, Math.max(1, Math.round(level) || 1));
}

/**
 * getBBox() only returns real dimensions once the <text> is attached to a
 * rendered SVG document — callers must append it first. The character-width
 * fallback guards hosts where getBBox throws or returns zero before layout.
 */
function measureTextWidth(
  text: SVGTextElement,
  lines: readonly string[],
): number {
  try {
    const box = text.getBBox();
    if (box.width > 0) return box.width;
  } catch {
    // Fall through to the estimate below.
  }
  return Math.max(...lines.map((line) => line.length)) * 6.4;
}

type NodeKind = "center" | "prereq" | "dependent";

function createNode(
  container: SVGGElement,
  node: GraphNode,
  x: number,
  y: number,
  kind: NodeKind,
  onSelect: (slug: string) => void,
): GraphNodeBounds {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("transform", `translate(${x}, ${y})`);
  g.setAttribute(
    "class",
    `graph-node graph-node-${kind}${node.card ? "" : " graph-node-nocard"}`,
  );

  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = node.concept;
  g.appendChild(title);

  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("class", "graph-node-label");
  const labelLines = wrapGraphLabel(
    graphNodeTitle(node),
    LABEL_MAX_CHARS_PER_LINE,
    LABEL_MAX_LINES,
  );
  labelLines.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", "0");
    tspan.setAttribute(
      "dy",
      String(
        index === 0
          ? -((labelLines.length - 1) * LABEL_LINE_HEIGHT) / 2
          : LABEL_LINE_HEIGHT,
      ),
    );
    tspan.textContent = line;
    text.appendChild(tspan);
  });
  g.appendChild(text);

  // Attach before measuring (see measureTextWidth doc comment).
  container.appendChild(g);
  const textWidth = measureTextWidth(text, labelLines);

  const width = Math.max(NODE_MIN_WIDTH, textWidth + NODE_PAD_X * 2);
  const contentHeight = labelLines.length * LABEL_LINE_HEIGHT + NODE_PAD_Y * 2;
  const height =
    Math.max(NODE_HEIGHT, contentHeight) * (kind === "center" ? 1.15 : 1);
  const step = bloomStep(node.bloomLevel);

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", String(-width / 2));
  rect.setAttribute("y", String(-height / 2));
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
  rect.setAttribute("rx", "10");
  rect.setAttribute("ry", "10");
  rect.setAttribute("class", "graph-node-rect");
  rect.style.fill = `var(--bloom-${step}-bg)`;
  rect.style.stroke = `var(--bloom-${step})`;
  g.insertBefore(rect, text);

  if (node.card?.blocked) {
    const badge = document.createElementNS(SVG_NS, "circle");
    badge.setAttribute("cx", String(width / 2 - 5));
    badge.setAttribute("cy", String(-height / 2 + 5));
    badge.setAttribute("r", "6.5");
    badge.setAttribute("class", "graph-node-blocked-badge");
    g.appendChild(badge);
    const mark = document.createElementNS(SVG_NS, "text");
    mark.setAttribute("x", String(width / 2 - 5));
    mark.setAttribute("y", String(-height / 2 + 5));
    mark.setAttribute("text-anchor", "middle");
    mark.setAttribute("dominant-baseline", "central");
    mark.setAttribute("class", "graph-node-blocked-mark");
    mark.textContent = "!";
    g.appendChild(mark);
  }

  // The center is already in focus — recentering on itself is a no-op, so
  // (unlike the sidebar pills in the 3D graph) only neighbors are clickable.
  if (kind !== "center") {
    g.style.cursor = "pointer";
    g.addEventListener("click", () => onSelect(node.slug));
  }

  return { x, y, width, height };
}

/** Evenly fan `count` nodes across an arc above (-1) or below (+1) center. */
function arcPosition(
  index: number,
  count: number,
  radius: number,
  direction: 1 | -1,
): { x: number; y: number } {
  if (count <= 1) {
    return { x: CENTER_X, y: CENTER_Y + direction * radius };
  }
  const spreadDeg = Math.min(170, 60 + count * 14);
  const spread = (spreadDeg * Math.PI) / 180;
  const theta = -spread / 2 + (spread / (count - 1)) * index;
  return {
    x: CENTER_X + radius * Math.sin(theta),
    y: CENTER_Y + direction * radius * Math.cos(theta),
  };
}

function renderGraph(nb: Neighborhood, onSelect: (slug: string) => void): void {
  if (!contentEl) return;
  clearContent();

  const wrap = document.createElement("div");
  wrap.className = "graph-canvas-wrap";
  contentEl.appendChild(wrap);

  const svg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
  svg.setAttribute("class", "graph-svg");
  svg.setAttribute("role", "img");
  const label = graphNodeTitle(nb.center);
  svg.setAttribute("aria-label", tf("graph_aria_centered", { label }));
  wrap.appendChild(svg);

  const edgesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  edgesGroup.setAttribute("class", "graph-edges");
  svg.appendChild(edgesGroup);

  const nodesGroup = document.createElementNS(SVG_NS, "g") as SVGGElement;
  nodesGroup.setAttribute("class", "graph-nodes");
  svg.appendChild(nodesGroup);

  const prereqPositions = nb.prerequisites.map((_, i) =>
    arcPosition(i, nb.prerequisites.length, PREREQ_RADIUS, 1),
  );
  const depPositions = nb.dependents.map((_, i) =>
    arcPosition(i, nb.dependents.length, DEPENDENT_RADIUS, -1),
  );

  const prerequisiteNodes = nb.prerequisites.map((node, i) => {
    const { x, y } = prereqPositions[i];
    return createNode(nodesGroup, node, x, y, "prereq", onSelect);
  });
  const dependentNodes = nb.dependents.map((node, i) => {
    const { x, y } = depPositions[i];
    return createNode(nodesGroup, node, x, y, "dependent", onSelect);
  });
  const centerNode = createNode(
    nodesGroup,
    nb.center,
    CENTER_X,
    CENTER_Y,
    "center",
    onSelect,
  );

  function drawEdge(target: GraphNodeBounds, colorVar: string): void {
    const { start, end } = graphEdgeEndpoints(centerNode, target);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(start.x));
    line.setAttribute("y1", String(start.y));
    line.setAttribute("x2", String(end.x));
    line.setAttribute("y2", String(end.y));
    line.setAttribute("class", "graph-edge");
    line.setAttribute("aria-hidden", "true");
    line.style.stroke = colorVar;
    edgesGroup.appendChild(line);
  }

  prerequisiteNodes.forEach((node) => {
    drawEdge(node, "var(--prereq)");
  });
  dependentNodes.forEach((node) => {
    drawEdge(node, "var(--dependent)");
  });
}

function renderBreadcrumb(onSelect: (slug: string) => void): void {
  if (!breadcrumbEl) return;
  breadcrumbEl.replaceChildren();
  if (history.length <= 1) return; // nothing to go back to yet
  history.forEach((entry, i) => {
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "graph-crumb-sep";
      sep.textContent = "›";
      breadcrumbEl.appendChild(sep);
    }
    if (i === history.length - 1) {
      const current = document.createElement("span");
      current.className = "graph-crumb-current";
      current.textContent = entry.title;
      breadcrumbEl.appendChild(current);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "graph-crumb-link";
      btn.textContent = entry.title;
      btn.addEventListener("click", () => onSelect(entry.slug));
      breadcrumbEl.appendChild(btn);
    }
  });
}

function pushHistory(slug: string, title: string): void {
  if (history[history.length - 1]?.slug === slug) {
    history[history.length - 1] = { slug, title };
    return;
  }
  history = [...history, { slug, title }].slice(-HISTORY_LIMIT);
}

async function navigateTo(slug: string): Promise<void> {
  const generation = navGeneration;
  try {
    const args = ["--focus", slug];
    if (currentUser) args.push("--user", currentUser);
    const data = (await callTool("zam_studio_bridge", {
      cmd: "get-neighborhood",
      args,
    })) as Neighborhood;
    if (generation !== navGeneration) return; // session restarted meanwhile
    pushHistory(data.focus, graphNodeTitle(data.center));
    renderBreadcrumb((s) => void navigateTo(s));
    renderGraph(data, (s) => void navigateTo(s));
    renderScopeBar(); // refresh the token list's current-focus highlight
    pushContext(data);
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  }
}

function start(): void {
  if (started || !connected) return;
  started = true;
  if (initialFocus) {
    void navigateTo(initialFocus);
    // The selector bar is a browsing enhancement here — load it in the
    // background and ignore failures; the focused graph already renders.
    scopeKind = repoScope ? "repo" : "all";
    void loadScope();
  } else {
    void bootstrapWithoutFocus();
  }
}

app.ontoolresult = (params) => {
  const structured = (params.structuredContent ?? {}) as OpenGraphResult;
  panelVersion = structured.version;
  // Same late-tool-result race as recall.ts: the 800ms fallback below may
  // have started against the previous user/focus. The tool result's context
  // is authoritative — restart the session when it names a different one.
  const previousUser = currentUser;
  const previousFocus = initialFocus;
  const previousRepoLabel = repoScope?.label ?? null;
  currentUser = structured.user ?? null;
  initialFocus = structured.focus ?? null;
  repoScope = structured.repoScope ?? null;
  if (
    started &&
    (previousUser !== currentUser ||
      previousFocus !== initialFocus ||
      (repoScope?.label ?? null) !== previousRepoLabel)
  ) {
    started = false;
    history = [];
    scopeTokens = null;
    navGeneration++;
  }
  clearConnectionNotice();

  const contextState =
    structured.companionContext ??
    fallbackContextBarState(SURFACE, currentUser);
  contextBar = ensureContextBar(
    contextBar,
    contextBarRoot,
    "ZAM Graph",
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
// visible from first paint (review finding 6), not only once a host's
// ontoolresult (or the 800ms grace-period fallback below) actually fires.
contextBar = ensureContextBar(
  contextBar,
  contextBarRoot,
  "ZAM Graph",
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
const noHostTimer = setTimeout(
  () => showConnectionNotice(NO_HOST_NOTICE),
  4000,
);

app
  .connect()
  .then(() => {
    clearTimeout(noHostTimer);
    connected = true;
    if (navigator.language.startsWith("de")) {
      setCurrentLocale("de");
    }
    // ontoolresult (which carries the initial focus + signed-in user)
    // normally fires right after the handshake and triggers the load. If a
    // host never delivers it, still show the empty state after a short grace
    // period instead of leaving the card stuck waiting.
    window.setTimeout(start, 800);
  })
  .catch((error: unknown) => {
    clearTimeout(noHostTimer);
    showConnectionNotice(`ZAM Graph failed to start: ${errorMessage(error)}`);
  });
