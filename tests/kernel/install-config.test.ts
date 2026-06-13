import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectSyncProvider,
  getInstallMode,
  loadInstallConfig,
  saveInstallConfig,
  setInstallMode,
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

  it("detects file-sync providers from a folder path", () => {
    expect(
      detectSyncProvider(
        "/Users/x/Library/CloudStorage/OneDrive-Personal/zam",
      ),
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
