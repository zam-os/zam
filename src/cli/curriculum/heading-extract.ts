/**
 * Strict heading-based curriculum text extraction (Epic #132 Phase Import).
 *
 * Matches each requested topic to a heading in the source document by label
 * or short id. Never falls back to an unrelated section or the bare manifest
 * label — a missing match is simply omitted so callers can hard-fail.
 */

export interface HeadingSection {
  header: string;
  content: string;
}

export function cleanHtmlText(html: string): string {
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

export function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[^a-z0-9]/gi, "");
}

/** Parse h1–h6 sections from an HTML document (header + following content). */
export function parseHeadingSections(
  html: string,
  maxContentChars = 2000,
): HeadingSection[] {
  const headingMatches = Array.from(
    html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
  );
  const sections: HeadingSection[] = [];
  for (const m of headingMatches) {
    const headerText = cleanHtmlText(m[1]).trim();
    const start = (m.index ?? 0) + m[0].length;
    const nextHeading = html.indexOf("<h", start);
    const rawContent =
      nextHeading > -1
        ? html.slice(start, nextHeading)
        : html.slice(start, start + maxContentChars);
    const content = cleanHtmlText(rawContent).slice(0, maxContentChars);
    if (headerText) sections.push({ header: headerText, content });
  }
  return sections;
}

/**
 * Resolve a full topic id (`path#shortId`) to a display label via the
 * provider manifest, or null when the id is unknown.
 */
export type TopicLabelResolver = (topicId: string) => string | null;

/**
 * Extract per-topic text for selected topic ids.
 *
 * Only topics with a resolvable label AND a matching heading in `html` are
 * returned. Unmatched ids are omitted (never label-only, never first section).
 */
export function extractTopicsByHeadingStrict(
  html: string,
  topicIds: string[],
  resolveLabel: TopicLabelResolver,
  options?: { maxContentChars?: number; includeLabelPrefix?: boolean },
): Record<string, string> {
  const maxContentChars = options?.maxContentChars ?? 2000;
  const includeLabelPrefix = options?.includeLabelPrefix ?? true;
  const sections = parseHeadingSections(html, maxContentChars);
  const results: Record<string, string> = {};

  for (const topicId of topicIds) {
    const hashIdx = topicId.indexOf("#");
    if (hashIdx === -1) continue;
    const shortId = topicId.substring(hashIdx + 1);
    const label = resolveLabel(topicId);
    if (!label) continue;

    const normalizedLabel = normalizeForComparison(label);
    const section = sections.find(
      (s) =>
        normalizeForComparison(s.header).includes(normalizedLabel) ||
        s.header.toLowerCase().includes(shortId.toLowerCase()),
    );
    if (!section) continue;

    const body = section.content.trim();
    if (!body) continue;

    results[topicId] = includeLabelPrefix ? `${label}\n\n${body}`.trim() : body;
  }

  return results;
}

/**
 * Manifest helper: look up a topic label from
 * `topics[pathKey] = [{ id, label }, …]` using a full `pathKey#shortId` id.
 */
export function labelFromManifestTopics(
  topics: Record<string, Array<{ id: string; label: string }>>,
  topicId: string,
): string | null {
  const hashIdx = topicId.indexOf("#");
  if (hashIdx === -1) return null;
  const key = topicId.substring(0, hashIdx);
  const shortId = topicId.substring(hashIdx + 1);
  return topics[key]?.find((t) => t.id === shortId)?.label ?? null;
}
