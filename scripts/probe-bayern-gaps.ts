import { LEHRPLANPLUS_BAYERN_MANIFEST as M } from "../src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts";

type SchoolTypeId =
  | "grundschule"
  | "mittelschule"
  | "foerderschule"
  | "realschule"
  | "gymnasium"
  | "wirtschaftsschule"
  | "fos"
  | "bos";

type Gap = { key: string; issue: "no_topics" | "no_url" };

function auditGaps(schoolType: SchoolTypeId): Gap[] {
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
  const re =
    /class="head-absatz-title-short\s*"[^>]*>\s*([\s\S]*?)\s*<\/span>/gi;
  const topics: Array<{ label: string; hours?: number }> = [];
  let match: RegExpExecArray | null = re.exec(html);
  while (match !== null) {
    const raw = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!raw) {
      match = re.exec(html);
      continue;
    }
    const hoursMatch = raw.match(/\(ca\.\s*(\d+)\s*Std\.\)/i);
    topics.push({
      label: raw.replace(/\s*\(ca\.\s*\d+\s*Std\.\)\s*/i, "").trim(),
      hours: hoursMatch ? Number(hoursMatch[1]) : undefined,
    });
    match = re.exec(html);
  }
  return topics;
}

/** Common Ausprägung ids to try when the base page is empty. */
const TRACK_CANDIDATES_BY_SCHOOL: Record<string, readonly string[]> = {
  grundschule: ["einst", "zweistuendig"],
  mittelschule: ["regelklasse", "mittlere-reife-klasse", "m-zug", "regel"],
  foerderschule: [
    "regelklasse",
    "mittlere-reife-klasse",
    "lernen",
    "geistige-entwicklung",
    "sehen",
    "hoeren",
    "koerperliche-motorische-entwicklung",
    "sprache",
    "emotionale-soziale-entwicklung",
  ],
  realschule: ["wpfg1", "wpfg2-3", "basis_sport", "diff_sport"],
  gymnasium: ["grundlegend", "erhoeht", "basissport", "sporttheorie"],
  wirtschaftsschule: [
    "zweistufig",
    "dreistufig",
    "vierstufig",
    "diffsport",
    "drei_vierstufig",
  ],
  fos: [
    "t",
    "abu-g-s-w-gh-iw",
    "Wahl-abu-g-s-w-gh-iw",
    "wahl-t",
    "gueltig_bis_26_27",
  ],
  bos: [
    "t",
    "abu-s-w-gh-iw",
    "Wahl-abu-s-w-gh-iw",
    "wahl-t",
    "gueltig_bis_26_27",
    "vorklasse",
    "vorkurs",
  ],
};

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
      const candidates =
        TRACK_CANDIDATES_BY_SCHOOL[schoolType] ??
        TRACK_CANDIDATES_BY_SCHOOL.realschule;
      for (const track of candidates) {
        const trackKey = `${schoolType}|${grade}|${subject}|${track}`;
        const trackHtml = await fetch(lehrplanUrl(trackKey), {
          redirect: "follow",
        }).then((r) => r.text());
        const topics = extractTopics(trackHtml);
        if (
          topics.length > 0 &&
          !trackHtml.includes("<title>LehrplanPLUS - Startseite</title>")
        ) {
          return {
            status: "tracks",
            topics,
            track,
            url: lehrplanUrl(trackKey),
          };
        }
      }
    }
    return { status: "na", topics: [] };
  }
  const topics = extractTopics(html);
  if (topics.length === 0) {
    // Page exists but may only list Ausprägungen — try candidates
    const [schoolType, grade, subject] = key.split("|");
    if (key.split("|").length === 3) {
      const candidates = TRACK_CANDIDATES_BY_SCHOOL[schoolType] ?? [];
      for (const track of candidates) {
        const trackKey = `${schoolType}|${grade}|${subject}|${track}`;
        const trackHtml = await fetch(lehrplanUrl(trackKey), {
          redirect: "follow",
        }).then((r) => r.text());
        const trackTopics = extractTopics(trackHtml);
        if (
          trackTopics.length > 0 &&
          !trackHtml.includes("<title>LehrplanPLUS - Startseite</title>")
        ) {
          return {
            status: "tracks",
            topics: trackTopics,
            track,
            url: lehrplanUrl(trackKey),
          };
        }
      }
    }
    return { status: "na", topics: [] };
  }
  return { status: "live", topics, url: lehrplanUrl(key) };
}

const schoolType = (process.argv[2] ?? "wirtschaftsschule") as SchoolTypeId;
const gaps = auditGaps(schoolType);

const live: string[] = [];
const trackNeeded: string[] = [];
const na: string[] = [];

for (const gap of gaps) {
  const result = await probeKey(gap.key);
  if (result.status === "live" && result.topics.length > 0) {
    live.push(gap.key);
    console.log(
      `LIVE\t${gap.key}\t${result.topics.length}\t${result.topics.map((t) => t.label).join("; ")}`,
    );
  } else if (result.status === "tracks") {
    trackNeeded.push(gap.key);
    console.log(
      `TRACKS\t${gap.key}\t${result.track}\t${result.topics.length}\t${result.topics.map((t) => t.label).join("; ")}`,
    );
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
