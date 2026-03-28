/**
 * `zam goal` — Goal management subcommand group.
 *
 * Goals are markdown files in the personal repo's goals/ directory.
 * The directory is configured via the `personal.goals_dir` setting,
 * or defaults to `./goals` relative to the current working directory.
 */

import { Command } from "commander";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { input, select } from "@inquirer/prompts";
import {
  openDatabase,
  getSetting,
  listGoals,
  getGoal,
  createGoal,
  updateGoalStatus,
  getGoalTree,
  extractTasks,
  extractTokenRefs,
} from "../../kernel/index.js";
import type { GoalStatus } from "../../kernel/index.js";

function resolveGoalsDir(): string {
  let goalsDir: string | undefined;

  let db;
  try {
    db = openDatabase();
    goalsDir = getSetting(db, "personal.goals_dir");
  } catch {
    // DB not available — fall back to default
  } finally {
    db?.close();
  }

  return goalsDir ? resolve(goalsDir) : resolve("goals");
}

export const goalCommand = new Command("goal")
  .description("Manage learning goals (markdown files)");

// ── zam goal list ────────────────────────────────────────────────────────────

goalCommand
  .command("list")
  .description("List all goals")
  .option("--status <status>", "Filter by status (active, completed, paused, abandoned)")
  .option("--tree", "Show goals as a tree with parent/child relationships")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const goalsDir = resolveGoalsDir();

    if (!existsSync(goalsDir)) {
      console.error(`Goals directory not found: ${goalsDir}`);
      console.error("Set it with: zam settings set personal.goals_dir /path/to/goals");
      process.exit(1);
    }

    if (opts.tree) {
      const tree = getGoalTree(goalsDir);
      const filtered = opts.status
        ? tree.filter((g) => g.status === opts.status)
        : tree;

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      if (filtered.length === 0) {
        console.log("No goals found.");
        return;
      }

      for (const root of filtered) {
        printGoalLine(root, 0);
        for (const child of root.children) {
          printGoalLine(child, 1);
        }
      }
      return;
    }

    let goals = listGoals(goalsDir);

    if (opts.status) {
      goals = goals.filter((g) => g.status === opts.status);
    }

    if (opts.json) {
      console.log(JSON.stringify(goals, null, 2));
      return;
    }

    if (goals.length === 0) {
      console.log("No goals found.");
      return;
    }

    console.log("Goals:");
    console.log("  " + "─".repeat(70));
    for (const g of goals) {
      printGoalLine(g, 0);
    }
  });

function printGoalLine(
  g: { slug: string; title: string; status: string; taskCount: number; tasksDone: number },
  indent: number,
): void {
  const prefix = "  ".repeat(indent + 1);
  const statusIcon: Record<string, string> = {
    active: "[*]",
    paused: "[-]",
    completed: "[x]",
    abandoned: "[ ]",
  };
  const icon = statusIcon[g.status] || "[ ]";
  const tasks = g.taskCount > 0 ? ` (${g.tasksDone}/${g.taskCount} tasks)` : "";
  console.log(`${prefix}${icon} ${g.title}${tasks}  — ${g.slug}`);
}

// ── zam goal show ────────────────────────────────────────────────────────────

goalCommand
  .command("show <slug>")
  .description("Show a goal's details")
  .option("--json", "Output as JSON")
  .action((slug, opts) => {
    const goalsDir = resolveGoalsDir();
    const goal = getGoal(goalsDir, slug);

    if (!goal) {
      console.error(`Goal not found: ${slug}`);
      process.exit(1);
    }

    if (opts.json) {
      const tasks = extractTasks(goal.body);
      const tokens = extractTokenRefs(goal.body);
      console.log(JSON.stringify({ ...goal, tasks, tokens }, null, 2));
      return;
    }

    console.log(`Title:   ${goal.title}`);
    console.log(`Slug:    ${goal.slug}`);
    console.log(`Status:  ${goal.status}`);
    if (goal.parent) console.log(`Parent:  ${goal.parent}`);
    console.log(`Created: ${goal.created}`);
    console.log(`Updated: ${goal.updated}`);

    const tasks = extractTasks(goal.body);
    if (tasks.length > 0) {
      console.log(`\nTasks (${tasks.filter((t) => t.done).length}/${tasks.length}):`);
      for (const t of tasks) {
        console.log(`  [${t.done ? "x" : " "}] ${t.text}`);
      }
    }

    const tokens = extractTokenRefs(goal.body);
    if (tokens.length > 0) {
      console.log(`\nTokens:`);
      for (const ref of tokens) {
        console.log(`  - ${ref}`);
      }
    }

    if (goal.body) {
      console.log(`\n${"─".repeat(50)}`);
      console.log(goal.body);
    }
  });

// ── zam goal create ──────────────────────────────────────────────────────────

goalCommand
  .command("create")
  .description("Create a new goal")
  .option("--slug <slug>", "Goal slug (used as filename)")
  .option("--title <title>", "Goal title")
  .option("--parent <slug>", "Parent goal slug")
  .option("--description <text>", "Goal description")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    const goalsDir = resolveGoalsDir();

    if (!existsSync(goalsDir)) {
      mkdirSync(goalsDir, { recursive: true });
    }

    let slug = opts.slug;
    let title = opts.title;
    const parent = opts.parent;
    const description = opts.description;

    // Interactive mode if slug or title not provided
    if (!slug || !title) {
      try {
        if (!title) {
          title = await input({ message: "Goal title:" });
        }
        if (!slug) {
          const suggested = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          slug = await input({
            message: "Goal slug (filename):",
            default: suggested,
          });
        }
      } catch (err) {
        if ((err as Error).name === "ExitPromptError") {
          console.log("\nCancelled.");
          process.exit(0);
        }
        throw err;
      }
    }

    const goal = createGoal(goalsDir, { slug, title, parent, description });

    if (opts.json) {
      console.log(JSON.stringify(goal, null, 2));
      return;
    }

    console.log(`Goal created: ${goal.slug}`);
    console.log(`  Title:  ${goal.title}`);
    console.log(`  Status: ${goal.status}`);
    console.log(`  File:   ${goal.filePath}`);
  });

// ── zam goal status ──────────────────────────────────────────────────────────

goalCommand
  .command("status <slug> <status>")
  .description("Update a goal's status (active, paused, completed, abandoned)")
  .option("--json", "Output as JSON")
  .action((slug, status, opts) => {
    const validStatuses: GoalStatus[] = ["active", "completed", "paused", "abandoned"];
    if (!validStatuses.includes(status)) {
      console.error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
      process.exit(1);
    }

    const goalsDir = resolveGoalsDir();
    const goal = updateGoalStatus(goalsDir, slug, status);

    if (opts.json) {
      console.log(JSON.stringify(goal, null, 2));
      return;
    }

    console.log(`Goal ${slug} updated to: ${status}`);
  });
