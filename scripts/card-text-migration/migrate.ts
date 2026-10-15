/**
 * Bundled tiles: raw LaTeX and Markdown → card-text segments
 * (ADR 2026-10-14b Decision 8; plan Phase 5).
 *
 *   npx tsx scripts/card-text-migration/migrate.ts            # dry run: stats, speech worklist
 *   npx tsx scripts/card-text-migration/migrate.ts --write    # rewrite the tiles
 *
 * Inputs, all in this folder and all reviewed in the pull request's diff:
 *
 * - `patches.json`  — explicit repairs of damaged strings (JSON `\t`/`\r`
 *   that ate a `\`, unbalanced braces, a bare `&`, a doubled backslash).
 * - `rewrites.txt`  — whole-field rewrites where a formula had no dollars:
 *   bare commands and ASCII math (`a^2 = b^2 + …`) written as `$…$` TeX.
 * - `speech.tsv`    — how each formula is read aloud, per language. A dry
 *   run lists formulas still without a reading in `speech-worklist.json`;
 *   `speech-draft.ts` drafts them for a person to correct.
 *
 * After `--write`, `diff-report.ts` writes the owner's review material.
 *
 * Patches and rewrites are keyed by practice-item id, never by file: the
 * Optik tiles share six items, and every tile carrying one must receive the
 * identical result, or each reinstall would publish a spurious revision.
 *
 * The pass is deterministic and idempotent: it lifts `$$…$$` then `$…$`
 * with `liftDollarMath(…, "strict")`, drops Markdown emphasis from text,
 * turns the six LaTeX atom titles into plain Unicode, and marks every item
 * whose learner-visible text changed `materiality: "cosmetic"`. Numbers keep
 * their exact source text (`13.0` stays `13.0`), so the diff shows only
 * what changed.
 */

import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  type CardSegment,
  type CardText,
  findPlainTextMarkup,
  normalizeCardText,
  plainProjection,
  validateCardText,
} from "../../src/kernel/library/card-text.js";
import { liftDollarMath } from "../../src/kernel/library/dollar-lift.js";
import { texToPlain } from "../../src/kernel/library/tex-plain.js";
import { texIssues } from "../../src/kernel/library/tex-tokenizer.js";

const ROOT = join(import.meta.dirname, "../..");
const TILES = join(ROOT, "tests/fixtures/curriculum");
const HERE = import.meta.dirname;

interface Patch {
  item: string;
  field: string;
  find: string;
  replace: string;
  /** Replace every occurrence; otherwise exactly one must exist. */
  all?: boolean;
}

type Json = Record<string, unknown>;

const patches = JSON.parse(
  readFileSync(join(HERE, "patches.json"), "utf-8"),
) as Patch[];
/**
 * `rewrites.txt`: blocks of `@ <item id>#<field>` followed by the new text,
 * TeX written as it reads (no JSON escaping), so a reviewer can read it.
 */
function readRewrites(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let key: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (key) out[key] = lines.join("\n").replace(/\s+$/, "");
    lines = [];
  };
  for (const line of text.split("\n")) {
    if (line.startsWith("@ ")) {
      flush();
      key = line.slice(2).trim();
    } else if (key && !(lines.length === 0 && line.trim() === "")) {
      lines.push(line);
    }
  }
  flush();
  return out;
}

/** `speech.tsv`: `language<TAB>tex<TAB>speech`, one formula per line. */
function readSpeech(text: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [lang, tex, spoken] = line.split("\t");
    if (!lang || !tex || !spoken) {
      throw new Error(`speech.tsv: malformed line: ${line}`);
    }
    out[lang] ??= {};
    if (out[lang][tex] && out[lang][tex] !== spoken) {
      throw new Error(`speech.tsv: two readings for ${tex}`);
    }
    out[lang][tex] = spoken;
  }
  return out;
}

const rewrites = readRewrites(
  readFileSync(join(HERE, "rewrites.txt"), "utf-8"),
);
const speech = readSpeech(readFileSync(join(HERE, "speech.tsv"), "utf-8"));

const write = process.argv.includes("--write");
const usedPatches = new Set<Patch>();
const usedRewrites = new Set<string>();
/** `item#field` already in segment form, so its patch or rewrite is spent. */
const migrated = new Set<string>();
const usedSpeech = new Set<string>();
const missingSpeech = new Map<
  string,
  { lang: string; tex: string; where: string }
>();
const problems: string[] = [];
let changedItems = 0;
let mathFormulas = 0;

/** JSON with every number kept as written in the source. */
function parseTile(text: string): Json {
  return JSON.parse(text, (_key, value, context) =>
    typeof value === "number"
      ? // biome-ignore lint/suspicious/noExplicitAny: Node 22's source-text access.
        (JSON as any).rawJSON((context as { source: string }).source)
      : value,
  ) as Json;
}

