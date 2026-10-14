/**
 * Build ZAM's formula inventory from the bundled tiles (ADR 2026-10-14b,
 * Decision 3; plan Phase 1).
 *
 *   npx tsx scripts/build-math-inventory.ts            # report only
 *   npx tsx scripts/build-math-inventory.ts --write    # write the inventory
 *
 * The inventory is frozen once written: a later change is a reviewed edit of
 * `src/kernel/library/math-inventory.json`, never a regeneration in CI. The
 * script refuses to write when the corpus uses a forbidden command, so a bad
 * tile can never widen the allowlist.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { liftDollarMath } from "../src/kernel/library/dollar-lift.js";
import { FORBIDDEN_TEX_COMMANDS } from "../src/kernel/library/tex-tokenizer.js";

/**
 * Standard school-math commands added on top of the corpus, reviewed by hand.
 *
 * The corpus alone misses everyday symbols a model writes for new cards
 * (`\theta` never occurs in the tiles). The ADR names the families the
 * inventory covers — Greek letters, operators, relations, arrows, accents,
 * fonts, functions — so this list completes those families and nothing
 * else: every entry is a symbol, a named function, a delimiter, or a
 * one-argument font or accent. No environment is added here; those stay
 * exactly the corpus's.
 */
const SUPPLEMENT_WORDS = `
  alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa
  lambda mu nu xi pi varpi rho varrho sigma varsigma tau upsilon phi varphi chi
  psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega
  cdot times div pm mp ast star circ bullet oplus otimes odot cap cup setminus
  wedge vee land lor neg lnot
  approx neq ne le leq ge geq ll gg equiv sim simeq cong propto in notin ni
  subset subseteq supset supseteq subsetneq perp parallel mid
  to rightarrow leftarrow leftrightarrow Rightarrow Leftarrow Leftrightarrow
  implies iff mapsto longrightarrow longleftarrow longleftrightarrow
  Longrightarrow Longleftrightarrow uparrow downarrow rightleftharpoons
  infty partial nabla emptyset varnothing forall exists angle measuredangle
  sphericalangle triangle square degree prime ell hbar dots ldots cdots vdots
  ddots colon checkmark
  sum prod int oint lim
  sin cos tan cot sec csc arcsin arccos arctan sinh cosh tanh exp ln log lg max
  min det gcd
  langle rangle lceil rceil lfloor rfloor vert Vert left right middle big Big
  bigl bigr Bigl Bigr
  text textbf textit mathrm mathbf mathit mathbb mathcal operatorname vec bar
  overline underline hat widehat tilde widetilde dot ddot boldsymbol
  frac dfrac tfrac sqrt binom underbrace overbrace overset underset stackrel
  xrightarrow xleftarrow xrightleftharpoons pmod quad qquad hline not begin end
`
  .split(/\s+/)
  .filter(Boolean);

/** Control symbols: spacing, escaped specials, the row break. */
const SUPPLEMENT_SYMBOLS = [
  ",",
  ";",
  ":",
  "!",
  " ",
  "{",
  "}",
  "\\",
  "%",
  "&",
  "#",
  "_",
  "|",
];

const ROOT = join(import.meta.dirname, "..");
const TILES = join(ROOT, "tests/fixtures/curriculum");
const OUT = join(ROOT, "src/kernel/library/math-inventory.json");

interface Field {
  where: string;
  text: string;
}

function fieldsOf(file: string, tile: Record<string, unknown>): Field[] {
  const fields: Field[] = [];
  const atoms = (tile.atoms ?? []) as Array<Record<string, unknown>>;
  for (const atom of atoms) {
    if (typeof atom.title === "string") {
      fields.push({ where: `${file} atom ${atom.id} title`, text: atom.title });
    }
    for (const item of (atom.practice_items ?? []) as Array<
      Record<string, unknown>
    >) {
      for (const key of ["question", "concept", "sample_solution"]) {
        const value = item[key];
        if (typeof value === "string") {
          fields.push({ where: `${file} ${item.id} ${key}`, text: value });
        }
      }
      const fastCheck = item.fast_check as { options?: unknown[] } | undefined;
      for (const option of fastCheck?.options ?? []) {
        if (typeof option === "string") {
          fields.push({ where: `${file} ${item.id} option`, text: option });
        }
      }
      for (const distractor of (item.choice_distractors ?? []) as Array<{
        text?: unknown;
      }>) {
        if (typeof distractor.text === "string") {
          fields.push({
            where: `${file} ${item.id} distractor`,
            text: distractor.text,
          });
        }
      }
    }
  }
  return fields;
}

