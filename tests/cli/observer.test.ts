import { describe, expect, it } from "vitest";
import { applyObserverListChange } from "../../src/cli/commands/observer.js";

describe("applyObserverListChange", () => {
  it("adds a normalized entry to an empty list", () => {
    expect(applyObserverListChange("", "Calculator", "add")).toBe("calculator");
    expect(applyObserverListChange(undefined, "Notepad", "add")).toBe(
      "notepad",
    );
  });

  it("appends without duplicating (case-insensitive)", () => {
    expect(applyObserverListChange("calculator", "notepad", "add")).toBe(
      "calculator,notepad",
    );
    expect(
      applyObserverListChange("calculator,notepad", "Calculator", "add"),
    ).toBe("calculator,notepad");
  });

  it("removes an entry", () => {
    expect(
      applyObserverListChange("calculator,notepad", "notepad", "remove"),
    ).toBe("calculator");
  });

  it("treats removing a missing entry as a no-op", () => {
    expect(applyObserverListChange("calculator", "signal", "remove")).toBe(
      "calculator",
    );
  });

  it("normalizes the existing list (trim, case, dedupe)", () => {
    expect(applyObserverListChange("  Calc , calc ", "notepad", "add")).toBe(
      "calc,notepad",
    );
  });
});
