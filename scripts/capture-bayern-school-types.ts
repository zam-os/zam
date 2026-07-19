/**
 * Capture LehrplanPLUS Bayern curricula for one or more school types.
 *
 * Not used in CI. Re-run against the live site when refreshing the school year.
 *
 * Usage:
 *   npx tsx scripts/capture-bayern-school-types.ts grundschule mittelschule foerderschule
 *   npx tsx scripts/capture-bayern-school-types.ts wirtschaftsschule
 *
 * Writes:
 *   scripts/.cache/bayern-<schoolTypes>-capture.json
 *   scripts/.cache/bayern-<schoolTypes>-manifest-patch.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, ".cache");
const BASE = "https://www.lehrplanplus.bayern.de";
const USER_AGENT =
  "ZAM-curriculum-capture/0.15.6 (+https://github.com/zam-os/zam)";
const DELAY_MS = 120;
const SCHOOL_YEAR = "2026/2027";
const CAPTURED_ON = new Date().toISOString().slice(0, 10);

interface TaxonomyNode {
  id: string;
  label: string;
}

interface ManifestTopic extends TaxonomyNode {
  hours?: number;
}

interface CaptureResult {
  schoolYear: string;
  capturedOn: string;
  schoolTypes: string[];
  grades: Record<string, string[]>;
  subjects: Record<string, TaxonomyNode[]>;
  tracks: Record<string, TaxonomyNode[]>;
  topics: Record<string, ManifestTopic[]>;
  contentUrls: Record<string, string>;
  stats: {
    pathsOk: number;
    pathsEmpty: number;
    tracksCaptured: number;
    requests: number;
  };
}

interface TrackOption {
  id: string;
  label: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function isStartseite(html: string): boolean {
  return html.includes("<title>LehrplanPLUS - Startseite</title>");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#x202f;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(Number.parseInt(h, 16)),
    );
}

function cleanText(raw: string): string {
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

/** Decode percent-encoding in path segments (e.g. buchf%C3%BChrung). */
function decodePathId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function extractGrades(html: string, schoolType: string): string[] {
  const re = new RegExp(`href="/schulart/${schoolType}/jgs/(\\d+)"`, "g");
  const grades = new Set<string>();
  let m: RegExpExecArray | null = re.exec(html);
  while (m !== null) {
    grades.add(m[1]);
    m = re.exec(html);
  }
  return [...grades].sort((a, b) => Number(a) - Number(b));
}