function patched(item: string, field: string, text: string): string {
  const rewrite = rewrites[`${item}#${field}`];
  if (rewrite !== undefined) {
    usedRewrites.add(`${item}#${field}`);
    text = rewrite;
  }
  for (const patch of patches) {
    if (patch.item !== item || patch.field !== field) continue;
    const count = text.split(patch.find).length - 1;
    if (count === 0 || (!patch.all && count !== 1)) {
      problems.push(
        `patch ${item}#${field}: "${patch.find}" occurs ${count} times`,
      );
      continue;
    }
    usedPatches.add(patch);
    text = text.split(patch.find).join(patch.replace);
  }
  return text;
}

/** Stands for a formula while emphasis is stripped around it. */
const FORMULA = "\uE000";

/**
 * Drop Markdown emphasis delimiters, keeping the emphasised words. A span may
 * wrap a formula (`**Alkene ($C_nH_{2n}$)**`) or nest inside another
 * (`*„fertig“**,** sagte Paul.*`), so the text segments are joined around a
 * stand-in for each formula and stripped until nothing is left.
 */
function withoutEmphasis(segments: CardText): CardText {
  const formulas = segments.filter((s) => s.type !== "text");
  let joined = segments
    .map((s) => (s.type === "text" ? s.text : FORMULA))
    .join("");
  for (let pass = 0; pass < 10; pass++) {
    const spans = findPlainTextMarkup(joined).filter(
      (m) => m.code === "emphasis",
    );
    if (spans.length === 0) break;
    // One pass applies only spans that do not overlap; the next finds the rest.
    const chosen: typeof spans = [];
    let end = -1;
    for (const span of spans.sort((a, b) => a.offset - b.offset)) {
      if (span.offset < end) continue;
      chosen.push(span);
      end = span.offset + span.length;
    }
    for (const span of chosen.reverse()) {
      const inner = span.text
        .replace(/^(\*\*|__|\*|_)/, "")
        .replace(/(\*\*|__|\*|_)$/, "");
      joined =
        joined.slice(0, span.offset) +
        inner +
        joined.slice(span.offset + span.length);
    }
  }
  const texts = joined.split(FORMULA);
  if (texts.length !== formulas.length + 1) {
    throw new Error(
      `emphasis stripping lost a formula in: ${joined.slice(0, 80)}`,
    );
  }
  const out: CardSegment[] = [];
  texts.forEach((text, index) => {
    out.push({ type: "text", text });
    if (index < formulas.length) out.push(formulas[index]);
  });
  return out;
}

/** Text → segments: lift the dollars, clean the text, add speech. */
function toSegments(
  text: string,
  lang: string,
  where: string,
  needsSpeech: boolean,
): CardText {
  const lifted = liftDollarMath(text, "strict").segments;
  const out: CardSegment[] = [];
  for (const segment of lifted) {
    if (segment.type === "text") {
      out.push(segment);
      continue;
    }
    if (segment.type !== "math") continue;
    mathFormulas++;
    const issues = texIssues(segment.tex);
    if (issues.length > 0) {
      problems.push(
        `${where}: ${issues[0].message} — ${segment.tex.slice(0, 60)}`,
      );
    }
    const spoken = speech[lang]?.[segment.tex];
    if (spoken && needsSpeech) usedSpeech.add(`${lang}\u0001${segment.tex}`);
    if (needsSpeech && !spoken) {
      missingSpeech.set(`${lang}\u0001${segment.tex}`, {
        lang,
        tex: segment.tex,
        where,
      });
    }
    out.push(
      spoken && needsSpeech ? { ...segment, speech: spoken } : { ...segment },
    );
  }
  return normalizeCardText(withoutEmphasis(out));
}

const hasMath = (segments: CardText) => segments.some((s) => s.type === "math");

/** A plain title: formulas written as Unicode, emphasis dropped. */
function plainTitle(text: string): string {
  return withoutEmphasis(liftDollarMath(text, "strict").segments)
    .map((segment) =>
      segment.type === "math"
        ? texToPlain(segment.tex)
        : segment.type === "text"
          ? segment.text
          : "",
    )
    .join("");
}

