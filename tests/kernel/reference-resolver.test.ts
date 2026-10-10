import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearReviewContextCache,
  matchesFilePath,
  normalizePath,
  type ReferenceFetcher,
  resolveReference,
  resolveReviewContext,
} from "../../src/kernel/index.js";

describe("ZAM Reference Resolver & Path Matching", () => {
  let tempDir: string;

  /** The temp folder as the one allowed root (ADR 2026-10-08b D1). */
  let roots: string[];

  beforeEach(() => {
    clearReviewContextCache();
    tempDir = mkdtempSync(join(tmpdir(), "zam-ref-test-"));
    roots = [realpathSync.native(tempDir)];
  });

  afterEach(() => {
    clearReviewContextCache();
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe("normalizePath", () => {
    it("strips anchors and normalizes separators", () => {
      expect(normalizePath("src\\kernel\\db\\schema.ts#L10-L20")).toBe(
        "src/kernel/db/schema.ts",
      );
      expect(normalizePath("CLAUDE.md#L45")).toBe("claude.md");
      expect(normalizePath("  docs/architecture.md  ")).toBe(
        "docs/architecture.md",
      );
    });
  });

  describe("matchesFilePath", () => {
    it("matches basic relative paths", () => {
      expect(
        matchesFilePath("src/kernel/db/schema.ts", "src/kernel/db/schema.ts"),
      ).toBe(true);
      expect(
        matchesFilePath(
          "src\\kernel\\db\\schema.ts",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(true);
      expect(
        matchesFilePath(
          "src/kernel/db/schema.ts#L10-L20",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(true);
    });

    it("matches trailing segments for relative/absolute mappings", () => {
      expect(
        matchesFilePath(
          "C:/src/github/zam/src/kernel/db/schema.ts",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(true);
      expect(
        matchesFilePath(
          "src/kernel/db/schema.ts",
          "C:/src/github/zam/src/kernel/db/schema.ts",
        ),
      ).toBe(true);
    });

    it("matches GitHub URIs against local relative paths", () => {
      expect(
        matchesFilePath(
          "https://github.com/zam-os/zam/blob/main/src/kernel/db/schema.ts#L15-L30",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(true);
      expect(
        matchesFilePath(
          "https://github.com/zam-os/zam/blob/main/docs/architecture.md",
          "docs/architecture.md",
        ),
      ).toBe(true);
      expect(
        matchesFilePath(
          "https://github.com/zam-os/zam/blob/main/docs/architecture.md",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(false);
    });

    it("does not match generic web links or mismatched files", () => {
      expect(
        matchesFilePath(
          "https://google.com/search?q=test",
          "src/kernel/db/schema.ts",
        ),
      ).toBe(false);
      expect(
        matchesFilePath(
          "src/kernel/db/schema.ts",
          "src/kernel/db/connection.ts",
        ),
      ).toBe(false);
    });
  });

  describe("resolveReference", () => {
    it("resolves dynamic search directives", async () => {
      const result = await resolveReference(
        "search://websearch?q=fsrs+algorithm",
      );
      expect(result.sourceType).toBe("dynamic_search");
      expect(result.content).toBe(
        'QUERY_DIRECTIVE: Run web search for "fsrs algorithm"',
      );
    });

    it("resolves local file paths and slices lines using anchors", async () => {
      const testFilePath = join(tempDir, "test.txt");
      writeFileSync(
        testFilePath,
        "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6",
        "utf-8",
      );

      // Resolve whole file
      const resultWhole = await resolveReference(testFilePath, { roots });
      expect(resultWhole.sourceType).toBe("local");
      expect(resultWhole.content).toContain("Line 1\nLine 2");

      // Resolve specific range
      const resultRange = await resolveReference(`${testFilePath}#L2-L4`, {
        roots,
      });
      expect(resultRange.sourceType).toBe("local");
      expect(resultRange.content).toBe("Line 2\nLine 3\nLine 4");

      // Resolve single line
      const resultSingle = await resolveReference(`${testFilePath}#L5`, {
        roots,
      });
      expect(resultSingle.sourceType).toBe("local");
      expect(resultSingle.content).toBe("Line 5");
    });
  });

  describe("resolveReviewContext", () => {
    it("returns null for empty or whitespace-only links", async () => {
      expect(await resolveReviewContext(null)).toBeNull();
      expect(await resolveReviewContext(undefined)).toBeNull();
      expect(await resolveReviewContext("   ")).toBeNull();
    });

    it("wraps resolved content with the originating link and a truncation flag", async () => {
      const testFilePath = join(tempDir, "ctx.txt");
      writeFileSync(testFilePath, "alpha\nbeta\ngamma", "utf-8");

      const ctx = await resolveReviewContext(`${testFilePath}#L2`, { roots });
      expect(ctx).not.toBeNull();
      expect(ctx?.sourceLink).toBe(`${testFilePath}#L2`);
      expect(ctx?.sourceType).toBe("local");
      expect(ctx?.content).toBe("beta");
      expect(ctx?.truncated).toBe(false);
    });

    it("caps oversized content and flags truncation", async () => {
      const testFilePath = join(tempDir, "big.txt");
      writeFileSync(testFilePath, "x".repeat(5000), "utf-8");

      const ctx = await resolveReviewContext(testFilePath, {
        maxChars: 100,
        roots,
      });
      expect(ctx?.content.length).toBe(100);
      expect(ctx?.truncated).toBe(true);
    });

    it("passes through dynamic search directives", async () => {
      const ctx = await resolveReviewContext(
        "search://websearch?q=spaced+repetition",
      );
      expect(ctx?.sourceType).toBe("dynamic_search");
      expect(ctx?.content).toBe(
        'QUERY_DIRECTIVE: Run web search for "spaced repetition"',
      );
      expect(ctx?.truncated).toBe(false);
    });

    it("reuses cached context for the same source link within TTL", async () => {
      const testFilePath = join(tempDir, "cache.txt");
      writeFileSync(testFilePath, "version-one", "utf-8");

      const first = await resolveReviewContext(testFilePath, { roots });
      writeFileSync(testFilePath, "version-two", "utf-8");
      const second = await resolveReviewContext(testFilePath, { roots });

      expect(first?.content).toBe("version-one");
      expect(second?.content).toBe("version-one");
    });

    it("returns unresolvable shape without fetcher for remote web links", async () => {
      const link = "https://example.com/article";
      const result = await resolveReference(link);
      expect(result.sourceType).toBe("remote_web");
      expect(result.content).toContain(
        "Error fetching URL reference: No HTTP fetcher configured",
      );
      expect(result.content).toContain(link);
      expect(result.url).toBe(link);

      const ctx = await resolveReviewContext(link);
      expect(ctx?.sourceType).toBe("remote_web");
      expect(ctx?.content).toContain(
        "Error fetching URL reference: No HTTP fetcher configured",
      );
    });

    it("uses stubbed fetcher for remote web links", async () => {
      const link = "https://example.com/article";
      let fetchedUrl = "";
      const stubFetcher: ReferenceFetcher = async (url: string) => {
        fetchedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () =>
            "<html><body><p>Fetched remote text</p></body></html>",
        };
      };

      const result = await resolveReference(link, { fetch: stubFetcher });
      expect(fetchedUrl).toBe(link);
      expect(result.sourceType).toBe("remote_web");
      expect(result.content).toBe("Fetched remote text");

      const ctx = await resolveReviewContext(link, { fetch: stubFetcher });
      expect(ctx?.sourceType).toBe("remote_web");
      expect(ctx?.content).toBe("Fetched remote text");
    });

    it("distinguishes cache entries by fetcher presence", async () => {
      const link = "https://example.com/cached-article";
      const stubFetcher: ReferenceFetcher = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "remote content",
      });

      // Without fetcher: cached as unresolvable
      const withoutFetcher = await resolveReviewContext(link);
      expect(withoutFetcher?.content).toContain("No HTTP fetcher configured");

      // With fetcher: should not reuse offline miss
      const withFetcher = await resolveReviewContext(link, {
        fetch: stubFetcher,
      });
      expect(withFetcher?.content).toBe("remote content");
    });
  });
});

describe("local source links are confined (ADR 2026-10-08b D1)", () => {
  let base: string;
  let trusted: string;
  let outsideDir: string;
  let roots: string[];

  beforeEach(() => {
    clearReviewContextCache();
    base = realpathSync.native(mkdtempSync(join(tmpdir(), "zam-d1-")));
    trusted = join(base, "trusted");
    outsideDir = join(base, "outside");
    mkdirSync(join(trusted, "docs", "okf"), { recursive: true });
    mkdirSync(join(trusted, ".ssh"));
    mkdirSync(outsideDir);
    writeFileSync(join(trusted, "docs", "okf", "note.md"), "inside");
    writeFileSync(join(trusted, ".ssh", "id_rsa.md"), "key");
    writeFileSync(join(trusted, ".env.md"), "SECRET=1");
    writeFileSync(join(trusted, "photo.png"), "\x89PNG");
    writeFileSync(join(outsideDir, "secret.md"), "outside secret");
    roots = [trusted];
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  it("reads a text file inside a root, absolute or relative", async () => {
    const absolute = await resolveReference(join(trusted, "docs/okf/note.md"), {
      roots,
    });
    expect(absolute.content).toBe("inside");
    const relative = await resolveReference("docs/okf/note.md", { roots });
    expect(relative.content).toBe("inside");
  });

  it("refuses a secret file outside every root, with the typed refusal", async () => {
    const result = await resolveReference(join(outsideDir, "secret.md"), {
      roots,
    });
    expect(result.refusal).toBe("path-outside-trusted-folders");
    expect(result.content).not.toContain("outside secret");
    expect(result.content).toMatch(/trust its folder in ZAM Settings/);
  });

  it("reads nothing at all without roots, not even the working directory", async () => {
    const result = await resolveReference("package.json");
    expect(result.refusal).toBe("path-outside-trusted-folders");
  });

  it.each([
    ["../outside/secret.md", "path-outside-trusted-folders"],
    [".ssh/id_rsa.md", "path-not-readable"],
    [".env.md", "path-not-readable"],
    ["photo.png", "path-not-readable"],
    ["notes.md:hidden", "path-not-readable"],
    ["\\\\?\\C:\\secret.md", "path-not-readable"],
  ])("refuses %s", async (link, code) => {
    const result = await resolveReference(link, { roots });
    expect(result.refusal).toBe(code);
    expect(result.content).not.toMatch(/outside secret|key|SECRET=1/);
  });

  it("follows no symlink out of a root", async () => {
    symlinkSync(join(outsideDir, "secret.md"), join(trusted, "link.md"));
    const result = await resolveReference(join(trusted, "link.md"), { roots });
    expect(result.refusal).toBe("path-outside-trusted-folders");
    expect(result.content).not.toContain("outside secret");
  });

  it("uses a GitHub sibling checkout only inside a root", async () => {
    const link = "https://github.com/owner/trusted/blob/main/docs/okf/note.md";
    const local = await resolveReference(link, { roots });
    expect(local.sourceType).toBe("local");
    expect(local.content).toBe("inside");

    // Outside every root, or with `..` in the path, the checkout is not read.
    const escape =
      "https://github.com/owner/trusted/blob/main/docs/../../outside/secret.md";
    const refused = await resolveReference(escape, { roots });
    expect(refused.content).not.toContain("outside secret");
    const other = await resolveReference(
      "https://github.com/owner/outside/blob/main/secret.md",
      { roots },
    );
    expect(other.content).not.toContain("outside secret");
  });
});
