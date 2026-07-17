/**
 * Open Knowledge Format (OKF) v0.1 bundle primitives (ADR 2026-07-17).
 *
 * Pure module by design — no fs, no DB, no LLM — so the frontmatter
 * contract is unit-testable in isolation; `io.ts` adds the thin fs layer.
 *
 * Frontmatter is a deliberate YAML *subset* (no new dependencies rule):
 * scalar `key: value` pairs (optionally single/double quoted) and block
 * string lists (`key:` followed by `- item` lines). Articles needing more
 * must extend this parser and its tests first.
 */

export const OKF_VERSION = "0.1";
export const RESERVED_FILES = ["index.md", "log.md"] as const;

export type FrontmatterValue = string | string[];

export interface ParsedArticle {
  fields: Record<string, FrontmatterValue>;
  body: string;
}

export interface CatalogEntry {
  file: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  resource?: string;
  timestamp?: string;
}

export interface ValidationResult {
  ok: boolean;
  problems: string[];
}

const FILE_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

export function isReservedFile(file: string): boolean {
  return (RESERVED_FILES as readonly string[]).includes(file);
}

function unquote(raw: string): string {
  const v = raw.trim();
  if (
    v.length >= 2 &&
    ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'")))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Parse the OKF frontmatter subset. Throws with a line-anchored message on
 * anything outside the subset, so authors get actionable feedback instead
 * of silently dropped fields.
 */
export function parseFrontmatter(markdown: string): ParsedArticle {
  const lines = markdown.split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new Error("frontmatter: file must start with a --- fence");
  }
  const fields: Record<string, FrontmatterValue> = {};
  let listKey: string | null = null;
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") break;
    if (line.trim() === "") continue;
    const listItem = /^\s+-\s+(.+)$/.exec(line);
    if (listItem) {
      if (!listKey) {
        throw new Error(`frontmatter line ${i + 1}: list item without a key`);
      }
      (fields[listKey] as string[]).push(unquote(listItem[1]));
      continue;
    }
    const pair = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!pair) {
      throw new Error(
        `frontmatter line ${i + 1}: expected "key: value" or "- item"`,
      );
    }
    const key = pair[1];
    const rest = pair[2].trim();
    if (rest === "") {
      fields[key] = [];
      listKey = key;
    } else {
      fields[key] = unquote(rest);
      listKey = null;
    }
  }
  if (i >= lines.length) {
    throw new Error("frontmatter: missing closing --- fence");
  }
  return { fields, body: lines.slice(i + 1).join("\n") };
}

function scalar(
  fields: Record<string, FrontmatterValue>,
  key: string,
): string | undefined {
  const v = fields[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Validate one concept document. OKF conformance requires parseable
 * frontmatter with a non-empty `type`; ZAM's house rules additionally
 * require `description` (it seeds catalog and index lines) and kebab-case
 * file names (they are permanent IDs for learners' source links).
 */
export function validateArticle(
  file: string,
  markdown: string,
): ValidationResult {
  const problems: string[] = [];
  if (isReservedFile(file)) {
    return { ok: false, problems: [`${file}: reserved OKF file name`] };
  }
  if (!FILE_NAME_RE.test(file)) {
    problems.push(`${file}: file name must be kebab-case and end in .md`);
  }
  let parsed: ParsedArticle | null = null;
  try {
    parsed = parseFrontmatter(markdown);
  } catch (err) {
    problems.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (parsed) {
    if (!scalar(parsed.fields, "type")) {
      problems.push(`${file}: frontmatter field "type" is required`);
    }
    if (!scalar(parsed.fields, "description")) {
      problems.push(`${file}: frontmatter field "description" is required`);
    }
    if (parsed.body.trim() === "") {
      problems.push(`${file}: article body is empty`);
    }
  }
  return { ok: problems.length === 0, problems };
}

export function toCatalogEntry(file: string, markdown: string): CatalogEntry {
  const { fields } = parseFrontmatter(markdown);
  const tags = Array.isArray(fields.tags) ? fields.tags : [];
  return {
    file,
    type: scalar(fields, "type") ?? "",
    title: scalar(fields, "title") ?? file.replace(/\.md$/, ""),
    description: scalar(fields, "description") ?? "",
    tags,
    resource: scalar(fields, "resource"),
    timestamp: scalar(fields, "timestamp"),
  };
}

/** Sorted catalog for index rendering and the MCP catalog tool. */
export function buildCatalog(
  articles: Array<{ file: string; markdown: string }>,
): CatalogEntry[] {
  return articles
    .map(({ file, markdown }) => toCatalogEntry(file, markdown))
    .sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * Render the root index.md. Per OKF v0.1 the root index is the only index
 * file carrying frontmatter (`okf_version`); the body groups articles by
 * `type` with each line sourced from the article's description.
 */
export function renderIndex(
  catalog: CatalogEntry[],
  okfVersion: string = OKF_VERSION,
): string {
  const types = [...new Set(catalog.map((e) => e.type))].sort();
  const sections = types.map((type) => {
    const rows = catalog
      .filter((e) => e.type === type)
      .map((e) => `- [${e.title}](${e.file}) — ${e.description}`)
      .join("\n");
    return `## ${type}\n\n${rows}`;
  });
  return [
    "---",
    `okf_version: "${okfVersion}"`,
    "---",
    "",
    "# ZAM Knowledge Base",
    "",
    "Living reference knowledge for this repository in",
    "[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog).",
    "Current truth only — the *why* behind it lives in [../adr/](../adr/)",
    "(ADR 2026-07-17). Do not edit by hand: write through the",
    "`zam_okf_upsert` MCP tool.",
    "",
    ...sections,
    "",
  ].join("\n");
}

/**
 * Append a log entry, newest day first, merging into an existing entry
 * group when the date matches the current top group.
 */
export function appendLog(
  existing: string,
  date: string,
  line: string,
): string {
  const header = `## ${date}`;
  const entry = `- ${line}`;
  const trimmed = existing.trim();
  if (trimmed === "") {
    return `# Log\n\n${header}\n\n${entry}\n`;
  }
  const lines = trimmed.split("\n");
  const firstHeaderIdx = lines.findIndex((l) => l.startsWith("## "));
  if (firstHeaderIdx !== -1 && lines[firstHeaderIdx].trim() === header) {
    lines.splice(firstHeaderIdx + 2, 0, entry);
    return `${lines.join("\n")}\n`;
  }
  const insertAt = firstHeaderIdx === -1 ? lines.length : firstHeaderIdx;
  lines.splice(insertAt, 0, header, "", entry, "");
  return `${lines.join("\n")}\n`;
}
