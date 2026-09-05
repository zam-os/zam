import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("desktop learning mode wiring", () => {
  const settingsTs = file("desktop/src/panel/settings.ts");
  const recallTs = file("desktop/src/panel/recall.ts");
  const nativeHtml = file("desktop/index.html");
  const nativeMain = file("desktop/src/main.ts");
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

  it("provides the same settings in the native desktop app", () => {
    expect(nativeHtml).toContain('id="settings-learning-mode"');
    expect(nativeHtml).toContain('id="settings-voice-reveal-timeout"');
    expect(nativeMain).toContain('"study-learning-get"');
    expect(nativeMain).toContain('"study-learning-set"');
    expect(nativeMain).toContain('"--fallback-mode"');
  });

  it("provides a native in-session Flash and AI switcher", () => {
    expect(nativeHtml).toContain('id="study-mode-switcher"');
    expect(nativeHtml).toContain('id="btn-study-mode-flash"');
    expect(nativeHtml).toContain('id="btn-study-mode-feedback"');
    expect(nativeMain).toContain('switchStudyLearningMode("flash")');
    expect(nativeMain).toContain('switchStudyLearningMode("answer_feedback")');
  });

  it("makes native Flash review one-click and skips AI work", () => {
    expect(nativeMain).toContain("const dynamicQuestionAllowed =");
    expect(nativeMain).toContain("!isFlashLearningMode()");
    expect(nativeMain).toContain(
      't(flash ? "btn_recall_reveal" : "btn_reveal_answer")',
    );
    expect(nativeMain).toMatch(
      /getElementById\("study-active-card"\)\?\.addEventListener\(\s*"click"/,
    );
    expect(nativeMain).toContain(
      'const userAnswer = isFlashLearningMode() ? ""',
    );
  });

  it("passes native learning mode timeouts into voice review", () => {
    expect(nativeMain).toContain(".start(locale, {");
    expect(nativeMain).toContain(
      "mode: currentStudyLearningSettings.learningMode",
    );
    expect(nativeMain).toContain(
      "currentStudyLearningSettings.voiceRevealTimeoutSec * 1000",
    );
    expect(nativeMain).toContain(
      "currentStudyLearningSettings.voiceRatingTimeoutSec * 1000",
    );
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
