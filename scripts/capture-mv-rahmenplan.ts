/**
 * Validates Mecklenburg-Vorpommern complete catalog (offline).
 * Usage: npx tsx scripts/capture-mv-rahmenplan.ts
 */
import { rahmenplanMvProvider } from "../src/cli/curriculum/providers/rahmenplan-mv/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(rahmenplanMvProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: rahmenplanMvProvider.listSchoolTypes().map((s) => s.id),
      source:
        "https://www.bildung-mv.de/unterricht/rahmenplaene/rahmenplaene-fuer-die-allgemein-bildenden-faecher/",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
