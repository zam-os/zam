import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureActiveWorkspace } from "../../src/cli/workspaces/active.js";
import {
  getActiveWorkspaceId,
  getConfiguredWorkspaces,
  getSetting,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

const tempDirs: string[] = [];
const ORIGINAL_ZAM_CONFIG_PATH = process.env.ZAM_CONFIG_PATH;

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-workspace-active-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  if (ORIGINAL_ZAM_CONFIG_PATH === undefined) {
    delete process.env.ZAM_CONFIG_PATH;
  } else {
    process.env.ZAM_CONFIG_PATH = ORIGINAL_ZAM_CONFIG_PATH;
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("active workspace migration", () => {
  it("migrates legacy personal.workspace_dir into the workspace registry", async () => {
    const root = tempDir();
    const workspaceDir = join(root, "workspace");
    mkdirSync(workspaceDir, { recursive: true });
    process.env.ZAM_CONFIG_PATH = join(root, "config.json");

    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      await setSetting(db, "personal.workspace_dir", workspaceDir);

      const active = await ensureActiveWorkspace(db);

      expect(active).toMatchObject({
        id: "personal",
        kind: "personal",
        path: workspaceDir,
      });
      expect(getActiveWorkspaceId()).toBe("personal");
      expect(getConfiguredWorkspaces()).toEqual([
        expect.objectContaining({
          id: "personal",
          kind: "personal",
          path: workspaceDir,
        }),
      ]);
      expect(await getSetting(db, "personal.workspace_dir")).toBeUndefined();
    } finally {
      await db.close();
    }
  });
});
