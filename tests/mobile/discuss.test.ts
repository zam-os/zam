import { describe, expect, it, vi } from "vitest";
import type { DiscussionCardContext } from "../../desktop/src/discussion.js";
import {
  buildMobileDiscussionPrompt,
  discussMobileReview,
} from "../../mobile/src/discuss.js";
import type { EvaluationPorts } from "../../mobile/src/evaluate.js";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";

const card: DiscussionCardContext = {
  slug: "newton-2",
  concept: "F = m · a",
  domain: "Physik",
  bloomLevel: 2,
  question: "Wie lautet Newtons zweites Gesetz?",
  userAnswer: "Kraft ist Masse mal Beschleunigung.",
  feedback: "Richtig. Die Formel fehlt noch.",
  sourceLink: "https://example.com/newton",
};

function cloudEndpoint(): ZamPairLlmEndpoint {
  return {
    enabled: true,
    url: "https://api.example.com/v1",
    model: "recall-model",
    apiFlavor: "chat-completions",
    local: false,
    apiKey: "secret",
    label: "Cloud recall",
  };
}

describe("mobile post-reveal discussion", () => {
  it("resends the grounded card, evaluation, and full thread in the learner's language", () => {
    const prompt = buildMobileDiscussionPrompt(
      card,
      [
        { role: "user", content: "Warum ist die Masse wichtig?" },
        {
          role: "assistant",
          content: "Bei gleicher Kraft sinkt die Beschleunigung mit der Masse.",
        },
      ],
      "Kannst du ein Beispiel geben?",
      "de-DE",
    );

    expect(prompt).toContain("directly and concretely in German");
    expect(prompt).toContain(card.question);
    expect(prompt).toContain(card.concept);
    expect(prompt).toContain(card.feedback);
    expect(prompt).toContain("Learner: Warum ist die Masse wichtig?");
    expect(prompt).toContain("ZAM: Bei gleicher Kraft");
    expect(prompt).toContain("Kannst du ein Beispiel geben?");
  });

  it("uses the connected cloud recall model on iPadOS", async () => {
    const fetchText = vi.fn(async () =>
      Promise.resolve("Zum Beispiel beschleunigt ein leerer Wagen stärker."),
    );
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(async (): Promise<never> => {
        throw new Error("iPadOS must not call the Android model");
      }),
      fetchText,
    };

    const result = await discussMobileReview({
      card,
      turns: [],
      message: "Hast du ein Alltagsbeispiel?",
      locale: "de",
      endpoint: cloudEndpoint(),
      onDeviceAvailable: false,
      ports,
    });

    expect(result).toMatchObject({
      backend: "http",
      modelLabel: "Cloud recall",
      text: "Zum Beispiel beschleunigt ein leerer Wagen stärker.",
    });
    expect(ports.generateOnDevice).not.toHaveBeenCalled();
    const [url, init] = fetchText.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect(String(init.body)).toContain("Hast du ein Alltagsbeispiel?");
  });

  it("uses Gemini Nano first on Android and keeps the cloud as fallback", async () => {
    const fetchText = vi.fn(async () => "cloud reply");
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(async () => ({
        status: "available",
        available: true,
        downloadable: false,
      })),
      generateOnDevice: vi.fn(async () => ({
        text: "Weil dieselbe Kraft weniger Masse stärker beschleunigt.",
        backend: "gemini-nano",
      })),
      fetchText,
    };

    const result = await discussMobileReview({
      card,
      turns: [],
      message: "Warum ist ein leerer Wagen schneller?",
      locale: "de",
      endpoint: cloudEndpoint(),
      ports,
    });

    expect(result.backend).toBe("on-device");
    expect(result.text).toContain("weniger Masse");
    expect(ports.generateOnDevice).toHaveBeenCalledOnce();
    expect(fetchText).not.toHaveBeenCalled();
  });

  it("falls back to the cloud on Android when Gemini Nano cannot answer", async () => {
    const fetchText = vi.fn(async () => "Die Cloud erklärt den Zusammenhang.");
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(async () => ({
        status: "available",
        available: true,
        downloadable: false,
      })),
      generateOnDevice: vi.fn(async (): Promise<never> => {
        throw new Error("Gemini Nano generation failed");
      }),
      fetchText,
    };

    const result = await discussMobileReview({
      card,
      turns: [],
      message: "Kannst du das anders erklären?",
      locale: "de",
      endpoint: cloudEndpoint(),
      ports,
    });

    expect(result.backend).toBe("http");
    expect(result.text).toContain("Cloud");
    expect(result.fallbackReason).toMatch(/Gemini Nano generation failed/);
    expect(fetchText).toHaveBeenCalledOnce();
  });
});
