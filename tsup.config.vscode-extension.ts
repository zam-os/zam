import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "vscode-extension/extension": "src/vscode-extension/extension.ts",
  },
  outDir: "dist",
  format: ["cjs"],
  target: "node22",
  platform: "node",
  // Shim import.meta.url in the CJS bundle: bundled ESM sources (e.g. the
  // kernel public API) may reference it, and an unshimmed reference compiles
  // to `undefined` — which crashed extension activation in 0.10.11.
  shims: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  clean: false,
  minify: true,
  external: ["vscode"],
  noExternal: [/^(?!vscode$).*/],
  outExtension: () => ({ js: ".cjs" }),
});
