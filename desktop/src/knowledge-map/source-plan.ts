/**
 * Which map Quellen draws (ADR 2026-10-10, Decisions 6 and 8).
 * The skill source never falls back to ZAM's example map.
 */

export type SourceMapDraw = "own" | "example" | "none";

export type SourceMapNotice =
  | "sample"
  | "invalid-example"
  | "invalid-own"
  | "missing";

export function planSourceMap(input: {
  skillSource: boolean;
  found: boolean;
  valid: boolean;
}): { draw: SourceMapDraw; notice: SourceMapNotice | null } {
  if (input.valid) return { draw: "own", notice: null };
  if (input.skillSource) {
    return {
      draw: "none",
      notice: input.found ? "invalid-own" : "missing",
    };
  }
  return {
    draw: "example",
    notice: input.found ? "invalid-example" : "sample",
  };
}
