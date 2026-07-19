import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "../../src/cli/curriculum/concurrency.js";

describe("mapWithConcurrency", () => {
  it("bounds active work and preserves input order", async () => {
    let active = 0;
    let peak = 0;

    const results = await mapWithConcurrency(
      [1, 2, 3, 4, 5],
      2,
      async (item) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5 * (6 - item)));
        active--;
        return item * 10;
      },
    );

    expect(peak).toBe(2);
    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it("uses one worker when concurrency is non-positive", async () => {
    let active = 0;
    let peak = 0;

    await mapWithConcurrency([1, 2, 3], 0, async (item) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      return item;
    });

    expect(peak).toBe(1);
  });

  it("waits for active work and stops scheduling after a failure", async () => {
    const started: number[] = [];
    let activeWorkerFinished = false;

    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (item) => {
        started.push(item);
        if (item === 1) throw new Error("generation failed");
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeWorkerFinished = true;
        return item;
      }),
    ).rejects.toThrow("generation failed");

    expect(activeWorkerFinished).toBe(true);
    expect(started).toEqual([1, 2]);
  });
});
