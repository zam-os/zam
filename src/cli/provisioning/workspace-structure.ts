/**
 * Personal-workspace structure provisioning (ADR 2026-07-24 §4, plan Phase 6).
 *
 * The default personal workspace is regenerable infrastructure, not precious:
 * an ordinary directory the user may delete, move, or empty. This module owns
 * the fresh-setup structure (`beliefs/`, `goals/`, `skills/`, seed files) in
 * exactly one place, shared by `zam init`, the onboarding wizard, and the
 * Studio repair action, so the fronts cannot drift.
 *
 * Repair is ADDITIVE ONLY: it creates what is missing and never overwrites or
 * deletes a file the user has written — "fresh setup" on an existing directory
 * means *complete*, not *reset*. The learning database lives in `~/.zam`,
 * outside every workspace, so losing a workspace directory never loses cards.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_DIRS = ["beliefs", "goals", "skills"] as const;

const WORLDVIEW_SEED = `# Personal Worldview

Here, I declare the core concepts and principles I want to master.

- **Conceptual Autonomy**: I value deep conceptual understanding over copy-pasting rote procedures.
- **Continuous Retention**: I use spaced repetition to prevent my professional skills from decaying.
`;

const GOALS_SEED = `# Personal Goals

- **[ ] Learn Spaced Repetition Core Concepts**
  - #fsrs-stability
  - #fsrs-difficulty
`;

const SEED_FILES: ReadonlyArray<{ rel: string; content: string }> = [
  { rel: join("beliefs", "worldview.md"), content: WORLDVIEW_SEED },
  { rel: join("goals", "goals.md"), content: GOALS_SEED },
];

export interface WorkspaceStructureStatus {
  /** Whether the workspace directory itself exists. */
  dirExists: boolean;
  /** Relative paths (dirs + seed files) a repair would create. */
  missing: string[];
  /** True when the directory exists and nothing is missing. */
  complete: boolean;
}

/** Read-only probe of the fresh-setup structure under `dir`. */
export function inspectWorkspaceStructure(
  dir: string,
): WorkspaceStructureStatus {
  const dirExists = existsSync(dir);
  const missing: string[] = [];
  for (const sub of WORKSPACE_DIRS) {
    if (!existsSync(join(dir, sub))) missing.push(sub);
  }
  for (const seed of SEED_FILES) {
    if (!existsSync(join(dir, seed.rel))) missing.push(seed.rel);
  }
  return { dirExists, missing, complete: dirExists && missing.length === 0 };
}

export interface WorkspaceStructureReport {
  /** Relative paths created by this run (dirs + seed files). */
  created: string[];
  /** Seed files that already existed and were deliberately left untouched. */
  preserved: string[];
}

/**
 * Create the fresh-setup structure under `dir`, additively: missing
 * directories and seed files are created, existing files — including
 * user-edited seeds — are never touched. Safe to run any number of times.
 */
export function ensureWorkspaceStructure(
  dir: string,
): WorkspaceStructureReport {
  const created: string[] = [];
  const preserved: string[] = [];

  for (const sub of WORKSPACE_DIRS) {
    const path = join(dir, sub);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      created.push(sub);
    }
  }

  for (const seed of SEED_FILES) {
    const path = join(dir, seed.rel);
    if (existsSync(path)) {
      preserved.push(seed.rel);
    } else {
      writeFileSync(path, seed.content, "utf8");
      created.push(seed.rel);
    }
  }

  return { created, preserved };
}
