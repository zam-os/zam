/**
 * Curriculum Provider Plugin contract (ADR 2026-07-02-lehrplanplus-import-wizard).
 *
 * A curriculum provider turns one official school curriculum into a
 * navigable taxonomy: school type -> grade -> subject -> (optional track)
 * -> topic. The import wizard walks this level by level; `resolveTopic`
 * turns a selected topic into a source URL that flows into the existing
 * personal-source-import / personal-card-import-curriculum /
 * personal-source-confirm-import pipeline. No provider is hard-wired into
 * that pipeline or the kernel — this is the only contract they share.
 */

export interface TaxonomyNode {
  id: string;
  label: string;
}

export interface TopicNode extends TaxonomyNode {
  /** Groups sibling topics that resolve to the same source page. */
  sourceRef: string;
  /** Approximate teaching hours, when the curriculum specifies them. */
  hours?: number;
}

/** Finer unit inside a Lernbereich (e.g. a Kompetenzerwartung bullet). */
export interface SubTopicNode extends TaxonomyNode {
  textLength: number;
}

export interface ResolvedSource {
  provider: string;
  topicId: string;
  uri: string;
}

export interface CurriculumSelection {
  schoolType?: string;
  grade?: string;
  subject?: string;
  /** Some subjects split into tracks (e.g. Bavarian Realschule Wahlpflichtfächergruppen). */
  track?: string;
}

export type CurriculumLevel =
  | "schoolType"
  | "grade"
  | "subject"
  | "track"
  | "topic"
  | "subTopic";

export interface CurriculumProvider {
  id: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "DE". */
  country: string;
  countryLabel: string;
  /** State/region code, e.g. "BY" for Bayern. */
  region: string;
  regionLabel: string;
  label: string;

  listSchoolTypes(): TaxonomyNode[];
  listGrades(schoolType: string): TaxonomyNode[];
  listSubjects(schoolType: string, grade: string): TaxonomyNode[];
  /** Empty when the subject has one unified curriculum (no track step needed). */
  listTracks(
    schoolType: string,
    grade: string,
    subject: string,
  ): TaxonomyNode[];
  listTopics(selection: CurriculumSelection): TopicNode[];
  resolveTopic(topic: TopicNode): ResolvedSource;
  extractTopics?(html: string, topicIds: string[]): Record<string, string>;
  /**
   * Optional finer units inside a Lernbereich. When present, import should
   * chunk LLM calls per sub-topic instead of feeding the whole topic text.
   */
  extractSubTopics?(
    html: string,
    topicId: string,
  ): Array<SubTopicNode & { text: string }>;
}
