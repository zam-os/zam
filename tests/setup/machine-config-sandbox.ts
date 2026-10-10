import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll } from "vitest";

// Every test file gets its own home directory, so no test can write the
// developer's ~/.zam. Sandboxing the home rather than ZAM_CONFIG_PATH covers
// every ~/.zam file at once (config, credentials, zam.db, monitor, observer,
// Bitwarden session), since those paths are taken from `homedir()` when the
// modules load, after this file runs. It also leaves tests that spawn the CLI
// with their own HOME working: an inherited ZAM_CONFIG_PATH would win over the
// home they set up.
const sandbox = mkdtempSync(join(tmpdir(), "zam-test-home-"));
process.env.HOME = sandbox;
process.env.USERPROFILE = sandbox;

// Explicit path overrides from the developer's shell would bypass the sandbox.
for (const name of [
  "ZAM_CONFIG_PATH",
  "ZAM_BW_SESSION_PATH",
  "ZAM_OBSERVER_DIR",
  "ZAM_OKF_FOCUS_PATH",
  "ZAM_UI_INTENT_PATH",
  "ZAM_PENDING_IMPORTS_DIR",
]) {
  delete process.env[name];
}

// The macOS Keychain, the Secret Service and DPAPI belong to the developer,
// not to the sandboxed home: no test may write them (ADR 2026-10-08b D5).
// Tests that need OS-protected storage inject a fake store.
process.env.ZAM_OS_SECRET_STORE = "off";

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});
