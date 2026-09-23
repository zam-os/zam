import { describe, expect, it } from "vitest";
import {
  formatGoalBreakdown,
  goalTopicCurriculumText,
} from "../../../src/kernel/index.js";

describe("goal breakdown text (ADR 2026-07-24 §3)", () => {
  it("formats the confirmed outline with its drill-down path", () => {
    expect(
      formatGoalBreakdown(
        ["Chords"],
        [
          { label: "Open chords", description: "The eight basic shapes." },
          { label: "Barre chords", description: "F and B without buzzing." },
        ],
      ),
    ).toBe(
      [
        "",
        "### Breakdown",
        "Path: Chords",
        "",
        "- **Open chords** — The eight basic shapes.",
        "- **Barre chords** — F and B without buzzing.",
      ].join("\n"),
    );
  });

  it("is empty when nothing was confirmed", () => {
    expect(formatGoalBreakdown(["Chords"], [])).toBe("");
  });

  it("frames one topic with the same line the goal file carries", () => {
    const topic = { label: "Barre chords", description: "F and B." };
    const text = goalTopicCurriculumText({
      title: " Learn Guitar ",
      description: "Play around the campfire.",
      path: ["Chords"],
      topic,
    });

    expect(text).toBe(
      [
        "# Learn Guitar",
        "",
        "Play around the campfire.",
        "",
        "### Breakdown",
        "Path: Chords",
        "",
        "- **Barre chords** — F and B.",
      ].join("\n"),
    );
    expect(text).toContain(formatGoalBreakdown(["Chords"], [topic]));
  });

  it("omits an empty description", () => {
    expect(
      goalTopicCurriculumText({
        title: "Learn Guitar",
        description: "  ",
        path: [],
        topic: { label: "Open chords", description: "Eight shapes." },
      }),
    ).toBe(
      "# Learn Guitar\n\n### Breakdown\n- **Open chords** — Eight shapes.",
    );
  });
});
