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
import { fileURLToPath } from "node:url";
import {
  assertNoHiddenSegments,
  PATH_NOT_READABLE,
  PathRefusedError,
  resolveTrustedPath,
  samePath,
} from "../../kernel/index.js";
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
 * Resolve the default bundle directory from MCP client roots (the host's
 * workspace folders). An MCP server is often spawned with an unrelated
 * cwd — e.g. the editor's installation directory — so "docs/okf under the
 * cwd" points nowhere; the workspace the user actually has open is what
 * "the repo's bundle" means. Picks the first root that contains a
 * `docs/okf` directory; if none does, the first root still wins over the
 * cwd (so error messages name the workspace, not the application path);
 * with no usable roots, falls back to `fallback` (cwd-relative).
 */
export function resolveBundleDirFromRoots(
  rootUris: string[],
  fallback: string,
): string {
  const dirs: string[] = [];
  for (const uri of rootUris) {
    if (!uri?.startsWith("file:")) continue;
    try {
      dirs.push(join(fileURLToPath(uri), DEFAULT_BUNDLE_DIR));
    } catch {
      // malformed root URI: skip
    }
  }
  return dirs.find((dir) => existsSync(dir)) ?? dirs[0] ?? fallback;
}

/**
 * Collect the source-link bases of every article in a bundle: the
 * frontmatter `resource` URL when present, else the resolved article path —
 * the exact base rule `importOkfTokens` uses when writing tokens'
 * `source_link` (`<base>` or `<base>#<anchor>`). This is what "tokens
 * related to this repo's knowledge base" means to the learning graph.
 * Throws when the bundle directory does not exist (same as `loadBundle`).
 */
export function collectSourceLinkBases(dir: string): string[] {
  const bundle = loadBundle(dir);
  return bundle.catalog.map(
    (entry) => entry.resource ?? resolveArticlePath(dir, entry.file),
  );
}

/**
 * Resolve an article file name inside the bundle. Names are plain kebab
 * basenames (v1 bundles are flat) — anything with a path separator or a
 * reserved name is rejected before it can escape the bundle directory.
 */
export function resolveArticlePath(dir: string, file: string): string {
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    throw new Error(`invalid article file name: ${file}`);
  }
  if (!file.toLowerCase().endsWith(".md") || file.startsWith(".")) {
    throw new Error(
      `invalid article file name: ${file} (articles are .md files)`,
    );
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
  // An article that is a link to a file outside the bundle is not read
  // (ADR 2026-10-08b D1): the bundle may be inside a trusted folder while the
  // link target is not.
  const realRoot = realpathSync.native(root);
  const escaping: string[] = [];
  const articles = entries
    .sort()
    .filter((file) => {
      const real = realpathSync.native(join(root, file));
      const inside = dirname(real) === realRoot;
      if (!inside) escaping.push(file);
      return inside;
    })
    .map((file) => ({
      file,
      markdown: readFileSync(join(root, file), "utf8"),
    }));
  const problems = [
    ...escaping.map(
      (file) => `${file}: links to a file outside the bundle; not read`,
    ),
    ...articles.flatMap(
      ({ file, markdown }) => validateArticle(file, markdown).problems,
    ),
  ];
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

/** The real path of `path`, resolving its longest existing prefix. */
function realPathOfNearest(path: string): string {
  let existing = resolve(path);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) return resolve(path);
    rest.unshift(existing.slice(parent.length).replace(/^[\\/]/, ""));
    existing = parent;
  }
  return join(realpathSync.native(existing), ...rest);
}

/** Whether `dir` holds a bundle ZAM generated: its index.md says so. */
export function isZamBundle(dir: string): boolean {
  const index = join(dir, "index.md");
  if (!existsSync(index)) return false;
  try {
    return readFileSync(index, "utf8").includes("`zam_okf_upsert`");
  } catch {
    return false;
  }
}

/**
 * Confine a bundle directory that a tool argument names to the allowed roots
 * (ADR 2026-10-08b D1). Reads need an existing folder inside a root. Writes go
 * only into an existing ZAM bundle or into `docs/okf` directly under a root,
 * and never into a root itself, so an upsert cannot create files next to a
 * repository's agent instruction files.
 */
export function confineBundleDir(
  dir: string,
  roots: readonly string[],
  mode: "read" | "write",
): string {
  // Each root's docs/okf as the file system spells it: on a case-insensitive
  // volume an existing `Docs/okf` is that folder, and the real path says so.
  const docsOkfs = roots.map((root) =>
    realPathOfNearest(join(root, "docs", "okf")),
  );
  if (mode === "write") {
    // A new knowledge base may start at docs/okf under a root, even before
    // the folder exists.
    const wanted = (
      isAbsolute(dir) ? [dir] : roots.map((r) => join(r, dir))
    ).map(realPathOfNearest);
    const docsOkf = docsOkfs.find((candidate) =>
      wanted.some((path) => samePath(path, candidate)),
    );
    if (docsOkf && !existsSync(docsOkf)) return docsOkf;
  }
  const { path, root } = resolveTrustedPath(dir, roots);
  assertNoHiddenSegments(path, root);
  if (mode === "write") {
    if (path === root) {
      throw new PathRefusedError(
        PATH_NOT_READABLE,
        path,
        `ZAM does not write articles into ${path}: a knowledge base lives in docs/okf, never at the top of a folder.`,
      );
    }
    const isDocsOkf = docsOkfs.some((candidate) => samePath(candidate, path));
    if (!isDocsOkf && !isZamBundle(path)) {
      throw new PathRefusedError(
        PATH_NOT_READABLE,
        path,
        `ZAM writes articles only into an existing ZAM knowledge base or into docs/okf; ${path} is neither.`,
      );
    }
  }
  return path;
}
