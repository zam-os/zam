import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "vscode-extension/extension": "src/vscode-extension/extension.ts",
  },
  outDir: "dist",
  format: ["cjs"],
  target: "node22",
  platform: "node",
  splitting: false,
  sourcemap: false,
  dts: false,
  clean: false,
  minify: true,
  external: ["vscode"],
  noExternal: [/^(?!vscode$).*/],
  outExtension: () => ({ js: ".cjs" }),
});
