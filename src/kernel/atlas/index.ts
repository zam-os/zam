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
  subjectEmblemKey,
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
  deriveDomainLens,
  deriveLens,
  deriveSchule,
  deriveWeltwissen,
  ensureLensRow,
  ensureWorldLenses,
  findLensId,
  LAST_RANK,
  LEBEN_LENS,
  LENSES,
  lensRowsForRead,
  loadBindings,
  loadLensRows,
  loadUnits,
  OUTSIDE_CURRICULUM_KEY,
  PRODUKTE_LENS,
  prettify,
  SCHULE_LENS,
  slugSegment,
  subjectName,
  UNSORTED_KEY,
  UNTERNEHMEN_LENS,
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
export type {
  MovePlanetResult,
  PlacedBy,
  PlacedUnit,
  PlaceInfo,
} from "./place.js";
export {
  MAX_PLACE_NAME,
  missingLevels,
  moveUnitsToPlanet,
  placeUnits,
  resolvePlace,
  UNNAMED_LEVEL,
} from "./place.js";
export type { LensPlacements, PlanetErrorCode } from "./planets.js";
export {
  assertLensOnLibrary,
  dropOtherPlanetMembers,
  lensOnLibrary,
  lensPlacements,
  libraryLenses,
  loadUnitPlanets,
  ownPlanetOf,
  PLANET_LENSES,
  PlanetError,
  parseOwnPlanet,
  primaryLens,
  unitPlanetsFrom,
} from "./planets.js";
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
export type {
  LensKind,
  OwnPlanet,
  PlanetKind,
  ThreadKind,
  UnitKey,
} from "./types.js";
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
export {
  seedEmblem,
  seedEmblems,
  seedSubjectEmblem,
} from "./weltwissen-emblems.js";
export type {
  SeedArea,
  SeedBereich,
  SeedSubject,
} from "./weltwissen-seed.js";
export {
  WELTWISSEN_SEED,
  WELTWISSEN_SUBJECT_ALIASES,
} from "./weltwissen-seed.js";
