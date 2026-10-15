import { describe, expect, it } from "vitest";
import {
  attachedMedia,
  renderCardText,
} from "../../desktop/src/card-text-render.js";
import { renderQuestionWithTopic } from "../../desktop/src/question-topic.js";
import type { CardSegmentPayload } from "../../src/bridge/protocol.js";

/**
 * Just enough of a DOM for the renderer, in the style of
 * `question-topic.test.ts`: nodes are plain objects that remember what they
 * were given. There is no MathML engine here, so every formula keeps its
 * plain form — exactly the fallback a learner sees while Temml loads.
 */
interface FakeNode {
  tag?: string;
  className?: string;
  text?: string;
  textContent: string;
  alt?: string;
  src?: string;
  children: FakeNode[];
  replaceChildren(...nodes: FakeNode[]): void;
  append(...nodes: FakeNode[]): void;
}

function fakeDocument() {
  // biome-ignore lint/suspicious/noExplicitAny: a test double of Document.
  const doc: any = {};
  const make = (tag?: string, text?: string): FakeNode => {
    const node: FakeNode & { ownerDocument: unknown } = {
      ownerDocument: doc,
      tag,
      className: "",
      text,
      children: [],
      get textContent() {
        return this.text ?? this.children.map((c) => c.textContent).join("");
      },
      set textContent(value: string) {
        this.children = [];
        this.text = value;
      },
      replaceChildren(...nodes: FakeNode[]) {
        this.text = undefined;
        this.children = nodes;
      },
      append(...nodes: FakeNode[]) {
        this.children.push(...nodes);
      },
    };
    return node;
  };
  doc.createElement = (tag: string) => make(tag);
  doc.createTextNode = (text: string) => make(undefined, text);
  return make("div");
}

const CARD: CardSegmentPayload[] = [
  { type: "text", text: "Wie ändert sich " },
  {
    type: "math",
    tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
    speech: "W el gleich ein halb C U Quadrat",
  },
  { type: "text", text: "?" },
];

describe("renderCardText", () => {
  it("renders the plain string when there are no segments", async () => {
    const element = fakeDocument();
    await renderCardText(element as never, null, "Plain question?");
    expect(element.textContent).toBe("Plain question?");
  });

  it("puts text nodes and a formula holder with the plain form in order", async () => {
    const element = fakeDocument();
    await renderCardText(element as never, CARD, "ignored");
    expect(element.children.map((child) => child.tag ?? "#text")).toEqual([
      "#text",
      "span",
      "#text",
    ]);
    expect(element.children[1].className).toBe("card-math");
    // Without a MathML engine the formula keeps its plain Unicode form.
    expect(element.textContent).toBe("Wie ändert sich W_el = ½CU²?");
  });

  it("marks a block formula and shows an image from its source", async () => {
    const element = fakeDocument();
    const hash = "a".repeat(64);
    await renderCardText(
      element as never,
      [
        { type: "math", tex: "x^2", block: true },
        { type: "image", media: hash, alt: "ein Dreieck", inline: true },
      ],
      "",
      { imageSource: (h) => (h === hash ? "data:image/png;base64,AA" : null) },
    );
    expect(element.children[0].className).toBe("card-math card-math-block");
    expect(element.children[1]).toMatchObject({
      tag: "img",
      className: "card-image card-image-inline",
      alt: "ein Dreieck",
      src: "data:image/png;base64,AA",
    });
  });

  it("shows an image's alt text when its source is missing", async () => {
    const element = fakeDocument();
    await renderCardText(
      element as never,
      [{ type: "image", media: "b".repeat(64), alt: "eine Parabel" }],
      "",
    );
    expect(element.textContent).toBe("eine Parabel");
  });
});

describe("renderQuestionWithTopic with segments", () => {
  it("keeps the topic label and renders the question as card text", () => {
    const element = fakeDocument();
    renderQuestionWithTopic(
      element as never,
      "physik/elektrizitaet",
      "plain",
      CARD,
    );
    expect(element.children[0]).toMatchObject({
      tag: "strong",
      className: "question-topic",
      text: "physik › elektrizitaet",
    });
    expect(element.textContent).toBe(
      "physik › elektrizitaet — Wie ändert sich W_el = ½CU²?",
    );
  });
});

describe("the attachment strip (ADR 2026-10-14b, Decision 5)", () => {
  it("skips an image that is part of the card text", () => {
    const media = [
      { side: "question", ordinal: 1, placement: "inline", name: "in text" },
      { side: "question", ordinal: 2, placement: "attached", name: "beside" },
      { side: "question", ordinal: 0, name: "legacy row" },
      { side: "answer", ordinal: 0, placement: "attached", name: "answer" },
    ];
    expect(attachedMedia(media, "question").map((entry) => entry.name)).toEqual([
      "legacy row",
      "beside",
    ]);
  });
});
