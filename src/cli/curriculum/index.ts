export type { CurriculumBreadcrumb } from "./breadcrumb.js";
export {
  getLastCurriculumSelection,
  setLastCurriculumSelection,
} from "./breadcrumb.js";
export {
  CURRICULUM_PROVIDERS,
  type CurriculumRegionOption,
  getCurriculumProvider,
  getRawCurriculumProvider,
  listCurriculumCountries,
  listCurriculumRegions,
  RAW_CURRICULUM_PROVIDERS,
} from "./registry.js";
export {
  auditAllProviders,
  auditPath,
  auditProviderCoverage,
  type CoverageSummary,
  type CurriculumPath,
  collectCatalogPaths,
  formatCoverageHuman,
  gapKeys,
  type PathCoverageIssue,
  type PathCoverageResult,
  type ProviderCoverageReport,
  pathKey,
  selectionFromPath,
} from "./topic-coverage.js";
export type {
  CurriculumLevel,
  CurriculumProvider,
  CurriculumSelection,
  ResolvedSource,
  TaxonomyNode,
  TopicNode,
} from "./types.js";
