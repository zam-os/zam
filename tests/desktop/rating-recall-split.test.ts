/**
 * The four FSRS ratings are not four peers.
 *
 * "Again" records a recall that failed — missed outright or only half there —
 * while "Hard", "Good" and "Easy" all record a recall that succeeded and
 * differ only in how much effort it cost. Presented as one flat row of four,
 * that split is invisible, and a learner who half-remembered a card reaches
 * for "Hard" instead of "Again", which quietly corrupts their schedule.
 *
 * Every review surface therefore renders two captioned groups. These are text
 * assertions over the markup and the panel renderer, cheap enough to keep and
 * enough to catch a flattening back into a single row.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RATING_GROUPS,
  ratingGroupOf,
  reconcileRecallSuggestedRating,
} from "../../desktop/src/panel/recall-evaluation.js";

const root = join(import.meta.dirname, "..", "..");

function read(relative: string): string {
  return readFileSync(join(root, relative), "utf-8");
}

/** The markup between a group's opening tag and the next group (or the end). */
function groupMarkup(html: string, tone: "missed" | "known"): string {
  const start = html.indexOf(`class="rating-group ${tone}"`);
  expect(start, `no .rating-group.${tone} in the markup`).toBeGreaterThan(-1);
  const next = html.indexOf('class="rating-group ', start + 1);
  return html.slice(start, next === -1 ? html.length : next);
}

describe("study window rating bar", () => {
  const html = read("desktop/index.html");

  it("puts the failed-recall rating in its own captioned group", () => {
    const missed = groupMarkup(html, "missed");
    expect(missed).toContain('id="lbl-rating-group-missed"');
    expect(
      [...missed.matchAll(/data-rating="(\d)"/g)].map((m) => m[1]),
    ).toEqual(["1"]);
  });

  it("groups the three successful-recall ratings together", () => {
    const known = groupMarkup(html, "known");
    expect(known).toContain('id="lbl-rating-group-known"');
    expect([...known.matchAll(/data-rating="(\d)"/g)].map((m) => m[1])).toEqual(
      ["2", "3", "4"],
    );
  });

  it("localizes both group captions", () => {
    const main = read("desktop/src/main.ts");
    for (const id of ["lbl-rating-group-missed", "lbl-rating-group-known"]) {
      expect(main).toContain(`document.getElementById("${id}")`);
    }
    for (const key of ["lbl_rating_group_missed", "lbl_rating_group_known"]) {
      expect(main.replace(/\s+/g, " ")).toContain(`t( "${key}", )`);
    }
  });

  it("shows each rating's hue at rest, not only on hover", () => {
    const css = read("desktop/src/styles.css");
    for (const tone of ["again", "hard", "good", "easy"]) {
      expect(css).toContain(`.rating-btn.${tone} .rating-num { color:`);
    }
    // The captions carry the split in colour as well as in words.
    expect(css).toContain(
      ".rating-group.missed .rating-group-caption {\n  color: var(--clr-again);",
    );
    expect(css).toContain(
      ".rating-group.known .rating-group-caption {\n  color: var(--clr-good);",
    );
  });
});

describe("recall panel rating bar", () => {
  const recall = read("desktop/src/panel/recall.ts");

  it("builds its groups from the shared table, not its own literals", () => {
    expect(recall).toContain(
      "for (const { group: tone, ratings: values } of RATING_GROUPS)",
    );
    expect(recall).toContain("RATING_GROUPS,");
  });

  it("labels each group by its visible caption, not a duplicate string", () => {
    expect(recall).toContain('group.setAttribute("role", "group")');
    expect(recall).toContain(
      'group.setAttribute("aria-labelledby", caption.id)',
    );
    // aria-label would make a screen reader announce the caption twice.
    expect(recall).not.toContain('group.setAttribute("aria-label"');
  });

  it("keeps the panel stylesheet in step with the rendered classes", () => {
    const panel = read("desktop/src/panel/recall-panel.html");
    for (const selector of [
      ".recall-rating-group",
      ".recall-rating-group.missed .recall-rating-group-caption",
      ".recall-rating-group.known .recall-rating-group-caption",
      ".recall-rating-row",
      ".recall-rating-btn.again",
    ]) {
      expect(panel).toContain(`${selector} {`);
    }
  });
});

