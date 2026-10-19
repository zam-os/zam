/**
 * What the card-text migration changed, for the owner's review
 * (ADR 2026-10-14b; plan Phase 5, steps 6, 8 and 9).
 *
 *   npx tsx scripts/card-text-migration/diff-report.ts [--base main]
 *
 * Writes two things:
 *
 * - `report/` (git-ignored): one Markdown page per changed tile. Every
 *   changed field as plain text before → after, and every formula a learner
 *   sees with its plain Unicode and its speech.
 * - `review-sample.md` (committed): the sample the owner reads before the
 *   phase merges — the repaired strings, the rewrites, fractions, matrices,
 *   prescripts, reactions, a spread per subject, and the speech lengths.
 *
 * "Before" is each tile as it stands on the base ref; "after" is the working
 * tree. Run `migrate.ts --write` first.
 */

import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  type CardText,
  type MathSegment,
  plainProjection,
} from "../../src/kernel/library/card-text.js";
import { texToPlain } from "../../src/kernel/library/tex-plain.js";

const ROOT = join(import.meta.dirname, "../..");
const TILES = join(ROOT, "tests/fixtures/curriculum");
const HERE = import.meta.dirname;
const REPORT = join(HERE, "report");

const baseIndex = process.argv.indexOf("--base");
const BASE = baseIndex > 0 ? process.argv[baseIndex + 1] : "main";

type Json = Record<string, unknown>;

interface Formula {
  file: string;
  subject: string;
  item: string;
  field: string;
  tex: string;
  speech?: string;
}

function baseTile(file: string): Json | null {
  try {
    const text = execFileSync(
      "git",
      ["show", `${BASE}:tests/fixtures/curriculum/${file}`],
      { cwd: ROOT, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
    );
    return JSON.parse(text) as Json;
  } catch {
    return null;
  }
}

/** `de-by-gymnasium-10-mathematik-…-kvt.json` → `mathematik`. */
const subjectOf = (file: string) => file.split("-")[4] ?? "?";

/** A field's plain text, whatever form it is stored in. */
function plainOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return plainProjection(value as CardText);
  return undefined;
}

function itemFields(item: Json): Map<string, unknown> {
  const out = new Map<string, unknown>();
  out.set("question", item.question_segments ?? item.question);
  out.set("concept", item.concept_segments ?? item.concept);
  const options = (item.fast_check as Json | undefined)?.options;
  if (Array.isArray(options)) {
    options.forEach((option, index) => {
      out.set(`option${index}`, option);
    });
  }
  out.set("sample_solution", item.sample_solution);
  return out;
}

const fence = (text: string) =>
  `\`\`\`text\n${text.replace(/```/g, "ˋˋˋ")}\n\`\`\``;
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");
const code = (text: string) => `\`${cell(text).replace(/`/g, "ˋ")}\``;

function formulaTable(formulas: Formula[]): string {
  const rows = formulas.map(
    (f) =>
      `| ${code(f.tex)} | ${cell(texToPlain(f.tex))} | ${cell(f.speech ?? "—")} |`,
  );
  return ["| TeX | Plain | Gesprochen |", "|---|---|---|", ...rows].join("\n");
}

// ── Walk every tile ─────────────────────────────────────────────────────────

const formulas: Formula[] = [];
const pages: Array<{ file: string; changes: number }> = [];
const beforeByKey = new Map<string, string>();
/** Each field's source text on the base ref, dollars and all. */
const rawBefore = new Map<string, string>();
const afterByKey = new Map<string, unknown>();

rmSync(REPORT, { recursive: true, force: true });
mkdirSync(REPORT, { recursive: true });

