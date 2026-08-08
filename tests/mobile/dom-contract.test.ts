/**
 * The markup/TypeScript contract.
 *
 * `element()` and `byId()` throw when an id is absent, and they run at module
 * scope — so a single id renamed in `index.html` aborts the whole bootstrap
 * before a single listener is attached. The app then launches, paints, and
 * ignores every tap, with nothing in the UI to say why. That is precisely
 * what happened when the shell was rebuilt and `voice-controls` was dropped;
 * it cost a full device build to notice.
 *
 * Comparing the two sides is a text match, which is cheap enough to keep
 * honest and catches the whole class of failure at the same moment it is
 * introduced.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");

function read(relative: string): string {
  return readFileSync(join(root, relative), "utf-8");
}

const SOURCES = [
  "mobile/src/main.ts",
  "mobile/src/ui/nav.ts",
  "mobile/src/setup/wizard.ts",
];

/** ids the code looks up, from either helper, including multi-line calls. */
function requiredIds(): Map<string, string> {
  const found = new Map<string, string>();
  for (const file of SOURCES) {
    const source = read(file);
    const patterns = [
      /element<[^>]*>\(\s*"([^"]+)"/gs,
      /\bbyId(?:<[^>]*>)?\(\s*"([^"]+)"/gs,
      /getElementById\(\s*"([^"]+)"\s*\)/gs,
    ];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        found.set(match[1] as string, file);
      }
    }
  }
  return found;
}

function markupIds(): Set<string> {
  const html = read("mobile/index.html");
  return new Set(
    Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1] as string),
  );
}

describe("index.html / TypeScript element contract", () => {
  it("defines every id the code looks up", () => {
    const present = markupIds();
    const missing = [...requiredIds()]
      .filter(([id]) => !present.has(id))
      .map(([id, file]) => `#${id} (looked up in ${file})`);
    expect(missing).toEqual([]);
  });

  it("keeps the four rating buttons the review screen binds by attribute", () => {
    const html = read("mobile/index.html");
    const ratings = [...html.matchAll(/data-rating="(\d)"/g)].map((m) => m[1]);
    expect(ratings).toEqual(["1", "2", "3", "4"]);
  });

  it("keeps a section for every tab the navigation switches between", () => {
    const nav = read("mobile/src/ui/nav.ts");
    const present = markupIds();
    const sections = [
      ...nav.matchAll(/^\s+(\w+): "([a-z-]+)",$/gm),
    ].map((match) => match[2] as string);
    // The two id maps in nav.ts plus the summary constant.
    expect(sections.length).toBeGreaterThanOrEqual(8);
    for (const id of sections) {
      expect(present.has(id), `#${id} is missing from index.html`).toBe(true);
    }
  });

  it("gives every tab button a matching section", () => {
    const html = read("mobile/index.html");
    const tabs = [...html.matchAll(/data-tab="([a-z]+)"/g)].map(
      (match) => match[1] as string,
    );
    expect(new Set(tabs)).toEqual(
      new Set(["learn", "library", "progress", "settings"]),
    );
  });
});
