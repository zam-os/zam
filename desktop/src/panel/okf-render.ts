/**
 * Pure, DOM-free rendering core for the OKF visualizer panel (Task 3,
 * docs/plans/2026-07-17-okf-visualizer-panel-plan.md). No `document`/
 * `window` at module scope, so it is importable under Vitest without a DOM
 * -- mirrors the split in graph-layout.ts (pure geometry/formatting driven
 * by the untestable, DOM-touching panel entry, here `okf.ts` in Task 4).
 *
 * `CatalogEntry` below mirrors `CatalogEntry` in src/cli/okf/bundle.ts
 * structurally (that module is this component's source of truth) rather
 * than importing it, so this panel keeps bundling independently of
 * src/cli -- same pattern context-bar.ts uses for the companion-context
 * wire shapes. Keep the two definitions in sync by hand if bundle.ts
 * changes.
 */

export interface CatalogEntry {
  file: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  resource?: string;
  timestamp?: string;
}

/** Mirrors the read-only `zam_okf_audit` wire shape. */
export type OkfFreshnessStatus = "current" | "review-recommended" | "unknown";

export interface OkfCodeReferenceFreshness {
  path: string;
  status: OkfFreshnessStatus;
  reason?: string;
}

export interface OkfArticleFreshness {
  file: string;
  status: OkfFreshnessStatus;
  codeReferences: OkfCodeReferenceFreshness[];
  reason?: string;
}

export interface OkfFreshnessAudit {
  articles: OkfArticleFreshness[];
}

/** Index an audit snapshot once so sidebar and reader lookups stay cheap. */
export function indexFreshnessByFile(
  audit: OkfFreshnessAudit | null | undefined,
): Map<string, OkfArticleFreshness> {
  return new Map(
    (audit?.articles ?? []).map((article) => [article.file, article]),
  );
}

/** Code paths that make an article's freshness badge actionable. */
export function reviewRecommendedPaths(
  article: OkfArticleFreshness | undefined,
): string[] {
  return (
    article?.codeReferences
      .filter((reference) => reference.status === "review-recommended")
      .map((reference) => reference.path) ?? []
  );
}

