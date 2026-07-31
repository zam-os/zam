import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  auditOkfFreshness,
  extractOkfCodeReferences,
  isVersionOnlyDiff,
} from "../../src/cli/okf/freshness.js";

const scratchDirs: string[] = [];

function scratchRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "zam-okf-freshness-"));
  scratchDirs.push(root);
  execFileSync("git", ["-C", root, "init"], { stdio: "pipe" });
  execFileSync("git", ["-C", root, "config", "user.name", "ZAM Test"], {
    stdio: "pipe",
  });
  execFileSync(
    "git",
    ["-C", root, "config", "user.email", "zam-test@example.invalid"],
    { stdio: "pipe" },
  );
  return root;
}

function commit(root: string, message: string, date: string): void {
  execFileSync("git", ["-C", root, "add", "."], { stdio: "pipe" });
  execFileSync("git", ["-C", root, "commit", "-m", message], {
    stdio: "pipe",
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_DATE: date,
    },
  });
}

function article(options: {
  title?: string;
  timestamp?: string;
  code?: string[];
}): string {
  const code =
    options.code === undefined
      ? ""
      : `\n# Citations\n\n- Code: ${options.code.map((path) => `\`${path}\``).join(", ")}\n`;
  return [
    "---",
    "type: reference",
    `title: ${options.title ?? "Freshness fixture"}`,
    "description: Test article",
    ...(options.timestamp ? [`timestamp: ${options.timestamp}`] : []),
    "---",
    "",
    "# Fixture",
    "",
    "Current behavior.",
    code,
  ].join("\n");
}

afterEach(() => {
  for (const root of scratchDirs.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("OKF freshness audit", () => {
  it("extracts repo-contained code paths and ignores descriptive identifiers", () => {
    const root = scratchRepo();
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src", "engine.ts"), "export {};\n");
    const markdown = [
      "# Citations",
      "",
      "- Code: `src/engine.ts`, `missing.ts`, `renderEngine`",
      "- Code: `src/engine.ts`, `../outside.ts`, `/absolute.ts`",
      "",
      "# Next section",
      "",
      "- Code: `src/not-in-citations.ts`",
    ].join("\n");

    expect(extractOkfCodeReferences(markdown, root)).toEqual([
      "src/engine.ts",
      "missing.ts",
    ]);
  });

  it("uses commit ancestry and recommends review after cited code changes", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(root, "src", "stable.ts"), "export const stable = 1;\n");
    writeFileSync(join(root, "src", "changed.ts"), "export const value = 1;\n");
    commit(root, "add code", "2026-07-01T10:00:00Z");

    writeFileSync(
      join(bundleDir, "system.md"),
      article({
        timestamp: "2026-07-02T10:00:00Z",
        code: ["src/stable.ts", "src/changed.ts"],
      }),
    );
    commit(root, "document system", "2026-07-02T10:00:00Z");

    const current = auditOkfFreshness(bundleDir);
    expect(current.gitAvailable).toBe(true);
    expect(current.summary).toEqual({
      current: 1,
      reviewRecommended: 0,
      unknown: 0,
    });
    expect(current.articles[0].baseline?.source).toBe("git");
    expect(
      current.articles[0].codeReferences.map((reference) => reference.status),
    ).toEqual(["current", "current"]);

    writeFileSync(join(root, "src", "changed.ts"), "export const value = 2;\n");
    commit(root, "change documented behavior", "2026-07-03T10:00:00Z");

    const stale = auditOkfFreshness(bundleDir);
    expect(stale.summary).toEqual({
      current: 0,
      reviewRecommended: 1,
      unknown: 0,
    });
    expect(stale.articles[0].status).toBe("review-recommended");
    expect(stale.articles[0].codeReferences).toEqual([
      expect.objectContaining({ path: "src/stable.ts", status: "current" }),
      expect.objectContaining({
        path: "src/changed.ts",
        status: "review-recommended",
      }),
    ]);
  });

  it("falls back to frontmatter for an untracked article and sees dirty code", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(root, "src", "engine.ts"), "export const value = 1;\n");
    commit(root, "add engine", "2026-07-01T10:00:00Z");
    writeFileSync(
      join(bundleDir, "engine.md"),
      article({
        timestamp: "2026-07-02T10:00:00Z",
        code: ["src/engine.ts"],
      }),
    );

    const current = auditOkfFreshness(bundleDir);
    expect(current.articles[0]).toEqual(
      expect.objectContaining({
        status: "current",
        baseline: expect.objectContaining({ source: "frontmatter" }),
      }),
    );

    writeFileSync(join(root, "src", "engine.ts"), "export const value = 2;\n");
    const dirty = auditOkfFreshness(bundleDir);
    expect(dirty.articles[0].status).toBe("review-recommended");
    expect(dirty.articles[0].codeReferences[0]).toEqual(
      expect.objectContaining({
        workingTreeChanged: true,
        reason: "working-tree-changed",
      }),
    );
  });

  it("keeps an article current when cited code only changed version strings", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    const userAgent = (version: string) =>
      [
        "export async function fetchPage(url: string) {",
        `  const agent = "ZAM-Content-Studio/${version}";`,
        '  return fetch(url, { headers: { "User-Agent": agent }, redirect });',
        "}",
        "",
      ].join("\n");
    writeFileSync(join(root, "src", "bridge.ts"), userAgent("0.23.0"));
    commit(root, "add bridge", "2026-07-01T10:00:00Z");

    writeFileSync(
      join(bundleDir, "bridge.md"),
      article({ timestamp: "2026-07-02T10:00:00Z", code: ["src/bridge.ts"] }),
    );
    commit(root, "document bridge", "2026-07-02T10:00:00Z");

    // The release bump every version performs on this file.
    writeFileSync(join(root, "src", "bridge.ts"), userAgent("0.23.1"));
    const dirty = auditOkfFreshness(bundleDir);
    expect(dirty.articles[0].codeReferences[0]).toEqual(
      expect.objectContaining({
        status: "current",
        workingTreeChanged: true,
        reason: "version-only-change",
      }),
    );
    expect(dirty.summary.reviewRecommended).toBe(0);

    commit(root, "chore: release 0.23.1", "2026-07-03T10:00:00Z");
    const released = auditOkfFreshness(bundleDir);
    expect(released.summary).toEqual({
      current: 1,
      reviewRecommended: 0,
      unknown: 0,
    });
    expect(released.articles[0].codeReferences[0]).toEqual(
      expect.objectContaining({
        status: "current",
        reason: "version-only-change",
      }),
    );

    // A behavior change in the same file still recommends review, even when
    // it rides along with another version bump.
    writeFileSync(
      join(root, "src", "bridge.ts"),
      userAgent("0.24.0").replace("redirect", '"manual"'),
    );
    commit(root, "change request shape", "2026-07-04T10:00:00Z");
    const changed = auditOkfFreshness(bundleDir);
    expect(changed.articles[0].status).toBe("review-recommended");
  });

  it("treats added or removed cited-code lines as a review signal", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(
      join(root, "src", "engine.ts"),
      'export const agent = "ZAM/1.0.0";\n',
    );
    commit(root, "add engine", "2026-07-01T10:00:00Z");
    writeFileSync(
      join(bundleDir, "engine.md"),
      article({ timestamp: "2026-07-02T10:00:00Z", code: ["src/engine.ts"] }),
    );
    commit(root, "document engine", "2026-07-02T10:00:00Z");

    writeFileSync(
      join(root, "src", "engine.ts"),
      'export const agent = "ZAM/1.0.1";\nexport const retries = 3;\n',
    );
    commit(root, "bump and add retries", "2026-07-03T10:00:00Z");

    const audit = auditOkfFreshness(bundleDir);
    expect(audit.articles[0].status).toBe("review-recommended");
  });

  it("reports unknown when an article declares no auditable code", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(
      join(bundleDir, "concept.md"),
      article({ timestamp: "2026-07-02T10:00:00Z" }),
    );
    commit(root, "add conceptual article", "2026-07-02T10:00:00Z");

    const audit = auditOkfFreshness(bundleDir);
    expect(audit.articles[0]).toEqual(
      expect.objectContaining({
        status: "unknown",
        reason: "no-code-citations",
        codeReferences: [],
      }),
    );
  });

  it("recommends review when a path-shaped citation no longer exists", () => {
    const root = scratchRepo();
    const bundleDir = join(root, "docs", "okf");
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(
      join(bundleDir, "removed-code.md"),
      article({
        timestamp: "2026-07-02T10:00:00Z",
        code: ["src/removed.ts", "renderRemoved"],
      }),
    );
    commit(root, "document removed code", "2026-07-02T10:00:00Z");

    const audit = auditOkfFreshness(bundleDir);
    expect(audit.articles[0].codeReferences).toEqual([
      {
        path: "src/removed.ts",
        status: "review-recommended",
        reason: "code-path-missing",
      },
    ]);
  });
});

describe("isVersionOnlyDiff", () => {
  const diff = (removed: string[], added: string[]): string =>
    [
      "--- a/src/cli/commands/bridge.ts",
      "+++ b/src/cli/commands/bridge.ts",
      ...removed.map((line) => `-${line}`),
      ...added.map((line) => `+${line}`),
    ].join("\n");

  it("suppresses a release User-Agent bump", () => {
    expect(
      diff(
        ['        "User-Agent": "ZAM-Content-Studio/0.23.1",'],
        ['        "User-Agent": "ZAM-Content-Studio/0.24.1",'],
      ),
    ).toSatisfy(isVersionOnlyDiff);
  });

  it("suppresses several version bumps at once, including prereleases", () => {
    expect(
      diff(["a 1.0.0", "b 2.3.4-beta.1"], ["a 1.0.1", "b 2.3.4-beta.2"]),
    ).toSatisfy(isVersionOnlyDiff);
  });

  it("keeps review when a real edit rides along with the bump", () => {
    // Line counts differ, so the one-to-one pairing fails outright.
    expect(
      isVersionOnlyDiff(
        diff(['"x/0.23.1",'], ['"x/0.24.1",', '  .command("voice-availability")']),
      ),
    ).toBe(false);
    // Same line count, but the text changed alongside the version.
    expect(isVersionOnlyDiff(diff(["a 1.0.0 foo"], ["a 1.0.1 bar"]))).toBe(false);
  });

  it("does not treat an unchanged or empty diff as version churn", () => {
    expect(isVersionOnlyDiff("")).toBe(false);
    expect(isVersionOnlyDiff(diff(["a 1.0.0"], ["a 1.0.0"]))).toBe(false);
  });

  /**
   * Versions are masked with a sentinel that source code cannot contain, so a
   * line merely *resembling* the mask must not be able to pass as one. The
   * spaced form below is the closest a real file could get.
   */
  it("cannot be spoofed by a line that looks like the mask", () => {
    expect(
      isVersionOnlyDiff(
        diff(['const a = " version ";'], ['const a = "1.2.3";']),
      ),
    ).toBe(false);
  });

  /**
   * The sentinel is a NUL character, which must be written as an escape. Raw
   * 0x00 bytes in the source make Git classify the file as binary — killing
   * `git diff`, `git blame` and `git grep` on it — which is exactly what
   * happened between #257 and 0.24.1.
   */
  it("is implemented without raw NUL bytes in the source file", () => {
    const source = readFileSync("src/cli/okf/freshness.ts");
    expect(source.filter((byte) => byte === 0)).toHaveLength(0);
  });
});
