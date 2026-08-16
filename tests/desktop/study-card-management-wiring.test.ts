import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const desktopFile = (path: string) =>
  readFileSync(join(process.cwd(), "desktop", path), "utf8");

describe("study-view card-management wiring", () => {
  const html = desktopFile("index.html");
  const main = desktopFile("src/main.ts");

  it("keeps the inline editor outside the reveal-only container", () => {
    const editor = html.indexOf('id="study-inline-editor"');
    const answerCapture = html.indexOf('id="answer-capture-box"');
    const revealed = html.indexOf('id="revealed-box"');

    expect(editor).toBeGreaterThan(-1);
    expect(editor).toBeLessThan(answerCapture);
    expect(editor).toBeLessThan(revealed);
  });

  it("keeps post-reveal edit controls outside the conditionally hidden answer box", () => {
    const revealed = html.indexOf('id="revealed-box"');
    const controls = html.indexOf('class="study-edit-controls"');
    const answerBox = html.indexOf('class="answer-box"');

    expect(controls).toBeGreaterThan(revealed);
    expect(controls).toBeLessThan(answerBox);
  });

  it("uses one review-action gate across rating and card management", () => {
    expect(main).not.toContain("ratingSubmitInProgress");
    expect(main).not.toContain("cardManageInProgress");
    expect(main).toMatch(
      /async function submitRating[\s\S]*?!beginReviewAction\(\)/,
    );
    expect(main).toMatch(
      /async function openStopModal[\s\S]*?!beginReviewAction\(\)/,
    );
    expect(main).toMatch(
      /async function confirmStudyStop[\s\S]*?!beginReviewAction\(\)/,
    );
    expect(main).toMatch(
      /async function saveInlineEdit[\s\S]*?beginReviewAction\(\)/,
    );
  });

  it("routes rating keys through the editable-target safety guard", () => {
    // Buttons must not be treated as editable — focus often stays on
    // #btn-reveal-answer after mouse submit, which would block 1–4 ratings.
    expect(main).toContain('target.matches("input, textarea, select")');
    expect(main).not.toContain(
      'target.matches("input, textarea, select, button")',
    );
    expect(main).toContain("ratingShortcutForKey(e.key");
    expect(main).toContain("editorOpen: isStudyInlineEditorOpen()");
    expect(main).toContain("dialogOpen: isStudyConfirmOpen()");
  });

  it("guards stop-confirm advance on an active study session", () => {
    expect(main).toMatch(
      /async function confirmStudyStop[\s\S]*?if \(studySessionActive\) await loadNextCard\(\)/,
    );
  });

  it("hosts the field-test offer panel beside the session summary", () => {
    expect(html).toContain('id="study-offer"');
    expect(html).toContain('id="study-offer-title"');
    expect(html).toContain('id="study-offer-body"');
    expect(html).toContain('id="study-offer-actions"');
    expect(main).toContain("showPreconditionOffer");
    expect(main).toContain("offerEmptyQueueChoices");
    expect(main).toContain("offerBonusOrFinish");
    expect(main).toContain("offerEmptyQueueChoices(requestId)");
  });

  it("keeps bundled-cell and tier interactions wired in the native shell", () => {
    for (const id of [
      "bundled-cells-container",
      "bundled-cells-list",
      "btn-bundled-cells-open-curriculum",
      "tier-badge",
      "fast-check-options",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(main).toContain("configureSessionWorkload");
    expect(main).toContain('"--max-new"');
    expect(main).toContain("renderFastCheckAnswer");

    const studio = desktopFile("src/learning-content.ts");
    expect(studio).toContain('"bundled-cells-list"');
    expect(studio).toContain('"bundled-cell-enrol"');
    expect(studio).toContain("cells.filter((cell) => cell.enrolled)");
    expect(studio).toContain("wireBundledCellsOpen();");
  });

  it("skips the switchView studio reload on the full-editor jump", () => {
    expect(main).toContain(
      'switchView("learning-content-view", { skipStudioLoad: true })',
    );
  });
});
