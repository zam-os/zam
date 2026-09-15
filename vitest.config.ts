import { defineConfig } from "vitest/config";

/**
 * Two timeout tiers. `tests/cli` and `tests/integration` drive the built CLI
 * as a subprocess (`execFileSync(node, dist/cli/index.js, …)`), and one such
 * call costs 0.5–2.5 s on the self-hosted Windows-on-ARM runner — a test with
 * a handful of them overruns Vitest's 5 s default there (0.42.0 release PR:
 * `bridge-knowledge-contexts` at 5.2 s). Everything else stays at the default
 * so a genuinely hung unit test still fails fast.
 */
const SUBPROCESS_TEST_TIMEOUT_MS = 30_000;

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "unit",
          globals: true,
          include: ["tests/**/*.test.ts"],
          exclude: [
            "**/node_modules/**",
            "tests/cli/**",
            "tests/integration/**",
          ],
        },
      },
      {
        test: {
          name: "cli",
          globals: true,
          include: ["tests/cli/**/*.test.ts", "tests/integration/**/*.test.ts"],
          testTimeout: SUBPROCESS_TEST_TIMEOUT_MS,
        },
      },
    ],
  },
});
