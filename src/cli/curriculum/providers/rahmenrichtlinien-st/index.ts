import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
} from "../../heading-extract.js";
import type { CurriculumProvider } from "../../types.js";
import { RAHMENRICHTLINIEN_ST_MANIFEST as MANIFEST } from "./manifest.js";

export const rahmenrichtlinienStProvider: CurriculumProvider = {
  id: "rahmenrichtlinien-st",
  country: "DE",
  countryLabel: "Deutschland",
  region: "ST",
  regionLabel: "Sachsen-Anhalt",
  label: "Rahmenrichtlinien (Sachsen-Anhalt)",
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
