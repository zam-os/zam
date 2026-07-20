/**
 * Validates Niedersachsen complete catalog (offline).
 * Usage: npx tsx scripts/capture-niedersachsen-kerncurriculum.ts
 */
import { kerncurriculumNiedersachsenProvider } from "../src/cli/curriculum/providers/kerncurriculum-niedersachsen/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(kerncurriculumNiedersachsenProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: kerncurriculumNiedersachsenProvider
        .listSchoolTypes()
        .map((s) => s.id),
      source: "https://cuvo.nibis.de/cuvo.php",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
