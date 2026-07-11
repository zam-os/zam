import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: resolve(import.meta.dirname, "dist/copilot-extension"),
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/copilot-extension/host.ts"),
      formats: ["es"],
      fileName: () => "host.bundle.js",
    },
    minify: true,
    sourcemap: false,
  },
});
