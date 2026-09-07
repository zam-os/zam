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
    expect(main).toContain('t(\n    "lbl_rating_group_missed",\n  )');
    expect(main).toContain('t(\n    "lbl_rating_group_known",\n  )');
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

  it("renders the same two groups the study window does", () => {
    expect(recall).toContain(
      'addGroup("missed", "lbl_rating_group_missed", [1]);',
    );
    expect(recall).toContain(
      'addGroup("known", "lbl_rating_group_known", [2, 3, 4]);',
    );
  });

  it("labels each group for screen readers", () => {
    expect(recall).toContain('group.setAttribute("role", "group")');
    expect(recall).toContain(
      'group.setAttribute("aria-label", caption.textContent)',
    );
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
