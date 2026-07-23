import { describe, expect, it } from "vitest";
import {
  HandsFreeReviewController,
  parseSpokenRating,
  resolveVoiceLocale,
  type VoicePort,
  type VoiceReviewCard,
} from "../../mobile/src/voice.js";

describe("Android hands-free voice review", () => {
  it("resolves German and English speech locales", () => {
    expect(resolveVoiceLocale("de-AT")).toBe("de-DE");
    expect(resolveVoiceLocale("en-GB")).toBe("en-US");
    expect(resolveVoiceLocale(undefined)).toBe("de-DE");
  });

  it("maps localized rating words without matching word fragments", () => {
    expect(parseSpokenRating("Noch mal, bitte", "de-DE")).toBe(1);
    expect(parseSpokenRating("Das war ziemlich schwer", "de-DE")).toBe(2);
    expect(parseSpokenRating("gut", "de-DE")).toBe(3);
    expect(parseSpokenRating("Nummer vier", "de-DE")).toBe(4);
    expect(parseSpokenRating("good", "en-US")).toBe(3);
    expect(parseSpokenRating("goodbye", "en-US")).toBeNull();
  });

  it("runs prompt, answer, comparison, and rating as one continuous loop", async () => {
    const events: string[] = [];
    const heard = ["Kraft ist Masse mal Beschleunigung", "gut"];
    const card: VoiceReviewCard = {
      question: "Wie lautet Newtons zweites Gesetz?",
      expectedAnswer: "F gleich m mal a.",
      revealed: false,
      draftAnswer: "",
    };
    const port: VoicePort = {
      async start(locale) {
        events.push(`start:${locale}`);
      },
      async stop() {
        events.push("stop");
      },
      async speak(text) {
        events.push(`speak:${text}`);
      },
      async listen() {
        events.push("listen");
        return heard.shift() ?? "";
      },
    };
    const ratings: number[] = [];
    const controller = new HandsFreeReviewController(port, {
      currentCard: () => card,
      captureAnswer(transcript) {
        card.draftAnswer = transcript;
      },
      revealAnswer() {
        card.revealed = true;
      },
      async rate(rating) {
        ratings.push(rating);
        return false;
      },
      setStatus(message) {
        events.push(`status:${message}`);
      },
    });

    await controller.start("de-DE");

    expect(card.draftAnswer).toBe("Kraft ist Masse mal Beschleunigung");
    expect(ratings).toEqual([3]);
    expect(events[0]).toBe("start:de-DE");
    expect(events).toContain(`speak:${card.question}`);
    expect(events.some((event) => event.includes(card.expectedAnswer))).toBe(
      true,
    );
    expect(events.filter((event) => event === "listen")).toHaveLength(2);
    expect(events.at(-1)).toBe("stop");
    expect(controller.active).toBe(false);
  });

  it("speaks smart evaluation feedback when evaluateAnswer is provided", async () => {
    const spoken: string[] = [];
    const heard = ["F ist m mal a", "gut"];
    const card: VoiceReviewCard = {
      question: "Newton 2?",
      expectedAnswer: "F = m a",
      revealed: false,
      draftAnswer: "",
    };
    const controller = new HandsFreeReviewController(
      {
        async start() {},
        async stop() {},
        async speak(text) {
          spoken.push(text);
        },
        async listen() {
          return heard.shift() ?? "";
        },
      },
      {
        currentCard: () => card,
        captureAnswer(transcript) {
          card.draftAnswer = transcript;
        },
        revealAnswer() {
          card.revealed = true;
        },
        async evaluateAnswer() {
          return {
            speech: "Genau. Vorgeschlagene Bewertung: Gut.",
            suggestedRating: 3,
          };
        },
        async rate(rating) {
          expect(rating).toBe(3);
          return false;
        },
        setStatus() {},
      },
    );

    await controller.start("de-DE");

    expect(spoken).toContain("Genau. Vorgeschlagene Bewertung: Gut.");
    expect(spoken.some((text) => text.includes(card.expectedAnswer))).toBe(
      false,
    );
  });

  it("keeps tap fallback available by retrying only an unrecognized voice rating", async () => {
    const spoken: string[] = [];
    const heard = ["my answer", "perhaps", "easy"];
    const card: VoiceReviewCard = {
      question: "Question",
      expectedAnswer: "Expected",
      revealed: false,
      draftAnswer: "",
    };
    const controller = new HandsFreeReviewController(
      {
        async start() {},
        async stop() {},
        async speak(text) {
          spoken.push(text);
        },
        async listen() {
          return heard.shift() ?? "";
        },
      },
      {
        currentCard: () => card,
        captureAnswer(transcript) {
          card.draftAnswer = transcript;
        },
        revealAnswer() {
          card.revealed = true;
        },
        async rate(rating) {
          expect(rating).toBe(4);
          return false;
        },
        setStatus() {},
      },
    );

    await controller.start("en-US");

    expect(spoken.some((text) => text.includes("did not recognize"))).toBe(
      true,
    );
  });
});
