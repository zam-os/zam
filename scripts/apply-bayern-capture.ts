/**
 * Merge a capture JSON produced by capture-bayern-school-types.ts (or the
 * older capture-bayern-ws-fos-bos.ts) into the LehrplanPLUS Bayern manifest.
 *
 * Usage:
 *   npx tsx scripts/apply-bayern-capture.ts scripts/.cache/bayern-grundschule-mittelschule-foerderschule-capture.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
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
  const body = items
    .map((item) => formatter(item, `${indent}  `))
    .join(",\n");
  return `[\n${body},\n${indent}]`;
}

function formatTopicsArray(items: ManifestTopic[], indent: string): string {
  if (items.length === 0) return "[]";
  const body = items
    .map((item) => formatTopic(item, `${indent}  `))
    .join(",\n");
  return `[\n${body},\n${indent}]`;
}

function removePrefixedEntries(
  body: string,
  schoolTypes: string[],
): string {
  const prefixes = schoolTypes.map((st) => `${st}|`);
  const lines = body.split("\n");
  const out: string[] = [];
  let skipping = false;
  let depth = 0;
  let skipKind: "array" | "string" | null = null;

  for (const line of lines) {
    if (!skipping) {
      const keyMatch = line.match(/^\s*"([^"]+)":\s*(.*)$/);
      if (keyMatch && prefixes.some((p) => keyMatch[1].startsWith(p))) {
        const rest = keyMatch[2];
        if (rest.startsWith("[")) {
          skipping = true;
          skipKind = "array";
          depth = 0;
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
          if (rest.startsWith('"') && /",?\s*$/.test(rest)) {
            continue;
          }
          skipping = true;
          skipKind = "string";
          continue;
        }
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
  const match = source.match(/(\n {2}grades: \{)([\s\S]*?)(\n {2}\},)/);
  if (!match) throw new Error("grades block not found");
  let body = match[2];
  for (const st of Object.keys(grades)) {
    body = body.replace(new RegExp(`\\n    ${st}: \\[[^\\]]*\\],`, "g"), "");
  }
  const additions = Object.entries(grades)
    .map(
      ([st, gs]) =>
        `    ${st}: [${gs.map((g) => tsString(g)).join(", ")}],`,
    )
    .join("\n");
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
  const re = new RegExp(
    `(\\n {2}${blockName}: \\{)([\\s\\S]*?)(\\n {2}\\},)`,
  );
  const match = source.match(re);
  if (!match) throw new Error(`${blockName} block not found`);
  const body = removePrefixedEntries(match[2], schoolTypes);
  const additions = Object.keys(entries)
    .sort()
    .map((key) => formatter(key, entries[key]))
    .join("\n");
  const sep = body.endsWith("\n") || body.trim() === "" ? "" : "\n";
  const newBody = `${body}${sep}${additions}`;
  return source.replace(match[0], `${match[1]}${newBody}${match[3]}`);
}

function main(): void {
  const capturePath = process.argv[2];
  if (!capturePath) {
    console.error(
      "Usage: npx tsx scripts/apply-bayern-capture.ts <capture.json>",
    );
    process.exit(1);
  }

  const capture: CaptureResult = JSON.parse(
    readFileSync(resolve(capturePath), "utf8"),
  );
  let source = readFileSync(MANIFEST_PATH, "utf8");
  const schoolTypes = capture.schoolTypes;

  // Bump capturedOn; keep revision note additive
  source = source.replace(
    /capturedOn: "[^"]+"/,
    `capturedOn: ${tsString(capture.capturedOn)}`,
  );
  source = source.replace(
    /sourceRevision: "([^"]+)"/,
    (_m, prev: string) => {
      const tag = schoolTypes.join("/");
      if (prev.includes(tag)) {
        return `sourceRevision: ${tsString(prev)}`;
      }
      return `sourceRevision: ${tsString(`${prev}; +${tag} (${capture.capturedOn})`)}`;
    },
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
    `Merged ${Object.keys(capture.topics).length} topic paths (${schoolTypes.join(", ")}) into ${MANIFEST_PATH}`,
  );
  for (const st of schoolTypes) {
    const n = Object.keys(capture.topics).filter((k) =>
      k.startsWith(`${st}|`),
    ).length;
    console.log(
      `  ${st}: grades=${(capture.grades[st] ?? []).join(",")} subjects=${(capture.subjects[st] ?? []).length} topics=${n}`,
    );
  }
}

main();
