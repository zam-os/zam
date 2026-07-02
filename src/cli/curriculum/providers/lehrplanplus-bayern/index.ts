import type {
  CurriculumProvider,
  CurriculumSelection,
  ResolvedSource,
  TaxonomyNode,
  TopicNode,
} from "../../types.js";
import { LEHRPLANPLUS_BAYERN_MANIFEST as MANIFEST } from "./manifest.js";

function levelKey(
  schoolType: string,
  grade: string,
  subject: string,
  track?: string,
): string {
  return track
    ? `${schoolType}|${grade}|${subject}|${track}`
    : `${schoolType}|${grade}|${subject}`;
}

export const lehrplanplusBayernProvider: CurriculumProvider = {
  id: "lehrplanplus-bayern",
  country: "DE",
  countryLabel: "Deutschland",
  region: "BY",
  regionLabel: "Bayern",
  label: "LehrplanPLUS (Bayern)",

  listSchoolTypes(): TaxonomyNode[] {
    return MANIFEST.schoolTypes;
  },

  listGrades(schoolType: string): TaxonomyNode[] {
    return (MANIFEST.grades[schoolType] ?? []).map((grade) => ({
      id: grade,
      label: grade,
    }));
  },

  listSubjects(schoolType: string, _grade: string): TaxonomyNode[] {
    return MANIFEST.subjects[schoolType] ?? [];
  },

  listTracks(
    schoolType: string,
    grade: string,
    subject: string,
  ): TaxonomyNode[] {
    return MANIFEST.tracks[levelKey(schoolType, grade, subject)] ?? [];
  },

  listTopics(selection: CurriculumSelection): TopicNode[] {
    const { schoolType, grade, subject, track } = selection;
    if (!schoolType || !grade || !subject) return [];
    const key = levelKey(schoolType, grade, subject, track);
    return (MANIFEST.topics[key] ?? []).map((topic) => ({
      ...topic,
      sourceRef: key,
    }));
  },

  resolveTopic(topic: TopicNode): ResolvedSource {
    const uri = MANIFEST.contentUrls[topic.sourceRef];
    if (!uri) {
      throw new Error(
        `LehrplanPLUS Bayern: no resolvable source URL for topic "${topic.id}" ` +
          `(${topic.sourceRef}). The manifest only covers the combinations ` +
          `curated as of ${MANIFEST.capturedOn}.`,
      );
    }
    return {
      provider: "lehrplanplus-bayern",
      topicId: `${topic.sourceRef}#${topic.id}`,
      uri,
    };
  },
};
