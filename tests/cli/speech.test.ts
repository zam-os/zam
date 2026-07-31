import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyCapabilities } from "../../src/cli/llm/capability-probe.js";

const entry = (model: string, apiFlavor: "chat-completions" | "anthropic-messages" = "chat-completions") => ({
  model,
  apiFlavor,
});

describe("speech capability detection", () => {
  it("recognizes transcription models without claiming they serve text", () => {
    for (const model of [
      "whisper-1",
      "whisper-large-v3-turbo",
      "gpt-4o-mini-transcribe",
      "distil-whisper-large-v3",
      "parakeet-tdt-0.6b",
    ]) {
      const detected = classifyCapabilities(entry(model), [model], true);
      expect(detected.stt, `${model} should be stt`).toBe(true);
      expect(detected.tts, `${model} should not be tts`).toBe(false);
      // Audio models answer on /audio/*, so offering them for recall coaching
      // would break the chat path.
      expect(detected.text, `${model} should not be text`).toBe(false);
    }
  });

  it("recognizes synthesis models without claiming they serve text", () => {
    for (const model of ["tts-1", "gpt-4o-mini-tts", "kokoro-82m", "piper-de"]) {
      const detected = classifyCapabilities(entry(model), [model], true);
      expect(detected.tts, `${model} should be tts`).toBe(true);
      expect(detected.stt, `${model} should not be stt`).toBe(false);
      expect(detected.text, `${model} should not be text`).toBe(false);
    }
  });

  it("leaves ordinary chat and embedding models untouched", () => {
    const chat = classifyCapabilities(entry("qwen3.5:4b"), ["qwen3.5:4b"], true);
    expect(chat.text).toBe(true);
    expect(chat.stt).toBe(false);
    expect(chat.tts).toBe(false);

    const embed = classifyCapabilities(
      entry("text-embedding-3-small"),
      ["text-embedding-3-small"],
      true,
    );
    expect(embed.embedding).toBe(true);
    expect(embed.stt).toBe(false);
    expect(embed.tts).toBe(false);
  });

  it("never claims audio routes on an Anthropic endpoint", () => {
    // The Messages API has no OpenAI-shaped audio routes, whatever the model
    // is called.
    const detected = classifyCapabilities(
      entry("claude-whisper-tts", "anthropic-messages"),
      [],
      false,
    );
    expect(detected.stt).toBe(false);
    expect(detected.tts).toBe(false);
    expect(detected.text).toBe(true);
  });
});

