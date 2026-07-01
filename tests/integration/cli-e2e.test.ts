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

  it("can manage personal cards via bridge commands", () => {
    runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);
    runCli(["whoami", "--set", "e2e-test-user"]);

    // 1. Create a card
    const createRes = JSON.parse(
      runCli([
        "bridge",
        "personal-card-create",
        "--concept",
        '"testing bridge concept"',
        "--domain",
        "testing",
        "--question",
        '"what is testing?"',
      ])
    );
    expect(createRes.success).toBe(true);
    expect(createRes.token.concept).toBe("testing bridge concept");
    expect(createRes.token.domain).toBe("testing");
    expect(createRes.token.slug).toBe("testing-what-is-testing");

    // 2. List cards
    const listRes = JSON.parse(runCli(["bridge", "personal-card-list"]));
    expect(listRes.cards).toHaveLength(1);
    expect(listRes.cards[0].slug).toBe("testing-what-is-testing");

    // 3. Update the card
    const updateRes = JSON.parse(
      runCli([
        "bridge",
        "personal-card-update",
        "--slug",
        "testing-what-is-testing",
        "--concept",
        '"updated testing concept"',
      ])
    );
    expect(updateRes.success).toBe(true);
    expect(updateRes.token.concept).toBe("updated testing concept");

    // 4. Remove card (preview)
    const removePreviewRes = JSON.parse(
      runCli(["bridge", "personal-card-remove", "--slug", "testing-what-is-testing"])
    );
    expect(removePreviewRes.success).toBe(true);
    expect(removePreviewRes.preview).toBe(true);
    expect(removePreviewRes.impact.review_logs).toBeDefined();

    // 5. Remove card (confirm)
    const removeConfirmRes = JSON.parse(
      runCli([
        "bridge",
        "personal-card-remove",
        "--slug",
        "testing-what-is-testing",
        "--confirm",
      ])
    );
    expect(removeConfirmRes.success).toBe(true);
    expect(removeConfirmRes.deletedCard).toBeDefined();

    // 6. Verify card is removed but token remains (so it has no cardId)
    const listRes2 = JSON.parse(runCli(["bridge", "personal-card-list"]));
    expect(listRes2.cards).toHaveLength(1);
    expect(listRes2.cards[0].cardId).toBeNull();

    // 7. Verify import-curriculum command integration structure
    try {
      runCli([
        "bridge",
        "personal-card-import-curriculum",
        "--text",
        '"Objective: learn git branch"',
        "--domain",
        "git"
      ]);
      expect(true).toBe(false);
    } catch (err: any) {
      const output = err.stdout || err.stderr || String(err.message || err);
      expect(output).toContain("LLM");
    }

    // 8. Verify split commands integration structure
    try {
      runCli([
        "bridge",
        "personal-card-split-proposals",
        "--slug",
        "testing-what-is-testing"
      ]);
      expect(true).toBe(false);
    } catch (err: any) {
      const output = err.stdout || err.stderr || String(err.message || err);
      expect(output).toContain("LLM");
    }
  }, E2E_TIMEOUT_MS);
});
