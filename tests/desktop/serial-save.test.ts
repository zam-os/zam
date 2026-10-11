import { describe, expect, it } from "vitest";
import { serialSave } from "../../desktop/src/serial-save.js";

/**
 * Settings → Study plan saves as it changes. A change during a running save
 * must neither start a parallel save nor be lost (PR #402 review).
 */

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("serialSave", () => {
  it("runs one save at a time and folds changes during a save into one more", async () => {
    const runs: Array<{
      done: ReturnType<typeof deferred>;
      isStale: () => boolean;
    }> = [];
    const save = serialSave((isStale) => {
      const done = deferred();
      runs.push({ done, isStale });
      return done.promise;
    });

    const first = save();
    expect(runs).toHaveLength(1);
    expect(runs[0].isStale()).toBe(false);

    // Two changes while the first save runs: no parallel save, the first is stale.
    void save();
    void save();
    expect(runs).toHaveLength(1);
    expect(runs[0].isStale()).toBe(true);

    runs[0].done.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(runs).toHaveLength(2);
    expect(runs[1].isStale()).toBe(false);

    runs[1].done.resolve();
    await first;
    expect(runs).toHaveLength(2);

    // Idle again: the next change starts a fresh save at once.
    void save();
    expect(runs).toHaveLength(3);
    runs[2].done.resolve();
  });

  it("is ready for the next change after a save fails", async () => {
    let calls = 0;
    const save = serialSave(async () => {
      calls += 1;
      if (calls === 1) throw new Error("bridge down");
    });
    await expect(save()).rejects.toThrow("bridge down");
    await save();
    expect(calls).toBe(2);
  });
});
