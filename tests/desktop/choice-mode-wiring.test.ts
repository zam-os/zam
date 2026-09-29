import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDiscussReviewArgs } from "../../desktop/src/discussion.js";
import { submitRatingCommand } from "../../desktop/src/study-card-actions.js";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

/** The Studio's Choice and Auto modes (ADR 2026-09-27, plan phase 5). */
describe("Studio choice and auto wiring", () => {
  const html = file("desktop/index.html");
  const main = file("desktop/src/main.ts");
  const rust = file("desktop/src-tauri/src/lib.rs");

  it("offers four modes in the switcher and both new ones in Settings", () => {
    for (const id of [
      "btn-study-mode-flash",
      "btn-study-mode-choice",
      "btn-study-mode-feedback",
      "btn-study-mode-auto",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('value="choice"');
    expect(html).toContain('value="auto"');
    expect(html).toContain('id="settings-auto-recall-flash"');
    expect(main).toContain('"--auto-recall-pin"');
  });

  it("stacks the options and hides the reveal button while they show", () => {
    const css = file("desktop/src/styles.css");
    // `.btn-block` sets display: flex, which would override `hidden`.
    expect(css).toMatch(/\.btn\[hidden\][^{]*\{\s*display:\s*none;/);
    expect(css).toContain(".study-offer-actions.choice-mode");
    expect(main).toContain('container.classList.add("choice-mode");');
    expect(main).toContain('options.classList.remove("choice-mode");');
  });

  it("keeps the chat and a Next button in view after a pick", () => {
    const css = file("desktop/src/styles.css");
    // Chat right under the result; the long reference answer last, folded.
    expect(css).toMatch(
      /#revealed-box\.choice-reveal > #discussion-box \{\s*order: 1;/,
    );
    expect(css).toMatch(
      /#revealed-box\.choice-reveal > #reference-answer-box \{\s*order: 2;/,
    );
    expect(css).toContain("#reference-answer-box.collapsed .reveal-content-list");
    expect(html).toContain('id="btn-reference-toggle"');
    expect(main).toContain("setReferenceAnswerFolded(true);");
    // A second Next under the chat, so nobody scrolls back to the result.
    expect(html).toContain('id="btn-choice-next-bottom"');
    expect(main).toContain(
      '.getElementById("btn-choice-next-bottom")\n    ?.addEventListener("click", () => void submitChoice());',
    );
  });

  it("asks the kernel how each card is presented in Choice and Auto", () => {
    expect(main).toContain('"answer-presentation"');
    expect(main).toContain("await resolveActivePresentation();");
  });

  it("books a choice with its evidence and never through the rating keys", () => {
    expect(main).toContain('activeAnswerFormat = "choice";');
    expect(main).toContain("choiceEvidence,");
    const keys = main.slice(main.indexOf("// 3a. A choice is picked"));
    expect(keys.indexOf("return;")).toBeLessThan(
      keys.indexOf("ratingShortcutForKey("),
    );
    expect(file("desktop/src/styles.css")).toContain(
      "#revealed-box.choice-reveal .rating-bar-container",
    );
  });

  it("prepares options in a separate, allowlisted CLI process", () => {
    expect(main).toContain('invoke<string>("execute_zam_bridge_background"');
    expect(rust).toContain('const BACKGROUND_BRIDGE_COMMANDS: &[&str] = &["choice-prepare"];');
    expect(rust).toContain("execute_zam_bridge_background,");
  });

  it("sends the choice to the follow-up chat", () => {
    const args = buildDiscussReviewArgs(
      {
        slug: "brechung",
        concept: "Brechung",
        domain: "Physik",
        bloomLevel: 1,
        question: "Q?",
        userAnswer: "Reflexion",
        feedback: "You chose: Reflexion. The answer is: Brechung.",
        choice: {
          options: ["Brechung", "Reflexion", "Streuung"],
          chosen: "Reflexion",
          answer: "Brechung",
        },
      },
      [],
      "What's the difference?",
    );
    const json = args[args.indexOf("--choice-json") + 1]!;
    expect(JSON.parse(json)).toEqual({
      options: ["Brechung", "Reflexion", "Streuung"],
      chosen: "Reflexion",
      answer: "Brechung",
    });
  });

  it("submits choice evidence as JSON", () => {
    const evidence = { options: ["a", "b", "c"], correctIndex: 0, chosen: 1 };
    const call = submitRatingCommand({
      cardId: "card-1",
      rating: 1,
      responseTimeMs: 0,
      answerFormat: "choice",
      choiceEvidence: evidence,
    });
    expect(call.args).toContain("--answer-format");
    expect(
      JSON.parse(call.args[call.args.indexOf("--choice-evidence") + 1]!),
    ).toEqual(evidence);
  });
});
