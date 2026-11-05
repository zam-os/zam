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

/**
 * Agent instruction files (ADR 2026-10-08b D1): an article write must never
 * produce one, wherever the bundle sits.
 */
export const AGENT_INSTRUCTION_FILES = [
  "claude.md",
  "agents.md",
  "gemini.md",
  "readme.md",
] as const;

export function isReservedFile(file: string): boolean {
  const lower = file.toLowerCase();
  return (
    (RESERVED_FILES as readonly string[]).includes(lower) ||
    (AGENT_INSTRUCTION_FILES as readonly string[]).includes(lower)
  );
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
  // Windows checkouts (git autocrlf) deliver CRLF files and Windows editors
  // sometimes prepend a UTF-8 BOM; either would defeat the fence check and
  // every $-anchored pattern below, so normalize up front. The body is
  // rebuilt from these lines, so it comes out LF-normalized.
  const lines = markdown.replace(/^﻿/, "").split(/\r\n|\n/);
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
    problems.push(
      `${file}: ${err instanceof Error ? err.message : String(err)}`,
    );
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
    sections.join("\n\n"),
    "",
  ].join("\n");
}

/**
 * Keep original line endings and whitespace when editing bundle navigation.
 */
function linesOf(markdown: string): string[] {
  return markdown.match(/[^\n]*\n|[^\n]+$/g) ?? [];
}

/** Markdown tab stops are four columns wide, including inside list prefixes. */
function columnAfter(text: string, column = 0): number {
  for (const character of text) {
    column += character === "\t" ? 4 - (column % 4) : 1;
  }
  return column;
}

/** Ignore frontmatter and code while retaining list nesting context. */
function contentLines(lines: string[]): string[] {
  let frontmatter = lines[0]?.replace(/^﻿/, "").trim() === "---";
  let fence = "";
  let paragraph = false;
  const listIndents: number[] = [];
  return lines.map((line, i) => {
    const text = line.trimEnd();
    if (frontmatter) {
      if (i > 0 && text === "---") frontmatter = false;
      return "";
    }
    if (text.trim() === "") {
      paragraph = false;
      return "";
    }
    const leading = /^[ \t]*/.exec(text)?.[0] ?? "";
    const indent = columnAfter(leading);
    const body = text.slice(leading.length);
    const interruptsParagraph =
      /^(?:#{1,6}(?:[ \t]|$)|>|[-*+](?:[ \t]|$)|\d{1,9}[.)](?:[ \t]|$)|`{3,}|~{3,}|<|(?:[-*_][ \t]*){3,}$)/.test(
        body,
      );
    // A dedented plain line can still belong to the list item's paragraph.
    const lazy = paragraph && !fence && !interruptsParagraph;
    while (
      !lazy &&
      listIndents.length &&
      indent < listIndents[listIndents.length - 1]
    ) {
      listIndents.pop();
    }
    const containerIndent = listIndents.at(-1) ?? 0;
    const code = indent - containerIndent >= 4;
    const marker = code
      ? null
      : /^(`{3,}|~{3,})(.*)$/.exec(text.slice(leading.length));
    if (fence) {
      paragraph = false;
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        marker[2].trim() === ""
      ) {
        fence = "";
      }
      return "";
    }
    if (code) {
      paragraph = false;
      return "";
    }
    if (marker) {
      paragraph = false;
      fence = marker[1];
      return "";
    }
    const list = /^([-*+]|\d{1,9}[.)])([ \t]+)/.exec(
      text.slice(leading.length),
    );
    if (list) {
      const markerEnd = indent + list[1].length;
      const gap = columnAfter(list[2], markerEnd) - markerEnd;
      listIndents.push(markerEnd + (gap <= 4 ? gap : 1));
      paragraph = false;
      // More than four spaces after a marker starts code inside that item.
      if (gap > 4) return "";
      const itemFence = /^(`{3,}|~{3,})(.*)$/.exec(body.slice(list[0].length));
      if (itemFence) {
        fence = itemFence[1];
        return "";
      }
    }
    paragraph = !interruptsParagraph || Boolean(list);
    return text;
  });
}

function insertLines(
  lines: string[],
  at: number,
  added: string[],
  eol: string,
): string {
  if (at > 0 && !lines[at - 1].endsWith("\n")) lines[at - 1] += eol;
  lines.splice(at, 0, ...added);
  return lines.join("");
}

/**
 * Read the leading link of a Markdown list row. Labels may have
 * nested or escaped brackets; destinations may have an optional link title.
 * The caller masks code using the surrounding list's indentation context.
 */
