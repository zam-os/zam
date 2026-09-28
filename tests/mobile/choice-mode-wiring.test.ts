import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

/** Mobile's Choice and Auto modes (ADR 2026-09-27, plan phase 6). */
describe("mobile choice and auto wiring", () => {
  const html = file("mobile/index.html");
  const main = file("mobile/src/main.ts");

  it("offers four modes in the switcher, in the Studio's order", () => {
    const switcher = html.slice(
      html.indexOf('id="review-mode-switcher"'),
      html.indexOf("</div>", html.indexOf('id="review-mode-switcher"')),
    );
    const modes = Array.from(
      switcher.matchAll(/role="radio"[^>]*data-mode="([a-z_]+)"/g),
      (match) => match[1],
    );
    expect(modes).toEqual(["flash", "choice", "answer_feedback", "auto"]);
    for (const mode of ["choice", "auto"]) {
      expect(main).toContain(`switchReviewMode("${mode}")`);
    }
  });

  it("offers both modes in Settings and the Auto pin only while Auto is chosen", () => {
    expect(html).toContain('<option value="choice"');
    expect(html).toContain('<option value="auto"');
    expect(html).toContain('id="study-auto-recall-flash-row" hidden');
    expect(main).toContain(
      'studyAutoRecallFlashRow.hidden = studyLearningMode.value !== "auto";',
    );
    expect(main).toContain(
      'autoRecallPin: studyAutoRecallFlash.checked ? "flash" : null,',
    );
  });

  it("asks the kernel how each card is presented and books the pick", () => {
    expect(main).toContain("await reviewSession.presentCurrent(mode)");
    expect(main).toContain("reviewSession.choose(chosen)");
    expect(main).toContain("finishRating(() => reviewSession.rateChoice())");
    expect(main).toContain("reviewSession.disputeChoice()");
    // The rating buttons give way to the result once an option is picked.
    expect(main).toContain("reviewRatings.hidden = Boolean(choicePick);");
  });

  it("opens the follow-up chat with the choice and a one-tap starter", () => {
    expect(main).toContain("choice: { options, chosen, answer }");
    expect(main).toContain('discussionInput.value = t("choice_ask_starter");');
  });

  it("keeps voice in its Flash loop and prepares options in the background", () => {
    expect(main).toContain("mode: voiceLoopMode(),");
    expect(main).toContain("prepareMobileChoiceOptions(db, {");
    expect(main).toContain(
      'preference: readAiPreference(storedAiPreferences(), "text"),',
    );
  });

  it("translates every choice string in German and English", () => {
    const keys = [
      "learning_mode_choice",
      "learning_mode_auto",
      "learning_mode_switch_choice",
      "learning_mode_switch_auto",
      "learning_mode_auto_recall_flash",
      "choice_dont_know",
      "choice_next",
      "choice_ask",
      "choice_ask_starter",
      "choice_dispute",
      "choice_correct",
      "choice_wrong",
      "choice_dont_know_result",
      "choice_disputed",
      "choice_answers_other",
      "choice_now_without_options",
      "choice_notice_unsuitable",
      "choice_notice_no_options",
      "choice_notice_curated_disputed",
      "choice_discussion_frame",
    ];
    for (const key of keys) {
      expect(messageKeys("de")).toContain(key);
      expect(messageKeys("en")).toContain(key);
    }
  });
});
