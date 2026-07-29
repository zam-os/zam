/**
 * Conservative freshness hints for OKF reference articles.
 *
 * The audit is deliberately read-only and lives in the CLI layer because it
 * inspects Git. It never changes articles, tokens, cards, or FSRS state.
 */

import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { type CatalogEntry, parseFrontmatter } from "./bundle.js";
import { findRepoRoot, loadBundle } from "./io.js";

export type OkfFreshnessStatus = "current" | "review-recommended" | "unknown";

export type OkfFreshnessReason =
  | "no-code-citations"
  | "git-unavailable"
  | "article-not-tracked"
  | "invalid-article-timestamp"
  | "code-path-missing"
  | "code-not-tracked"
  | "unrelated-history"
  | "working-tree-changed";

export interface OkfFreshnessBaseline {
  source: "git" | "frontmatter";
  changedAt: string;
  commit?: string;
}

export interface OkfCodeReferenceFreshness {
  path: string;
  status: OkfFreshnessStatus;
  changedAt?: string;
  commit?: string;
  workingTreeChanged?: boolean;
  reason?: OkfFreshnessReason;
}

export interface OkfArticleFreshness {
  file: string;
  title: string;
  timestamp?: string;
  status: OkfFreshnessStatus;
  baseline?: OkfFreshnessBaseline;
  codeReferences: OkfCodeReferenceFreshness[];
  reason?: OkfFreshnessReason;
}

export interface OkfFreshnessAudit {
  dir: string;
  repoRoot: string;
  gitAvailable: boolean;
  summary: {
    current: number;
    reviewRecommended: number;
    unknown: number;
  };
  articles: OkfArticleFreshness[];
}

interface GitCommit {
  commit: string;
  changedAt: string;
}

interface GitResult {
  status: number | null;
  stdout: string;
}

function runGit(repoRoot: string, args: string[]): GitResult {
  const result = spawnSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 1024 * 1024,
    timeout: 5_000,
  });
  return {
    status: result.status,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
  };
}

function containedPath(repoRoot: string, candidate: string): boolean {
  const rel = relative(repoRoot, candidate);
  return !(rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel));
}

/**
 * Read the repo-relative paths enclosed in backticks on `- Code:` rows under
 * an article's `# Citations` section. Anything that could escape the
 * repository is ignored. A missing value is retained only when it still looks
 * path-like, so deleted `src/foo.ts` citations become review signals while
 * descriptive backticks such as a function name do not become audit targets.
 */
