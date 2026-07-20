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
    // Basic extractor for NRW navigator pages (headings-based, tolerant).
    // The pages are mostly landing pages; detailed content often in linked
    // PDFs or Unterrichtsvorhaben. This pulls reasonable text chunks for the
    // LLM-based import step. Can be refined with more specific fixtures.
    const results: Record<string, string> = {};

    // Simple heading + paragraph scraper
    const headingMatches = Array.from(
      html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    );

    const sections: Array<{ header: string; content: string }> = [];
    for (const m of headingMatches) {
      const headerText = cleanHtmlText(m[1]).trim();
      // Take some following text until next heading (rough)
      const start = m.index! + m[0].length;
      const nextHeading = html.indexOf("<h", start);
      const rawContent =
        nextHeading > -1
          ? html.slice(start, nextHeading)
          : html.slice(start, start + 2000);
      const content = cleanHtmlText(rawContent).slice(0, 2000);
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

      // Try exact id match or label in header
      let section = sections.find(
        (s) =>
          normalizeForComparison(s.header).includes(normalizedLabel) ||
          s.header.toLowerCase().includes(shortId.toLowerCase()),
      );

      if (!section && sections.length > 0) {
        // Fallback: use first substantial section or the main content area
        section = sections.find((s) => s.content.length > 100) || sections[0];
      }

      if (section) {
        results[topicId] = `${label}\n\n${section.content}`.trim();
      } else {
        // Last resort: return the topic label so the pipeline has something
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
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
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
