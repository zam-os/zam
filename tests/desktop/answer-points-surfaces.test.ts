/**
 * Where the point count and the coverage score reach the learner
 * (ADR 2026-09-08 §3, §5).
 *
 * The counting itself is pinned in tests/kernel/answer-points.test.ts and the
 * evaluation contract in tests/desktop/recall-evaluation.test.ts. What this
 * file guards is that every surface asks the kernel rather than counting for
 * itself — three surfaces reaching three different numbers for one card would
 * be worse than showing none.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..");
const read = (relative: string) => readFileSync(join(root, relative), "utf-8");

const SURFACES = [
  { name: "study window", file: "desktop/src/main.ts" },
  { name: "recall panel", file: "desktop/src/panel/recall.ts" },
  { name: "mobile", file: "mobile/src/main.ts" },
] as const;

describe("point count reaches every review surface", () => {
  for (const { name, file } of SURFACES) {
    describe(name, () => {
      const source = read(file);

      it("takes the count from the kernel, not from its own parsing", () => {
        expect(source).toContain("library/answer-points.js");
        expect(source).toContain("shouldShowPointCount");
        expect(source).toContain("countAnswerPoints");
      });

      it("renders the count through the i18n layer", () => {
        expect(source).toMatch(/tf\(\s*"(recall_)?points_expected"/);
      });

      it("never renders the points themselves", () => {
        // The cue is how many, never which — showing the list would answer
        // the question the card is asking.
        expect(source).not.toContain("parseAnswerPoints");
      });
    });
  }
});

describe("coverage score", () => {
  it("is shown by the surfaces whose evaluator reports one", () => {
    // The panel and Mobile share the JSON evaluator that returns coverage.
    expect(read("desktop/src/panel/recall.ts")).toContain(
      "evaluation.coverage",
    );
    expect(read("mobile/src/main.ts")).toContain("result.evaluation.coverage");
  });

  it("is not faked by the study window, whose evaluator returns prose", () => {
    // The CLI evaluator replies in free text, so there is no score to show
    // there — it only stops proposing an effort it cannot observe. Inventing
    // a number from prose would be exactly the fabrication this removes.
    const main = read("desktop/src/main.ts");
    expect(main).not.toContain("recall_points_score");
  });
});

describe("the CLI evaluator reports completeness, not a rating", () => {
  const client = read("src/cli/llm/client.ts");

  it("asks for a completeness verdict instead of a number", () => {
    expect(client).toContain("completeness verdict on its own line");
    expect(client).toContain("LOCALIZED_COMPLETENESS");
    expect(client).toContain("Never suggest a rating");
  });

  it("names how many required elements are missing", () => {
    // "Incomplete (N)" plus the elements themselves in the prose above, so the
    // learner can check the claim instead of taking it on faith.
    expect(client).toContain("${completeness.incomplete} (N)");
    expect(client).toContain("name them in the feedback above");
  });

  it("keeps no rating wording anywhere in the prompt", () => {
    // Every earlier round left a contradiction behind in a second place: the
    // paragraph, then guideline 3, then guideline 4's "rating suggestion".
    const prompt = client.slice(
      client.indexOf("const systemPrompt = "),
      client.indexOf("const userPrompt = "),
    );
    expect(prompt).not.toMatch(/rating \(1 to 4\)|1 or 3|rating suggestion/i);
    expect(prompt).not.toContain("Suggested rating");
  });

  it("enumerates the concept's points only when there is more than one", () => {
    expect(client).toContain("points.length > 1");
    expect(client).toContain("supportsAnswerPoints(input.bloomLevel)");
  });
});

// A learner who nearly had it and is told they failed stops trying, and the
// asymmetry is real: they can always mark themselves down, but discouragement
// does not reverse. Both evaluators and the agent skill carry the same rule.
describe("vague answers are judged generously", () => {
  const surfaces = [
    "src/cli/llm/client.ts",
    "desktop/src/panel/recall-evaluation.ts",
    "skills/zam/SKILL.md",
  ] as const;

  for (const file of surfaces) {
    it(`tells the evaluator in ${file} to lean generous`, () => {
      const source = read(file);
      expect(source.toLowerCase()).toContain("generous");
      expect(source).toMatch(/points at the right thing/);
      expect(source).toMatch(/mark themselves down/);
    });
  }
});

// The skill is how an external harness is instructed, so it is the one place
// where a stale rating ladder would keep reaching learners after every prompt
// in the repo had been fixed. All four tracked copies must agree.
describe("the agent skill asks for completeness", () => {
  const copies = [
    "skills/zam/SKILL.md",
    ".agent/skills/zam/SKILL.md",
    ".agents/skills/zam/SKILL.md",
    ".claude/skills/zam/SKILL.md",
  ] as const;

  for (const copy of copies) {
    it(`no longer asks ${copy} to propose 1-4`, () => {
      const skill = read(copy);
      expect(skill).toContain("State completeness — never a rating");
      expect(skill).toContain("Incomplete (N)");
      expect(skill).not.toContain("Propose 1–4");
      expect(skill).not.toContain("effortless complete success");
    });
  }
});
