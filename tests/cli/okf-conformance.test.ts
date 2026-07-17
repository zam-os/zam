import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFrontmatter, renderIndex } from "../../src/cli/okf/bundle.js";
import { loadBundle } from "../../src/cli/okf/io.js";

/**
 * CI gate for the real docs/okf bundle (ADR 2026-07-17): learners' cards
 * cite these articles as source_link, so a broken bundle ships broken
 * learning sources.
 */
const BUNDLE_DIR = join(process.cwd(), "docs", "okf");
const CANONICAL_PREFIX = "https://github.com/zam-os/zam/blob/main/docs/okf/";

describe("docs/okf conformance", () => {
  const bundle = loadBundle(BUNDLE_DIR);

  it("has zero validation problems", () => {
    expect(bundle.problems).toEqual([]);
    expect(bundle.catalog.length).toBeGreaterThanOrEqual(6);
  });

  it("every article's resource is its canonical blob URL", () => {
    for (const entry of bundle.catalog) {
      expect(entry.resource, entry.file).toBe(
        `${CANONICAL_PREFIX}${entry.file}`,
      );
      expect(entry.timestamp, entry.file).toBeTruthy();
      expect(entry.tags.length, entry.file).toBeGreaterThan(0);
    }
  });

  it("index.md is exactly the rendered catalog (regenerate via zam_okf_upsert)", () => {
    const index = readFileSync(join(BUNDLE_DIR, "index.md"), "utf8");
    expect(index).toBe(renderIndex(bundle.catalog));
  });

  it("log.md exists and mentions every article at least once", () => {
    const log = readFileSync(join(BUNDLE_DIR, "log.md"), "utf8");
    for (const entry of bundle.catalog) {
      expect(log, entry.file).toContain(`](${entry.file})`);
    }
  });

  it("relative markdown links inside articles resolve to real files", () => {
    const linkRe = /\]\((?!https?:)([^)#]+)(?:#[^)]*)?\)/g;
    for (const { file, markdown } of bundle.articles) {
      const { body } = parseFrontmatter(markdown);
      for (const match of body.matchAll(linkRe)) {
        const target = join(BUNDLE_DIR, match[1]);
        expect(existsSync(target), `${file} → ${match[1]}`).toBe(true);
      }
    }
  });

  it("articles cite ADRs instead of restating decisions", () => {
    for (const { file, markdown } of bundle.articles) {
      expect(markdown, file).toContain("# Citations");
    }
  });
});
