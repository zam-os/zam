import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

// Every test file gets its own machine config. One `saveMachineAiModels` in a
// block that lacked the per-test isolation rewrote the developer's real
// ~/.zam/config.json (2026-09-21): the fixture row replaced the machine's
// model list and the registry migration carried it into two team libraries.
// Tests that set ZAM_CONFIG_PATH themselves override this per test and restore
// the sandbox path afterwards, so nothing here changes what they see.
const sandbox = mkdtempSync(join(tmpdir(), "zam-test-config-"));
process.env.ZAM_CONFIG_PATH = join(sandbox, "config.json");

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});