// The grouping is only worth anything if it agrees with what a rating means to
// the scheduler and to the evaluator. Those are real functions, so pin them
// directly rather than matching source text.
describe("rating-group contract", () => {
  it("puts the failed recall alone and the successful ones together", () => {
    expect(
      RATING_GROUPS.map((entry) => [entry.group, [...entry.ratings]]),
    ).toEqual([
      ["missed", [1]],
      ["known", [2, 3, 4]],
    ]);
  });

  it("covers all four ratings exactly once, in order", () => {
    expect(RATING_GROUPS.flatMap((entry) => [...entry.ratings])).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("agrees with ratingGroupOf for every rating", () => {
    for (const { group, ratings } of RATING_GROUPS) {
      for (const rating of ratings) {
        expect(ratingGroupOf(rating)).toBe(group);
      }
    }
  });

  // The caption over rating 1 says "not, or only partly, recalled". An
  // evaluator that answered "partial, rating 2" would put a half-remembered
  // card under "fully recalled" — the exact failure this split exists to stop.
  it("never lets a partial verdict land in the knew-it group", () => {
    for (const suggested of [1, 2, 3, 4] as const) {
      for (const verdict of ["partial", "incorrect"] as const) {
        const rating = reconcileRecallSuggestedRating(verdict, suggested);
        expect(ratingGroupOf(rating)).toBe("missed");
      }
    }
    expect(ratingGroupOf(reconcileRecallSuggestedRating("correct", 2))).toBe(
      "known",
    );
  });
});

describe("CLI review choices", () => {
  it("names the split in the zam learn / zam review option labels", () => {
    const actions = read("src/cli/review-actions.ts");
    expect(actions).toContain('"1 - Again (missed, or only partly)"');
    for (const label of [
      '"2 - Hard (recalled, with effort)"',
      '"3 - Good (recalled)"',
      '"4 - Easy (recalled effortlessly)"',
    ]) {
      expect(actions).toContain(label);
    }
    // The old label framed rating 1 as forgetting alone.
    expect(actions).not.toContain("Again (forgot)");
  });
});

// Submitting an answer hides the capture box, so the answer under discussion
// used to leave the screen exactly when the feedback, the reference answer and
// the rating buttons all refer to it — a learner who disagreed with "you missed
// this point" had nothing to check it against. The Recall panel and Mobile
// always kept it visible; the study window now does too.
describe("study window keeps the learner's own answer visible", () => {
  const html = read("desktop/index.html");
  const main = read("desktop/src/main.ts");

  it("puts the own-answer block inside the reveal box, above the feedback", () => {
    const revealAt = html.indexOf('id="revealed-box"');
    const ownAt = html.indexOf('id="own-answer-box"');
    const feedbackAt = html.indexOf('id="ai-feedback-container"');
    const referenceAt = html.indexOf('id="lbl-reveal-title"');
    expect(revealAt).toBeGreaterThan(-1);
    expect(ownAt).toBeGreaterThan(revealAt);
    expect(ownAt).toBeLessThan(feedbackAt);
    expect(ownAt).toBeLessThan(referenceAt);
  });

  it("fills it from the same answer it submits for evaluation", () => {
    expect(main).toContain(
      'document.getElementById("own-answer-text")!.textContent = userAnswer;',
    );
  });

  it("stays hidden when there is no typed answer", () => {
    expect(main).toContain(
      'ownAnswerBox.classList.toggle("hidden", userAnswer.length === 0);',
    );
  });

  it("clears with the rest of the study screen on the next card", () => {
    const reset = main.slice(main.indexOf("// Reset study screen elements"));
    expect(reset).toContain(
      'document.getElementById("own-answer-box")!.classList.add("hidden")',
    );
    expect(reset).toContain(
      'document.getElementById("own-answer-text")!.textContent = ""',
    );
  });

  it("reuses the panel's localized title rather than a new key", () => {
    expect(main.replace(/\s+/g, " ")).toContain(
      't( "recall_your_answer_title", )',
    );
  });

  // The bug this guards: renderReveal() toggles the reference answer with
  // `#revealed-box .answer-box`, and querySelector returns the FIRST match.
  // Giving the own-answer box that class put it ahead of the reference box, so
  // a successful evaluation hid the learner's answer instead — defeating the
  // feature on exactly the path it exists for — and unhid it again on flash
  // cards, showing an empty box.
  it("cannot be caught by the reference answer's own toggle", () => {
    const ownBox = html.slice(
      html.indexOf('id="own-answer-box"') - 200,
      html.indexOf('id="own-answer-box"') + 40,
    );
    expect(ownBox).not.toContain('class="answer-box');
    expect(ownBox).toContain('class="own-answer-box');
  });

  it("toggles the reference answer by id, not by position among classes", () => {
    expect(html).toContain('class="answer-box" id="reference-answer-box"');
    expect(main).toContain('document.getElementById("reference-answer-box")');
    expect(main).not.toContain('querySelector("#revealed-box .answer-box")');
  });

  it("carries its own box styling now that it shares no class", () => {
    const css = read("desktop/src/styles.css");
    const rule = css.slice(
      css.indexOf(".own-answer-box {"),
      css.indexOf("}", css.indexOf(".own-answer-box {")),
    );
    expect(rule).toContain("border:");
    expect(rule).toContain("padding:");
  });

  it("preserves the line breaks the answer was typed with", () => {
    const css = read("desktop/src/styles.css");
    const rule = css.slice(css.indexOf(".own-answer-text {"));
    expect(rule.slice(0, rule.indexOf("}"))).toContain("white-space: pre-wrap");
  });
});
