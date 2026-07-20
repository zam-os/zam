import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
} from "../../heading-extract.js";
import type { CurriculumProvider } from "../../types.js";
import { RAHMENLEHRPLAN_BERLIN_BRANDENBURG_MANIFEST as MANIFEST } from "./manifest.js";

export const rahmenlehrplanBerlinBrandenburgProvider: CurriculumProvider = {
  id: "rahmenlehrplan-berlin-brandenburg",
  country: "DE",
  countryLabel: "Deutschland",
  region: "BE-BB",
  regionLabel: "Berlin / Brandenburg",
  label: "Rahmenlehrplan (Berlin-Brandenburg)",
  catalogStatus: "seed",

  listSchoolTypes() {
    return MANIFEST.schoolTypes;
  },

  listGrades(schoolType) {
    return (MANIFEST.grades[schoolType] || []).map((id) => ({
      id,
      label: `Klasse ${id}`,
    }));
  },

  listSubjects(schoolType, _grade) {
    return MANIFEST.subjects[schoolType] || [];
  },

  listTracks(schoolType, grade, subject) {
    const key = `${schoolType}|${grade}|${subject}`;
    return MANIFEST.tracks[key] || [];
  },

  listTopics(selection) {
    const key = selection.track
      ? `${selection.schoolType}|${selection.grade}|${selection.subject}|${selection.track}`
      : `${selection.schoolType}|${selection.grade}|${selection.subject}`;
    const list = MANIFEST.topics[key] || [];
    return list.map((t) => ({
      ...t,
      sourceRef: key,
    }));
  },

  resolveTopic(topic) {
    const uri = MANIFEST.contentUrls[topic.sourceRef];
    if (!uri) {
      throw new Error(
        `Rahmenlehrplan Berlin-Brandenburg: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "rahmenlehrplan-berlin-brandenburg",
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
