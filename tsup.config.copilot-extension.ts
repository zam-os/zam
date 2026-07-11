import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "copilot-extension/mcp-client.bundle":
      "src/copilot-extension/mcp-client.ts",
  },
  outDir: "dist",
  format: ["esm"],
  target: "node22",
  platform: "node",
  splitting: false,
  sourcemap: false,
  dts: false,
  clean: false,
  minify: true,
  noExternal: [/.*/],
  outExtension: () => ({ js: ".mjs" }),
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
});