function indexRowLink(
  line: string,
): { prefix: string; file: string } | undefined {
  const bullet = /^([ \t]*[-*+][ \t]+)\[/.exec(line);
  if (!bullet) return undefined;
  let depth = 1;
  for (let i = bullet[0].length; i < line.length; i++) {
    if (line[i] === "\\") {
      i++;
    } else if (line[i] === "[") {
      depth++;
    } else if (line[i] === "]" && --depth === 0) {
      const target =
        /^\((?:<([^<>]+)>|([^\s()<>]+))(?:[ \t]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?[ \t]*\)/.exec(
          line.slice(i + 1),
        );
      if (!target) return undefined;
      return {
        prefix: bullet[1],
        file: (target[1] ?? target[2]).replace(/^\.\//, ""),
      };
    }
  }
  return undefined;
}

/**
 * Replace only this article's list row, keeping its subgroup when its type
 * is unchanged. New entries go before any subgroups of their matching ##
 * type section; a changed type moves the row. All other text stays intact.
 */
export function updateIndex(existing: string, entry: CatalogEntry): string {
  const lines = linesOf(existing);
  let content = contentLines(lines);
  const eol = existing.includes("\r\n") ? "\r\n" : "\n";
  const row = `[${entry.title}](${entry.file}) — ${entry.description}`;
  const typeHeading = (line: string) =>
    /^##[ \t]+(.+?)(?:[ \t]+#+)?$/.exec(line)?.[1];
  let type: string | undefined;
  for (let i = 0; i < content.length; i++) {
    if (/^#[ \t]/.test(content[i])) type = undefined;
    type = typeHeading(content[i]) ?? type;
    const link = indexRowLink(content[i]);
    if (link?.file !== entry.file) continue;
    if (type === entry.type) {
      const ending = /\r?\n$/.exec(lines[i])?.[0] ?? "";
      lines[i] = `${link.prefix}${row}${ending}`;
      return lines.join("");
    }
    lines.splice(i, 1);
    content = contentLines(lines);
    break;
  }

  const section = content.findIndex((line) => typeHeading(line) === entry.type);
  if (section === -1) {
    const gap = lines.length && lines.at(-1)?.trim() !== "" ? [eol] : [];
    return insertLines(
      lines,
      lines.length,
      [...gap, `## ${entry.type}${eol}`, eol, `- ${row}${eol}`],
      eol,
    );
  }
  let at = section + 1;
  while (at < content.length && !/^#{1,6}[ \t]/.test(content[at])) at++;
  while (at > section + 1 && lines[at - 1].trim() === "") at--;
  const before = /^\s*[-*+][ \t]/.test(content[at - 1]) ? [] : [eol];
  const after = at < lines.length && lines[at].trim() !== "" ? [eol] : [];
  return insertLines(lines, at, [...before, `- ${row}${eol}`, ...after], eol);
}

export interface LogEntry {
  file: string;
  title: string;
  created: boolean;
}

/**
 * Recognize dated filename bullets, including inline-code filenames and
 * the bundle's bullet/separator style. Notes belong to the original entry
 * and are never copied to another article.
 */
const DATED_LOG_ROW =
  /^([ \t]*[-*+][ \t]+)(\d{4}-\d{2}-\d{2})([ \t]+[—–-][ \t]+)(`?)([a-z0-9-]+\.md)\4(:[ \t]*)(created|updated)\b/;
const LOG_DATE_HEADING = /^##[ \t]+(\d{4}-\d{2}-\d{2})(?:[ \t]+#+)?$/;

/**
 * Preserve dated-bullet or date-heading logs, including their direction
 * and same-day deduplication. Empty logs use ZAM's date-heading format;
 * nonempty logs without date headings receive a dated filename bullet.
 */
export function appendLog(
  existing: string,
  date: string,
  entry: LogEntry,
): string {
  const lines = linesOf(existing);
  const content = contentLines(lines);
  const eol = existing.includes("\r\n") ? "\r\n" : "\n";
  const groupedRow = `- **${entry.created ? "Creation" : "Update"}** — [${entry.title}](${entry.file})`;
  if (existing.trim() === "") {
    return `# Log${eol}${eol}## ${date}${eol}${eol}${groupedRow}${eol}`;
  }
  const headings = content.flatMap((line, i) => {
    const match = LOG_DATE_HEADING.exec(line);
    return match ? [{ i, date: match[1] }] : [];
  });
  const bullets = content.flatMap((line, i) => {
    const match = DATED_LOG_ROW.exec(line);
    return match ? [{ i, date: match[2], match }] : [];
  });
  if (bullets.length && (!headings.length || bullets[0].i < headings[0].i)) {
    const action = entry.created ? "created" : "updated";
    if (
      bullets.some(
        ({ date: day, match }) =>
          day === date && match[5] === entry.file && match[7] === action,
      )
    ) {
      return existing;
    }
    const style = bullets[0].match;
    const row = `${style[1]}${date}${style[3]}${style[4]}${entry.file}${style[4]}${style[6]}${action}${eol}`;
    const ascending = bullets[0].date < bullets[bullets.length - 1].date;
    const next = bullets.find((b) =>
      ascending ? b.date > date : b.date <= date,
    );
    return insertLines(
      lines,
      next?.i ?? bullets[bullets.length - 1].i + 1,
      [row],
      eol,
    );
  }
  if (headings.length) {
    const today = headings.find((h) => h.date === date);
    if (today) {
      let end = today.i + 1;
      while (end < content.length && !/^#{1,2}[ \t]/.test(content[end])) end++;
      if (content.slice(today.i + 1, end).some((line) => line === groupedRow)) {
        return existing;
      }
      let at = today.i + 1;
      while (at < end && lines[at].trim() === "") at++;
      const gap = at === today.i + 1 ? [eol] : [];
      return insertLines(lines, at, [...gap, `${groupedRow}${eol}`], eol);
    }
    const ascending = headings[0].date < headings[headings.length - 1].date;
    const next = headings.find((h) =>
      ascending ? h.date > date : h.date < date,
    );
    const at = next?.i ?? lines.length;
    const gap = at > 0 && lines[at - 1].trim() !== "" ? [eol] : [];
    return insertLines(
      lines,
      at,
      [...gap, `## ${date}${eol}`, eol, `${groupedRow}${eol}`, eol],
      eol,
    );
  }
  const gap = lines.at(-1)?.trim() !== "" ? [eol] : [];
  return insertLines(
    lines,
    lines.length,
    [
      ...gap,
      `- ${date} — ${entry.file}: ${entry.created ? "created" : "updated"}${eol}`,
    ],
    eol,
  );
}