for (const file of readdirSync(TILES).filter((f) => f.endsWith("-kvt.json"))) {
  const after = JSON.parse(readFileSync(join(TILES, file), "utf-8")) as Json;
  const before = baseTile(file);
  const beforeItems = new Map<string, Json>();
  const beforeTitles: string[] = [];
  for (const atom of (before?.atoms as Json[] | undefined) ?? []) {
    beforeTitles.push(String(atom.title));
    for (const item of atom.practice_items as Json[]) {
      beforeItems.set(String(item.id), item);
    }
  }

  const lines: string[] = [`# ${file}`, ""];
  let changes = 0;
  (after.atoms as Json[]).forEach((atom, atomIndex) => {
    const title = String(atom.title);
    if (
      beforeTitles[atomIndex] !== undefined &&
      beforeTitles[atomIndex] !== title
    ) {
      changes++;
      lines.push(
        `## Titel`,
        "",
        fence(beforeTitles[atomIndex]),
        "→",
        fence(title),
        "",
      );
    }
    for (const item of atom.practice_items as Json[]) {
      const id = String(item.id);
      const old = beforeItems.get(id);
      const oldFields = old ? itemFields(old) : new Map<string, unknown>();
      const itemFormulas: Formula[] = [];
      const itemLines: string[] = [];
      for (const [field, value] of itemFields(item)) {
        const key = `${id}#${field}`;
        const beforeText = plainOf(oldFields.get(field));
        const afterText = plainOf(value);
        if (beforeText !== undefined) beforeByKey.set(key, beforeText);
        const raw = oldFields.get(field);
        if (typeof raw === "string") rawBefore.set(key, raw);
        afterByKey.set(key, value);
        if (Array.isArray(value)) {
          for (const segment of value as CardText) {
            if (segment.type !== "math") continue;
            const formula: Formula = {
              file,
              subject: subjectOf(file),
              item: id,
              field,
              tex: segment.tex,
              speech: (segment as MathSegment).speech,
            };
            if (field !== "sample_solution") {
              formulas.push(formula);
              itemFormulas.push(formula);
            }
          }
        }
        if (beforeText !== afterText) {
          itemLines.push(
            `**${field}**`,
            "",
            fence(beforeText ?? "(fehlt)"),
            "→",
            fence(afterText ?? "(fehlt)"),
            "",
          );
        }
      }
      if (itemLines.length === 0) continue;
      changes++;
      lines.push(
        `## ${id}${item.materiality ? ` (${item.materiality})` : ""}`,
        "",
        ...itemLines,
      );
      if (itemFormulas.length > 0) lines.push(formulaTable(itemFormulas), "");
    }
  });
  if (changes > 0) {
    writeFileSync(
      join(REPORT, file.replace(/\.json$/, ".md")),
      `${lines.join("\n")}\n`,
    );
    pages.push({ file, changes });
  }
}

writeFileSync(
  join(REPORT, "index.md"),
  [
    `# Card-text migration — changed tiles (base \`${BASE}\`)`,
    "",
    ...pages.map(
      (p) =>
        `- [${p.file}](${p.file.replace(/\.json$/, ".md")}) — ${p.changes} changed`,
    ),
    "",
  ].join("\n"),
);

// ── The review sample ───────────────────────────────────────────────────────

/** One entry per distinct formula, in a stable order. */
function distinct(list: Formula[]): Formula[] {
  const seen = new Set<string>();
  return list
    .filter((f) => {
      if (seen.has(f.tex)) return false;
      seen.add(f.tex);
      return true;
    })
    .sort((a, b) => a.tex.localeCompare(b.tex));
}

/** `count` entries spread evenly over the list. */
function spread<T>(list: T[], count: number): T[] {
  if (list.length <= count) return list;
  return Array.from(
    { length: count },
    (_, i) => list[Math.floor((i * list.length) / count)],
  );
}

const spoken = distinct(formulas.filter((f) => f.speech));
const pick = (test: (tex: string) => boolean, count: number) =>
  spread(
    spoken.filter((f) => test(f.tex)),
    count,
  );

const patches = JSON.parse(
  readFileSync(join(HERE, "patches.json"), "utf-8"),
) as Array<{
  item: string;
  field: string;
  find: string;
  replace: string;
}>;
const rewriteKeys = readFileSync(join(HERE, "rewrites.txt"), "utf-8")
  .split("\n")
  .filter((line) => line.startsWith("@ "))
  .map((line) => line.slice(2).trim());

/** Control characters made visible: the damage a patch repairs. */
const visible = (text: string) =>
  text.replace(/\t/g, "␉").replace(/\r/g, "␍").replace(/\n/g, "␊");

/**
 * The formulas a patch repaired: after-TeX that contains the repair and is
 * not found verbatim in the damaged source. The damaged form is shown where
 * undoing this one patch reproduces it exactly.
 */
