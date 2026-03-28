/**
 * Goal Engine — manages goal lifecycle via markdown files.
 *
 * Goals live as markdown files in a directory (typically the personal repo's
 * goals/ folder). The engine reads, creates, and updates these files.
 * It does not depend on the database — goals are git-tracked, not DB-tracked.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import {
  parseGoalFile,
  serializeGoal,
  extractTasks,
  extractTokenRefs,
} from "./parser.js";
import type { Goal, GoalStatus } from "./parser.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GoalSummary {
  slug: string;
  title: string;
  status: GoalStatus;
  parent: string | null;
  taskCount: number;
  tasksDone: number;
  tokenCount: number;
}

export interface CreateGoalInput {
  slug: string;
  title: string;
  status?: GoalStatus;
  parent?: string;
  description?: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * List all goals in the goals directory.
 * Returns summaries sorted by status (active first) then title.
 */
export function listGoals(goalsDir: string): GoalSummary[] {
  if (!existsSync(goalsDir)) return [];

  const files = readdirSync(goalsDir).filter(
    (f) => f.endsWith(".md") && f !== "README.md",
  );

  const summaries: GoalSummary[] = [];

  for (const file of files) {
    const filePath = join(goalsDir, file);
    const content = readFileSync(filePath, "utf-8");
    const slug = basename(file, ".md");
    const goal = parseGoalFile(content, slug, filePath);
    const tasks = extractTasks(goal.body);
    const tokens = extractTokenRefs(goal.body);

    summaries.push({
      slug: goal.slug,
      title: goal.title,
      status: goal.status,
      parent: goal.parent,
      taskCount: tasks.length,
      tasksDone: tasks.filter((t) => t.done).length,
      tokenCount: tokens.length,
    });
  }

  const statusOrder: Record<GoalStatus, number> = {
    active: 0,
    paused: 1,
    completed: 2,
    abandoned: 3,
  };

  summaries.sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.title.localeCompare(b.title);
  });

  return summaries;
}

/**
 * Get a single goal by slug (filename without .md).
 * Returns undefined if the file doesn't exist.
 */
export function getGoal(goalsDir: string, slug: string): Goal | undefined {
  const filePath = join(goalsDir, `${slug}.md`);
  if (!existsSync(filePath)) return undefined;

  const content = readFileSync(filePath, "utf-8");
  return parseGoalFile(content, slug, filePath);
}

/**
 * Create a new goal file. Throws if a goal with this slug already exists.
 */
export function createGoal(goalsDir: string, input: CreateGoalInput): Goal {
  const filePath = join(goalsDir, `${input.slug}.md`);

  if (existsSync(filePath)) {
    throw new Error(`Goal already exists: ${input.slug}`);
  }

  const now = new Date().toISOString().slice(0, 10);

  const goal: Goal = {
    slug: input.slug,
    title: input.title,
    status: input.status ?? "active",
    parent: input.parent ?? null,
    created: now,
    updated: now,
    body: input.description
      ? `## Description\n${input.description}\n\n## Tasks\n\n## Tokens`
      : "## Description\n\n## Tasks\n\n## Tokens",
    filePath,
  };

  writeFileSync(filePath, serializeGoal(goal), "utf-8");
  return goal;
}

/**
 * Update a goal's status. Writes the updated file back to disk.
 */
export function updateGoalStatus(
  goalsDir: string,
  slug: string,
  status: GoalStatus,
): Goal {
  const goal = getGoal(goalsDir, slug);
  if (!goal) throw new Error(`Goal not found: ${slug}`);

  goal.status = status;
  goal.updated = new Date().toISOString().slice(0, 10);

  writeFileSync(goal.filePath, serializeGoal(goal), "utf-8");
  return goal;
}

/**
 * Get the goal tree — goals organized by parent relationships.
 * Returns root goals (no parent) with nested children.
 */
export function getGoalTree(goalsDir: string): Array<GoalSummary & { children: GoalSummary[] }> {
  const all = listGoals(goalsDir);
  const bySlug = new Map(all.map((g) => [g.slug, g]));

  const roots: Array<GoalSummary & { children: GoalSummary[] }> = [];
  const children = new Map<string, GoalSummary[]>();

  for (const g of all) {
    if (g.parent && bySlug.has(g.parent)) {
      const list = children.get(g.parent) ?? [];
      list.push(g);
      children.set(g.parent, list);
    }
  }

  for (const g of all) {
    if (!g.parent || !bySlug.has(g.parent)) {
      roots.push({ ...g, children: children.get(g.slug) ?? [] });
    }
  }

  return roots;
}
