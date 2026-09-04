/**
 * Hands-free review orchestration over an injected speech port (ADR
 * 2026-07-31).
 *
 * This module is deliberately platform-free: it drives the review loop and
 * decides *which* speech tier to use, but never touches a microphone, a
 * speaker, or the network. Every surface — the Android/iOS companion, the
 * macOS/Windows desktop app — supplies its own {@link VoicePort} and keeps the
 * loop identical. It first shipped inside the Android companion
 * (`mobile/src/voice.ts`) and moved here unchanged when the desktop app gained
 * voice mode in 0.24.0.
 */

import { decideAiTier } from "../ai/tier-preference.js";
import type { Rating } from "../scheduler/fsrs.js";

export type VoiceLocale = "de-DE" | "en-US";

export interface VoicePort {
  start(locale: VoiceLocale): Promise<void>;
  stop(): Promise<void>;
  speak(text: string, locale: VoiceLocale): Promise<void>;
  listen(locale: VoiceLocale): Promise<string>;
  playTone?(kind: "cue" | "reveal" | "rate"): Promise<void>;
}

export interface HandsFreeReviewOptions {
  mode?: "flash" | "answer_feedback" | "answer_variation";
  revealTimeoutMs?: number;
  ratingTimeoutMs?: number;
  promptNudgeMs?: number;
}

export interface VoiceReviewCard {
  question: string;
  expectedAnswer: string;
  revealed: boolean;
  draftAnswer: string;
}

/** Optional smart-evaluation result for the current answer. */
export interface VoiceEvaluationSpeech {
  /** Full TTS block (feedback + suggested rating + rating prompt). */
  speech: string;
  suggestedRating: Rating;
}

export interface VoiceReviewAdapter {
  currentCard(): VoiceReviewCard | null;
  captureAnswer(transcript: string): void;
  /**
   * May be asynchronous: the desktop reveal runs an LLM evaluation and
   * repaints the card, and speaking before it settles would read a stale one.
   * The loop awaits this before re-reading {@link currentCard}.
   */
  revealAnswer(): void | Promise<void>;
  /**
   * Optional intelligent evaluation after reveal. Return null to fall back
   * to reading the expected answer and self-rating.
   */
  evaluateAnswer?(): Promise<VoiceEvaluationSpeech | null>;
  rate(rating: Rating): Promise<boolean>;
  setStatus(message: string, isError?: boolean): void;
}

/* -------------------------------------------------------------------------- */
/* Engine tiering                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Where a single speech capability runs. `local` is the platform's own speech
 * stack (Apple Speech/AVSpeechSynthesizer, Windows WinRT, Android
 * SpeechRecognizer/TextToSpeech) — no third party, no per-use cost, quality and
 * availability bounded by the device. `cloud` is an entry in the capability
 * model registry with the `stt`/`tts` flag set.
 */
export type VoiceEngineTier = "local" | "cloud";

/** The two speech capabilities voice mode needs. */
export type VoiceCapability = "stt" | "tts";

/**
 * User preference, chosen in Settings (ADR 2026-07-31).
 *
 * The default is `device-first`: ZAM prefers the device because it keeps audio
 * out of third-party hands and costs nothing, but a learner whose device has no
 * usable recognizer should still get to review on a walk rather than not review
 * at all. `device-only` is the strict-privacy choice and accepts that voice mode
 * may be unavailable; `quality-first` accepts per-use cost and a third party in
 * exchange for better recognition and more natural voices.
 */
export type VoiceEnginePreference =
  | "device-only"
  | "device-first"
  | "quality-first";

export const DEFAULT_VOICE_ENGINE_PREFERENCE: VoiceEnginePreference =
  "device-first";

export const VOICE_ENGINE_PREFERENCES: readonly VoiceEnginePreference[] = [
  "device-only",
  "device-first",
  "quality-first",
];

export function isVoiceEnginePreference(
  value: unknown,
): value is VoiceEnginePreference {
  return (
    typeof value === "string" &&
    (VOICE_ENGINE_PREFERENCES as readonly string[]).includes(value)
  );
}

