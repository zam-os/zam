/**
 * Default harness model ids for agent-backed entries (ADR 2026-07-12a).
 *
 * Prefer the cheapest capable model per subscription so learners don't burn
 * frontier quota by accident. Callers may override via ModelEntry.model /
 * Settings. Ids are whatever the harness CLI accepts (`claude --model`,
 * `codex -m`, `agy --model`).
 */

/** Cheapest practical defaults — bump when vendors rename. */
export const DEFAULT_AGENT_MODELS: Readonly<Record<string, string>> = {
  /** Claude Code alias for the latest Haiku (Haiku 4.5 class). */
  "claude-code": "haiku",
  /** Codex: small/fast GPT-5.4 mini (verified in local models_cache). */
  codex: "gpt-5.4-mini",
  /**
   * Antigravity CLI display name for the lowest Flash tier (verified with
   * `agy --model "Gemini 3.6 Flash (Low)" -p …`).
   */
  antigravity: "Gemini 3.6 Flash (Low)",
  /**
   * Reserved for a future GitHub Copilot text adapter (user preference).
   * Not registered in getAgentAdapter yet.
   */
  copilot: "gpt-5-mini",
};

/**
 * Default model id for a harness, or undefined when we have no recommendation.
 * Placeholders like `agent:claude-code` are never returned.
 */
export function defaultAgentModel(harness: string): string | undefined {
  return DEFAULT_AGENT_MODELS[harness];
}

/**
 * Resolve the model string stored on / passed to an agent ModelEntry.
 * - Explicit `--model` / form value wins.
 * - Existing non-placeholder model is kept on update.
 * - Otherwise the harness default (or `agent:<harness>` as last resort).
 */
export function resolveAgentModelId(
  harness: string,
  explicit?: string | null,
  previous?: string | null,
): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  if (previous?.trim() && !previous.startsWith("agent:")) {
    return previous.trim();
  }
  return defaultAgentModel(harness) ?? `agent:${harness}`;
}
