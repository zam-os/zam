import { describe, expect, it } from "vitest";
import {
  buildRecallEvaluationPrompt,
  buildRecallFollowUpPrompt,
  parseRecallEvaluation,
  reconcileRecallSuggestedRating,
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
    const prompt = buildRecallEvaluationPrompt(
      card,
      "Both call a model.",
      "en",
    );
    expect(prompt).toContain(card.question);
    expect(prompt).toContain(card.concept);
    expect(prompt).toContain(card.resolvedContext);
    expect(prompt).toContain("Both call a model.");
    expect(prompt).toContain('"recalledPoints"');
    expect(prompt).toContain("reference answer only");
    // The evaluator reports coverage and must not rate the learner at all
    // (ADR 2026-09-08 §3) — the old contract asked it for a 1-4 rating and
    // had to forbid 2 for a partial answer; now it proposes nothing.
    expect(prompt).toContain("Do not rate the learner");
    expect(prompt).not.toContain('"suggestedRating"');
    expect(prompt).not.toContain("2 for partial");
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
      suggestedRating: 1,
    });
  });

  it("never suggests Hard/Good/Easy for a partial or incorrect verdict", () => {
    expect(reconcileRecallSuggestedRating("partial", 2)).toBe(1);
    expect(reconcileRecallSuggestedRating("partial", 3)).toBe(1);
    expect(reconcileRecallSuggestedRating("incorrect", 4)).toBe(1);
    expect(reconcileRecallSuggestedRating("correct", 2)).toBe(2);
    expect(reconcileRecallSuggestedRating("correct", 1)).toBe(3);
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
    expect(route).toMatchObject({
      reason: expect.stringMatching(/quick mode/i),
    });
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

// ADR 2026-09-08: the evaluator reports how many of the reference answer's
// points the learner covered, and the rating is derived from that. It is no
// longer asked for a rating, because the part it would have to invent — how
// hard the answer was — is the part it cannot see.
describe("coverage-scored evaluation", () => {
  const twoPointCard = {
    slug: "pythagoras-conditions",
    question: "Wofür gilt der Satz des Pythagoras, und wie lautet er?",
    concept:
      "Der Satz des Pythagoras:\n- gilt nur für rechtwinklige Dreiecke\n- a² + b² = c²",
    bloomLevel: 2,
    resolvedContext: null,
  };

  const reply = (recalledPoints: number, verdict = "partial") =>
    JSON.stringify({
      verdict,
      feedback: "Die Bedingung fehlt.",
      referenceAnswer: "…",
      gaps: ["gilt nur für rechtwinklige Dreiecke"],
      recalledPoints,
    });

  it("enumerates the points so identifying them is a lookup", () => {
    const prompt = buildRecallEvaluationPrompt(twoPointCard, "a²+b²=c²", "de");
    expect(prompt).toContain("asks for 2 points");
    expect(prompt).toContain("1. gilt nur für rechtwinklige Dreiecke");
    expect(prompt).toContain("2. a² + b² = c²");
    expect(prompt).toContain("Never report more than 2");
  });

  it("does not repeat a single-point answer back as a list", () => {
    // The reference answer already is the point; enumerating it would only
    // make the prompt longer.
    const prompt = buildRecallEvaluationPrompt(
      { ...twoPointCard, concept: "München" },
      "x",
      "de",
    );
    expect(prompt).not.toContain("asks for 1 points");
    expect(prompt).toContain("contains the whole reference answer");
  });

  it("does not enumerate points above Bloom 3", () => {
    const prompt = buildRecallEvaluationPrompt(
      { ...twoPointCard, bloomLevel: 4 },
      "x",
      "de",
    );
    expect(prompt).not.toContain("asks for 2 points");
  });

  it("reports coverage and derives rating 1 from a missing point", () => {
    const result = parseRecallEvaluation(reply(1), twoPointCard);
    expect(result.coverage).toEqual({ recalled: 1, total: 2 });
    expect(result.suggestedRating).toBe(1);
  });

  it("leaves the effort to the learner on full coverage", () => {
    // 3 is the neutral "no opinion" value; nothing here may propose 2 or 4.
    const result = parseRecallEvaluation(reply(2, "correct"), twoPointCard);
    expect(result.coverage).toEqual({ recalled: 2, total: 2 });
    expect(result.suggestedRating).toBe(3);
  });

  it("clamps a score the model overstates rather than trusting it", () => {
    const result = parseRecallEvaluation(reply(7, "correct"), twoPointCard);
    expect(result.coverage).toEqual({ recalled: 2, total: 2 });
  });

  it("takes the verdict from the score, not from the model's word for it", () => {
    // A reply claiming "correct" while reporting 1 of 2 points would otherwise
    // show "Correct" above a rating of 1 — the old mixed signal, one field over.
    const result = parseRecallEvaluation(reply(1, "correct"), twoPointCard);
    expect(result.verdict).toBe("partial");
    expect(result.suggestedRating).toBe(1);
  });

  it("calls a zero score incorrect and a full one correct", () => {
    expect(
      parseRecallEvaluation(reply(0, "correct"), twoPointCard).verdict,
    ).toBe("incorrect");
    expect(
      parseRecallEvaluation(reply(2, "incorrect"), twoPointCard).verdict,
    ).toBe("correct");
  });

  it("does not ask for a score it will throw away above Bloom 3", () => {
    // Requesting recalledPoints and then ignoring it is its own small
    // fabrication; the unscored shape simply omits the field.
    const prompt = buildRecallEvaluationPrompt(
      { ...twoPointCard, bloomLevel: 5 },
      "x",
      "de",
    );
    expect(prompt).not.toContain('"recalledPoints"');
    expect(prompt).not.toContain('Set "recalledPoints"');
  });

  it("scores nothing above Bloom 3 and falls back to the verdict", () => {
    const card = { ...twoPointCard, bloomLevel: 5 };
    const result = parseRecallEvaluation(reply(2, "correct"), card);
    expect(result.coverage).toBeUndefined();
    expect(result.suggestedRating).toBe(3);
  });

  it("still parses a reply from a host that predates the contract", () => {
    const legacy = JSON.stringify({
      verdict: "correct",
      feedback: "Passt.",
      referenceAnswer: "…",
      gaps: [],
      suggestedRating: 4,
    });
    // No card, no coverage: the reply's own rating carries the outcome, run
    // through the same reconcile guard as before.
    const result = parseRecallEvaluation(legacy);
    expect(result.coverage).toBeUndefined();
    expect(result.suggestedRating).toBe(4);
  });

  it("rejects a reply that is malformed in the fields it still requires", () => {
    expect(() =>
      parseRecallEvaluation(
        JSON.stringify({
          verdict: "sideways",
          feedback: "",
          referenceAnswer: "",
          gaps: [],
        }),
        twoPointCard,
      ),
    ).toThrow();
  });
});
