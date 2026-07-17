import { describe, expect, it } from "vitest";
import {
  type CatalogEntry,
  extractLinks,
  filterCatalog,
  type GraphEdge,
  type GraphNode,
  groupCatalog,
  layoutGraph,
  renderMarkdown,
} from "../../desktop/src/panel/okf-render.js";

// Collects every href="..." attribute value from rendered HTML, with ASCII
// control characters stripped -- mirrors how a browser's URL parser reads
// an href (control chars are discarded before scheme detection), so a test
// can assert on what the browser would actually navigate to rather than on
// the raw markup text.
function hrefValues(html: string): string[] {
  return [...html.matchAll(/href="([^"]*)"/g)].map((m) =>
    // biome-ignore lint/suspicious/noControlCharactersInRegex: mirrors safeHref's own control-char strip so the assertion sees what a browser would parse
    m[1].replace(/[\x00-\x1F]/g, ""),
  );
}

// Real-shaped article body (docs/okf/fsrs-scheduling.md, sans frontmatter) —
// used to pin extractLinks against genuine OKF prose rather than a synthetic
// stand-in, per the Task 3 brief.
const FSRS_BODY = [
  "ZAM's spaced repetition uses **FSRS-5** (Free Spaced Repetition Scheduler,",
  "v5), implemented as pure functions in `src/kernel/scheduler/fsrs.ts`.",
  "",
  "A review takes a **rating** on a four-point scale: `1` Again (forgot),",
  "`2` Hard, `3` Good, `4` Easy. Each card carries FSRS state per user:",
  "**stability** (expected recall half-life in days), **difficulty** (1-10),",
  "elapsed/scheduled days, repetition and lapse counts, a **state** of",
  "`new`, `learning`, `review`, or `relearning`, and the next due date.",
  "",
  "`evaluateRating()` in `src/kernel/recall/evaluator.ts` applies a rating: it",
  "runs FSRS scheduling, updates the card, and appends an immutable entry to",
  "`review_logs`. Rating is deliberately separate from prerequisite blocking -",
  "`evaluateRating()` never blocks or unblocks anything; callers decide",
  "whether to invoke the blocker after a rating of `1` (see",
  "[prerequisite-blocking.md](prerequisite-blocking.md)).",
  "",
  "# Review queue",
  "",
  "`src/kernel/scheduler/queue.ts` builds each session's queue from due cards",
  "plus new cards: it interleaves cards by domain (so one topic doesn't",
  "monopolize a session) and inserts new cards at every 5th position.",
  "",
  "# Examples",
  "",
  "```ts",
  'import { evaluateRating } from "zam-core";',
  "// rating: 1 | 2 | 3 | 4 - updates FSRS state and appends to review_logs",
  "await evaluateRating(db, { cardId, tokenId, userId, rating: 3 });",
  "```",
  "",
  "# Citations",
  "",
  "- [ADR 2026-05-30a - Standalone Learning Session](../adr/2026-05-30a-standalone-learning-session.md)",
  "- Tests as source of truth for scheduling semantics: `tests/kernel/fsrs.test.ts`",
  "- Code: `src/kernel/scheduler/fsrs.ts`, `src/kernel/scheduler/queue.ts`, `src/kernel/recall/evaluator.ts`",
  "- Algorithm reference: <https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm>",
].join("\n");

