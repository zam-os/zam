/**
 * Validates NRW complete catalog (offline).
 * Usage: npx tsx scripts/capture-nrw-kernlehrplan.ts
 */
import { kernlehrplanNrwProvider } from "../src/cli/curriculum/providers/kernlehrplan-nrw/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(kernlehrplanNrwProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: kernlehrplanNrwProvider.listSchoolTypes().map((s) => s.id),
      source: "https://lehrplannavigator.nrw.de/",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
