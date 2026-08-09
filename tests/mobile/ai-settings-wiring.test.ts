import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";

const file = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf-8");

/**
 * A key that works is not a question worth asking again.
 *
 * The AI card used to keep an empty password field on screen after a
 * successful connect, directly under the word "Connected" — which reads as
 * *your key is missing*, on the one screen where the learner has already
 * done the thing being asked for. The only change a connected learner
 * normally wants here is a different model.
 *
 * These are text assertions against markup and source, the same trade the
 * desktop wiring tests make: the alternative is booting the WebView, and a
 * regression here is silent — the app still works, it just interrogates
 * people about something they have already settled.
 */
describe("AI settings key field", () => {
  const html = file("mobile/index.html");
  const main = file("mobile/src/main.ts");

  it("ships hidden, so a connected device never shows an empty key box", () => {
    expect(html).toContain('<label class="field hidden" id="ai-key-field">');
  });

  it("offers a way back to it", () => {
    expect(html).toContain('id="ai-change-key"');
    expect(main).toContain('aiChangeKeyButton.addEventListener("click"');
    expect(main).toContain("showAiKeyField(true)");
  });

  it("keys the field's visibility off whether a provider is connected", () => {
    // `label` is the connected provider's name — null when nothing is set up.
    expect(main).toContain("showAiKeyField(!label)");
    expect(main).toContain(
      'aiChangeKeyButton.classList.toggle("hidden", !label)',
    );
  });

  it("hides the onboarding paragraph and the key link once connected", () => {
    expect(main).toContain('aiDesc.classList.toggle("hidden", Boolean(label))');
    expect(main).toContain(
      'aiGetKeyButton.classList.toggle("hidden", Boolean(label))',
    );
  });

  it("clears the box when hiding it, so nothing typed is left behind", () => {
    const fn = main.slice(main.indexOf("function showAiKeyField"));
    expect(fn.slice(0, fn.indexOf("}\n"))).toContain('aiKeyInput.value = ""');
  });

  it("labels the new control in both languages", () => {
    // Parity between de and en is enforced in i18n.test.ts; this pins that the
    // keys exist at all, so the button cannot ship showing its own key name.
    for (const key of ["ai_change_key", "ai_change_key_hint"]) {
      expect(messageKeys("de")).toContain(key);
    }
    expect(html).toContain('data-i18n="ai_change_key"');
  });
});
