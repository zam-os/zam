/**
 * Filesystem layer for OKF bundles (ADR 2026-07-17). Everything that
 * touches disk lives here; the contract itself is in bundle.ts.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  appendLog,
  buildCatalog,
  type CatalogEntry,
  isReservedFile,
  renderIndex,
  toCatalogEntry,
  type ValidationResult,
  validateArticle,
} from "./bundle.js";

export interface LoadedBundle {
  dir: string;
  articles: Array<{ file: string; markdown: string }>;
  catalog: CatalogEntry[];
  problems: string[];
}

export const DEFAULT_BUNDLE_DIR = "docs/okf";

/**
 * Resolve an article file name inside the bundle. Names are plain kebab
 * basenames (v1 bundles are flat) — anything with a path separator or a
 * reserved name is rejected before it can escape the bundle directory.
 */
export function resolveArticlePath(dir: string, file: string): string {
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    throw new Error(`invalid article file name: ${file}`);
  }
  if (isReservedFile(file)) {
    throw new Error(`refusing to address reserved file: ${file}`);
  }
  return join(resolve(dir), file);
}

/**
 * Walk up from `startDir` to the nearest ancestor containing a `.git`
 * directory (the repository root). Falls back to the parent of
 * `startDir` when no `.git` is found (e.g. installed/vendored bundles
 * outside a git checkout).
 */
export function findRepoRoot(startDir: string): string {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(startDir, "..");
    dir = parent;
  }
}

/**
 * Resolve a citation target relative to a bundle directory. Citations may
 * point outside the bundle (e.g. an ADR) but never outside the repository
 * root, must be relative `.md` paths, and are read-only (ADR 2026-07-17
 * Decision 5).
 */
export function resolveCitationPath(bundleDir: string, target: string): string {
  if (isAbsolute(target)) {
    throw new Error(
      `invalid citation target: absolute paths are not allowed (${target})`,
    );
  }
  if (!target.endsWith(".md")) {
    throw new Error(
      `invalid citation target: only .md files are readable (${target})`,
    );
  }
  const root = findRepoRoot(bundleDir);
  const resolved = resolve(bundleDir, target);
  assertContained(root, resolved, target);

  // Lexical containment can pass while the path actually redirects
  // outside the repo root through a symlink or (on Windows) a directory
  // junction. Once the target exists on disk, re-check containment
  // against the realpath so a reparse point cannot smuggle a read outside
  // the repository.
  if (existsSync(resolved)) {
    assertContained(realpathSync(root), realpathSync(resolved), target);
  }
  return resolved;
}

/**
 * Segment-aware containment check: `rel` must be `root` itself or a path
 * strictly beneath it. A bare `rel.startsWith("..")` false-positives on any
 * real path segment that merely starts with the two characters ".." (e.g. a
 * directory named `..staging`) without ever escaping `root`.
 */
function assertContained(
  root: string,
  candidate: string,
  target: string,
): void {
  const rel = relative(root, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(
      `invalid citation target: resolves outside the repository root (${target})`,
    );
  }
}

export function loadBundle(dir: string): LoadedBundle {
  const root = resolve(dir);
  let entries: string[];
  try {
    entries = readdirSync(root).filter(
      (name) => name.endsWith(".md") && !isReservedFile(name),
    );
  } catch {
    throw new Error(`OKF bundle directory not found: ${root}`);
  }
  const articles = entries.sort().map((file) => ({
    file,
    markdown: readFileSync(join(root, file), "utf8"),
  }));
  const problems = articles.flatMap(
    ({ file, markdown }) => validateArticle(file, markdown).problems,
  );
  const catalog =
    problems.length === 0 ? buildCatalog(articles) : safeCatalog(articles);
  return { dir: root, articles, catalog, problems };
}

function safeCatalog(
  articles: Array<{ file: string; markdown: string }>,
): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  for (const { file, markdown } of articles) {
    try {
      entries.push(toCatalogEntry(file, markdown));
    } catch {
      // Unparseable article: already reported via problems; keep the
      // catalog usable for the rest of the bundle.
    }
  }
  return entries.sort((a, b) => a.file.localeCompare(b.file));
}

export interface UpsertResult {
  validation: ValidationResult;
  entry?: CatalogEntry;
  created?: boolean;
}

/**
 * The sanctioned write path (ADR 2026-07-17 rule 3): validate, write the
 * article, regenerate index.md, append a log.md entry. Returns problems
 * instead of writing when validation fails.
 */
export function upsertArticle(
  dir: string,
  file: string,
  markdown: string,
  today: string = new Date().toISOString().slice(0, 10),
): UpsertResult {
  const target = resolveArticlePath(dir, file);
  const validation = validateArticle(file, markdown);
  if (!validation.ok) return { validation };

  const root = resolve(dir);
  mkdirSync(root, { recursive: true });
  let created = true;
  try {
    readFileSync(target, "utf8");
    created = false;
  } catch {
    // new article
  }
  writeFileSync(target, markdown, "utf8");

  const bundle = loadBundle(root);
  writeFileSync(join(root, "index.md"), renderIndex(bundle.catalog), "utf8");

  let log = "";
  try {
    log = readFileSync(join(root, "log.md"), "utf8");
  } catch {
    // first entry creates the log
  }
  const entry = bundle.catalog.find((e) => e.file === file);
  writeFileSync(
    join(root, "log.md"),
    appendLog(
      log,
      today,
      `**${created ? "Creation" : "Update"}** — [${entry?.title ?? file}](${file})`,
    ),
    "utf8",
  );
  return { validation, entry, created };
}
