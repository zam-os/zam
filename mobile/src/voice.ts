/**
 * Hands-free review for the mobile companion.
 *
 * The loop itself is shared with the desktop app and lives in the kernel
 * (`src/kernel/recall/voice-review.ts`, ADR 2026-07-31). What stays here is
 * mobile-only: the tiered port that routes each capability to the device or to
 * a paired cloud endpoint, and the preference storage behind it.
 */

import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import {
  buildVoiceAvailability,
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  type VoiceAvailability,
  type VoiceEnginePlan,
  type VoiceEnginePreference,
  type VoiceLocale,
  type VoicePort,
} from "../../src/kernel/recall/voice-review.js";
import { isUsableSpeechEndpoint } from "./speech.js";

export type {
  HandsFreeReviewOptions,
  SpokenReviewAction,
  VoiceAvailability,
  VoiceCapability,
  VoiceEngineDecision,
  VoiceEnginePlan,
  VoiceEnginePreference,
  VoiceEngineReason,
  VoiceEngineTier,
  VoiceEvaluationSpeech,
  VoiceLocale,
  VoicePort,
  VoiceReviewAdapter,
  VoiceReviewCard,
  VoiceTierAvailability,
} from "../../src/kernel/recall/voice-review.js";
export {
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  HandsFreeReviewController,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  parseSpokenAction,
  parseSpokenRating,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  VOICE_ENGINE_PREFERENCES,
} from "../../src/kernel/recall/voice-review.js";

/** Machine-local, like every other device-shaped setting the companion keeps. */
export const VOICE_PREFERENCE_STORAGE_KEY = "zam.voice-engine.v1";

export function readStoredVoicePreference(
  value: string | null | undefined,
): VoiceEnginePreference {
  return isVoiceEnginePreference(value)
    ? value
    : DEFAULT_VOICE_ENGINE_PREFERENCE;
}

/** What the device itself reports for one review language. */
export interface MobileVoiceCapabilities {
  sttLocal: boolean;
  ttsLocal: boolean;
}

/**
 * Which speech capabilities the learner's configuration can serve on this
 * device.
 *
 * The endpoints come from the synced database (ADR 2026-07-23), so "none" means
 * no cloud speech model is set up for this learner — not that this device was
 * paired too early. A model added on the desktop shows up here after the next
 * sync, without re-pairing.
 */
export function cloudSpeechAvailability(
  endpoints:
    | {
        stt?: ZamPairLlmEndpoint | null;
        tts?: ZamPairLlmEndpoint | null;
      }
    | undefined,
): { stt: boolean; tts: boolean } {
  return {
    stt: isUsableSpeechEndpoint(endpoints?.stt),
    tts: isUsableSpeechEndpoint(endpoints?.tts),
  };
}

export function buildMobileAvailability(
  device: MobileVoiceCapabilities,
  cloud: { stt: boolean; tts: boolean },
): VoiceAvailability {
  return buildVoiceAvailability(
    { stt: device.sttLocal, tts: device.ttsLocal },
    cloud,
  );
}

/** The native half of the port: the app shell's own microphone and speaker. */
export interface MobileVoiceNative {
  start(locale: VoiceLocale): Promise<void>;
  stop(): Promise<void>;
  speak(text: string, locale: VoiceLocale): Promise<void>;
  listen(locale: VoiceLocale): Promise<string>;
  /** Record one answer without transcribing it, for the cloud recognizer. */
  capture(locale: VoiceLocale): Promise<{ audioBase64: string; mime: string }>;
  /** Play synthesized audio through the session's own audio route. */
  play(audioBase64: string, mime: string): Promise<void>;
}

/** The cloud half, injected so this module never touches the network itself. */
export interface MobileCloudSpeech {
  transcribe(
    audioBase64: string,
    mime: string,
    locale: VoiceLocale,
  ): Promise<string>;
  synthesize(
    text: string,
    locale: VoiceLocale,
  ): Promise<{ audioBase64: string; mime: string }>;
}

/**
 * A port that routes each capability to the tier the plan chose.
 *
 * The plan is read through a getter rather than captured, so changing the
 * preference in Settings takes effect on the next utterance instead of needing
 * the session restarted.
 *
 * Session lifecycle (`start`/`stop`) always goes to the native engine even on
 * the cloud path: the microphone belongs to the app shell regardless of who
 * transcribes, and on iOS it is what holds the audio session — and releases it
 * when the app leaves the foreground.
 *
 * Playback is native too, rather than an `<audio>` element in the WebView.
 * The synthesized answer has to come out of the same route the session
 * configured (ducking other audio, speaker rather than earpiece), and it has to
 * stop when the learner pauses voice mode.
 */
export function createMobileTieredVoicePort(
  plan: () => VoiceEnginePlan,
  native: MobileVoiceNative,
  cloud: MobileCloudSpeech,
  onDegraded: (capability: "stt" | "tts", message: string) => void = () => {},
): VoicePort {
  // Capabilities whose cloud endpoint failed in this session. A misconfigured
  // endpoint fails identically on every utterance, so retrying it per sentence
  // would only add a delay before the same message.
  const degraded = new Set<"stt" | "tts">();
  const useCloud = (capability: "stt" | "tts"): boolean =>
    plan()[capability].tier === "cloud" && !degraded.has(capability);

  /**
   * Continue on the device rather than ending the session. The point of voice
   * mode is that the review happens, and falling back *to the device* costs
   * the learner nothing — it is the `fell-back-to-local` outcome the plan
   * already allows, decided at call time instead of at resolution time.
   */
  const degrade = (capability: "stt" | "tts", error: unknown): void => {
    degraded.add(capability);
    onDegraded(
      capability,
      error instanceof Error ? error.message : String(error),
    );
  };

  return {
    start: (locale) => native.start(locale),
    stop: () => native.stop(),
    async speak(text: string, locale: VoiceLocale): Promise<void> {
      if (!useCloud("tts")) return native.speak(text, locale);
      try {
        const audio = await cloud.synthesize(text, locale);
        await native.play(audio.audioBase64, audio.mime);
      } catch (error) {
        degrade("tts", error);
        await native.speak(text, locale);
      }
    },
    async listen(locale: VoiceLocale): Promise<string> {
      if (!useCloud("stt")) return native.listen(locale);
      const capture = await native.capture(locale);
      try {
        return await cloud.transcribe(
          capture.audioBase64,
          capture.mime,
          locale,
        );
      } catch (error) {
        degrade("stt", error);
        // The recording went with the failed call, so the learner is asked once
        // more — better than losing the session over a bad endpoint.
        return native.listen(locale);
      }
    },
  };
}

/**
 * One key explaining why voice mode cannot run, for the surface to translate.
 *
 * `device-only` gets its own key because the fix is different in kind: the
 * learner has ruled out the cloud themselves, so the answer is either to
 * install the device's language data or to change the preference — never
 * "we will use the cloud instead", which would make the preference dishonest.
 */
export function voiceUnavailableKey(plan: VoiceEnginePlan): string | null {
  if (isVoiceModeUsable(plan)) return null;
  const blocked = plan.stt.tier === null ? plan.stt : plan.tts;
  return blocked.reason === "unavailable-device-only"
    ? "voice_unavailable_device_only"
    : "voice_unavailable";
}
