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

  it("strips closed and unclosed <think> tags", () => {
    const raw = `<think>
The student identified Paris as the capital.
Target concept is Paris.
Everything is covered.
</think>
Paris ist die richtige Antwort.

Vollständig`;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe("Paris ist die richtige Antwort.\n\nVollständig");

    const unclosed = "<think>Model started thinking but got cut off";
    expect(cleanRecallEvaluation(unclosed, "de")).toBe("");
  });

  it("strips markdown code blocks and conversational prefixes", () => {
    const raw = `\`\`\`markdown
Evaluation:
Deine Antwort ist vollständig.

Vollständig
\`\`\``;

    const cleaned = cleanRecallEvaluation(raw, "de");
    expect(cleaned).toBe("Deine Antwort ist vollständig.\n\nVollständig");
  });

  it("cleans trailing emojis and symbols from completeness verdict lines", () => {
    const rawWithEmoji = `Deine Antwort trifft es genau.

Vollständig✅`;
    expect(cleanRecallEvaluation(rawWithEmoji, "de")).toBe(
      "Deine Antwort trifft es genau.\n\nVollständig",
    );

    const rawIncomplete = `Es fehlt noch die Begründung.

Unvollständig (1)❌`;
    expect(cleanRecallEvaluation(rawIncomplete, "de")).toBe(
      "Es fehlt noch die Begründung.\n\nUnvollständig (1)",
    );

    const rawBold = `Gut erklärt.

**Unvollständig (2)**`;
    expect(cleanRecallEvaluation(rawBold, "de")).toBe(
      "Gut erklärt.\n\nUnvollständig (2)",
    );
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
