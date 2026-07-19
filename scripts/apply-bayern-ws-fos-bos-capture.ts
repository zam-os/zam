/**
 * Merge scripts/.cache/bayern-ws-fos-bos-capture.json into
 * src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts
 *
 * Usage: npx tsx scripts/apply-bayern-ws-fos-bos-capture.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CAPTURE_PATH = join(
  __dirname,
  ".cache",
  "bayern-ws-fos-bos-capture.json",
);
const MANIFEST_PATH = join(
  ROOT,
  "src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts",
);

interface TaxonomyNode {
  id: string;
  label: string;
}

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

interface CaptureResult {
  schoolYear: string;
  capturedOn: string;
  schoolTypes: string[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
}

function tsString(value: string): string {
  return JSON.stringify(value);
}

function formatNode(node: TaxonomyNode, indent: string): string {
  return (
    `${indent}{\n` +
    `${indent}  id: ${tsString(node.id)},\n` +
    `${indent}  label: ${tsString(node.label)},\n` +
    `${indent}}`
  );
}

function formatTopic(topic: ManifestTopic, indent: string): string {
  const hours =
    topic.hours !== undefined ? `,\n${indent}  hours: ${topic.hours}` : "";
  return (
    `${indent}{\n` +
    `${indent}  id: ${tsString(topic.id)},\n` +
    `${indent}  label: ${tsString(topic.label)}${hours},\n` +
    `${indent}}`
  );
}

function formatArray(
  items: TaxonomyNode[],
  indent: string,
  formatter: (item: TaxonomyNode, indent: string) => string = formatNode,
): string {
  if (items.length === 0) return "[]";
  const body = items.map((item) => formatter(item, `${indent}  `)).join(",\n");
  return `[\n${body},\n${indent}]`;
}

function formatTopicsArray(items: ManifestTopic[], indent: string): string {
  if (items.length === 0) return "[]";
  const body = items
    .map((item) => formatTopic(item, `${indent}  `))
    .join(",\n");
  return `[\n${body},\n${indent}]`;
}

/**
 * Remove record entries whose keys start with any of the given school-type
 * prefixes from a TypeScript object-literal body (the inside of tracks/topics/
 * contentUrls).
 */
function removePrefixedEntries(body: string, schoolTypes: string[]): string {
  const prefixes = schoolTypes.map((st) => `${st}|`);
  const lines = body.split("\n");
  const out: string[] = [];
  let skipping = false;
  let depth = 0; // brace/bracket depth inside a skipped entry
  let skipKind: "array" | "string" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!skipping) {
      const keyMatch = line.match(/^\s*"([^"]+)":\s*(.*)$/);
      if (keyMatch && prefixes.some((p) => keyMatch[1].startsWith(p))) {
        const rest = keyMatch[2];
        if (rest.startsWith("[")) {
          skipping = true;
          skipKind = "array";
          depth = 0;
          // count brackets on this line
          for (const ch of rest) {
            if (ch === "[") depth++;
            if (ch === "]") depth--;
          }
          if (depth <= 0 && /],?\s*$/.test(rest)) {
            skipping = false;
            skipKind = null;
          }
          continue;
        }
        if (rest.startsWith('"') || rest === "") {
          // string value may be on same line or next line
          if (rest.startsWith('"') && /",?\s*$/.test(rest)) {
            continue; // single-line string entry
          }
          skipping = true;
          skipKind = "string";
          continue;
        }
        // unknown — keep
      }
      out.push(line);
    } else if (skipKind === "array") {
      for (const ch of line) {
        if (ch === "[") depth++;
        if (ch === "]") depth--;
      }
      if (depth <= 0) {
        skipping = false;
        skipKind = null;
      }
    } else if (skipKind === "string") {
      if (/"\s*,?\s*$/.test(line)) {
        skipping = false;
        skipKind = null;
      }
    }
  }
  return out.join("\n");
}

