import { execFile } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resetBwExecutableCache,
  resolveBwCommand,
  scriptFromWindowsShim,
} from "../../src/kernel/secrets/bw-executable.js";

/**
 * ADR 2026-07-30b: `execFile` does not apply PATHEXT on Windows, so an
 * npm-installed `bw.cmd` was never found and the vault always reported
 * "not installed". Node also refuses to spawn `.cmd`/`.bat` without a shell —
 * and a shell is exactly what Decision 11 rules out, because it would put the
 * master password back on a command line other processes can read.
 *
 * The resolver is driven by an explicit `platform` here so the Windows
 * behaviour is covered on every runner, not only on Windows.
 */
describe("resolveBwCommand", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-bw-exec-"));
    resetBwExecutableCache();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    resetBwExecutableCache();
  });

  const win = (env: NodeJS.ProcessEnv) =>
    resolveBwCommand({ platform: "win32", env, useCache: false });

  it("spawns the bare name on POSIX", () => {
    expect(
      resolveBwCommand({ platform: "darwin", env: { PATH: dir } }),
    ).toEqual({ file: "bw", prefixArgs: [] });
    expect(resolveBwCommand({ platform: "linux", env: { PATH: dir } })).toEqual(
      { file: "bw", prefixArgs: [] },
    );
  });

  it("prefers a real bw.exe on Windows and spawns it directly", () => {
    writeFileSync(join(dir, "bw.exe"), "MZ");
    expect(win({ PATH: dir })).toEqual({
      file: join(dir, "bw.exe"),
      prefixArgs: [],
    });
  });

  it("runs the script an npm bw.cmd shim wraps, with our own Node", () => {
    // A real npm shim, trimmed: the payload is the quoted .js path.
    const scriptDir = join(dir, "node_modules", "@bitwarden", "cli", "build");
    mkdirSync(scriptDir, { recursive: true });
    writeFileSync(join(scriptDir, "bw.js"), "// entry point");
    writeFileSync(
      join(dir, "bw.cmd"),
      [
        "@ECHO off",
        'SETLOCAL\r\nCALL :find_dp0\r\nIF EXIST "%dp0%\\node.exe" (',
        '  SET "_prog=%dp0%\\node.exe"',
        ") ELSE (",
        '  SET "_prog=node"',
        ")",
        'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\@bitwarden\\cli\\build\\bw.js" %*',
      ].join("\r\n"),
    );

    const resolved = win({ PATH: dir });
    // Not the .cmd itself: Node refuses to spawn one without a shell.
    expect(resolved.file).toBe(process.execPath);
    expect(resolved.prefixArgs).toEqual([join(scriptDir, "bw.js")]);
  });

  it("resolves the exact shim shape the e2e suite writes", () => {
    // Kept in step with tests/integration/credential-secret-backends-e2e.ts:
    // that suite's Windows stub is `node "%~dp0bw.mjs" %*`, and this resolver
    // failed on precisely that shape once already.
    writeFileSync(join(dir, "bw.mjs"), "// fake bw");
    writeFileSync(
      join(dir, "bw.cmd"),
      '@echo off\r\nnode "%~dp0bw.mjs" %*\r\n',
    );
    expect(win({ PATH: dir })).toEqual({
      file: process.execPath,
      prefixArgs: [join(dir, "bw.mjs")],
    });
  });

  it("returns a command that actually runs", async () => {
    // Shape assertions alone would not have caught the .mjs bug's real
    // consequence; this spawns what the resolver returns, the way runBw does.
    writeFileSync(
      join(dir, "bw.mjs"),
      'process.stdout.write("bw " + process.argv.slice(2).join(","));',
    );
    writeFileSync(
      join(dir, "bw.cmd"),
      '@echo off\r\nnode "%~dp0bw.mjs" %*\r\n',
    );
    const { file, prefixArgs } = win({ PATH: dir });

    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync(file, [...prefixArgs, "--version"], {
      encoding: "utf8",
    });
    expect(stdout).toBe("bw --version");
  });

  it("takes bw.exe over a shim when both are on PATH", () => {
    writeFileSync(join(dir, "bw.exe"), "MZ");
    writeFileSync(join(dir, "bw.cmd"), '"%dp0%\\whatever.js"');
    expect(win({ PATH: dir }).file).toBe(join(dir, "bw.exe"));
  });

  it("searches PATH in order", () => {
    const first = join(dir, "a");
    const second = join(dir, "b");
    mkdirSync(first);
    mkdirSync(second);
    writeFileSync(join(second, "bw.exe"), "MZ");
    expect(win({ PATH: [first, second].join(delimiter) }).file).toBe(
      join(second, "bw.exe"),
    );
  });

  it("falls back to the bare name when nothing is installed", () => {
    // Behaviour must be no worse than before: the spawn fails with ENOENT and
    // the caller still reports "not installed".
    expect(win({ PATH: dir })).toEqual({ file: "bw", prefixArgs: [] });
  });

  it("falls back when a shim points at a script that is not there", () => {
    writeFileSync(join(dir, "bw.cmd"), '"%dp0%\\missing\\bw.js"');
    expect(win({ PATH: dir })).toEqual({ file: "bw", prefixArgs: [] });
  });

  it("tolerates an empty or absent PATH", () => {
    expect(win({})).toEqual({ file: "bw", prefixArgs: [] });
    expect(win({ PATH: "" })).toEqual({ file: "bw", prefixArgs: [] });
  });

  it("ignores a directory that happens to be named bw", () => {
    mkdirSync(join(dir, "bw"));
    expect(win({ PATH: dir })).toEqual({ file: "bw", prefixArgs: [] });
  });

  it("memoizes a successful lookup and forgets it on reset", () => {
    writeFileSync(join(dir, "bw.exe"), "MZ");
    const first = resolveBwCommand({ platform: "win32", env: { PATH: dir } });
    expect(first.file).toBe(join(dir, "bw.exe"));

    // Cached: an empty PATH still returns the previous answer.
    expect(
      resolveBwCommand({ platform: "win32", env: { PATH: "" } }).file,
    ).toBe(join(dir, "bw.exe"));

    resetBwExecutableCache();
    expect(resolveBwCommand({ platform: "win32", env: { PATH: "" } })).toEqual({
      file: "bw",
      prefixArgs: [],
    });
  });

  it("does not cache a miss, so installing bw later is picked up", () => {
    expect(resolveBwCommand({ platform: "win32", env: { PATH: dir } })).toEqual(
      { file: "bw", prefixArgs: [] },
    );
    writeFileSync(join(dir, "bw.exe"), "MZ");
    expect(
      resolveBwCommand({ platform: "win32", env: { PATH: dir } }).file,
    ).toBe(join(dir, "bw.exe"));
  });
});