export interface GraphNode {
  id: string;
  kind: "article" | "citation";
  /** Catalog `type`, for articles; unused for citation nodes. */
  type?: string;
  /** Sort/identity key -- catalog file for articles, link target for citations. */
  file?: string;
  /** Display label -- catalog title for articles, basename for citations. */
  label?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

/**
 * Prominence band in the focused graph layout: the centered node, its direct
 * neighbors (one hop, either direction), everything else.
 */
export type FocusRing = "focus" | "neighbor" | "background";

export interface FocusPositionedNode extends PositionedNode {
  ring: FocusRing;
}

// -- HTML escaping ---------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// -- Link classification (shared by renderMarkdown and extractLinks) ------

type LinkKind = "article" | "citation" | "external" | "other";

const BARE_KEBAB_MD_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

function classifyLink(target: string): LinkKind {
  const trimmed = target.trim();
  if (/^https?:\/\//i.test(trimmed)) return "external";
  if (BARE_KEBAB_MD_RE.test(trimmed)) return "article";
  if (trimmed.endsWith(".md")) return "citation";
  return "other";
}

// -- Link href safety ---------------------------------------------------------

// Browsers strip ASCII control characters from a URL before parsing its
// scheme (e.g. "java\tscript:" parses as "javascript:"), so scheme
// detection below must run on a control-char-stripped, trimmed copy, or a
// hostile scheme can hide behind an embedded control character.
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally matches raw control chars 0x00-0x1F -- stripping a scheme's disguise is the point
const CONTROL_CHARS_RE = /[\x00-\x1F]/g;
const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;
const SAFE_HREF_SCHEMES = new Set(["http", "https", "mailto"]);
// Two or more leading slash/backslash characters, in any combination, form
// an authority-relative target ("//host/x", "\\host\x", "/\host"): browsers
// resolve these to a *different* origin (and normalize backslashes to
// forward slashes for http/https, so mixed forms are just as live), even
// though there is no scheme token for the check above to catch.
const AUTHORITY_RELATIVE_RE = /^[/\\]{2,}/;

/**
 * Decide whether `target` may be used as a navigating anchor `href`.
 * Returns the sanitized href to use, or `null` if the target must render
 * inert instead (visible label, no executing/navigating href) -- any
 * scheme outside the allowlist, e.g. `javascript:`, `data:`, `vbscript:`,
 * `file:`; or an authority-relative target (see `AUTHORITY_RELATIVE_RE`).
 * A scheme-less, non-authority-relative target (relative path, `#fragment`)
 * is always safe, since it stays on the current origin.
 */
function safeHref(target: string): string | null {
  const cleaned = target.replace(CONTROL_CHARS_RE, "").trim();
  const scheme = SCHEME_RE.exec(cleaned)?.[1].toLowerCase();
  if (scheme && !SAFE_HREF_SCHEMES.has(scheme)) return null;
  if (AUTHORITY_RELATIVE_RE.test(cleaned)) return null;
  return cleaned;
}

// -- Frontmatter ------------------------------------------------------------

/**
 * Drop a leading OKF frontmatter fence (`---` ... `---`) from an article
 * source before markdown rendering. The reader shows that metadata as its
 * meta strip (type badge, tags, timestamp, resource link) -- rendering the
 * raw fence too produced one garbled paragraph above every article. An
 * unterminated fence is not frontmatter; the source is returned unchanged.
 */
export function stripFrontmatter(source: string): string {
  // CRLF sources (Windows checkouts) are normalized by the split + join, so
  // downstream renderMarkdown gets LF regardless of the checkout; a UTF-8
  // BOM (Windows editors) would defeat the fence check, so drop it too.
  const lines = source.replace(/^﻿/, "").split(/\r\n|\n/);
  if (lines[0]?.trim() !== "---") return source;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return lines.slice(i + 1).join("\n");
  }
  return source;
}

// -- Markdown rendering -----------------------------------------------------

function renderLink(label: string, target: string): string {
  const kind = classifyLink(target);
  if (kind === "external") {
    return `<a href="${target}" data-okf-external="${target}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
  if (kind === "article") {
    return `<a href="#" data-okf-article="${target}">${label}</a>`;
  }
  if (kind === "citation") {
    return `<a href="#" data-okf-citation="${target}">${label}</a>`;
  }
  const href = safeHref(target);
  if (href === null) {
    return `<span>${label}</span>`;
  }
  return `<a href="${href}">${label}</a>`;
}

const LINK_RE = /^\[([^\]]*)\]\(([^)]+)\)/;

/**
 * Gather one list's items starting at `start`, where each item may continue
 * over subsequent indented lines (standard markdown hanging indent). Without
 * this, a wrapped list item's continuation line fell out of the list as a
 * bare paragraph, splitting the sentence in the reader (0.13.0 live
 * finding).
 */
function collectListItems(
  lines: string[],
  start: number,
  markerRe: RegExp,
): { texts: string[]; nextIndex: number } {
  const texts: string[] = [];
  let i = start;
  while (i < lines.length && markerRe.test(lines[i])) {
    let item = lines[i].replace(markerRe, "");
    i++;
    while (
      i < lines.length &&
      /^\s+\S/.test(lines[i]) &&
      !markerRe.test(lines[i])
    ) {
      item += ` ${lines[i].trim()}`;
      i++;
    }
    texts.push(item);
  }
  return { texts, nextIndex: i };
}

/**
 * Render inline constructs (code, links, bold, italic) within one line of
 * already-HTML-escaped text via a single left-to-right scan. A scan (rather
 * than sequential global regex replacements) means a matched code span or
 * link is copied straight to the output and never revisited by the bold/
 * italic handling that follows it, with no placeholder/sentinel text needed
 * to protect it in the meantime.
 */
function renderInline(text: string): string {
  let out = "";
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        out += `<code>${text.slice(i + 1, end)}</code>`;
        i = end + 1;
        continue;
      }
    }

    if (ch === "[") {
      const linkMatch = LINK_RE.exec(text.slice(i));
      if (linkMatch) {
        out += renderLink(linkMatch[1], linkMatch[2].trim());
        i += linkMatch[0].length;
        continue;
      }
    }

    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const marker = text.slice(i, i + 2);
      const end = text.indexOf(marker, i + 2);
      if (end !== -1) {
        out += `<strong>${text.slice(i + 2, end)}</strong>`;
        i = end + 2;
        continue;
      }
    }

    if (ch === "*" || ch === "_") {
      const end = text.indexOf(ch, i + 1);
      if (end !== -1 && end > i + 1) {
        out += `<em>${text.slice(i + 1, end)}</em>`;
        i = end + 1;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  // Split on unescaped pipes only (a `\|` inside a cell is a literal pipe,
  // not a column separator), then unescape it back to `|` in each cell.
  return trimmed
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function isTableSeparator(line: string): boolean {
  return /^[\s|:-]+$/.test(line) && line.includes("-");
}

function renderTable(header: string[], rows: string[][]): string {
  const head = `<thead><tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return `<table>${head}${body}</table>`;
}

// The source is escaped before block detection runs, so a leading literal
// ">" (the blockquote marker) has already become the 4-char entity "&gt;"
// -- match that escaped form, not a literal ">".
const BLOCKQUOTE_RE = /^&gt;\s?/;

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    BLOCKQUOTE_RE.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^```/.test(line.trim()) ||
    line.includes("|")
  );
}

/**
 * Render OKF article markdown to HTML. Escapes the *entire* raw source
 * first, then builds markup on top of the escaped text -- so any literal
 * HTML (a `<script>` tag, an `onerror` attribute inside inline code, etc.)
 * in the source is inert entities by the time any tag is emitted and can
 * never survive as live markup.
 *
 * Supports: headings (1-6), paragraphs, bold/italic, inline code, fenced
 * code blocks, ordered/unordered lists, tables, blockquotes, and links
 * classified per the panel's link contract (see classifyLink above).
 */
export function renderMarkdown(source: string): string {
  // Split on CRLF too: a trailing \r would defeat the $-anchored heading,
  // fence, and list patterns below on Windows-checkout content.
  const lines = escapeHtml(source).split(/\r\n|\n/);
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fenceMatch = /^```(\w*)\s*$/.exec(line.trim());
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "```") {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence (or end of input)
      const normalizedLang = lang.toLowerCase();
      const classAttr = normalizedLang
        ? ` class="language-${normalizedLang}"`
        : "";
      if (normalizedLang === "mermaid") {
        blocks.push(
          `<pre class="okf-mermaid-source" data-okf-mermaid><code${classAttr}>${codeLines.join("\n")}</code></pre>`,
        );
        continue;
      }
      blocks.push(
        `<pre><code${classAttr}>${codeLines.join("\n")}</code></pre>`,
      );
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i])) {
        quoteLines.push(lines[i].replace(BLOCKQUOTE_RE, ""));
        i++;
      }
      blocks.push(
        `<blockquote>${renderInline(quoteLines.join(" "))}</blockquote>`,
      );
      continue;
    }

    // Thematic break -- must run before the list/paragraph fallbacks so a
    // bare `---` never renders as literal dashes in a paragraph.
    if (/^([-_*])\1{2,}$/.test(line.trim())) {
      blocks.push("<hr>");
      i++;
      continue;
    }

    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        lines[i].includes("|")
      ) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push(renderTable(header, rows));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = collectListItems(lines, i, /^[-*]\s+/);
      i = items.nextIndex;
      blocks.push(
        `<ul>${items.texts.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = collectListItems(lines, i, /^\d+\.\s+/);
      i = items.nextIndex;
      blocks.push(
        `<ol>${items.texts.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`,
      );
      continue;
    }

    // Paragraph fallback. Always consume at least this line -- a line can
    // trip `isBlockStart` (e.g. a stray "|") without any dedicated branch
    // above having claimed it, and gathering zero lines would spin forever.
    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !isBlockStart(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(`<p>${renderInline(paraLines.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

// -- Catalog grouping/filtering ---------------------------------------------

/** Group by frontmatter `type`, preserving first-seen type order and each group's catalog order. */
export function groupCatalog(
  catalog: CatalogEntry[],
): Map<string, CatalogEntry[]> {
  const groups = new Map<string, CatalogEntry[]>();
  for (const entry of catalog) {
    const existing = groups.get(entry.type);
    if (existing) existing.push(entry);
    else groups.set(entry.type, [entry]);
  }
  return groups;
}

/** Case-insensitive match against title, description, tags, or file name. */
export function filterCatalog(
  catalog: CatalogEntry[],
  query: string,
): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.file.toLowerCase().includes(q) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

// -- Link extraction (for the graph view) ------------------------------------

function stripFencedCodeBlocks(text: string): string {
  const out: string[] = [];
  let inFence = false;
  for (const line of text.split(/\r\n|\n/)) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) out.push(line);
  }
  return out.join("\n");
}

/**
 * Extract markdown link targets from an article body for the graph view.
 * Links inside fenced code blocks are ignored (a code example that happens
 * to contain `[text](target.md)` must not create a graph edge).
 */
export function extractLinks(body: string): {
  articles: string[];
  citations: string[];
} {
  const scanned = stripFencedCodeBlocks(body);
  const articles: string[] = [];
  const citations: string[] = [];
  const seenArticles = new Set<string>();
  const seenCitations = new Set<string>();

  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of scanned.matchAll(linkRe)) {
    // This scans raw (unescaped) source, while renderMarkdown's link
    // rendering scans escaped source -- classification is identical either
    // way because escaped characters (&<>"') never appear in a
    // classifyLink pattern, and the panel (Task 4) reads the rendered
    // attribute back via the DOM, which entity-decodes on parse, so a
    // value written from either copy round-trips to the same string.
    const target = match[1].trim();
    const kind = classifyLink(target);
    if (kind === "article" && !seenArticles.has(target)) {
      seenArticles.add(target);
      articles.push(target);
    } else if (kind === "citation" && !seenCitations.has(target)) {
      seenCitations.add(target);
      citations.push(target);
    }
  }
  return { articles, citations };
}

// -- Graph layout -------------------------------------------------------------

/** Inner (article) ring size relative to the outer (citation) ring. */
const ARTICLE_RING_FRACTION = 0.55;
/** Horizontal margin kept free for node labels, as a fraction of width. */
const MARGIN_X_FRACTION = 0.13;
/** Vertical margin kept free for node labels, as a fraction of height. */
const MARGIN_Y_FRACTION = 0.09;
/** Minimum angular gap between citation nodes (radians) so labels stay apart. */
const MIN_CITATION_SEPARATION = 0.34;

function sortKey(node: GraphNode): string {
  return node.file ?? node.id;
}

function sortArticles(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => {
    const byType = (a.type ?? "").localeCompare(b.type ?? "");
    return byType !== 0 ? byType : sortKey(a).localeCompare(sortKey(b));
  });
}

