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

export interface GraphNode {
  id: string;
  kind: "article" | "citation";
  /** Catalog `type`, for articles; unused for citation nodes. */
  type?: string;
  /** Sort/identity key -- catalog file for articles, link target for citations. */
  file?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
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

/**
 * Decide whether `target` may be used as a navigating anchor `href`.
 * Returns the sanitized href to use, or `null` if the target must render
 * inert instead (visible label, no executing/navigating href) -- any
 * scheme outside the allowlist, e.g. `javascript:`, `data:`, `vbscript:`,
 * `file:`. A scheme-less target (relative path, `#fragment`) is always
 * safe, since it has no scheme to be hostile.
 */
function safeHref(target: string): string | null {
  const cleaned = target.replace(CONTROL_CHARS_RE, "").trim();
  const scheme = SCHEME_RE.exec(cleaned)?.[1].toLowerCase();
  if (scheme && !SAFE_HREF_SCHEMES.has(scheme)) return null;
  return cleaned;
}

// -- Markdown rendering -----------------------------------------------------

function renderLink(label: string, target: string): string {
  const kind = classifyLink(target);
  if (kind === "external") {
    return `<a href="${target}" target="_blank" rel="noopener noreferrer">${label}</a>`;
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
  const lines = escapeHtml(source).split("\n");
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
      const classAttr = lang ? ` class="language-${lang}"` : "";
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
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        `<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        `<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`,
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
  for (const line of text.split("\n")) {
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

const ARTICLE_RADIUS_FRACTION = 0.32;
const CITATION_RADIUS_FRACTION = 0.46;

function sortKey(node: GraphNode): string {
  return node.file ?? node.id;
}

function sortArticles(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => {
    const byType = (a.type ?? "").localeCompare(b.type ?? "");
    return byType !== 0 ? byType : sortKey(a).localeCompare(sortKey(b));
  });
}

function sortCitations(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function placeOnCircle(
  nodes: GraphNode[],
  radius: number,
  centerX: number,
  centerY: number,
): PositionedNode[] {
  const n = nodes.length;
  return nodes.map((node, index) => {
    // n is never 0 here: an empty `nodes` makes `.map` skip this callback
    // entirely, so the division below never sees a zero denominator.
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

/**
 * Deterministic circle layout: article nodes on an inner ring ordered by
 * (type, file), citation nodes on an outer ring (arc) ordered by their link
 * target. Pure function of its inputs -- no randomness, no mutation of the
 * input arrays -- so identical input always yields identical coordinates.
 *
 * `edges` isn't used for node placement (this is a radial layout, not
 * force-directed); it's accepted here so the panel can pass the same pair
 * of arrays it already has on hand for drawing the connecting lines.
 */
export function layoutGraph(
  nodes: GraphNode[],
  _edges: GraphEdge[],
  width: number,
  height: number,
): PositionedNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const minDim = Math.min(width, height);

  const articles = sortArticles(nodes.filter((n) => n.kind === "article"));
  const citations = sortCitations(nodes.filter((n) => n.kind === "citation"));

  return [
    ...placeOnCircle(
      articles,
      minDim * ARTICLE_RADIUS_FRACTION,
      centerX,
      centerY,
    ),
    ...placeOnCircle(
      citations,
      minDim * CITATION_RADIUS_FRACTION,
      centerX,
      centerY,
    ),
  ];
}
