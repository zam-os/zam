import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Machine-local configuration (workspaces, active knowledge context) lives in
 * ~/.zam/config.json and must stay readable and writable when the configured
 * cloud database is unreachable (issue #162). These tests point the bridge at
 * a Turso URL that refuses connections and expect the machine-local commands
 * to keep working.
 */
describe("bridge machine-local config with unreachable cloud DB", () => {
  let tempHome: string;
  let tempCwd: string;
  let workspaceDir: string;
  let cliPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-offline-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-offline-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    workspaceDir = join(tempHome, "workspace");
    mkdirSync(workspaceDir, { recursive: true });

    // Cloud DB that always refuses connections (nothing listens on port 9).
    writeFileSync(
      join(dataDir, "credentials.json"),
      `${JSON.stringify({
        turso: {
          url: "https://127.0.0.1:9",
          token: "unreachable-fixture-token",
          mode: "remote",
        },
      })}\n`,
    );

    writeFileSync(
      join(dataDir, "config.json"),
      `${JSON.stringify({
        workspaces: [
          {
            id: "w1",
            label: "Workspace One",
            kind: "personal",
            path: workspaceDir,
            activeKnowledgeContext: "work",
          },
        ],
        activeWorkspaceId: "w1",
      })}\n`,
    );
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

  it("lists configured workspaces without a database connection", () => {
    const result = runBridge(["workspace-list"]) as {
      workspaces: Array<{ id: string }>;
      activeWorkspaceId: string;
      workspaceDir: string;
    };
    expect(result.activeWorkspaceId).toBe("w1");
    expect(result.workspaceDir).toBe(workspaceDir);
    expect(result.workspaces).toEqual([
      expect.objectContaining({ id: "w1", label: "Workspace One" }),
    ]);
  });

  it("returns the machine-local active knowledge context without validation", () => {
    expect(runBridge(["get-active-knowledge-context"])).toMatchObject({
      success: true,
      activeContext: "work",
    });
  });

  it("clears the active knowledge context without a database connection", () => {
    expect(runBridge(["set-active-knowledge-context", "none"])).toMatchObject({
      success: true,
      activeContext: null,
    });
    expect(runBridge(["get-active-knowledge-context"])).toMatchObject({
      success: true,
      activeContext: null,
    });
  });
});
