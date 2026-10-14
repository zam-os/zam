/**
 * Measurement page for plan Phase 3 (ADR 2026-10-14b, Open question 2):
 * render every unique formula of the bundled tiles with the Studio's own
 * renderer and count the ones that keep their plain form. Dev only.
 */

import { liftDollarMath } from "../../src/kernel/library/dollar-lift.js";
import { texToPlain } from "../../src/kernel/library/tex-plain.js";
import { texIssues } from "../../src/kernel/library/tex-tokenizer.js";
import "../src/styles.css";
import { renderMath } from "../src/math-render.js";

const tiles = import.meta.glob("../../tests/fixtures/curriculum/*-kvt.json", {
  eager: true,
  import: "default",
}) as Record<
  string,
  { atoms: Array<{ practice_items: Array<Record<string, unknown>> }> }
>;

interface Formula {
  tex: string;
  block: boolean;
}

const unique = new Map<string, Formula>();
let refused = 0;
for (const tile of Object.values(tiles)) {
  for (const atom of tile.atoms) {
    for (const item of atom.practice_items) {
      for (const field of ["question", "concept", "sample_solution"]) {
        const text = item[field];
        if (typeof text !== "string") continue;
        let segments: ReturnType<typeof liftDollarMath>["segments"];
        try {
          segments = liftDollarMath(text, "strict").segments;
        } catch {
          continue;
        }
        for (const segment of segments) {
          if (segment.type !== "math") continue;
          if (texIssues(segment.tex).length > 0) {
            refused++;
            continue;
          }
          const key = `${segment.block ? "B" : "I"}${segment.tex}`;
          if (!unique.has(key)) {
            unique.set(key, {
              tex: segment.tex,
              block: segment.block === true,
            });
          }
        }
      }
    }
  }
}

const rows = document.getElementById("rows")!;
const summary = document.getElementById("summary")!;
const formulas = [...unique.values()];
let shown = 0;
let fallbacks = 0;
const started = performance.now();

for (const formula of formulas) {
  const row = document.createElement("tr");
  const source = document.createElement("td");
  source.className = "tex";
  source.textContent = formula.tex;
  const render = document.createElement("td");
  render.className = "render";
  const holder = document.createElement("span");
  holder.className = formula.block ? "card-math card-math-block" : "card-math";
  holder.textContent = texToPlain(formula.tex);
  render.appendChild(holder);
  row.append(source, render);
  rows.appendChild(row);
  const ok = await renderMath(holder, {
    tex: formula.tex,
    block: formula.block,
  });
  if (ok) shown++;
  else {
    fallbacks++;
    row.classList.add("fallback");
  }
}

const ms = Math.round(performance.now() - started);
summary.textContent =
  `${formulas.length} unique formulas: ${shown} as MathML, ${fallbacks} kept their plain form; ` +
  `${refused} refused by the tokenizer (damaged, plan Phase 5). ${ms} ms in total. ` +
  `Engine: ${navigator.userAgent}`;
document.body.dataset.done = "true";
document.body.dataset.fallbacks = String(fallbacks);

document
  .getElementById("only-fallbacks")!
  .addEventListener("change", (event) => {
    const only = (event.target as HTMLInputElement).checked;
    for (const row of rows.querySelectorAll("tr")) {
      row.hidden = only && !row.classList.contains("fallback");
    }
  });