/** Which tiers can actually serve a capability right now. */
export interface VoiceTierAvailability {
  local: boolean;
  cloud: boolean;
}

export type VoiceAvailability = Record<VoiceCapability, VoiceTierAvailability>;

/**
 * Compose the availability matrix from the two sources every surface has: what
 * the device reports for the review language, and what the configuration
 * offers. Shared because getting the pairing wrong — reading device recognition
 * against cloud synthesis — produces a plan that looks valid and fails on the
 * first utterance.
 */
export function buildVoiceAvailability(
  device: { stt: boolean; tts: boolean },
  cloud: { stt: boolean; tts: boolean },
): VoiceAvailability {
  return {
    stt: { local: device.stt, cloud: cloud.stt },
    tts: { local: device.tts, cloud: cloud.tts },
  };
}

/**
 * Why a capability ended up where it did. Surfaces turn this into copy so a
 * learner is never silently switched to a paid, third-party path — the one
 * failure mode that would make the preference dishonest.
 */
export type VoiceEngineReason =
  | "preferred"
  | "fell-back-to-cloud"
  | "fell-back-to-local"
  | "unavailable-device-only"
  | "unavailable";

export interface VoiceEngineDecision {
  tier: VoiceEngineTier | null;
  reason: VoiceEngineReason;
}

export type VoiceEnginePlan = Record<VoiceCapability, VoiceEngineDecision>;

/**
 * Speech resolves through the shared primitive (ADR 2026-08-09c), which was
 * lifted out of this function unchanged when the same tier model was extended
 * to recall, card text, image import and embeddings. Two copies of "which tier
 * serves this, and what do we tell the learner" is exactly the drift that
 * would make one surface report a fallback the other performs silently.
 */
const decide = decideAiTier;

/**
 * Resolve the user's preference against what this device and configuration can
 * actually do. Speech-to-text and text-to-speech are resolved independently:
 * Linux has local synthesis but no local recognizer, and a learner with no
 * cloud model configured still gets local reading-aloud.
 */
export function resolveVoiceEnginePlan(
  preference: VoiceEnginePreference,
  availability: VoiceAvailability,
): VoiceEnginePlan {
  return {
    stt: decide(preference, availability.stt),
    tts: decide(preference, availability.tts),
  };
}

/**
 * Voice mode needs both halves of the loop: a card is read aloud and an answer
 * is spoken back. Either half missing means the session cannot run.
 */
export function isVoiceModeUsable(plan: VoiceEnginePlan): boolean {
  return plan.stt.tier !== null && plan.tts.tier !== null;
}

/** True when any capability leaves the device, i.e. a third party is involved. */
export function planLeavesDevice(plan: VoiceEnginePlan): boolean {
  return plan.stt.tier === "cloud" || plan.tts.tier === "cloud";
}

/* -------------------------------------------------------------------------- */
/* Review loop                                                                */
/* -------------------------------------------------------------------------- */

interface VoiceCopy {
  speakingQuestion: string;
  listeningAnswer: string;
  evaluating: string;
  answerPrefix: string;
  expectedPrefix: string;
  ratingPrompt: string;
  listeningRating: string;
  ratingRetry: string;
  flashPromptOnboarding: string;
  flashPromptNudge: string;
  flashListeningReveal: string;
  flashListeningRatingShort: string;
  flashRatingPrompt: string;
  sessionPaused: string;
}