function extractSubjects(html: string, schoolType: string): TaxonomyNode[] {
  const re = new RegExp(
    `href="/schulart/${schoolType}/fach/([^"]+)"[^>]*>([^<]+)`,
    "g",
  );
  const byId = new Map<string, string>();
  let m: RegExpExecArray | null = re.exec(html);
  while (m !== null) {
    const id = decodePathId(m[1]);
    const label = cleanText(m[2]);
    if (id && label && !byId.has(id)) {
      byId.set(id, label);
    }
    m = re.exec(html);
  }
  return [...byId.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function extractSubjectsFromGradePage(
  html: string,
  schoolType: string,
  grade: string,
): TaxonomyNode[] {
  const re = new RegExp(
    `href="/schulart/${schoolType}/jgs/${grade}/fach/([^"/?]+)[^"]*"[^>]*>([^<]+)`,
    "g",
  );
  const byId = new Map<string, string>();
  let m: RegExpExecArray | null = re.exec(html);
  while (m !== null) {
    const id = decodePathId(m[1]);
    const label = cleanText(m[2]);
    if (id && label && !byId.has(id)) {
      byId.set(id, label);
    }
    m = re.exec(html);
  }
  return [...byId.entries()].map(([id, label]) => ({ id, label }));
}

/**
 * Current school-year filter (2026/2027):
 * - keep unversioned tracks
 * - keep gueltig_bis where end year >= 26/27
 * - keep gueltig_ab where start year <= 26/27
 */
function isCurrentTrack(trackId: string): boolean {
  const bis = trackId.match(/gueltig_bis_(\d{2})_?(\d{2})/i);
  if (bis) {
    return Number(bis[1]) >= 26;
  }
  const ab = trackId.match(/gueltig_ab_(\d{2})_?(\d{2})/i);
  if (ab) {
    return Number(ab[1]) <= 26;
  }
  return true;
}

function sanitizeTrackLabel(raw: string, trackId: string): string {
  let label = cleanText(raw.replace(/<[^>]+>/g, " "));
  label = label.replace(/^[^"]*">\s*/, "").trim();
  label = label.replace(/\s+/g, " ");
  if (!label || label === trackId) {
    return trackId
      .replace(/_/g, " ")
      .replace(/gueltig (ab|bis) \d+ \d+/i, "")
      .trim();
  }
  return label;
}

type TrackKind = "auspraegung" | "foerderschwerpunkt";

interface TrackOptionWithKind extends TrackOption {
  kind: TrackKind;
}

function extractTrackOptions(html: string): TrackOptionWithKind[] {
  const byId = new Map<string, { label: string; kind: TrackKind }>();

  function ingest(
    rawId: string,
    rawLabel: string,
    kind: TrackKind,
    fullMatch = "",
  ): void {
    const id = decodePathId(decodeHtmlEntities(rawId));
    const titleMatch = fullMatch.match(/\btitle="([^"]+)"/);
    const anchorLabel = sanitizeTrackLabel(rawLabel, id);
    const titleLabel = titleMatch
      ? sanitizeTrackLabel(titleMatch[1], id)
      : "";
    const label = anchorLabel.length >= 3 ? anchorLabel : titleLabel || id;
    const prev = byId.get(id);
    if (!prev || (label.length > prev.label.length && label.length < 120)) {
      byId.set(id, { label, kind });
    }
  }

  const auspraegungRe =
    /href="[^"]*w_auspraegung=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null = auspraegungRe.exec(html);
  while (m !== null) {
    ingest(m[1], m[2], "auspraegung", m[0]);
    m = auspraegungRe.exec(html);
  }

  // Förderschule: tracks are Förderschwerpunkte (w_foerderschwerpunkt=…)
  const fspRe =
    /href="[^"]*w_foerderschwerpunkt=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  m = fspRe.exec(html);
  while (m !== null) {
    // Skip links that switch away from foerderschule
    if (!/w_schulart=foerderschule/i.test(m[0]) && /w_schulart=/.test(m[0])) {
      m = fspRe.exec(html);
      continue;
    }
    ingest(m[1], m[2], "foerderschwerpunkt", m[0]);
    m = fspRe.exec(html);
  }

  for (const id of html.matchAll(/w_auspraegung=([a-zA-Z0-9_%-]+)/g)) {
    const decoded = decodePathId(id[1]);
    if (!byId.has(decoded)) {
      byId.set(decoded, {
        label: sanitizeTrackLabel(decoded, decoded),
        kind: "auspraegung",
      });
    }
  }

  return [...byId.entries()]
    .filter(([id]) => isCurrentTrack(id))
    .map(([id, v]) => ({
      id,
      label: sanitizeTrackLabel(v.label, id),
      kind: v.kind,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function extractTopics(html: string): ManifestTopic[] {
  const topics: ManifestTopic[] = [];
  const re =
    /class="head-absatz-title-short\s*"[^>]*>\s*([\s\S]*?)\s*<\/span>/gi;
  let m: RegExpExecArray | null = re.exec(html);
  let index = 0;
  while (m !== null) {
    const raw = cleanText(m[1].replace(/<[^>]+>/g, " "));
    if (!raw) {
      m = re.exec(html);
      continue;
    }
    index += 1;
    const hoursMatch = raw.match(/\(ca\.\s*(\d+)\s*Std\.\)/i);
    const label = raw.replace(/\s*\(ca\.\s*\d+\s*Std\.\)\s*/i, "").trim();
    if (label) {
      const topic: ManifestTopic = { id: `lb${index}`, label };
      if (hoursMatch) {
        topic.hours = Number(hoursMatch[1]);
      }
      topics.push(topic);
    }
    m = re.exec(html);
  }
  return topics;
}

function encodePathSegment(value: string): string {
  // Encode non-ASCII / reserved characters; keep already-encoded sequences intact.
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}

function baseFachlehrplanUrl(
  schoolType: string,
  grade: string,
  subject: string,
  track?: string,
  trackKind: TrackKind = "auspraegung",
): string {
  const subj = encodePathSegment(subject);
  const base = `${BASE}/schulart/${schoolType}/jgs/${grade}/fach/${subj}/inhalt/fachlehrplaene`;
  if (!track) return base;
  const trackEnc = encodePathSegment(track);
  if (trackKind === "foerderschwerpunkt") {
    return (
      `${base}?w_schulart=${schoolType}&wt_1=schulart` +
      `&w_fach=${subj}&wt_2=fach&w_jgs=${grade}&wt_3=jgs` +
      `&w_foerderschwerpunkt=${trackEnc}&wt_4=foerderschwerpunkt`
    );
  }
  return (
    `${base}?w_schulart=${schoolType}&wt_1=schulart` +
    `&w_fach=${subj}&wt_2=fach&w_jgs=${grade}&wt_3=jgs` +
    `&w_auspraegung=${trackEnc}`
  );
}

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

function tsString(value: string): string {
  return JSON.stringify(value);
}

function formatTopics(topics: ManifestTopic[]): string {
  const lines = topics.map((t) => {
    const parts = [`id: ${tsString(t.id)}`, `label: ${tsString(t.label)}`];
    if (t.hours !== undefined) {
      parts.push(`hours: ${t.hours}`);
    }
    return `      {\n        ${parts.join(",\n        ")},\n      }`;
  });
  return `[\n${lines.join(",\n")},\n    ]`;
}

function formatTracks(tracks: TaxonomyNode[]): string {
  const lines = tracks.map(
    (t) =>
      `      {\n        id: ${tsString(t.id)},\n        label: ${tsString(t.label)},\n      }`,
  );
  return `[\n${lines.join(",\n")},\n    ]`;
}

function formatSubjects(subjects: TaxonomyNode[]): string {
  const lines = subjects.map(
    (s) =>
      `      {\n        id: ${tsString(s.id)},\n        label: ${tsString(s.label)},\n      }`,
  );
  return `[\n${lines.join(",\n")},\n    ]`;
}

async function captureSchoolType(
  schoolType: string,
  result: CaptureResult,
): Promise<void> {
  console.log(`\n=== ${schoolType} ===`);
  const overviewHtml = await fetchHtml(`${BASE}/schulart/${schoolType}`);
  result.stats.requests += 1;
  await sleep(DELAY_MS);

  const grades = extractGrades(overviewHtml, schoolType);
  result.grades[schoolType] = grades;
  console.log(`  grades: ${grades.join(", ") || "(none)"}`);

  const subjectMap = new Map<string, string>();
  for (const s of extractSubjects(overviewHtml, schoolType)) {
    subjectMap.set(s.id, s.label);
  }

  for (const grade of grades) {
    const gradeHtml = await fetchHtml(
      `${BASE}/schulart/${schoolType}/jgs/${grade}`,
    );
    result.stats.requests += 1;
    await sleep(DELAY_MS);
    for (const s of extractSubjectsFromGradePage(
      gradeHtml,
      schoolType,
      grade,
    )) {
      if (!subjectMap.has(s.id)) {
        subjectMap.set(s.id, s.label);
      }
    }
  }

  const subjects = [...subjectMap.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.id.localeCompare(b.id));
  result.subjects[schoolType] = subjects;
  console.log(`  subjects: ${subjects.length}`);

  for (const grade of grades) {
    for (const subject of subjects) {
      const baseUrl = baseFachlehrplanUrl(schoolType, grade, subject.id);
      let baseHtml: string;
      try {
        baseHtml = await fetchHtml(baseUrl);
        result.stats.requests += 1;
        await sleep(DELAY_MS);
      } catch (err) {
        console.warn(`  WARN fetch failed ${baseUrl}: ${err}`);
        result.stats.pathsEmpty += 1;
        continue;
      }

      if (isStartseite(baseHtml)) {
        result.stats.pathsEmpty += 1;
        continue;
      }

      const trackOptions = extractTrackOptions(baseHtml);
      const baseTopics = extractTopics(baseHtml);

      if (trackOptions.length === 0) {
        if (baseTopics.length === 0) {
          result.stats.pathsEmpty += 1;
          continue;
        }
        const key = levelKey(schoolType, grade, subject.id);
        result.topics[key] = baseTopics;
        result.contentUrls[key] = baseUrl;
        result.stats.pathsOk += 1;
        console.log(`  OK  ${key}  (${baseTopics.length} topics)`);
        continue;
      }

      const liveTracks: TaxonomyNode[] = [];
      for (const track of trackOptions) {
        const trackUrl = baseFachlehrplanUrl(
          schoolType,
          grade,
          subject.id,
          track.id,
          track.kind,
        );
        let trackHtml: string;
        try {
          trackHtml = await fetchHtml(trackUrl);
          result.stats.requests += 1;
          await sleep(DELAY_MS);
        } catch (err) {
          console.warn(`  WARN track fetch failed ${trackUrl}: ${err}`);
          continue;
        }
        if (isStartseite(trackHtml)) continue;
        const topics = extractTopics(trackHtml);
        if (topics.length === 0) continue;

        const key = levelKey(schoolType, grade, subject.id, track.id);
        result.topics[key] = topics;
        result.contentUrls[key] = trackUrl;
        liveTracks.push({ id: track.id, label: track.label });
        result.stats.pathsOk += 1;
        console.log(
          `  OK  ${key}  (${topics.length} topics, ${track.kind})`,
        );
      }

      if (liveTracks.length > 0) {
        const trackKey = levelKey(schoolType, grade, subject.id);
        result.tracks[trackKey] = liveTracks;
        result.stats.tracksCaptured += 1;
      } else if (baseTopics.length > 0) {
        const key = levelKey(schoolType, grade, subject.id);
        result.topics[key] = baseTopics;
        result.contentUrls[key] = baseUrl;
        result.stats.pathsOk += 1;
        console.log(
          `  OK  ${key}  (${baseTopics.length} topics, base fallback)`,
        );
      } else {
        result.stats.pathsEmpty += 1;
      }
    }
  }
}

function emitManifestPatch(result: CaptureResult): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(
    ` * Auto-captured LehrplanPLUS patch (${result.schoolTypes.join(", ")}) — ${result.capturedOn}.`,
  );
  lines.push(" */");
  lines.push("");
  lines.push("export const BAYERN_CAPTURE_PATCH = {");
  lines.push(`  schoolYear: ${tsString(result.schoolYear)},`);
  lines.push(`  capturedOn: ${tsString(result.capturedOn)},`);
  lines.push("");
  lines.push("  grades: {");
  for (const st of result.schoolTypes) {
    const grades = result.grades[st] ?? [];
    lines.push(`    ${st}: [${grades.map((g) => tsString(g)).join(", ")}],`);
  }
  lines.push("  },");
  lines.push("");
  lines.push("  subjects: {");
  for (const st of result.schoolTypes) {
    lines.push(`    ${st}: ${formatSubjects(result.subjects[st] ?? [])},`);
  }
  lines.push("  },");
  lines.push("");
  lines.push("  tracks: {");
  for (const key of Object.keys(result.tracks).sort()) {
    lines.push(`    ${tsString(key)}: ${formatTracks(result.tracks[key])},`);
  }
  lines.push("  },");
  lines.push("");
  lines.push("  topics: {");
  for (const key of Object.keys(result.topics).sort()) {
    lines.push(`    ${tsString(key)}: ${formatTopics(result.topics[key])},`);
  }
  lines.push("  },");
  lines.push("");
  lines.push("  contentUrls: {");
  for (const key of Object.keys(result.contentUrls).sort()) {
    lines.push(`    ${tsString(key)}: ${tsString(result.contentUrls[key])},`);
  }
  lines.push("  },");
  lines.push("} as const;");
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const schoolTypes = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (schoolTypes.length === 0) {
    console.error(
      "Usage: npx tsx scripts/capture-bayern-school-types.ts <schoolType> [...]",
    );
    console.error(
      "Example: npx tsx scripts/capture-bayern-school-types.ts grundschule mittelschule foerderschule",
    );
    process.exit(1);
  }

  mkdirSync(CACHE_DIR, { recursive: true });

  const result: CaptureResult = {
    schoolYear: SCHOOL_YEAR,
    capturedOn: CAPTURED_ON,
    schoolTypes,
    grades: {},
    subjects: {},
    tracks: {},
    topics: {},
    contentUrls: {},
    stats: {
      pathsOk: 0,
      pathsEmpty: 0,
      tracksCaptured: 0,
      requests: 0,
    },
  };

  for (const st of schoolTypes) {
    await captureSchoolType(st, result);
  }

  const slug = schoolTypes.join("-");
  const jsonPath = join(CACHE_DIR, `bayern-${slug}-capture.json`);
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");

  const tsPath = join(CACHE_DIR, `bayern-${slug}-manifest-patch.ts`);
  writeFileSync(tsPath, emitManifestPatch(result), "utf8");

  console.log("\n=== capture summary ===");
  console.log(`school types: ${schoolTypes.join(", ")}`);
  console.log(`paths OK:     ${result.stats.pathsOk}`);
  console.log(`paths empty:  ${result.stats.pathsEmpty}`);
  console.log(`track groups: ${result.stats.tracksCaptured}`);
  console.log(`HTTP requests:${result.stats.requests}`);
  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${tsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
