/**
 * Filesystem layer for OKF bundles (ADR 2026-07-17). Everything that
 * touches disk lives here; the contract itself is in bundle.ts.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
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
