import { describe, expect, it, vi } from "vitest";
import {
  type EvaluationPorts,
  evaluateMobileAnswer,
  evaluationSpeech,
  resolveEvaluationBackend,
} from "../../mobile/src/evaluate.js";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";

const card = {
  slug: "newton-2",
  question: "Wie lautet Newtons zweites Gesetz?",
  concept: "F = m · a",
  bloomLevel: 2 as const,
  resolvedContext: null,
};

function localEndpoint(
  overrides: Partial<ZamPairLlmEndpoint> = {},
): ZamPairLlmEndpoint {
  return {
    enabled: true,
    url: "http://127.0.0.1:11434/v1",
    model: "placeholder",
    apiFlavor: "chat-completions",
    local: true,
    ...overrides,
  };
}

function cloudEndpoint(): ZamPairLlmEndpoint {
  return {
    enabled: true,
    url: "https://api.example.com/v1",
    model: "cheap-recall",
    apiFlavor: "chat-completions",
    local: false,
    apiKey: "secret",
    label: "Cloud recall",
  };
}

const goodJson = JSON.stringify({
  verdict: "correct",
  feedback: "Genau — Kraft ist Masse mal Beschleunigung.",
  referenceAnswer: "F = m · a",
  gaps: [],
  suggestedRating: 3,
});

describe("resolveEvaluationBackend", () => {
  it("defaults to on-device when no endpoint or disabled", () => {
    expect(resolveEvaluationBackend(null)).toBe("on-device");
    expect(
      resolveEvaluationBackend({ ...localEndpoint(), enabled: false }),
    ).toBe("on-device");
  });

  it("uses on-device for local or loopback endpoints", () => {
    expect(resolveEvaluationBackend(localEndpoint())).toBe("on-device");
    expect(
      resolveEvaluationBackend(
        localEndpoint({
          local: false,
          url: "http://localhost:8080/v1",
        }),
      ),
    ).toBe("on-device");
  });

  it("uses HTTP for non-local remote endpoints", () => {
    expect(resolveEvaluationBackend(cloudEndpoint())).toBe("http");
  });
});

describe("evaluateMobileAnswer", () => {
  it("returns null for blank answers", async () => {
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(),
    };
    await expect(
      evaluateMobileAnswer({
        card,
        learnerAnswer: "  ",
        endpoint: localEndpoint(),
        ports,
      }),
    ).resolves.toBeNull();
    expect(ports.generateOnDevice).not.toHaveBeenCalled();
  });

  it("evaluates via on-device Gemini Nano for local endpoints", async () => {
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(async () => ({
        text: goodJson,
        backend: "gemini-nano",
      })),
    };
    const result = await evaluateMobileAnswer({
      card,
      learnerAnswer: "Kraft ist Masse mal Beschleunigung",
      endpoint: localEndpoint(),
      ports,
    });
    expect(result?.backend).toBe("on-device");
    expect(result?.evaluation.suggestedRating).toBe(3);
    expect(result?.evaluation.verdict).toBe("correct");
    expect(ports.generateOnDevice).toHaveBeenCalledOnce();
    const prompt = vi.mocked(ports.generateOnDevice).mock.calls[0][0];
    expect(prompt).toContain(card.question);
    expect(prompt).toContain("Kraft ist Masse mal Beschleunigung");
  });

  it("evaluates via HTTP for cloud endpoints", async () => {
    const fetchText = vi.fn(async () => goodJson);
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(),
      fetchText,
    };
    const result = await evaluateMobileAnswer({
      card,
      learnerAnswer: "F equals m a",
      endpoint: cloudEndpoint(),
      ports,
    });
    expect(result?.backend).toBe("http");
    expect(result?.modelLabel).toBe("Cloud recall");
    expect(ports.generateOnDevice).not.toHaveBeenCalled();
    expect(fetchText).toHaveBeenCalledOnce();
    const [url, init] = fetchText.mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret",
    );
  });

  it("surfaces on-device failures so the UI can fall back to self-rate", async () => {
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(async () => {
        throw new Error("Gemini Nano is unavailable on this device");
      }),
    };
    await expect(
      evaluateMobileAnswer({
        card,
        learnerAnswer: "keine Ahnung",
        endpoint: localEndpoint(),
        ports,
      }),
    ).rejects.toThrow(/unavailable/i);
  });
});

describe("evaluationSpeech", () => {
  it("speaks feedback and the suggested rating in German", () => {
    const speech = evaluationSpeech(
      {
        verdict: "partial",
        feedback: "Fast — die Richtung fehlt noch.",
        referenceAnswer: "F = m · a",
        gaps: ["Richtung"],
        suggestedRating: 2,
      },
      "de",
    );
    expect(speech).toContain("Fast — die Richtung fehlt noch.");
    expect(speech).toContain("Schwer");
    expect(speech).toContain("Nochmal");
  });
});
