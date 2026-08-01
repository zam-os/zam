import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getOkfFocusPath,
  readOkfFocus,
  writeOkfFocus,
} from "../../src/cli/okf-focus.js";
import {
  getUiHostFocusPath,
  getUiHostsDirPath,
  type UiHostEntry,
} from "../../src/cli/ui-intent.js";

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
    await expect(
      writeOkfFocus("../evil.md", undefined, { path }),
    ).rejects.toThrow(/invalid/);
    await expect(
      writeOkfFocus("sub\\evil.md", undefined, { path }),
    ).rejects.toThrow(/invalid/);
    await expect(
      writeOkfFocus("notes.txt", undefined, { path }),
    ).rejects.toThrow(/invalid/);
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

describe("okf-focus is scoped per Companion window", () => {
  let home: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "zam-okf-focus-home-"));
  });

  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
  });

  function registerWindow(hostId: string, workspace: string): void {
    const dir = getUiHostsDirPath(home);
    mkdirSync(dir, { recursive: true });
    const entry: UiHostEntry = {
      version: 2,
      hostId,
      intentPath: join(home, ".zam", "intents", `${hostId}.json`),
      workspace,
      focused: false,
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(join(dir, `${hostId}.json`), JSON.stringify(entry), "utf8");
  }

  it("resolves the article of the window the reader works in", async () => {
    registerWindow("vscode-a", "/src/alpha");
    registerWindow("vscode-b", "/src/beta");
    await writeOkfFocus("alpha.md", "/src/alpha/docs/okf", {
      home,
      hostId: "vscode-a",
    });
    await writeOkfFocus("beta.md", "/src/beta/docs/okf", {
      home,
      hostId: "vscode-b",
    });

    // Two windows browsing the knowledge base used to overwrite one shared
    // snapshot, so the agent got whichever window painted last.
    expect((await readOkfFocus({ home, cwd: "/src/alpha" }))?.file).toBe(
      "alpha.md",
    );
    expect((await readOkfFocus({ home, cwd: "/src/beta" }))?.file).toBe(
      "beta.md",
    );
  });

  it("also writes the unscoped file for surfaces outside a window", async () => {
    await writeOkfFocus("shared.md", undefined, { home, hostId: "vscode-a" });

    expect((await readOkfFocus({ path: getOkfFocusPath(home) }))?.file).toBe(
      "shared.md",
    );
  });

  it("falls back to the unscoped file when no window matches", async () => {
    await writeOkfFocus("desktop.md", undefined, { home });

    // A writer without a host id — the desktop app — reaches a reader that
    // resolves no window.
    expect((await readOkfFocus({ home, cwd: "/src/elsewhere" }))?.file).toBe(
      "desktop.md",
    );
  });

  it("falls back when the matched window has no focus recorded yet", async () => {
    registerWindow("vscode-a", "/src/alpha");
    await writeOkfFocus("desktop.md", undefined, { home });

    expect((await readOkfFocus({ home, cwd: "/src/alpha" }))?.file).toBe(
      "desktop.md",
    );
  });

  it("prefers the window's article over a newer unscoped one", async () => {
    registerWindow("vscode-a", "/src/alpha");
    await writeOkfFocus("windowed.md", undefined, {
      home,
      hostId: "vscode-a",
      now: () => new Date("2026-08-01T09:00:00.000Z"),
    });
    writeFileSync(
      getOkfFocusPath(home),
      JSON.stringify({
        version: 1,
        file: "newer-elsewhere.md",
        updatedAt: "2026-08-01T10:00:00.000Z",
      }),
      "utf8",
    );

    // The agent is working inside one window; that window's reader is the
    // one it means, however recently another surface painted.
    expect((await readOkfFocus({ home, cwd: "/src/alpha" }))?.file).toBe(
      "windowed.md",
    );
    expect(getUiHostFocusPath("vscode-a", home)).toBe(
      join(home, ".zam", "focus", "vscode-a.json"),
    );
  });
});
