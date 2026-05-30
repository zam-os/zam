import { describe, expect, it } from "vitest";
import { formatHeader, formatReveal } from "../../src/cli/learn-format.js";
import type { ReviewContext } from "../../src/kernel/index.js";

describe("zam learn — formatting", () => {
  describe("formatHeader", () => {
    it("builds a Bloom-adapted, domain-tagged header without the slug tag", () => {
      const header = formatHeader({ domain: "learning", bloomLevel: 3 });
      expect(header).toBe("Apply (Bloom 3) · learning");
    });

    it("clamps out-of-range or non-finite bloom levels to 1", () => {
      expect(formatHeader({ domain: "", bloomLevel: 9 })).toContain("Bloom 1");
      expect(formatHeader({ domain: "", bloomLevel: 0 })).toContain("Bloom 1");
      expect(formatHeader({ domain: "", bloomLevel: Number.NaN })).toContain("Bloom 1");
    });

    it("omits the domain segment when domain is blank", () => {
      const header = formatHeader({ domain: "   ", bloomLevel: 2 });
      expect(header).toBe("Understand (Bloom 2)");
    });
  });

  describe("formatReveal", () => {
    it("reveals the concept", () => {
      const out = formatReveal({ slug: "test-slug", concept: "FSRS stability is the memory half-life in days" });
      expect(out).toContain("Token: #test-slug");
      expect(out).toContain("Concept: FSRS stability is the memory half-life in days");
    });

    it("includes context and quotes resolved source content", () => {
      const resolved: ReviewContext = {
        sourceLink: "lib.txt#L2-L3",
        sourceType: "local",
        content: "line A\nline B",
        filePath: "lib.txt",
        truncated: false,
      };
      const out = formatReveal({ slug: "test-slug", concept: "C", context: "extra context", resolved });
      expect(out).toContain("Token: #test-slug");
      expect(out).toContain("Context: extra context");
      expect(out).toContain("Source (local: lib.txt):");
      expect(out).toContain("  │ line A");
      expect(out).toContain("  │ line B");
    });

    it("renders a dynamic_search directive as a single source line, not quoted", () => {
      const resolved: ReviewContext = {
        sourceLink: "search://websearch?q=x",
        sourceType: "dynamic_search",
        content: 'QUERY_DIRECTIVE: Run web search for "x"',
        truncated: false,
      };
      const out = formatReveal({ slug: "test-slug", concept: "C", resolved });
      expect(out).toContain('Source: QUERY_DIRECTIVE: Run web search for "x"');
      expect(out).not.toContain("│");
    });

    it("flags truncated content", () => {
      const resolved: ReviewContext = {
        sourceLink: "big.txt",
        sourceType: "local",
        content: "x",
        filePath: "big.txt",
        truncated: true,
      };
      const out = formatReveal({ slug: "test-slug", concept: "C", resolved });
      expect(out).toContain("… (truncated)");
    });

    it("omits blank context and empty resolved content", () => {
      const out = formatReveal({ slug: "test-slug", concept: "C", context: "   ", resolved: null });
      expect(out).toContain("Token: #test-slug");
      expect(out).toContain("Concept: C");
    });
  });
});
