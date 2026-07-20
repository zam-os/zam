export type { CurriculumBreadcrumb } from "./breadcrumb.js";
export {
  getLastCurriculumSelection,
  setLastCurriculumSelection,
} from "./breadcrumb.js";
export {
  assessCurriculumText,
  type CurriculumReadinessReason,
  type CurriculumTextReadiness,
  curriculumTopicContentStatus,
  MIN_CURRICULUM_TOPIC_CHARS,
  MIN_CURRICULUM_TOPIC_SENTENCES,
  MIN_CURRICULUM_TOPIC_WORDS,
  withCurriculumContentStatus,
} from "./content-readiness.js";
export {
  cleanHtmlText,
  extractTopicsByHeadingStrict,
  type HeadingSection,
  labelFromManifestTopics,
  normalizeForComparison,
  parseHeadingSections,
  type TopicLabelResolver,
} from "./heading-extract.js";
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
  type CurriculumTopicAlternative,
  findCurriculumTopicAlternatives,
} from "./topic-alternatives.js";
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
  CurriculumCatalogPath,
  CurriculumCatalogStatus,
  CurriculumLevel,
  CurriculumProvider,
  CurriculumSelection,
  CurriculumTopicContentStatus,
  ResolvedSource,
  TaxonomyNode,
  TopicNode,
} from "./types.js";
