/**
 * Read a Quelle (ADR 2026-10-10, Decisions 6–8).
 *
 * Lists `docs/okf` through the existing bundle loader and reads one file
 * when it stays inside the repository. Nothing here writes a map, upserts
 * an article, repairs a workspace, or provisions a skill.
 */

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { getConfiguredWorkspaces } from "../../kernel/index.js";
import {
  KNOWLEDGE_MAP_RELATIVE_PATH,
  type LoadedKnowledgeMap,
  loadKnowledgeMap,
} from "../knowledge-map/load.js";
import { isReservedFile } from "../okf/bundle.js";
import { DEFAULT_BUNDLE_DIR, loadBundle } from "../okf/io.js";
import { isSkillSource } from "../provisioning/index.js";

export { citationTarget } from "./citation.js";

export interface SourceArticle {
  file: string;
  title: string;
}

export interface SourceCatalog {
  repo: string;
  skillSource: boolean;
  okf: { found: false } | { found: true; articles: SourceArticle[] };
}

export interface SourceRead {
  opened: boolean;
  /**
   * Set when nothing was opened. `desktop` means the Studio panel reads only
   * a workspace's OKF articles; that file opens in the Desktop window.
   */
  reason?: "outside" | "missing" | "desktop";
  kind?: "okf" | "text";
  /** Repository-relative path, using `/` separators. */
  path?: string;
  body?: string;
}

/** True when `candidate` is `root` or a path strictly beneath it. */
export function pathInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function stripAnchor(target: string): string {
  const hash = target.indexOf("#");
  return (hash === -1 ? target : target.slice(0, hash)).trim();
}

export function catalogSource(repo: string): SourceCatalog {
  const root = resolve(repo);
  const skillSource = isSkillSource(root);
  const dir = resolve(root, DEFAULT_BUNDLE_DIR);
  if (!existsSync(dir))
    return { repo: root, skillSource, okf: { found: false } };
  try {
    const realRoot = realpathSync(root);
    const realDir = realpathSync(dir);
    // A bundle directory that links outside the Quelle is not that Quelle's list.
    if (!pathInsideRoot(realRoot, realDir)) {
      return { repo: root, skillSource, okf: { found: false } };
    }
    const bundle = loadBundle(realDir);
    const articles = bundle.catalog.map((entry) => ({
      file: entry.file,
      title: entry.title,
    }));
    if (articles.length === 0) {
      return { repo: root, skillSource, okf: { found: false } };
    }
    return { repo: root, skillSource, okf: { found: true, articles } };
  } catch {
    return { repo: root, skillSource, okf: { found: false } };
  }
}

function classify(
  root: string,
  realRoot: string,
  candidate: string,
): { kind: "outside" } | { kind: "missing" } | { kind: "file"; real: string } {
  if (
    !pathInsideRoot(root, candidate) &&
    !pathInsideRoot(realRoot, candidate)
  ) {
    return { kind: "outside" };
  }
  if (!existsSync(candidate)) return { kind: "missing" };
  try {
    if (!statSync(candidate).isFile()) return { kind: "missing" };
    const real = realpathSync(candidate);
    if (!pathInsideRoot(realRoot, real)) return { kind: "outside" };
    return { kind: "file", real };
  } catch {
    return { kind: "outside" };
  }
}

function isOkfArticle(realRoot: string, realFile: string): boolean {
  const rel = relative(resolve(realRoot, DEFAULT_BUNDLE_DIR), realFile);
  return (
    rel.endsWith(".md") &&
    !rel.includes(sep) &&
    !isAbsolute(rel) &&
    rel !== ".." &&
    !rel.startsWith(`..${sep}`) &&
    !isReservedFile(rel)
  );
}

/**
 * Read one article or cited file inside `repo`. A path that leaves the
 * root, including through a symlink, is not opened.
 */
