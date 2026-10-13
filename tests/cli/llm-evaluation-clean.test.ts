import { describe, expect, it } from "vitest";
import { cleanRecallEvaluation } from "../../src/cli/llm/client.js";

describe("cleanRecallEvaluation", () => {
  it("cleans the user-reported contradictory feedback with scratchpad and multiple verdicts", () => {
    const raw = `Deine Antwort trifft den späteren Bereitstellungsfehler: Ohne die nötige Berechtigung für die Rollenzuweisung kann die Control-Plane-Identität dem Node-Pool-Subnetz nicht beitreten. Ergänzend versucht \`az aks create\` die Rollenzuweisungen selbst anzulegen und gibt bei fehlendem \`Microsoft.Authorization/roleAssignments/write\` zunächst eine Warnung aus; der Fehler tritt später bei der Node-Bereitstellung auf, nicht bei der Validierung.  
Vollständig✅
Winvalid
We need must assess completeness. Learner says PIM elevated, creation perhaps incomplete, identity can't provision nodes in node pool in vnet subnet. This captures later missing subnet join permission, but doesn't mention CLI attempts roles, warning, not validation. Are required elements target concept all? One missing? Target has attempts assignment, lacking permission warning, failure later, not validation. Learner gets later subnet error. Number missing likely 3? Instructions completeness target elements. Their vagueness "maybe incomplete" and nodes subnet. Missing specific warning and non-validation, and self assignment behavior. Could count perhaps one combined element? Need identify N. Required elements likely target answer has 3 components: tries assignments; missing permission yields warning; later node provision error missing subnet join permission not validation. Learner includes later node/subnet. Missing first part and warning/non-validation. Two missing elements perhaps. Give concise German 2-3 sentences. End exact verdict Unvollständig (2), name missing elements. Don't include emoji.

Du beschreibst den späteren Fehler bei der Node-Bereitstellung wegen fehlender Berechtigung zum Beitritt ins Subnetz. Es fehlt, dass \`az aks create\` die Rollenzuweisungen selbst anzulegen versucht und bei fehlendem \`Microsoft.Authorization/roleAssignments/write\` eine Warnung ausgibt; der Fehler entsteht später, nicht bei der Validierung.

Unvollständig (2)`;

    const cleaned = cleanRecallEvaluation(raw, "de");

    expect(cleaned).not.toContain("Vollständig");
    expect(cleaned).not.toContain("✅");
    expect(cleaned).not.toContain("Winvalid");
    expect(cleaned).not.toContain("We need must assess completeness");
    expect(cleaned).not.toContain("Don't include emoji");

    expect(cleaned).toBe(
      `Du beschreibst den späteren Fehler bei der Node-Bereitstellung wegen fehlender Berechtigung zum Beitritt ins Subnetz. Es fehlt, dass \`az aks create\` die Rollenzuweisungen selbst anzulegen versucht und bei fehlendem \`Microsoft.Authorization/roleAssignments/write\` eine Warnung ausgibt; der Fehler entsteht später, nicht bei der Validierung.\n\nUnvollständig (2)`,
    );
  });

  it("preserves explanation before verdict when second verdict is corrected without new explanation", () => {
    const raw = `Deine Antwort trifft den Kern, aber es fehlt die Warnung bei fehlenden Berechtigungen.

Vollständig✅

Unvollständig (2)`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe(
      "Deine Antwort trifft den Kern, aber es fehlt die Warnung bei fehlenden Berechtigungen.\n\nUnvollständig (2)",
    );
  });

  it("preserves explanation when identical verdict is repeated", () => {
    const raw = `Deine Antwort ist vollständig und präzise.

Vollständig

Vollständig`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe(
      "Deine Antwort ist vollständig und präzise.\n\nVollständig",
    );
  });

  it("handles sequence without blank lines between drafts, scratchpad and verdicts", () => {
    const raw = `Deine Antwort trifft den späteren Fehler.
Vollständig✅
Winvalid
We need must assess completeness. Learner says subnet. Target concept. Missing elements.
Du beschreibst den späteren Fehler bei der Node-Bereitstellung.
Unvollständig (2)`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe(
      "Du beschreibst den späteren Fehler bei der Node-Bereitstellung.\n\nUnvollständig (2)",
    );
  });

  it("strips scratchpad monologue appearing after the final verdict", () => {
    const raw = `Deine Antwort ist unvollständig.

Unvollständig (2)

Winvalid
We need must assess completeness. Learner says PIM elevated. Target concept. Missing elements.`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe("Deine Antwort ist unvollständig.\n\nUnvollständig (2)");
  });

  it("strips scratchpad monologue when answer ends with monologue after first verdict", () => {
    const raw = `Deine Antwort ist gut.

Vollständig✅

Winvalid
We need must assess completeness. Learner says Paris. Chain of thought reflection. Don't include emoji.`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe("Deine Antwort ist gut.\n\nVollständig");
  });

  it("preserves legitimate tutor phrasing and reflection vocabulary", () => {
    const tutor1 = `Let's check this against the concept. You named the later subnet error.

Incomplete (2)`;
    expect(cleanRecallEvaluation(tutor1, "en")).toBe(tutor1);

    const tutor2 = `Invalid assumption: the control plane can join the subnet directly.

Incomplete (1)`;
    expect(cleanRecallEvaluation(tutor2, "en")).toBe(tutor2);

    const tutor3 = `We need write permission on role assignments before the join succeeds.

Incomplete (1)`;
    expect(cleanRecallEvaluation(tutor3, "en")).toBe(tutor3);

    const tutor4 = `The target concept has three parts. Missing elements are the CLI warning.

Incomplete (1)`;
    expect(cleanRecallEvaluation(tutor4, "en")).toBe(tutor4);

    const tutor5 = `Wait, the second component is missing from your description.

Incomplete (1)`;
    expect(cleanRecallEvaluation(tutor5, "en")).toBe(tutor5);

    const tutor6 = `Warte, bei genauerem Hinsehen fehlt die Begründung für Schritt 2.

Unvollständig (1)`;
    expect(cleanRecallEvaluation(tutor6, "de")).toBe(tutor6);
  });

  it("strips closed and unclosed <think> and <thinking> tags while preserving content", () => {
    const closed = `<thinking>
The student identified Paris as the capital.
Target concept is Paris.
</thinking>
Paris ist die richtige Antwort.

Vollständig`;
    expect(cleanRecallEvaluation(closed, "de")).toBe(
      "Paris ist die richtige Antwort.\n\nVollständig",
    );

    const unclosedWithAnswer = `<think>
Paris ist die richtige Antwort.

Vollständig`;
    expect(cleanRecallEvaluation(unclosedWithAnswer, "de")).toBe(
      "Paris ist die richtige Antwort.\n\nVollständig",
    );

    const unclosedWithoutVerdict =
      "<think>Model started thinking but got cut off";
    expect(cleanRecallEvaluation(unclosedWithoutVerdict, "de")).toBe(
      "Model started thinking but got cut off",
    );
  });

  it("strips conversational intros and surrounding markdown code blocks", () => {
    const raw = `Here is the evaluation:
\`\`\`markdown
Deine Antwort ist vollständig.

Incomplete (1)
\`\`\``;

    const cleaned = cleanRecallEvaluation(raw, "en");
    expect(cleaned).toBe("Deine Antwort ist vollständig.\n\nIncomplete (1)");
  });

  it("cleans trailing emojis and symbols with whitespace from completeness verdict lines", () => {
    const rawWithSpace = `Deine Antwort trifft es genau.

Vollständig ✅`;
    expect(cleanRecallEvaluation(rawWithSpace, "de")).toBe(
      "Deine Antwort trifft es genau.\n\nVollständig",
    );

    const rawIncomplete = `Es fehlt noch die Begründung.

Unvollständig (1) ❌`;
    expect(cleanRecallEvaluation(rawIncomplete, "de")).toBe(
      "Es fehlt noch die Begründung.\n\nUnvollständig (1)",
    );

    const rawBoldWithEmoji = `Gut erklärt.

**Unvollständig (2)** ✅`;
    expect(cleanRecallEvaluation(rawBoldWithEmoji, "de")).toBe(
      "Gut erklärt.\n\nUnvollständig (2)",
    );

    const rawSingleVerdict = `Vollständig ✅`;
    expect(cleanRecallEvaluation(rawSingleVerdict, "de")).toBe("Vollständig");
  });

  it("recognizes inline verdict sentences with separators and supersedes them", () => {
    const raw = `Vollständig✅ — es fehlt aber die Warnung.

Unvollständig (2)`;
    expect(cleanRecallEvaluation(raw, "de")).toBe("Unvollständig (2)");
  });

  it("discards earlier abandoned drafts without scratchpad when multiple verdicts exist", () => {
    const raw = `Deine Antwort ist super.

Vollständig

Warte, bei genauerem Hinsehen fehlt die Begründung für Schritt 2.

Unvollständig (1)`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).not.toContain("Vollständig");
    expect(cleaned).toBe(
      "Warte, bei genauerem Hinsehen fehlt die Begründung für Schritt 2.\n\nUnvollständig (1)",
    );
  });

  it("strips leading Thinking Process header paragraphs", () => {
    const raw = `Thinking Process:
Target concept asks for 2 components. Learner covered 1. Missing component is the warning.

Your answer covers the second part, but misses the initial warning.

Incomplete (1)`;

    const cleaned = cleanRecallEvaluation(raw, "en");
    expect(cleaned).not.toContain("Thinking Process");
    expect(cleaned).toBe(
      "Your answer covers the second part, but misses the initial warning.\n\nIncomplete (1)",
    );
  });

  it("preserves single-line evaluations unchanged", () => {
    const raw = "Vollständig — Paris ist die Hauptstadt Frankreichs.";
    expect(cleanRecallEvaluation(raw, "de")).toBe(raw);
  });

  it("handles empty or whitespace strings gracefully", () => {
    expect(cleanRecallEvaluation("", "de")).toBe("");
    expect(cleanRecallEvaluation("   ", "de")).toBe("");
  });
});