function migrateItem(item: Json, file: string, lang: string): boolean {
  const id = String(item.id);
  let changed = false;
  for (const field of ["question", "concept"] as const) {
    const original = item[field];
    const existing = item[`${field}_segments`];
    if (typeof original !== "string") {
      if (Array.isArray(existing)) {
        // Already migrated: refresh speech only.
        migrated.add(`${id}#${field}`);
        const refreshed = (existing as CardText).map((segment) =>
          segment.type === "math"
            ? {
                ...segment,
                speech: speech[lang]?.[segment.tex] ?? segment.speech,
              }
            : segment,
        );
        for (const segment of refreshed) {
          if (segment.type === "math" && speech[lang]?.[segment.tex]) {
            usedSpeech.add(`${lang}\u0001${segment.tex}`);
          }
          if (segment.type === "math" && !segment.speech) {
            missingSpeech.set(`${lang}\u0001${segment.tex}`, {
              lang,
              tex: segment.tex,
              where: `${file} ${id} ${field}`,
            });
          }
        }
        item[`${field}_segments`] = refreshed;
      }
      continue;
    }
    const text = patched(id, field, original);
    const segments = toSegments(text, lang, `${file} ${id} ${field}`, true);
    if (hasMath(segments)) {
      delete item[field];
      item[`${field}_segments`] = segments;
      changed = true;
    } else {
      const plain = plainProjection(
        segments.length ? segments : [{ type: "text", text }],
      );
      if (plain !== original) changed = true;
      item[field] = segments.length ? plain : text;
    }
  }

  const check = item.fast_check as Json | undefined;
  if (check && Array.isArray(check.options)) {
    check.options = (check.options as unknown[]).map((option, index) => {
      if (typeof option !== "string") {
        migrated.add(`${id}#option${index}`);
        for (const segment of option as CardText) {
          if (segment.type === "math" && speech[lang]?.[segment.tex]) {
            usedSpeech.add(`${lang}\u0001${segment.tex}`);
          }
        }
        return option;
      }
      const text = patched(id, `option${index}`, option);
      const segments = toSegments(
        text,
        lang,
        `${file} ${id} option${index}`,
        true,
      );
      if (hasMath(segments)) {
        changed = true;
        return segments;
      }
      const plain = segments.length ? plainProjection(segments) : text;
      if (plain !== option) changed = true;
      return plain;
    });
  }

  if (Array.isArray(item.sample_solution))
    migrated.add(`${id}#sample_solution`);
  if (typeof item.sample_solution === "string") {
    // Tile data only, never installed: lifted and repaired so a tile has one
    // format, but its formulas need no speech.
    const text = patched(id, "sample_solution", item.sample_solution);
    const segments = toSegments(
      text,
      lang,
      `${file} ${id} sample_solution`,
      false,
    );
    item.sample_solution = hasMath(segments)
      ? segments
      : segments.length
        ? plainProjection(segments)
        : text;
  }

  if (changed && item.materiality === undefined) item.materiality = "cosmetic";
  return changed;
}

/** Re-order an item's keys so segments sit where their plain field was. */
function ordered(item: Json): Json {
  const order = [
    "id",
    "language",
    "tier",
    "bloom_level",
    "question",
    "question_segments",
    "concept",
    "concept_segments",
    "fast_check",
    "choice_distractors",
    "sample_solution",
    "materiality",
  ];
  const out: Json = {};
  for (const key of order) if (key in item) out[key] = item[key];
  for (const key of Object.keys(item)) if (!(key in out)) out[key] = item[key];
  return out;
}

const files = readdirSync(TILES).filter((f) => f.endsWith("-kvt.json"));
const outputs = new Map<string, Map<string, string>>();
for (const file of files) {
  const path = join(TILES, file);
  const tile = parseTile(readFileSync(path, "utf-8"));
  for (const atom of tile.atoms as Json[]) {
    if (typeof atom.title === "string" && atom.title.includes("$")) {
      atom.title = plainTitle(atom.title);
    }
    atom.practice_items = (atom.practice_items as Json[]).map((item) => {
      const lang = typeof item.language === "string" ? item.language : "de";
      const changed = migrateItem(item, file, lang);
      if (changed) changedItems++;
      // Only a rewritten item moves its keys; the rest keep their diff empty.
      const result = changed ? ordered(item) : item;
      // Shared item ids must come out identical in every tile.
      const json = JSON.stringify(result);
      const seen = outputs.get(String(item.id)) ?? new Map<string, string>();
      seen.set(file, json);
      outputs.set(String(item.id), seen);
      return result;
    });
  }
  if (write) writeFileSync(path, `${JSON.stringify(tile, null, 2)}\n`);
}

for (const [id, byFile] of outputs) {
  if (new Set(byFile.values()).size > 1) {
    problems.push(
      `item ${id} differs between ${[...byFile.keys()].join(", ")}`,
    );
  }
}
for (const patch of patches) {
  if (
    !usedPatches.has(patch) &&
    !migrated.has(`${patch.item}#${patch.field}`)
  ) {
    problems.push(`unused patch ${patch.item}#${patch.field}`);
  }
}
for (const key of Object.keys(rewrites)) {
  if (!usedRewrites.has(key) && !migrated.has(key)) {
    problems.push(`unused rewrite ${key}`);
  }
}
for (const [lang, entries] of Object.entries(speech)) {
  for (const [tex, spoken] of Object.entries(entries)) {
    const issues = validateCardText([{ type: "math", tex, speech: spoken }], {
      requireSpeech: true,
    });
    if (issues.length)
      problems.push(`speech ${lang} ${tex}: ${issues[0].message}`);
    if (!usedSpeech.has(`${lang}\u0001${tex}`))
      problems.push(`unused speech ${lang} ${tex}`);
  }
}

const worklist = [...missingSpeech.values()];
const worklistPath = join(HERE, "speech-worklist.json");
if (worklist.length > 0) {
  writeFileSync(worklistPath, `${JSON.stringify(worklist, null, 2)}\n`);
} else {
  rmSync(worklistPath, { force: true });
}
console.log(
  JSON.stringify(
    {
      tiles: files.length,
      changedItems,
      formulas: mathFormulas,
      missingSpeech: worklist.length,
      problems: problems.length,
      written: write,
    },
    null,
    2,
  ),
);
for (const problem of problems.slice(0, 50)) console.log(`  ${problem}`);
if (problems.length > 0) process.exitCode = 1;