describe("scriptFromWindowsShim", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-bw-shim-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves %dp0%-relative paths against the shim's directory", () => {
    writeFileSync(join(dir, "bw.js"), "//");
    expect(scriptFromWindowsShim('"%dp0%\\bw.js" %*', dir)).toBe(
      join(dir, "bw.js"),
    );
    expect(scriptFromWindowsShim('"%~dp0\\bw.js" %*', dir)).toBe(
      join(dir, "bw.js"),
    );
  });

  it("accepts .mjs and .cjs entry points, not only .js", () => {
    // Shipped broken the first time by matching `.js` alone: the shim the e2e
    // suite writes points at `bw.mjs`, so the resolver silently fell back and
    // Windows kept reporting "not installed". A package's bin may be any of
    // the three.
    for (const ext of ["js", "mjs", "cjs"]) {
      writeFileSync(join(dir, `bw.${ext}`), "//");
      expect(scriptFromWindowsShim(`node "%~dp0bw.${ext}" %*`, dir)).toBe(
        join(dir, `bw.${ext}`),
      );
    }
  });

  it("handles a shim with no separator after %~dp0", () => {
    writeFileSync(join(dir, "bw.mjs"), "//");
    expect(scriptFromWindowsShim('node "%~dp0bw.mjs" %*', dir)).toBe(
      join(dir, "bw.mjs"),
    );
  });

  it("returns null when the shim names no reachable script", () => {
    expect(scriptFromWindowsShim("@ECHO off", dir)).toBeNull();
    expect(scriptFromWindowsShim('"%dp0%\\nope.js"', dir)).toBeNull();
  });
});
