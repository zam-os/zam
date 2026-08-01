import { describe, expect, it, vi } from "vitest";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import {
  decodeBase64,
  encodeBase64,
  isUsableSpeechEndpoint,
  synthesizeViaCloud,
  transcribeViaCloud,
} from "../../mobile/src/speech.js";

const endpoint: ZamPairLlmEndpoint = {
  enabled: true,
  url: "https://speech.example/v1",
  model: "whisper-large-v3-turbo",
  apiFlavor: "chat-completions",
  apiKey: "speech-secret",
  local: false,
  label: "Whisper",
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("mobile cloud speech tier", () => {
  it("uploads the recording and returns the transcript", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ text: "  Kraft ist Masse mal Beschleunigung " }));

    const text = await transcribeViaCloud(
      endpoint,
      { audioBase64: encodeBase64(new Uint8Array([1, 2, 3, 4])), mime: "audio/wav", locale: "de-DE" },
      fetchFn,
    );

    expect(text).toBe("Kraft ist Masse mal Beschleunigung");
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://speech.example/v1/audio/transcriptions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer speech-secret",
    );
    const form = init.body as FormData;
    expect(form.get("model")).toBe("whisper-large-v3-turbo");
    // Two letters, not the full BCP-47 tag: endpoints reject those unevenly.
    expect(form.get("language")).toBe("de");
  });

  it("reaches the audio route when the learner pasted the full chat URL", async () => {
    // Without this the call lands on /chat/completions/audio/transcriptions.
    const fetchFn = vi.fn(async () => jsonResponse({ text: "ok" }));

    await transcribeViaCloud(
      { ...endpoint, url: "https://speech.example/v1/chat/completions" },
      { audioBase64: encodeBase64(new Uint8Array([1])), mime: "audio/wav", locale: "en-US" },
      fetchFn,
    );

    expect(fetchFn.mock.calls[0]?.[0]).toBe(
      "https://speech.example/v1/audio/transcriptions",
    );
  });

  it("names the endpoint failure instead of returning silence", async () => {
    const fetchFn = vi.fn(
      async () => new Response("model not found", { status: 404 }),
    );

    await expect(
      transcribeViaCloud(
        endpoint,
        { audioBase64: encodeBase64(new Uint8Array([1])), mime: "audio/wav", locale: "de-DE" },
        fetchFn,
      ),
    ).rejects.toThrow(/Transcription failed \(404\).*model not found/s);
  });

  it("rejects an empty transcript rather than passing it to the loop", async () => {
    // An empty answer would be captured as the learner's response and rated.
    const fetchFn = vi.fn(async () => jsonResponse({ text: "   " }));

    await expect(
      transcribeViaCloud(
        endpoint,
        { audioBase64: encodeBase64(new Uint8Array([1])), mime: "audio/wav", locale: "de-DE" },
        fetchFn,
      ),
    ).rejects.toThrow(/came back empty/);
  });

  it("returns synthesized audio as base64 the native player can take", async () => {
    const audio = new Uint8Array([82, 73, 70, 70, 9, 9]);
    const fetchFn = vi.fn(async () => new Response(audio, { status: 200 }));

    const result = await synthesizeViaCloud(
      { ...endpoint, model: "tts-1-hd" },
      { text: "Die Antwort lautet", locale: "de-DE" },
      fetchFn,
    );

    expect(decodeBase64(result.audioBase64)).toEqual(audio);
    expect(result.mime).toBe("audio/wav");
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://speech.example/v1/audio/speech");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: "tts-1-hd",
      input: "Die Antwort lautet",
      response_format: "wav",
    });
  });

  it("does not call the endpoint for an empty utterance", async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1])));

    await expect(
      synthesizeViaCloud(endpoint, { text: "   ", locale: "de-DE" }, fetchFn),
    ).rejects.toThrow(/nothing to read aloud/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("treats desktop-local endpoints as unreachable from a paired device", () => {
    expect(isUsableSpeechEndpoint(endpoint)).toBe(true);
    expect(isUsableSpeechEndpoint({ ...endpoint, local: true })).toBe(false);
    expect(
      isUsableSpeechEndpoint({ ...endpoint, url: "http://127.0.0.1:8000/v1" }),
    ).toBe(false);
    expect(isUsableSpeechEndpoint({ ...endpoint, enabled: false })).toBe(false);
    expect(isUsableSpeechEndpoint(undefined)).toBe(false);
  });
});
