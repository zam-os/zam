/**
 * Goal breakdown text (ADR 2026-07-24 §3). The confirmed decomposition is
 * written into the goal file, and card generation reads the same lines, so a
 * card's `context` quote is always a line of the file it cites.
 */

export interface GoalBreakdownItem {
  label: string;
  description: string;
}

/**
 * The `### Breakdown` section appended to a goal's description; empty when
 * nothing was confirmed.
 */
export function formatGoalBreakdown(
  path: readonly string[],
  outline: readonly GoalBreakdownItem[],
): string {
  if (outline.length === 0) return "";
  return [
    "",
    "### Breakdown",
    ...(path.length > 0 ? [`Path: ${path.join(" → ")}`, ""] : []),
    ...outline.map((item) => `- **${item.label}** — ${item.description}`),
  ].join("\n");
}

/**
 * Curriculum text for ONE confirmed topic: the goal's framing plus that
 * topic's breakdown line. Card generation runs once per topic so each
 * request stays small enough to finish inside an agent harness's budget,
 * and a failing topic never discards the topics that already succeeded.
 */
export function goalTopicCurriculumText(input: {
  title: string;
  description: string;
  path: readonly string[];
  topic: GoalBreakdownItem;
}): string {
  const lines = [`# ${input.title.trim()}`];
  const description = input.description.trim();
  if (description) lines.push("", description);
  return `${lines.join("\n")}\n${formatGoalBreakdown(input.path, [input.topic])}`;
}
