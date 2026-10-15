import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Mobile renders card text with the Studio's renderer and reads model card
 * text with the kernel's reader (ADR 2026-10-14b, plan Phase 8). Both end up
 * in the WebView bundle, so nothing they import may reach a Node built-in.
 * This walks their relative imports; a bare specifier must be a package the
 * WebView can load.
 */

const ENTRIES = [
  "desktop/src/card-text-render.ts",
  "desktop/src/card-text-editor.ts",
  "src/kernel/library/card-text-input.ts",
  "src/kernel/library/card-text-placeholders.ts",
  "src/cli/llm/speech-prompt.ts",
];
const NODE_BUILTINS =
  /^(node:|fs$|path$|os$|crypto$|child_process$|url$|stream$|util$|zlib$)/;
const ALLOWED_PACKAGES = new Set(["temml", "ulid"]);

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of source.matchAll(
    /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g,
  )) {
    found.push(match[1] ?? match[2]);
  }
  return found;
}

function resolveRelative(from: string, specifier: string): string | null {
  const base = resolve(dirname(from), specifier);
  for (const candidate of [base.replace(/\.js$/, ".ts"), base, `${base}.ts`]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

describe("card text in Mobile's bundle", () => {
  it("reaches no Node built-in", () => {
    const root = process.cwd();
    const seen = new Set<string>();
    const offenders: string[] = [];
    const queue = ENTRIES.map((entry) => join(root, entry));
    while (queue.length > 0) {
      const file = queue.pop() as string;
      if (seen.has(file) || file.endsWith(".json") || file.endsWith(".css")) {
        continue;
      }
      seen.add(file);
      for (const specifier of importsOf(file)) {
        if (specifier.startsWith(".")) {
          const next = resolveRelative(file, specifier);
          if (next) queue.push(next);
          continue;
        }
        const name = specifier.split("/")[0];
        if (NODE_BUILTINS.test(specifier) || !ALLOWED_PACKAGES.has(name)) {
          offenders.push(`${file.slice(root.length + 1)} → ${specifier}`);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(offenders).toEqual([]);
  });
});
