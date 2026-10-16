/**
 * Dev-only: the formula editor on a sample card (see the HTML). The model's
 * correction is scripted: it puts the formula in the units the instruction
 * asks for, or appends the instruction as text.
 */

import type { CardSegmentPayload } from "../../src/bridge/protocol.js";
import { attachCardTextEditor } from "../src/card-text-editor.js";

const ENERGY: CardSegmentPayload[] = [
  { type: "text", text: "Wie groß ist die Energie " },
  {
    type: "math",
    tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
    speech: "W el gleich ein halb C U Quadrat",
  },
  { type: "text", text: " im Kondensator?" },
];

const question = document.getElementById("question") as HTMLTextAreaElement;
const answer = document.getElementById("answer") as HTMLTextAreaElement;

const scripted = async (args: string[]) => {
  const instruction = args[args.indexOf("--instruction") + 1] ?? "";
  return {
    plain: `Die Energie im Kondensator: W_el = ½CU² (${instruction})`,
    segments: [
      { type: "text", text: "Die Energie im Kondensator: " },
      {
        type: "math",
        tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
        speech: "W el gleich ein halb C U Quadrat",
      },
      { type: "text", text: ` (${instruction})` },
    ] as CardSegmentPayload[],
  };
};

const questionEditor = attachCardTextEditor(question, {
  side: "question",
  otherSide: () => answer.value,
  fix: scripted,
});
const answerEditor = attachCardTextEditor(answer, {
  side: "answer",
  otherSide: () => question.value,
  fix: scripted,
});
questionEditor.load(
  "Wie groß ist die Energie W_el = ½CU² im Kondensator?",
  ENERGY,
);
answerEditor.load("Ein halb mal Kapazität mal Spannung zum Quadrat.", null);

document.getElementById("save")?.addEventListener("click", () => {
  (document.getElementById("saved") as HTMLElement).textContent =
    JSON.stringify(
      {
        question: question.value,
        questionSegments: questionEditor.segmentsForSave(),
        answer: answer.value,
        answerSegments: answerEditor.segmentsForSave(),
      },
      null,
      2,
    );
});
