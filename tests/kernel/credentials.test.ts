import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCredentials, saveCredentials } from "../../src/kernel/index.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("credential storage", () => {
  it("writes credentials and tightens Unix permissions", () => {
    const root = mkdtempSync(join(tmpdir(), "zam-credentials-"));
    tempDirs.push(root);
    const path = join(root, ".zam", "credentials.json");

    saveCredentials({ turso: { url: "libsql://db", token: "secret" } }, path);

    expect(loadCredentials(path)).toEqual({
      turso: { url: "libsql://db", token: "secret" },
    });
    if (process.platform !== "win32") {
      expect(statSync(dirname(path)).mode & 0o777).toBe(0o700);
      expect(statSync(path).mode & 0o777).toBe(0o600);
    }
  });
});