describe("renderMarkdown", () => {
  it("escapes HTML first so an embedded script can never survive", () => {
    const html = renderMarkdown("<script>alert(1)</script>\n\nSafe text.");
    expect(html.toLowerCase()).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("<p>Safe text.</p>");
  });

  it("escapes HTML inside inline code and links too", () => {
    const html = renderMarkdown("Use `<img onerror=alert(1)>` carefully.");
    expect(html.toLowerCase()).not.toContain("<img");
    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
  });

  it("renders headings 1-6 and leaves 7+ hashes as a paragraph", () => {
    const html = renderMarkdown("# Title\n\n## Sub\n\nBody text.");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<h2>Sub</h2>");
    expect(html).toContain("<p>Body text.</p>");
  });

  it("renders bold, italic, and inline code together", () => {
    const html = renderMarkdown("This is **bold**, *italic*, and `code`.");
    expect(html).toBe(
      "<p>This is <strong>bold</strong>, <em>italic</em>, and <code>code</code>.</p>",
    );
  });

  it("renders a fenced code block verbatim (escaped) with a language class", () => {
    const html = renderMarkdown("```ts\nconst x = 1;\n```");
    expect(html).toBe(
      '<pre><code class="language-ts">const x = 1;</code></pre>',
    );
  });

  it("renders a fenced code block with no language marker", () => {
    const html = renderMarkdown("```\nplain\n```");
    expect(html).toBe("<pre><code>plain</code></pre>");
  });

  it("renders an unordered list", () => {
    const html = renderMarkdown("- One\n- Two\n- Three");
    expect(html).toBe("<ul><li>One</li><li>Two</li><li>Three</li></ul>");
  });

  it("renders an ordered list", () => {
    const html = renderMarkdown("1. First\n2. Second");
    expect(html).toBe("<ol><li>First</li><li>Second</li></ol>");
  });

  it("renders a table", () => {
    const html = renderMarkdown(
      "| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |",
    );
    expect(html).toBe(
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
        "<tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table>",
    );
  });

  it("keeps an escaped pipe as a literal character in a table cell instead of splitting the column", () => {
    const html = renderMarkdown("| A | B |\n| --- | --- |\n| x\\|y | 2 |");
    expect(html).toBe(
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
        "<tbody><tr><td>x|y</td><td>2</td></tr></tbody></table>",
    );
  });

  it("renders a blockquote", () => {
    const html = renderMarkdown("> Quoted line one.\n> Quoted line two.");
    expect(html).toBe(
      "<blockquote>Quoted line one. Quoted line two.</blockquote>",
    );
  });

  it("classifies a bare kebab .md link as an in-bundle article link", () => {
    const html = renderMarkdown(
      "See [prereqs](prerequisite-blocking.md) for details.",
    );
    expect(html).toBe(
      '<p>See <a href="#" data-okf-article="prerequisite-blocking.md">prereqs</a> for details.</p>',
    );
  });

  it("classifies a relative .md path outside the bundle as a citation link", () => {
    const html = renderMarkdown(
      "See [ADR](../adr/2026-01-01-x.md) for rationale.",
    );
    expect(html).toBe(
      '<p>See <a href="#" data-okf-citation="../adr/2026-01-01-x.md">ADR</a> for rationale.</p>',
    );
  });

  it("opens external http(s) links safely in a new tab", () => {
    const html = renderMarkdown("Read the [spec](https://example.com/spec).");
    expect(html).toBe(
      '<p>Read the <a href="https://example.com/spec" target="_blank" rel="noopener noreferrer">spec</a>.</p>',
    );
  });

  describe("link safety (unsafe URI schemes render inert)", () => {
    it("renders a javascript: link inert -- no executing href, keeps the label", () => {
      const html = renderMarkdown("[click me](javascript:alert(1))");
      expect(hrefValues(html).some((h) => /^javascript:/i.test(h))).toBe(false);
      expect(html).toContain("click me");
    });

    it("renders a data: URI link inert -- no navigating href, keeps the label", () => {
      const html = renderMarkdown("[open](data:text/html;base64,PHNjcmlwdD4=)");
      expect(hrefValues(html).some((h) => /^data:/i.test(h))).toBe(false);
      expect(html).toContain("open");
    });

    it("treats the scheme check case-insensitively -- JavaScript: also renders inert", () => {
      const html = renderMarkdown("[click](JavaScript:alert(1))");
      expect(hrefValues(html).some((h) => /^javascript:/i.test(h))).toBe(false);
      expect(html).toContain("click");
    });

    it("strips an embedded control character before scheme detection, so java<TAB>script: also renders inert", () => {
      const html = renderMarkdown("[click](java\tscript:alert(1))");
      expect(hrefValues(html).some((h) => /^javascript:/i.test(h))).toBe(false);
      expect(html).toContain("click");
    });

    it("keeps a mailto: link navigable (allowlisted scheme)", () => {
      const html = renderMarkdown("[email me](mailto:a@b.com)");
      expect(html).toBe('<p><a href="mailto:a@b.com">email me</a></p>');
    });

    it("still classifies and renders external, article, and citation links exactly as before", () => {
      const html = renderMarkdown(
        "See [spec](https://example.com/spec) and [prereqs](prerequisite-blocking.md) and [adr](../adr/2026-01-01-x.md).",
      );
      expect(html).toBe(
        '<p>See <a href="https://example.com/spec" target="_blank" rel="noopener noreferrer">spec</a>' +
          ' and <a href="#" data-okf-article="prerequisite-blocking.md">prereqs</a>' +
          ' and <a href="#" data-okf-citation="../adr/2026-01-01-x.md">adr</a>.</p>',
      );
    });
  });

  describe("link safety (authority-relative // and \\ targets render inert)", () => {
    // "//evil.com/x", "\\evil.com\x", and mixed "/\evil.com" have no scheme
    // token, but a browser still resolves them to an off-origin authority
    // (backslashes are normalized to forward slashes for http/https), so
    // they must be rejected the same as an unsafe scheme -- not treated as
    // a safe scheme-less relative path.
    it("renders a //host authority-relative target inert -- no off-origin href, keeps the label", () => {
      const html = renderMarkdown("[x](//evil.com/steal)");
      expect(hrefValues(html).some((h) => h.startsWith("//"))).toBe(false);
      expect(html).not.toContain("evil.com");
      expect(html).toBe("<p><span>x</span></p>");
    });

    it("renders a \\\\host UNC-style target inert -- no off-origin href, keeps the label", () => {
      const html = renderMarkdown("[x](\\\\evil.com\\steal)");
      expect(html).not.toContain("evil.com");
      expect(html).toBe("<p><span>x</span></p>");
    });

    it("renders a mixed /\\host target inert (browsers normalize \\ to / for http(s), so this is also off-origin)", () => {
      const html = renderMarkdown("[x](/\\evil.com)");
      expect(html).not.toContain("evil.com");
      expect(html).toBe("<p><span>x</span></p>");
    });

    it("regression: a non-authority-relative fallback target (single leading dot, no scheme) still renders as a normal link", () => {
      const html = renderMarkdown("[x](../adr/)");
      expect(html).toBe('<p><a href="../adr/">x</a></p>');
    });

    it("regression: mailto and external https links stay navigable with attributes intact", () => {
      const html = renderMarkdown(
        "[email me](mailto:a@b.com) and visit [site](https://x.example).",
      );
      expect(html).toBe(
        '<p><a href="mailto:a@b.com">email me</a> and visit ' +
          '<a href="https://x.example" target="_blank" rel="noopener noreferrer">site</a>.</p>',
      );
    });
  });
});

