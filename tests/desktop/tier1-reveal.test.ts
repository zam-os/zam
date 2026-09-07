import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("Tier-1 choice reveal on desktop surfaces", () => {
  const studio = file("desktop/src/main.ts");
  const recall = file("desktop/src/panel/recall.ts");
  const learningUi = file("desktop/src/study-learning-ui.ts");

  it("Studio always reveals after a binary-choice click, correct or not", () => {
    expect(learningUi).toContain("!input.fastCheck");
    expect(studio).toContain("void submitAndReveal()");
    expect(studio).not.toMatch(
      /fastCheckIndex[\s\S]{0,400}correct_index[\s\S]{0,200}submitAndReveal/,
    );
    const revealFn = studio.slice(studio.indexOf("function renderReveal("));
    const body = revealFn.slice(
      0,
      revealFn.indexOf("function discussionElements"),
    );
    expect(body).toContain('addRevealRow("concept", activeCard.concept)');
    expect(body).toContain(
      'document.getElementById("revealed-box")!.classList.remove("hidden")',
    );
    expect(body).not.toMatch(/if\s*\(.*correct/);
  });

  it("Recall panel always reveals the concept after a fast-check option", () => {
    expect(recall).toContain("actionBtn.click()");
    expect(recall).toContain("} else if (quickMode || card.fastCheck) {");
    expect(recall).toContain("showReveal(text)");
    const showReveal = recall.slice(recall.indexOf("function showReveal("));
    const body = showReveal.slice(
      0,
      showReveal.indexOf("function appendDiscussion("),
    );
    expect(body).toContain("conceptEl.textContent = concept");
    expect(body).not.toMatch(/if\s*\(.*correct/);
  });
});
