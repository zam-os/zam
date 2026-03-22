import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { "cli/index": "src/cli/index.ts" },
    outDir: "dist",
    format: ["esm"],
    clean: true,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { index: "src/index.ts" },
    outDir: "dist",
    format: ["esm"],
    dts: true,
    sourcemap: true,
  },
]);