describe("groupCatalog", () => {
  const entry = (file: string, type: string): CatalogEntry => ({
    file,
    type,
    title: file,
    description: "",
    tags: [],
  });

  it("groups by frontmatter type in stable, first-seen order", () => {
    const catalog = [
      entry("a.md", "guide"),
      entry("b.md", "architecture"),
      entry("c.md", "guide"),
    ];
    const groups = groupCatalog(catalog);
    expect([...groups.keys()]).toEqual(["guide", "architecture"]);
    expect(groups.get("guide")).toEqual([catalog[0], catalog[2]]);
    expect(groups.get("architecture")).toEqual([catalog[1]]);
  });
});

describe("filterCatalog", () => {
  const catalog: CatalogEntry[] = [
    {
      file: "fsrs-scheduling.md",
      type: "algorithm",
      title: "FSRS-5 Scheduling",
      description: "Pure-function scheduler",
      tags: ["kernel", "fsrs"],
    },
    {
      file: "mcp-surfaces.md",
      type: "architecture",
      title: "MCP Transport and Surfaces",
      description: "Agent transport",
      tags: ["mcp", "agents"],
    },
  ];

  it("matches case-insensitively on title", () => {
    expect(filterCatalog(catalog, "fsrs-5")).toEqual([catalog[0]]);
  });

  it("matches case-insensitively on description", () => {
    expect(filterCatalog(catalog, "AGENT TRANSPORT")).toEqual([catalog[1]]);
  });

  it("matches on tags", () => {
    expect(filterCatalog(catalog, "kernel")).toEqual([catalog[0]]);
  });

  it("matches on file name", () => {
    expect(filterCatalog(catalog, "mcp-surfaces")).toEqual([catalog[1]]);
  });

  it("returns the full catalog for an empty query", () => {
    expect(filterCatalog(catalog, "")).toEqual(catalog);
    expect(filterCatalog(catalog, "   ")).toEqual(catalog);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterCatalog(catalog, "nonexistent")).toEqual([]);
  });
});

