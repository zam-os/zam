/**
 * Knowledge atlas (ADR 2026-10-13): a zoomable map of what a learner knows.
 * Pure modules here are shared by the CLI, the Studio and Mobile.
 */

export type { Condition, ConditionCard } from "./condition.js";
export {
  CONDITION_BAND_RATIOS,
  cardCondition,
  DECAY_LAPSES,
  unitCondition,
} from "./condition.js";
export type { ConditionTexture, PaletteTheme, Rgb } from "./palette.js";
export {
  CONDITION_TEXTURE,
  conditionFill,
  hslToRgb,
  hueFor,
  hueKeyForDomain,
  rgbCss,
  SUBJECT_HUES,
} from "./palette.js";
