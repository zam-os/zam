/** Persistent, per-learner review workload controls (ADR 2026-08-09). */

import type { Database } from "../db/types.js";
import { getSetting, setSetting } from "../models/settings.js";

export type StudyWorkloadPreset = "balanced" | "exam" | "problems" | "custom";

export interface StudyWorkloadSettings {
  preset: StudyWorkloadPreset;
  maxNew: number;
  maxReviews: number;
  buryNewSiblings: boolean;
  buryReviewSiblings: boolean;
}

export interface UpdateStudyWorkloadInput {
  preset?: StudyWorkloadPreset;
  maxNew?: number;
  maxReviews?: number;
  buryNewSiblings?: boolean;
  buryReviewSiblings?: boolean;
}

export const STUDY_WORKLOAD_PRESETS: Readonly<
  Record<Exclude<StudyWorkloadPreset, "custom">, StudyWorkloadSettings>
> = {
  balanced: {
    preset: "balanced",
    maxNew: 10,
    maxReviews: 50,
    buryNewSiblings: true,
    buryReviewSiblings: true,
  },
  exam: {
    preset: "exam",
    maxNew: 40,
    maxReviews: 200,
    buryNewSiblings: false,
    buryReviewSiblings: false,
  },
  problems: {
    preset: "problems",
    maxNew: 5,
    maxReviews: 30,
    buryNewSiblings: true,
    buryReviewSiblings: true,
  },
};

export const DEFAULT_STUDY_WORKLOAD: StudyWorkloadSettings = {
  ...STUDY_WORKLOAD_PRESETS.balanced,
};

const MAX_NEW_LIMIT = 1_000;
const MAX_REVIEW_LIMIT = 10_000;

function settingKey(userId: string): string {
  return `study.workload.${encodeURIComponent(userId)}`;
}

function integerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

export function isStudyWorkloadPreset(
  value: unknown,
): value is StudyWorkloadPreset {
  return ["balanced", "exam", "problems", "custom"].includes(String(value));
}

function normalizeSettings(
  value: Partial<StudyWorkloadSettings>,
): StudyWorkloadSettings | null {
  if (
    !isStudyWorkloadPreset(value.preset) ||
    !integerInRange(value.maxNew, 0, MAX_NEW_LIMIT) ||
    !integerInRange(value.maxReviews, 1, MAX_REVIEW_LIMIT) ||
    typeof value.buryNewSiblings !== "boolean" ||
    typeof value.buryReviewSiblings !== "boolean"
  ) {
    return null;
  }
  return {
    preset: value.preset,
    maxNew: value.maxNew,
    maxReviews: value.maxReviews,
    buryNewSiblings: value.buryNewSiblings,
    buryReviewSiblings: value.buryReviewSiblings,
  };
}

/** Read a learner's settings, degrading safely to the balanced defaults. */
export async function getStudyWorkloadSettings(
  db: Database,
  userId: string,
): Promise<StudyWorkloadSettings> {
  if (!userId.trim()) throw new Error("Study workload requires a user ID");
  const raw = await getSetting(db, settingKey(userId));
  if (!raw) return { ...DEFAULT_STUDY_WORKLOAD };
  try {
    return (
      normalizeSettings(JSON.parse(raw) as Partial<StudyWorkloadSettings>) ?? {
        ...DEFAULT_STUDY_WORKLOAD,
      }
    );
  } catch {
    return { ...DEFAULT_STUDY_WORKLOAD };
  }
}

/** Persist a preset or custom workload after validating bounded limits. */
export async function setStudyWorkloadSettings(
  db: Database,
  userId: string,
  input: UpdateStudyWorkloadInput,
): Promise<StudyWorkloadSettings> {
  if (!userId.trim()) throw new Error("Study workload requires a user ID");
  const current = await getStudyWorkloadSettings(db, userId);
  const preset = input.preset ?? current.preset;
  if (!isStudyWorkloadPreset(preset)) {
    throw new Error(`Unsupported study workload preset: ${String(preset)}`);
  }

  const presetValues =
    preset === "custom" ? current : STUDY_WORKLOAD_PRESETS[preset];
  const hasCustomValues =
    input.maxNew !== undefined ||
    input.maxReviews !== undefined ||
    input.buryNewSiblings !== undefined ||
    input.buryReviewSiblings !== undefined;
  const candidate = normalizeSettings({
    ...presetValues,
    ...input,
    preset: hasCustomValues ? "custom" : preset,
  });
  if (!candidate) {
    throw new Error(
      `Study workload must use 0–${MAX_NEW_LIMIT} new cards and 1–${MAX_REVIEW_LIMIT} total cards`,
    );
  }
  await setSetting(db, settingKey(userId), JSON.stringify(candidate));
  return candidate;
}

