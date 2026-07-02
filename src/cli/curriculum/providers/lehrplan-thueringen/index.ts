import type { CurriculumProvider } from "../../types.js";
import { LEHRPLAN_THUERINGEN_MANIFEST as MANIFEST } from "./manifest.js";

export const lehrplanThueringenProvider: CurriculumProvider = {
  id: "lehrplan-thueringen",
  country: "DE",
  countryLabel: "Deutschland",
  region: "TH",
  regionLabel: "Thüringen",
  label: "Lehrplan (Thüringen)",

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
        `Lehrplan Thüringen: no resolvable source URL for topic "${topic.id}" (${topic.sourceRef}).`,
      );
    }
    return {
      provider: "lehrplan-thueringen",
      topicId: `${topic.sourceRef}#${topic.id}`,
      uri,
    };
  },

  extractTopics(html, topicIds) {
    const results: Record<string, string> = {};
    const headingMatches = Array.from(
      html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    );

    const sections: Array<{ header: string; content: string }> = [];
    for (const m of headingMatches) {
      const headerText = cleanHtmlText(m[1]).trim();
      const start = m.index! + m[0].length;
      const nextHeading = html.indexOf("<h", start);
      const rawContent =
        nextHeading > -1
          ? html.slice(start, nextHeading)
          : html.slice(start, start + 1500);
      const content = cleanHtmlText(rawContent).slice(0, 1500);
      if (headerText) sections.push({ header: headerText, content });
    }

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

      let section = sections.find(
        (s) =>
          normalizeForComparison(s.header).includes(normalizedLabel) ||
          s.header.toLowerCase().includes(shortId.toLowerCase()),
      );

      if (!section && sections.length > 0) {
        section = sections.find((s) => s.content.length > 80) || sections[0];
      }

      if (section) {
        results[topicId] = `${label}\n\n${section.content}`.trim();
      } else {
        results[topicId] = label;
      }
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
    .replace(/&#39;/g, "'");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[^a-z0-9]/gi, "");
}
