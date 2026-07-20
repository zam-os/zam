/**
 * Validates Saarland complete catalog (offline).
 * Usage: npx tsx scripts/capture-saarland-lehrplan.ts
 */
import { lehrplanSaarlandProvider } from "../src/cli/curriculum/providers/lehrplan-saarland/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(lehrplanSaarlandProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: lehrplanSaarlandProvider.listSchoolTypes().map((s) => s.id),
      source:
        "https://www.saarland.de/mbk/DE/portale/bildungsserver/schulen-und-bildungswege/lehrplaene",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