export function extractOkfCodeReferences(
  markdown: string,
  repoRoot: string,
): string[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const citationsIndex = lines.findIndex((line) =>
    /^#\s+Citations\s*$/i.test(line.trim()),
  );
  if (citationsIndex === -1) return [];

  const references = new Set<string>();
  const canonicalRoot = existsSync(repoRoot)
    ? realpathSync(repoRoot)
    : resolve(repoRoot);

  for (let index = citationsIndex + 1; index < lines.length; index++) {
    const line = lines[index];
    if (/^#\s+/.test(line.trim())) break;
    const codeRow = /^\s*-\s*Code:\s*(.+)$/i.exec(line);
    if (!codeRow) continue;

    for (const match of codeRow[1].matchAll(/`([^`]+)`/g)) {
      const raw = match[1].trim();
      if (
        raw === "" ||
        isAbsolute(raw) ||
        /^[A-Za-z]:[\\/]/.test(raw) ||
        raw.includes("\\")
      ) {
        continue;
      }
      const candidate = resolve(canonicalRoot, raw);
      if (!containedPath(canonicalRoot, candidate)) {
        continue;
      }
      if (!existsSync(candidate)) {
        if (!raw.includes("/") && !/\.[A-Za-z0-9]+$/.test(raw)) continue;
        references.add(relative(canonicalRoot, candidate).split(sep).join("/"));
        continue;
      }
      const canonicalCandidate = realpathSync(candidate);
      if (!containedPath(canonicalRoot, canonicalCandidate)) continue;
      references.add(
        relative(canonicalRoot, canonicalCandidate).split(sep).join("/"),
      );
    }
  }

  return [...references];
}

class GitInspector {
  readonly repoRoot: string;
  readonly available: boolean;
  private readonly commits = new Map<string, GitCommit | null>();
  private readonly dirty = new Map<string, boolean | null>();
  private readonly ancestry = new Map<string, boolean | null>();

  constructor(candidateRoot: string) {
    const probe = runGit(candidateRoot, ["rev-parse", "--show-toplevel"]);
    this.available = probe.status === 0 && probe.stdout.trim() !== "";
    this.repoRoot = this.available
      ? realpathSync(resolve(probe.stdout.trim()))
      : realpathSync(resolve(candidateRoot));
  }

  lastCommit(path: string): GitCommit | null {
    if (!this.available) return null;
    const cached = this.commits.get(path);
    if (cached !== undefined) return cached;

    const result = runGit(this.repoRoot, [
      "log",
      "-1",
      "--format=%H%n%cI",
      "--",
      path,
    ]);
    if (result.status !== 0 || result.stdout.trim() === "") {
      this.commits.set(path, null);
      return null;
    }
    // Newline-delimited fields survive Git-for-Windows/Node process pipes
    // consistently; a NUL separator was observed to truncate on Windows ARM.
    const [commit, rawChangedAt] = result.stdout.trim().split(/\r?\n/, 2);
    const changedAtMs = Date.parse(rawChangedAt ?? "");
    const value =
      commit && Number.isFinite(changedAtMs)
        ? { commit, changedAt: new Date(changedAtMs).toISOString() }
        : null;
    this.commits.set(path, value);
    return value;
  }

  hasWorkingTreeChange(path: string): boolean | null {
    if (!this.available) return null;
    const cached = this.dirty.get(path);
    if (cached !== undefined) return cached;
    const result = runGit(this.repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      path,
    ]);
    const value = result.status === 0 ? result.stdout.trim() !== "" : null;
    this.dirty.set(path, value);
    return value;
  }

  isAncestor(ancestor: string, descendant: string): boolean | null {
    if (!this.available) return null;
    const key = `${ancestor}:${descendant}`;
    const cached = this.ancestry.get(key);
    if (cached !== undefined) return cached;
    const result = runGit(this.repoRoot, [
      "merge-base",
      "--is-ancestor",
      ancestor,
      descendant,
    ]);
    const value =
      result.status === 0 ? true : result.status === 1 ? false : null;
    this.ancestry.set(key, value);
    return value;
  }
}

function parseTimestamp(timestamp: string | undefined): string | undefined {
  if (!timestamp) return undefined;
  const ms = Date.parse(timestamp);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

function articleBaseline(
  inspector: GitInspector,
  articlePath: string,
  timestamp: string | undefined,
): OkfFreshnessBaseline | undefined {
  const commit = inspector.lastCommit(articlePath);
  if (commit) {
    return {
      source: "git",
      changedAt: commit.changedAt,
      commit: commit.commit,
    };
  }
  const changedAt = parseTimestamp(timestamp);
  return changedAt ? { source: "frontmatter", changedAt } : undefined;
}

function referenceFreshness(
  inspector: GitInspector,
  path: string,
  baseline: OkfFreshnessBaseline | undefined,
): OkfCodeReferenceFreshness {
  const dirty = inspector.hasWorkingTreeChange(path);
  if (dirty === true) {
    return {
      path,
      status: "review-recommended",
      workingTreeChanged: true,
      reason: "working-tree-changed",
    };
  }
  if (!inspector.available) {
    return { path, status: "unknown", reason: "git-unavailable" };
  }
  if (!existsSync(resolve(inspector.repoRoot, path))) {
    return {
      path,
      status: "review-recommended",
      reason: "code-path-missing",
    };
  }
  if (!baseline) {
    return {
      path,
      status: "unknown",
      reason: "article-not-tracked",
    };
  }

  const codeCommit = inspector.lastCommit(path);
  if (!codeCommit) {
    return { path, status: "unknown", reason: "code-not-tracked" };
  }

  if (baseline.source === "frontmatter") {
    return {
      path,
      status:
        Date.parse(codeCommit.changedAt) > Date.parse(baseline.changedAt)
          ? "review-recommended"
          : "current",
      changedAt: codeCommit.changedAt,
      commit: codeCommit.commit,
    };
  }

  if (codeCommit.commit === baseline.commit) {
    return {
      path,
      status: "current",
      changedAt: codeCommit.changedAt,
      commit: codeCommit.commit,
    };
  }

  const codePredatesArticle = inspector.isAncestor(
    codeCommit.commit,
    baseline.commit!,
  );
  if (codePredatesArticle === true) {
    return {
      path,
      status: "current",
      changedAt: codeCommit.changedAt,
      commit: codeCommit.commit,
    };
  }
  const articlePredatesCode = inspector.isAncestor(
    baseline.commit!,
    codeCommit.commit,
  );
  if (articlePredatesCode === true) {
    return {
      path,
      status: "review-recommended",
      changedAt: codeCommit.changedAt,
      commit: codeCommit.commit,
    };
  }
  return {
    path,
    status: "unknown",
    changedAt: codeCommit.changedAt,
    commit: codeCommit.commit,
    reason: "unrelated-history",
  };
}

function aggregateStatus(
  references: OkfCodeReferenceFreshness[],
): OkfFreshnessStatus {
  if (
    references.some((reference) => reference.status === "review-recommended")
  ) {
    return "review-recommended";
  }
  if (references.some((reference) => reference.status === "unknown")) {
    return "unknown";
  }
  return references.length > 0 ? "current" : "unknown";
}

function unknownReason(
  inspector: GitInspector,
  timestamp: string | undefined,
  baseline: OkfFreshnessBaseline | undefined,
  references: OkfCodeReferenceFreshness[],
): OkfFreshnessReason | undefined {
  if (references.length === 0) return "no-code-citations";
  if (!inspector.available) return "git-unavailable";
  if (!baseline) {
    return timestamp ? "invalid-article-timestamp" : "article-not-tracked";
  }
  return references.find((reference) => reference.reason)?.reason;
}

function catalogEntryFor(
  catalog: CatalogEntry[],
  file: string,
): CatalogEntry | undefined {
  return catalog.find((entry) => entry.file === file);
}

/**
 * Audit every article in one bundle against its declared code citations.
 *
 * An article's own latest Git commit is the preferred baseline: cited code
 * at or before that commit is current, while a later descendant commit
 * recommends review. Frontmatter `timestamp` is only a fallback for an
 * untracked article. Uncommitted cited-code changes also recommend review.
 * Anything ambiguous is reported as unknown rather than guessed.
 */
export function auditOkfFreshness(bundleDir: string): OkfFreshnessAudit {
  const bundle = loadBundle(bundleDir);
  const candidateRoot = findRepoRoot(bundle.dir);
  const inspector = new GitInspector(candidateRoot);
  const repoRoot = inspector.repoRoot;

  const articles = bundle.articles.map(({ file, markdown }) => {
    const entry = catalogEntryFor(bundle.catalog, file);
    let timestamp = entry?.timestamp;
    if (timestamp === undefined) {
      try {
        const { fields } = parseFrontmatter(markdown);
        timestamp =
          typeof fields.timestamp === "string" ? fields.timestamp : undefined;
      } catch {
        // Bundle conformance problems already describe malformed frontmatter.
      }
    }
    const articlePath = relative(
      repoRoot,
      realpathSync(resolve(bundle.dir, file)),
    )
      .split(sep)
      .join("/");
    const baseline = articleBaseline(inspector, articlePath, timestamp);
    const codeReferences = extractOkfCodeReferences(markdown, repoRoot).map(
      (path) => referenceFreshness(inspector, path, baseline),
    );
    const status = aggregateStatus(codeReferences);
    const reason =
      status === "unknown"
        ? unknownReason(inspector, timestamp, baseline, codeReferences)
        : undefined;

    return {
      file,
      title: entry?.title ?? file.replace(/\.md$/, ""),
      ...(timestamp ? { timestamp } : {}),
      status,
      ...(baseline ? { baseline } : {}),
      codeReferences,
      ...(reason ? { reason } : {}),
    } satisfies OkfArticleFreshness;
  });

  return {
    dir: bundle.dir,
    repoRoot,
    gitAvailable: inspector.available,
    summary: {
      current: articles.filter((article) => article.status === "current")
        .length,
      reviewRecommended: articles.filter(
        (article) => article.status === "review-recommended",
      ).length,
      unknown: articles.filter((article) => article.status === "unknown")
        .length,
    },
    articles,
  };
}