const COPY: Record<VoiceLocale, VoiceCopy> = {
  "de-DE": {
    speakingQuestion: "Frage wird vorgelesen …",
    listeningAnswer: "Ich höre deine Antwort …",
    evaluating: "Antwort wird beurteilt …",
    answerPrefix: "Deine Antwort lautet:",
    expectedPrefix: "Die erwartete Antwort lautet:",
    ratingPrompt: "Bewerte dich mit Nochmal, Schwer, Gut oder Leicht.",
    listeningRating: "Sage Nochmal, Schwer, Gut oder Leicht …",
    ratingRetry:
      "Bewertung nicht erkannt. Bitte sage Nochmal, Schwer, Gut oder Leicht.",
    flashPromptOnboarding:
      "Sage weiter, um die Antwort zu hören, oder beenden.",
    flashPromptNudge: "Sage weiter oder beenden.",
    flashListeningReveal: "Warte auf Weiter …",
    flashListeningRatingShort: "Bewertung?",
    flashRatingPrompt: "Bewerte mit nochmal, schwer, gut oder einfach.",
    sessionPaused: "Sitzung pausiert.",
  },
  "en-US": {
    speakingQuestion: "Reading the question …",
    listeningAnswer: "Listening for your answer …",
    evaluating: "Evaluating your answer …",
    answerPrefix: "Your answer is:",
    expectedPrefix: "The expected answer is:",
    ratingPrompt: "Rate yourself with Again, Hard, Good, or Easy.",
    listeningRating: "Say Again, Hard, Good, or Easy …",
    ratingRetry:
      "I did not recognize the rating. Please say Again, Hard, Good, or Easy.",
    flashPromptOnboarding: "Say next to hear the answer, or stop.",
    flashPromptNudge: "Say next or stop.",
    flashListeningReveal: "Waiting for next …",
    flashListeningRatingShort: "Rating?",
    flashRatingPrompt: "Rate with again, hard, good, or easy.",
    sessionPaused: "Session paused.",
  },
};

const RATING_TERMS: Record<VoiceLocale, ReadonlyArray<[Rating, string[]]>> = {
  "de-DE": [
    [1, ["nochmal", "noch mal", "wiederholen", "eins", "1"]],
    [2, ["schwer", "zwei", "2"]],
    [3, ["gut", "drei", "3"]],
    [4, ["einfach", "leicht", "vier", "4"]],
  ],
  "en-US": [
    [1, ["again", "repeat", "one", "1"]],
    [2, ["hard", "two", "2"]],
    [3, ["good", "three", "3"]],
    [4, ["easy", "four", "4"]],
  ],
};

export type SpokenReviewAction = "reveal" | "stop";

const ACTION_TERMS: Record<
  VoiceLocale,
  ReadonlyArray<[SpokenReviewAction, string[]]>
