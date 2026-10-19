import { describe, expect, it } from "vitest";
import { compareTileVersions } from "../../src/kernel/index.js";

describe("compareTileVersions", () => {
  it("compares parts as numbers, not as text", () => {
    expect(compareTileVersions("2026.10.10", "2026.10.9")).toBe(1);
    expect(compareTileVersions("2026.10.9", "2026.10.10")).toBe(-1);
    expect(compareTileVersions("2026.9.1", "2026.10.1")).toBe(-1);
  });

  it("treats equal versions and missing trailing parts as the same", () => {
    expect(compareTileVersions("2026.10.1", "2026.10.1")).toBe(0);
    expect(compareTileVersions("2026.10", "2026.10.0")).toBe(0);
    expect(compareTileVersions(" 2026.10.1 ", "2026.10.1")).toBe(0);
  });

  it("knows no order for anything that is not a dotted number", () => {
    expect(compareTileVersions("older", "2026.10.1")).toBeNull();
    expect(compareTileVersions("2026.10.1-beta", "2026.10.1")).toBeNull();
    expect(compareTileVersions("", "2026.10.1")).toBeNull();
    expect(compareTileVersions(null, "2026.10.1")).toBeNull();
    expect(compareTileVersions("2026.10.1", undefined)).toBeNull();
  });
});
