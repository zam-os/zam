/**
 * English names of the supported locales, for naming the answer language inside
 * a prompt.
 *
 * Deliberately free of runtime imports — `./locale.js` reaches for
 * `node:child_process` to detect the OS language, which the mobile frontend
 * cannot bundle. The type import below is erased at compile time.
 */

import type { SupportedLocale } from "./locale.js";

export const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
};

/**
 * English name of the language to answer in, from any locale-ish string
 * ("de", "de-DE", "de_DE.UTF-8", a `navigator.language` value, null).
 *
 * Takes a loose string rather than `SupportedLocale` on purpose: the callers
 * are a database column, a pairing payload and a browser, none of which can
 * promise the narrow type. Unknown input falls back to English.
 */
export function languageName(locale: string | null | undefined): string {
  const base = locale?.trim().toLowerCase().split(/[_-]/)[0];
  if (!base) return LANGUAGE_NAMES.en;
  return LANGUAGE_NAMES[base as SupportedLocale] ?? LANGUAGE_NAMES.en;
}
