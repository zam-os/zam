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

describe("the CLI evaluator stops guessing at effort", () => {
  const client = read("src/cli/llm/client.ts");

  it("may propose only a failed or a neutral rating", () => {
    expect(client).toContain("suggest only 1 or 3");
    expect(client).toContain("a partial answer is a 1, never a 2");
  });

  it("hands the effort judgement back to the learner", () => {
    expect(client).toContain("the learner chooses between Hard, Good and Easy");
  });

  it("enumerates the concept's points only when there is more than one", () => {
    expect(client).toContain("points.length > 1");
    expect(client).toContain("supportsAnswerPoints(input.bloomLevel)");
  });
});
