import { describe, expect, it } from "vitest";
import { createMultiDraftController } from "../../mobile/src/multi-draft.js";

describe("multi-draft controller", () => {
  it("walks save and skip across drafts", () => {
    const ctrl = createMultiDraftController(["a", "b", "c"]);
    expect(ctrl.progress()).toEqual({ current: 1, total: 3 });
    expect(ctrl.current()).toBe("a");

    expect(ctrl.saveAndNext()).toBe(true);
    expect(ctrl.current()).toBe("b");
    expect(ctrl.progress()).toEqual({ current: 2, total: 3 });

    expect(ctrl.skip()).toBe(true);
    expect(ctrl.current()).toBe("c");

    expect(ctrl.saveAndNext()).toBe(false);
    expect(ctrl.isDone()).toBe(true);
    expect(ctrl.state()).toMatchObject({ saved: 2, skipped: 1, total: 3 });
  });

  it("rejects an empty draft list", () => {
    expect(() => createMultiDraftController([])).toThrow(/at least one/i);
  });

  it("replaceCurrent updates the head without advancing", () => {
    const ctrl = createMultiDraftController([{ n: 1 }, { n: 2 }]);
    ctrl.replaceCurrent({ n: 9 });
    expect(ctrl.current()).toEqual({ n: 9 });
    expect(ctrl.state().remaining).toHaveLength(2);
  });
});
