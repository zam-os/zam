/**
 * Shared option handling for the review activity series (ADR 2026-08-01).
 *
 * `zam stats` and `zam bridge stats-activity` take the same `--period` /
 * `--window` pair and must agree on what they mean, so the parsing and the
 * per-period defaults live here rather than in each command.
 */

import {
  type ActivityPeriod,
  DEFAULT_ACTIVITY_WINDOWS,
} from "../../../kernel/index.js";

const PERIODS: ActivityPeriod[] = ["day", "week", "month"];

/** Validate a `--period` value, or throw with the accepted set. */
export function resolveActivityPeriod(value: unknown): ActivityPeriod {
  if (typeof value === "string" && (PERIODS as string[]).includes(value)) {
    return value as ActivityPeriod;
  }
  throw new Error(
    `Invalid period: ${String(value)} (expected day, week, or month)`,
  );
}

/**
 * Validate a `--window` value, falling back to the per-period default.
 *
 * The window counts *periods*, not days: `--period week --window 12` is the
 * current ISO week plus the eleven before it.
 */
export function resolveActivityWindow(
  value: unknown,
  period: ActivityPeriod,
): number {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_ACTIVITY_WINDOWS[period];
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--window must be a positive integer");
  }
  return parsed;
}
