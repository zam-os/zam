/**
 * Validates Thüringen complete catalog (offline).
 * Usage: npx tsx scripts/capture-thueringen-lehrplan.ts
 */
import { lehrplanThueringenProvider } from "../src/cli/curriculum/providers/lehrplan-thueringen/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(lehrplanThueringenProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: lehrplanThueringenProvider
        .listSchoolTypes()
        .map((s) => s.id),
      source: "https://www.schulportal-thueringen.de/lehrplaene",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
