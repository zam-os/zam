/**
 * Hands-free review for the mobile companion.
 *
 * The loop itself is shared with the desktop app and lives in the kernel
 * (`src/kernel/recall/voice-review.ts`, ADR 2026-07-31). This module stays as
 * the mobile-facing entry point so the companion keeps importing `./voice.js`,
 * and so a future mobile-only helper has an obvious home.
 */

export {
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  HandsFreeReviewController,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  parseSpokenRating,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  VOICE_ENGINE_PREFERENCES,
} from "../../src/kernel/recall/voice-review.js";
export type {
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