interface AngularSlot {
  node: GraphNode;
  angle: number;
}

/**
 * Order slots by angle and push them apart to at least `minSeparation`, so
 * nodes placed at a *desired* angle (next to what they relate to) still keep
 * their labels readable. If the separation pass fans the ring past a full
 * turn, proximity is hopeless anyway -- fall back to an even spread instead
 * of overlapping the first nodes.
 *
 * Returns fresh slot objects; neither the array nor its items are mutated.
 */
function spreadAngles(
  slots: AngularSlot[],
  minSeparation: number,
): AngularSlot[] {
  const ordered = slots
    .map((slot) => ({ ...slot }))
    .sort(
      (a, b) =>
        a.angle - b.angle || sortKey(a.node).localeCompare(sortKey(b.node)),
    );
  for (let i = 1; i < ordered.length; i++) {
    const minAngle = ordered[i - 1].angle + minSeparation;
    if (ordered[i].angle < minAngle) ordered[i].angle = minAngle;
  }
  if (
    ordered.length > 1 &&
    ordered[ordered.length - 1].angle - ordered[0].angle >
      2 * Math.PI - minSeparation
  ) {
    for (let i = 0; i < ordered.length; i++) {
      ordered[i].angle = (2 * Math.PI * i) / ordered.length - Math.PI / 2;
    }
  }
  return ordered;
}

