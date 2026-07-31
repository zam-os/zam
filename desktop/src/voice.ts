/**
 * Desktop voice mode (ADR 2026-07-31).
 *
 * The review loop itself is the shared kernel controller; this module only
 * supplies the desktop `VoicePort` (Tauri commands into the native engine) and
 * decides which tier serves each capability. Everything that touches the study
 * view is injected by `main.ts` through {@link DesktopVoiceHost}, so this file
 * stays out of the DOM and can be unit-tested without a WebView.
 */

import {
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  HandsFreeReviewController,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  type VoiceAvailability,
  type VoiceEnginePlan,
  type VoiceEnginePreference,
  type VoiceLocale,
  type VoicePort,
  type VoiceReviewCard,
} from "../../src/kernel/recall/voice-review.js";

/** Shape returned by the `voice_capabilities` Tauri command. */
export interface NativeVoiceCapabilities {
  sttLocal: boolean;
  ttsLocal: boolean;
  sttDetail: string | null;
  ttsDetail: string | null;
}

/** Everything voice mode needs from the study view, injected by main.ts. */
export interface DesktopVoiceHost {
  currentCard(): VoiceReviewCard | null;
  captureAnswer(transcript: string): void;
  revealAnswer(): Promise<void> | void;
  rate(rating: 1 | 2 | 3 | 4): Promise<boolean>;
  setStatus(message: string, isError?: boolean): void;
  /** Current UI locale tag, e.g. `"de"`. */
  locale(): string;
}

/**
 * Build the availability matrix from what the device reports and what the
 * model registry offers.
 *
 * The cloud half is a parameter rather than a probe because it comes from the
 * bridge (`voice-availability`, backed by `src/cli/llm/speech.ts`), which this
 * Tauri-free module cannot call itself. Passing `false` for both degrades to a
 * device-only build rather than failing.
 */
export function buildAvailability(
  native: NativeVoiceCapabilities,
  cloud: { stt: boolean; tts: boolean },
): VoiceAvailability {
  return {
    stt: { local: native.sttLocal, cloud: cloud.stt },
    tts: { local: native.ttsLocal, cloud: cloud.tts },
  };
}

/**
 * Explain, in one key, why voice mode cannot run. Callers translate the key;
 * the native `detail` strings are appended by main.ts because only it knows
 * whether the user is looking at Settings or the study view.
 */
export function unavailableReasonKey(plan: VoiceEnginePlan): string | null {
  if (isVoiceModeUsable(plan)) return null;
  const blocked = plan.stt.tier === null ? plan.stt : plan.tts;
  return blocked.reason === "unavailable-device-only"
    ? "voice_unavailable_device_only"
    : "voice_unavailable";
}

export function readStoredPreference(value: unknown): VoiceEnginePreference {
  return isVoiceEnginePreference(value) ? value : DEFAULT_VOICE_ENGINE_PREFERENCE;
}

/**
 * Build the desktop `VoicePort` over an injected Tauri `invoke`.
 *
 * The invoker is a parameter rather than a direct `@tauri-apps/api/core`
 * import so this module stays Tauri-free and unit-testable, like every other
 * non-`main` desktop module (see tests/desktop/module-boundaries.test.ts).
 */
export type TauriInvoke = <T>(command: string, args?: unknown) => Promise<T>;

export function createVoicePort(invoke: TauriInvoke): VoicePort {
  return {
    async start(locale: VoiceLocale): Promise<void> {
      await invoke("voice_start", { locale });
    },
    async stop(): Promise<void> {
      await invoke("voice_stop");
    },
    async speak(text: string, locale: VoiceLocale): Promise<void> {
      await invoke("voice_speak", { text, locale });
    },
    async listen(locale: VoiceLocale): Promise<string> {
      const result = await invoke<{ transcript: string }>("voice_listen", {
        locale,
      });
      return result.transcript;
    },
  };
}

/**
 * Ask the device what it can do locally **for one review language**.
 *
 * The locale is required, not incidental: Windows serves recognition from a
 * per-language speech pack and macOS from a per-language on-device model, so a
 * machine can be fully capable in English and have nothing for German. Callers
 * must re-probe when the app language changes — see `refreshVoiceAvailability`.
 */
export function probeNativeCapabilities(
  invoke: TauriInvoke,
  locale: VoiceLocale,
): Promise<NativeVoiceCapabilities> {
  return invoke<NativeVoiceCapabilities>("voice_capabilities", { locale });
}

/** What the tiered port needs from the bridge and the page to reach the cloud. */
export interface CloudSpeechDeps {
  transcribe(
    audioFile: string,
    mime: string,
    locale: string,
  ): Promise<string>;
  synthesize(
    text: string,
    locale: string,
  ): Promise<{ audioBase64: string; mime: string }>;
  play(audioBase64: string, mime: string): Promise<void>;
}

/**
 * A port that routes each capability to the tier the plan chose.
 *
 * The plan is read through a getter rather than captured, so changing the
 * preference in Settings takes effect on the next utterance without rebuilding
 * the controller mid-session.
 *
 * Session lifecycle (`start`/`stop`) always goes to the native engine even on
 * the cloud path: the microphone belongs to the app shell regardless of who
 * transcribes, and it is what guarantees `stop` actually releases it.
 */
export function createTieredVoicePort(
  plan: () => VoiceEnginePlan,
  invoke: TauriInvoke,
  cloud: CloudSpeechDeps,
): VoicePort {
  const native = createVoicePort(invoke);
  return {
    start: native.start,
    stop: native.stop,
    async speak(text: string, locale: VoiceLocale): Promise<void> {
      if (plan().tts.tier === "local") return native.speak(text, locale);
      const audio = await cloud.synthesize(text, locale);
      await cloud.play(audio.audioBase64, audio.mime);
    },
    async listen(locale: VoiceLocale): Promise<string> {
      if (plan().stt.tier === "local") return native.listen(locale);
      const capture = await invoke<{ path: string; mime: string }>(
        "voice_capture",
        { locale },
      );
      try {
        return await cloud.transcribe(capture.path, capture.mime, locale);
      } catch (error) {
        // The bridge deletes the recording once it reads it; if the call never
        // got that far, the answer must not be left lying in the temp dir.
        await invoke("voice_discard_capture", { path: capture.path }).catch(
          () => undefined,
        );
        throw error;
      }
    },
  };
}

/** Wire the shared controller to the study view. */
export function createVoiceController(
  host: DesktopVoiceHost,
  port: VoicePort,
): HandsFreeReviewController {
  return new HandsFreeReviewController(port, {
    currentCard: () => host.currentCard(),
    captureAnswer: (transcript) => host.captureAnswer(transcript),
    // Awaited by the loop: the desktop reveal runs the LLM evaluation and
    // repaints the card, and speaking before it settles reads a stale card.
    revealAnswer: () => host.revealAnswer(),
    rate: (rating) => host.rate(rating as 1 | 2 | 3 | 4),
    setStatus: (message, isError) => host.setStatus(message, isError),
  });
}

export {
  isVoiceModeUsable,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
};
export type { VoiceEnginePlan, VoiceEnginePreference, VoiceLocale };
