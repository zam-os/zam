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

  extractTopics(html: string, topicIds: string[]): Record<string, string> {
    const chunks = html.split('<div id="thema_');
    const sections: Array<{
      id: string;
      level: number;
      headerText: string;
      contentHtml: string;
    }> = [];

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      const quoteIdx = chunk.indexOf('"');
      if (quoteIdx === -1) continue;
      const id = chunk.slice(0, quoteIdx);

      const classStart = chunk.indexOf('class="');
      if (classStart === -1) continue;
      const classEnd = chunk.indexOf('"', classStart + 7);
      const classContent = chunk.slice(classStart + 7, classEnd);

      const lvlMatch = classContent.match(/headline_lvl(\d+)/);
      if (!lvlMatch) continue;
      const level = parseInt(lvlMatch[1], 10);

      const contentHtml = chunk.slice(classEnd + 1);

      const headerMatch = contentHtml.match(
        /<a[^>]*class="paragraph_toggle"[^>]*>([\s\S]*?)<\/a>/i,
      );
      const headerText = headerMatch
        ? cleanHtmlText(headerMatch[1]).trim()
        : "";

      sections.push({
        id,
        level,
        headerText,
        contentHtml,
      });
    }

    const results: Record<string, string> = {};

    for (const topicId of topicIds) {
      // Find the topic label in manifest
      let label = "";
      for (const key of Object.keys(MANIFEST.topics)) {
        const list = MANIFEST.topics[key];
        // topicId can be short like "lb1" or full like "realschule|9|deutsch#lb1"
        const match = list.find(
          (t) => t.id === topicId || `${key}#${t.id}` === topicId,
        );
        if (match) {
          label = match.label;
          break;
        }
      }

      if (!label) {
        continue;
      }

      const normalizedLabel = normalizeForComparison(label);
      const lvl1Index = sections.findIndex((s) => {
        if (s.level !== 1) return false;
        const normalizedHeader = normalizeForComparison(s.headerText);
        return normalizedHeader.includes(normalizedLabel);
      });

      if (lvl1Index === -1) {
        continue;
      }

      const collectedSections = [sections[lvl1Index]];
      for (let i = lvl1Index + 1; i < sections.length; i++) {
        if (sections[i].level === 1) {
          break;
        }
        collectedSections.push(sections[i]);
      }

      const fullHtml = collectedSections.map((s) => s.contentHtml).join("\n");
      results[topicId] = cleanHtmlText(fullHtml);
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
