import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearReviewContextCache,
  matchesFilePath,
  normalizePath,
  resolveReference,
  resolveReviewContext,
} from "../../src/kernel/index.js";

describe("ZAM Reference Resolver & Path Matching", () => {
  let tempDir: string;

  beforeEach(() => {
    clearReviewContextCache();
    tempDir = mkdtempSync(join(tmpdir(), "zam-ref-test-"));
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
      const resultWhole = await resolveReference(testFilePath);
      expect(resultWhole.sourceType).toBe("local");
      expect(resultWhole.content).toContain("Line 1\nLine 2");

      // Resolve specific range
      const resultRange = await resolveReference(`${testFilePath}#L2-L4`);
      expect(resultRange.sourceType).toBe("local");
      expect(resultRange.content).toBe("Line 2\nLine 3\nLine 4");

      // Resolve single line
      const resultSingle = await resolveReference(`${testFilePath}#L5`);
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

      const ctx = await resolveReviewContext(`${testFilePath}#L2`);
      expect(ctx).not.toBeNull();
      expect(ctx?.sourceLink).toBe(`${testFilePath}#L2`);
      expect(ctx?.sourceType).toBe("local");
      expect(ctx?.content).toBe("beta");
      expect(ctx?.truncated).toBe(false);
    });

    it("caps oversized content and flags truncation", async () => {
      const testFilePath = join(tempDir, "big.txt");
      writeFileSync(testFilePath, "x".repeat(5000), "utf-8");

      const ctx = await resolveReviewContext(testFilePath, { maxChars: 100 });
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

      const first = await resolveReviewContext(testFilePath);
      writeFileSync(testFilePath, "version-two", "utf-8");
      const second = await resolveReviewContext(testFilePath);

      expect(first?.content).toBe("version-one");
      expect(second?.content).toBe("version-one");
    });
  });
});
