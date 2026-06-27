import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Each test shells out to the built CLI several times via execSync. Cold Node
// startup on Windows makes 6–7 spawns exceed Vitest's 5s default, so give these
// process-spawning integration tests generous, file-scoped headroom.
const E2E_TIMEOUT_MS = 30_000;

describe("cli E2E tests", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-e2e-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-e2e-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
  });

  afterEach(() => {
    try {
      rmSync(tempHome, { recursive: true, force: true });
    } catch {
      // best effort
    }
    try {
      rmSync(tempCwd, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  function runCli(args: string[], cwd: string = tempCwd): string {
    const env = {
      ...process.env,
      USERPROFILE: tempHome,
      HOME: tempHome,
    };
    const command = `node "${cliPath}" ${args.join(" ")}`;
    return execSync(command, { env, cwd, encoding: "utf-8" });
  }

  it("can run setup to initialize database and setup identity via whoami", () => {
    // 1. Run setup (initializes DB in tempHome/.zam/zam.db)
    const setupOutput = runCli([
      "setup",
      "--skip-claude-md",
      "--skip-agents-md",
    ]);
    expect(setupOutput).toContain("ZAM database");

    const dbFilePath = join(tempHome, ".zam", "zam.db");
    expect(existsSync(dbFilePath)).toBe(true);

    // 2. Default user is initially unset, so whoami command reports it or defaults
    const defaultWhoami = runCli(["whoami"]);
    expect(defaultWhoami).toBeDefined();

    // 3. Set identity
    const setOutput = runCli(["whoami", "--set", "e2e-test-user"]);
    expect(setOutput).toContain("e2e-test-user");

    // 4. Verify identity is saved and read correctly
    const whoamiOutput = runCli(["whoami"]);
    expect(whoamiOutput).toContain("e2e-test-user");
  }, E2E_TIMEOUT_MS);

  it("can get and set observer policy settings", () => {
    // Initialize DB
    runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);
    runCli(["whoami", "--set", "e2e-test-user"]);

    // Get current scope default
    const initialStatus = JSON.parse(runCli(["observer", "status", "--json"]));
    expect(initialStatus.scope).toBe("window");
    expect(initialStatus.consent).toBe("per-session");

    // Set settings
    runCli(["settings", "set", "observer.scope", "fullscreen"]);
    runCli(["settings", "set", "observer.consent", "standing"]);

    // Verify change via observer status
    const updatedStatus = JSON.parse(runCli(["observer", "status", "--json"]));
    expect(updatedStatus.scope).toBe("fullscreen");
    expect(updatedStatus.consent).toBe("standing");

    // Verify change via settings get
    const settingsGetScope = runCli(["settings", "get", "observer.scope"]);
    expect(settingsGetScope.trim()).toBe("fullscreen");
  }, E2E_TIMEOUT_MS);

  it("bridge get-observer-policy returns the parsed presets", () => {
    runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);
    runCli(["whoami", "--set", "e2e-test-user"]);

    // Get active observer policy when unconfigured -> falls back to shadowing defaults
    const bridgePolicy = JSON.parse(runCli(["bridge", "get-observer-policy"]));
    expect(bridgePolicy.scope).toBe("window");
    expect(bridgePolicy.consent).toBe("per-session");

    // Explicitly configure setting
    runCli(["settings", "set", "observer.scope", "off"]);
    const updatedBridgePolicy = JSON.parse(
      runCli(["bridge", "get-observer-policy"]),
    );
    expect(updatedBridgePolicy.scope).toBe("off");
  }, E2E_TIMEOUT_MS);
});
