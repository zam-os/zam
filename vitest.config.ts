import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Every test file gets its own throw-away home directory; see the file.
    setupFiles: ["tests/setup/machine-config-sandbox.ts"],
    // The self-hosted Windows-on-ARM runner is slow enough that Vitest's 5 s
    // default trips on tests that are fine everywhere else: one CLI
    // subprocess call (`execFileSync(node, dist/cli/index.js, …)`) costs
    // 0.5–2.5 s there, and even a few in-process suites (`mobile/ai-connect`,
    // `kernel/system`) pass 5 s under worker contention (0.42.0 release PR,
    // then #352's first run). One global budget; splitting the suites into
    // separately timed projects only doubled the parallelism and moved the
    // timeouts onto the unit tests.
    testTimeout: 30_000,
  },
});
