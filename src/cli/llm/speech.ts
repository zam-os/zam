/**
 * Cloud speech tier for voice mode (ADR 2026-07-31).
 *
 * The device tier is native code in each app shell; this is the other half:
 * OpenAI-shaped `/audio/transcriptions` and `/audio/speech` endpoints selected
 * from the unified capability registry via the `stt` and `tts` flags that
 * ADR 2026-07-12 reserved for exactly this.
 *
 * Nothing here is provider-specific. A hosted Whisper-turbo endpoint and a
 * self-hosted `whisper.cpp`/Speaches server are the same code path — the only
 * difference is the `local` flag on the registry entry, which is what lets a
 * self-hosted endpoint satisfy the `device-only` preference.
 *
 * Kernel boundary: this lives in the CLI layer because the kernel must never
 * import HTTP or LLM code.
 */

import type { Database } from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  fetchWithInteractiveTimeout,
  type ProviderConfig,
  resolveCapability,
} from "./client.js";

/** Audio long enough for one spoken review answer; guards a runaway upload. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const SPEECH_TIMEOUT_MS = 60_000;

export interface TranscriptionRequest {
  audioBase64: string;
  /** MIME type of the recording, e.g. `audio/wav`. */
  mime: string;
  /** BCP-47 tag passed as a decoding hint. */
  locale: string;
}

export interface TranscriptionResult {
  text: string;
  model: string;
  /** True when the endpoint that served this is marked local in the registry. */
  local: boolean;
}

export interface SynthesisRequest {
  text: string;
  locale: string;
  /** Endpoint-specific voice id; falls back to the endpoint default. */
  voice?: string;
}

export interface SynthesisResult {
  audioBase64: string;
  mime: string;
  model: string;
  local: boolean;
}

/**
 * Pick the first enabled, detected endpoint for a speech capability.
 *
 * Audio routes exist only in the OpenAI shape, so `anthropic-messages` entries
 * are skipped rather than called and failed — an Anthropic endpoint flagged
 * `stt` is a misconfiguration, not a usable fallback.
 */
export async function resolveSpeechEndpoint(
  db: Database,
  capability: "stt" | "tts",
): Promise<ProviderConfig | null> {
  const resolved = await resolveCapability(db, capability);
  if (!resolved?.enabled) return null;
  for (const endpoint of [
    resolved,
    ...(resolved.fallback ? [resolved.fallback] : []),
  ]) {
    if (endpoint.apiFlavor !== "chat-completions") continue;
    if (endpoint.transport === "agent") continue; // agents cannot carry audio
    return endpoint;
  }
  return null;
}

/** What the cloud tier can serve right now, for the surfaces' tier resolution. */
export async function getCloudSpeechAvailability(
  db: Database,
): Promise<{ stt: boolean; tts: boolean }> {
  const [stt, tts] = await Promise.all([
    resolveSpeechEndpoint(db, "stt"),
    resolveSpeechEndpoint(db, "tts"),
  ]);
  return { stt: stt !== null, tts: tts !== null };
}

function decodeAudio(audioBase64: string): ArrayBuffer {
  const bytes = Buffer.from(audioBase64, "base64");
  if (bytes.length === 0) throw new Error("The recording was empty.");
  if (bytes.length > MAX_AUDIO_BYTES) {
    throw new Error(
      `The recording is ${Math.round(bytes.length / 1024 / 1024)} MB, over the ${MAX_AUDIO_BYTES / 1024 / 1024} MB limit.`,
    );
  }
  // Copy into a plain ArrayBuffer: a Buffer view can sit on a pooled (or
  // shared) allocation, which `Blob` does not accept.
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function fileExtension(mime: string): string {
  const known: Record<string, string> = {
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
  };
  return known[mime.toLowerCase()] ?? "wav";
}

/** Two-letter language hint; endpoints reject full BCP-47 tags inconsistently. */
function languageHint(locale: string): string {
  return locale.slice(0, 2).toLowerCase();
}

async function describeFailure(res: Response, action: string): Promise<Error> {
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 500);
  } catch {
    detail = "";
  }
  return new Error(
    `${action} failed (${res.status} ${res.statusText})${detail ? `: ${detail}` : ""}`,
  );
}

/**
 * POST the recording to `${url}/audio/transcriptions` as multipart form data.
 *
 * This is the one place a spoken answer leaves the machine, and it only runs
 * when the resolved plan says `cloud` for `stt` — never as a silent fallback
 * from the device tier.
 */
export async function transcribeAudio(
  db: Database,
  request: TranscriptionRequest,
): Promise<TranscriptionResult> {
  const endpoint = await resolveSpeechEndpoint(db, "stt");
  if (!endpoint) {
    throw new Error(
      "No speech-to-text model is configured. Add one in Settings and enable its stt capability.",
    );
  }

  const audio = decodeAudio(request.audioBase64);
  const form = new FormData();
  form.append("model", endpoint.model);
  form.append("language", languageHint(request.locale));
  form.append(
    "file",
    new Blob([audio], { type: request.mime }),
    `answer.${fileExtension(request.mime)}`,
  );

  const res = await fetchWithInteractiveTimeout(
    `${endpoint.url}/audio/transcriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${endpoint.apiKey || DEFAULT_LLM_API_KEY}`,
      },
      body: form,
      timeoutMs: SPEECH_TIMEOUT_MS,
      locale: endpoint.locale,
    },
  );
  if (!res.ok) throw await describeFailure(res, "Transcription");

  const payload = (await res.json()) as { text?: unknown };
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) throw new Error("The transcription came back empty.");
  return { text, model: endpoint.model, local: endpoint.local };
}

/** POST to `${url}/audio/speech`; the response body is the audio itself. */
export async function synthesizeSpeech(
  db: Database,
  request: SynthesisRequest,
): Promise<SynthesisResult> {
  const endpoint = await resolveSpeechEndpoint(db, "tts");
  if (!endpoint) {
    throw new Error(
      "No text-to-speech model is configured. Add one in Settings and enable its tts capability.",
    );
  }
  const text = request.text.trim();
  if (!text) throw new Error("There is nothing to read aloud.");

  const res = await fetchWithInteractiveTimeout(
    `${endpoint.url}/audio/speech`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey || DEFAULT_LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: endpoint.model,
        input: text,
        voice: request.voice ?? "alloy",
        // WAV keeps playback dependency-free in the WebView and avoids a
        // container the older WKWebView/WebView2 builds might not decode.
        response_format: "wav",
      }),
      timeoutMs: SPEECH_TIMEOUT_MS,
      locale: endpoint.locale,
    },
  );
  if (!res.ok) throw await describeFailure(res, "Speech synthesis");

  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length === 0) throw new Error("The synthesized audio was empty.");
  return {
    audioBase64: audio.toString("base64"),
    mime: "audio/wav",
    model: endpoint.model,
    local: endpoint.local,
  };
}
