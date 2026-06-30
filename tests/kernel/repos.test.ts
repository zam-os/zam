import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type Database,
  getRepoPaths,
  openDatabase,
  resolveAllBeliefPaths,
  resolveAllGoalPaths,
  resolveRepoPath,
  setSetting,
  setActiveWorkspaceId,
  upsertConfiguredWorkspace,
} from "../../src/kernel/index.js";

const TEST_DIR = resolve("./temp-test-repos");
const ORIGINAL_ZAM_CONFIG_PATH = process.env.ZAM_CONFIG_PATH;

describe("Multi-Repo Context Settings", () => {
  let db: Database;

  beforeAll(async () => {
    // Create temporary folders for testing directory resolution
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, "personal", "beliefs"), { recursive: true });
    mkdirSync(join(TEST_DIR, "personal", "goals"), { recursive: true });
    mkdirSync(join(TEST_DIR, "team", "beliefs"), { recursive: true });
    mkdirSync(join(TEST_DIR, "org", "goals"), { recursive: true });
    process.env.ZAM_CONFIG_PATH = join(TEST_DIR, "config.json");

    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterAll(async () => {
    await db.close();
    if (ORIGINAL_ZAM_CONFIG_PATH === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = ORIGINAL_ZAM_CONFIG_PATH;
    }
    // Clean up temporary folders
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("should return null paths when nothing is configured", async () => {
    const paths = await getRepoPaths(db);
    expect(paths.personal).toBeNull();
    expect(paths.team).toBeNull();
    expect(paths.org).toBeNull();
  });

  it("should fall back to the active workspace for personal repo", async () => {
    const personalPath = join(TEST_DIR, "personal");
    upsertConfiguredWorkspace({
      id: "personal",
      kind: "personal",
      path: personalPath,
    });
    setActiveWorkspaceId("personal");

    const paths = await getRepoPaths(db);
    expect(paths.personal).toBe(resolve(personalPath));
    expect(paths.team).toBeNull();
    expect(paths.org).toBeNull();
  });

  it("should prefer repo.personal over the active workspace", async () => {
    const personalPath = join(TEST_DIR, "personal");
    const customPersonalPath = join(TEST_DIR, "custom-personal");
    upsertConfiguredWorkspace({
      id: "personal",
      kind: "personal",
      path: personalPath,
    });
    setActiveWorkspaceId("personal");
    await setSetting(db, "repo.personal", customPersonalPath);

    const paths = await getRepoPaths(db);
    expect(paths.personal).toBe(resolve(customPersonalPath));
  });

  it("should resolve team and org repos correctly", async () => {
    const teamPath = join(TEST_DIR, "team");
    const orgPath = join(TEST_DIR, "org");
    await setSetting(db, "repo.team", teamPath);
    await setSetting(db, "repo.org", orgPath);

    const paths = await getRepoPaths(db);
    expect(paths.team).toBe(resolve(teamPath));
    expect(paths.org).toBe(resolve(orgPath));
  });

  it("should resolve single repo path using resolveRepoPath", async () => {
    const personalPath = resolve(join(TEST_DIR, "custom-personal"));
    const resolved = await resolveRepoPath(db, "personal");
    expect(resolved).toBe(personalPath);
  });

  it("should resolve all existing beliefs directories", async () => {
    // Set personal repo to the one with the beliefs folder
    const personalPath = join(TEST_DIR, "personal");
    await setSetting(db, "repo.personal", personalPath);

    const beliefDirs = await resolveAllBeliefPaths(db);
    // Personal and Team have beliefs folder, Org does not
    expect(beliefDirs.length).toBe(2);
    expect(beliefDirs[0]).toBe(resolve(personalPath, "beliefs"));
    expect(beliefDirs[1]).toBe(resolve(join(TEST_DIR, "team", "beliefs")));
  });

  it("should resolve all existing goals directories", async () => {
    const goalDirs = await resolveAllGoalPaths(db);
    // Personal and Org have goals folder, Team does not
    expect(goalDirs.length).toBe(2);
    expect(goalDirs[0]).toBe(resolve(join(TEST_DIR, "personal", "goals")));
    expect(goalDirs[1]).toBe(resolve(join(TEST_DIR, "org", "goals")));
  });
});
