import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the dashboard crash reported on 0.30.0:
 *
 *   null is not an object (evaluating
 *   'document.getElementById("stats-loading-label").textContent = t("stats_loading")')
 *
 * `#stats-loading-label` ships in `index.html` inside `#stats-activity`, and
 * `loadStatsView()` replaces that container's entire contents. Once the learner
 * had opened the stats view, the element was gone — and the translation pass
 * still asserted it with `!`. The exception escaped into `loadDashboard()`'s
 * catch, so the overview showed "Deine Daten konnten nicht geladen werden".
 *
 * Same family as the 0.27.0 crash guarded by settings-label-nesting.test.ts:
 * markup that some code destroys, looked up by other code as if it were
 * permanent. The rule here: **an element inside a container the module clears
 * wholesale may only be looked up optionally.**
 */
const mainTs = readFileSync(
  join(process.cwd(), "desktop", "src", "main.ts"),
  "utf8",
);
const indexHtml = readFileSync(
  join(process.cwd(), "desktop", "index.html"),
  "utf8",
);

/** Element ids whose contents `main.ts` replaces wholesale. */
function clearedContainerIds(source: string): string[] {
  // Per function body, because names like `container`, `select` and `summary`
  // are re-bound in dozens of functions: matching a clear in one function
  // against a binding in another reports elements that are never touched.
  const cleared = new Set<string>();
  for (const body of source.split(/\n(?=(?:async )?function\s)/)) {
    const bindings = new Map<string, string>();
    for (const match of body.matchAll(
      /(?:const|let)\s+(\w+)\s*=\s*document\.getElementById\(\s*"([^"]+)"\s*\)/g,
    )) {
      bindings.set(match[1], match[2]);
    }
    for (const match of body.matchAll(
      /(\w+)\s*\.\s*(?:innerHTML\s*=\s*""|replaceChildren\(\s*\))/g,
    )) {
      const id = bindings.get(match[1]);
      if (id) cleared.add(id);
    }
  }
  return [...cleared];
}

/** Ids of elements nested inside `containerId` in the shipped markup. */
function nestedIds(html: string, containerId: string): string[] {
  const start = html.indexOf(`id="${containerId}"`);
  if (start === -1) return [];
  const openEnd = html.indexOf(">", start);
  if (openEnd === -1) return [];

  const tagMatch = html.slice(0, start).match(/<(\w+)[^<>]*$/);
  const tag = tagMatch?.[1];
  if (!tag) return [];

  // Walk same-named tags so a nested <div> cannot end the scan early.
  const rest = html.slice(openEnd);
  const scanner = new RegExp(`<${tag}\\b|</${tag}\\s*>`, "gi");
  let depth = 1;
  let end = rest.length;
  for (const token of rest.matchAll(scanner)) {
    depth += token[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      end = token.index ?? rest.length;
      break;
    }
  }

  return [...rest.slice(0, end).matchAll(/id="([^"]+)"/g)].map(
    (match) => match[1],
  );
}

describe("elements inside cleared containers are looked up optionally", () => {
  it("never asserts a transient element with a non-null assertion", () => {
    const offenders: string[] = [];
    for (const containerId of clearedContainerIds(mainTs)) {
      for (const id of nestedIds(indexHtml, containerId)) {
        const asserted = new RegExp(
          `getElementById\\(\\s*"${id}"\\s*\\)\\s*!`,
        ).test(mainTs);
        if (asserted) offenders.push(`#${id} (inside #${containerId})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("recognises the container the crash came from", () => {
    // A guard that silently matched nothing would pass forever.
    expect(clearedContainerIds(mainTs)).toContain("stats-activity");
    expect(nestedIds(indexHtml, "stats-activity")).toContain(
      "stats-loading-label",
    );
  });
});