const patchLines = patches.flatMap((patch) => {
  const key = `${patch.item}#${patch.field}`;
  const before = rawBefore.get(key) ?? "";
  const after = afterByKey.get(key);
  const undo = (tex: string) => tex.split(patch.replace).join(patch.find);
  const repaired = [
    ...new Set(
      (Array.isArray(after) ? (after as CardText) : [])
        .filter((s): s is MathSegment => s.type === "math")
        .map((s) => s.tex)
        .filter(
          (tex) =>
            tex.includes(patch.replace) &&
            (!before.includes(tex) || before.includes(undo(tex))),
        ),
    ),
  ].slice(0, 3);
  const damaged = (tex: string) =>
    before.includes(undo(tex))
      ? code(visible(undo(tex)))
      : "(mit weiteren Reparaturen)";
  return [
    `**${key}** — ${code(visible(JSON.stringify(patch.find)))} → ${code(JSON.stringify(patch.replace))}`,
    "",
    "| Before (damaged) | After | Plain |",
    "|---|---|---|",
    ...repaired.map(
      (tex) => `| ${damaged(tex)} | ${code(tex)} | ${cell(texToPlain(tex))} |`,
    ),
    "",
  ];
});

const rewriteLines = spread(rewriteKeys, 8).flatMap((key) => [
  `**${key}**`,
  "",
  fence(beforeByKey.get(key) ?? "(fehlt)"),
  "→",
  fence(plainOf(afterByKey.get(key)) ?? "(fehlt)"),
  "",
]);

const bySubject = new Map<string, Formula[]>();
for (const f of spoken) {
  const list = bySubject.get(f.subject) ?? [];
  list.push(f);
  bySubject.set(f.subject, list);
}
const subjectLines = [...bySubject]
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([subject, list]) => [
    `### ${subject} (${list.length} Formeln)`,
    "",
    formulaTable(spread(list, 6)),
    "",
  ]);

const lengths = spoken
  .map((f) => (f.speech ?? "").length)
  .sort((a, b) => a - b);
const longest = [...spoken]
  .sort((a, b) => (b.speech ?? "").length - (a.speech ?? "").length)
  .slice(0, 5);
const percentile = (p: number) =>
  lengths[Math.min(lengths.length - 1, Math.floor((p / 100) * lengths.length))];

const sample = [
  "# Card-text migration — review sample",
  "",
  "Generated by `npx tsx scripts/card-text-migration/diff-report.ts`; the full",
  "per-tile report lands in `report/` (git-ignored). Plan Phase 5, step 9:",
  "the owner reads this sample and skims the report before the phase merges.",
  "",
  `- Tiles with changes: ${pages.length}`,
  `- Distinct spoken formulas: ${spoken.length}`,
  `- Speech length: median ${percentile(50)}, p95 ${percentile(95)}, p99 ${percentile(99)}, max ${lengths.at(-1)} characters`,
  "",
  "## Repaired strings (`patches.json`)",
  "",
  ...patchLines,
  `## Rewrites without dollars (\`rewrites.txt\`, 8 of ${rewriteKeys.length})`,
  "",
  ...rewriteLines,
  "## Fractions",
  "",
  formulaTable(pick((t) => t.includes("\\frac"), 10)),
  "",
  "## Matrices, vectors and cases",
  "",
  formulaTable(
    pick((t) => /\\begin\{(pmatrix|array|cases|aligned)\}/.test(t), 12),
  ),
  "",
  "## Prescripts (nuclear notation)",
  "",
  formulaTable(
    pick(
      (t) =>
        /(?:^|[\s+])\^(?:\{[\w+-]+\}|\w)(?:_(?:\{[\w+-]+\}|\w))?\s*(?:\\text\{)?[A-Z]/.test(
          t,
        ),
      12,
    ),
  ),
  "",
  "## Reactions",
  "",
  formulaTable(
    pick((t) => /\\(rightleftharpoons|rightarrow|xrightarrow)/.test(t), 10),
  ),
  "",
  "## Longest readings",
  "",
  formulaTable(longest),
  "",
  "## Per subject",
  "",
  ...subjectLines,
].join("\n");

writeFileSync(join(HERE, "review-sample.md"), `${sample}\n`);
console.log(
  JSON.stringify({
    base: BASE,
    changedTiles: pages.length,
    spokenFormulas: spoken.length,
    speechLength: {
      median: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
      max: lengths.at(-1),
    },
  }),
);
