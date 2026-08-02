import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BOOT_SLOW_AFTER_MS,
  BOOT_STEP_IDS,
  completeStep,
  createBootState,
  currentStep,
  currentStepLabelKey,
  elapsedSeconds,
  failStep,
  finishBoot,
  isOverlayVisible,
  isSlow,
  restartBoot,
  startStep,
  stepToBlame,
} from "../../desktop/src/boot-progress.js";

/**
 * The Studio paints its whole dashboard from static markup, so until
 * `loadDashboard` answers the due count, language badge and AI pill are
 * placeholders. A wedged start therefore looked like a finished dashboard
 * reporting "0 due — all caught up" in English. These cover the state machine
 * behind the overlay that now covers that window.
 */
describe("boot progress", () => {
  const T0 = 1_000_000;

  it("starts with every step pending and the overlay up", () => {
    const state = createBootState(T0);
    expect(isOverlayVisible(state)).toBe(true);
    for (const step of BOOT_STEP_IDS) {
      expect(state.statuses[step]).toBe("pending");
    }
    expect(currentStep(state)).toBeUndefined();
  });

  it("names the running step so the overlay can say what it is doing", () => {
    const state = startStep(createBootState(T0), "cards");
    expect(currentStep(state)).toBe("cards");
    expect(currentStepLabelKey(state)).toBe("boot_step_cards");
  });

  it("marks steps skipped over as done rather than leaving them stuck", () => {
    // A retry that resumes past the vault (already unlocked this session)
    // must not leave "settings" looking like it never finished.
    const state = startStep(createBootState(T0), "cards");
    expect(state.statuses.settings).toBe("done");
    expect(state.statuses.vault).toBe("done");
    expect(state.statuses.cards).toBe("running");
  });

  it("keeps the overlay up when a step fails, naming that step", () => {
    let state = startStep(createBootState(T0), "vault");
    state = failStep(state, "vault", "vault locked");

    expect(isOverlayVisible(state)).toBe(true);
    expect(state.failure).toEqual({ step: "vault", message: "vault locked" });
    expect(state.statuses.vault).toBe("failed");
    // The step name is what the learner needs; it survives into the label.
    expect(currentStepLabelKey(state)).toBe("boot_step_vault");
  });

  it("blames the running step, or the first unfinished one", () => {
    const running = startStep(createBootState(T0), "cards");
    expect(stepToBlame(running)).toBe("cards");

    // Thrown between steps: the last completed step is not to blame.
    const between = completeStep(startStep(createBootState(T0), "settings"), "settings");
    expect(stepToBlame(between)).toBe("vault");
  });

  it("only closes the overlay once the dashboard holds real data", () => {
    let state = startStep(createBootState(T0), "cards");
    expect(isOverlayVisible(state)).toBe(true);

    state = finishBoot(state);
    expect(isOverlayVisible(state)).toBe(false);
    for (const step of BOOT_STEP_IDS) {
      expect(state.statuses[step]).toBe("done");
    }
    expect(state.failure).toBeUndefined();
  });

  it("reports a slow start only while it is still running", () => {
    const state = startStep(createBootState(T0), "settings");
    expect(isSlow(state, T0 + BOOT_SLOW_AFTER_MS - 1)).toBe(false);
    expect(isSlow(state, T0 + BOOT_SLOW_AFTER_MS)).toBe(true);
    expect(elapsedSeconds(state, T0 + 7_400)).toBe(7);

    // A failure says something more specific, and a finished start says
    // nothing at all — neither should also read as "still working".
    expect(isSlow(failStep(state, "settings", "boom"), T0 + 60_000)).toBe(false);
    expect(isSlow(finishBoot(state), T0 + 60_000)).toBe(false);
  });

  it("keeps the original clock across a retry so elapsed stays honest", () => {
    let state = startStep(createBootState(T0), "cards");
    state = failStep(state, "cards", "bridge timeout");
    const retried = restartBoot(state);

    expect(retried.startedAt).toBe(T0);
    expect(retried.failure).toBeUndefined();
    expect(retried.statuses.cards).toBe("pending");
    expect(isOverlayVisible(retried)).toBe(true);
  });
});

describe("startup overlay wiring", () => {
  const desktopFile = (path: string) =>
    readFileSync(join(process.cwd(), "desktop", path), "utf8");
  const html = desktopFile("index.html");
  const main = desktopFile("src/main.ts");

  it("ships the overlay in the static markup, not built by main.ts", () => {
    // Created in JS it would appear only after the bundle parses — the very
    // window it exists to cover.
    expect(html).toContain('id="boot-overlay"');
    expect(html).toContain('id="boot-steps"');
    expect(main).not.toContain('createElement("div")\n    boot');
  });

  it("does not present unmeasured placeholders as readings", () => {
    const dueCount = html.match(/id="due-count"[^>]*>([^<]*)</)?.[1];
    expect(dueCount?.trim()).not.toBe("0");
    // "You're all caught up!" must not be on screen before anything is counted.
    expect(html).toMatch(/id="lbl-caught-up"[^>]*class="[^"]*hidden/);
    // Nor may the AI pill claim "offline" before the probe has run.
    expect(html).not.toContain('id="ai-status-label">Local AI Offline<');
  });

  it("drives the overlay from the real startup phases", () => {
    for (const call of [
      'beginBootStep("settings")',
      'beginBootStep("vault")',
      'beginBootStep("cards")',
      "finishBootOverlay()",
    ]) {
      expect(main).toContain(call);
    }
    // Every failure path names a step instead of silently dropping the overlay.
    expect(main).toContain("failBootStep(currentBootStep(), err)");
  });

  it("remembers the locale so the first paint is not always English", () => {
    expect(main).toContain('localStorage.getItem("zam:locale")');
    expect(main).toContain("rememberLocale(settings.locale)");
    expect(main).toContain("if (remembered) setCurrentLocale(remembered)");
  });

  it("includes the repair button in static markup and marks DB failures", () => {
    const t0 = 1_000_000;
    expect(html).toContain('id="btn-boot-fix-db"');
    const state = failStep(createBootState(t0), "cards", "token rejected", true);
    expect(state.failure?.isDbError).toBe(true);
  });
  it("dismisses the overlay before exposing the credential form", () => {
    const fixHandler = main.slice(
      main.indexOf("fixDbBtn.onclick"),
      main.indexOf("const stepKey"),
    );
    expect(fixHandler).toContain(
      'dismissBootOverlay();\n        switchView("settings-view");',
    );
  });
});
