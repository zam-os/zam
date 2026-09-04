import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("desktop learning mode wiring", () => {
  const settingsTs = file("desktop/src/panel/settings.ts");
  const recallTs = file("desktop/src/panel/recall.ts");
  const mcpTs = file("src/cli/commands/mcp.ts");
  const bridgeTs = file("src/cli/commands/bridge.ts");

  it("provides learning mode selection and auto-reveal timeout in settings", () => {
    expect(settingsTs).toContain('id = "settings-learning-mode"');
    expect(settingsTs).toContain('id = "settings-voice-reveal-timeout"');
    expect(settingsTs).toContain('bridgeCall("study-learning-get"');
    expect(settingsTs).toContain('bridgeCall("study-learning-set"');
    expect(settingsTs).not.toContain("recall.learning_mode");
    expect(settingsTs).not.toContain("recall.voice_reveal_timeout_sec");
  });

  it("provides in-session mode toggle in recall panel", () => {
    expect(recallTs).toContain("recall-mode-toggle");
    expect(recallTs).toContain('t("learning_mode_switch_flash")');
    expect(recallTs).toContain('t("learning_mode_switch_feedback")');
    expect(recallTs).toContain("answer.hidden = true;");
    expect(recallTs).toContain('question.style.cursor = "pointer"');
    expect(recallTs).toContain("if (!text || isFlash)");
  });

  it("exposes learningMode in zam_open_recall result", () => {
    expect(mcpTs).toContain("getStudyLearningSettings");
    expect(mcpTs).toContain("learningMode,");
  });

  it("supports study-learning-get and study-learning-set bridge commands", () => {
    expect(bridgeTs).toContain('.command("study-learning-get")');
    expect(bridgeTs).toContain('.command("study-learning-set")');
    expect(bridgeTs).not.toContain('"recall.learning_mode"');
    expect(bridgeTs).not.toContain('"recall.voice_reveal_timeout_sec"');
  });
});
