import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("mobile follow-up discussion wiring", () => {
  const html = read("mobile/index.html");
  const main = read("mobile/src/main.ts");

  it("keeps the follow-up inside the revealed review checkpoint", () => {
    const revealStart = html.indexOf('id="revealed-answer"');
    const discussion = html.indexOf('id="discussion-panel"');
    const revealEnd = html.indexOf('id="review-status"');
    expect(revealStart).toBeGreaterThan(-1);
    expect(discussion).toBeGreaterThan(revealStart);
    expect(discussion).toBeLessThan(revealEnd);
  });

  it("opens only after a successful evaluation and resets on every exit", () => {
    const evaluationSuccess = main.slice(
      main.indexOf("if (result) {", main.indexOf("runSmartEvaluation")),
    );
    expect(evaluationSuccess).toContain("showEvaluationUi(result)");
    expect(evaluationSuccess).toContain("openDiscussionForEvaluation(result)");

    const clear = main.slice(main.indexOf("function clearEvaluationUi"));
    expect(clear.slice(0, clear.indexOf("\n}"))).toContain(
      "clearDiscussionUi()",
    );
    expect(main).toContain("const result = await reviewSession.rate(rating)");
    expect(main).toContain("clearEvaluationUi()");
  });

  it("routes both iPadOS cloud and Android on-device through recall settings", () => {
    expect(main).toContain("discussMobileReview({");
    expect(main).toContain(
      "onDeviceAvailable: platformFeatures.onDeviceEvaluation",
    );
    expect(main).toContain(
      'preference: readAiPreference(storedAiPreferences(), "recall")',
    );
    expect(main).toContain("endpoint: recallEndpoint()");
  });
});
