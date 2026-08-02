import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the startup crash shipped in 0.27.0 (#274).
 *
 * `initSecretsVault()` labels its card by assigning `textContent` per element.
 * The Alpha badge (`#lbl-settings-secrets-alpha`) sat *inside* the heading
 * (`#lbl-settings-secrets-title`), so writing the heading's textContent
 * deleted the badge — and eight lines later the same function did
 * `requiredElement("lbl-settings-secrets-alpha")`, which threw. That exception
 * escaped the single DOMContentLoaded handler that also calls
 * `loadDashboard()`, so the dashboard never loaded. Because the dashboard's
 * markup is a complete placeholder, the result looked like a working app
 * stuck on "0 due — all caught up" rather than a crash.
 *
 * The rule this enforces: an element that receives `textContent` must not
 * contain another element the same module looks up by id.
 */
const desktopFile = (path: string) =>
  readFileSync(join(process.cwd(), "desktop", path), "utf8");

/**
 * Inner markup of the element carrying `id`, found by walking tags of the same
 * name so a nested `<div>` inside a `<div>` cannot end the scan early.
 */
function innerMarkupOf(html: string, id: string): string | undefined {
  const idIndex = html.indexOf(`id="${id}"`);
  if (idIndex === -1) return undefined;
  const openStart = html.lastIndexOf("<", idIndex);
  const tag = html.slice(openStart + 1).match(/^[a-zA-Z0-9-]+/)?.[0];
  if (!tag) return undefined;
  const openEnd = html.indexOf(">", idIndex);
  if (openEnd === -1) return undefined;
  // Self-closing / void element: nothing can be nested inside it.
  if (html[openEnd - 1] === "/") return "";

  const boundary = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  boundary.lastIndex = openEnd + 1;
  let depth = 1;
  for (let m = boundary.exec(html); m; m = boundary.exec(html)) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(openEnd + 1, m.index);
  }
  return undefined;
}

describe("settings label writes do not delete nested elements", () => {
  const html = desktopFile("index.html");
  const source = desktopFile("src/secrets-vault.ts");

  const writtenIds = [
    ...source.matchAll(/requiredElement(?:<[^>]*>)?\(\s*"([^"]+)"\s*\)\s*\.textContent\s*=/g),
  ].map((match) => match[1]);

  const lookedUpIds = new Set(
    [...source.matchAll(/requiredElement(?:<[^>]*>)?\(\s*"([^"]+)"\s*\)/g)].map(
      (match) => match[1],
    ),
  );

  it("finds the label writes it is meant to check", () => {
    // A rename that breaks the scan must fail loudly, not pass vacuously.
    expect(writtenIds.length).toBeGreaterThan(5);
    expect(lookedUpIds.has("lbl-settings-secrets-alpha")).toBe(true);
  });

  it.each(writtenIds)(
    "#%s holds no other element the module looks up",
    (id) => {
      const inner = innerMarkupOf(html, id);
      expect(inner, `#${id} is not in index.html`).toBeDefined();
      const nested = [...(inner ?? "").matchAll(/id="([^"]+)"/g)]
        .map((match) => match[1])
        .filter((nestedId) => lookedUpIds.has(nestedId));
      expect(
        nested,
        `writing textContent to #${id} would delete ${nested.join(", ")}`,
      ).toEqual([]);
    },
  );

  it("keeps the Alpha badge beside a dedicated title text span", () => {
    const heading = innerMarkupOf(html, "lbl-settings-secrets-title") ?? "";
    expect(heading).toContain('id="lbl-settings-secrets-title-text"');
    expect(heading).toContain('id="lbl-settings-secrets-alpha"');
    expect(source).toContain(
      'requiredElement("lbl-settings-secrets-title-text").textContent',
    );
  });
});
