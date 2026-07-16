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
    expect(main).toContain('target.matches("input, textarea, select, button")');
    expect(main).toContain("ratingShortcutForKey(e.key");
    expect(main).toContain("editorOpen: isStudyInlineEditorOpen()");
    expect(main).toContain("dialogOpen: isStudyConfirmOpen()");
  });
});
