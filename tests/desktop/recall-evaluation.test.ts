import { describe, expect, it } from "vitest";
import {
  buildRecallEvaluationPrompt,
  buildRecallFollowUpPrompt,
  parseRecallEvaluation,
  resolveRecallEvaluationRoute,
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
    const prompt = buildRecallEvaluationPrompt(card, "Both call a model.", "en");
    expect(prompt).toContain(card.question);
    expect(prompt).toContain(card.concept);
    expect(prompt).toContain(card.resolvedContext);
    expect(prompt).toContain("Both call a model.");
    expect(prompt).toContain('"suggestedRating"');
  });

  it("names the answer language, so a German learner is not answered in English", () => {
    expect(buildRecallEvaluationPrompt(card, "x", "de")).toContain(
      'Write "feedback", "referenceAnswer" and every entry of "gaps" in German',
    );
    // Region tags and the raw values a device or database can hand over.
    expect(buildRecallEvaluationPrompt(card, "x", "de-DE")).toContain(
      "in German",
    );
    expect(buildRecallEvaluationPrompt(card, "x", "ja")).toContain(
      "in Japanese",
    );
    // Unknown or missing input must still produce a usable instruction.
    expect(buildRecallEvaluationPrompt(card, "x", "kl")).toContain(
      "in English",
    );
    expect(buildRecallEvaluationPrompt(card, "x", null)).toContain(
      "in English",
    );
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

// Issue #209: the card routed purely on host capabilities, so an explicit and
// routable "ZAM text model" selection was ignored and the answer took the
// ui/message detour into the host chat instead of evaluating in-card.
describe("resolveRecallEvaluationRoute", () => {
  const routable = (id: string) => ({ id, routable: true });
  const unroutable = (id: string, reason?: string) => ({
    id,
    routable: false,
    reason,
  });

  it("honors a routable zam-text-model over the host's message capability", () => {
    expect(
      resolveRecallEvaluationRoute({
        selectedEvaluatorId: "zam-text-model",
        evaluators: [routable("zam-text-model")],
        // Claude Code today: messaging but no bridge sampling.
        capabilities: { message: {} },
      }),
    ).toEqual({ kind: "zam-text-model" });
  });

  it("prefers zam-text-model even when the host also offers sampling", () => {
    expect(
      resolveRecallEvaluationRoute({
        selectedEvaluatorId: "zam-text-model",
        evaluators: [routable("zam-text-model")],
        capabilities: { sampling: {}, message: {} },
      }),
    ).toEqual({ kind: "zam-text-model" });
  });

  it("surfaces an honest reason for a surface-foreign selection", () => {
    const route = resolveRecallEvaluationRoute({
      selectedEvaluatorId: "vscode-lm",
      evaluators: [
        unroutable("vscode-lm", "VS Code language models need the Companion."),
      ],
      capabilities: { message: {} },
    });
    expect(route).toEqual({
      kind: "unavailable",
      reason: "VS Code language models need the Companion.",
    });
  });

  it("never silently falls back to ui/message for an unroutable selection", () => {
    const route = resolveRecallEvaluationRoute({
      selectedEvaluatorId: "vscode-lm",
      evaluators: [unroutable("vscode-lm")],
      capabilities: { sampling: {}, message: {} },
    });
    expect(route.kind).toBe("unavailable");
  });

  it("keeps the capability ladder for native-mcp-host", () => {
    expect(
      resolveRecallEvaluationRoute({
        selectedEvaluatorId: "native-mcp-host",
        evaluators: [routable("native-mcp-host")],
        capabilities: { sampling: {} },
      }),
    ).toEqual({ kind: "host-sampling" });

    expect(
      resolveRecallEvaluationRoute({
        selectedEvaluatorId: "native-mcp-host",
        evaluators: [routable("native-mcp-host")],
        capabilities: { message: {} },
      }),
    ).toEqual({ kind: "host-message" });
  });

  it("keeps the capability ladder when nothing is selected", () => {
    expect(
      resolveRecallEvaluationRoute({ capabilities: { sampling: {} } }),
    ).toEqual({ kind: "host-sampling" });
    expect(
      resolveRecallEvaluationRoute({ capabilities: { message: {} } }),
    ).toEqual({ kind: "host-message" });
  });

  it("explains a host that offers neither capability", () => {
    const route = resolveRecallEvaluationRoute({ capabilities: {} });
    expect(route.kind).toBe("unavailable");
    expect(route).toMatchObject({ reason: expect.stringMatching(/quick mode/i) });
  });

  it("refuses to evaluate under quick mode", () => {
    const route = resolveRecallEvaluationRoute({
      selectedEvaluatorId: "quick-mode",
      capabilities: { sampling: {} },
    });
    expect(route.kind).toBe("unavailable");
    expect(route).toMatchObject({
      reason: expect.stringMatching(/model-free by design/i),
    });
  });

  it("routes a routable zam-text-model even if the context omits the route list", () => {
    expect(
      resolveRecallEvaluationRoute({
        selectedEvaluatorId: "zam-text-model",
        capabilities: { message: {} },
      }),
    ).toEqual({ kind: "zam-text-model" });
  });
});
