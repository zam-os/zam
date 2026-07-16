import { describe, expect, it } from "vitest";
import {
  buildRecallEvaluationPrompt,
  buildRecallFollowUpPrompt,
  parseRecallEvaluation,
} from "../../desktop/src/panel/recall-evaluation.js";

describe("Recall smart evaluation", () => {
  const card = {
    slug: "mcp-app-message-vs-sampling",
    question: "How do ui/message and sampling/createMessage differ?",
    concept:
      "ui/message adds a message to the host conversation; sampling returns a completion to the app.",
    bloomLevel: 2,
    resolvedContext: "The host decides which capabilities it exposes.",
  };

  it("builds an explicit grounded evaluation contract", () => {
    const prompt = buildRecallEvaluationPrompt(card, "Both call a model.");
    expect(prompt).toContain(card.question);
    expect(prompt).toContain(card.concept);
    expect(prompt).toContain(card.resolvedContext);
    expect(prompt).toContain("Both call a model.");
    expect(prompt).toContain('"suggestedRating"');
  });

  it("parses fenced structured feedback", () => {
    expect(
      parseRecallEvaluation(`\n\`\`\`json
{"verdict":"partial","feedback":"One important distinction is missing.","referenceAnswer":"Use the stored concept.","gaps":["sampling returns the response"],"suggestedRating":2}
\`\`\``),
    ).toEqual({
      verdict: "partial",
      feedback: "One important distinction is missing.",
      referenceAnswer: "Use the stored concept.",
      gaps: ["sampling returns the response"],
      suggestedRating: 2,
    });
  });

  it("continues the discussion with the grounded review context", () => {
    const prompt = buildRecallFollowUpPrompt(
      card,
      "Both call a model.",
      {
        verdict: "partial",
        feedback: "One important distinction is missing.",
        referenceAnswer: card.concept,
        gaps: ["sampling returns the response"],
        suggestedRating: 2,
      },
      "Can you give me an example?",
    );
    expect(prompt).toContain("Can you give me an example?");
    expect(prompt).toContain("One important distinction is missing.");
    expect(prompt).toContain(card.concept);
  });
});
