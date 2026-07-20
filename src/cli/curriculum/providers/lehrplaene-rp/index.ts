import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
} from "../../heading-extract.js";
import type { CurriculumProvider } from "../../types.js";
import { LEHRPLAENE_RP_MANIFEST as MANIFEST } from "./manifest.js";

export const lehrplaeneRpProvider: CurriculumProvider = {
  id: "lehrplaene-rp",
  country: "DE",
  countryLabel: "Deutschland",
  region: "RP",
  regionLabel: "Rheinland-Pfalz",
  label: "Lehrpläne (Rheinland-Pfalz)",
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
        `Lehrpläne RP: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "lehrplaene-rp",
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
