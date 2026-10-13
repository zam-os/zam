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
export type { Hex, Point } from "./hex.js";
export {
  DIRS,
  fromPixel,
  gosper,
  gosperOrderFor,
  hexDistance,
  hexKey,
  neighbours,
  ring,
  SQRT3,
  toPixel,
} from "./hex.js";
export type {
  IslandPlace,
  LandHex,
  LandState,
  PlanSettleInput,
  RegionInfo,
  SettlePlan,
} from "./land.js";
export {
  ISLAND_GAP,
  islandDrift,
  MAX_DRIFT_PER_SETTLE,
  octantOf,
  planSettle,
  reserveFor,
} from "./land.js";
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
  LAST_RANK,
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
export type {
  AtlasRegionView,
  AtlasUnitView,
  AtlasView,
  ReadAtlasOptions,
} from "./read.js";
export { readAtlas, regionTokenIds, snapshotForRead } from "./read.js";
export type { LensSnapshot, SettleResult } from "./settle.js";
export {
  applySettle,
  loadLandState,
  planForSnapshot,
  settleLens,
  snapshotLens,
} from "./settle.js";
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
