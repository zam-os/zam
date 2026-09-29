import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  questionTopic,
  renderQuestionWithTopic,
} from "../../desktop/src/question-topic.js";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

/** Just enough of an element for the renderer: nodes it was given. */
function fakeElement() {
  const nodes: Array<{ tag?: string; className?: string; text: string }> = [];
  const doc = {
    createElement: (tag: string) => ({ tag, className: "", textContent: "" }),
    createTextNode: (text: string) => ({ text }),
  };
  const element = {
    ownerDocument: doc,
    textContent: "",
    replaceChildren(...children: Array<Record<string, string>>) {
      nodes.length = 0;
      for (const child of children) {
        nodes.push({
          tag: child.tag,
          className: child.className,
          text: child.textContent ?? child.text ?? "",
        });
      }
      this.textContent = nodes.map((node) => node.text).join("");
    },
  };
  return { element: element as unknown as HTMLElement, nodes };
}

describe("question topic", () => {
  it("labels the question with the card's domain", () => {
    expect(questionTopic("axon-ivy")).toBe("axon-ivy");
    expect(questionTopic("schule/physik/optik")).toBe("schule › physik › optik");
    expect(questionTopic("  ")).toBeNull();
    expect(questionTopic(null)).toBeNull();
  });

  it("puts the topic in bold before the question, as text nodes", () => {
    const { element, nodes } = fakeElement();
    renderQuestionWithTopic(element, "axon-ivy", "Which probes do the pods use?");
    expect(nodes[0]).toMatchObject({
      tag: "strong",
      className: "question-topic",
      text: "axon-ivy",
    });
    expect(element.textContent).toBe(
      "axon-ivy — Which probes do the pods use?",
    );

    const plain = fakeElement();
    renderQuestionWithTopic(plain.element, "", "<b>not markup</b>");
    expect(plain.element.textContent).toBe("<b>not markup</b>");
  });

  it("is used by the Studio, Mobile and the Recall panel", () => {
    expect(file("desktop/src/main.ts")).toContain(
      "renderQuestionWithTopic(\n    document.getElementById(\"question-text\")!,",
    );
    expect(file("mobile/src/main.ts")).toContain(
      "renderQuestionWithTopic(reviewQuestion, item.domain, prompt.question);",
    );
    expect(file("desktop/src/panel/recall.ts")).toContain(
      "renderQuestionWithTopic(\n    question,\n    card.domain,",
    );
  });
});
