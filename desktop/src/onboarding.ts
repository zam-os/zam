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
  /**
   * Commit the step's choice before advancing via "Next". Best-effort like
   * completion: a failure is logged and the flow still advances, never
   * trapping the user. "Skip" deliberately bypasses this hook — skipping a
   * page must leave no side effect (ADR 2026-07-24 §7).
   */
  onNext?(): Promise<void> | void;
}

/**
 * Start-persona card data (ADR 2026-07-24 §2), as served by desktop-bootstrap
 * from the kernel's `PERSONA_DESCRIPTORS`. Mirrored here as a structural type
 * because the desktop never imports kernel modules — it meets the kernel only
 * through the bridge JSON.
 */
export interface OnboardingPersona {
  id: string;
  labelKey: string;
  descriptionKey: string;
  contextLabelKey: string;
  knowledgeContextSlug: string;
  defaultImportPath: string;
}

export interface OnboardingStepContext {
  /** Persona cards to offer; empty until desktop-bootstrap has answered. */
  personas: OnboardingPersona[];
  /** Persisted (or default "private") persona to preselect. */
  selectedPersonaId: string;
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
  /** Live step data (personas, persisted selection), read at start() time. */
  getStepContext(): OnboardingStepContext;
}

/**
 * Persona persisted through the bridge in THIS session. main.ts refreshes its
 * bootstrap copy only when a dashboard reload runs (after "completed"), so
 * this memo keeps re-entry via "Finish later" → "Run setup again" preselecting
 * what was actually saved.
 */
let lastPersistedPersonaId: string | null = null;

/**
 * The ordered step list. Later phases splice their pages in between welcome
 * and done. Kept as a builder (not a module constant) so each step reads live
 * state — locale, bootstrap data, prior choices — at construction time.
 */
export function buildOnboardingSteps(
  ctx: OnboardingStepContext,
): OnboardingStep[] {
  // Selection survives Back/forward re-renders within one run of the flow;
  // each start() re-reads the persisted value (or the in-session memo).
  let selectedPersonaId = lastPersistedPersonaId ?? ctx.selectedPersonaId;

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
      id: "persona",
      titleKey: "onboarding_persona_kicker",
      skippable: false,
      render(container) {
        container.append(
          heading(t("onboarding_persona_title")),
          paragraph(t("onboarding_persona_body")),
        );
        const group = document.createElement("div");
        group.className = "onboarding-persona-grid";
        group.setAttribute("role", "radiogroup");
        group.setAttribute("aria-label", t("onboarding_persona_title"));
        for (const persona of ctx.personas) {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "onboarding-persona-card";
          card.dataset.personaId = persona.id;
          card.setAttribute("role", "radio");
          const label = document.createElement("span");
          label.className = "onboarding-persona-label";
          label.textContent = t(persona.labelKey);
          const why = document.createElement("span");
          why.className = "onboarding-persona-why";
          why.textContent = t(persona.descriptionKey);
          card.append(label, why);
          card.addEventListener("click", () => {
            selectedPersonaId = persona.id;
            markPersonaSelection(group, selectedPersonaId);
          });
          group.append(card);
        }
        markPersonaSelection(group, selectedPersonaId);
        container.append(group, paragraph(t("onboarding_persona_hint")));
      },
      async onNext() {
        const persona = ctx.personas.find((p) => p.id === selectedPersonaId);
        if (!persona) return;
        // Persist the choice machine-local and seed its knowledge context
        // (the persona's only data-model side effect). The label travels from
        // here because only the desktop knows the user's locale.
        await runBridge("onboarding-persona", [
          persona.id,
          "--context-label",
          t(persona.contextLabelKey),
        ]);
        lastPersistedPersonaId = persona.id;
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

function markPersonaSelection(group: HTMLElement, selectedId: string): void {
  for (const card of group.querySelectorAll<HTMLButtonElement>(
    ".onboarding-persona-card",
  )) {
    const selected = card.dataset.personaId === selectedId;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-checked", String(selected));
  }
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

  /**
   * "Next" on a non-final step: commit the step's choice first, then move on.
   * Committing is best-effort — a bridge failure is logged and the flow still
   * advances (the same never-trap rule as complete()); "Skip" goes straight
   * to goTo() and deliberately never runs onNext.
   */
  async function advance(): Promise<void> {
    const step = steps[index];
    if (step?.onNext) {
      nextBtn.disabled = true;
      try {
        await step.onNext();
      } catch (err) {
        console.error(`onboarding step "${step.id}" commit failed`, err);
      } finally {
        nextBtn.disabled = false;
      }
    }
    goTo(index + 1);
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
      void advance();
    }
  });
  finishLaterBtn.addEventListener("click", () => {
    // "Finish later" leaves without marking the machine onboarded, so the flow
    // is offered again next launch (and, from Phase 9, as a dashboard checklist).
    deps.onLeave("later");
  });

  return {
    start(): void {
      steps = buildOnboardingSteps(deps.getStepContext());
      index = 0;
      render();
    },
  };
}
