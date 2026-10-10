/**
 * ADR 2026-10-08b D1: the kernel resolver for paths a caller names.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, parse } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addTrustedFolder,
  canonicalRoots,
  getTrustedFolders,
  isAcceptableRoot,
  PathRefusedError,
  readTrustedTextFile,
  removeTrustedFolder,
  resolveTrustedPath,
  trustedRoots,
} from "../../src/kernel/index.js";

describe("trusted paths", () => {
  let base: string;
  let configPath: string;

  beforeEach(() => {
    base = realpathSync.native(mkdtempSync(join(tmpdir(), "zam-trust-")));
    configPath = join(base, "config.json");
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  it("never accepts a drive root, the home folder or an ancestor of it", () => {
    expect(isAcceptableRoot(parse(base).root)).toBe(false);
    expect(isAcceptableRoot(homedir())).toBe(false);
    expect(isAcceptableRoot(dirname(homedir()))).toBe(false);
    expect(isAcceptableRoot(base)).toBe(true);
  });

  it("builds canonical roots from paths and file URIs, dropping bad ones", () => {
    const folder = join(base, "repo");
    mkdirSync(folder);
    const roots = canonicalRoots([
      folder,
      pathToFileURL(folder).href,
      join(base, "missing"),
      homedir(),
      "/",
      "",
    ]);
    expect(roots).toEqual([folder]);
  });

  it("stores trusted folders as real paths, once, and removes them", () => {
    const folder = join(base, "repo");
    mkdirSync(folder);
    expect(addTrustedFolder(folder, configPath)).toBe(folder);
    addTrustedFolder(folder, configPath);
    expect(getTrustedFolders(configPath)).toEqual([folder]);
    expect(trustedRoots(configPath)).toEqual([folder]);
    expect(JSON.parse(readFileSync(configPath, "utf8")).trustedFolders).toEqual([
      folder,
    ]);

    expect(removeTrustedFolder(folder, configPath)).toBe(true);
    expect(removeTrustedFolder(folder, configPath)).toBe(false);
    expect(getTrustedFolders(configPath)).toEqual([]);
  });

  it("refuses to trust the home folder or a missing folder", () => {
    expect(() => addTrustedFolder(homedir(), configPath)).toThrow(
      /home folder/,
    );
    expect(() => addTrustedFolder(join(base, "missing"), configPath)).toThrow(
      /Not a folder/,
    );
    expect(getTrustedFolders(configPath)).toEqual([]);
  });

  it("resolves a new file through its parent, inside a root only", () => {
    const root = join(base, "repo");
    mkdirSync(join(root, "docs"), { recursive: true });
    const resolved = resolveTrustedPath("docs/new.md", [root], {
      mustExist: false,
    });
    expect(resolved).toEqual({ path: join(root, "docs", "new.md"), root });
    expect(() =>
      resolveTrustedPath("../elsewhere/new.md", [root], { mustExist: false }),
    ).toThrow(PathRefusedError);
  });

  it("caps what it reads", () => {
    const root = join(base, "repo");
    mkdirSync(root);
    writeFileSync(join(root, "big.md"), "x".repeat(2000));
    expect(readTrustedTextFile("big.md", [root]).content).toHaveLength(2000);
    expect(() => readTrustedTextFile("big.md", [root], { maxBytes: 1000 })).toThrow(
      /larger than 1000 bytes/,
    );
  });
});