describe("extractLinks", () => {
  it("ignores markdown-looking links inside fenced code blocks", () => {
    const body = [
      "See [prerequisite-blocking.md](prerequisite-blocking.md) and:",
      "",
      "```md",
      "[nope.md](nope.md)",
      "[nope-adr](../adr/nope.md)",
      "```",
      "",
      "Done.",
    ].join("\n");
    const links = extractLinks(body);
    expect(links.articles).toEqual(["prerequisite-blocking.md"]);
    expect(links.citations).toEqual([]);
  });

  it("extracts article and citation links from a real-shaped article body", () => {
    const links = extractLinks(FSRS_BODY);
    expect(links.articles).toEqual(["prerequisite-blocking.md"]);
    expect(links.citations).toEqual([
      "../adr/2026-05-30a-standalone-learning-session.md",
    ]);
  });
});

describe("layoutGraph", () => {
  const nodes: GraphNode[] = [
    { id: "b.md", kind: "article", type: "guide", file: "b.md" },
    { id: "a.md", kind: "article", type: "algorithm", file: "a.md" },
    { id: "c.md", kind: "article", type: "algorithm", file: "c.md" },
    {
      id: "../adr/x.md",
      kind: "citation",
      file: "../adr/x.md",
    },
  ];
  const edges: GraphEdge[] = [{ from: "a.md", to: "../adr/x.md" }];

  it("orders articles by (type, file) and places citations further out", () => {
    const positioned = layoutGraph(nodes, edges, 200, 200);
    const articles = positioned.filter((n) => n.kind === "article");
    const citations = positioned.filter((n) => n.kind === "citation");

    expect(articles.map((n) => n.id)).toEqual(["a.md", "c.md", "b.md"]);
    expect(citations.map((n) => n.id)).toEqual(["../adr/x.md"]);

    const centerX = 100;
    const centerY = 100;
    const distance = (n: { x: number; y: number }) =>
      Math.hypot(n.x - centerX, n.y - centerY);

    const articleRadius = distance(articles[0]);
    for (const node of articles) {
      expect(distance(node)).toBeCloseTo(articleRadius, 5);
    }
    const citationRadius = distance(citations[0]);
    expect(citationRadius).toBeGreaterThan(articleRadius);
  });

  it("is deterministic across repeated calls with fresh input arrays", () => {
    const first = layoutGraph(
      nodes.map((n) => ({ ...n })),
      edges.map((e) => ({ ...e })),
      200,
      200,
    );
    const second = layoutGraph(
      nodes.map((n) => ({ ...n })),
      edges.map((e) => ({ ...e })),
      200,
      200,
    );
    expect(second).toEqual(first);
  });

  it("handles an empty graph without dividing by zero", () => {
    expect(layoutGraph([], [], 200, 200)).toEqual([]);
  });
});
