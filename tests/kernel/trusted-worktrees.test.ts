import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addTrustedFolder,
  canonicalRoots,
  getTrustedFolders,
  PathRefusedError,
  readTrustedTextFile,
  resolveTrustedPath,
  trustedRoots,
} from "../../src/kernel/index.js";

describe("registered Git worktrees inherit project roots", () => {
  let base: string;
  let repo: string;
  function git(...args: string[]) {
    return execFileSync(
      "git",
      [
        "-c",
        "core.fsmonitor=false",
        "-c",
        `core.hooksPath=${join(base, "no-hooks")}`,
        "-c",
        "user.name=ZAM Test",
        "-c",
        "user.email=zam-test@example.invalid",
        "-C",
        repo,
        ...args,
      ],
      { stdio: "pipe" },
    ).toString("utf8");
  }
  function worktree(path: string) {
    git("worktree", "add", "--detach", path, "HEAD");
    mkdirSync(join(path, "docs", "okf"), { recursive: true });
    writeFileSync(join(path, "docs", "okf", "article.md"), "Worktree article");
    return realpathSync.native(path);
  }
  function admin(path: string) {
    return resolve(
      path,
      readFileSync(join(path, ".git"), "utf8").trim().slice("gitdir: ".length),
    );
  }
  beforeEach(() => {
    base = realpathSync.native(
      mkdtempSync(join(tmpdir(), "zam-worktree-roots-")),
    );
    repo = join(base, "project");
    mkdirSync(repo);
    git("init", "-q");
    git("commit", "--allow-empty", "-qm", "seed");
  });
  afterEach(() =>
    rmSync(base, { recursive: true, force: true, maxRetries: 10 }),
  );

  it("includes a registered external checkout under a hidden host directory", () => {
    const linked = worktree(join(base, ".codex", "worktrees", "my lesson"));
    const roots = canonicalRoots([repo]);
    expect(roots).toEqual([repo, linked]);
    const file = join(linked, "docs", "okf", "article.md");
    expect(resolveTrustedPath(file, roots)).toEqual({
      path: file,
      root: linked,
    });
    expect(readTrustedTextFile(file, roots).content).toBe("Worktree article");
  });

  it("uses the checkout as boundary when its host directory is hidden inside the main project", () => {
    const linked = worktree(join(repo, ".claude", "worktrees", "lesson"));
    const roots = canonicalRoots([repo]);
    const file = join(linked, "docs", "okf", "article.md");
    expect(readTrustedTextFile(file, roots)).toMatchObject({
      root: linked,
      content: "Worktree article",
    });
    const fresh = join(linked, "docs", "new.md");
    expect(resolveTrustedPath(fresh, roots, { mustExist: false }).root).toBe(
      linked,
    );
  });

  it("supports relative links and a trusted linked checkout as the starting project", () => {
    const linked = worktree(join(base, "linked"));
    const sibling = worktree(join(base, "sibling"));
    const privateDir = admin(linked);
    // Git's --relative-paths format, without requiring a recent Git executable in CI.
    writeFileSync(
      join(linked, ".git"),
      `gitdir: ${relative(linked, privateDir)}\n`,
    );
    writeFileSync(
      join(privateDir, "gitdir"),
      `${relative(privateDir, join(linked, ".git"))}\n`,
    );
    expect(canonicalRoots([linked]).sort()).toEqual([linked, sibling].sort());
    expect(new Set(canonicalRoots([repo, linked])).size).toBe(3);
  });

  it("does not extend trust from a repository subfolder", () => {
    const linked = worktree(join(base, "linked"));
    const docs = join(repo, "docs");
    mkdirSync(docs);
    expect(canonicalRoots([docs])).toEqual([docs]);
    expect(() =>
      resolveTrustedPath(
        join(linked, "docs", "okf", "article.md"),
        canonicalRoots([docs]),
      ),
    ).toThrow(PathRefusedError);
  });

  it("rejects an unregistered folder even if its gitfile points at this repository", () => {
    const linked = worktree(join(base, "linked"));
    const foreign = join(base, "foreign");
    mkdirSync(foreign);
    writeFileSync(join(foreign, ".git"), readFileSync(join(linked, ".git")));
    writeFileSync(join(foreign, "secret.md"), "Do not read");
    expect(canonicalRoots([repo])).not.toContain(foreign);
    expect(canonicalRoots([foreign])).toEqual([foreign]);
    expect(() =>
      readTrustedTextFile(join(foreign, "secret.md"), canonicalRoots([repo])),
    ).toThrow(PathRefusedError);
  });

  it.each(["gitdir", "commondir", ".git"])(
    "drops a registration whose %s link no longer matches",
    (link) => {
      const linked = worktree(join(base, "linked"));
      const valid = worktree(join(base, "valid"));
      writeFileSync(
        link === ".git" ? join(linked, link) : join(admin(linked), link),
        "not-this-registration\n",
      );
      expect(canonicalRoots([repo]).sort()).toEqual([repo, valid].sort());
    },
  );

  it("rejects symlinked metadata and keeps hidden files and escaping source links blocked", () => {
    const linked = worktree(join(base, "linked"));
    const privateDir = admin(linked);
    const shared = join(privateDir, "commondir");
    rmSync(shared);
    writeFileSync(join(base, "shared-pointer"), "../..\n");
    symlinkSync(join(base, "shared-pointer"), shared);
    expect(canonicalRoots([repo])).toEqual([repo]);
    rmSync(shared);
    writeFileSync(shared, "../..\n");
    const roots = canonicalRoots([repo]);
    writeFileSync(join(base, "secret.md"), "Private");
    symlinkSync(
      join(base, "secret.md"),
      join(linked, "docs", "okf", "escape.md"),
    );
    expect(() =>
      readTrustedTextFile(join(linked, "docs", "okf", "escape.md"), roots),
    ).toThrow(PathRefusedError);
    writeFileSync(join(linked, ".env"), "private");
    expect(() => readTrustedTextFile(join(linked, ".env"), roots)).toThrow(
      /hidden/,
    );
    expect(() => readTrustedTextFile(join(linked, ".git"), roots)).toThrow(
      /hidden/,
    );
  });

  it("rechecks registrations without changing the learner's stored trusted folders", () => {
    const config = join(base, "config.json");
    addTrustedFolder(repo, config);
    const before = readFileSync(config, "utf8");
    expect(trustedRoots(config)).toEqual([repo]);
    const linked = worktree(join(base, "linked"));
    expect(trustedRoots(config)).toContain(linked);
    expect(getTrustedFolders(config)).toEqual([repo]);
    expect(readFileSync(config, "utf8")).toBe(before);
    rmSync(linked, { recursive: true, force: true });
    expect(trustedRoots(config)).toEqual([repo]);
  });
});
