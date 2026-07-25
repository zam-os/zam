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
   * Antigravity CLI: cheapest Gemini 3.5 Flash tier that `agy models` exposes
   * today (`gemini-3.5-flash-low` / display "Gemini 3.5 Flash (Low)").
   * Prefer this over 3.6 Flash for cost; Flash-Lite is not yet listed by
   * `agy models` (API id `gemini-3.5-flash-lite` may land later).
   * Verified: `agy --model "Gemini 3.5 Flash (Low)" -p …`.
   */
  antigravity: "Gemini 3.5 Flash (Low)",
  /**
   * GitHub Copilot CLI — prefer Luna over gpt-5-mini: mini is very cheap but
   * slow/weak for one-shot recall. `gpt-5.6-luna` + effort low is ~4–6s and
   * better quality for question rewrite / evaluation (verified via `copilot -p`).
   */
  copilot: "gpt-5.6-luna",
  /** Grok Build: currently the only / default model on SuperGrok. */
  grok: "grok-4.5",
  /**
   * OpenCode / Goose / Hermes: leave unset so the harness's own configured
   * provider/model is used (often API-key based). Learners can still type an
   * explicit id in Settings when the CLI accepts `-m` / `--model`.
   */
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