> = {
  "de-DE": [
    [
      "stop",
      [
        "beenden",
        "stopp",
        "stop",
        "pause",
        "abbrechen",
        "schluss",
        "halt",
        "exit",
      ],
    ],
    [
      "reveal",
      [
        "weiter",
        "aufdecken",
        "losung",
        "lösung",
        "antwort",
        "zeige antwort",
        "zeigen",
        "weiß nicht",
        "weiss nicht",
        "next",
        "reveal",
      ],
    ],
  ],
  "en-US": [
    ["stop", ["stop", "pause", "exit", "quit", "end", "cancel"]],
    [
      "reveal",
      [
        "next",
        "reveal",
        "continue",
        "show",
        "show answer",
        "answer",
        "turn",
        "flip",
      ],
    ],
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

export function parseSpokenAction(
  transcript: string,
  locale: VoiceLocale,
): SpokenReviewAction | null {
  const normalized = ` ${normalizeSpeech(transcript)} `;
  for (const [action, terms] of ACTION_TERMS[locale]) {
    if (
      terms.some((term) => normalized.includes(` ${normalizeSpeech(term)} `))
    ) {
      return action;
    }
  }
  return null;
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

  async start(
    locale: VoiceLocale,
    options: HandsFreeReviewOptions = {},
  ): Promise<void> {
    if (this.running) return;
    const generation = ++this.generation;
    this.running = true;
    try {
      await this.port.start(locale);
      if (!this.isCurrent(generation)) {
        await this.port.stop().catch(() => undefined);
        return;
      }
      if (options.mode === "flash") {
        await this.runFlashLoop(generation, locale, options);
      } else {
        await this.runAnswerLoop(generation, locale);
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

  private async runAnswerLoop(
    generation: number,
    locale: VoiceLocale,
  ): Promise<void> {
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
        await this.adapter.revealAnswer();
        if (!this.isCurrent(generation)) break;
        card = this.adapter.currentCard();
        if (!card) break;
      }

      let smart: VoiceEvaluationSpeech | null = null;
      if (this.adapter.evaluateAnswer) {
        this.adapter.setStatus(COPY[locale].evaluating);
        try {
          smart = await this.adapter.evaluateAnswer();
        } catch {
          smart = null;
        }
        if (!this.isCurrent(generation)) break;
      }

      if (smart) {
        await this.port.speak(smart.speech, locale);
      } else {
        await this.port.speak(answerComparisonSpeech(card, locale), locale);
      }
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
  }

  private async runFlashLoop(
    generation: number,
    locale: VoiceLocale,
    options: HandsFreeReviewOptions,
  ): Promise<void> {
    const copy = COPY[locale];
    const revealTimeoutMs = options.revealTimeoutMs ?? 20_000;
    const ratingTimeoutMs = options.ratingTimeoutMs ?? 20_000;
    const nudgeTimeoutMs = options.promptNudgeMs ?? 10_000;
    let cardIndex = 0;

    while (this.isCurrent(generation)) {
      let card = this.adapter.currentCard();
      if (!card) break;

      if (!card.revealed) {
        this.adapter.setStatus(copy.speakingQuestion);
        await this.port.speak(card.question, locale);
        if (!this.isCurrent(generation)) break;

        if (cardIndex === 0) {
          this.adapter.setStatus(copy.flashPromptOnboarding);
          await this.port.speak(copy.flashPromptOnboarding, locale);
          if (!this.isCurrent(generation)) break;
        } else if (cardIndex === 1 || cardIndex === 2) {
          this.adapter.setStatus(copy.flashPromptNudge);
          await this.port.speak(copy.flashPromptNudge, locale);
          if (!this.isCurrent(generation)) break;
        } else if (this.port.playTone) {
          await this.port.playTone("cue").catch(() => undefined);
        }

        const questionEndTime = Date.now();
        let nudged = false;

        while (this.isCurrent(generation) && !card.revealed) {
          this.adapter.setStatus(copy.flashListeningReveal);
          const elapsed = Date.now() - questionEndTime;
          const remaining = revealTimeoutMs - elapsed;
          if (remaining <= 0) {
            // Auto-reveal after timeout
            break;
          }

          let waitLimit = remaining;
          if (cardIndex >= 3 && !nudged) {
            const timeToNudge = nudgeTimeoutMs - elapsed;
            if (timeToNudge > 0) {
              waitLimit = Math.min(remaining, timeToNudge);
            }
          }
          const waitsUntilReveal = waitLimit === remaining;

          const outcome = await this.listenWithTimeout(
            generation,
            locale,
            waitLimit,
          );
          if (outcome.kind === "cancelled") break;

          if (outcome.kind === "timeout") {
            const currentElapsed = Date.now() - questionEndTime;
            if (waitsUntilReveal || currentElapsed >= revealTimeoutMs) {
              break;
            }
            if (cardIndex >= 3 && !nudged && currentElapsed >= nudgeTimeoutMs) {
              nudged = true;
              await this.port.playTone?.("cue").catch(() => undefined);
            }
            continue;
          }

          const transcript = outcome.transcript.trim();
          if (!transcript) continue;

          const action = parseSpokenAction(transcript, locale);
          if (action === "stop") {
            this.adapter.setStatus(copy.sessionPaused);
            await this.port.speak(copy.sessionPaused, locale);
            return;
          }
          if (action === "reveal") {
            break;
          }
          const earlyRating = parseSpokenRating(transcript, locale);
          if (earlyRating !== null) {
            break;
          }
        }

        if (!this.isCurrent(generation)) break;
        await this.adapter.revealAnswer();
        if (!this.isCurrent(generation)) break;
        card = this.adapter.currentCard();
        if (!card) break;
      }

      if (this.port.playTone) {
        await this.port.playTone("reveal").catch(() => undefined);
      }
      await this.port.speak(card.expectedAnswer, locale);
      if (!this.isCurrent(generation)) break;

      if (cardIndex === 0) {
        this.adapter.setStatus(copy.flashRatingPrompt);
        await this.port.speak(copy.flashRatingPrompt, locale);
        if (!this.isCurrent(generation)) break;
      } else if (cardIndex === 1 || cardIndex === 2) {
        this.adapter.setStatus(copy.flashListeningRatingShort);
        await this.port.speak(copy.flashListeningRatingShort, locale);
        if (!this.isCurrent(generation)) break;
      } else if (this.port.playTone) {
        await this.port.playTone("cue").catch(() => undefined);
      }

      const answerEndTime = Date.now();
      let rating: Rating | null = null;
      let ratingNudged = false;

      while (this.isCurrent(generation) && rating === null) {
        this.adapter.setStatus(copy.listeningRating);
        const elapsed = Date.now() - answerEndTime;
        const remaining = ratingTimeoutMs - elapsed;
        if (remaining <= 0) {
          // Safe pause without penalizing unrated card
          this.adapter.setStatus(copy.sessionPaused);
          await this.port.speak(copy.sessionPaused, locale);
          return;
        }

        let waitLimit = remaining;
        if (cardIndex >= 3 && !ratingNudged) {
          const timeToNudge = nudgeTimeoutMs - elapsed;
          if (timeToNudge > 0) {
            waitLimit = Math.min(remaining, timeToNudge);
          }
        }
        const waitsUntilPause = waitLimit === remaining;

        const outcome = await this.listenWithTimeout(
          generation,
          locale,
          waitLimit,
        );
        if (outcome.kind === "cancelled") break;

        if (outcome.kind === "timeout") {
          const currentElapsed = Date.now() - answerEndTime;
          if (waitsUntilPause || currentElapsed >= ratingTimeoutMs) {
            this.adapter.setStatus(copy.sessionPaused);
            await this.port.speak(copy.sessionPaused, locale);
            return;
          }
          if (
            cardIndex >= 3 &&
            !ratingNudged &&
            currentElapsed >= nudgeTimeoutMs
          ) {
            ratingNudged = true;
            await this.port.playTone?.("cue").catch(() => undefined);
          }
          continue;
        }

        const transcript = outcome.transcript.trim();
        if (!transcript) continue;

        const action = parseSpokenAction(transcript, locale);
        if (action === "stop") {
          this.adapter.setStatus(copy.sessionPaused);
          await this.port.speak(copy.sessionPaused, locale);
          return;
        }

        rating = parseSpokenRating(transcript, locale);
        if (rating === null && this.isCurrent(generation)) {
          this.adapter.setStatus(copy.ratingRetry, true);
          await this.port.speak(copy.ratingRetry, locale);
        }
      }

      if (!this.isCurrent(generation) || rating === null) break;
      if (this.port.playTone) {
        await this.port.playTone("rate").catch(() => undefined);
      }
      const keepGoing = await this.adapter.rate(rating);
      cardIndex += 1;
      if (!keepGoing) break;
    }
  }

  /**
   * Race recognition against a prompt timeout without leaving an old native
   * recognizer alive when the loop starts the next interval. `stop()` is the
   * port's cancellation boundary; restarting it also restores the audio
   * session before a nudge, auto-reveal, or rating prompt is spoken.
   */
  private async listenWithTimeout(
    generation: number,
    locale: VoiceLocale,
    timeoutMs: number,
  ): Promise<
    | { kind: "transcript"; transcript: string }
    | { kind: "timeout" }
    | { kind: "cancelled" }
  > {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const listening = this.port.listen(locale).then(
      (transcript) => ({ kind: "transcript" as const, transcript }),
      (error: unknown) => ({ kind: "error" as const, error }),
    );
    const timeout = new Promise<{ kind: "timeout" }>((resolve) => {
      timerId = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
    });
    const outcome = await Promise.race([listening, timeout]);
    if (timerId !== undefined) clearTimeout(timerId);
    if (!this.isCurrent(generation)) return { kind: "cancelled" };
    if (outcome.kind === "error") throw outcome.error;
    if (outcome.kind === "transcript") return outcome;

    await this.port.stop();
    if (!this.isCurrent(generation)) return { kind: "cancelled" };
    await this.port.start(locale);
    if (!this.isCurrent(generation)) {
      await this.port.stop().catch(() => undefined);
      return { kind: "cancelled" };
    }
    return outcome;
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
