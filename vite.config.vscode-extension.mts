import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: resolve(import.meta.dirname, "dist/vscode-extension"),
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/vscode-extension/host.ts"),
      formats: ["es"],
      fileName: () => "host.bundle.js",
    },
    minify: true,
    sourcemap: false,
  },
});