function injectGrades(
  source: string,
  grades: Record<string, string[]>,
): string {
  // Replace the grades: { ... }, block contents by appending new school types
  const match = source.match(/(\n {2}grades: \{)([\s\S]*?)(\n {2}\},)/);
  if (!match) throw new Error("grades block not found");
  let body = match[2];
  // Remove existing entries for our school types
  for (const st of Object.keys(grades)) {
    body = body.replace(new RegExp(`\\n    ${st}: \\[[^\\]]*\\],`, "g"), "");
  }
  const additions = Object.entries(grades)
    .map(([st, gs]) => `    ${st}: [${gs.map((g) => tsString(g)).join(", ")}],`)
    .join("\n");
  // Insert before closing — keep existing realschule/gymnasium
  const newBody = `${body}\n${additions}`;
  return source.replace(match[0], `${match[1]}${newBody}${match[3]}`);
}

function injectSubjects(
  source: string,
  subjects: Record<string, TaxonomyNode[]>,
): string {
  const match = source.match(/(\n {2}subjects: \{)([\s\S]*?)(\n {2}\},)/);
  if (!match) throw new Error("subjects block not found");
  let body = match[2];
  for (const st of Object.keys(subjects)) {
    // Remove whole school-type subject arrays: `\n    st: [ ... ],`
    const re = new RegExp(`\\n    ${st}: \\[[\\s\\S]*?\\n    \\],`);
    body = body.replace(re, "");
  }
  const additions = Object.entries(subjects)
    .map(([st, list]) => {
      const arr = formatArray(list, "    ");
      return `    ${st}: ${arr},`;
    })
    .join("\n");
  const newBody = `${body}\n${additions}`;
  return source.replace(match[0], `${match[1]}${newBody}${match[3]}`);
}

function injectRecordBlock(
  source: string,
  blockName: "tracks" | "topics" | "contentUrls",
  entries: Record<string, unknown>,
  schoolTypes: string[],
  formatter: (key: string, value: unknown) => string,
): string {
  // Match `  tracks: { ... },` at top level (2-space indent, next top-level key)
  const re = new RegExp(`(\\n  ${blockName}: \\{)([\\s\\S]*?)(\\n  \\},)`);
  const match = source.match(re);
  if (!match) throw new Error(`${blockName} block not found`);
  const body = removePrefixedEntries(match[2], schoolTypes);
  // Ensure trailing comma style
  const additions = Object.keys(entries)
    .sort()
    .map((key) => formatter(key, entries[key]))
    .join("\n");
  // body may end without newline
  const sep = body.endsWith("\n") || body.trim() === "" ? "" : "\n";
  const newBody = `${body}${sep}${additions}`;
  return source.replace(match[0], `${match[1]}${newBody}${match[3]}`);
}

function updateCapturedOn(source: string, capturedOn: string): string {
  return source.replace(
    /capturedOn: "[^"]+"/,
    `capturedOn: ${tsString(capturedOn)}`,
  );
}

function main(): void {
  const capture: CaptureResult = JSON.parse(readFileSync(CAPTURE_PATH, "utf8"));
  let source = readFileSync(MANIFEST_PATH, "utf8");
  const schoolTypes = capture.schoolTypes;

  source = updateCapturedOn(source, capture.capturedOn);
  source = source.replace(
    /sourceRevision: "[^"]+"/,
    `sourceRevision: "LehrplanPLUS Bayern – including WS/FOS/BOS (${capture.capturedOn})"`,
  );
  source = injectGrades(source, capture.grades);
  source = injectSubjects(source, capture.subjects);

  source = injectRecordBlock(
    source,
    "tracks",
    capture.tracks,
    schoolTypes,
    (key, value) => {
      const arr = formatArray(value as TaxonomyNode[], "    ");
      return `    ${tsString(key)}: ${arr},`;
    },
  );

  source = injectRecordBlock(
    source,
    "topics",
    capture.topics,
    schoolTypes,
    (key, value) => {
      const arr = formatTopicsArray(value as ManifestTopic[], "    ");
      return `    ${tsString(key)}: ${arr},`;
    },
  );

  source = injectRecordBlock(
    source,
    "contentUrls",
    capture.contentUrls,
    schoolTypes,
    (key, value) => {
      return `    ${tsString(key)}:\n      ${tsString(value as string)},`;
    },
  );

  writeFileSync(MANIFEST_PATH, source, "utf8");
  console.log(
    `Merged ${Object.keys(capture.topics).length} topic paths into ${MANIFEST_PATH}`,
  );
  console.log(
    `grades: ${JSON.stringify(capture.grades)} subjects: ${Object.fromEntries(
      Object.entries(capture.subjects).map(([k, v]) => [k, v.length]),
    )}`,
  );
}

main();