export function readSourceFile(repo: string, target: string): SourceRead {
  const spec = stripAnchor(target);
  if (
    !spec ||
    spec.includes("://") ||
    isAbsolute(spec) ||
    /^[A-Za-z]:[\\/]/.test(spec)
  ) {
    return { opened: false, reason: "outside" };
  }
  const root = resolve(repo);
  let realRoot: string;
  try {
    realRoot = realpathSync(root);
  } catch {
    return { opened: false, reason: "missing" };
  }
  const bundleDir = resolve(root, DEFAULT_BUNDLE_DIR);
  const candidates: string[] = [];
  const bare = !spec.includes("/") && !spec.includes("\\");
  if (bare) candidates.push(resolve(bundleDir, spec));
  candidates.push(resolve(root, spec));
  if (spec.split(/[\\/]/).includes(".."))
    candidates.push(resolve(bundleDir, spec));

  let missing = false;
  for (const candidate of candidates) {
    const found = classify(root, realRoot, candidate);
    if (found.kind === "missing") {
      missing = true;
      continue;
    }
    if (found.kind !== "file") continue;
    const kind = isOkfArticle(realRoot, found.real) ? "okf" : "text";
    return {
      opened: true,
      kind,
      path: relative(realRoot, found.real).split(sep).join("/"),
      body: readFileSync(found.real, "utf8"),
    };
  }
  return { opened: false, reason: missing ? "missing" : "outside" };
}

// ── Studio panel: a workspace by id, its articles and its map (D11) ─────────

/** The root of a configured workspace, or null for an unknown id. */
export function workspaceRoot(id: string, configPath?: string): string | null {
  const wanted = id.trim();
  if (!wanted) return null;
  const workspace = getConfiguredWorkspaces(configPath).find(
    (entry) => entry.id === wanted,
  );
  return workspace ? resolve(workspace.path) : null;
}

/**
 * Read one OKF article of `repo` and nothing else. A target outside
 * `docs/okf` is not looked at, so the panel learns nothing about other
 * files; it is reported as a Desktop action.
 */
export function readWorkspaceArticle(repo: string, target: string): SourceRead {
  const spec = stripAnchor(target);
  if (
    !spec ||
    spec.includes("://") ||
    isAbsolute(spec) ||
    /^[A-Za-z]:[\\/]/.test(spec)
  ) {
    return { opened: false, reason: "outside" };
  }
  const root = resolve(repo);
  const bundleDir = resolve(root, DEFAULT_BUNDLE_DIR);
  // Same candidates as readSourceFile, kept only while they lie in the bundle.
  const bare = !spec.includes("/") && !spec.includes("\\");
  const candidates = bare ? [resolve(bundleDir, spec)] : [resolve(root, spec)];
  if (!bare && spec.split(/[\\/]/).includes("..")) {
    candidates.push(resolve(bundleDir, spec));
  }
  const path = candidates.find((candidate) =>
    pathInsideRoot(bundleDir, candidate),
  );
  if (!path) return { opened: false, reason: "desktop" };
  let realRoot: string;
  let realBundle: string;
  try {
    realRoot = realpathSync(root);
    realBundle = realpathSync(bundleDir);
  } catch {
    return { opened: false, reason: "missing" };
  }
  if (!pathInsideRoot(realRoot, realBundle)) {
    return { opened: false, reason: "outside" };
  }
  if (!existsSync(path)) {
    // A bare name that is not an article may be a file at the root.
    return { opened: false, reason: bare ? "desktop" : "missing" };
  }
  try {
    if (!statSync(path).isFile()) return { opened: false, reason: "missing" };
    const real = realpathSync(path);
    if (!pathInsideRoot(realBundle, real) || !isOkfArticle(realRoot, real)) {
      return { opened: false, reason: "outside" };
    }
    return {
      opened: true,
      kind: "okf",
      path: relative(realRoot, real).split(sep).join("/"),
      body: readFileSync(real, "utf8"),
    };
  } catch {
    return { opened: false, reason: "outside" };
  }
}

/**
 * The workspace's knowledge map, validated. A `map.json` that resolves
 * outside the workspace is treated as absent, so a parse error never
 * echoes another file.
 */
export function loadWorkspaceMap(repo: string): LoadedKnowledgeMap {
  const root = resolve(repo);
  const path = join(root, KNOWLEDGE_MAP_RELATIVE_PATH);
  try {
    if (
      existsSync(path) &&
      !pathInsideRoot(realpathSync(root), realpathSync(path))
    ) {
      return { found: false, path, map: null, issues: [] };
    }
  } catch {
    return { found: false, path, map: null, issues: [] };
  }
  return loadKnowledgeMap(root);
}
