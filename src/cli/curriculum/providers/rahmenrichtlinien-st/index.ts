import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
} from "../../heading-extract.js";
import type {
  CurriculumCatalogPath,
  CurriculumProvider,
  CurriculumSelection,
  TopicNode,
} from "../../types.js";
import { RAHMENRICHTLINIEN_ST_MANIFEST as MANIFEST } from "./manifest.js";

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

export const rahmenrichtlinienStProvider: CurriculumProvider = {
  id: "rahmenrichtlinien-st",
  country: "DE",
  countryLabel: "Deutschland",
  region: "ST",
  regionLabel: "Sachsen-Anhalt",
  label: "Rahmenrichtlinien (Sachsen-Anhalt)",
  catalogStatus: "complete",

  listSchoolTypes() {
    return MANIFEST.schoolTypes;
  },

  listGrades(schoolType) {
    return (MANIFEST.grades[schoolType] || []).map((id) => ({
      id,
      label: `Klasse ${id}`,
    }));
  },

  listSubjects(schoolType, grade) {
    const offered = new Set(
      MANIFEST.catalogPaths
        .filter((p) => p.schoolType === schoolType && p.grade === grade)
        .map((p) => p.subject),
    );
    return (MANIFEST.subjects[schoolType] || []).filter((s) =>
      offered.has(s.id),
    );
  },

  listTracks(schoolType, grade, subject) {
    return MANIFEST.tracks[levelKey(schoolType, grade, subject)] || [];
  },

  listTopics(selection: CurriculumSelection): TopicNode[] {
    const { schoolType, grade, subject, track } = selection;
    if (!schoolType || !grade || !subject) return [];
    const key = levelKey(schoolType, grade, subject, track);
    return (MANIFEST.topics[key] || []).map((t) => ({
      ...t,
      sourceRef: key,
    }));
  },

  listCatalogPaths(): CurriculumCatalogPath[] {
    return MANIFEST.catalogPaths.map((p) => ({ ...p }));
  },

  resolveTopic(topic) {
    const uri = MANIFEST.contentUrls[topic.sourceRef];
    if (!uri) {
      throw new Error(
        `Rahmenrichtlinien ST: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "rahmenrichtlinien-st",
      topicId: `${topic.sourceRef}#${topic.id}`,
      uri,
    };
  },

  extractTopics(html, topicIds) {
    return extractTopicsByHeadingStrict(html, topicIds, (topicId) =>
      labelFromManifestTopics(MANIFEST.topics, topicId),
    );
  },
};
