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
  weakestCondition,
} from "./condition.js";
export type { EmblemValidation } from "./emblem.js";
export {
  EMBLEM_MAX_CHARS,
  EMBLEM_VALIDATOR_VERSION,
  emblemDataUrl,
  GLYPH_MAX_CHARS,
  glyphEmblemSvg,
  validateEmblem,
  validateGlyph,
} from "./emblem.js";
export type {
  EmblemAuthor,
  EmblemErrorCode,
  EmblemScope,
  EmblemSource,
  EmblemSubject,
  ResolvedEmblem,
  RevalidateResult,
  SetEmblemInput,
  SetEmblemResult,
} from "./emblems.js";
export {
  clearPersonalEmblem,
  clearSharedEmblem,
  EmblemError,
  parseEmblemSubject,
  regionEmblemKey,
  resolveEmblem,
  resolveEmblems,
  revalidateEmblems,
  setEmblem,
  sharedEmblemKeys,
} from "./emblems.js";
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
export type {
  ConditionTexture,
  PaletteTheme,
  Rgb,
  Shade,
} from "./palette.js";
export {
  BASE_SHADE,
  CONDITION_TEXTURE,
  conditionFill,
  hslToRgb,
  hueFor,
  hueKeyForDomain,
  regionShade,
  rgbCss,
  SUBJECT_HUES,
} from "./palette.js";
export type { PlacedUnit, PlaceInfo } from "./place.js";
export {
  MAX_PLACE_NAME,
  missingLevels,
  placeUnits,
  resolvePlace,
  UNNAMED_LEVEL,
} from "./place.js";
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
export type { TakeResult } from "./take.js";
export { takeUnits } from "./take.js";
export type { LensKind, PlanetKind, ThreadKind, UnitKey } from "./types.js";
export { unitKeyFor } from "./types.js";
export type { EffectiveVariant, VariantChoice } from "./variants.js";
export {
  chooseVariant,
  chooseVariantIn,
  clearLibraryVariant,
  effectiveVariants,
  libraryVariantUnits,
  setLibraryVariant,
  undoVariant,
  unitTokenIds,
} from "./variants.js";
export type { SeedEmblem } from "./weltwissen-emblems.js";
export { seedEmblem, seedEmblems } from "./weltwissen-emblems.js";
export type {
  SeedArea,
  SeedBereich,
  SeedSubject,
} from "./weltwissen-seed.js";
export {
  WELTWISSEN_SEED,
  WELTWISSEN_SUBJECT_ALIASES,
} from "./weltwissen-seed.js";