/**
 * Deterministic two-ring ellipse layout. Articles sit on an inner ellipse
 * ordered by (type, file) -- same-type articles are angular neighbors, so
 * types read as clusters. Each citation sits on an outer ellipse at the
 * circular mean of the angles of the articles that cite it (with a minimum
 * angular separation between citations), so citation nodes appear next to
 * their citers instead of at an alphabetical slot across the canvas --
 * markedly fewer edge crossings. Ellipses (not circles) use a wide canvas
 * fully, and the margins reserve space so labels never clip at the viewBox.
 *
 * Pure function of its inputs -- no randomness, no input mutation -- so
 * identical input always yields identical coordinates.
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
): PositionedNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const rxOuter = width / 2 - width * MARGIN_X_FRACTION;
  const ryOuter = height / 2 - height * MARGIN_Y_FRACTION;
  const rxInner = rxOuter * ARTICLE_RING_FRACTION;
  const ryInner = ryOuter * ARTICLE_RING_FRACTION;

  const articles = sortArticles(nodes.filter((n) => n.kind === "article"));
  const citations = [...nodes.filter((n) => n.kind === "citation")];

  const articleAngle = new Map<string, number>();
  const positionedArticles = articles.map((node, index) => {
    const angle = (2 * Math.PI * index) / articles.length - Math.PI / 2;
    articleAngle.set(node.id, angle);
    return {
      ...node,
      x: centerX + rxInner * Math.cos(angle),
      y: centerY + ryInner * Math.sin(angle),
    };
  });

  const desired = spreadAngles(
    citations.map((node, index) => {
      const citerAngles = edges
        .filter((edge) => edge.to === node.id)
        .map((edge) => articleAngle.get(edge.from))
        .filter((angle): angle is number => angle !== undefined);
      if (citerAngles.length === 0) {
        // Unreachable from buildFullGraph (citation nodes exist because an
        // article links them), but a hand-built graph stays well-defined.
        return {
          node,
          angle: (2 * Math.PI * index) / citations.length - Math.PI / 2,
        };
      }
      const sumSin = citerAngles.reduce((sum, a) => sum + Math.sin(a), 0);
      const sumCos = citerAngles.reduce((sum, a) => sum + Math.cos(a), 0);
      return { node, angle: Math.atan2(sumSin, sumCos) };
    }),
    MIN_CITATION_SEPARATION,
  );

  const positionedCitations = desired.map(({ node, angle }) => ({
    ...node,
    x: centerX + rxOuter * Math.cos(angle),
    y: centerY + ryOuter * Math.sin(angle),
  }));

  return [...positionedArticles, ...positionedCitations];
}

// -- Edge geometry ------------------------------------------------------------

/** A node's drawn footprint on the canvas, centered on (x, y). */
export interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Where an edge should meet a node: the point at which the ray from the
 * node's center toward `toward` leaves the node's box, pushed out by `gap`.
 * Edges drawn between two such anchors stop at the shapes instead of running
 * across them (a line crossing a pill reads as a mistake, and the pill's
 * translucent fill does not hide it).
 *
 * Pure geometry -- the caller supplies the boxes, so the same helper serves
 * the overview and the focused layout, whatever their node scales.
 */
