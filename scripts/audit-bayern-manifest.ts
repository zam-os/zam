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

function auditSchoolType(schoolType: SchoolTypeId): {
  ok: string[];
  gaps: Gap[];
} {
  const grades = M.grades[schoolType] ?? [];
  const subjects = M.subjects[schoolType] ?? [];
  const ok: string[] = [];
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
          else ok.push(key);
        }
      } else {
        const topics = M.topics[base];
        const url = M.contentUrls[base];
        if (!topics?.length) gaps.push({ key: base, issue: "no_topics" });
        else if (!url) gaps.push({ key: base, issue: "no_url" });
        else ok.push(base);
      }
    }
  }

  return { ok, gaps };
}

const schoolTypes: SchoolTypeId[] = [
  "grundschule",
  "mittelschule",
  "foerderschule",
  "realschule",
  "gymnasium",
  "wirtschaftsschule",
  "fos",
  "bos",
];

let totalOk = 0;
let totalGaps = 0;

for (const schoolType of schoolTypes) {
  const { ok, gaps } = auditSchoolType(schoolType);
  totalOk += ok.length;
  totalGaps += gaps.length;
  console.log(`\n=== ${schoolType} ===`);
  console.log(`OK: ${ok.length}  gaps: ${gaps.length}`);
  // Only print gaps when few; otherwise summarize
  if (gaps.length <= 80) {
    for (const g of gaps) {
      console.log(`  ${g.key} (${g.issue})`);
    }
  } else {
    console.log(`  (first 40 of ${gaps.length})`);
    for (const g of gaps.slice(0, 40)) {
      console.log(`  ${g.key} (${g.issue})`);
    }
  }
}

console.log(`\n=== total ===`);
console.log(`OK: ${totalOk}  gaps: ${totalGaps}`);
