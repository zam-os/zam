import { describe, expect, it } from "vitest";
import { nextRadioIndex } from "../../desktop/src/radio-group.js";
import { nextRadioIndex as mobileNextRadioIndex } from "../../mobile/src/ui/radio-group.js";

describe("radio group keyboard steps", () => {
  it("moves forward and backward with both axes", () => {
    expect(nextRadioIndex("ArrowRight", 0, 2)).toBe(1);
    expect(nextRadioIndex("ArrowDown", 0, 2)).toBe(1);
    expect(nextRadioIndex("ArrowLeft", 1, 2)).toBe(0);
    expect(nextRadioIndex("ArrowUp", 1, 2)).toBe(0);
  });

  it("wraps around, so either arrow reaches the other of two choices", () => {
    expect(nextRadioIndex("ArrowRight", 1, 2)).toBe(0);
    expect(nextRadioIndex("ArrowLeft", 0, 2)).toBe(1);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextRadioIndex("Home", 2, 3)).toBe(0);
    expect(nextRadioIndex("End", 0, 3)).toBe(2);
  });

  it("leaves every other key to the browser", () => {
    for (const key of ["Enter", " ", "Tab", "a", "Escape"]) {
      expect(nextRadioIndex(key, 0, 2)).toBeNull();
    }
  });

  it("does nothing when focus is outside the group or nothing can be stepped", () => {
    expect(nextRadioIndex("ArrowRight", -1, 2)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 0, 1)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 0, 0)).toBeNull();
    expect(nextRadioIndex("ArrowRight", 2, 2)).toBeNull();
  });

  it("behaves identically in the mobile copy", () => {
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "Enter"]) {
      for (const current of [-1, 0, 1]) {
        expect(mobileNextRadioIndex(key, current, 2)).toBe(
          nextRadioIndex(key, current, 2),
        );
      }
    }
  });
});
