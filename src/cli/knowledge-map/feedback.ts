/**
 * Learner feedback on the knowledge-map views (ADR 2026-10-03, Decision 6).
 *
 * Kept on this machine next to `config.json`; nothing is sent anywhere. The
 * Studio offers to copy it so a tester can pass it on deliberately.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type FeedbackFound = "yes" | "partly" | "no";

export interface KnowledgeMapFeedback {
  view: string;
  /** 1 (not helpful) to 5 (very helpful). */
  helpful: number;
  found: FeedbackFound | null;
  comment: string;
  at: string;
}

export const MAX_FEEDBACK_COMMENT = 2000;

export function defaultFeedbackPath(): string {
  const configPath =
    process.env.ZAM_CONFIG_PATH || join(homedir(), ".zam", "config.json");
  return join(dirname(configPath), "knowledge-map-feedback.json");
}

export function listKnowledgeMapFeedback(
  path = defaultFeedbackPath(),
): KnowledgeMapFeedback[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(parsed) ? (parsed as KnowledgeMapFeedback[]) : [];
  } catch {
    return [];
  }
}

export function parseFeedbackInput(input: {
  view?: unknown;
  helpful?: unknown;
  found?: unknown;
  comment?: unknown;
}): KnowledgeMapFeedback {
  const view = typeof input.view === "string" ? input.view.trim() : "";
  if (!/^[a-z][a-z0-9-]*$/.test(view)) {
    throw new Error("view must be a view id such as focus, outline or levels");
  }
  const helpful = Number(input.helpful);
  if (!Number.isInteger(helpful) || helpful < 1 || helpful > 5) {
    throw new Error("helpful must be a whole number from 1 to 5");
  }
  let found: FeedbackFound | null = null;
  if (input.found !== undefined && input.found !== null && input.found !== "") {
    if (
      input.found !== "yes" &&
      input.found !== "partly" &&
      input.found !== "no"
    ) {
      throw new Error("found must be yes, partly or no");
    }
    found = input.found;
  }
  const comment =
    typeof input.comment === "string"
      ? input.comment.trim().slice(0, MAX_FEEDBACK_COMMENT)
      : "";
  return { view, helpful, found, comment, at: new Date().toISOString() };
}

export function appendKnowledgeMapFeedback(
  entry: KnowledgeMapFeedback,
  path = defaultFeedbackPath(),
): KnowledgeMapFeedback[] {
  const entries = [...listKnowledgeMapFeedback(path), entry];
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  return entries;
}
