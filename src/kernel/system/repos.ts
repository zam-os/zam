import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "../db/types.js";
import { getSetting } from "../models/settings.js";

export interface RepoPaths {
  personal: string | null;
  team: string | null;
  org: string | null;
}

/**
 * Resolve absolute paths for personal, team, and organization repositories.
 * Personal falls back to personal.workspace_dir if repo.personal is not set.
 */
export async function getRepoPaths(db: Database): Promise<RepoPaths> {
  const personalSetting =
    (await getSetting(db, "repo.personal")) ||
    (await getSetting(db, "personal.workspace_dir"));
  const teamSetting = await getSetting(db, "repo.team");
  const orgSetting = await getSetting(db, "repo.org");

  return {
    personal: personalSetting ? resolve(personalSetting) : null,
    team: teamSetting ? resolve(teamSetting) : null,
    org: orgSetting ? resolve(orgSetting) : null,
  };
}

/**
 * Resolve a specific repo's path, or null if not configured.
 */
export async function resolveRepoPath(
  db: Database,
  type: "personal" | "team" | "org",
): Promise<string | null> {
  const paths = await getRepoPaths(db);
  return paths[type];
}

/**
 * Resolve paths to all existing "/beliefs" directories in the hierarchy,
 * sorted from most specific (personal) to most general (org).
 */
export async function resolveAllBeliefPaths(db: Database): Promise<string[]> {
  const paths = await getRepoPaths(db);
  const dirs: string[] = [];

  if (paths.personal) {
    const personalDir = resolve(paths.personal, "beliefs");
    if (existsSync(personalDir)) dirs.push(personalDir);
  }
  if (paths.team) {
    const teamDir = resolve(paths.team, "beliefs");
    if (existsSync(teamDir)) dirs.push(teamDir);
  }
  if (paths.org) {
    const orgDir = resolve(paths.org, "beliefs");
    if (existsSync(orgDir)) dirs.push(orgDir);
  }

  return dirs;
}

/**
 * Resolve paths to all existing "/goals" directories in the hierarchy,
 * sorted from most specific (personal) to most general (org).
 */
export async function resolveAllGoalPaths(db: Database): Promise<string[]> {
  const paths = await getRepoPaths(db);
  const dirs: string[] = [];

  if (paths.personal) {
    const personalDir = resolve(paths.personal, "goals");
    if (existsSync(personalDir)) dirs.push(personalDir);
  }
  if (paths.team) {
    const teamDir = resolve(paths.team, "goals");
    if (existsSync(teamDir)) dirs.push(teamDir);
  }
  if (paths.org) {
    const orgDir = resolve(paths.org, "goals");
    if (existsSync(orgDir)) dirs.push(orgDir);
  }

  return dirs;
}
