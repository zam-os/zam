import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

// Every test file gets its own home directory. One `saveMachineAiModels` in a
// block that lacked the per-test isolation rewrote the developer's real
// ~/.zam/config.json (2026-09-21): the fixture row replaced the machine's
// model list and the registry migration carried it into two team libraries.
//
// Sandboxing the home rather than ZAM_CONFIG_PATH covers every ~/.zam file at
// once (config, credentials, zam.db, monitor, Bitwarden session), since those
// paths are taken from `homedir()` when the modules load, after this file runs.
// It also leaves tests that spawn the CLI with their own HOME working: an
// inherited ZAM_CONFIG_PATH would win over the home they set up.
const sandbox = mkdtempSync(join(tmpdir(), "zam-test-home-"));
process.env.HOME = sandbox;
process.env.USERPROFILE = sandbox;

// Explicit path overrides from the developer's shell would bypass the sandbox.
for (const name of [
  "ZAM_CONFIG_PATH",
  "ZAM_BW_SESSION_PATH",
  "ZAM_OKF_FOCUS_PATH",
  "ZAM_UI_INTENT_PATH",
]) {
  delete process.env[name];
}

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});
