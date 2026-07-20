/**
 * Generates docs/plans/2026-07-12-curriculum-manifest-coverage.md.
 *
 * The generated plan deliberately does not turn today's MINT seed manifests
 * into a final path checklist. Exact path counts only become acceptance data
 * after a provider's complete official taxonomy has been captured.
 *
 * Run: node --import tsx/esm scripts/generate-curriculum-plan.mjs
 */

import { writeFileSync } from "node:fs";
import { RAW_CURRICULUM_PROVIDERS } from "../src/cli/curriculum/registry.ts";
import {
  bundeslandSlug,
  curriculumTestUserId,
} from "./curriculum-test-user-id.ts";

const ISSUE_BY_PROVIDER = {
  "bildungsplan-bremen": 135,
  "bildungsplan-bw": 136,
  "bildungsplan-hamburg": 137,
  "fachanforderungen-sh": 138,
  "kerncurriculum-hessen": 139,
  "kerncurriculum-niedersachsen": 140,
  "kernlehrplan-nrw": 141,
  "lehrplaene-rp": 142,
  "lehrplan-saarland": 143,
  "lehrplan-sachsen": 144,
  "lehrplan-thueringen": 145,
  "lehrplanplus-bayern": 146,
  "rahmenlehrplan-berlin-brandenburg": 147,
  "rahmenplan-mv": 148,
  "rahmenrichtlinien-st": 149,
};

const PROVIDER_ORDER = [...RAW_CURRICULUM_PROVIDERS].sort((a, b) =>
  a.id.localeCompare(b.id),
);

function pathKey(path) {
  return path.track
    ? `${path.schoolType}|${path.grade}|${path.subject}|${path.track}`
    : `${path.schoolType}|${path.grade}|${path.subject}`;
}

function collectPaths(provider) {
  if (provider.listCatalogPaths) {
    return provider.listCatalogPaths();
  }

  const paths = [];
  for (const schoolType of provider.listSchoolTypes()) {
    for (const grade of provider.listGrades(schoolType.id)) {
      for (const subject of provider.listSubjects(schoolType.id, grade.id)) {
        const tracks = provider.listTracks(schoolType.id, grade.id, subject.id);
        if (tracks.length === 0) {
          paths.push({
            schoolType: schoolType.id,
            grade: grade.id,
            subject: subject.id,
          });
        } else {
          for (const track of tracks) {
            paths.push({
              schoolType: schoolType.id,
              grade: grade.id,
              subject: subject.id,
              track: track.id,
            });
          }
        }
      }
    }
  }
  return paths;
}

function pathHasTopics(provider, path) {
  return (
    provider.listTopics({
      schoolType: path.schoolType,
      grade: path.grade,
      subject: path.subject,
      track: path.track,
    }).length > 0
  );
}

function userId(provider, schoolType, grade) {
  return curriculumTestUserId(provider, schoolType, grade);
}

let md = `# Curriculum manifest coverage & import completion

Implements GitHub Epic **#132**. Read \`AGENTS.md\` first and work on exactly
the next unchecked phase. Multi-phase work stays on one branch and uses one
focused commit per completed phase.

## Goal

Capture **everything the official curriculum portal actually offers** for all
15 providers: every school type, grade, subject, optional track, topic and
importable source. The previous non-Bavarian manifests are five-subject MINT
seeds; their current 20/40-path counts are inventory snapshots, not targets.

A provider is complete only when its official taxonomy is captured independently
from its topic payload. Do not infer offered subjects as the Cartesian product
of a school-wide subject union and every grade. Do not infer completeness from
the paths that already have topics.

## Status

- [x] **Phase 0 / #133 — coverage infrastructure** — explicit catalog paths,
  seed/complete status, empty-catalog failure, report-only progress mode
- [ ] **Phase Import / #134 — strict selected-topic extraction** — real source
  fixtures, no landing-page fallback, provider/topic provenance, atomic batch
`;

for (let i = 0; i < PROVIDER_ORDER.length; i++) {
  const provider = PROVIDER_ORDER[i];
  const letter = String.fromCharCode(65 + i);
  const issue = ISSUE_BY_PROVIDER[provider.id];
  const mark = provider.catalogStatus === "complete" ? "x" : " ";
  md += `- [${mark}] **Phase ${letter} / #${issue} — \`${provider.id}\` (${provider.regionLabel})**\n`;
}

