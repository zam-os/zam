import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  auditOkfFreshness,
  extractOkfCodeReferences,
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
