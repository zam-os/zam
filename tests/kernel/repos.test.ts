import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getRepoPaths,
  openDatabase,
  resolveAllBeliefPaths,
  resolveAllGoalPaths,
  resolveRepoPath,
  setSetting,
} from "../../src/kernel/index.js";

const TEST_DIR = resolve("./temp-test-repos");

describe("Multi-Repo Context Settings", () => {
  let db: any;

  beforeAll(() => {
    // Create temporary folders for testing directory resolution
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, "personal", "beliefs"), { recursive: true });
    mkdirSync(join(TEST_DIR, "personal", "goals"), { recursive: true });
    mkdirSync(join(TEST_DIR, "team", "beliefs"), { recursive: true });
    mkdirSync(join(TEST_DIR, "org", "goals"), { recursive: true });

    db = openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterAll(() => {
    db.close();
    // Clean up temporary folders
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("should return null paths when nothing is configured", () => {
    const paths = getRepoPaths(db);
    expect(paths.personal).toBeNull();
    expect(paths.team).toBeNull();
    expect(paths.org).toBeNull();
  });

  it("should fall back to personal.workspace_dir for personal repo", () => {
    const personalPath = join(TEST_DIR, "personal");
    setSetting(db, "personal.workspace_dir", personalPath);

    const paths = getRepoPaths(db);
    expect(paths.personal).toBe(resolve(personalPath));
    expect(paths.team).toBeNull();
    expect(paths.org).toBeNull();
  });

  it("should prefer repo.personal over personal.workspace_dir", () => {
    const personalPath = join(TEST_DIR, "personal");
    const customPersonalPath = join(TEST_DIR, "custom-personal");
    setSetting(db, "personal.workspace_dir", personalPath);
    setSetting(db, "repo.personal", customPersonalPath);

    const paths = getRepoPaths(db);
    expect(paths.personal).toBe(resolve(customPersonalPath));
  });

  it("should resolve team and org repos correctly", () => {
    const teamPath = join(TEST_DIR, "team");
    const orgPath = join(TEST_DIR, "org");
    setSetting(db, "repo.team", teamPath);
    setSetting(db, "repo.org", orgPath);

    const paths = getRepoPaths(db);
    expect(paths.team).toBe(resolve(teamPath));
    expect(paths.org).toBe(resolve(orgPath));
  });

  it("should resolve single repo path using resolveRepoPath", () => {
    const personalPath = resolve(join(TEST_DIR, "custom-personal"));
    const resolved = resolveRepoPath(db, "personal");
    expect(resolved).toBe(personalPath);
  });

  it("should resolve all existing beliefs directories", () => {
    // Set personal repo to the one with the beliefs folder
    const personalPath = join(TEST_DIR, "personal");
    setSetting(db, "repo.personal", personalPath);

    const beliefDirs = resolveAllBeliefPaths(db);
    // Personal and Team have beliefs folder, Org does not
    expect(beliefDirs.length).toBe(2);
    expect(beliefDirs[0]).toBe(resolve(personalPath, "beliefs"));
    expect(beliefDirs[1]).toBe(resolve(join(TEST_DIR, "team", "beliefs")));
  });

  it("should resolve all existing goals directories", () => {
    const goalDirs = resolveAllGoalPaths(db);
    // Personal and Org have goals folder, Team does not
    expect(goalDirs.length).toBe(2);
    expect(goalDirs[0]).toBe(resolve(join(TEST_DIR, "personal", "goals")));
    expect(goalDirs[1]).toBe(resolve(join(TEST_DIR, "org", "goals")));
  });
});
