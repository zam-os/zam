import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("reference reveal on CLI and voice paths", () => {
  const learn = file("src/cli/commands/learn.ts");
  const review = file("src/cli/commands/review.ts");
  const session = file("src/cli/commands/session.ts");
  const voice = file("src/kernel/recall/voice-review.ts");

  it("zam learn always reveals the stored answer after the learner answers", () => {
    expect(learn).toContain("formatReveal");
    const afterAnswer = learn.slice(learn.indexOf("STOP_WORDS.has(answer"));
    expect(afterAnswer).toContain("const reveal = formatReveal({");
    expect(afterAnswer).not.toMatch(
      /if\s*\(.*correct[\s\S]{0,200}formatReveal/,
    );
  });

  it("zam review and zam session do not reveal before rating", () => {
    expect(review).not.toContain("formatReveal");
    expect(session).not.toContain("formatReveal");
    expect(review).toContain("runInteractiveReviewAction");
    expect(session).toContain("runInteractiveReviewAction");
  });

  it("voice always reveals after a spoken answer, without a correctness gate", () => {
    expect(voice).toContain("await this.adapter.revealAnswer()");
    const loop = voice.slice(voice.indexOf("private async runAnswerLoop"));
    const body = loop.slice(0, loop.indexOf("private async runFlashLoop"));
    expect(body).toContain("this.adapter.captureAnswer(transcript)");
    expect(body).toContain("await this.adapter.revealAnswer()");
    expect(body).not.toMatch(/if\s*\(.*correct/);
  });
});
