/**
 * One-shot capture of LehrplanPLUS Bayern curricula for:
 *   - wirtschaftsschule (grades 5–11)
 *   - fos (grades 10–13)
 *   - bos (grades 10, 12, 13)
 *
 * Writes:
 *   - scripts/.cache/bayern-ws-fos-bos-capture.json  (raw capture)
 *   - scripts/.cache/bayern-ws-fos-bos-manifest-patch.ts  (TS fragment to merge)
 *
 * Not used in CI. Re-run against the live site when refreshing the school year.
 *
 * Usage: npx tsx scripts/capture-bayern-ws-fos-bos.ts
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

type SchoolTypeId = "wirtschaftsschule" | "fos" | "bos";

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
  schoolTypes: SchoolTypeId[];
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

const SCHOOL_TYPES: SchoolTypeId[] = ["wirtschaftsschule", "fos", "bos"];

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
    const id = m[1];
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

/** Extra subjects that appear only under grade navigation. */
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
    const id = m[1];
    const label = cleanText(m[2]);
    if (id && label && !byId.has(id)) {
      byId.set(id, label);
    }
    m = re.exec(html);
  }
  return [...byId.entries()].map(([id, label]) => ({ id, label }));
}

interface TrackOption {
  id: string;
  label: string;
}

/**
 * Current school-year filter (2026/2027):
 *
 * `gueltig_bis_YYZZ`  — valid *through* school year 20YY/ZZ (inclusive).
 * `gueltig_ab_YYZZ`   — valid *from* school year 20YY/ZZ.
 *
 * For school year 2026/2027:
 * - keep unversioned tracks
 * - keep gueltig_bis where end year >= 26/27
 * - keep gueltig_ab where start year <= 26/27
 * - drop everything else (expired or not yet in force)
 */
function isCurrentTrack(trackId: string): boolean {
  const bis = trackId.match(/gueltig_bis_(\d{2})_?(\d{2})/i);
  if (bis) {
    const endStart = Number(bis[1]); // e.g. 26 from 26_27
    return endStart >= 26;
  }
  const ab = trackId.match(/gueltig_ab_(\d{2})_?(\d{2})/i);
  if (ab) {
    const startStart = Number(ab[1]); // e.g. 24 from 24_25
    return startStart <= 26;
  }
  return true;
}

function sanitizeTrackLabel(raw: string, trackId: string): string {
  let label = cleanText(raw.replace(/<[^>]+>/g, " "));
  // Fix accidental HTML leftovers like `…(vierstufig)"> Differenzierter Sport`
  label = label.replace(/^[^"]*">\s*/, "").trim();
  label = label.replace(/\s+/g, " ");
  if (!label || label === trackId) {
    // Humanize the id as a last resort
    return trackId
      .replace(/_/g, " ")
      .replace(/gueltig (ab|bis) \d+ \d+/i, "")
      .trim();
  }
  return label;
}

function extractTrackOptions(html: string): TrackOption[] {
  const byId = new Map<string, string>();
  // Links with full w_auspraegung query and anchor text
  const linkRe =
    /href="[^"]*w_auspraegung=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null = linkRe.exec(html);
  while (m !== null) {
    const id = decodeHtmlEntities(m[1]);
    const titleMatch = m[0].match(/\btitle="([^"]+)"/);
    const anchorLabel = sanitizeTrackLabel(m[2], id);
    const titleLabel = titleMatch ? sanitizeTrackLabel(titleMatch[1], id) : "";
    // Prefer the curriculum-style anchor text (e.g. "Mathematik 12 (T)") over
    // the long Ausbildungsrichtung enumeration in the title attribute.
    const label = anchorLabel.length >= 3 ? anchorLabel : titleLabel || id;
    const prev = byId.get(id);
    if (!prev || (label.length > prev.length && label.length < 120)) {
      byId.set(id, label);
    }
    m = linkRe.exec(html);
  }

  // Fallback: bare track ids in w_auspraegung=
  for (const id of html.matchAll(/w_auspraegung=([a-zA-Z0-9_-]+)/g)) {
    if (!byId.has(id[1])) {
      byId.set(id[1], sanitizeTrackLabel(id[1], id[1]));
    }
  }

  return [...byId.entries()]
    .filter(([id]) => isCurrentTrack(id))
    .map(([id, label]) => ({ id, label: sanitizeTrackLabel(label, id) }))
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

function baseFachlehrplanUrl(
  schoolType: string,
  grade: string,
  subject: string,
  track?: string,
): string {
  const base = `${BASE}/schulart/${schoolType}/jgs/${grade}/fach/${subject}/inhalt/fachlehrplaene`;
  if (!track) return base;
  return (
    `${base}?w_schulart=${schoolType}&wt_1=schulart` +
    `&w_fach=${subject}&wt_2=fach&w_jgs=${grade}&wt_3=jgs` +
    `&w_auspraegung=${track}`
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
  // Prefer double-quoted strings; escape as needed.
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
  schoolType: SchoolTypeId,
  result: CaptureResult,
): Promise<void> {
  console.log(`\n=== ${schoolType} ===`);
  const overviewHtml = await fetchHtml(`${BASE}/schulart/${schoolType}`);
  result.stats.requests += 1;
  await sleep(DELAY_MS);

  const grades = extractGrades(overviewHtml, schoolType);
  result.grades[schoolType] = grades;
  console.log(`  grades: ${grades.join(", ")}`);

  const subjectMap = new Map<string, string>();
  for (const s of extractSubjects(overviewHtml, schoolType)) {
    subjectMap.set(s.id, s.label);
  }

  // Enrich subject catalog from each grade page (some subjects only appear there)
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

      // Subject has Ausprägungen: capture each current track that has topics.
      const liveTracks: TaxonomyNode[] = [];
      for (const track of trackOptions) {
        const trackUrl = baseFachlehrplanUrl(
          schoolType,
          grade,
          subject.id,
          track.id,
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
        console.log(`  OK  ${key}  (${topics.length} topics)`);
      }

      if (liveTracks.length > 0) {
        const trackKey = levelKey(schoolType, grade, subject.id);
        result.tracks[trackKey] = liveTracks;
        result.stats.tracksCaptured += 1;
      } else if (baseTopics.length > 0) {
        // Tracks listed but none yielded topics — fall back to base page.
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
    ` * Auto-captured LehrplanPLUS patch for WS / FOS / BOS (${result.capturedOn}).`,
  );
  lines.push(
    " * Merge into LEHRPLANPLUS_BAYERN_MANIFEST manually or via apply script.",
  );
  lines.push(" */");
  lines.push("");
  lines.push("export const BAYERN_WS_FOS_BOS_PATCH = {");
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
  mkdirSync(CACHE_DIR, { recursive: true });

  const result: CaptureResult = {
    schoolYear: SCHOOL_YEAR,
    capturedOn: CAPTURED_ON,
    schoolTypes: SCHOOL_TYPES,
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

  for (const st of SCHOOL_TYPES) {
    await captureSchoolType(st, result);
  }

  const jsonPath = join(CACHE_DIR, "bayern-ws-fos-bos-capture.json");
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");

  const tsPath = join(CACHE_DIR, "bayern-ws-fos-bos-manifest-patch.ts");
  writeFileSync(tsPath, emitManifestPatch(result), "utf8");

  console.log("\n=== capture summary ===");
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
