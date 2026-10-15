import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CardText,
  findPlainTextMarkup,
  plainProjection,
  spokenProjection,
  validateCardText,
} from "../../src/kernel/library/card-text.js";
import { texIssues } from "../../src/kernel/library/tex-tokenizer.js";

/**
 * The bundled tiles after the card-text migration (ADR 2026-10-14b, plan
 * Phase 5): every formula is a math segment the tokenizer accepts, every
 * formula a learner sees has speech, and no plain field carries markup.
 */

const DIR = join(process.cwd(), "tests/fixtures/curriculum");
const FILES = readdirSync(DIR).filter((f) => f.endsWith("-kvt.json"));

type Json = Record<string, unknown>;

interface Located {
  file: string;
  atom: Json;
  item: Json;
}

function items(): Located[] {
  const out: Located[] = [];
  for (const file of FILES) {
    const tile = JSON.parse(readFileSync(join(DIR, file), "utf-8"));
    for (const atom of tile.atoms as Json[]) {
      for (const item of atom.practice_items as Json[]) {
        out.push({ file, atom, item });
      }
    }
  }
  return out;
}

const ALL = items();

/** Every problem with one field, as `file id field: reason` lines. */
function fieldProblems(
  where: string,
  value: unknown,
  requireSpeech: boolean,
): string[] {
  if (typeof value === "string") {
    return findPlainTextMarkup(value).map(
      (markup) => `${where}: ${markup.code} ${markup.text.slice(0, 40)}`,
    );
  }
  const issues = validateCardText(value, { requireSpeech });
  const out = issues.map((issue) => `${where}: ${issue.message}`);
  if (issues.length > 0) return out;
  const segments = value as CardText;
  for (const segment of segments) {
    if (segment.type === "math" && texIssues(segment.tex).length > 0) {
      out.push(`${where}: formula refused ${segment.tex.slice(0, 40)}`);
    }
  }
  // A formula's own `*` or `_` (Kleene star, `ε_r`) may pair up as emphasis
  // in the projection; only TeX or control characters there would be damage.
  const plain = plainProjection(segments);
  if (findPlainTextMarkup(plain).some((m) => m.code !== "emphasis")) {
    out.push(`${where}: plain projection carries TeX`);
  }
  if (requireSpeech && /[\\$]/.test(spokenProjection(segments))) {
    out.push(`${where}: spoken projection carries TeX`);
  }
  return out;
}

describe("bundled tiles carry clean card text (ADR 2026-10-14b)", () => {
  it("reads a corpus large enough to mean something", () => {
    expect(FILES.length).toBeGreaterThan(200);
    const formulas = ALL.flatMap(({ item }) =>
      [item.question_segments, item.concept_segments].flatMap((value) =>
        Array.isArray(value)
          ? (value as CardText).filter((s) => s.type === "math")
          : [],
      ),
    );
    expect(formulas.length).toBeGreaterThan(1000);
  });

  it("question and concept are plain text or segments with speech", () => {
    const problems: string[] = [];
    for (const { file, item } of ALL) {
      for (const field of ["question", "concept"] as const) {
        const plain = item[field];
        const segments = item[`${field}_segments`];
        const where = `${file} ${item.id} ${field}`;
        if ((plain === undefined) === (segments === undefined)) {
          problems.push(`${where}: needs exactly one of plain or segments`);
          continue;
        }
        problems.push(...fieldProblems(where, plain ?? segments, true));
      }
    }
    expect(problems).toEqual([]);
  });

  it("fast-check options and distractors are clean, formulas spoken", () => {
    const problems: string[] = [];
    for (const { file, item } of ALL) {
      const check = item.fast_check as Json | undefined;
      const options = Array.isArray(check?.options) ? check.options : [];
      options.forEach((option, index) => {
        problems.push(
          ...fieldProblems(`${file} ${item.id} option${index}`, option, true),
        );
      });
      const distractors = Array.isArray(item.choice_distractors)
        ? (item.choice_distractors as Json[])
        : [];
      distractors.forEach((distractor, index) => {
        problems.push(
          ...fieldProblems(
            `${file} ${item.id} distractor${index}`,
            distractor.segments ?? distractor.text,
            true,
          ),
        );
      });
    }
    expect(problems).toEqual([]);
  });

  it("sample solutions keep every formula valid (speech optional)", () => {
    const problems: string[] = [];
    for (const { file, item } of ALL) {
      if (item.sample_solution === undefined) continue;
      problems.push(
        ...fieldProblems(
          `${file} ${item.id} sample_solution`,
          item.sample_solution,
          false,
        ),
      );
    }
    expect(problems).toEqual([]);
  });

  it("no string anywhere in an item carries a tab or carriage return", () => {
    const damaged: string[] = [];
    const walk = (value: unknown, where: string) => {
      if (typeof value === "string") {
        if (/[\t\r]/.test(value)) damaged.push(where);
      } else if (Array.isArray(value)) {
        value.forEach((entry, index) => {
          walk(entry, `${where}[${index}]`);
        });
      } else if (value && typeof value === "object") {
        for (const [key, entry] of Object.entries(value)) {
          walk(entry, `${where}.${key}`);
        }
      }
    };
    for (const { file, item } of ALL) walk(item, `${file} ${item.id}`);
    expect(damaged).toEqual([]);
  });

  it("atom titles are plain text", () => {
    const problems: string[] = [];
    const seen = new Set<Json>();
    for (const { file, atom } of ALL) {
      if (seen.has(atom)) continue;
      seen.add(atom);
      if (typeof atom.title !== "string") continue;
      for (const markup of findPlainTextMarkup(atom.title)) {
        problems.push(`${file} ${atom.title}: ${markup.code}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("an item shared between tiles is identical in each", () => {
    const byId = new Map<string, Map<string, string>>();
    for (const { file, item } of ALL) {
      const seen = byId.get(String(item.id)) ?? new Map<string, string>();
      seen.set(file, JSON.stringify(item));
      byId.set(String(item.id), seen);
    }
    const differing = [...byId]
      .filter(([, byFile]) => new Set(byFile.values()).size > 1)
      .map(([id]) => id);
    expect(differing).toEqual([]);
  });

  it("materiality, where declared, is cosmetic or material", () => {
    const wrong = ALL.filter(
      ({ item }) =>
        item.materiality !== undefined &&
        item.materiality !== "cosmetic" &&
        item.materiality !== "material",
    ).map(({ file, item }) => `${file} ${item.id}`);
    expect(wrong).toEqual([]);
  });

  it("an item rewritten into segments declares its materiality", () => {
    const undeclared = ALL.filter(
      ({ item }) =>
        (item.question_segments !== undefined ||
          item.concept_segments !== undefined) &&
        item.materiality === undefined,
    ).map(({ file, item }) => `${file} ${item.id}`);
    expect(undeclared).toEqual([]);
  });
});
