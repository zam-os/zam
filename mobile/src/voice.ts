/** Hands-free Android review orchestration over an injected on-device voice port. */

import type { Rating } from "../../src/kernel/scheduler/fsrs.js";

export type VoiceLocale = "de-DE" | "en-US";

export interface VoicePort {
  start(locale: VoiceLocale): Promise<void>;
  stop(): Promise<void>;
  speak(text: string, locale: VoiceLocale): Promise<void>;
  listen(locale: VoiceLocale): Promise<string>;
}

export interface VoiceReviewCard {
  question: string;
  expectedAnswer: string;
  revealed: boolean;
  draftAnswer: string;
}

export interface VoiceReviewAdapter {
  currentCard(): VoiceReviewCard | null;
  captureAnswer(transcript: string): void;
  revealAnswer(): void;
  rate(rating: Rating): Promise<boolean>;
  setStatus(message: string, isError?: boolean): void;
}

interface VoiceCopy {
  speakingQuestion: string;
  listeningAnswer: string;
  answerPrefix: string;
  expectedPrefix: string;
  ratingPrompt: string;
  listeningRating: string;
  ratingRetry: string;
}

const COPY: Record<VoiceLocale, VoiceCopy> = {
  "de-DE": {
    speakingQuestion: "Frage wird vorgelesen …",
    listeningAnswer: "Ich höre deine Antwort …",
    answerPrefix: "Deine Antwort lautet:",
    expectedPrefix: "Die erwartete Antwort lautet:",
    ratingPrompt: "Bewerte dich mit Nochmal, Schwer, Gut oder Leicht.",
    listeningRating: "Sage Nochmal, Schwer, Gut oder Leicht …",
    ratingRetry:
      "Bewertung nicht erkannt. Bitte sage Nochmal, Schwer, Gut oder Leicht.",
  },
  "en-US": {
    speakingQuestion: "Reading the question …",
    listeningAnswer: "Listening for your answer …",
    answerPrefix: "Your answer is:",
    expectedPrefix: "The expected answer is:",
    ratingPrompt: "Rate yourself with Again, Hard, Good, or Easy.",
    listeningRating: "Say Again, Hard, Good, or Easy …",
    ratingRetry:
      "I did not recognize the rating. Please say Again, Hard, Good, or Easy.",
  },
};

const RATING_TERMS: Record<VoiceLocale, ReadonlyArray<[Rating, string[]]>> = {
  "de-DE": [
    [1, ["nochmal", "noch mal", "wiederholen", "eins", "1"]],
    [2, ["schwer", "zwei", "2"]],
    [3, ["gut", "drei", "3"]],
    [4, ["leicht", "vier", "4"]],
  ],
  "en-US": [
    [1, ["again", "repeat", "one", "1"]],
    [2, ["hard", "two", "2"]],
    [3, ["good", "three", "3"]],
    [4, ["easy", "four", "4"]],
  ],
};

function normalizeSpeech(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function resolveVoiceLocale(
  locale: string | null | undefined,
): VoiceLocale {
  return locale?.toLocaleLowerCase().startsWith("en") ? "en-US" : "de-DE";
}

export function parseSpokenRating(
  transcript: string,
  locale: VoiceLocale,
): Rating | null {
  const normalized = ` ${normalizeSpeech(transcript)} `;
  for (const [rating, terms] of RATING_TERMS[locale]) {
    if (
      terms.some((term) => normalized.includes(` ${normalizeSpeech(term)} `))
    ) {
      return rating;
    }
  }
  return null;
}

function answerComparisonSpeech(
  card: VoiceReviewCard,
  locale: VoiceLocale,
): string {
  const copy = COPY[locale];
  return [
    copy.answerPrefix,
    card.draftAnswer,
    copy.expectedPrefix,
    card.expectedAnswer,
    copy.ratingPrompt,
  ].join(" ");
}

export class HandsFreeReviewController {
  private generation = 0;
  private running = false;

  constructor(
    private readonly port: VoicePort,
    private readonly adapter: VoiceReviewAdapter,
  ) {}

  get active(): boolean {
    return this.running;
  }

  async start(locale: VoiceLocale): Promise<void> {
    if (this.running) return;
    const generation = ++this.generation;
    this.running = true;
    try {
      await this.port.start(locale);
      if (!this.isCurrent(generation)) {
        await this.port.stop().catch(() => undefined);
        return;
      }
      while (this.isCurrent(generation)) {
        let card = this.adapter.currentCard();
        if (!card) break;

        if (!card.revealed) {
          this.adapter.setStatus(COPY[locale].speakingQuestion);
          await this.port.speak(card.question, locale);
          if (!this.isCurrent(generation)) break;

          this.adapter.setStatus(COPY[locale].listeningAnswer);
          const transcript = (await this.port.listen(locale)).trim();
          if (!this.isCurrent(generation)) break;
          if (!transcript)
            throw new Error("Speech recognition returned no answer");
          this.adapter.captureAnswer(transcript);
          this.adapter.revealAnswer();
          card = this.adapter.currentCard();
          if (!card) break;
        }

        await this.port.speak(answerComparisonSpeech(card, locale), locale);
        if (!this.isCurrent(generation)) break;

        let rating: Rating | null = null;
        while (this.isCurrent(generation) && rating === null) {
          this.adapter.setStatus(COPY[locale].listeningRating);
          rating = parseSpokenRating(await this.port.listen(locale), locale);
          if (rating === null && this.isCurrent(generation)) {
            this.adapter.setStatus(COPY[locale].ratingRetry, true);
            await this.port.speak(COPY[locale].ratingRetry, locale);
          }
        }
        if (!this.isCurrent(generation) || rating === null) break;
        if (!(await this.adapter.rate(rating))) break;
      }
    } catch (error) {
      if (this.isCurrent(generation)) throw error;
    } finally {
      if (this.generation === generation) {
        this.running = false;
        await this.port.stop().catch(() => undefined);
      }
    }
  }

  async pause(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    this.generation += 1;
    await this.port.stop();
  }

  private isCurrent(generation: number): boolean {
    return this.running && this.generation === generation;
  }
}
