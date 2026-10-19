/**
 * Order of two tile versions (ADR 2026-10-19 Decision 4).
 *
 * A tile version is a dotted number such as `2026.10.1`. Parts compare as
 * integers, so `2026.10.10` is newer than `2026.10.9`, and a missing trailing
 * part counts as 0. Comparing the strings would put `2026.10.10` first.
 *
 * Returns -1 when `a` is older, 0 when equal, 1 when newer, and null when
 * either value is not a dotted number — then only "same or different" is
 * known.
 */
export function compareTileVersions(
  a: string | null | undefined,
  b: string | null | undefined,
): -1 | 0 | 1 | null {
  const left = parts(a);
  const right = parts(b);
  if (!left || !right) return null;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const x = left[i] ?? 0;
    const y = right[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function parts(version: string | null | undefined): number[] | null {
  if (typeof version !== "string") return null;
  const trimmed = version.trim();
  if (!/^\d+(\.\d+)*$/.test(trimmed)) return null;
  return trimmed.split(".").map((part) => Number.parseInt(part, 10));
}
