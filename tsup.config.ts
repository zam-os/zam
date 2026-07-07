import { defineConfig } from "tsup";

export default defineConfig([
  {
    // The bin bootstrap. `./app.js` stays a runtime import (external) so a
    // stale or half-built dist is caught and classified rather than inlined
    // away; the bundle itself must depend on Node builtins only.
    entry: { "cli/index": "src/cli/index.ts" },
    outDir: "dist",
    format: ["esm"],
    clean: true,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
    external: ["./app.js"],
  },
  {
    // The program, plus the MCP transport as its own bundle so that
    // @modelcontextprotocol/sdk and zod stay out of the eager module graph
    // (ADR 2026-07-07). app.ts's dynamic import of "./commands/mcp.js"
    // resolves at runtime against the mcp bundle below.
    entry: {
      "cli/app": "src/cli/app.ts",
      "cli/commands/mcp": "src/cli/commands/mcp.ts",
    },
    outDir: "dist",
    format: ["esm"],
    // No shared chunks: esbuild's esm splitting would add runtime-resolved
    // chunk files (and a mid-command kernel chunk via bridge-handlers' dynamic
    // import) — load failures must stay pre-side-effect so the bootstrap's
    // heal-and-re-exec model holds (ADR 2026-07-07). Duplicated kernel code
    // between app.js and mcp.js is process-local and accepted.
    splitting: false,
    sourcemap: true,
    external: ["./commands/mcp.js"],
  },
  {
    entry: { index: "src/index.ts" },
    outDir: "dist",
    format: ["esm"],
    dts: true,
    sourcemap: true,
  },
]);
