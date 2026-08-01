/**
 * Cloud speech tier for the mobile companions (ADR 2026-07-31).
 *
 * The desktop reaches its speech models through the bridge
 * (`src/cli/llm/speech.ts`), which reads the machine-local model registry. A
 * paired phone has neither: no bridge process and no registry, because the
 * registry lives in `~/.zam/config.json` and never travels with the synced
 * database. The endpoints therefore arrive in the pairing payload, and this
 * module calls them the same way the desktop does — OpenAI-shaped
 * `/audio/transcriptions` and `/audio/speech`.
 *
 * This is the one place a spoken answer leaves the device, and it runs only
 * when the resolved plan says `cloud` for that capability — never as a silent
 * fallback from the device tier.
 */

import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import { isCloudHttpEndpoint } from "./evaluate.js";

/** Injected so tests can stub the network. Defaults to global fetch. */
export type SpeechFetch = (url: string, init: RequestInit) => Promise<Response>;

/** A recorded answer is seconds of 16 kHz mono; anything near this is a bug. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const SPEECH_TIMEOUT_MS = 60_000;

/**
 * Whether the paired endpoint can serve speech from this device.
 *
 * Identical to the recall rule: enabled, non-loopback, not flagged local, and
 * OpenAI-shaped. `local` stays disqualifying even for a self-hosted
 * whisper.cpp — the flag means "runs on the desktop", and a phone on mobile
 * data cannot reach it. Pointing the registry entry at a routable address and
 * clearing the flag is what makes such a server pairable.
 */
export function isUsableSpeechEndpoint(
  endpoint: ZamPairLlmEndpoint | null | undefined,
): boolean {
  return isCloudHttpEndpoint(endpoint);
}

/**
 * Base URL for the audio routes.
 *
 * A learner who pasted the full chat URL gets the same endpoint as one who
 * pasted the API root; without this the audio call would land on
 * `/chat/completions/audio/speech`.
 */
function audioBase(url: string): string {
  return url.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
}

function authHeaders(endpoint: ZamPairLlmEndpoint): Record<string, string> {
  return endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {};
}

/** Endpoints reject full BCP-47 tags inconsistently; two letters always work. */
function languageHint(locale: string): string {
  return locale.slice(0, 2).toLowerCase();
}

export function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  // Chunked: String.fromCharCode(...bytes) blows the argument limit on the
  // hundreds of kilobytes a synthesized sentence comes back as.
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function describeFailure(
  response: Response,
  action: string,
): Promise<Error> {
  const detail = await response.text().catch(() => "");
  return new Error(
    `${action} failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
  );
}

/**
 * Abort rather than hang: a stalled upload on a walk would leave the loop
 * waiting with the microphone held and nothing on screen explaining it.
 */
async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SPEECH_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export interface CloudTranscriptionRequest {
  audioBase64: string;
  /** MIME type of the recording, e.g. `audio/wav`. */
  mime: string;
  locale: string;
}

/** POST the recording to `${url}/audio/transcriptions` as multipart form data. */
export async function transcribeViaCloud(
  endpoint: ZamPairLlmEndpoint,
  request: CloudTranscriptionRequest,
  fetchFn: SpeechFetch = fetch,
): Promise<string> {
  const audio = decodeBase64(request.audioBase64);
  if (audio.length === 0) throw new Error("The recording was empty.");
  if (audio.length > MAX_AUDIO_BYTES) {
    throw new Error(
      `The recording is ${Math.round(audio.length / 1024 / 1024)} MB, over the ${MAX_AUDIO_BYTES / 1024 / 1024} MB limit.`,
    );
  }

  const form = new FormData();
  form.append("model", endpoint.model);
  form.append("language", languageHint(request.locale));
  form.append(
    "file",
    new Blob([audio as unknown as BlobPart], { type: request.mime }),
    `answer.${request.mime.includes("mp4") ? "m4a" : "wav"}`,
  );

  const response = await withTimeout((signal) =>
    fetchFn(`${audioBase(endpoint.url)}/audio/transcriptions`, {
      method: "POST",
      headers: authHeaders(endpoint),
      body: form,
      signal,
    }),
  );
  if (!response.ok) throw await describeFailure(response, "Transcription");

  const payload = (await response.json()) as { text?: unknown };
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) throw new Error("The transcription came back empty.");
  return text;
}

export interface CloudSynthesisRequest {
  text: string;
  locale: string;
  /** Endpoint-specific voice id; falls back to the endpoint default. */
  voice?: string;
}

export interface CloudSynthesisResult {
  audioBase64: string;
  mime: string;
}

/** POST to `${url}/audio/speech`; the response body is the audio itself. */
export async function synthesizeViaCloud(
  endpoint: ZamPairLlmEndpoint,
  request: CloudSynthesisRequest,
  fetchFn: SpeechFetch = fetch,
): Promise<CloudSynthesisResult> {
  const text = request.text.trim();
  if (!text) throw new Error("There is nothing to read aloud.");

  const response = await withTimeout((signal) =>
    fetchFn(`${audioBase(endpoint.url)}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(endpoint),
      },
      body: JSON.stringify({
        model: endpoint.model,
        input: text,
        voice: request.voice ?? "alloy",
        // WAV keeps playback dependency-free: the native player on both
        // companions decodes it without a container the older shells might
        // not have. It matches what the desktop asks for.
        response_format: "wav",
      }),
      signal,
    }),
  );
  if (!response.ok) throw await describeFailure(response, "Speech synthesis");

  const audio = new Uint8Array(await response.arrayBuffer());
  if (audio.length === 0) throw new Error("The synthesized audio was empty.");
  return { audioBase64: encodeBase64(audio), mime: "audio/wav" };
}
