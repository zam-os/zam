import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

function isHtmlInvalidCodePoint(value: string): boolean {
  const codePoint = value.codePointAt(0);
  if (codePoint === undefined) return false;
  return (
    codePoint <= 0x08 ||
    (codePoint >= 0x0b && codePoint <= 0x0c) ||
    (codePoint >= 0x0e && codePoint <= 0x1f) ||
    (codePoint >= 0x7f && codePoint <= 0x9f) ||
    (codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
    (codePoint >= 0xfffe && (codePoint & 0xffff) >= 0xfffe)
  );
}

function escapeAsJavaScriptCodeUnits(value: string): string {
  let escaped = "";
  for (let index = 0; index < value.length; index += 1) {
    escaped += `\\u${value.charCodeAt(index).toString(16).padStart(4, "0")}`;
  }
  return escaped;
}

function escapeInvalidJavaScriptCodePoints(source: string): string {
  let escaped = "";
  for (const value of source) {
    escaped += isHtmlInvalidCodePoint(value)
      ? escapeAsJavaScriptCodeUnits(value)
      : value;
  }
  return escaped;
}

/**
 * Mermaid's generated parser tables contain a few literal control and
 * noncharacter code points. Browsers tolerate them in inline scripts, but
 * strict MCP hosts can reject the resulting HTML resource. Escaping the
 * literals in the JavaScript chunk preserves their runtime value while
 * keeping the self-contained panel valid HTML.
 *
 * This plugin must run immediately before viteSingleFile so it can still see
 * the generated JavaScript chunk before that chunk is embedded in the HTML.
 */
function escapeInvalidInlineScriptCodePoints(): Plugin {
  return {
    name: "zam:escape-invalid-inline-script-code-points",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        output.code = escapeInvalidJavaScriptCodePoints(output.code);
      }
    },
  };
}

/**
 * Builds one MCP Apps panel into a single self-contained HTML file under
 * dist/ui/ that `zam mcp` serves as a ui://zam/* resource. Self-containment
 * matters: the panel iframe runs under a deny-by-default CSP, so all JS/CSS
 * must be inlined.
 *
 * vite-plugin-singlefile is single-input by design (multi-entry is wontfix
 * upstream), so we build once per entry, selecting the input via Vite's
 * --mode flag. The default mode ("production", no flag) builds the studio
 * panel and clears dist/ui first; every other mode appends its panel without
 * emptying the directory, so `build:panel` can chain the entries.
 */
const MODE_TO_INPUT: Record<string, string> = {
  recall: "recall-panel.html",
  graph: "graph-panel.html",
  settings: "settings-panel.html",
  okf: "okf-panel.html",
};

export default defineConfig(({ mode }) => {
  const input = MODE_TO_INPUT[mode] ?? "studio-panel.html";
  const isDefaultEntry = input === "studio-panel.html";
  return {
    root: resolve(import.meta.dirname, "desktop/src/panel"),
    plugins: [escapeInvalidInlineScriptCodePoints(), viteSingleFile()],
    build: {
      outDir: resolve(import.meta.dirname, "dist/ui"),
      // Only the first (default) entry clears dist/ui; later entries append.
      emptyOutDir: isDefaultEntry,
      rollupOptions: {
        input: resolve(import.meta.dirname, "desktop/src/panel", input),
      },
    },
  };
});
