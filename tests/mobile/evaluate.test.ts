import { describe, expect, it, vi } from "vitest";
import {
  type EvaluationPorts,
  evaluateMobileAnswer,
  evaluationSpeech,
  isCloudHttpEndpoint,
  resolveEvaluationBackend,
  selectCloudHttpEndpoint,
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

function cloudEndpoint2(
  overrides: Partial<ZamPairLlmEndpoint> = {},
): ZamPairLlmEndpoint {
  return { ...cloudEndpoint(), ...overrides };
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
  it("prefers on-device for every paired configuration", () => {
    expect(resolveEvaluationBackend(null)).toBe("on-device");
    expect(
      resolveEvaluationBackend({ ...localEndpoint(), enabled: false }),
    ).toBe("on-device");
    expect(resolveEvaluationBackend(localEndpoint())).toBe("on-device");
    expect(resolveEvaluationBackend(cloudEndpoint())).toBe("on-device");
  });

  it("detects usable cloud HTTP endpoints", () => {
    expect(isCloudHttpEndpoint(cloudEndpoint())).toBe(true);
    expect(isCloudHttpEndpoint(localEndpoint())).toBe(false);
    expect(isCloudHttpEndpoint(null)).toBe(false);
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

  it("evaluates via on-device Gemini Nano first", async () => {
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

  it("prefers on-device even when a cloud endpoint is paired", async () => {
    const fetchText = vi.fn(async () => goodJson);
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(async () => ({
        text: goodJson,
        backend: "gemini-nano",
      })),
      fetchText,
    };
    const result = await evaluateMobileAnswer({
      card,
      learnerAnswer: "F equals m a",
      endpoint: cloudEndpoint(),
      ports,
    });
    expect(result?.backend).toBe("on-device");
    expect(ports.generateOnDevice).toHaveBeenCalledOnce();
    expect(fetchText).not.toHaveBeenCalled();
  });

  it("falls back to HTTP when on-device fails and a cloud endpoint is paired", async () => {
    const fetchText = vi.fn(async () => goodJson);
    const ports: EvaluationPorts = {
      checkOnDeviceStatus: vi.fn(),
      generateOnDevice: vi.fn(async () => {
        throw new Error("Gemini Nano is unavailable on this device");
      }),
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

// Reported from a field test on an iPad 9 (2026-07-31): voice/eval fell back to
// self-rating even though a cloud model was configured on the paired desktop.
// iOS has no on-device evaluator, so the cloud endpoint is the only path — and
// it was unreachable whenever the desktop's primary recall model was local,
// because only the head of the paired chain was ever inspected.
describe("cloud fallback behind a local primary (iPad 9 report)", () => {
  it("uses a cloud endpoint carried in the paired fallback chain", async () => {
    const endpoint = localEndpoint({ fallback: cloudEndpoint() });
    const fetchText = vi.fn(async () => goodJson);

    const result = await evaluateMobileAnswer({
      card,
      learnerAnswer: "Kraft = Masse mal Beschleunigung",
      locale: "de",
      endpoint,
      ports: {
        // iOS: the on-device stub always rejects.
        checkOnDeviceStatus: async () => ({
          status: "unavailable",
          available: false,
          downloadable: false,
        }),
        generateOnDevice: async () => {
          throw new Error("voice mode is only available on Android");
        },
        fetchText,
      },
    });

    expect(result?.backend).toBe("http");
    expect(fetchText).toHaveBeenCalledTimes(1);
    expect(fetchText.mock.calls[0][0]).toBe(
      "https://api.example.com/v1/chat/completions",
    );
  });
});

describe("selectCloudHttpEndpoint", () => {
  it("returns the head when it is already a cloud target", () => {
    expect(selectCloudHttpEndpoint(cloudEndpoint())?.model).toBe(
      "cheap-recall",
    );
  });

  it("skips local and loopback links to reach the cloud one", () => {
    const chain = localEndpoint({
      url: "http://localhost:1234/v1",
      fallback: localEndpoint({
        url: "http://192.168.1.10:11434/v1",
        local: true,
        fallback: cloudEndpoint(),
      }),
    });
    expect(selectCloudHttpEndpoint(chain)?.model).toBe("cheap-recall");
  });

  it("returns null when the chain has no reachable cloud target", () => {
    expect(selectCloudHttpEndpoint(null)).toBeNull();
    expect(
      selectCloudHttpEndpoint(localEndpoint({ fallback: localEndpoint() })),
    ).toBeNull();
    // A disabled cloud entry is not a target.
    expect(
      selectCloudHttpEndpoint(cloudEndpoint2({ enabled: false })),
    ).toBeNull();
  });

  it("does not loop forever on a self-referential payload", () => {
    const cyclic = localEndpoint();
    (cyclic as { fallback?: ZamPairLlmEndpoint }).fallback = cyclic;
    expect(selectCloudHttpEndpoint(cyclic)).toBeNull();
  });
});

describe("evaluation on a platform without an on-device evaluator", () => {
  const iosPorts = (fetchText?: EvaluationPorts["fetchText"]) => ({
    checkOnDeviceStatus: async () => ({
      status: "unavailable",
      available: false,
      downloadable: false,
    }),
    generateOnDevice: async (): Promise<never> => {
      throw new Error("on-device evaluation is only available on Android");
    },
    ...(fetchText ? { fetchText } : {}),
  });

  it("does not attempt the on-device path at all", async () => {
    const generateOnDevice = vi.fn(async (): Promise<never> => {
      throw new Error("should not be called");
    });
    const result = await evaluateMobileAnswer({
      card,
      learnerAnswer: "F = m · a",
      locale: "de",
      endpoint: cloudEndpoint(),
      onDeviceAvailable: false,
      ports: { ...iosPorts(async () => goodJson), generateOnDevice },
    });
    expect(result?.backend).toBe("http");
    expect(generateOnDevice).not.toHaveBeenCalled();
  });

  it("says the paired models are unreachable rather than blaming the device", async () => {
    await expect(
      evaluateMobileAnswer({
        card,
        learnerAnswer: "F = m · a",
        locale: "de",
        endpoint: localEndpoint(),
        onDeviceAvailable: false,
        ports: iosPorts(),
      }),
    ).rejects.toThrow(/all local to the desktop/);
  });

  it("reports the backend that will actually run", () => {
    expect(resolveEvaluationBackend(cloudEndpoint(), false)).toBe("http");
    expect(resolveEvaluationBackend(localEndpoint(), false)).toBe("none");
    expect(
      resolveEvaluationBackend(localEndpoint({ fallback: cloudEndpoint() }), false),
    ).toBe("http");
    // Android is unchanged.
    expect(resolveEvaluationBackend(localEndpoint())).toBe("on-device");
  });
});