md += `
## Frozen scope and evidence rules

1. **All subjects, not MINT only.** Capture the complete official taxonomy for
   the active school year, including languages, humanities, arts, religion,
   vocational subjects and special-education branches where offered.
2. **Grade-scoped paths.** The source of truth is an explicit
   \`schoolType|grade|subject[|track]\` catalog. School-wide subject unions are
   display metadata only and must not create fictitious grade combinations.
3. **Two independent completeness dimensions.** \`catalogStatus=complete\`
   means the official taxonomy is exhaustive; topic coverage means every
   captured leaf has non-empty topics and a resolvable source.
4. **Official sources only.** Record school year and capture date. Never invent
   a path that the official portal does not offer.
5. **Strict extraction.** Resolve to the actual curriculum content, not a
   generic landing page. A selected topic that cannot be found must fail rather
   than fall back to unrelated page text or only its manifest label.
6. **Offline regression evidence.** Store representative real source fixtures;
   CI never fetches live ministry sites. If the official source is PDF, add a
   supported provider extraction path before marking it complete.
7. **E2E evidence.** For every captured school type × grade, navigate the
   desktop wizard and import one available topic with its dedicated test user.
8. **Profiles protected.** \`thomas\` and \`test-user-0.6.2\` stay untouched.

## Phase 0 / #133 — coverage infrastructure

- [x] Separate raw provider catalogs from the runtime content-filtered registry.
- [x] Add provider \`catalogStatus\` (\`seed\` or \`complete\`).
- [x] Let complete providers expose explicit verified catalog leaves.
- [x] Treat seed and empty catalogs as incomplete even if every known seed path
  has topics.
- [x] Keep \`--report-only\` for progress; the final CI gate requires complete
  catalogs and 100% topic/source coverage.
- [x] Bayern reference baseline: **2095/2095** live-captured paths for school
  year 2026/27; no subject×grade cross-product gaps.

## Phase Import / #134 — strict selected-topic extraction

- [x] Persist \`provider\` + \`topic_id\` and retain source-link fallback.
- [x] Confirm multi-topic card operations atomically.
- [ ] Replace synthetic label-only fixtures with saved representative source
  documents for every provider/source pattern.
- [ ] Remove the seed-provider fallback that returns the first unrelated HTML
  section or only the manifest label when a selected topic is absent.
- [ ] Resolve each manifest path to the actual content page/document rather
  than a provider-wide landing page.
- [ ] Test partial selection and two real sibling topics sharing one source;
  unselected sibling content must never ground generated cards.
- [ ] Test a valid topic ID against a non-matching document and require a hard
  extraction failure.
- [ ] Keep the precise-topic wizard notice only after every registered runtime
  provider satisfies these checks.

## Test user registry

| Region | User ID pattern | Example |
|--------|-----------------|---------|
`;

const regions = new Set();
for (const provider of PROVIDER_ORDER) {
  const land = bundeslandSlug(provider.regionLabel);
  if (regions.has(land)) continue;
  regions.add(land);
  const firstPath = collectPaths(provider)[0];
  if (firstPath) {
    md += `| ${provider.regionLabel} | \`curriculum-${land}-<schulform>-klasse-<n>\` | \`${userId(provider, firstPath.schoolType, firstPath.grade)}\` |\n`;
  }
}

md += `
## Provider-phase protocol

For every incomplete provider phase below:

1. Navigate the official portal and capture all school types, grades, offered
   subjects and tracks for the active school year.
2. Store the grade-scoped catalog independently from topics; set
   \`catalogStatus\` to \`complete\` only after this exhaustive pass.
3. Populate topics and exact content URLs for every captured leaf.
4. Add real offline fixtures and strict provider-owned extraction.
5. Regenerate this plan so the final verified path count replaces **TBD**.
6. Run the provider audit at 100%, bridge checks, and desktop E2E per school
   type × grade; record evidence and final counts in the linked issue.

Current seed counts below are diagnostic only. They must not be copied into
acceptance criteria as final totals.

`;

for (let i = 0; i < PROVIDER_ORDER.length; i++) {
  const provider = PROVIDER_ORDER[i];
  const letter = String.fromCharCode(65 + i);
  const issue = ISSUE_BY_PROVIDER[provider.id];
  const paths = collectPaths(provider);
  const covered = paths.filter((path) => pathHasTopics(provider, path)).length;

  md += `## Phase ${letter} / #${issue} — \`${provider.id}\` (${provider.regionLabel})

Provider: **${provider.label}** · catalog: \`${provider.catalogStatus}\` · current
inventory: **${paths.length} paths / ${covered} with topics**

`;

  if (provider.catalogStatus === "complete") {
    md += `- [x] Complete official taxonomy captured for the active school year.
- [x] Explicit grade-scoped catalog contains ${paths.length} verified leaves.
- [x] Every catalog leaf has topics and an exact content URL (${covered}/${paths.length}).
- [x] Provider issue records capture and verification evidence.

`;
    continue;
  }

  md += `Target path count: **TBD after complete official taxonomy capture**.
The current manifest is a non-exhaustive MINT seed.

- [ ] Capture all official school types, grades, subjects and tracks.
- [ ] Add explicit grade-scoped catalog leaves and set \`catalogStatus=complete\`.
- [ ] Populate topics and exact content URLs for every captured leaf.
- [ ] Add real offline source fixtures and strict selected-topic extraction.
- [ ] Reach complete-catalog + 100% topic/source audit.
- [ ] Complete desktop E2E per captured school type × grade.
- [ ] Update #${issue} with final counts, capture date and evidence.

`;
}

md += `## Acceptance — Epic #132 complete

- Every provider reports \`catalogStatus=complete\` and a non-empty explicit
  official catalog for the same active school year.
- Every captured leaf has non-empty topics, an exact importable source and
  strict selected-topic extraction; the global smoke exits 0 without
  \`--report-only\`.
- All provider issues contain final (not seed) path counts and E2E evidence.
- Phase Import acceptance is complete for every runtime provider.
- \`npm run format && npm run lint && npm run typecheck && npm run test && npm run build\` is green.
- No regression for \`thomas\` / \`test-user-0.6.2\`.
`;

writeFileSync(
  "docs/plans/2026-07-12-curriculum-manifest-coverage.md",
  md,
  "utf8",
);
console.log("Wrote docs/plans/2026-07-12-curriculum-manifest-coverage.md");