const words = new Map<string, number>();
const symbols = new Map<string, number>();
const environments = new Map<string, number>();
const failures: string[] = [];
const bare: string[] = [];
const damaged: string[] = [];
let formulas = 0;
let longest = 0;

const bump = (map: Map<string, number>, key: string) =>
  map.set(key, (map.get(key) ?? 0) + 1);

for (const file of readdirSync(TILES).filter((f) => f.endsWith("-kvt.json"))) {
  const tile = JSON.parse(readFileSync(join(TILES, file), "utf-8"));
  for (const field of fieldsOf(file, tile)) {
    if (/[\t\r\f\b]/.test(field.text)) damaged.push(field.where);
    let segments: ReturnType<typeof liftDollarMath>["segments"];
    try {
      segments = liftDollarMath(field.text, "strict").segments;
    } catch (error) {
      failures.push(`${field.where}: ${(error as Error).message}`);
      continue;
    }
    for (const segment of segments) {
      if (segment.type === "text") {
        // A bare control word outside dollars and outside a path is LaTeX the
        // migration must patch by hand (plan Phase 5); report it, never
        // collect it.
        for (const match of segment.text.matchAll(/\\([A-Za-z]+)/g)) {
          const before = segment.text[(match.index ?? 0) - 1];
          if (before !== undefined && /[A-Za-z0-9:./\\]/.test(before)) continue;
          bare.push(`${field.where}: \\${match[1]}`);
        }
        continue;
      }
      if (segment.type !== "math") continue;
      formulas++;
      longest = Math.max(longest, segment.tex.length);
      for (const match of segment.tex.matchAll(
        /\\([A-Za-z]+)|\\([^A-Za-z])/g,
      )) {
        if (match[1]) bump(words, match[1]);
        else if (match[2]) bump(symbols, match[2]);
      }
      for (const match of segment.tex.matchAll(
        /\\begin\s*\{([A-Za-z]+\*?)\}/g,
      )) {
        bump(environments, match[1]);
      }
    }
  }
}

const corpusOnly = (map: Map<string, number>, supplement: string[]) =>
  supplement.filter((entry) => !map.has(entry));
const addedWords = corpusOnly(words, SUPPLEMENT_WORDS);
const addedSymbols = corpusOnly(symbols, SUPPLEMENT_SYMBOLS);
for (const word of SUPPLEMENT_WORDS) if (!words.has(word)) words.set(word, 0);
for (const symbol of SUPPLEMENT_SYMBOLS) {
  if (!symbols.has(symbol)) symbols.set(symbol, 0);
}

const forbidden = [...words.keys()].filter((w) =>
  FORBIDDEN_TEX_COMMANDS.has(w),
);
const sorted = (map: Map<string, number>) =>
  [...map.keys()].sort((a, b) => a.localeCompare(b, "en"));

console.log(`formulas: ${formulas}, longest: ${longest} characters`);
console.log(`control words: ${words.size}, symbols: ${symbols.size}`);
console.log(
  `environments: ${[...environments].map(([e, n]) => `${e} (${n})`).join(", ")}`,
);
console.log(`\nstrings the strict lift refused (${failures.length}):`);
for (const line of failures) console.log(`  ${line}`);
console.log(`\nbare commands outside dollars (${bare.length}):`);
for (const line of bare) console.log(`  ${line}`);
console.log(`\nstrings with tab/CR/FF/BS damage (${damaged.length}):`);
for (const line of damaged) console.log(`  ${line}`);
console.log(
  `\ncontrol symbols: ${sorted(symbols)
    .map((s) => JSON.stringify(s))
    .join(" ")}`,
);
console.log(`control words:\n  ${sorted(words).join(" ")}`);
console.log(
  `\nadded by the reviewed supplement: ${addedWords.length} words (${addedWords.join(" ")}), ${addedSymbols.length} symbols (${addedSymbols.map((s) => JSON.stringify(s)).join(" ")})`,
);

if (forbidden.length > 0) {
  console.error(
    `\nRefusing to write: the corpus uses forbidden commands: ${forbidden.map((w) => `\\${w}`).join(", ")}`,
  );
  process.exit(1);
}

if (process.argv.includes("--write")) {
  const inventory = {
    version: 1,
    controlWords: sorted(words),
    controlSymbols: sorted(symbols),
    environments: sorted(environments),
  };
  writeFileSync(OUT, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(`\nwrote ${OUT}`);
}
