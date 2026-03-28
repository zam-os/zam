/**
 * Goal file parser — reads markdown files with YAML-style frontmatter.
 *
 * Goals are persisted as markdown files in the personal repo.
 * Each file has simple key: value frontmatter (no nested structures)
 * and a markdown body with description, tasks, and token references.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type GoalStatus = "active" | "completed" | "paused" | "abandoned";

export interface Goal {
  slug: string;          // derived from filename (e.g., "learn-rust" from "learn-rust.md")
  title: string;
  status: GoalStatus;
  parent: string | null; // slug of parent goal
  created: string;       // ISO date
  updated: string;       // ISO date
  body: string;          // markdown body after frontmatter
  filePath: string;      // absolute path to the file
}

export interface GoalFrontmatter {
  title?: string;
  status?: string;
  parent?: string;
  created?: string;
  updated?: string;
}

// ── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse a goal markdown file into a Goal object.
 *
 * Expected format:
 * ```
 * ---
 * title: Learn Rust fundamentals
 * status: active
 * parent: become-systems-programmer
 * created: 2026-03-28
 * updated: 2026-03-28
 * ---
 *
 * ## Description
 * ...
 * ```
 *
 * @param content - Raw file content
 * @param slug - Goal slug (derived from filename by caller)
 * @param filePath - Absolute path to the file
 */
export function parseGoalFile(content: string, slug: string, filePath: string): Goal {
  const { frontmatter, body } = splitFrontmatter(content);

  const validStatuses: GoalStatus[] = ["active", "completed", "paused", "abandoned"];
  const status = validStatuses.includes(frontmatter.status as GoalStatus)
    ? (frontmatter.status as GoalStatus)
    : "active";

  const now = new Date().toISOString().slice(0, 10);

  return {
    slug,
    title: frontmatter.title || slug,
    status,
    parent: frontmatter.parent || null,
    created: frontmatter.created || now,
    updated: frontmatter.updated || now,
    body,
    filePath,
  };
}

/**
 * Serialize a Goal back to markdown with frontmatter.
 */
export function serializeGoal(goal: Goal): string {
  const lines = [
    "---",
    `title: ${goal.title}`,
    `status: ${goal.status}`,
  ];

  if (goal.parent) {
    lines.push(`parent: ${goal.parent}`);
  }

  lines.push(`created: ${goal.created}`);
  lines.push(`updated: ${goal.updated}`);
  lines.push("---");
  lines.push("");

  if (goal.body.trim()) {
    lines.push(goal.body.trim());
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Extract tasks (checklist items) from goal body.
 * Returns items like { text: "Complete Rustlings", done: false }.
 */
export function extractTasks(body: string): Array<{ text: string; done: boolean }> {
  const tasks: Array<{ text: string; done: boolean }> = [];
  const taskRegex = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = taskRegex.exec(body)) !== null) {
    tasks.push({
      done: match[1] !== " ",
      text: match[2].trim(),
    });
  }

  return tasks;
}

/**
 * Extract token references from goal body.
 * Looks for lines like `- token/slug` under a "## Tokens" section.
 */
export function extractTokenRefs(body: string): string[] {
  const tokensSection = body.match(/## Tokens\n([\s\S]*?)(?=\n## |\n*$)/);
  if (!tokensSection) return [];

  const refs: string[] = [];
  const lines = tokensSection[1].split("\n");

  for (const line of lines) {
    const match = line.match(/^[-*]\s+(\S+)/);
    if (match) {
      refs.push(match[1]);
    }
  }

  return refs;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function splitFrontmatter(content: string): { frontmatter: GoalFrontmatter; body: string } {
  const trimmed = content.trim();

  if (!trimmed.startsWith("---")) {
    return { frontmatter: {}, body: trimmed };
  }

  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: trimmed };
  }

  const fmBlock = trimmed.slice(3, endIndex).trim();
  const body = trimmed.slice(endIndex + 3).trim();

  const frontmatter: GoalFrontmatter = {};
  for (const line of fmBlock.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key && value) {
      (frontmatter as Record<string, string>)[key] = value;
    }
  }

  return { frontmatter, body };
}
