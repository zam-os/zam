import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Builds the MCP Apps Studio panel into a single self-contained HTML file
 * (dist/ui/studio-panel.html) that `zam mcp` serves as the ui://zam/studio
 * resource. Self-containment matters: the panel iframe runs under a
 * deny-by-default CSP, so all JS/CSS must be inlined.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, "desktop/src/panel"),
  plugins: [viteSingleFile()],
  build: {
    outDir: resolve(import.meta.dirname, "dist/ui"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, "desktop/src/panel/studio-panel.html"),
    },
  },
});
