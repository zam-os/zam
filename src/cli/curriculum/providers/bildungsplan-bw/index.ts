import type { CurriculumProvider } from "../../types.js";
import { BILDUNGSPLAN_BW_MANIFEST as MANIFEST } from "./manifest.js";

export const bildungsplanBwProvider: CurriculumProvider = {
  id: "bildungsplan-bw",
  country: "DE",
  countryLabel: "Deutschland",
  region: "BW",
  regionLabel: "Baden-Württemberg",
  label: "Bildungsplan (Baden-Württemberg)",

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
        `Bildungsplan Baden-Württemberg: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "bildungsplan-bw",
      topicId: `${topic.sourceRef}#${topic.id}`,
      uri,
    };
  },

  extractTopics(html, topicIds) {
    const chunks = html.split('<div class="bp-topic-block" id="bp_topic_');
    const sections: Array<{
      id: string;
      headerText: string;
      contentHtml: string;
    }> = [];

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      const quoteIdx = chunk.indexOf('"');
      if (quoteIdx === -1) continue;
      const id = chunk.slice(0, quoteIdx);

      const contentHtml = chunk.slice(quoteIdx + 1);
      const headerMatch = contentHtml.match(
        /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i,
      );
      const headerText = headerMatch
        ? cleanHtmlText(headerMatch[1]).trim()
        : "";

      sections.push({
        id,
        headerText,
        contentHtml,
      });
    }

    const results: Record<string, string> = {};

    for (const topicId of topicIds) {
      const hashIdx = topicId.indexOf("#");
      if (hashIdx === -1) continue;
      const key = topicId.substring(0, hashIdx);
      const shortId = topicId.substring(hashIdx + 1);

      const list = MANIFEST.topics[key] ?? [];
      const match = list.find((t) => t.id === shortId);
      if (!match) continue;

      const label = match.label;
      const normalizedLabel = normalizeForComparison(label);

      const sectionIndex = sections.findIndex((s) => {
        const normalizedHeader = normalizeForComparison(s.headerText);
        return normalizedHeader.includes(normalizedLabel) || s.id === shortId;
      });

      if (sectionIndex === -1) {
        continue;
      }

      results[topicId] = cleanHtmlText(sections[sectionIndex].contentHtml);
    }

    return results;
  },
};

function cleanHtmlText(html: string): string {
  let text = html.replace(
    /<(head|script|style|svg)[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n$1\n\n");
  text = text.replace(/<li[^>]*>/gi, "\n- ");
  text = text.replace(/<p[^>]*>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[^a-z0-9]/gi, "");
}
