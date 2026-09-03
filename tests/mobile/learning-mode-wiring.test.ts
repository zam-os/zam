import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("mobile learning mode wiring", () => {
  const html = file("mobile/index.html");
  const main = file("mobile/src/main.ts");

  it("places learning mode at the top of settings before local AI", () => {
    const settingsIdx = html.indexOf('id="settings-view"');
    const learningModeIdx = html.indexOf('id="study-learning-mode"');
    const localAiIdx = html.indexOf('id="local-ai-rows"');

    expect(settingsIdx).toBeGreaterThan(0);
    expect(learningModeIdx).toBeGreaterThan(settingsIdx);
    expect(learningModeIdx).toBeLessThan(localAiIdx);
  });

  it("defines the in-session mode switcher in the review header", () => {
    expect(html).toContain('id="review-mode-switcher"');
    expect(html).toContain('id="review-mode-flash"');
    expect(html).toContain('id="review-mode-feedback"');
  });

  it("wires mode switcher toggle buttons to switch review modes", () => {
    expect(main).toContain('reviewModeFlash.addEventListener("click"');
    expect(main).toContain('reviewModeFeedback.addEventListener("click"');
    expect(main).toContain('switchReviewMode("flash")');
    expect(main).toContain('switchReviewMode("answer_feedback")');
  });

  it("hides the typing answer field and keyboard focus when in flash mode", () => {
    expect(main).toContain(
      "reviewAnswerField.hidden = Boolean(fastCheck) || isFlash;",
    );
    expect(main).toContain("!isFlash");
    expect(main).toContain("reviewCard.classList.toggle");
  });

  it("allows reveal without typing and skips AI evaluation in flash mode", () => {
    expect(main).toContain("reviewSession.reveal({ allowEmpty: isFlash })");
    expect(main).toContain(
      "if (reviewSession.currentItem?.fastCheck || isFlash) {",
    );
  });

  it("supports tapping the card to reveal in flash mode", () => {
    expect(main).toContain('reviewCard.addEventListener("click"');
    expect(main).toContain('currentLearningSettings.learningMode !== "flash"');
    expect(main).toContain("revealAnswerButton.click()");
  });

  it("defines all learning mode translations in both German and English", () => {
    const expectedKeys = [
      "learning_mode_heading",
      "learning_mode_desc",
      "learning_mode_label",
      "learning_mode_flash",
      "learning_mode_answer_feedback",
      "learning_mode_answer_variation",
      "learning_mode_switch_flash",
      "learning_mode_switch_feedback",
      "study_voice_timeout",
      "study_learning_save",
      "study_learning_saved",
      "study_learning_failed",
    ];

    for (const key of expectedKeys) {
      expect(messageKeys("de")).toContain(key);
      expect(messageKeys("en")).toContain(key);
    }
  });
});
