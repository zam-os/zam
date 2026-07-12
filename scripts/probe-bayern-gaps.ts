import { LEHRPLANPLUS_BAYERN_MANIFEST as M } from "../src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts";

type Gap = { key: string; issue: "no_topics" | "no_url" };

function auditGaps(schoolType: "realschule" | "gymnasium"): Gap[] {
  const grades = M.grades[schoolType] ?? [];
  const subjects = M.subjects[schoolType] ?? [];
  const gaps: Gap[] = [];

  for (const grade of grades) {
    for (const sub of subjects) {
      const base = `${schoolType}|${grade}|${sub.id}`;
      const tracks = M.tracks[base] ?? [];

      if (tracks.length > 0) {
        for (const tr of tracks) {
          const key = `${base}|${tr.id}`;
          const topics = M.topics[key];
          const url = M.contentUrls[key];
          if (!topics?.length) gaps.push({ key, issue: "no_topics" });
          else if (!url) gaps.push({ key, issue: "no_url" });
        }
      } else {
        const topics = M.topics[base];
        const url = M.contentUrls[base];
        if (!topics?.length) gaps.push({ key: base, issue: "no_topics" });
        else if (!url) gaps.push({ key: base, issue: "no_url" });
      }
    }
  }

  return gaps;
}

function lehrplanUrl(key: string): string {
  const [schoolType, grade, subject, track] = key.split("|");
  const base = `https://www.lehrplanplus.bayern.de/schulart/${schoolType}/jgs/${grade}/fach/${subject}/inhalt/fachlehrplaene`;
  if (!track) return base;
  return `${base}?w_schulart=${schoolType}&wt_1=schulart&w_fach=${subject}&wt_2=fach&w_jgs=${grade}&wt_3=jgs&w_auspraegung=${track}`;
}

function extractTopics(html: string): Array<{ label: string; hours?: number }> {
  const re = /head-absatz-title-short[^>]*>\s*([^<]+)/g;
  const topics: Array<{ label: string; hours?: number }> = [];
  let match: RegExpExecArray | null = re.exec(html);
  while (match !== null) {
    const raw = match[1]
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const hoursMatch = raw.match(/\(ca\.\s*(\d+)\s*Std\.\)/);
    topics.push({
      label: raw.replace(/\s*\(ca\.\s*\d+\s*Std\.\)\s*/, "").trim(),
      hours: hoursMatch ? Number(hoursMatch[1]) : undefined,
    });
    match = re.exec(html);
  }
  return topics;
}

const TRACK_CANDIDATES = ["wpfg1", "wpfg2-3"] as const;

async function probeKey(key: string): Promise<{
  status: "live" | "tracks" | "na";
  topics: Array<{ label: string; hours?: number }>;
  track?: string;
  url?: string;
}> {
  const html = await fetch(lehrplanUrl(key), { redirect: "follow" }).then((r) =>
    r.text(),
  );
  if (html.includes("<title>LehrplanPLUS - Startseite</title>")) {
    const [schoolType, grade, subject] = key.split("|");
    if (key.split("|").length === 3) {
      for (const track of TRACK_CANDIDATES) {
        const trackKey = `${schoolType}|${grade}|${subject}|${track}`;
        const trackHtml = await fetch(lehrplanUrl(trackKey), {
          redirect: "follow",
        }).then((r) => r.text());
        const topics = extractTopics(trackHtml);
        if (
          topics.length > 0 &&
          !trackHtml.includes("<title>LehrplanPLUS - Startseite</title>")
        ) {
          return { status: "tracks", topics, track, url: lehrplanUrl(trackKey) };
        }
      }
    }
    return { status: "na", topics: [] };
  }
  return { status: "live", topics: extractTopics(html), url: lehrplanUrl(key) };
}

const schoolType = (process.argv[2] ?? "gymnasium") as "realschule" | "gymnasium";
const gaps = auditGaps(schoolType);

const live: string[] = [];
const trackNeeded: string[] = [];
const na: string[] = [];

for (const gap of gaps) {
  const result = await probeKey(gap.key);
  if (result.status === "live" && result.topics.length > 0) {
    live.push(gap.key);
    console.log(`LIVE\t${gap.key}\t${result.topics.length}\t${result.topics.map((t) => t.label).join("; ")}`);
  } else if (result.status === "tracks") {
    trackNeeded.push(gap.key);
    console.log(`TRACKS\t${gap.key}\t${result.track}\t${result.topics.length}\t${result.topics.map((t) => t.label).join("; ")}`);
  } else {
    na.push(gap.key);
    console.log(`N/A\t${gap.key}`);
  }
  await new Promise((r) => setTimeout(r, 150));
}

console.log(`\n=== ${schoolType} summary ===`);
console.log(`live fixes needed: ${live.length}`);
console.log(`track fixes needed: ${trackNeeded.length}`);
console.log(`expected empty: ${na.length}`);