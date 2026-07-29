import { describe, expect, it } from "vitest";
import {
  articlePillSize,
  type CatalogEntry,
  edgeAnchor,
  extractLinks,
  filterCatalog,
  type GraphEdge,
  type GraphNode,
  groupCatalog,
  indexFreshnessByFile,
  layoutFocusGraph,
  layoutGraph,
  neighborIdsOf,
  renderMarkdown,
  reviewRecommendedPaths,
  stripFrontmatter,
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

describe("freshness audit indexing", () => {
  it("indexes articles and exposes only review-recommended code paths", () => {
    const byFile = indexFreshnessByFile({
      articles: [
        {
          file: "mcp-surfaces.md",
          status: "review-recommended",
          codeReferences: [
            {
              path: "src/cli/commands/mcp.ts",
              status: "review-recommended",
            },
            { path: "src/cli/okf/io.ts", status: "current" },
          ],
        },
      ],
    });

    expect([...byFile.keys()]).toEqual(["mcp-surfaces.md"]);
    expect(reviewRecommendedPaths(byFile.get("mcp-surfaces.md"))).toEqual([
      "src/cli/commands/mcp.ts",
    ]);
    expect(indexFreshnessByFile(null).size).toBe(0);
  });
});

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

  it("keeps a wrapped list item's continuation lines inside its <li>", () => {
    const source = [
      "- **JSON only.** Every bridge response is JSON — all",
      "  output goes through the helpers.",
      "- Second item.",
    ].join("\n");
    expect(renderMarkdown(source)).toBe(
      "<ul><li><strong>JSON only.</strong> Every bridge response is JSON — all output goes through the helpers.</li>" +
        "<li>Second item.</li></ul>",
    );
  });

  it("renders a thematic break instead of a literal dash paragraph", () => {
    expect(renderMarkdown("above\n\n---\n\nbelow")).toBe(
      "<p>above</p>\n<hr>\n<p>below</p>",
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

describe("stripFrontmatter", () => {
  it("drops a leading frontmatter fence so the reader never renders it", () => {
    const source = [
      "---",
      "type: reference",
      "title: cops Output Contract",
      "tags:",
      "  - cli",
      "---",
      "",
      "# cops Output Contract",
      "Body text.",
    ].join("\n");
    expect(stripFrontmatter(source)).toBe(
      "\n# cops Output Contract\nBody text.",
    );
  });

  it("returns a source without frontmatter unchanged", () => {
    const source = "# Title\n\nBody.";
    expect(stripFrontmatter(source)).toBe(source);
  });

  it("treats an unterminated fence as content, not frontmatter", () => {
    const source = "---\ntype: reference\nno closing fence";
    expect(stripFrontmatter(source)).toBe(source);
  });

  it("strips CRLF frontmatter and normalizes the body (Windows checkouts)", () => {
    const source = "---\r\ntype: reference\r\n---\r\n\r\n# Title\r\nBody.";
    expect(stripFrontmatter(source)).toBe("\n# Title\nBody.");
  });

  it("strips a leading UTF-8 BOM before the fence check", () => {
    const source = "﻿---\r\ntype: reference\r\n---\r\n\r\nBody.";
    expect(stripFrontmatter(source)).toBe("\nBody.");
  });
});

describe("extractLinks with CRLF sources", () => {
  it("still ignores links inside CRLF fenced code blocks", () => {
    const body =
      "See [real](workload-resource-rights.md).\r\n\r\n```\r\n[fake](inside-fence.md)\r\n```\r\n";
    const { articles } = extractLinks(body);
    expect(articles).toEqual(["workload-resource-rights.md"]);
  });
});

describe("renderMarkdown with CRLF sources", () => {
  it("renders headings and lists despite trailing carriage returns", () => {
    const html = renderMarkdown("# Title\r\n\r\n- item one\r\n- item two\r\n");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>item one</li>");
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

  it("orders articles by (type, file) and places citations on the outer ring", () => {
    const width = 960;
    const height = 620;
    const positioned = layoutGraph(nodes, edges, width, height);
    const articles = positioned.filter((n) => n.kind === "article");
    const citations = positioned.filter((n) => n.kind === "citation");

    expect(articles.map((n) => n.id)).toEqual(["a.md", "c.md", "b.md"]);
    expect(citations.map((n) => n.id)).toEqual(["../adr/x.md"]);

    // Aspect-normalized radial distance: citations sit on a strictly
    // larger ellipse than every article, whatever the canvas aspect.
    const radial = (n: { x: number; y: number }) =>
      Math.hypot((n.x - width / 2) / width, (n.y - height / 2) / height);
    for (const article of articles) {
      expect(radial(citations[0])).toBeGreaterThan(radial(article));
    }
  });

  it("keeps every node inside the label margins", () => {
    const width = 960;
    const height = 620;
    for (const node of layoutGraph(nodes, edges, width, height)) {
      expect(node.x).toBeGreaterThanOrEqual(width * 0.1);
      expect(node.x).toBeLessThanOrEqual(width * 0.9);
      expect(node.y).toBeGreaterThanOrEqual(height * 0.05);
      expect(node.y).toBeLessThanOrEqual(height * 0.95);
    }
  });

  it("places a citation next to its citing article, not at an alphabetical slot", () => {
    const width = 960;
    const height = 620;
    const positioned = layoutGraph(nodes, edges, width, height);
    const citer = positioned.find((n) => n.id === "a.md");
    const citation = positioned.find((n) => n.id === "../adr/x.md");
    if (!citer || !citation) throw new Error("nodes missing from layout");

    // Same direction from the center: the angle between the citing
    // article's and the citation's position vectors is small.
    const angleOf = (n: { x: number; y: number }) =>
      Math.atan2((n.y - height / 2) / height, (n.x - width / 2) / width);
    const diff = Math.abs(angleOf(citer) - angleOf(citation));
    const wrapped = Math.min(diff, 2 * Math.PI - diff);
    expect(wrapped).toBeLessThan(0.4);
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

describe("neighborIdsOf", () => {
  const edges: GraphEdge[] = [
    { from: "a.md", to: "b.md" },
    { from: "c.md", to: "a.md" },
    { from: "b.md", to: "d.md" },
    { from: "a.md", to: "a.md" },
  ];

  it("collects one-hop neighbors in both edge directions", () => {
    expect([...neighborIdsOf(edges, "a.md")].sort()).toEqual(["b.md", "c.md"]);
  });

  it("never reports a node as its own neighbor, even with a self-edge", () => {
    expect(neighborIdsOf(edges, "a.md").has("a.md")).toBe(false);
  });

  it("returns an empty set for an unconnected id", () => {
    expect([...neighborIdsOf(edges, "zzz.md")]).toEqual([]);
  });
});

describe("layoutFocusGraph", () => {
  const width = 960;
  const height = 620;
  const nodes: GraphNode[] = [
    { id: "a.md", kind: "article", type: "algorithm", file: "a.md" },
    { id: "b.md", kind: "article", type: "guide", file: "b.md" },
    { id: "c.md", kind: "article", type: "guide", file: "c.md" },
    { id: "d.md", kind: "article", type: "reference", file: "d.md" },
    { id: "../adr/x.md", kind: "citation", file: "../adr/x.md" },
  ];
  const edges: GraphEdge[] = [
    { from: "a.md", to: "b.md" },
    { from: "a.md", to: "../adr/x.md" },
    { from: "c.md", to: "d.md" },
  ];

  // Aspect-normalized radial distance, so the wide canvas doesn't make
  // "further out" depend on which side of the ellipse a node sits.
  const radial = (n: { x: number; y: number }) =>
    Math.hypot((n.x - width / 2) / width, (n.y - height / 2) / height);

  it("centers the focused node and bands the rest by hop distance", () => {
    const positioned = layoutFocusGraph(nodes, edges, "a.md", width, height);
    const byId = new Map(positioned.map((n) => [n.id, n]));

    expect(byId.get("a.md")).toMatchObject({
      ring: "focus",
      x: width / 2,
      y: height / 2,
    });
    expect(byId.get("b.md")?.ring).toBe("neighbor");
    expect(byId.get("../adr/x.md")?.ring).toBe("neighbor");
    expect(byId.get("c.md")?.ring).toBe("background");
    expect(byId.get("d.md")?.ring).toBe("background");
    expect(positioned).toHaveLength(nodes.length);
  });

  it("keeps neighbors nearer the center than every background node", () => {
    const positioned = layoutFocusGraph(nodes, edges, "a.md", width, height);
    const neighbors = positioned.filter((n) => n.ring === "neighbor");
    const background = positioned.filter((n) => n.ring === "background");

    expect(neighbors).not.toHaveLength(0);
    expect(background).not.toHaveLength(0);
    for (const near of neighbors) {
      for (const far of background) {
        expect(radial(near)).toBeLessThan(radial(far));
      }
    }
  });

  it("keeps every node inside the label margins", () => {
    for (const node of layoutFocusGraph(nodes, edges, "a.md", width, height)) {
      expect(node.x).toBeGreaterThanOrEqual(width * 0.1);
      expect(node.x).toBeLessThanOrEqual(width * 0.9);
      expect(node.y).toBeGreaterThanOrEqual(height * 0.05);
      expect(node.y).toBeLessThanOrEqual(height * 0.95);
    }
  });

  it("keeps each node roughly in the direction it had in the overview", () => {
    const overview = layoutGraph(nodes, edges, width, height);
    const focused = layoutFocusGraph(nodes, edges, "a.md", width, height);
    const angleOf = (n: { x: number; y: number }) =>
      Math.atan2((n.y - height / 2) / height, (n.x - width / 2) / width);

    for (const node of focused) {
      if (node.ring === "focus") continue;
      const before = overview.find((n) => n.id === node.id);
      if (!before) throw new Error(`${node.id} missing from the overview`);
      const diff = Math.abs(angleOf(before) - angleOf(node));
      expect(Math.min(diff, 2 * Math.PI - diff)).toBeLessThan(0.5);
    }
  });

  it("falls back to the overview layout for an unknown focus id", () => {
    const overview = layoutGraph(nodes, edges, width, height);
    const focused = layoutFocusGraph(nodes, edges, "gone.md", width, height);

    expect(focused).toEqual(
      overview.map((node) => ({ ...node, ring: "neighbor" })),
    );
  });

  it("places an isolated focus node alone at the center", () => {
    const positioned = layoutFocusGraph(nodes, edges, "d.md", width, height);
    expect(
      positioned.filter((n) => n.ring === "neighbor").map((n) => n.id),
    ).toEqual(["c.md"]);
    expect(positioned.find((n) => n.id === "d.md")).toMatchObject({
      ring: "focus",
      x: width / 2,
      y: height / 2,
    });
  });

  it("is deterministic and does not mutate its input", () => {
    const inputNodes = nodes.map((n) => ({ ...n }));
    const inputEdges = edges.map((e) => ({ ...e }));
    const first = layoutFocusGraph(
      inputNodes,
      inputEdges,
      "a.md",
      width,
      height,
    );
    const second = layoutFocusGraph(
      inputNodes,
      inputEdges,
      "a.md",
      width,
      height,
    );

    expect(second).toEqual(first);
    expect(inputNodes).toEqual(nodes);
    expect(inputEdges).toEqual(edges);
  });
});

describe("edgeAnchor", () => {
  const box = { x: 100, y: 100, width: 80, height: 20 };

  it("meets the box on the side the target lies toward, plus the gap", () => {
    // Straight to the right: leaves through the right edge.
    expect(edgeAnchor(box, { x: 500, y: 100 }, 5)).toEqual({ x: 145, y: 100 });
    // Straight down: leaves through the bottom edge.
    expect(edgeAnchor(box, { x: 100, y: 500 }, 5)).toEqual({ x: 100, y: 115 });
  });

  it("never returns a point inside the box, in any direction", () => {
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 12) {
      const anchor = edgeAnchor(
        box,
        { x: box.x + 400 * Math.cos(angle), y: box.y + 400 * Math.sin(angle) },
        4,
      );
      const outsideX = Math.abs(anchor.x - box.x) >= box.width / 2;
      const outsideY = Math.abs(anchor.y - box.y) >= box.height / 2;
      expect(outsideX || outsideY).toBe(true);
    }
  });

  it("stays on the segment toward the target", () => {
    const target = { x: 400, y: 300 };
    const anchor = edgeAnchor(box, target, 5);
    const cross =
      (anchor.x - box.x) * (target.y - box.y) -
      (anchor.y - box.y) * (target.x - box.x);
    expect(Math.abs(cross)).toBeLessThan(1e-9);
  });

  it("returns the center when the target is the center (no direction to leave in)", () => {
    expect(edgeAnchor(box, { x: 100, y: 100 }, 5)).toEqual({ x: 100, y: 100 });
  });
});

describe("articlePillSize", () => {
  it("grows with the longest line, not the line count, in width", () => {
    const one = articlePillSize(["MCP Transport and Surfaces"]);
    const two = articlePillSize(["MCP Transport", "and Surfaces"]);
    expect(two.width).toBeLessThan(one.width);
  });

  it("adds one line height per wrapped line", () => {
    const one = articlePillSize(["Token and Card Model"]);
    const two = articlePillSize(["Token and", "Card Model"]);
    expect(two.height - one.height).toBe(14);
  });

  it("keeps a floor so a short label still reads as a pill", () => {
    expect(articlePillSize(["A"]).width).toBe(64);
  });

  it("honours the wider cap the centered node gets", () => {
    const long = ["x".repeat(60)];
    expect(articlePillSize(long).width).toBe(200);
    expect(articlePillSize(long, 280).width).toBe(280);
  });
});
