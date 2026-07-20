/**
 * Validates Sachsen-Anhalt complete catalog (offline).
 * Usage: npx tsx scripts/capture-st-rahmenrichtlinien.ts
 */
import { rahmenrichtlinienStProvider } from "../src/cli/curriculum/providers/rahmenrichtlinien-st/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(rahmenrichtlinienStProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: rahmenrichtlinienStProvider
        .listSchoolTypes()
        .map((s) => s.id),
      source:
        "https://lisa.sachsen-anhalt.de/schulqualitaet/lehrplaene-rahmenrichtlinien",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
