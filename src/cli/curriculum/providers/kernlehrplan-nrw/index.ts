import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
} from "../../heading-extract.js";
import type { CurriculumProvider } from "../../types.js";
import { KERNLEHRPLAN_NRW_MANIFEST as MANIFEST } from "./manifest.js";

export const kernlehrplanNrwProvider: CurriculumProvider = {
  id: "kernlehrplan-nrw",
  country: "DE",
  countryLabel: "Deutschland",
  region: "NW",
  regionLabel: "Nordrhein-Westfalen",
  label: "Kernlehrplan (Nordrhein-Westfalen)",
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
        `Kernlehrplan NRW: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "kernlehrplan-nrw",
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
