import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectSyncProvider,
  getActiveWorkspace,
  getActiveWorkspaceId,
  getConfiguredWorkspaces,
  getInstallMode,
  getMachineAiConfig,
  loadInstallConfig,
  removeConfiguredWorkspace,
  saveInstallConfig,
  saveMachineAiConfig,
  setActiveWorkspaceId,
  setInstallMode,
  upsertConfiguredWorkspace,
} from "../../src/kernel/index.js";

const tempDirs: string[] = [];

function tempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-install-config-"));
  tempDirs.push(dir);
  return join(dir, "config.json");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("install config", () => {
  it("defaults the mode to developer when no config exists", () => {
    expect(getInstallMode(tempConfigPath())).toBe("developer");
  });

  it("round-trips the install mode and creates the file", () => {
    const path = tempConfigPath();
    setInstallMode("default", path);
    expect(getInstallMode(path)).toBe("default");
    expect(loadInstallConfig(path).mode).toBe("default");

    setInstallMode("developer", path);
    expect(getInstallMode(path)).toBe("developer");
  });

  it("preserves unrelated keys when changing the mode", () => {
    const path = tempConfigPath();
    saveInstallConfig({ mode: "developer" }, path);
    // Simulate a future key written by another part of the app.
    const withExtra = { ...loadInstallConfig(path), futureKey: "keep me" };
    writeFileSync(path, JSON.stringify(withExtra), "utf-8");

    setInstallMode("default", path);

    const reloaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(reloaded.mode).toBe("default");
    expect(reloaded.futureKey).toBe("keep me");
  });

  it("returns developer for a corrupt config file", () => {
    const path = tempConfigPath();
    writeFileSync(path, "{ not json", "utf-8");
    expect(getInstallMode(path)).toBe("developer");
  });

  it("round-trips machine-local AI config without touching install mode", () => {
    const path = tempConfigPath();
    saveInstallConfig({ mode: "default" }, path);

    saveMachineAiConfig(
      {
        providers: {
          foundry: {
            label: "Foundry Gemma",
            url: "http://localhost:8000/v1",
            model: "gemma4-it:e4b",
            local: true,
          },
        },
        roles: { recall: { primary: "foundry" } },
      },
      path,
    );

    expect(getInstallMode(path)).toBe("default");
    expect(getMachineAiConfig(path).roles?.recall?.primary).toBe("foundry");
    expect(getMachineAiConfig(path).providers?.foundry?.model).toBe(
      "gemma4-it:e4b",
    );
  });

  it("upserts configured workspaces", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      {
        id: "team",
        kind: "team",
        path: "C:\\src\\Team.Management",
        sourceControl: "azure-devops",
        knowledgeScopes: ["goals", "concepts"],
      },
      path,
    );

    upsertConfiguredWorkspace(
      {
        id: "team",
        label: "Team Management",
        kind: "team",
        path: "D:\\work\\Team.Management",
      },
      path,
    );

    expect(getConfiguredWorkspaces(path)).toEqual([
      {
        id: "team",
        label: "Team Management",
        kind: "team",
        path: "D:\\work\\Team.Management",
      },
    ]);
  });

  it("removes a configured workspace without touching the others", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "family", kind: "family", path: "C:\\family" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "C:\\team" },
      path,
    );

    const remaining = removeConfiguredWorkspace("family", path);

    expect(remaining).toEqual([{ id: "team", kind: "team", path: "C:\\team" }]);
    expect(getConfiguredWorkspaces(path)).toEqual(remaining);
  });

  it("round-trips the active workspace id", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "personal", kind: "personal", path: "/work/personal" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "/work/team" },
      path,
    );

    setActiveWorkspaceId("team", path);

    expect(getActiveWorkspaceId(path)).toBe("team");
    expect(getActiveWorkspace(path)).toEqual({
      id: "team",
      kind: "team",
      path: "/work/team",
    });

    setActiveWorkspaceId(undefined, path);
    expect(getActiveWorkspaceId(path)).toBeUndefined();
    expect(getActiveWorkspace(path)).toBeUndefined();
  });

  it("moves the active workspace id when the active workspace is removed", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "family", kind: "family", path: "C:\\family" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "C:\\team" },
      path,
    );
    setActiveWorkspaceId("family", path);

    const remaining = removeConfiguredWorkspace("family", path);

    expect(remaining).toEqual([{ id: "team", kind: "team", path: "C:\\team" }]);
    expect(getActiveWorkspaceId(path)).toBe("team");
    expect(getActiveWorkspace(path)?.path).toBe("C:\\team");
  });

  it("detects file-sync providers from a folder path", () => {
    expect(
      detectSyncProvider("/Users/x/Library/CloudStorage/OneDrive-Personal/zam"),
    ).toBe("OneDrive");
    expect(detectSyncProvider("/Users/x/Dropbox/zam")).toBe("Dropbox");
    expect(
      detectSyncProvider(
        "/Users/x/Library/CloudStorage/GoogleDrive-x/My Drive/zam",
      ),
    ).toBe("Google Drive");
    expect(
      detectSyncProvider(
        "/Users/x/Library/Mobile Documents/com~apple~CloudDocs/zam",
      ),
    ).toBe("iCloud Drive");
    expect(detectSyncProvider("/Users/x/Documents/zam")).toBeNull();
  });
});
