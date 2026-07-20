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
import { BILDUNGSPLAN_BREMEN_MANIFEST as MANIFEST } from "./manifest.js";

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

export const bildungsplanBremenProvider: CurriculumProvider = {
  id: "bildungsplan-bremen",
  country: "DE",
  countryLabel: "Deutschland",
  region: "HB",
  regionLabel: "Bremen",
  label: "Bildungsplan (Bremen)",
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
    // Grade-scoped: only subjects with a verified catalog leaf for this grade.
    const offered = new Set(
      MANIFEST.catalogPaths
        .filter((p) => p.schoolType === schoolType && p.grade === grade)
        .map((p) => p.subject),
    );
    const all = MANIFEST.subjects[schoolType] || [];
    return all.filter((s) => offered.has(s.id));
  },

  listTracks(schoolType, grade, subject) {
    const key = levelKey(schoolType, grade, subject);
    return MANIFEST.tracks[key] || [];
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
        `Bildungsplan Bremen: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "bildungsplan-bremen",
      topicId: `${topic.sourceRef}#${topic.id}`,
      uri,
    };
  },

  extractTopics(html, topicIds) {
    // Official sources are PDFs converted to extractable HTML (h2 + p) by the
    // bridge via pdftotext. Strict heading match — no landing-page fallback.
    return extractTopicsByHeadingStrict(html, topicIds, (topicId) =>
      labelFromManifestTopics(MANIFEST.topics, topicId),
    );
  },
};
