import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const main = readFileSync(join(root, "mobile", "src", "main.ts"), "utf8");
const html = readFileSync(join(root, "mobile", "index.html"), "utf8");
const i18n = readFileSync(join(root, "mobile", "src", "i18n.ts"), "utf8");

/**
 * ADR 2026-08-09c decisions 4 and 6, at the surface: a live per-capability
 * state, a deliberate download, and no control where the platform cannot
 * serve the capability at all.
 */
describe("local AI settings wiring", () => {
  it("builds its rows from the capability matrix rather than markup", () => {
    // Hard-coded rows would drift from the platform table the kernel owns.
    expect(html).toContain('id="local-ai-rows"');
    expect(main).toContain("buildAiSettingsRows(");
    expect(html).not.toContain('id="local-ai-recall"');
  });

  it("finally calls the two on-device commands that existed unused", () => {
    expect(main).toContain(
      'invoke<OnDeviceLlmStatus>("on_device_llm_check_status")',
    );
    expect(main).toContain('invoke("on_device_llm_ensure_ready")');
  });

  it("offers the download outside a review", () => {
    // The point of decision 6: the multi-minute AICore download is taken
    // deliberately in Settings, not discovered mid-card.
    expect(html).toContain('id="local-ai-prepare"');
    expect(main).toContain("prepareLocalAi");
    expect(main).toContain(
      "localAiPrepare.hidden = !rows.some((row) => row.canPrepare)",
    );
  });

  it("keeps the copy translated in both shipped languages", () => {
    for (const key of [
      "local_ai_heading",
      "local_ai_state_unsupported",
      "local_ai_status_downloadable",
      "local_ai_prepare",
    ]) {
      expect(i18n.split(`${key}:`).length - 1).toBe(2);
    }
  });
});
