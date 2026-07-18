import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readOkfFocus,
  writeOkfFocus,
} from "../../src/cli/okf-focus.js";

describe("okf-focus state file", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-okf-focus-"));
    path = join(dir, "okf-focus.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips file + bundleDir and stamps updatedAt", async () => {
    const now = new Date("2026-07-18T12:00:00.000Z");
    const written = await writeOkfFocus("mcp-surfaces.md", "C:/repo/docs/okf", {
      path,
      now: () => now,
    });
    expect(written.updatedAt).toBe("2026-07-18T12:00:00.000Z");

    const read = await readOkfFocus({ path });
    expect(read).toEqual({
      version: 1,
      file: "mcp-surfaces.md",
      bundleDir: "C:/repo/docs/okf",
      updatedAt: "2026-07-18T12:00:00.000Z",
    });
  });

  it("a newer focus supersedes the older one; bundleDir stays optional", async () => {
    await writeOkfFocus("first.md", "C:/repo/docs/okf", { path });
    await writeOkfFocus("second.md", undefined, { path });
    const read = await readOkfFocus({ path });
    expect(read?.file).toBe("second.md");
    expect(read?.bundleDir).toBeUndefined();
  });

  it("rejects path separators and non-md names", async () => {
    await expect(writeOkfFocus("../evil.md", undefined, { path })).rejects.toThrow(
      /invalid/,
    );
    await expect(writeOkfFocus("sub\\evil.md", undefined, { path })).rejects.toThrow(
      /invalid/,
    );
    await expect(writeOkfFocus("notes.txt", undefined, { path })).rejects.toThrow(
      /invalid/,
    );
  });

  it("returns null for a missing or malformed file", async () => {
    expect(await readOkfFocus({ path })).toBeNull();
    writeFileSync(path, "not json", "utf8");
    expect(await readOkfFocus({ path })).toBeNull();
    writeFileSync(path, JSON.stringify({ version: 2, file: "x.md" }), "utf8");
    expect(await readOkfFocus({ path })).toBeNull();
  });

  it("honors the ZAM_OKF_FOCUS_PATH env override", async () => {
    const envPath = join(dir, "env-focus.json");
    const previous = process.env.ZAM_OKF_FOCUS_PATH;
    process.env.ZAM_OKF_FOCUS_PATH = envPath;
    try {
      await writeOkfFocus("env.md");
      const read = await readOkfFocus();
      expect(read?.file).toBe("env.md");
    } finally {
      if (previous === undefined) {
        delete process.env.ZAM_OKF_FOCUS_PATH;
      } else {
        process.env.ZAM_OKF_FOCUS_PATH = previous;
      }
    }
  });
});
