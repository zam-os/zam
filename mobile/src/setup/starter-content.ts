/**
 * The three cards a fresh library starts with.
 *
 * A first run that ends on "0 due, 0 cards" teaches nothing and demonstrates
 * nothing — neither to the learner, who has no idea what a review even looks
 * like, nor to an App Review reviewer deciding whether the app does anything
 * without an account (guideline 4.2).
 *
 * So they are not a demo. They are the three things a learner has to
 * understand to use spaced repetition at all, and they are learned the way
 * everything else in ZAM is learned. Once known they behave like any other
 * card: they can be edited, paused or deleted.
 *
 * Written by hand in both languages rather than machine-translated — these are
 * the first sentences anyone reads in ZAM.
 */

import type { MobileTokenDraft } from "../import.js";
import type { Locale } from "../i18n.js";

const DE: MobileTokenDraft[] = [
  {
    origin: "quick-capture",
    slug: "zam/aktives-erinnern",
    title: "Aktives Erinnern",
    concept:
      "Wissen bleibt hängen, wenn du es aus dem Gedächtnis holst — nicht, wenn du es noch einmal liest. Der Abruf selbst ist der Lernvorgang. Deshalb fragt ZAM zuerst und zeigt die Antwort erst danach.",
    question:
      "Warum bringt der Versuch, eine Antwort selbst zu geben, mehr als den Text noch einmal zu lesen?",
    domain: "zam",
    bloomLevel: 2,
  },
  {
    origin: "quick-capture",
    slug: "zam/verteiltes-wiederholen",
    title: "Verteiltes Wiederholen",
    concept:
      "ZAM legt jede Karte kurz vor dem Punkt wieder vor, an dem du sie vergessen würdest. Sitzt sie, wächst der Abstand bis zum nächsten Mal deutlich; sitzt sie nicht, schrumpft er. Wiederholen kostet dadurch mit der Zeit immer weniger Zeit.",
    question:
      "Wann legt ZAM eine Karte wieder vor, und was passiert mit dem Abstand, wenn du sie konntest?",
    domain: "zam",
    bloomLevel: 2,
  },
  {
    origin: "quick-capture",
    slug: "zam/ehrlich-bewerten",
    title: "Ehrlich bewerten",
    concept:
      "Deine Einschätzung nach jeder Karte steuert den ganzen Plan. Wer sich besser bewertet, als er war, bekommt zu große Abstände und vergisst genau die Karten, die er eigentlich üben müsste. Eine ehrliche Vier ist wertvoller als eine geschmeichelte.",
    question:
      "Was passiert mit deinem Lernplan, wenn du dich regelmäßig besser bewertest, als du warst?",
    domain: "zam",
    bloomLevel: 3,
  },
];

const EN: MobileTokenDraft[] = [
  {
    origin: "quick-capture",
    slug: "zam/active-recall",
    title: "Active recall",
    concept:
      "Knowledge sticks when you pull it out of memory, not when you read it again. The retrieval is the learning. That is why ZAM asks first and only then shows the answer.",
    question:
      "Why does attempting an answer yourself beat re-reading the material?",
    domain: "zam",
    bloomLevel: 2,
  },
  {
    origin: "quick-capture",
    slug: "zam/spaced-repetition",
    title: "Spaced repetition",
    concept:
      "ZAM brings a card back just before the point where you would forget it. Get it right and the gap to the next time grows sharply; get it wrong and it shrinks. Reviewing therefore costs less and less time as you go.",
    question:
      "When does ZAM bring a card back, and what happens to the gap when you knew it?",
    domain: "zam",
    bloomLevel: 2,
  },
  {
    origin: "quick-capture",
    slug: "zam/rating-honestly",
    title: "Rating honestly",
    concept:
      "Your rating after each card drives the whole schedule. Rate yourself better than you were and the gaps grow too wide, so you forget exactly the cards you most needed to practise. An honest low rating is worth more than a flattering one.",
    question:
      "What happens to your schedule if you routinely rate yourself better than you were?",
    domain: "zam",
    bloomLevel: 3,
  },
];

/** The starter cards for a locale. Never shared between locales: a learner
 * who switches language later keeps the cards they already learned. */
export function starterCards(locale: Locale): MobileTokenDraft[] {
  return (locale === "en" ? EN : DE).map((card) => ({ ...card }));
}
