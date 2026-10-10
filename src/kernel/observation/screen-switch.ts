/**
 * Screen observation switch — ADR 2026-10-08 R8 (containment until removal).
 *
 * One machine-local switch, `observation.screen` in ~/.zam/config.json, sits
 * in front of every screen surface: live capture, a caller-provided image,
 * screen recording, vision analysis of a snapshot, and the read-back of
 * stored observer reports. It is off unless the learner set it to `true` by
 * hand. It is not a database setting, so `setting-set` cannot reach it, and
 * `llm.vision.enabled` does not open it.
 *
 * The switch does not stop an agent that has its own shell from capturing
 * the screen. It makes sure ZAM is not the tool that does it.
 */

import { isScreenObservationEnabled } from "../system/install-config.js";

export const SCREEN_OBSERVATION_OFF = "screen-observation-off" as const;

export const SCREEN_OBSERVATION_OFF_REASON =
  "Screen observation is off on this machine. ZAM does not capture, record, " +
  "analyze or return screen content while observation.screen in " +
  "~/.zam/config.json is not true, and no ZAM setting or tool can switch it on. " +
  "Rate screen work manually instead.";

/** The typed refusal every screen surface returns while the switch is off. */
export interface ScreenObservationRefusal {
  denied: true;
  denialReason: typeof SCREEN_OBSERVATION_OFF;
  reason: string;
}

export function screenObservationRefusal(): ScreenObservationRefusal {
  return {
    denied: true,
    denialReason: SCREEN_OBSERVATION_OFF,
    reason: SCREEN_OBSERVATION_OFF_REASON,
  };
}

/**
 * The refusal while the switch is off, `null` while it is on. Callers check
 * it before they capture, read or spawn anything.
 */
export function screenObservationGate(
  configPath?: string,
): ScreenObservationRefusal | null {
  return isScreenObservationEnabled(configPath)
    ? null
    : screenObservationRefusal();
}

/** Thrown where a refusal cannot be returned as data. */
export class ScreenObservationOffError extends Error {
  readonly denialReason = SCREEN_OBSERVATION_OFF;

  constructor() {
    super(SCREEN_OBSERVATION_OFF_REASON);
    this.name = "ScreenObservationOffError";
  }
}
