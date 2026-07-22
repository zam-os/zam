import { describe, expect, it, vi } from "vitest";
import {
  classifySyncError,
  SyncError,
  syncWithRetry,
} from "../../mobile/src/sync.js";

const noDelay = () => Promise.resolve();

describe("classifySyncError", () => {
  it("treats credential rejections as auth failures", () => {
    for (const message of [
      "401 Unauthorized",
      "server returned HTTP 403",
      "authentication failed",
      "auth token is invalid",
      "the token has expired",
      "permission denied",
    ]) {
      expect(classifySyncError(message)).toBe("auth");
    }
  });

  it("treats network and unknown failures as transient", () => {
    for (const message of [
      "connection reset by peer",
      "dns lookup failed",
      "request timed out",
      "stream closed",
    ]) {
      expect(classifySyncError(message)).toBe("transient");
    }
  });
});

describe("syncWithRetry", () => {
  it("runs the sync once when it succeeds", async () => {
    const sync = vi.fn().mockResolvedValue(undefined);
    await syncWithRetry(sync, { delay: noDelay });
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures until one succeeds", async () => {
    const sync = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockRejectedValueOnce(new Error("timed out"))
      .mockResolvedValue(undefined);
    const onRetry = vi.fn();

    await syncWithRetry(sync, { attempts: 3, delay: noDelay, onRetry });

    expect(sync).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ attempt: 1 });
  });

  it("throws a transient SyncError after exhausting attempts", async () => {
    const sync = vi.fn().mockRejectedValue(new Error("still offline"));

    await expect(
      syncWithRetry(sync, { attempts: 3, delay: noDelay }),
    ).rejects.toMatchObject({ name: "SyncError", kind: "transient" });
    expect(sync).toHaveBeenCalledTimes(3);
  });

  it("never retries an auth failure", async () => {
    const sync = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));
    const onRetry = vi.fn();

    await expect(
      syncWithRetry(sync, { attempts: 5, delay: noDelay, onRetry }),
    ).rejects.toBeInstanceOf(SyncError);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("backs off with a capped exponential delay", async () => {
    const sync = vi.fn().mockRejectedValue(new Error("temporary"));
    const waits: number[] = [];

    await expect(
      syncWithRetry(sync, {
        attempts: 5,
        backoffMs: 500,
        maxBackoffMs: 1500,
        delay: (ms) => {
          waits.push(ms);
          return Promise.resolve();
        },
      }),
    ).rejects.toBeInstanceOf(SyncError);

    // 500, 1000, then capped at 1500 for the remaining retries before the throw.
    expect(waits).toEqual([500, 1000, 1500, 1500]);
    expect(sync).toHaveBeenCalledTimes(5);
  });
});
