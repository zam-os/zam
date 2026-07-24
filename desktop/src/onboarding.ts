/**
 * First-run onboarding shell (ADR 2026-07-24, Phase 0).
 *
 * A multi-page, resumable flow shown when this machine has not completed
 * first-run (`onboardingDone` in ~/.zam/config.json, read via desktop-bootstrap).
 * Phase 0 ships only the container and two framing pages (welcome, done); later
 * phases insert their steps into `buildOnboardingSteps()` — persona, model
 * connect, agent connect, workspace, first content, first goal — without
 * touching the container or the routing.
 *
 * The module owns its own DOM (`#onboarding-view`) and persistence (the
 * `onboarding-complete` bridge call). View routing stays in main.ts, which
 * passes an `onLeave` callback used both for "finish later" and for the return
 * to the dashboard after completion.
 */

import { runBridge } from "./bridge-transport.js";
import { t } from "./i18n.js";

export interface OnboardingStep {
  /** Stable id for tests and later cross-step references. */
  id: string;
  /** i18n key for the step's kicker/title. */
  titleKey: string;
  /** Whether the "Skip" affordance is offered on this step. */
  skippable: boolean;
  /** Render the step's body into `container` (cleared before each call). */
  render(container: HTMLElement): void;
}

export interface OnboardingController {
  /** Reset to the first step, render, and reveal the flow. */
  start(): void;
}

interface OnboardingDeps {
  /**
   * Return to the dashboard. `reason` lets the caller reload only when it is
   * safe: after "completed" the machine is marked onboarded (a dashboard reload
   * will not re-trigger the first-run gate); after "later" the gate is still
   * armed, so the caller must show the already-rendered dashboard without
   * reloading, or it would bounce straight back into the flow.
   */
  onLeave(reason: "completed" | "later"): void;
}

/**
 * The ordered step list. Phase 0 = [welcome, done]; later phases splice their
 * pages in between. Kept as a builder (not a module constant) so a step can
 * read live state at construction time in later phases.
 */
export function buildOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: "welcome",
      titleKey: "onboarding_welcome_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_welcome_title")),
          paragraph(t("onboarding_welcome_body")),
          paragraph(t("onboarding_welcome_hint")),
        );
      },
    },
    {
      id: "done",
      titleKey: "onboarding_done_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_done_title")),
          paragraph(t("onboarding_done_body")),
        );
      },
    },
  ];
}

function heading(text: string): HTMLElement {
  const el = document.createElement("h1");
  el.className = "onboarding-step-title";
  el.textContent = text;
  return el;
}

function paragraph(text: string): HTMLElement {
  const el = document.createElement("p");
  el.className = "onboarding-step-text";
  el.textContent = text;
  return el;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing onboarding element #${id}`);
  return element as T;
}

export function initOnboarding(deps: OnboardingDeps): OnboardingController {
  const kicker = requiredElement<HTMLElement>("onboarding-kicker");
  const progress = requiredElement<HTMLElement>("onboarding-progress");
  const track = requiredElement<HTMLElement>("onboarding-progress-track");
  const fill = requiredElement<HTMLElement>("onboarding-progress-fill");
  const body = requiredElement<HTMLElement>("onboarding-step-body");
  const backBtn = requiredElement<HTMLButtonElement>("onboarding-back");
  const skipBtn = requiredElement<HTMLButtonElement>("onboarding-skip");
  const nextBtn = requiredElement<HTMLButtonElement>("onboarding-next");
  const finishLaterBtn = requiredElement<HTMLButtonElement>(
    "onboarding-finish-later",
  );

  let steps: OnboardingStep[] = [];
  let index = 0;
  let leaving = false;

  function render(): void {
    const step = steps[index];
    if (!step) return;
    const total = steps.length;
    const human = index + 1;

    kicker.textContent = t(step.titleKey);
    progress.textContent = t("onboarding_progress")
      .replace("{step}", String(human))
      .replace("{total}", String(total));
    track.setAttribute("aria-valuenow", String(human));
    track.setAttribute("aria-valuemax", String(total));
    fill.style.width = `${(human / total) * 100}%`;

    body.replaceChildren();
    step.render(body);

    // All button labels are re-read here (not once at init) so a locale switch
    // between launch and opening the flow shows every control in the current
    // language — render() runs on each start()/navigation.
    backBtn.textContent = t("onboarding_back");
    skipBtn.textContent = t("onboarding_skip");
    finishLaterBtn.textContent = t("onboarding_finish_later");
    backBtn.disabled = index === 0;
    skipBtn.classList.toggle("hidden", !step.skippable);
    const isLast = index === total - 1;
    nextBtn.textContent = isLast
      ? t("onboarding_finish")
      : t("onboarding_next");
  }

  function goTo(next: number): void {
    index = Math.max(0, Math.min(steps.length - 1, next));
    render();
  }

  async function complete(): Promise<void> {
    if (leaving) return;
    leaving = true;
    nextBtn.disabled = true;
    try {
      await runBridge("onboarding-complete");
    } catch (err) {
      // Persisting the flag is best-effort: a failure here must not trap the
      // user in the flow. Log and leave; the gate simply re-shows next launch.
      console.error("onboarding-complete failed", err);
    } finally {
      nextBtn.disabled = false;
      leaving = false;
      deps.onLeave("completed");
    }
  }

  backBtn.addEventListener("click", () => goTo(index - 1));
  skipBtn.addEventListener("click", () => goTo(index + 1));
  nextBtn.addEventListener("click", () => {
    if (index === steps.length - 1) {
      void complete();
    } else {
      goTo(index + 1);
    }
  });
  finishLaterBtn.addEventListener("click", () => {
    // "Finish later" leaves without marking the machine onboarded, so the flow
    // is offered again next launch (and, from Phase 9, as a dashboard checklist).
    deps.onLeave("later");
  });

  return {
    start(): void {
      steps = buildOnboardingSteps();
      index = 0;
      render();
    },
  };
}
