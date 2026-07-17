import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

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
    plugins: [viteSingleFile()],
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
