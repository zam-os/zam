/**
 * Generates docs/plans/2026-07-12-curriculum-manifest-coverage.md
 * Run: node scripts/generate-curriculum-plan.mjs
 */

import { writeFileSync } from "node:fs";
import { CURRICULUM_PROVIDERS } from "../src/cli/curriculum/registry.ts";
import {
  bundeslandSlug,
  curriculumTestUserId,
} from "./curriculum-test-user-id.ts";

const PROVIDER_ORDER = [...CURRICULUM_PROVIDERS].sort((a, b) =>
  a.id.localeCompare(b.id),
);

function pathKey(schoolType, grade, subject, track) {
  return track
    ? `${schoolType}|${grade}|${subject}|${track}`
    : `${schoolType}|${grade}|${subject}`;
}

function collectPaths(provider) {
  const paths = [];
  for (const schoolType of provider.listSchoolTypes()) {
    const grades = provider.listGrades(schoolType.id);
    if (grades.length === 0) continue;
    for (const grade of grades) {
      const subjects = provider.listSubjects(schoolType.id, grade.id);
      for (const subject of subjects) {
        const tracks = provider.listTracks(
          schoolType.id,
          grade.id,
          subject.id,
        );
        if (tracks.length === 0) {
          paths.push({
            schoolType: schoolType.id,
            schoolTypeLabel: schoolType.label,
            grade: grade.id,
            subject: subject.id,
            subjectLabel: subject.label,
            track: undefined,
            key: pathKey(schoolType.id, grade.id, subject.id),
          });
        } else {
          for (const track of tracks) {
            paths.push({
              schoolType: schoolType.id,
              schoolTypeLabel: schoolType.label,
              grade: grade.id,
              subject: subject.id,
              subjectLabel: subject.label,
              track: track.id,
              trackLabel: track.label,
              key: pathKey(schoolType.id, grade.id, subject.id, track.id),
            });
          }
        }
      }
    }
  }
  return paths;
}

function userId(provider, schoolType, grade) {
  return curriculumTestUserId(provider, schoolType, grade);
}

let md = `# Curriculum manifest coverage & import completion

Implements the Epic in GitHub issue **#132** (curriculum import incomplete for
German federal states). Read \`AGENTS.md\` and
[\`2026-07-02-lehrplanplus-phase-3.md\`](./2026-07-02-lehrplanplus-phase-3.md)
first. Work on exactly the next unchecked phase; one branch
(\`feat/curriculum-manifest-coverage\`), one focused commit per completed phase.

## Goal

Every navigable curriculum path (Land → Bundesland → Schulform → Klasse → Fach
[→ Ausprägung] → Themen/Lernbereiche) must offer selectable topics **and**
support end-to-end import of at least one selected topic into the learner's
queue. Today manifests are intentionally partial starter sets; the wizard shows
empty topic lists for most combinations (e.g. Bayern Realschule 9 Biologie).

## Status

- [ ] **Phase 0 — test infrastructure** (users, verification protocol)
- [ ] **Phase Import — import pipeline (Phase 3 handoff)** — topic extraction,
  \`topic_id\` persistence, atomic multi-topic import
`;

for (let i = 0; i < PROVIDER_ORDER.length; i++) {
  const p = PROVIDER_ORDER[i];
  const letter = String.fromCharCode(65 + i);
  md += `- [ ] **Phase ${letter} — \`${p.id}\` (${p.regionLabel})**\n`;
}

md += `
## Decisions (frozen)

1. **Scope:** Manifest taxonomy/topics **and** import pipeline Phase 3 (Epic C).
2. **Test users:** \`curriculum-<bundesland>-<schulform>-klasse-<n>\` in the
   shared Turso DB (readable Bundesland slug, explicit \`klasse\` segment);
   \`thomas\` and \`test-user-0.6.2\` stay untouched.
3. **Subjects:** All subjects listed in each provider manifest for the path —
   not a core-subject subset.
4. **Verification:** End-to-end per path — wizard topic selection **and**
   import of one topic into cards (see protocol below).
5. **Provider order:** Alphabetical by provider id (15 phases A–O).
6. **Manifest refresh:** Agent-navigated against live official sites once per
   school year (per ADR 2026-07-02); HTML fixtures for tests — no live-site
   dependency in CI.

## Phase 0 — test infrastructure

- [x] Provision \`114\` curriculum test users via
  \`npx tsx scripts/provision-curriculum-test-users.ts\` (shared anchor token
  \`curriculum-test-profile-anchor\`, one card each).
- [x] Document user ↔ path mapping in issue checklist (GitHub #132).
- [ ] Add a bridge-level smoke script that asserts \`curriculum-list-level
  --level topic\` returns non-empty options for every manifest path (CI gate
  once manifests are complete).

### Test user registry

| Region | User ID pattern | Example |
|--------|-----------------|---------|
`;

