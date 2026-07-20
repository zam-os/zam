import type {
  CurriculumCatalogPath,
  CurriculumProvider,
  CurriculumSelection,
  ResolvedSource,
  SubTopicNode,
  TaxonomyNode,
  TopicNode,
} from "../../types.js";
import { LEHRPLANPLUS_BAYERN_MANIFEST as MANIFEST } from "./manifest.js";
import { describeBayernTrack } from "./track-descriptions.js";

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

interface ParsedSection {
  id: string;
  level: number;
  headerText: string;
  contentHtml: string;
}

function parseHtmlSections(html: string): ParsedSection[] {
  const chunks = html.split('<div id="thema_');
  const sections: ParsedSection[] = [];

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
    const headerText = headerMatch ? cleanHtmlText(headerMatch[1]).trim() : "";

    sections.push({
      id,
      level,
      headerText,
      contentHtml,
    });
  }

  return sections;
}

function resolveTopicLabel(topicId: string): string | null {
  for (const key of Object.keys(MANIFEST.topics)) {
    const list = MANIFEST.topics[key];
    const match = list.find(
      (t) => t.id === topicId || `${key}#${t.id}` === topicId,
    );
    if (match) {
      return match.label;
    }
  }
  return null;
}

function findTopicSectionHtml(
  sections: ParsedSection[],
  topicId: string,
): string | null {
  const label = resolveTopicLabel(topicId);
  if (!label) return null;

  const normalizedLabel = normalizeForComparison(label);
  const lvl1Index = sections.findIndex((s) => {
    if (s.level !== 1) return false;
    const normalizedHeader = normalizeForComparison(s.headerText);
    return normalizedHeader.includes(normalizedLabel);
  });

  if (lvl1Index === -1) return null;

  const collectedSections = [sections[lvl1Index]];
  for (let i = lvl1Index + 1; i < sections.length; i++) {
    if (sections[i].level === 1) {
      break;
    }
    collectedSections.push(sections[i]);
  }

  return collectedSections.map((s) => s.contentHtml).join("\n");
}

function isExcludedCompetenceItem(liAttrs: string, text: string): boolean {
  if (/plus_servicematerialien|plus_ueberg_ziele/i.test(liAttrs)) {
    return true;
  }
  const normalized = text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .trim();
  if (/^\+?\s*servicematerialien/.test(normalized)) return true;
  if (/^\+?\s*uebergreifende\s+ziele/.test(normalized)) return true;
  return false;
}

function extractCompetenceItems(topicHtml: string): string[] {
  const items: string[] = [];
  const abschBlocks =
    topicHtml.match(/<div class="thema_absch">[\s\S]*?<\/div>/gi) ?? [];

  for (const block of abschBlocks) {
    const liRegex = /<li([^>]*)>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null = liRegex.exec(block);
    while (match !== null) {
      const text = cleanHtmlText(match[2]).trim();
      if (text.length > 0 && !isExcludedCompetenceItem(match[1], text)) {
        items.push(text);
      }
      match = liRegex.exec(block);
    }
  }

  return items;
}

function truncateLabel(text: string, maxLen = 72): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

function listCapturedCatalogPaths(): CurriculumCatalogPath[] {
  const keys = new Set<string>([
    ...Object.keys(MANIFEST.topics),
    ...Object.keys(MANIFEST.contentUrls),
  ]);
  for (const [base, tracks] of Object.entries(MANIFEST.tracks)) {
    for (const track of tracks) {
      keys.add(`${base}|${track.id}`);
    }
  }

  return [...keys]
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }))
    .map((key) => {
      const [schoolType, grade, subject, track, ...rest] = key.split("|");
      if (!schoolType || !grade || !subject || rest.length > 0) {
        throw new Error(`Invalid LehrplanPLUS catalog path: ${key}`);
      }
      return {
        schoolType,
        grade,
        subject,
        ...(track ? { track } : {}),
      };
    });
}

export const lehrplanplusBayernProvider: CurriculumProvider = {
  id: "lehrplanplus-bayern",
  country: "DE",
  countryLabel: "Deutschland",
  region: "BY",
  regionLabel: "Bayern",
  label: "LehrplanPLUS (Bayern)",
  catalogStatus: "complete",

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
    return (MANIFEST.tracks[levelKey(schoolType, grade, subject)] ?? []).map(
      (track) => {
        const description = describeBayernTrack(schoolType, track);
        return description ? { ...track, description } : { ...track };
      },
    );
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

  listCatalogPaths(): CurriculumCatalogPath[] {
    return listCapturedCatalogPaths();
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
    const sections = parseHtmlSections(html);
    const results: Record<string, string> = {};

    for (const topicId of topicIds) {
      const topicHtml = findTopicSectionHtml(sections, topicId);
      if (topicHtml) {
        results[topicId] = cleanHtmlText(topicHtml);
      }
    }

    return results;
  },

  extractSubTopics(
    html: string,
    topicId: string,
  ): Array<SubTopicNode & { text: string }> {
    const sections = parseHtmlSections(html);
    const topicHtml = findTopicSectionHtml(sections, topicId);
    if (!topicHtml) return [];

    const header = sections.find((s) => {
      if (s.level !== 1) return false;
      const label = resolveTopicLabel(topicId);
      if (!label) return false;
      return normalizeForComparison(s.headerText).includes(
        normalizeForComparison(label),
      );
    });
    const headerText = header?.headerText ?? resolveTopicLabel(topicId) ?? "";

    const competenceItems = extractCompetenceItems(topicHtml);
    if (competenceItems.length === 0) return [];

    return competenceItems.map((item, index) => {
      const text = `${headerText}\n\n${item}`;
      return {
        id: `ku${index + 1}`,
        label: truncateLabel(item),
        textLength: text.length,
        text,
      };
    });
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
