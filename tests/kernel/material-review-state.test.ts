import { describe, expect, it } from "vitest";
import {
  analysisLine,
  changedAreas,
  confirmCounts,
  decisionsOf,
  initialChoices,
  type MaterialReviewRowShape,
  materialAreaGroups,
  reviewGroups,
  startsCollapsed,
} from "../../src/kernel/import/material-review-state.js";

/**
 * The review list's rules, shared by the desktop Studio, its MCP Apps panel
 * and Mobile (ADR 2026-10-05 Decisions 5, 7, 8).
 */

const rows: MaterialReviewRowShape[] = [
  { kind: "proposal", id: "p:0", proposalIndex: 0, preset: null },
  {
    kind: "existing",
    id: "e:0",
    besideProposal: 0,
    preset: "yes",
    held: false,
  },
  { kind: "proposal", id: "p:1", proposalIndex: 1, preset: "bonus" },
  {
    kind: "existing",
    id: "e:1",
    besideProposal: 1,
    preset: null,
    held: true,
  },
  { kind: "continuation", id: "c:x", preset: "bonus" },
];

describe("material review state", () => {
  it("starts on presets, leaves held items out, and counts what confirm does", () => {
    const choices = initialChoices(rows);
    expect(choices).toEqual({
      "p:0": null,
      "e:0": "yes",
      "p:1": "bonus",
      "c:x": "bonus",
    });
    expect(confirmCounts(rows, choices)).toEqual({
      yes: 1,
      bonus: 2,
      notSaved: 1,
    });
    expect(decisionsOf(choices)).toEqual({
      "e:0": "yes",
      "p:1": "bonus",
      "c:x": "bonus",
    });
  });

  it("groups by proposed area, the existing item right after its proposal", () => {
    const groups = materialAreaGroups([
      { area: "chemie/stoffe" },
      { area: "physik/optik" },
    ]);
    expect(groups).toEqual([
      { area: "chemie/stoffe", proposalIndexes: [0] },
      { area: "physik/optik", proposalIndexes: [1] },
    ]);
    const grouped = reviewGroups(rows, groups);
    expect(grouped.groups.map((g) => g.rows.map((r) => r.id))).toEqual([
      ["p:0", "e:0"],
      ["p:1", "e:1"],
    ]);
    expect(grouped.continuations.map((r) => r.id)).toEqual(["c:x"]);
  });

  it("keeps only changed areas, folds Bonus on long lists, and names the analysis", () => {
    expect(
      changedAreas({
        "chemie/stoffe": " chemie/stoffe ",
        physik: "physik/optik",
      }),
    ).toEqual({ physik: "physik/optik" });
    expect(startsCollapsed(rows[2], { "p:1": "bonus" }, 13)).toBe(true);
    expect(startsCollapsed(rows[2], { "p:1": "bonus" }, 12)).toBe(false);
    expect(
      analysisLine({ subjects: ["chemie"], topic: "Stoffe", level: " " }),
    ).toBe("chemie · Stoffe");
  });
});