export function edgeAnchor(box: NodeBox, toward: Point, gap = 5): Point {
  const dx = toward.x - box.x;
  const dy = toward.y - box.y;
  if (dx === 0 && dy === 0) return { x: box.x, y: box.y };

  const halfWidth = box.width / 2 + gap;
  const halfHeight = box.height / 2 + gap;
  // Scale the direction vector until it hits whichever side it reaches first.
  const scale =
    1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return { x: box.x + dx * scale, y: box.y + dy * scale };
}

// -- Node geometry -----------------------------------------------------------

/** Article pill height for a single-line label, in unscaled canvas units. */
export const PILL_HEIGHT = 26;
/** Vertical step between wrapped label lines, in unscaled canvas units. */
export const LABEL_LINE_HEIGHT = 14;

/**
 * Pill geometry for an article node, in unscaled canvas units: 11px labels
 * measure ~6.2px per character, so the pill grows with its longest line and
 * by one line height per extra line. `maxWidth` lets the focused mode's
 * center run wider than the nodes on its rings -- it is the one label the
 * reader is meant to take in fully.
 */
export function articlePillSize(
  lines: string[],
  maxWidth = 200,
): { width: number; height: number } {
  const longest = lines.reduce((n, line) => Math.max(n, line.length), 0);
  return {
    width: Math.min(Math.max(longest * 6.2 + 20, 64), maxWidth),
    height: PILL_HEIGHT + Math.max(0, lines.length - 1) * LABEL_LINE_HEIGHT,
  };
}

