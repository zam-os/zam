/**
 * Validates Rheinland-Pfalz complete catalog (offline).
 * Usage: npx tsx scripts/capture-rp-lehrplaene.ts
 */
import { lehrplaeneRpProvider } from "../src/cli/curriculum/providers/lehrplaene-rp/index.js";
import { auditProviderCoverage } from "../src/cli/curriculum/topic-coverage.js";

const report = auditProviderCoverage(lehrplaeneRpProvider);
console.log(
  JSON.stringify(
    {
      success: report.catalogComplete && report.gaps === 0,
      total: report.total,
      covered: report.covered,
      gaps: report.gaps,
      catalogStatus: report.catalogStatus,
      schoolTypes: lehrplaeneRpProvider.listSchoolTypes().map((s) => s.id),
      source: "https://bildung.rlp.de/lehrplaene/",
    },
    null,
    2,
  ),
);
if (!(report.catalogComplete && report.gaps === 0)) process.exit(1);
