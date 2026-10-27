import { afterEach, describe, expect, it, vi } from "vitest";
import { academyProgress } from "../../src/cli/academy/progress.js";

afterEach(() => vi.useRealTimers());

describe("Academy bridge progress throttle", () => {
  it("throttles intermediate counts while immediately forwarding each phase's first and last count", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000);
    const emit = vi.fn();
    const progress = academyProgress("zam-academy:uml", emit);
    progress({ phase: "installing", done: 0, total: 10 });
    for (let done = 1; done < 10; done++) {
      vi.setSystemTime(1_000 + done * 20);
      progress({ phase: "installing", done, total: 10 });
    }
    // The last count and next phase's first count bypass the 100 ms gate.
    progress({ phase: "installing", done: 10, total: 10 });
    progress({ phase: "enrolling", done: 0, total: 10 });
    expect(emit.mock.calls.map(([event]) => [event.phase, event.done])).toEqual(
      [
        ["installing", 0],
        ["installing", 5],
        ["installing", 10],
        ["enrolling", 0],
      ],
    );
    for (const [event] of emit.mock.calls) {
      expect(event).toMatchObject({
        type: "academy-progress",
        cellId: "zam-academy:uml",
        total: 10,
      });
    }
    progress({ phase: "enrolling", done: 1, total: 10 });
    expect(emit).toHaveBeenCalledTimes(4);
    progress({ phase: "enrolling", done: 10, total: 10 });
    expect(emit).toHaveBeenCalledTimes(5);
  });

  it("emits an empty phase immediately", () => {
    const emit = vi.fn();
    academyProgress(
      "zam-academy:empty",
      emit,
    )({ phase: "enrolling", done: 0, total: 0 });
    expect(emit).toHaveBeenCalledOnce();
  });
});
