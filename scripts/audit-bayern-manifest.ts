import { LEHRPLANPLUS_BAYERN_MANIFEST as M } from "../src/cli/curriculum/providers/lehrplanplus-bayern/manifest.ts";

type Gap = { key: string; issue: "no_topics" | "no_url" };

function auditSchoolType(schoolType: "realschule" | "gymnasium"): {
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

for (const schoolType of ["realschule", "gymnasium"] as const) {
  const { ok, gaps } = auditSchoolType(schoolType);
  console.log(`\n=== ${schoolType} ===`);
  console.log(`OK: ${ok.length}  gaps: ${gaps.length}`);
  for (const g of gaps) {
    console.log(`  ${g.key} (${g.issue})`);
  }
}