/* -------------------------------------------------------------------------- */
/* Learning mode & voice timeout settings                                     */
/* -------------------------------------------------------------------------- */

export type StudyLearningMode =
  | "flash"
  | "answer_feedback"
  | "answer_variation";

export const STUDY_LEARNING_MODES: readonly StudyLearningMode[] = [
  "flash",
  "answer_feedback",
  "answer_variation",
];

export interface StudyLearningSettings {
  learningMode: StudyLearningMode;
  voiceRevealTimeoutSec: number;
  voiceRatingTimeoutSec: number;
}

export interface UpdateStudyLearningInput {
  learningMode?: StudyLearningMode;
  voiceRevealTimeoutSec?: number;
  voiceRatingTimeoutSec?: number;
}

export const DEFAULT_STUDY_LEARNING_SETTINGS: StudyLearningSettings = {
  learningMode: "flash",
  voiceRevealTimeoutSec: 20,
  voiceRatingTimeoutSec: 20,
};

export const MIN_VOICE_TIMEOUT_SEC = 5;
export const MAX_VOICE_TIMEOUT_SEC = 60;

function learningSettingKey(userId: string): string {
  return `study.learning.${encodeURIComponent(userId)}`;
}

export function isStudyLearningMode(
  value: unknown,
): value is StudyLearningMode {
  return (
    typeof value === "string" &&
    (STUDY_LEARNING_MODES as readonly string[]).includes(value)
  );
}

function normalizeLearningSettings(
  value: Partial<StudyLearningSettings>,
  fallbackLearningMode: StudyLearningMode = DEFAULT_STUDY_LEARNING_SETTINGS.learningMode,
): StudyLearningSettings | null {
  const learningMode = isStudyLearningMode(value.learningMode)
    ? value.learningMode
    : fallbackLearningMode;
  const voiceRevealTimeoutSec = integerInRange(
    value.voiceRevealTimeoutSec,
    MIN_VOICE_TIMEOUT_SEC,
    MAX_VOICE_TIMEOUT_SEC,
  )
    ? value.voiceRevealTimeoutSec
    : DEFAULT_STUDY_LEARNING_SETTINGS.voiceRevealTimeoutSec;
  const voiceRatingTimeoutSec = integerInRange(
    value.voiceRatingTimeoutSec,
    MIN_VOICE_TIMEOUT_SEC,
    MAX_VOICE_TIMEOUT_SEC,
  )
    ? value.voiceRatingTimeoutSec
    : DEFAULT_STUDY_LEARNING_SETTINGS.voiceRatingTimeoutSec;

  return {
    learningMode,
    voiceRevealTimeoutSec,
    voiceRatingTimeoutSec,
  };
}

/** Read a learner's mode and voice timeouts, defaulting to flash or caller fallback. */
export async function getStudyLearningSettings(
  db: Database,
  userId: string,
  options?: { fallbackLearningMode?: StudyLearningMode },
): Promise<StudyLearningSettings> {
  if (!userId.trim())
    throw new Error("Study learning settings require a user ID");
  const fallback =
    options?.fallbackLearningMode ??
    DEFAULT_STUDY_LEARNING_SETTINGS.learningMode;
  const raw = await getSetting(db, learningSettingKey(userId));
  if (!raw) {
    return {
      ...DEFAULT_STUDY_LEARNING_SETTINGS,
      learningMode: fallback,
    };
  }
  try {
    return (
      normalizeLearningSettings(
        JSON.parse(raw) as Partial<StudyLearningSettings>,
        fallback,
      ) ?? {
        ...DEFAULT_STUDY_LEARNING_SETTINGS,
        learningMode: fallback,
      }
    );
  } catch {
    return {
      ...DEFAULT_STUDY_LEARNING_SETTINGS,
      learningMode: fallback,
    };
  }
}

/** Persist a learner's chosen learning mode and voice timeouts. */
export async function setStudyLearningSettings(
  db: Database,
  userId: string,
  input: UpdateStudyLearningInput,
  options?: { fallbackLearningMode?: StudyLearningMode },
): Promise<StudyLearningSettings> {
  if (!userId.trim())
    throw new Error("Study learning settings require a user ID");
  const current = await getStudyLearningSettings(db, userId, options);
  const candidate = normalizeLearningSettings(
    {
      ...current,
      ...input,
    },
    current.learningMode,
  );
  if (!candidate) {
    throw new Error("Invalid study learning settings");
  }
  await setSetting(db, learningSettingKey(userId), JSON.stringify(candidate));
  return candidate;
}
