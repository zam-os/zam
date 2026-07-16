/**
 * Companion context/evaluator selection precedence (ADR 2026-07-16 §Decision 4,
 * 0.11.0 Phase 1).
 *
 * One generic precedence rule governs both "which learner is in scope" and
 * "which evaluator is in scope": an explicit value supplied for the current
 * invocation wins, then a manual context-bar choice, then the persisted
 * Companion preference, then a legacy default. The function is pure — it
 * takes candidate values, never reads or writes `~/.zam/config.json` itself
 * (Phase 2 owns that I/O) — so opening-argument handling stays testable
 * without a live MCP host or filesystem.
 *
 * The `sessionScoped` flag on the result is the load-bearing bit: an
 * "invocation" value must never be written back as the persisted preference.
 * Only a "manual" (context-bar) choice may be persisted. Callers that skip
 * checking this flag would silently turn one test-profile invocation into
 * everyone's new default — the exact regression this ADR was written to
 * prevent (see the 121-card `thomas` incident in the ADR's Context section).
 */

export type SelectionSource = "invocation" | "manual" | "persisted" | "default";

export interface SelectionCandidates<T> {
  /** Explicit value passed for this one invocation (e.g. MCP tool arguments). */
  invocation?: T;
  /** A choice made in the context bar during the current mounted session. */
  manual?: T;
  /** The persisted Companion preference from `~/.zam/config.json`. */
  persisted?: T;
  /** Legacy default (e.g. the database's `user.id` setting, or quick mode). */
  fallback: T;
}

export interface SelectionResult<T> {
  value: T;
  source: SelectionSource;
  /**
   * True only when `source === "invocation"`. Callers must gate any write to
   * persisted preference storage on `!sessionScoped` — an invocation value is
   * scoped to one mounted app instance and reverts on the next open/reload.
   */
  sessionScoped: boolean;
}

/**
 * Resolve one context value (learner or evaluator) by precedence:
 * invocation > manual > persisted > fallback. Never mutates its input.
 */
export function resolveSelection<T>(
  candidates: SelectionCandidates<T>,
): SelectionResult<T> {
  if (candidates.invocation !== undefined) {
    return {
      value: candidates.invocation,
      source: "invocation",
      sessionScoped: true,
    };
  }
  if (candidates.manual !== undefined) {
    return { value: candidates.manual, source: "manual", sessionScoped: false };
  }
  if (candidates.persisted !== undefined) {
    return {
      value: candidates.persisted,
      source: "persisted",
      sessionScoped: false,
    };
  }
  return {
    value: candidates.fallback,
    source: "default",
    sessionScoped: false,
  };
}

/**
 * Whether a resolved selection may be written as the new persisted
 * preference. Only a manual context-bar choice qualifies — invocation values
 * stay session-scoped, and re-persisting the already-persisted or default
 * value is a harmless no-op that callers may skip.
 */
export function isPersistableSelection<T>(result: SelectionResult<T>): boolean {
  return result.source === "manual";
}