// -- Focused (centered) graph layout ------------------------------------------

/** Neighbor ring size relative to the outer (background) ring. */
const NEIGHBOR_RING_FRACTION = 0.56;
/**
 * Minimum angular gap between neighbor nodes (radians). Wider than the
 * citation ring's: these carry enlarged labels, and near the top and bottom
 * of the ellipse adjacent nodes separate mostly horizontally, which is the
 * direction a label needs room in.
 */
const MIN_NEIGHBOR_SEPARATION = 0.52;
/** Minimum angular gap between background nodes (radians) -- smaller nodes, tighter rim. */
const MIN_BACKGROUND_SEPARATION = 0.15;

/** Every node one hop from `id`, in either edge direction (excluding `id`). */
export function neighborIdsOf(edges: GraphEdge[], id: string): Set<string> {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.from === id) ids.add(edge.to);
    else if (edge.to === id) ids.add(edge.from);
  }
  ids.delete(id);
  return ids;
}

/**
 * Focused counterpart to `layoutGraph`: the node the user centered sits at
 * the canvas center, its direct neighbors form a readable inner ring, and
 * every other node recedes to a rim ring (drawn small and faint by the
 * panel, deliberately still visible -- the wider knowledge base must not
 * vanish just because one article is in focus).
 *
 * Ring angles come from each node's position in the *overview* layout, so a
 * node keeps the direction it already had when the user switches modes and
 * the two views stay mentally superimposable. Angles are read
 * aspect-normalized (against the layout's own ellipse radii), so the wide
 * canvas doesn't skew the ordering.
 *
 * An unknown `focusId` is well-defined rather than an error: every node
 * keeps its overview position and the `"neighbor"` ring, i.e. a plain
 * overview with nothing centered and nothing pushed back.
 *
 * Pure function of its inputs -- no randomness, no input mutation.
 */
export function layoutFocusGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  focusId: string,
  width: number,
  height: number,
): FocusPositionedNode[] {
  const base = layoutGraph(nodes, edges, width, height);
  const focused = base.find((node) => node.id === focusId);
  if (!focused) {
    return base.map((node) => ({ ...node, ring: "neighbor" as const }));
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const rxOuter = width / 2 - width * MARGIN_X_FRACTION;
  const ryOuter = height / 2 - height * MARGIN_Y_FRACTION;
  const rxNeighbor = rxOuter * NEIGHBOR_RING_FRACTION;
  const ryNeighbor = ryOuter * NEIGHBOR_RING_FRACTION;

  const neighborIds = neighborIdsOf(edges, focusId);
  const baseAngle = (node: PositionedNode): number =>
    Math.atan2((node.y - centerY) / ryOuter, (node.x - centerX) / rxOuter);

  const onRing = (
    ring: FocusRing,
    members: PositionedNode[],
    minSeparation: number,
    rx: number,
    ry: number,
  ): FocusPositionedNode[] =>
    spreadAngles(
      members.map((node) => ({ node, angle: baseAngle(node) })),
      minSeparation,
    ).map(({ node, angle }) => ({
      ...(node as PositionedNode),
      ring,
      x: centerX + rx * Math.cos(angle),
      y: centerY + ry * Math.sin(angle),
    }));

  return [
    { ...focused, ring: "focus", x: centerX, y: centerY },
    ...onRing(
      "neighbor",
      base.filter((node) => neighborIds.has(node.id)),
      MIN_NEIGHBOR_SEPARATION,
      rxNeighbor,
      ryNeighbor,
    ),
    ...onRing(
      "background",
      base.filter((node) => node.id !== focusId && !neighborIds.has(node.id)),
      MIN_BACKGROUND_SEPARATION,
      rxOuter,
      ryOuter,
    ),
  ];
}