const regions = new Set();
for (const p of PROVIDER_ORDER) {
  const land = bundeslandSlug(p.regionLabel);
  if (regions.has(land)) continue;
  regions.add(land);
  const example = collectPaths(p)[0];
  if (example) {
    md += `| ${p.regionLabel} | \`curriculum-${land}-<schulform>-klasse-<n>\` | \`${userId(p, example.schoolType, example.grade)}\` |\n`;
  }
}

md += `
## End-to-end verification protocol (every path)

For path \`<provider>|<schoolType>|<grade>|<subject>[|<track>]\`:

1. \`zam bridge database-select-user --user curriculum-<bundesland>-<schulform>-klasse-<n>\`
2. Desktop → Curriculum import wizard: select Land, Bundesland, Schulform,
   Klasse, Fach [, Ausprägung].
3. **Topic step must list ≥1 Lernbereich/Thema** (not an empty list).
4. Select **one** topic → run import → confirm ≥1 card lands in the user's queue.
5. Card metadata must reference \`provider\` and \`topic_id\` once Phase B is done.
6. Record \`capturedOn\` in the manifest when refreshing from the live site.

CLI pre-check (before desktop):

\`\`\`bash
npx tsx src/cli/index.ts bridge curriculum-list-level \\
  --provider <id> --level topic \\
  --selection '{"schoolType":"...","grade":"...","subject":"...","track":"..."}'
\`\`\`

## Phase Import — import pipeline (Phase 3 handoff)

From [\`2026-07-02-lehrplanplus-phase-3.md\`](./2026-07-02-lehrplanplus-phase-3.md):

- [ ] Saved HTML fixtures per provider (never hit live sites in tests).
- [ ] Provider-owned \`extractTopics(html, topicIds)\` returning per-topic text.
- [ ] Persist \`provider\` + \`topic_id\` on imported cards (migration + fallback).
- [ ] Atomic multi-topic import with dedup; failure rolls back entire batch.
- [ ] Remove Phase-2 whole-page notice in wizard when extraction is precise.
- [ ] Regression tests: partial selection, sibling pages, re-import, all locales.

---

`;

for (let i = 0; i < PROVIDER_ORDER.length; i++) {
  const p = PROVIDER_ORDER[i];
  const letter = String.fromCharCode(65 + i);
  const paths = collectPaths(p);
  const withTopics = paths.filter((path) => p.listTopics({
    schoolType: path.schoolType,
    grade: path.grade,
    subject: path.subject,
    track: path.track,
  }).length > 0);

  md += `## Phase ${letter} — \`${p.id}\` (${p.regionLabel})

Provider: **${p.label}** · Region: \`${p.region}\` · Paths: **${paths.length}** · Topics today: **${withTopics.length}** (${paths.length ? Math.round((withTopics.length / paths.length) * 100) : 0}%)

Each line: manifest topics + \`contentUrls\` + HTML fixture + CLI topic check + desktop E2E import.

`;

  for (const path of paths) {
    const hasTopics = p.listTopics({
      schoolType: path.schoolType,
      grade: path.grade,
      subject: path.subject,
      track: path.track,
    }).length > 0;
    const mark = hasTopics ? "x" : " ";
    const trackPart = path.track ? ` · ${path.trackLabel ?? path.track}` : "";
    const testUser = userId(p, path.schoolType, path.grade);
    md += `- [${mark}] \`${path.key}\` — ${path.schoolTypeLabel} ${path.grade}. Kl. · ${path.subjectLabel}${trackPart} · user \`${testUser}\`\n`;
  }
  md += "\n";
}

md += `## Acceptance (Epic complete)

- Every checkbox above is checked.
- Phase B import pipeline acceptance from Phase 3 plan is met.
- \`npm run format && npm run lint && npm run typecheck && npm run test && npm run build\` green.
- No regression for \`thomas\` / \`test-user-0.6.2\` profiles.
`;

const outPath = new URL(
  "../docs/plans/2026-07-12-curriculum-manifest-coverage.md",
  import.meta.url,
);
const totalPaths = PROVIDER_ORDER.reduce(
  (sum, provider) => sum + collectPaths(provider).length,
  0,
);
writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${outPath.pathname} (${totalPaths} total paths)`);