describe("cloud speech tier", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  /** Stub the registry so the tier can be exercised without a real endpoint. */
  async function loadSpeechWith(
    endpoints: Partial<Record<"stt" | "tts", unknown>>,
  ) {
    vi.doMock("../../src/cli/llm/client.js", async () => {
      const actual = await vi.importActual<
        typeof import("../../src/cli/llm/client.js")
      >("../../src/cli/llm/client.js");
      return {
        ...actual,
        resolveCapability: vi.fn(async (_db: unknown, capability: string) =>
          endpoints[capability as "stt" | "tts"] ?? null,
        ),
      };
    });
    return await import("../../src/cli/llm/speech.js");
  }

  const usable = (overrides: Record<string, unknown> = {}) => ({
    enabled: true,
    url: "https://speech.example/v1",
    model: "whisper-1",
    apiKey: "sk-test",
    apiFlavor: "chat-completions",
    locale: "de",
    source: "machine",
    local: false,
    ...overrides,
  });

  it("reports nothing available when no speech model is configured", async () => {
    const speech = await loadSpeechWith({});
    await expect(
      speech.getCloudSpeechAvailability({} as never),
    ).resolves.toEqual({ stt: false, tts: false });
  });

  it("ignores a disabled endpoint", async () => {
    const speech = await loadSpeechWith({ stt: usable({ enabled: false }) });
    expect(await speech.resolveSpeechEndpoint({} as never, "stt")).toBeNull();
  });

  it("refuses an Anthropic endpoint flagged for audio", async () => {
    // A misconfiguration, not a usable fallback: there is no Messages-API
    // audio route to call.
    const speech = await loadSpeechWith({
      stt: usable({ apiFlavor: "anthropic-messages" }),
    });
    expect(await speech.resolveSpeechEndpoint({} as never, "stt")).toBeNull();
  });

  it("refuses an agent-transport endpoint, which cannot carry audio", async () => {
    const speech = await loadSpeechWith({
      tts: usable({ transport: "agent", agentHarness: "claude-code" }),
    });
    expect(await speech.resolveSpeechEndpoint({} as never, "tts")).toBeNull();
  });

  it("explains itself rather than throwing an opaque error when unconfigured", async () => {
    const speech = await loadSpeechWith({});
    await expect(
      speech.transcribeAudio({} as never, {
        audioBase64: Buffer.from("audio").toString("base64"),
        mime: "audio/wav",
        locale: "de-DE",
      }),
    ).rejects.toThrow(/No speech-to-text model is configured/);
    await expect(
      speech.synthesizeSpeech({} as never, { text: "Hallo", locale: "de-DE" }),
    ).rejects.toThrow(/No text-to-speech model is configured/);
  });

  it("rejects an empty recording before spending a request", async () => {
    const speech = await loadSpeechWith({ stt: usable() });
    await expect(
      speech.transcribeAudio({} as never, {
        audioBase64: "",
        mime: "audio/wav",
        locale: "de-DE",
      }),
    ).rejects.toThrow(/empty/i);
  });

  it("posts the recording as multipart form data with a language hint", async () => {
    const speech = await loadSpeechWith({ stt: usable() });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ text: "  Berlin  " }), { status: 200 }),
      );

    const result = await speech.transcribeAudio({} as never, {
      audioBase64: Buffer.from("RIFFfake").toString("base64"),
      mime: "audio/wav",
      locale: "de-DE",
    });

    expect(result.text).toBe("Berlin");
    expect(result.model).toBe("whisper-1");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://speech.example/v1/audio/transcriptions");
    const body = init.body as FormData;
    expect(body.get("model")).toBe("whisper-1");
    // Endpoints reject full BCP-47 tags inconsistently; the hint is truncated.
    expect(body.get("language")).toBe("de");
    expect((body.get("file") as File).name).toBe("answer.wav");
  });

  it("treats an empty transcription as a failure, not a blank answer", async () => {
    const speech = await loadSpeechWith({ stt: usable() });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ text: "   " }), { status: 200 }),
    );
    await expect(
      speech.transcribeAudio({} as never, {
        audioBase64: Buffer.from("RIFFfake").toString("base64"),
        mime: "audio/wav",
        locale: "de-DE",
      }),
    ).rejects.toThrow(/came back empty/);
  });

  it("surfaces the endpoint's error body instead of a bare status", async () => {
    const speech = await loadSpeechWith({ stt: usable() });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("model_not_found", { status: 404, statusText: "Not Found" }),
    );
    await expect(
      speech.transcribeAudio({} as never, {
        audioBase64: Buffer.from("RIFFfake").toString("base64"),
        mime: "audio/wav",
        locale: "de-DE",
      }),
    ).rejects.toThrow(/404.*model_not_found/s);
  });

  it("returns synthesized audio as base64 for the WebView to play", async () => {
    const speech = await loadSpeechWith({ tts: usable({ model: "tts-1" }) });
    const audio = Buffer.from("RIFFsynthesized");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(audio, { status: 200 }));

    const result = await speech.synthesizeSpeech({} as never, {
      text: "Die Hauptstadt ist Berlin.",
      locale: "de-DE",
    });

    expect(Buffer.from(result.audioBase64, "base64").toString()).toBe(
      "RIFFsynthesized",
    );
    expect(result.mime).toBe("audio/wav");
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://speech.example/v1/audio/speech");
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "tts-1",
      input: "Die Hauptstadt ist Berlin.",
      response_format: "wav",
    });
  });

  it("refuses to synthesize nothing", async () => {
    const speech = await loadSpeechWith({ tts: usable() });
    await expect(
      speech.synthesizeSpeech({} as never, { text: "   ", locale: "de-DE" }),
    ).rejects.toThrow(/nothing to read aloud/i);
  });
});
