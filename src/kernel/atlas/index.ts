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
export type {
  AliasRow,
  BindingRow,
  DerivedPlacement,
  LensDefinition,
  LensRows,
  MemberRow,
  PathStep,
  RegionRow,
  UnitRow,
} from "./lenses.js";
export {
  cleanTopic,
  deriveSchule,
  deriveWeltwissen,
  ensureWorldLenses,
  findLensId,
  loadBindings,
  loadLensRows,
  loadUnits,
  OUTSIDE_CURRICULUM_KEY,
  prettify,
  SCHULE_LENS,
  slugSegment,
  UNSORTED_KEY,
  WELTWISSEN_LENS,
  weltwissenSeedRows,
} from "./lenses.js";
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
export type { LensKind, PlanetKind, ThreadKind, UnitKey } from "./types.js";
export { unitKeyFor } from "./types.js";
export type {
  SeedArea,
  SeedBereich,
  SeedSubject,
} from "./weltwissen-seed.js";
export {
  WELTWISSEN_SEED,
  WELTWISSEN_SUBJECT_ALIASES,
} from "./weltwissen-seed.js";
