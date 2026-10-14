/**
 * *Nachlesen* (ADR 2026-10-14, Decision 4): where a world unit is read up,
 * opened in the system browser on the learner's click only.
 *
 * A unit from a web source opens that page. Any other world unit opens a
 * Wikipedia search that jumps straight to the article of that name
 * (`Special:Search?…&go=Go`), so it never ends on a dead link and nothing
 * is fetched beforehand. Firma and Privat units never reach this: the bridge
 * gives them no `readUp`.
 *
 * Pure, so the atlas, the study view and Lern-Karten share it.
 */

import type { ReadUpWire } from "../../src/bridge/protocol.js";

/** A Wikipedia language edition from a locale such as `de` or `pt-BR`. */
export function wikipediaLanguage(locale: string | null | undefined): string {
  const primary = (locale ?? "").trim().toLowerCase().split(/[-_]/)[0];
  return /^[a-z]{2,3}$/.test(primary) ? primary : "en";
}

/** The page reading up opens; the unit's language wins over the learner's. */
export function readUpUrl(readUp: ReadUpWire, locale: string): string {
  if (readUp.kind === "source") return readUp.url;
  const language = wikipediaLanguage(readUp.language ?? locale);
  const term = encodeURIComponent(readUp.term);
  return `https://${language}.wikipedia.org/wiki/Special:Search?search=${term}&go=Go`;
}
