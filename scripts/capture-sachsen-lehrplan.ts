/**
 * Validates Sachsen complete catalog (offline).
 * Usage: npx tsx scripts/capture-sachsen-lehrplan.ts
 */
import { lehrplanSachsenProvider } from "../src/cli/curriculum/providers/lehrplan-sachsen/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(lehrplanSachsenProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: lehrplanSachsenProvider.listSchoolTypes().map((s) => s.id),
      source: "https://www.schulportal.sachsen.de/lplandb/",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
