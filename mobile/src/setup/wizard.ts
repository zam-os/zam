/**
 * The first-run wizard: three pages, one decision each (ADR 2026-08-08b).
 *
 * Page 1 asks the language, because everything after it is written in one.
 * Page 2 asks what the learner is learning for, which is the only thing that
 * changes what ZAM suggests later. Page 3 says what just happened and gets
 * out of the way.
 *
 * Nothing here asks for an account, a key or a network. Those are upgrades a
 * learner reaches for when they want them, and putting any of them in the
 * first minute would be the difference between an app that works on the bus
 * and one that does not.
 *
 * The wizard owns only the pages. Producing the library is
 * `completeFirstRun`, so the two are testable apart: this file is DOM, that
 * one is data.
 */

import {
  DEFAULT_PERSONA_ID,
  isPersonaId,
  type PersonaId,
} from "../../../src/kernel/models/persona.js";
import {
  applyStaticTranslations,
  type Locale,
  setLocale,
  t,
  tf,
} from "../i18n.js";

function byId<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
}

/** Localized label for the knowledge context a persona seeds. */
function personaContextLabel(persona: PersonaId): string {
  return t(`persona_${persona}_context`);
}

export interface SetupChoices {
  locale: Locale;
  persona: PersonaId;
  personaContextLabel: string;
}

export interface SetupWizardOptions {
  /** Run the first run and open the library. Rejects to show an error. */
  complete(choices: SetupChoices): Promise<void>;
  /** "I already use ZAM on a computer" — hand over to the pairing screen. */
  openPairing(): void;
}

export interface SetupWizard {
  /** Show page 1. Safe to call again; the wizard resets to the start. */
  restart(): void;
  /** Report a problem on the current page — e.g. a library that will not open. */
  setStatus(text: string, isError?: boolean): void;
}

export function initSetupWizard(options: SetupWizardOptions): SetupWizard {
  const pages = [
    byId<HTMLElement>("setup-page-welcome"),
    byId<HTMLElement>("setup-page-persona"),
    byId<HTMLElement>("setup-page-done"),
  ];
  const dots = [
    byId<HTMLElement>("setup-dot-1"),
    byId<HTMLElement>("setup-dot-2"),
    byId<HTMLElement>("setup-dot-3"),
  ];
  const languageGroup = byId<HTMLElement>("setup-language");
  const personaGroup = byId<HTMLElement>("setup-personas");
  const status = byId<HTMLParagraphElement>("setup-status");
  const finishButton = byId<HTMLButtonElement>("setup-finish");

  // Pre-selected from the system language, so a German learner never has to
  // touch this page at all.
  let locale: Locale = navigator.language.toLowerCase().startsWith("en")
    ? "en"
    : "de";
  let persona: PersonaId = DEFAULT_PERSONA_ID;
  let index = 0;

  function paint(): void {
    pages.forEach((page, i) => {
      page.hidden = i !== index;
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  function paintLanguage(): void {
    for (const button of languageGroup.querySelectorAll<HTMLButtonElement>(
      "button[data-locale]",
    )) {
      button.classList.toggle("active", button.dataset.locale === locale);
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.locale === locale),
      );
    }
  }

  function paintPersona(): void {
    for (const button of personaGroup.querySelectorAll<HTMLButtonElement>(
      "button[data-persona]",
    )) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.persona === persona),
      );
    }
  }

  languageGroup.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-locale]",
    );
    if (!button?.dataset.locale) return;
    locale = button.dataset.locale === "en" ? "en" : "de";
    setLocale(locale);
    applyStaticTranslations();
    paintLanguage();
    // Re-translating rewrites every label, including the persona cards a page
    // later, so nothing is left in the language the learner just left.
  });

  personaGroup.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-persona]",
    );
    const value = button?.dataset.persona;
    if (!value || !isPersonaId(value)) return;
    persona = value;
    paintPersona();
  });

  byId<HTMLButtonElement>("setup-next-welcome").addEventListener(
    "click",
    () => {
      index = 1;
      paint();
    },
  );

  byId<HTMLButtonElement>("setup-next-persona").addEventListener(
    "click",
    () => {
      index = 2;
      paint();
    },
  );

  byId<HTMLButtonElement>("setup-open-pairing").addEventListener(
    "click",
    () => {
      options.openPairing();
    },
  );

  finishButton.addEventListener("click", async () => {
    finishButton.disabled = true;
    status.textContent = t("local_setup_working");
    status.classList.remove("error");
    try {
      await options.complete({
        locale,
        persona,
        personaContextLabel: personaContextLabel(persona),
      });
    } catch (error) {
      status.textContent = tf("local_setup_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      status.classList.add("error");
    } finally {
      finishButton.disabled = false;
    }
  });

  paintLanguage();
  paintPersona();
  paint();

  return {
    restart() {
      index = 0;
      status.textContent = "";
      status.classList.remove("error");
      paint();
    },
    setStatus(text, isError = false) {
      status.textContent = text;
      status.classList.toggle("error", isError);
    },
  };
}
