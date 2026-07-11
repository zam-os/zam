import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, setSetting } from "../../src/kernel/index.js";

// Command-level contract for the agent-connect bridge surface. Detection
// consults the real PATH, so these tests only exercise paths that are
// side-effect free outside the temp HOME: the read-only status probe, the
// explicit `goose` harness (pure config-file write under $HOME), argument
// validation, and the --auto-once marker gate.
describe("bridge agent-harness-status / agent-connect", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-agent-connect-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-agent-connect-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): unknown {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: "utf8",
    });
    return JSON.parse(output);
  }

  it("reports the seven user-scoped harnesses with detection state", () => {
    const result = runBridge(["agent-harness-status"]) as {
      success: boolean;
      zamOnPath: boolean;
      harnesses: Array<{
        harness: string;
        label: string;
        installed: boolean;
        configured: boolean;
        configPath: string;
      }>;
    };

    expect(result.success).toBe(true);
    expect(typeof result.zamOnPath).toBe("boolean");
    expect(result.harnesses).toHaveLength(7);
    expect(result.harnesses.map((h) => h.harness)).not.toContain(
      "claude-code",
    );
    for (const entry of result.harnesses) {
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.installed).toBe("boolean");
      expect(typeof entry.configured).toBe("boolean");
    }
    // Nothing is configured for the ZAM MCP server in a fresh temp HOME.
    expect(result.harnesses.every((h) => !h.configured)).toBe(true);
  });

  it("rejects an unsupported harness id as JSON", () => {
    const result = runBridge(["agent-connect", "--harness", "bogus"]) as {
      success: boolean;
      error: string;
    };
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported harness");
  });

  it("connects an explicit harness idempotently under $HOME", () => {
    const first = runBridge(["agent-connect", "--harness", "goose"]) as {
      success: boolean;
      results: Array<{
        harness: string;
        path: string;
        wrote: boolean;
        alreadyConfigured: boolean;
        content?: string;
      }>;
      skills: { refreshed: number; total: number } | null;
    };

    expect(first.success).toBe(true);
    expect(first.results).toHaveLength(1);
    expect(first.results[0].wrote).toBe(true);
    expect(first.results[0].path.startsWith(tempHome)).toBe(true);
    // The wire payload must not carry raw config bodies.
    expect(first.results[0].content).toBeUndefined();
    expect(first.skills).not.toBeNull();

    const second = runBridge(["agent-connect", "--harness", "goose"]) as {
      success: boolean;
      results: Array<{ wrote: boolean; alreadyConfigured: boolean }>;
    };
    expect(second.success).toBe(true);
    expect(second.results[0].alreadyConfigured).toBe(true);
    expect(second.results[0].wrote).toBe(false);

    // The status probe now reports goose as configured.
    const status = runBridge(["agent-harness-status"]) as {
      harnesses: Array<{ harness: string; configured: boolean }>;
    };
    expect(
      status.harnesses.find((h) => h.harness === "goose")?.configured,
    ).toBe(true);
  });

  it("skips --auto-once when the first-run marker is already set", async () => {
    // The marker is bridge-internal (not in UI_WRITABLE_SETTINGS), so seed it
    // directly in the temp database.
    const db = await openDatabase({
      dbPath: join(tempHome, ".zam", "zam.db"),
      useConfiguredCloud: false,
    });
    await setSetting(db, "agent.connect.auto_done", "true");
    await db.close();

    const result = runBridge(["agent-connect", "--auto-once"]) as {
      success: boolean;
      skipped?: boolean;
    };
    expect(result).toEqual({ success: true, skipped: true });
  });
});
